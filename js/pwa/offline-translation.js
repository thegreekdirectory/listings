// js/pwa/offline-translation.js
(function () {
    const STORAGE_KEY = 'tgd_offline_translations_v1';

    const UI_TRANSLATIONS = {
        en: {
            home: 'Home',
            listings: 'Listings',
            settings: 'Settings',
            map: 'Map',
            starred: 'Starred',
            offline: 'Offline',
            the_greek_directory: 'The Greek Directory',
            filters: 'Filters',
            clear_all: 'Clear All',
            loading: 'Loading...'
        },
        el: {
            home: 'Αρχική',
            listings: 'Καταχωρίσεις',
            settings: 'Ρυθμίσεις',
            map: 'Χάρτης',
            starred: 'Αποθηκευμένα',
            offline: 'Εκτός σύνδεσης',
            the_greek_directory: 'Ο Ελληνικός Κατάλογος',
            filters: 'Φίλτρα',
            clear_all: 'Καθαρισμός',
            loading: 'Φόρτωση...'
        }
    };

    function persistTranslations() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(UI_TRANSLATIONS));
        } catch (error) {
            console.warn('Unable to store offline translations', error);
        }
    }

    function getTranslations() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return UI_TRANSLATIONS;
            const parsed = JSON.parse(raw);
            return parsed && parsed.en && parsed.el ? parsed : UI_TRANSLATIONS;
        } catch {
            return UI_TRANSLATIONS;
        }
    }

    function t(key, lang) {
        const dict = getTranslations();
        return (dict[lang] && dict[lang][key]) || (dict.en && dict.en[key]) || null;
    }

    function applyOfflineTranslations() {
        if (navigator.onLine) return;

        const lang = localStorage.getItem('tgd_language') || 'en';
        document.querySelectorAll('[data-offline-i18n]').forEach((el) => {
            const key = el.getAttribute('data-offline-i18n');
            const translated = t(key, lang);
            if (!translated) return;
            if (el.tagName === 'INPUT') {
                el.placeholder = translated;
            } else {
                el.textContent = translated;
            }
        });
    }

    persistTranslations();

    window.TGDOfflineTranslation = {
        persistTranslations,
        applyOfflineTranslations,
        t
    };
})();
