// Copyright (C) The Greek Directory, 2025-present. All rights reserved.
//
// Bridge between TGD's own header language toggle and GTranslate.
//
// globe.js (loaded just before this file, on every page) already detects
// on every load whether the stored language differs from the default and,
// if so, appends a <script> tag to fetch its translation library
// (lib.min.js) -- but that bare call passes no callback, so nothing then
// actually calls into the library once it loads. That last step normally
// only happens via clicks on GTranslate's own auto-generated flag-picker
// links, which this site has never used (it has its own header toggle
// instead), so translation itself was never actually triggered. This
// performs that missing step: once the library has actually finished
// initializing (see the polling below), call
// window.__GT.translator.translate(...) directly -- the same call
// GTranslate's own doGTranslate() makes internally.
//
// Load this with a plain <script src="..."> tag (no defer, no async),
// placed after globe.js's own <script> tag on the page. A script loaded
// that way blocks the parser and runs as soon as it's fetched, in the
// exact position it appears in the document -- so placing it after
// globe.js is what guarantees this always runs after globe.js's own
// current_lang check has already run, without needing DOMContentLoaded
// for that particular guarantee. DOMContentLoaded is still used below,
// but for a different, narrower reason: it lets this one file be safely
// cached and reused byte-for-byte across every page, including ones where
// something earlier in <body> might not have finished setting up
// localStorage/DOM state this depends on -- if that's never actually a
// problem in practice, the wrapper still costs nothing.
document.addEventListener('DOMContentLoaded', function () {
    var settings = window.gtranslateSettings || {};
    var defaultLanguage = settings.default_language || 'en';
    var storedLanguage = localStorage.getItem('tgd_language') || defaultLanguage;

    if (storedLanguage === defaultLanguage) {
        // GTranslate's own __GT_TRANSLATE_LANGS key (written by lib.min.js
        // the first time it actually translates the page) is never cleared
        // or updated by anything -- not globe.js, not lib.min.js, not this
        // bridge -- when switching back to the default language. globe.js
        // unconditionally trusts that key over <html lang> whenever it
        // exists (see its own current_lang detection), so once it's ever
        // been written, every subsequent page load keeps auto-translating
        // back to the non-default language forever, even after tgd_language
        // and <html lang> both correctly say the default. Clearing it here
        // whenever we're actually on the default language is what breaks
        // that loop: the next page load's current_lang then correctly falls
        // back to <html lang>, which TGD's own header code already sets
        // correctly from tgd_language.
        try {
            localStorage.removeItem('__GT_TRANSLATE_LANGS');
        } catch (e) {}
        return;
    }

    // Poll for window.__GT actually being ready rather than trusting any
    // single event to mean that: a script's 'load' event fires once its
    // own top-level code finishes running, not once everything it
    // asynchronously sets up internally is ready -- confirmed directly by
    // testing against a deliberately-delayed stub, where 'load' fired
    // long before the library's actual __GT assignment ran. Nothing here
    // can know how the real library sequences its own initialization, so
    // checking for the actual value it's expected to produce is the only
    // thing that can't be fooled by that.
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
        // globe.js's own current_lang check should already have appended
        // the library's <script> tag whenever storedLanguage differs from
        // defaultLanguage, since it derives from the same <html lang>
        // state -- this only runs as a fallback for the unexpected case
        // where that didn't happen. doGTranslate's own load_tlib only
        // appends the tag "if(!window.gt_translate_script)", so this is a
        // safe, idempotent call either way.
        window.doGTranslate(defaultLanguage + '|' + storedLanguage);
    }

    tryTranslate();
});
