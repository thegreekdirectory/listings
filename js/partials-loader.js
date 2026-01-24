// ============================================
// PARTIALS LOADER
// Load header and footer partials
// ============================================

async function loadPartials() {
    try {
        // Load header
        const headerElement = document.querySelector('[data-partial="header"]');
        if (headerElement) {
            const headerResponse = await fetch('/partials/header.html');
            if (headerResponse.ok) {
                headerElement.innerHTML = await headerResponse.text();
            }
        }
        
        // Load footer
        const footerElement = document.querySelector('[data-partial="footer"]');
        if (footerElement) {
            const footerResponse = await fetch('/partials/footer.html');
            if (footerResponse.ok) {
                footerElement.innerHTML = await footerResponse.text();
            }
        }
        
        // Apply translations after partials are loaded
        if (window.translationSystem) {
            window.translationSystem.applyTranslations();
        }
    } catch (error) {
        console.error('Error loading partials:', error);
    }
}

// Load partials when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadPartials);
} else {
    loadPartials();
}
