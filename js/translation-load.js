document.addEventListener('DOMContentLoaded', function () {
    var settings = window.gtranslateSettings || {};
    var defaultLanguage = settings.default_language || 'en';
    var storedLanguage = localStorage.getItem('tgd_language') || defaultLanguage;

    if (storedLanguage === defaultLanguage) return;

    var attempts = 0;
    var maxAttempts = 50; // 50 x 200ms = 10s
    function tryTranslate() {
        attempts++;
        if (window.__GT && window.__GT.translator && typeof window.__GT.translator.translate === 'function') {
            window.__GT.translator.translate(defaultLanguage, storedLanguage);
            return;
        }
        if (attempts >= maxAttempts) return;
        setTimeout(tryTranslate, 200);
    }

    if (!window.gt_translate_script && typeof window.doGTranslate === 'function') {
        window.doGTranslate(defaultLanguage + '|' + storedLanguage);
    }

    tryTranslate();
});
