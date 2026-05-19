import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-github-token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const GITHUB_REPO = 'thegreekdirectory/listings'

function toError(err: unknown): Error {
  if (err instanceof Error) return err
  if (typeof err === 'object' && err !== null && 'message' in err) {
    return new Error((err as { message: string }).message)
  }
  return new Error(JSON.stringify(err))
}

async function validateGithubToken(token: string): Promise<boolean> {
  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}`, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    })
    return res.ok
  } catch {
    return false
  }
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // ── Auth: validate GitHub PAT sent in header ──────────────────────────
    const githubToken = req.headers.get('x-github-token')
    if (!githubToken) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing GitHub token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const isValid = await validateGithubToken(githubToken)
    if (!isValid) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid GitHub token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // ── Parse request body ────────────────────────────────────────────────
    const body = await req.json()
    const { action, payload } = body

    if (!action) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // ── Supabase service role client (server-side only, never exposed) ────
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    let result: unknown

    switch (action) {

      // ── LISTINGS ───────────────────────────────────────────────────────
      case 'listings:list': {
        const { data, error } = await supabase
          .from('listings')
          .select('*, owner:business_owners(*)')
          .order('created_at', { ascending: false })
        if (error) throw toError(error)
        result = data
        break
      }

      case 'listings:insert': {
        const { data, error } = await supabase
          .from('listings')
          .insert(payload)
          .select()
          .single()
        if (error) throw toError(error)

        const { error: summaryError } = await supabase
          .from('listing_analytics_summary')
          .insert({ listing_id: data.id })
        if (summaryError) throw toError(summaryError)

        result = data
        break
      }

      case 'listings:update': {
        const { id, ...updates } = payload
        if (!id) throw new Error('listings:update requires id')
        const { data, error } = await supabase
          .from('listings')
          .update(updates)
          .eq('id', id)
          .select()
          .single()
        if (error) throw toError(error)
        result = data
        break
      }

      case 'listings:delete': {
        const { id } = payload
        if (!id) throw new Error('listings:delete requires id')
        const { error } = await supabase
          .from('listings')
          .delete()
          .eq('id', id)
        if (error) throw toError(error)
        result = { deleted: true, id }
        break
      }

      // ── BUSINESS OWNERS ────────────────────────────────────────────────
      case 'owners:list': {
        const { listing_id } = payload || {}
        let query = supabase.from('business_owners').select('*')
        if (listing_id) query = query.eq('listing_id', listing_id)
        const { data, error } = await query
        if (error) throw toError(error)
        result = data
        break
      }

      case 'owners:upsert': {
        const { listing_id } = payload
        if (!listing_id) throw new Error('owners:upsert requires listing_id')
        const { data: existing } = await supabase
          .from('business_owners')
          .select('id')
          .eq('listing_id', listing_id)
          .maybeSingle()
        let opResult
        if (existing) {
          const { data, error } = await supabase
            .from('business_owners')
            .update(payload)
            .eq('listing_id', listing_id)
            .select()
            .single()
          if (error) throw toError(error)
          opResult = data
        } else {
          const { data, error } = await supabase
            .from('business_owners')
            .insert(payload)
            .select()
            .single()
          if (error) throw toError(error)
          opResult = data
        }
        result = opResult
        break
      }

      case 'owners:delete': {
        const { listing_id } = payload
        if (!listing_id) throw new Error('owners:delete requires listing_id')
        const { error } = await supabase
          .from('business_owners')
          .delete()
          .eq('listing_id', listing_id)
        if (error) throw toError(error)
        result = { deleted: true, listing_id }
        break
      }

      // ── LISTING REQUESTS ───────────────────────────────────────────────
      case 'requests:list': {
        const { data, error } = await supabase
          .from('listing_requests')
          .select('*')
          .order('created_at', { ascending: false })
        if (error) throw toError(error)
        result = data
        break
      }

      case 'requests:update': {
        const { id, ...updates } = payload
        if (!id) throw new Error('requests:update requires id')
        const { data, error } = await supabase
          .from('listing_requests')
          .update(updates)
          .eq('id', id)
          .select()
          .single()
        if (error) throw toError(error)
        result = data
        break
      }

      case 'requests:delete': {
        const { id } = payload
        if (!id) throw new Error('requests:delete requires id')
        const { error } = await supabase
          .from('listing_requests')
          .delete()
          .eq('id', id)
        if (error) throw toError(error)
        result = { deleted: true, id }
        break
      }

      // ── ANALYTICS ──────────────────────────────────────────────────────
      case 'analytics:get': {
        const { listing_id } = payload
        if (!listing_id) throw new Error('analytics:get requires listing_id')
        const { data, error } = await supabase
          .from('listing_analytics_summary')
          .select('*')
          .eq('listing_id', listing_id)
          .maybeSingle()
        if (error) throw toError(error)
        result = data
        break
      }

      case 'analytics:list': {
        const { data, error } = await supabase
          .from('listing_analytics_summary')
          .select('*')
          .order('views_all', { ascending: false })
        if (error) throw toError(error)
        result = data
        break
      }

      // ── SUBCATEGORIES ──────────────────────────────────────────────────
      case 'subcategories:list': {
        const { data, error } = await supabase
          .from('category_subcategories')
          .select('*')
          .order('category')
          .order('name')
        if (error) throw toError(error)
        result = data
        break
      }

      case 'subcategories:insert': {
        const { data, error } = await supabase
          .from('category_subcategories')
          .insert(payload)
          .select()
          .single()
        if (error) throw toError(error)
        result = data
        break
      }

      case 'subcategories:update': {
        const { id, ...updates } = payload
        if (!id) throw new Error('subcategories:update requires id')
        const { data, error } = await supabase
          .from('category_subcategories')
          .update(updates)
          .eq('id', id)
          .select()
          .single()
        if (error) throw toError(error)
        result = data
        break
      }

      case 'subcategories:delete': {
        const { id } = payload
        if (!id) throw new Error('subcategories:delete requires id')
        const { error } = await supabase
          .from('category_subcategories')
          .delete()
          .eq('id', id)
        if (error) throw toError(error)
        result = { deleted: true, id }
        break
      }

      // ── RAW SQL (admin only, use sparingly) ────────────────────────────
      case 'sql:select': {
        const { query } = payload
        if (!query || !query.trim().toUpperCase().startsWith('SELECT')) {
          throw new Error('sql:select only allows SELECT statements')
        }
        const { data, error } = await supabase.rpc('exec_admin_select', { query_text: query })
        if (error) throw toError(error)
        result = data
        break
      }

      // ── SHORTLINKS ─────────────────────────────────────────────────────
      case 'shortlinks:get': {
        const listingReferId = payload?.listing_id || payload?.listing_refer_id
        if (!listingReferId) {
          return new Response(
            JSON.stringify({ success: false, error: 'listing_id is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
          )
        }
        const { data, error } = await supabase
          .from('shortlinks')
          .select('*')
          .eq('listing_refer_id', listingReferId)
        if (error) throw toError(error)
        result = data || []
        break
      }

      case 'shortlinks:check': {
        const { path } = payload
        if (!path) throw new Error('shortlinks:check requires path')
        const { data, error } = await supabase
          .from('shortlinks')
          .select('path')
          .eq('path', path)
          .limit(1)
        if (error) throw toError(error)
        result = !!(data && data.length)
        break
      }

      case 'shortlinks:insert': {
        const { title, path, redirect_to, listing_refer_id, listing_custom } = payload
        if (!path || !listing_refer_id || typeof listing_custom !== 'boolean') {
          throw new Error('shortlinks:insert requires path, listing_refer_id, listing_custom')
        }

        const { data: existingRows, error: existingError } = await supabase
          .from('shortlinks')
          .select('id')
          .eq('listing_refer_id', listing_refer_id)
          .eq('listing_custom', listing_custom)
          .limit(1)
        if (existingError) throw toError(existingError)
        if (existingRows && existingRows.length) {
          return new Response(
            JSON.stringify({
              success: false,
              error: listing_custom
                ? 'Custom shortlink already exists for this listing'
                : 'System shortlink already exists for this listing',
            }),
            { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
          )
        }

        const { data, error } = await supabase
          .from('shortlinks')
          .insert({ title, path, redirect_to, listing_refer_id, listing_custom })
          .select()
          .single()
        if (error) {
          if ((error as { code?: string }).code === '23505') {
            return new Response(
              JSON.stringify({ success: false, error: 'path_conflict', code: 23505 }),
              { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
            )
          }
          throw toError(error)
        }
        result = data
        break
      }

      case 'shortlinks:delete': {
        const { listing_refer_id } = payload
        if (!listing_refer_id) {
          return new Response(
            JSON.stringify({ success: false, error: 'listing_refer_id is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
          )
        }
        const { error } = await supabase
          .from('shortlinks')
          .delete()
          .eq('listing_refer_id', listing_refer_id)
        if (error) throw toError(error)
        result = true
        break
      }

      default:
        return new Response(
          JSON.stringify({ success: false, error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )

  } catch (err) {
    const message = err instanceof Error ? err.message : JSON.stringify(err)
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
