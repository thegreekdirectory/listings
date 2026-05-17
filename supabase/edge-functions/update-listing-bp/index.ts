// supabase/edge-functions/update-listing-bp/index.ts
// Business Portal — listing & owner contact update endpoint.
// Validates the caller's JWT, verifies ownership via business_owners,
// then writes with the service role key so RLS never blocks a legitimate owner.
//
// Copyright (C) The Greek Directory, 2025-present. All rights reserved.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Fields a business owner is allowed to change on their own listing.
// Tier, visible, slug, is_claimed, etc. are intentionally excluded.
const OWNER_ALLOWED_LISTING_FIELDS = new Set([
  'tagline', 'description',
  'subcategories', 'primary_subcategory',
  'pricing', 'coming_soon',
  'address', 'city', 'state', 'zip_code', 'country', 'timezone',
  'phone', 'email', 'website',
  'logo', 'photos', 'video',
  'hours', 'hours_label_custom', 'hours_disclaimer_custom',
  'hours_updated_at', 'hours_updated_by',
  'social_media', 'reviews',
  'additional_info', 'custom_ctas',
  'updated_by_role',
])

// Fields a business owner is allowed to change on their own business_owners row.
const OWNER_ALLOWED_OWNER_FIELDS = new Set([
  'owner_email', 'owner_phone',
  'name_title_visible', 'email_visible', 'phone_visible',
  'full_name', 'title', 'from_greece',
])

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

serve(async (req: Request) => {
  // ── CORS preflight ─────────────────────────────────────────────
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // ── Auth: validate JWT ──────────────────────────────────────
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ success: false, error: 'Missing Authorization header' }, 401)

    const supabaseUrl  = Deno.env.get('SUPABASE_URL')!
    const anonKey      = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceKey   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Use anon client with caller's JWT to identify the user
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: authError } = await userClient.auth.getUser()
    if (authError || !user?.email) {
      return json({ success: false, error: 'Unauthorized — invalid or expired session' }, 401)
    }

    const callerEmail = user.email.toLowerCase()

    // ── Parse request ───────────────────────────────────────────
    const body = await req.json()
    const { action, listing_id, updates } = body as {
      action:     'update-listing' | 'update-owner'
      listing_id: string
      updates:    Record<string, unknown>
    }

    if (!action || !listing_id || !updates) {
      return json({ success: false, error: '`action`, `listing_id`, and `updates` are required' }, 400)
    }

    // ── Service-role client (bypasses RLS after we verify ownership) ──
    const admin = createClient(supabaseUrl, serviceKey)

    // ── Verify ownership ────────────────────────────────────────
    // Look up the business_owners row for this listing.
    // Ownership is established when owner_email matches the caller's auth email.
    // We also accept rows where owner_email is null (orphaned / first-time repair).
    const { data: ownerRow, error: ownerErr } = await admin
      .from('business_owners')
      .select('listing_id, owner_email, owner_user_id')
      .eq('listing_id', listing_id)
      .maybeSingle()

    if (ownerErr || !ownerRow) {
      return json({ success: false, error: 'Listing not found or no owner record' }, 403)
    }

    const storedEmail = (ownerRow.owner_email ?? '').toLowerCase()
    if (storedEmail && storedEmail !== callerEmail) {
      // Row exists with a different email — access denied
      return json({ success: false, error: 'Access denied' }, 403)
    }

    // ── Always sync owner_email to current auth email (repairs drift / null) ──
    if (storedEmail !== callerEmail) {
      await admin
        .from('business_owners')
        .update({ owner_email: user.email })
        .eq('listing_id', listing_id)
    }

    // ────────────────────────────────────────────────────────────
    // ACTION: update-listing
    // ────────────────────────────────────────────────────────────
    if (action === 'update-listing') {
      // Filter to only allowed fields
      const filtered: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(updates)) {
        if (OWNER_ALLOWED_LISTING_FIELDS.has(k)) filtered[k] = v
      }
      if (Object.keys(filtered).length === 0) {
        return json({ success: false, error: 'No valid fields to update' }, 400)
      }

      const { data: updatedListing, error: updateErr } = await admin
        .from('listings')
        .update(filtered)
        .eq('id', listing_id)
        .select()
        .single()

      if (updateErr) {
        console.error('Listing update error:', updateErr)
        return json({ success: false, error: updateErr.message }, 500)
      }

      return json({ success: true, data: updatedListing })
    }

    // ────────────────────────────────────────────────────────────
    // ACTION: update-owner
    // ────────────────────────────────────────────────────────────
    if (action === 'update-owner') {
      const filtered: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(updates)) {
        if (OWNER_ALLOWED_OWNER_FIELDS.has(k)) filtered[k] = v
      }
      // Always enforce owner_email = caller's auth email
      filtered.owner_email = user.email

      const { data: updatedOwner, error: ownerUpdateErr } = await admin
        .from('business_owners')
        .update(filtered)
        .eq('listing_id', listing_id)
        .select()

      if (ownerUpdateErr) {
        console.error('Owner update error:', ownerUpdateErr)
        return json({ success: false, error: ownerUpdateErr.message }, 500)
      }

      return json({ success: true, data: updatedOwner })
    }

    return json({ success: false, error: `Unknown action: ${action}` }, 400)

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('update-listing-bp error:', message)
    return json({ success: false, error: message }, 500)
  }
})
