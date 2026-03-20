// partials-loader.js
/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
This source code is proprietary and no part may not be used, reproduced, or distributed 
without written permission from The Greek Directory. Unauthorized use, copying, modification, 
or distribution of this code will result in legal action to the fullest extent permitted by law.
*/

// ============================================
// PARTIALS LOADER
// Load header and footer partials
// ============================================

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
*/

// Re-execute <script> tags that were injected via innerHTML.
// Browsers do NOT run scripts inserted this way — this helper clones each
// script as a real DOM element so the browser executes it.
function executePartialScripts(container) {
    var scripts = container.querySelectorAll('script');
    scripts.forEach(function (oldScript) {
        var newScript = document.createElement('script');
        for (var i = 0; i < oldScript.attributes.length; i++) {
            var attr = oldScript.attributes[i];
            newScript.setAttribute(attr.name, attr.value);
        }
        newScript.textContent = oldScript.textContent;
        oldScript.parentNode.replaceChild(newScript, oldScript);
    });
}

async function loadPartials() {
    try {
        // Load header
        const headerElement = document.querySelector('[data-partial="header"]');
        if (headerElement) {
            const headerResponse = await fetch('/partials/header.html');
            if (headerResponse.ok) {
                headerElement.innerHTML = await headerResponse.text();
                // Execute scripts that were silently dropped by innerHTML
                executePartialScripts(headerElement);
            }
        }
        
        /*
        Copyright (C) The Greek Directory, 2025-present. All rights reserved.
        */
        
        // Load footer
        const footerElement = document.querySelector('[data-partial="footer"]');
        if (footerElement) {
            const footerResponse = await fetch('/partials/footer.html');
            if (footerResponse.ok) {
                footerElement.innerHTML = await footerResponse.text();
                // Execute scripts that were silently dropped by innerHTML
                executePartialScripts(footerElement);
            }
        }
        
        // Apply translations after partials are loaded
        if (window.translationSystem) {
            window.translationSystem.applyTranslations();
        }

        document.dispatchEvent(new CustomEvent('tgd:partials-loaded'));
    } catch (error) {
        console.error('Error loading partials:', error);
    }
}

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
*/

// Load partials when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadPartials);
} else {
    loadPartials();
}

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
This source code is proprietary and no part may not be used, reproduced, or distributed 
without written permission from The Greek Directory. Unauthorized use, copying, modification, 
or distribution of this code will result in legal action to the fullest extent permitted by law.
*/
