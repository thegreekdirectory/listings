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

  // 2. Get the actual response
  const response = await next();

  // 3. If it's NOT HTML, just send it
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) {
    return response;
  }

  // Client-side script to observe dynamic DOM mutations
  const clientSideObserverScript = `
    <script>
      (function() {
        const SECRET_PARAM = "${SECRET_PARAM}";
        const SECRET_VALUE = "${SECRET_VALUE}";
        const queryPair = SECRET_PARAM + "=" + SECRET_VALUE;
        const currentHostname = window.location.hostname;

        // Replicate server-side append logic for the browser
        function appendQuery(targetUrl) {
          if (!targetUrl || 
              targetUrl.startsWith("#") || 
              targetUrl.startsWith("mailto:") || 
              targetUrl.startsWith("tel:") || 
              targetUrl.startsWith("javascript:")) {
            return targetUrl;
          }

          if (targetUrl.startsWith("http://") || targetUrl.startsWith("https://")) {
            try {
              const parsedUrl = new URL(targetUrl);
              if (parsedUrl.hostname !== currentHostname) return targetUrl;
            } catch (error) {
              return targetUrl;
            }
          }

          if (targetUrl.includes(queryPair)) return targetUrl;

          const separator = targetUrl.includes("?") ? "&" : "?";
          return targetUrl + separator + queryPair;
        }

        // Apply to a specific node and all its children
        function processNode(node) {
          if (node.tagName === 'A' || node.tagName === 'LINK') {
            const href = node.getAttribute('href');
            if (href) node.setAttribute('href', appendQuery(href));
          } else if (node.tagName === 'SCRIPT') {
            const src = node.getAttribute('src');
            if (src) node.setAttribute('src', appendQuery(src));
          }
          
          // Check children if a container node (like a <div>) was inserted
          if (node.querySelectorAll) {
            node.querySelectorAll('a[href], link[href], script[src]').forEach(child => {
              if (child.tagName === 'A' || child.tagName === 'LINK') {
                child.setAttribute('href', appendQuery(child.getAttribute('href')));
              } else if (child.tagName === 'SCRIPT') {
                child.setAttribute('src', appendQuery(child.getAttribute('src')));
              }
            });
          }
        }

        // Watch the DOM for newly added elements
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === 1) { // Node.ELEMENT_NODE
                processNode(node);
              }
            });
          });
        });

        // Start observing immediately
        observer.observe(document.documentElement, { childList: true, subtree: true });
      })();
    </script>
  `;

  // 4. If it IS HTML, rewrite static links AND inject the mutation observer
  return new HTMLRewriter()
    .on("head", {
      element(el) {
        // Inject the observer script into the head
        el.append(clientSideObserverScript, { html: true });
      }
    })
    .on("script", {
      element(el) {
        const src = el.getAttribute("src");
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

// Helper function for server-side static URL rewriting
function appendQuery(targetUrl, paramPair, currentHostname) {
  if (
    targetUrl.startsWith("#") || 
    targetUrl.startsWith("mailto:") || 
    targetUrl.startsWith("tel:") || 
    targetUrl.startsWith("javascript:")
  ) {
    return targetUrl;
  }

  if (targetUrl.startsWith("http://") || targetUrl.startsWith("https://")) {
    try {
      const parsedUrl = new URL(targetUrl);
      if (parsedUrl.hostname !== currentHostname) return targetUrl;
    } catch (error) {
      return targetUrl; 
    }
  }

  if (targetUrl.includes(paramPair)) return targetUrl;

  const separator = targetUrl.includes("?") ? "&" : "?";
  return `${targetUrl}${separator}${paramPair}`;
}
