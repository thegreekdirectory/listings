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
        // Pass the current hostname to properly identify external vs internal links
        if (src) el.setAttribute("src", appendQuery(src, queryPair, url.hostname));
      },
    })
    .on("link", {
      element(el) {
        const href = el.getAttribute("href");
        if (href) el.setAttribute("href", appendQuery(href, queryPair, url.hostname));
      },
    })
    .on("a", {
      element(el) {
        const href = el.getAttribute("href");
        if (href) el.setAttribute("href", appendQuery(href, queryPair, url.hostname));
      },
    })
    .transform(response);
}

// Helper function to handle URL joining safely
function appendQuery(targetUrl, paramPair, currentHostname) {
  // 1. Skip non-navigational or non-HTTP links (anchors, emails, phone numbers, JS)
  if (
    targetUrl.startsWith("#") || 
    targetUrl.startsWith("mailto:") || 
    targetUrl.startsWith("tel:") || 
    targetUrl.startsWith("javascript:")
  ) {
    return targetUrl;
  }

  // 2. Check if it's an absolute URL (starts with http/https)
  if (targetUrl.startsWith("http://") || targetUrl.startsWith("https://")) {
    try {
      const parsedUrl = new URL(targetUrl);
      // If the hostnames don't match, it's external, so return it untouched
      if (parsedUrl.hostname !== currentHostname) return targetUrl;
    } catch (error) {
      // If URL parsing fails for some reason, play it safe and don't modify
      return targetUrl; 
    }
  }

  // 3. Prevent duplicate appending if the param is somehow already there
  if (targetUrl.includes(paramPair)) {
    return targetUrl;
  }

  // 4. Append the query string for internal links (both absolute and relative)
  const separator = targetUrl.includes("?") ? "&" : "?";
  return `${targetUrl}${separator}${paramPair}`;
}
