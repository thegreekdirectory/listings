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
  const contentType = response.headers.get("content-type") || "";

  // 3. Process External CSS files
  if (contentType.includes("text/css")) {
    const originalCSS = await response.text();
    const modifiedCSS = rewriteCSSURLs(originalCSS, queryPair, url.hostname);
    
    // Create new headers to remove content-length since the body size changed
    const newHeaders = new Headers(response.headers);
    newHeaders.delete("content-length");
    
    return new Response(modifiedCSS, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders
    });
  }

  // 4. If it's NOT HTML, just send it (e.g., images, fonts, raw data)
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

        function appendQuery(targetUrl) {
          if (!targetUrl || 
              targetUrl.startsWith("#") || 
              targetUrl.startsWith("mailto:") || 
              targetUrl.startsWith("tel:") || 
              targetUrl.startsWith("javascript:") ||
              targetUrl.startsWith("data:") || 
              targetUrl.startsWith("blob:")) {
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

        function appendQueryToSrcset(srcsetString) {
          if (!srcsetString) return srcsetString;
          return srcsetString.split(',').map(part => {
            const trimmed = part.trim();
            if (!trimmed) return part;
            const parts = trimmed.split(/\\s+/);
            parts[0] = appendQuery(parts[0]);
            return parts.join(' ');
          }).join(', ');
        }

        function rewriteCSSURLsClient(cssString) {
          if (!cssString) return cssString;
          return cssString.replace(/url\\((['"]?)(.*?)\\1\\)/ig, function(match, quote, targetUrl) {
             return "url(" + quote + appendQuery(targetUrl) + quote + ")";
          });
        }

        function processNode(node) {
          // Handle standard attributes
          if (node.tagName === 'A' || node.tagName === 'LINK') {
            const href = node.getAttribute('href');
            if (href) node.setAttribute('href', appendQuery(href));
          } else if (node.tagName === 'SCRIPT' || node.tagName === 'IMG' || node.tagName === 'SOURCE') {
            const src = node.getAttribute('src');
            if (src) node.setAttribute('src', appendQuery(src));
            
            if (node.tagName === 'IMG' || node.tagName === 'SOURCE') {
              const srcset = node.getAttribute('srcset');
              if (srcset) node.setAttribute('srcset', appendQueryToSrcset(srcset));
            }
          }

          // Handle inline styles and style tags
          if (node.hasAttribute && node.hasAttribute('style')) {
            node.setAttribute('style', rewriteCSSURLsClient(node.getAttribute('style')));
          }
          if (node.tagName === 'STYLE') {
            node.textContent = rewriteCSSURLsClient(node.textContent);
          }
          
          // Check dynamically inserted container children
          if (node.querySelectorAll) {
            const selectors = 'a[href], link[href], script[src], img[src], img[srcset], source[src], source[srcset], [style], style';
            node.querySelectorAll(selectors).forEach(child => {
              if (child.tagName === 'A' || child.tagName === 'LINK') {
                child.setAttribute('href', appendQuery(child.getAttribute('href')));
              } else if (child.tagName === 'SCRIPT' || child.tagName === 'IMG' || child.tagName === 'SOURCE') {
                const src = child.getAttribute('src');
                if (src) child.setAttribute('src', appendQuery(src));
                
                if (child.tagName === 'IMG' || child.tagName === 'SOURCE') {
                  const srcset = child.getAttribute('srcset');
                  if (srcset) child.setAttribute('srcset', appendQueryToSrcset(srcset));
                }
              }
              
              if (child.hasAttribute && child.hasAttribute('style')) {
                child.setAttribute('style', rewriteCSSURLsClient(child.getAttribute('style')));
              }
              if (child.tagName === 'STYLE') {
                child.textContent = rewriteCSSURLsClient(child.textContent);
              }
            });
          }
        }

        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === 1) processNode(node);
            });
          });
        });

        observer.observe(document.documentElement, { childList: true, subtree: true });
      })();
    </script>
  `;

  // 5. Transform HTML tags
  return new HTMLRewriter()
    .on("head", {
      element(el) { el.append(clientSideObserverScript, { html: true }); }
    })
    .on("script", {
      element(el) {
        const src = el.getAttribute("src");
        if (src) el.setAttribute("src", appendQuery(src, queryPair, url.hostname));
      }
    })
    .on("link, a", {
      element(el) {
        const href = el.getAttribute("href");
        if (href) el.setAttribute("href", appendQuery(href, queryPair, url.hostname));
      }
    })
    .on("img, source", {
      element(el) {
        const src = el.getAttribute("src");
        if (src) el.setAttribute("src", appendQuery(src, queryPair, url.hostname));
        
        const srcset = el.getAttribute("srcset");
        if (srcset) el.setAttribute("srcset", appendQueryToSrcset(srcset, queryPair, url.hostname));
      }
    })
    // Rewrite inline style attributes (e.g. style="background-image: url(...)")
    .on("[style]", {
      element(el) {
        const style = el.getAttribute("style");
        if (style) el.setAttribute("style", rewriteCSSURLs(style, queryPair, url.hostname));
      }
    })
    // Rewrite <style> blocks in HTML (Buffers chunks correctly)
    .on("style", new StyleRewriter(queryPair, url.hostname))
    .transform(response);
}


/* ==========================================================================
   Server-Side Helper Functions & Classes
   ========================================================================== */

// Class to buffer and process <style> tags chunk by chunk in HTMLRewriter
class StyleRewriter {
  constructor(queryPair, hostname) {
    this.queryPair = queryPair;
    this.hostname = hostname;
    this.buffer = "";
  }
  text(textNode) {
    this.buffer += textNode.text;
    if (textNode.lastInTextNode) {
      textNode.replace(rewriteCSSURLs(this.buffer, this.queryPair, this.hostname), { html: true });
    } else {
      textNode.remove();
    }
  }
}

// Rewrites url(...) strings inside CSS
function rewriteCSSURLs(cssString, paramPair, currentHostname) {
  if (!cssString) return cssString;
  return cssString.replace(/url\((['"]?)(.*?)\1\)/ig, (match, quote, targetUrl) => {
    return `url(${quote}${appendQuery(targetUrl, paramPair, currentHostname)}${quote})`;
  });
}

// Server-side static URL rewriting
function appendQuery(targetUrl, paramPair, currentHostname) {
  if (
    !targetUrl ||
    targetUrl.startsWith("#") || 
    targetUrl.startsWith("mailto:") || 
    targetUrl.startsWith("tel:") || 
    targetUrl.startsWith("javascript:") ||
    targetUrl.startsWith("data:") ||
    targetUrl.startsWith("blob:")
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

// Server-side responsive image set rewriting
function appendQueryToSrcset(srcsetString, paramPair, currentHostname) {
  if (!srcsetString) return srcsetString;
  return srcsetString.split(',').map(part => {
    const trimmed = part.trim();
    if (!trimmed) return part;
    const parts = trimmed.split(/\s+/);
    parts[0] = appendQuery(parts[0], paramPair, currentHostname);
    return parts.join(' ');
  }).join(', ');
}
