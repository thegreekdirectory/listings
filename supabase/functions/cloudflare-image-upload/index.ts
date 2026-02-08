import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const apiKey = Deno.env.get("CLDFLR_STRIMG_KEY")
    const accountId = Deno.env.get("CLDFLR_ACCOUNT_ID")

    if (!apiKey || !accountId) {
      throw new Error("Cloudflare Images credentials are not configured")
    }

    const formData = await req.formData()
    const file = formData.get("file")

    if (!(file instanceof File)) {
      throw new Error("Missing file upload")
    }

    const cfFormData = new FormData()
    cfFormData.append("file", file, file.name)

    const uploadResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: cfFormData,
      },
    )

    const responseData = await uploadResponse.json()

    if (!uploadResponse.ok || !responseData?.success) {
      throw new Error(responseData?.errors?.[0]?.message || "Cloudflare upload failed")
    }

    const result = responseData.result || {}
    const url = Array.isArray(result.variants) ? result.variants[0] : null

    return new Response(
      JSON.stringify({
        success: true,
        id: result.id,
        url,
        variants: result.variants || [],
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      },
    )
  }
})
