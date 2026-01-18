// ============================================
// TRANSLATION SYSTEM
// Greek/English translation for entire site
// ============================================

const TRANSLATIONS = {
    en: {
        // Header & Navigation
        'nav.directory': 'Directory',
        'nav.about': 'About',
        'nav.contact': 'Contact',
        'nav.business': 'For Businesses',
        'nav.admin': 'Admin',
        
        // Home Page
        'home.title': 'The Greek Directory',
        'home.subtitle': 'Discover Greek-owned businesses across America',
        'home.search.placeholder': 'Search businesses, categories, or locations...',
        'home.search.button': 'Search',
        'home.categories': 'Browse Categories',
        'home.featured': 'Featured Businesses',
        'home.recent': 'Recently Added',
        
        // Categories
        'category.automotive': 'Automotive & Transportation',
        'category.beauty': 'Beauty & Health',
        'category.church': 'Church & Religious Organization',
        'category.cultural': 'Cultural/Fraternal Organization',
        'category.education': 'Education & Community',
        'category.entertainment': 'Entertainment, Arts & Recreation',
        'category.food': 'Food & Hospitality',
        'category.grocery': 'Grocery & Imports',
        'category.home': 'Home & Construction',
        'category.industrial': 'Industrial & Manufacturing',
        'category.pets': 'Pets & Veterinary',
        'category.professional': 'Professional & Business Services',
        'category.realestate': 'Real Estate & Development',
        'category.retail': 'Retail & Shopping',
        
        // Listing Page
        'listing.call': 'Call',
        'listing.website': 'Website',
        'listing.directions': 'Directions',
        'listing.share': 'Share',
        'listing.hours': 'Hours',
        'listing.open': 'Open Now',
        'listing.closed': 'Closed',
        'listing.opening': 'Opening Soon',
        'listing.closing': 'Closing Soon',
        'listing.contact': 'Contact Information',
        'listing.location': 'Location',
        'listing.about': 'About',
        'listing.reviews': 'Reviews',
        'listing.social': 'Social Media',
        'listing.owner': 'Owner Information',
        'listing.chain': 'Other Locations',
        'listing.claim.title': 'Is this your business?',
        'listing.claim.text': 'Claim your listing to manage your information and connect with customers.',
        'listing.claim.button': 'Claim This Listing',
        'listing.share.title': 'Share This Listing',
        
        // Days of Week
        'day.monday': 'Monday',
        'day.tuesday': 'Tuesday',
        'day.wednesday': 'Wednesday',
        'day.thursday': 'Thursday',
        'day.friday': 'Friday',
        'day.saturday': 'Saturday',
        'day.sunday': 'Sunday',
        
        // Common
        'common.loading': 'Loading...',
        'common.error': 'Error',
        'common.success': 'Success',
        'common.save': 'Save',
        'common.cancel': 'Cancel',
        'common.edit': 'Edit',
        'common.delete': 'Delete',
        'common.close': 'Close',
        'common.back': 'Back',
        'common.next': 'Next',
        'common.previous': 'Previous',
        'common.search': 'Search',
        'common.filter': 'Filter',
        'common.sort': 'Sort',
        'common.view': 'View',
        'common.more': 'More',
        'common.less': 'Less'
    },
    
    el: {
        // Header & Navigation
        'nav.directory': 'Κατάλογος',
        'nav.about': 'Σχετικά',
        'nav.contact': 'Επικοινωνία',
        'nav.business': 'Για Επιχειρήσεις',
        'nav.admin': 'Διαχειριστής',
        
        // Home Page
        'home.title': 'Ο Ελληνικός Κατάλογος',
        'home.subtitle': 'Ανακαλύψτε ελληνόκτητες επιχειρήσεις σε όλη την Αμερική',
        'home.search.placeholder': 'Αναζήτηση επιχειρήσεων, κατηγοριών ή τοποθεσιών...',
        'home.search.button': 'Αναζήτηση',
        'home.categories': 'Κατηγορίες',
        'home.featured': 'Προτεινόμενες Επιχειρήσεις',
        'home.recent': 'Πρόσφατα Προστεθείσες',
        
        // Categories
        'category.automotive': 'Αυτοκίνητα & Μεταφορές',
        'category.beauty': 'Ομορφιά & Υγεία',
        'category.church': 'Εκκλησία & Θρησκευτικός Οργανισμός',
        'category.cultural': 'Πολιτιστικός/Αδελφικός Οργανισμός',
        'category.education': 'Εκπαίδευση & Κοινότητα',
        'category.entertainment': 'Ψυχαγωγία, Τέχνες & Αναψυχή',
        'category.food': 'Φαγητό & Φιλοξενία',
        'category.grocery': 'Παντοπωλείο & Εισαγωγές',
        'category.home': 'Σπίτι & Κατασκευές',
        'category.industrial': 'Βιομηχανικά & Κατασκευαστικά',
        'category.pets': 'Κατοικίδια & Κτηνιατρική',
        'category.professional': 'Επαγγελματικές & Επιχειρηματικές Υπηρεσίες',
        'category.realestate': 'Ακίνητα & Ανάπτυξη',
        'category.retail': 'Λιανική & Αγορές',
        
        // Listing Page
        'listing.call': 'Τηλέφωνο',
        'listing.website': 'Ιστοσελίδα',
        'listing.directions': 'Οδηγίες',
        'listing.share': 'Κοινοποίηση',
        'listing.hours': 'Ωράριο',
        'listing.open': 'Ανοιχτά Τώρα',
        'listing.closed': 'Κλειστά',
        'listing.opening': 'Ανοίγει Σύντομα',
        'listing.closing': 'Κλείνει Σύντομα',
        'listing.contact': 'Στοιχεία Επικοινωνίας',
        'listing.location': 'Τοποθεσία',
        'listing.about': 'Σχετικά',
        'listing.reviews': 'Κριτικές',
        'listing.social': 'Κοινωνικά Μέσα',
        'listing.owner': 'Πληροφορίες Ιδιοκτήτη',
        'listing.chain': 'Άλλες Τοποθεσίες',
        'listing.claim.title': 'Είναι δική σας αυτή η επιχείρηση;',
        'listing.claim.text': 'Διεκδικήστε την καταχώρησή σας για να διαχειριστείτε τις πληροφορίες σας.',
        'listing.claim.button': 'Διεκδίκηση Καταχώρησης',
        'listing.share.title': 'Κοινοποίηση Καταχώρησης',
        
        // Days of Week
        'day.monday': 'Δευτέρα',
        'day.tuesday': 'Τρίτη',
        'day.wednesday': 'Τετάρτη',
        'day.thursday': 'Πέμπτη',
        'day.friday': 'Παρασκευή',
        'day.saturday': 'Σάββατο',
        'day.sunday': 'Κυριακή',
        
        // Common
        'common.loading': 'Φόρτωση...',
        'common.error': 'Σφάλμα',
        'common.success': 'Επιτυχία',
        'common.save': 'Αποθήκευση',
        'common.cancel': 'Ακύρωση',
        'common.edit': 'Επεξεργασία',
        'common.delete': 'Διαγραφή',
        'common.close': 'Κλείσιμο',
        'common.back': 'Πίσω',
        'common.next': 'Επόμενο',
        'common.previous': 'Προηγούμενο',
        'common.search': 'Αναζήτηση',
        'common.filter': 'Φίλτρο',
        'common.sort': 'Ταξινόμηση',
        'common.view': 'Προβολή',
        'common.more': 'Περισσότερα',
        'common.less': 'Λιγότερα'
    }
};

class TranslationSystem {
    constructor() {
        this.currentLanguage = this.loadLanguage();
        this.init();
    }
    
    init() {
        this.createToggle();
        this.applyTranslations();
        this.setupLanguagePersistence();
    }
    
    loadLanguage() {
        return localStorage.getItem('tgd_language') || 'en';
    }
    
    saveLanguage(lang) {
        localStorage.setItem('tgd_language', lang);
    }
    
    createToggle() {
        const header = document.querySelector('header .header-content') || 
                      document.querySelector('header > div') ||
                      document.querySelector('header');
        
        if (!header) return;
        
        const toggle = document.createElement('div');
        toggle.id = 'translationToggle';
        toggle.className = `translation-toggle ${this.currentLanguage === 'el' ? 'greek' : ''}`;
        toggle.innerHTML = `
            <img src="https://flagcdn.com/w40/us.png" alt="English" class="flag-icon" id="flagEn">
            <div class="toggle-switch"></div>
            <img src="https://flagcdn.com/w40/gr.png" alt="Greek" class="flag-icon" id="flagEl">
        `;
        
        // Find nav or append to header
        const nav = header.querySelector('.header-nav') || header.querySelector('nav');
        if (nav) {
            nav.appendChild(toggle);
        } else {
            header.appendChild(toggle);
        }
        
        toggle.addEventListener('click', () => this.toggleLanguage());
    }
    
    toggleLanguage() {
        this.currentLanguage = this.currentLanguage === 'en' ? 'el' : 'en';
        this.saveLanguage(this.currentLanguage);
        
        const toggle = document.getElementById('translationToggle');
        if (toggle) {
            toggle.className = `translation-toggle ${this.currentLanguage === 'el' ? 'greek' : ''}`;
        }
        
        this.applyTranslations();
    }
    
    translate(key) {
        return TRANSLATIONS[this.currentLanguage][key] || key;
    }
    
    applyTranslations() {
        // Translate all elements with data-translate attribute
        document.querySelectorAll('[data-translate]').forEach(element => {
            const key = element.getAttribute('data-translate');
            const translation = this.translate(key);
            
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                if (element.placeholder) {
                    element.placeholder = translation;
                }
            } else {
                // Don't translate if element contains specific non-translatable content
                if (!this.shouldSkipTranslation(element)) {
                    element.textContent = translation;
                }
            }
        });
        
        // Translate specific known elements by ID or class
        this.translateKnownElements();
    }
    
    shouldSkipTranslation(element) {
        // Skip elements that contain addresses, emails, phone numbers, website URLs, or business names
        const text = element.textContent || '';
        const skipPatterns = [
            /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/, // Phone numbers
            /[\w\.-]+@[\w\.-]+\.\w+/, // Email addresses
            /https?:\/\//, // URLs
            /\d{1,5}\s\w+\s(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct)/ // Street addresses
        ];
        
        // Check if element has class indicating it should not be translated
        if (element.classList.contains('no-translate') || 
            element.hasAttribute('data-no-translate')) {
            return true;
        }
        
        return skipPatterns.some(pattern => pattern.test(text));
    }
    
    translateKnownElements() {
        // Header navigation
        const navLinks = {
            'Directory': 'nav.directory',
            'About': 'nav.about',
            'Contact': 'nav.contact',
            'For Businesses': 'nav.business',
            'Admin': 'nav.admin'
        };
        
        document.querySelectorAll('nav a, .header-nav a').forEach(link => {
            const text = link.textContent.trim();
            if (navLinks[text]) {
                link.textContent = this.translate(navLinks[text]);
            }
        });
        
        // Listing page specific elements
        if (window.location.pathname.includes('/listings/')) {
            this.translateListingPage();
        }
        
        // Home page specific elements
        if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
            this.translateHomePage();
        }
    }
    
    translateListingPage() {
        // Action buttons
        const actionMappings = {
            'Call': 'listing.call',
            'Website': 'listing.website',
            'Directions': 'listing.directions',
            'Share': 'listing.share'
        };
        
        document.querySelectorAll('.action-button').forEach(button => {
            const text = button.textContent.trim();
            Object.keys(actionMappings).forEach(key => {
                if (text.includes(key)) {
                    button.textContent = button.textContent.replace(key, this.translate(actionMappings[key]));
                }
            });
        });
        
        // Section headings
        const headingMappings = {
            'Hours': 'listing.hours',
            'Contact Information': 'listing.contact',
            'Location': 'listing.location',
            'About': 'listing.about',
            'Reviews': 'listing.reviews',
            'Social Media': 'listing.social',
            'Owner Information': 'listing.owner',
            'Other Locations': 'listing.chain',
            'Share This Listing': 'listing.share.title'
        };
        
        document.querySelectorAll('h2, h3').forEach(heading => {
            const text = heading.textContent.trim();
            if (headingMappings[text]) {
                heading.textContent = this.translate(headingMappings[text]);
            }
        });
        
        // Days of week
        ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].forEach(day => {
            document.querySelectorAll('.hours-day').forEach(element => {
                if (element.textContent.trim() === day) {
                    element.textContent = this.translate(`day.${day.toLowerCase()}`);
                }
            });
        });
        
        // Open/Closed status
        const statusMappings = {
            'Open Now': 'listing.open',
            'Closed': 'listing.closed',
            'Opening Soon': 'listing.opening',
            'Closing Soon': 'listing.closing'
        };
        
        document.querySelectorAll('.hours-status, .open-now, .closed-now, .opening-soon, .closing-soon').forEach(element => {
            const text = element.textContent.trim();
            if (statusMappings[text]) {
                element.textContent = this.translate(statusMappings[text]);
            }
        });
    }
    
    translateHomePage() {
        // Search placeholder
        const searchInput = document.querySelector('input[type="search"], .search-input');
        if (searchInput) {
            searchInput.placeholder = this.translate('home.search.placeholder');
        }
        
        // Search button
        const searchButton = document.querySelector('.search-button, button[type="submit"]');
        if (searchButton) {
            searchButton.textContent = this.translate('home.search.button');
        }
        
        // Section titles
        const sectionMappings = {
            'Browse Categories': 'home.categories',
            'Featured Businesses': 'home.featured',
            'Recently Added': 'home.recent'
        };
        
        document.querySelectorAll('h2, h3').forEach(heading => {
            const text = heading.textContent.trim();
            if (sectionMappings[text]) {
                heading.textContent = this.translate(sectionMappings[text]);
            }
        });
    }
    
    setupLanguagePersistence() {
        // On page load, ensure toggle reflects saved language
        window.addEventListener('load', () => {
            const toggle = document.getElementById('translationToggle');
            if (toggle) {
                toggle.className = `translation-toggle ${this.currentLanguage === 'el' ? 'greek' : ''}`;
            }
            this.applyTranslations();
        });
    }
}

// Initialize translation system when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.translationSystem = new TranslationSystem();
    });
} else {
    window.translationSystem = new TranslationSystem();
}

// Export for use in other scripts
window.TGDTranslate = {
    get: (key) => window.translationSystem.translate(key),
    getCurrentLanguage: () => window.translationSystem.currentLanguage,
    setLanguage: (lang) => {
        window.translationSystem.currentLanguage = lang;
        window.translationSystem.saveLanguage(lang);
        window.translationSystem.applyTranslations();
    }
};
