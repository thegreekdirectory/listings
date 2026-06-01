export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);
  
  const SECRET_PARAM = "access";
  const SECRET_VALUE = "granted";
  const queryPair = `${SECRET_PARAM}=${SECRET_VALUE}`;

  // 1. Check if the current request has the secret
  if (url.searchParams.get(SECRET_PARAM) !== SECRET_VALUE) {
    return new Response(
      `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>403 — Forbidden</title><link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Bebas+Neue&display=swap" rel="stylesheet"><style>*{margin:0;padding:0;box-sizing:border-box}body{background:#080808;color:#ff2244;font-family:'Share Tech Mono',monospace;height:100vh;display:flex;align-items:center;justify-content:center;overflow:hidden;position:relative}body::before{content:'';position:fixed;inset:0;background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,255,255,.02) 2px,rgba(255,255,255,.02) 4px);pointer-events:none;z-index:10}body::after{content:'';position:fixed;inset:0;background:radial-gradient(ellipse at center,transparent 40%,rgba(0,0,0,.85) 100%);pointer-events:none;z-index:9}.wrap{text-align:center;position:relative;z-index:1;user-select:none}.code{font-family:'Bebas Neue',sans-serif;font-size:clamp(130px,25vw,290px);line-height:.85;color:#ff2244;position:relative;animation:g 3s infinite;text-shadow:0 0 60px rgba(255,34,68,.5),0 0 120px rgba(255,34,68,.2)}.code::before,.code::after{content:'403';position:absolute;inset:0}.code::before{color:#0ff;animation:gb 3s infinite;clip-path:polygon(0 0,100% 0,100% 33%,0 33%);mix-blend-mode:screen;opacity:.8}.code::after{color:#ff2244;animation:ga 3s infinite;clip-path:polygon(0 66%,100% 66%,100% 100%,0 100%);mix-blend-mode:screen;opacity:.8}@keyframes g{0%,89%,100%{transform:translate(0)}90%{transform:translate(-3px,1px)}91%{transform:translate(3px,-1px)}92%{transform:translate(0)}93%{transform:translate(4px,2px)}94%{transform:translate(-4px,0)}95%{transform:translate(0)}}@keyframes gb{0%,89%,100%{transform:translate(0)}90%{transform:translate(5px,-3px)}91%{transform:translate(-5px,3px)}92%{transform:translate(0)}93%{transform:translate(-6px,1px)}94%{transform:translate(6px,0)}95%{transform:translate(0)}}@keyframes ga{0%,89%,100%{transform:translate(0)}90%{transform:translate(-4px,4px)}91%{transform:translate(4px,-4px)}92%{transform:translate(0)}93%{transform:translate(7px,-1px)}94%{transform:translate(-7px,1px)}95%{transform:translate(0)}}.lbl{font-size:clamp(11px,2vw,17px);letter-spacing:.55em;text-transform:uppercase;margin-top:6px;animation:fl 5s infinite}.div{width:100px;height:1px;background:linear-gradient(90deg,transparent,#ff2244,transparent);margin:22px auto;animation:pu 2s infinite}.msg{font-size:clamp(9px,1.4vw,12px);letter-spacing:.2em;color:rgba(255,34,68,.45);margin-top:4px;text-transform:uppercase}@keyframes fl{0%,93%,100%{opacity:.9}94%{opacity:.2}95%{opacity:.9}97%{opacity:.05}98%{opacity:.9}}@keyframes pu{0%,100%{opacity:.4;transform:scaleX(1)}50%{opacity:1;transform:scaleX(1.4)}}.bar{width:50px;height:2px;background:#ff2244;margin:0 auto 18px;overflow:hidden;position:relative}.bar::after{content:'';position:absolute;top:0;left:-100%;width:100%;height:100%;background:rgba(255,255,255,.6);animation:sw 1.8s infinite}@keyframes sw{0%{left:-100%}100%{left:200%}}.c{position:fixed;font-size:9px;letter-spacing:.12em;color:rgba(255,34,68,.2);text-transform:uppercase}.tl{top:20px;left:20px}.tr{top:20px;right:20px}.bl{bottom:20px;left:20px}.br{bottom:20px;right:20px}.grid{position:fixed;inset:0;background-image:linear-gradient(rgba(255,34,68,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,34,68,.03) 1px,transparent 1px);background-size:60px 60px;pointer-events:none;z-index:0}</style></head><body><div class="grid"></div><span class="c tl">SYS//ERR.LOG</span><span class="c tr">CODE::403</span><span class="c bl">ACCESS_CTRL</span><span class="c br">NODE_DENIED</span><div class="wrap"><div class="bar"></div><div class="code">403</div><div class="lbl">Access Forbidden</div><div class="div"></div><div class="msg">You do not have permission to access this resource</div></div></body></html>`,
      {
        status: 403,
        headers: {
          "Content-Type": "text/html; charset=utf-8"
        }
      });
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
