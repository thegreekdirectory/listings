/*
export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);
  
  const SECRET_PARAM = "access";
  const SECRET_VALUE = "granted";
  const queryPair = `${SECRET_PARAM}=${SECRET_VALUE}`;

  // 1. Check if the current request has the secret
  if (url.searchParams.get(SECRET_PARAM) !== SECRET_VALUE) {
    return new Response("Forbidden", { status: 403 });
  }

  // 2. Get the actual response (the HTML, CSS, or JS file)
  const response = await next();

  // 3. If it's NOT HTML, just send it (it already passed the 403 check above)
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) {
    return response;
  }

  // 4. If it IS HTML, rewrite all links to include the query param
  return new HTMLRewriter()
    .on("script", {
      element(el) {
        const src = el.getAttribute("src");
        if (src) el.setAttribute("src", appendQuery(src, queryPair));
      },
    })
    .on("link", {
      element(el) {
        const href = el.getAttribute("href");
        if (href) el.setAttribute("href", appendQuery(href, queryPair));
      },
    })
    // You can add 'img' or other tags here too
    .transform(response);
}

// Helper function to handle URL joining
function appendQuery(url, param) {
  if (url.startsWith("http") && !url.includes(new URL(url).hostname)) return url; // Don't tag external links
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}${param}`;
}
*/