// ============================================
// SEND MAGIC LINK - Edge Function
// Path: supabase/functions/send-magic-link/index.ts
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, redirectTo } = await req.json()
    
    if (!email) {
      throw new Error('Email is required')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
      options: {
        redirectTo: redirectTo || 'https://thegreekdirectory.org/business.html'
      }
    })

    if (error) throw error

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Magic link sent successfully',
        link: data.properties?.action_link // For testing only
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})

// ============================================
// SEND PASSWORD RESET - Edge Function
// Path: supabase/functions/send-password-reset/index.ts
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, redirectTo } = await req.json()
    
    if (!email) {
      throw new Error('Email is required')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectTo || 'https://thegreekdirectory.org/business.html?reset=true'
    })

    if (error) throw error

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Password reset email sent successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})

// ============================================
// UPDATE LISTING - Edge Function
// Path: supabase/functions/update-listing/index.ts
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { listingId, updates, regeneratePage } = await req.json()
    
    if (!listingId) {
      throw new Error('Listing ID is required')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const githubToken = Deno.env.get('GITHUB_TOKEN')
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Update listing in Supabase
    const { data, error } = await supabase
      .from('listings')
      .update(updates)
      .eq('id', listingId)
      .select()
      .single()

    if (error) throw error

    let pageGenerated = false

    // Regenerate listing page if requested and GitHub token is available
    if (regeneratePage && githubToken && data) {
      try {
        // Fetch template
        const templateResponse = await fetch(
          'https://raw.githubusercontent.com/thegreekdirectory/listings/main/listing-template.html'
        )
        
        if (!templateResponse.ok) {
          throw new Error('Failed to fetch template')
        }
        
        let template = await templateResponse.text()
        
        // Replace template variables (simplified version)
        const listingUrl = `https://thegreekdirectory.org/listing/${data.slug}.html`
        
        template = template.replace(/{{BUSINESS_NAME}}/g, data.business_name)
        template = template.replace(/{{TAGLINE}}/g, data.tagline || '')
        template = template.replace(/{{LISTING_URL}}/g, listingUrl)
        // ... (add more replacements as needed)
        
        // Save to GitHub
        const filePath = `listing/${data.slug}.html`
        
        // Get current file SHA
        const fileInfoResponse = await fetch(
          `https://api.github.com/repos/thegreekdirectory/listings/contents/${filePath}`,
          {
            headers: {
              'Authorization': `token ${githubToken}`,
              'Accept': 'application/vnd.github.v3+json'
            }
          }
        )
        
        let currentSha = null
        if (fileInfoResponse.ok) {
          const fileInfo = await fileInfoResponse.json()
          currentSha = fileInfo.sha
        }
        
        // Upload to GitHub
        const base64Content = btoa(unescape(encodeURIComponent(template)))
        
        const uploadBody = {
          message: `Update listing page for ${data.business_name}`,
          content: base64Content
        }
        
        if (currentSha) {
          uploadBody.sha = currentSha
        }
        
        const uploadResponse = await fetch(
          `https://api.github.com/repos/thegreekdirectory/listings/contents/${filePath}`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `token ${githubToken}`,
              'Accept': 'application/vnd.github.v3+json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(uploadBody)
          }
        )
        
        pageGenerated = uploadResponse.ok
      } catch (pageError) {
        console.error('Page generation error:', pageError)
        // Continue even if page generation fails
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data,
        pageGenerated,
        message: 'Listing updated successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
