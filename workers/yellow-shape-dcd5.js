export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return new Response("Invalid content type", { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const imageId = String(formData.get("id") || "").trim();

    if (!env.CF_ACCOUNT_ID || !env.CF_API_TOKEN) {
      return new Response(
        JSON.stringify({
          success: false,
          errors: [{ message: "Worker is missing CF_ACCOUNT_ID or CF_API_TOKEN." }],
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    if (!file) {
      return new Response("No file provided", { status: 400 });
    }

    const cfForm = new FormData();
    cfForm.append("file", file);
    if (imageId) {
      cfForm.append("id", imageId);
    }

    const cfResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/images/v1`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.CF_API_TOKEN}`,
        },
        body: cfForm,
      }
    );

    const responseText = await cfResponse.text();
    let payload;

    try {
      payload = JSON.parse(responseText);
    } catch (error) {
      payload = {
        success: false,
        errors: [{ message: responseText || "Cloudflare returned invalid JSON." }],
        raw: responseText,
      };
    }

    if (payload?.result?.id) {
      payload.result.deliveryURL = `https://images.thegreekdirectory.org/cdn-cgi/imagedelivery/rheV007PEt08HUYXNuJLnQ/${encodeURIComponent(payload.result.id)}/public`;
    }

    return new Response(JSON.stringify(payload), {
      status: cfResponse.status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  },
};
