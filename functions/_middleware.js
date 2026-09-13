export async function onRequest(context) {

  
  // 3. Process HTML responses with HTMLRewriter for server-side partials
  const contentType = response.headers.get("Content-Type") || "";
  let finalResponse;

  if (contentType.includes("text/html")) {
    // Fetch the partials internally
    const headerRes = await env.ASSETS.fetch(new URL('/partials/header.html', request.url)); //[cite: 1]
    const footerRes = await env.ASSETS.fetch(new URL('/partials/footer.html', request.url)); //[cite: 1]
    
    const headerHtml = headerRes.ok ? await headerRes.text() : "";
    const footerHtml = footerRes.ok ? await footerRes.text() : "";

    const rewriter = new HTMLRewriter()
      .on('[data-partial="header"]', { //[cite: 1]
        element(element) {
          if (headerHtml) element.setInnerContent(headerHtml, { html: true });
        }
      })
      .on('[data-partial="footer"]', { //[cite: 1]
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
          `, { html: true }); //[cite: 1]
        }
      });

    finalResponse = rewriter.transform(response);
    finalResponse = new Response(finalResponse.body, finalResponse);
  } else {
    // Leave non-HTML responses untouched
    finalResponse = new Response(response.body, response);
  }

  // 4. Attach the access cookie to the response so the user stays authenticated for 1 year
  finalResponse.headers.append("Set-Cookie", `${COOKIE_NAME}=${SECRET_VALUE}; Path=/; Max-Age=31536000; SameSite=Lax`); //[cite: 2]
  
  return finalResponse;
}
