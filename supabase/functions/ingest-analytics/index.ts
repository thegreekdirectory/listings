import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

type JsonRecord = Record<string, unknown>

type RawEvent = {
  event_name: string
  timestamp: string
  session_id: string
  listing_id?: string | null
  props?: JsonRecord
}

type NormalizedUtm = {
  source: string | null
  medium: string | null
  campaign: string | null
  term: string | null
  content: string | null
}

type NormalizedSource = {
  source: string
  source_other_raw: string | null
}

type IngestResult = {
  index: number
  success: boolean
  event_name?: string
  error?: string
}

const EVENT_KEYS = ["event_name", "timestamp", "session_id", "listing_id", "props"] as const
const REQUEST_KEYS = ["events"] as const
const LEGACY_KEYS = ["event_name", "timestamp", "session_id", "listing_id", "props", "utm", "source"] as const
const KNOWN_SOURCES = new Set([
  "direct",
  "organic",
  "paid",
  "social",
  "email",
  "referral",
  "push",
  "sms",
  "internal",
])

function isPlainObject(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function assertExactKeys(
  value: JsonRecord,
  allowedKeys: readonly string[],
  context: string,
): void {
  const keys = Object.keys(value)
  const unexpected = keys.filter((key) => !allowedKeys.includes(key))
  if (unexpected.length > 0) {
    throw new Error(`${context} contains unknown field(s): ${unexpected.join(", ")}`)
  }
}

function normalizeString(value: unknown): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function normalizeIsoTimestamp(value: unknown, fieldName: string): string {
  if (typeof value !== "string") {
    throw new Error(`${fieldName} must be an ISO-8601 string`)
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`${fieldName} must be a valid timestamp`)
  }

  return parsed.toISOString()
}

function normalizeUtm(input: unknown): NormalizedUtm {
  if (input === undefined || input === null) {
    return { source: null, medium: null, campaign: null, term: null, content: null }
  }

  if (!isPlainObject(input)) {
    throw new Error("utm must be an object when provided")
  }

  const source = normalizeString(input.utm_source ?? input.source)
  const medium = normalizeString(input.utm_medium ?? input.medium)
  const campaign = normalizeString(input.utm_campaign ?? input.campaign)
  const term = normalizeString(input.utm_term ?? input.term)
  const content = normalizeString(input.utm_content ?? input.content)

  return {
    source,
    medium,
    campaign,
    term,
    content,
  }
}

function classifySource(rawSource: string | null): NormalizedSource {
  if (!rawSource) {
    return {
      source: "direct",
      source_other_raw: null,
    }
  }

  const normalized = rawSource.trim().toLowerCase()
  if (KNOWN_SOURCES.has(normalized)) {
    return {
      source: normalized,
      source_other_raw: null,
    }
  }

  return {
    source: "other",
    source_other_raw: normalized,
  }
}

function validateEvent(raw: unknown, index: number): RawEvent {
  if (!isPlainObject(raw)) {
    throw new Error(`events[${index}] must be an object`)
  }

  assertExactKeys(raw, EVENT_KEYS, `events[${index}]`)

  const eventName = normalizeString(raw.event_name)
  if (!eventName) {
    throw new Error(`events[${index}].event_name is required`)
  }

  const sessionId = normalizeString(raw.session_id)
  if (!sessionId) {
    throw new Error(`events[${index}].session_id is required`)
  }

  const listingId = raw.listing_id === undefined ? undefined : normalizeString(raw.listing_id)
  if (raw.listing_id !== undefined && raw.listing_id !== null && !listingId) {
    throw new Error(`events[${index}].listing_id must be a non-empty string when provided`)
  }

  const props = raw.props
  if (props !== undefined && !isPlainObject(props)) {
    throw new Error(`events[${index}].props must be an object when provided`)
  }

  return {
    event_name: eventName,
    timestamp: normalizeIsoTimestamp(raw.timestamp, `events[${index}].timestamp`),
    session_id: sessionId,
    listing_id: listingId ?? null,
    props: props,
  }
}

function coerceLegacyPayload(rawBody: JsonRecord): { events: RawEvent[]; utm?: unknown; source?: unknown } {
  assertExactKeys(rawBody, LEGACY_KEYS, "body")
  return {
    events: [validateEvent(rawBody, 0)],
    utm: rawBody.utm,
    source: rawBody.source,
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Method not allowed" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 405,
      },
    )
  }

  try {
    const rawBody = await req.json()
    if (!isPlainObject(rawBody)) {
      throw new Error("Request body must be an object")
    }

    let events: RawEvent[] = []
    let rawUtm: unknown
    let rawSource: unknown

    if (Array.isArray(rawBody.events)) {
      assertExactKeys(rawBody, REQUEST_KEYS, "body")
      if (rawBody.events.length === 0) {
        throw new Error("events must contain at least 1 event")
      }

      events = rawBody.events.map((event, index) => validateEvent(event, index))
    } else {
      // Legacy path: keep single-event insert behavior available while batch clients roll out.
      const legacy = coerceLegacyPayload(rawBody)
      events = legacy.events
      rawUtm = legacy.utm
      rawSource = legacy.source
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase environment variables are not configured")
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const results: IngestResult[] = []

    for (let index = 0; index < events.length; index += 1) {
      const event = events[index]
      try {
        const serverTimestamp = new Date().toISOString()
        const eventUtm = normalizeUtm(event.props?.utm ?? rawUtm)
        const sourceFromEvent = normalizeString(event.props?.source)
        const sourceFromPayload = normalizeString(rawSource)
        const sourceCandidate = sourceFromEvent ?? sourceFromPayload ?? eventUtm.source
        const normalizedSource = classifySource(sourceCandidate)

        const sessionPayload = {
          session_id: event.session_id,
          first_seen_at: serverTimestamp,
          last_seen_at: serverTimestamp,
          utm_source: eventUtm.source,
          utm_medium: eventUtm.medium,
          utm_campaign: eventUtm.campaign,
          utm_term: eventUtm.term,
          utm_content: eventUtm.content,
          source: normalizedSource.source,
          source_other_raw: normalizedSource.source_other_raw,
          metadata: {
            last_event_name: event.event_name,
          },
        }

        const { error: sessionError } = await supabase
          .from("analytics_sessions")
          .upsert(sessionPayload, { onConflict: "session_id" })

        if (sessionError) {
          throw new Error(`session upsert failed: ${sessionError.message}`)
        }

        const eventPayload = {
          event_name: event.event_name,
          event_timestamp: event.timestamp,
          server_timestamp: serverTimestamp,
          session_id: event.session_id,
          listing_id: event.listing_id ?? null,
          props: event.props ?? {},
          utm: eventUtm,
          source: normalizedSource.source,
          source_other_raw: normalizedSource.source_other_raw,
        }

        const { error: eventError } = await supabase
          .from("analytics_events")
          .insert(eventPayload)

        if (eventError) {
          throw new Error(`event insert failed: ${eventError.message}`)
        }

        results.push({
          index,
          success: true,
          event_name: event.event_name,
        })
      } catch (eventError) {
        results.push({
          index,
          success: false,
          event_name: event.event_name,
          error: eventError instanceof Error ? eventError.message : "Unknown ingest error",
        })
      }
    }

    const hasFailures = results.some((result) => !result.success)

    return new Response(
      JSON.stringify({
        success: !hasFailures,
        results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: hasFailures ? 207 : 200,
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      },
    )
  }
})
