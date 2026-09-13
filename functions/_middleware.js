export async function onRequest(context) {
  // Extract env to use env.ASSETS.fetch for internal static files
  const { request, next, env } = context;
  const url = new URL(request.url);

  // --- Redirect any mixed-case or uppercase path to lowercase ---
  if (url.pathname !== url.pathname.toLowerCase()) {
    url.pathname = url.pathname.toLowerCase();
    return Response.redirect(url.toString(), 301);
  }

  // 1. Get the actual response
  const response = await next();
  
  // 2. Process HTML responses with HTMLRewriter for server-side partials
  const contentType = response.headers.get("Content-Type") || "";
  let finalResponse;

  if (contentType.includes("text/html")) {
    // Fetch the partials internally
    const headerRes = await env.ASSETS.fetch(new URL('/partials/header.html', request.url));
    const footerRes = await env.ASSETS.fetch(new URL('/partials/footer.html', request.url));
    
    const headerHtml = headerRes.ok ? await headerRes.text() : "";
    const footerHtml = footerRes.ok ? await footerRes.text() : "";

    const rewriter = new HTMLRewriter()
      .on('[data-partial="header"]', {
        element(element) {
          if (headerHtml) element.setInnerContent(headerHtml, { html: true });
        }
      })
      .on('[data-partial="footer"]', {
        element(element) {
          if (footerHtml) element.setInnerContent(footerHtml, { html: true });
        }
      })
      .on('body', {
        element(element) {
          // Preserve exact client-side event dispatching and translation logic
          element.append(`
            <script>
              document.addEventListener('DOMContentLoaded', () => {
                if (window.translationSystem) {
                    window.translationSystem.applyTranslations(); 
                }
                document.dispatchEvent(new CustomEvent('tgd:partials-loaded')); 
              });
            </script>
          `, { html: true });
        }
      });

    finalResponse = rewriter.transform(response);
    finalResponse = new Response(finalResponse.body, finalResponse);
  } else {
    // Leave non-HTML responses untouched
    finalResponse = new Response(response.body, response);
  }
  
  return finalResponse;
}
