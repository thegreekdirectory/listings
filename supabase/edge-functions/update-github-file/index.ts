import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get GitHub token from environment variable
    const githubToken = Deno.env.get('GITHUB_TOKEN')
    
    if (!githubToken) {
      throw new Error('GITHUB_TOKEN not configured')
    }

    // Parse request body
    const { owner, repo, path, content, message } = await req.json()

    if (!owner || !repo || !path || !content || !message) {
      throw new Error('Missing required parameters')
    }

    // Get current file SHA
    const fileInfoResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
      {
        headers: {
          'Authorization': `token ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    )

    if (!fileInfoResponse.ok) {
      throw new Error(`Failed to fetch file info: ${fileInfoResponse.status}`)
    }

    const fileInfo = await fileInfoResponse.json()
    const currentSha = fileInfo.sha

    // Encode content to base64
    const base64Content = btoa(unescape(encodeURIComponent(content)))

    // Update file
    const updateResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `token ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          content: base64Content,
          sha: currentSha,
        }),
      }
    )

    if (!updateResponse.ok) {
      const errorData = await updateResponse.json()
      throw new Error(errorData.message || 'GitHub update failed')
    }

    const result = await updateResponse.json()

    return new Response(
      JSON.stringify({ success: true, data: result }),
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
