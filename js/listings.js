// ============================================
// LISTINGS PAGE JAVASCRIPT - PART 1
// Configuration, Constants, and State Management
// ============================================

const SUPABASE_URL = 'https://luetekzqrrgdxtopzvqw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1ZXRla3pxcnJnZHh0b3B6dnF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNDc2NDcsImV4cCI6MjA4MzkyMzY0N30.TIrNG8VGumEJc_9JvNHW-Q-UWfUGpPxR0v8POjWZJYg';

const CATEGORIES = [
    'Automotive & Transportation', 'Beauty & Health', 'Church & Religious Organization',
    'Cultural/Fraternal Organization', 'Education & Community', 'Entertainment, Arts & Recreation',
    'Food & Hospitality', 'Grocery & Imports', 'Home & Construction', 'Industrial & Manufacturing',
    'Pets & Veterinary', 'Professional & Business Services', 'Real Estate & Development', 'Retail & Shopping'
];

let SUBCATEGORIES = {};

const US_STATES = {
    'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
    'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'FL': 'Florida', 'GA': 'Georgia',
    'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
    'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
    'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri',
    'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey',
    'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio',
    'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
    'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont',
    'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming'
};

const TRANSLATIONS = {
    en: {
        view: 'View ',
        starred: 'Starred',
        searchPlaceholder: 'Search businesses, churches, schools...',
        filters: 'Filters',
        map: 'Map',
        clearAll: 'Clear All',
        searchCategories: 'Search Categories & Subcategories',
        typeToSearch: 'Type to search...',
        category: 'Category',
        subcategories: 'Subcategories',
        any: 'Any',
        all: 'All',
        openNow: 'Open Now',
        closedNow: 'Closed Now',
        openingSoon: 'Opening Soon (60 min)',
        closingSoon: 'Closing Soon (60 min)',
        hoursUnknown: 'Hours Unknown',
        onlineOnly: 'Online Only',
        radius: 'Radius',
        anyDistance: 'Any distance',
        locationSearch: 'Location Search',
        locationPlaceholder: 'City, State, Zip, or Country...',
        country: 'Country',
        allCountries: 'All Countries',
        state: 'State',
        allStates: 'All States',
        loadingMap: 'Loading map...',
        splitView: 'Split View',
        currentLocation: 'Current Location',
        reload: 'Reload',
        search: 'Search',
        categoriesSubcategories: 'Categories & subcategories...',
        sortDefault: 'Default',
        sortAZ: 'A-Z',
        sortClosest: 'Closest to Me',
        loadMore: 'Load More Listings'
    },
    el: {
        view: 'Δείτε ',
        starred: 'Αγαπημένα',
        searchPlaceholder: 'Ψάξτε επιχειρήσεις, εκκλησίες, σχολεία...',
        filters: 'Φίλτρα',
        map: 'Χάρτης',
        clearAll: 'Εκκαθάριση Όλων',
        searchCategories: 'Αναζήτηση Κατηγοριών & Υποκατηγοριών',
        typeToSearch: 'Πληκτρολογήστε για αναζήτηση...',
        category: 'Κατηγορία',
        subcategories: 'Υποκατηγορίες',
        any: 'Οποιαδήποτε',
        all: 'Όλες',
        openNow: 'Ανοιχτά Τώρα',
        closedNow: 'Κλειστά Τώρα',
        openingSoon: 'Ανοίγει Σύντομα (60 λεπτά)',
        closingSoon: 'Κλείνει Σύντομα (60 λεπτά)',
        hoursUnknown: 'Άγνωστο Ωράριο',
        onlineOnly: 'Μόνο Online',
        radius: 'Ακτίνα',
        anyDistance: 'Οποιαδήποτε απόσταση',
        locationSearch: 'Αναζήτηση Τοποθεσίας',
        locationPlaceholder: 'Πόλη, Πολιτεία, Τ.Κ., ή Χώρα...',
        country: 'Χώρα',
        allCountries: 'Όλες Χώρες',
        state: 'Πολιτεία',
        allStates: 'Όλες Πολιτείες',
        loadingMap: 'Φόρτωση χάρτη...',
        splitView: 'Διαχωρισμένη Προβολή',
        currentLocation: 'Τρέχουσα Τοποθεσία',
        reload: 'Ανανέωση',
        search: 'Αναζήτηση',
        categoriesSubcategories: 'Κατηγορίες & υποκατηγορίες...',
        sortDefault: 'Προεπιλογή',
        sortAZ: 'Α-Ω',
        sortClosest: 'Πιο Κοντά σε Μένα',
        loadMore: 'Φόρτωση Περισσότερων Καταχωρίσεων'
    }
};

let currentLanguage = getCookie('language') || 'en';
let supabase = null;
let allListings = [], filteredListings = [], currentView = 'grid', selectedCategory = 'All';
let selectedSubcategories = [], subcategoryMode = 'any', selectedCountry = '', selectedState = '';
let selectedRadius = 0, openNowOnly = false, closedNowOnly = false, openingSoonOnly = false;
let closingSoonOnly = false, hoursUnknownOnly = false, onlineOnly = false, userLocation = null;
let map = null, mapOpen = false, splitViewActive = false, filtersOpen = false;
let markerClusterGroup = null, defaultMapCenter = [41.8781, -87.6298], defaultMapZoom = 10;
let userLocationMarker = null, mapReady = false, allListingsGeocoded = false;
let starredListings = [], viewingStarredOnly = false, mapMoved = false, locationButtonActive = false;
let filterPosition = 'left';
let searchDebounceTimer = null;
let displayedListingsCount = 25;
let estimatedUserLocation = null;

function getCookie(name) {
    return document.cookie.split('; ').reduce((r, v) => {
        const parts = v.split('=');
        return parts[0] === name ? decodeURIComponent(parts[1]) : r;
    }, '');
}

function setCookie(name, value, days) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = name + '=' + encodeURIComponent(value) + '; expires=' + expires + '; path=/';
}

function isIOSWebApp() {
    return ('standalone' in window.navigator) && window.navigator.standalone;
}

function extractSubcategoriesFromListings(listings) {
    const subcatsByCategory = {};
    
    listings.forEach(listing => {
        if (listing.category && listing.subcategories && Array.isArray(listing.subcategories)) {
            if (!subcatsByCategory[listing.category]) {
                subcatsByCategory[listing.category] = new Set();
            }
            listing.subcategories.forEach(sub => {
                subcatsByCategory[listing.category].add(sub);
            });
        }
    });
    
    const result = {};
    Object.keys(subcatsByCategory).forEach(category => {
        result[category] = Array.from(subcatsByCategory[category]).sort();
    });
    
    return result;
}
// ============================================
// LISTINGS PAGE JAVASCRIPT - PART 2
// Initialization and Language Functions
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    if (isIOSWebApp()) document.getElementById('refreshBtn').style.display = 'flex';
    loadStarredListings();
    loadListings();
    setupEventListeners();
    createCategoryButtons();
    requestLocationOnLoad();
    estimateLocationByIP();
    loadFiltersFromURL();
    initMap();
    syncFilters();
    checkFilterPosition();
    translatePage();
});

function switchLanguage(lang) {
    currentLanguage = lang;
    setCookie('language', lang, 365);
    
    document.querySelectorAll('.lang-btn').forEach(btn => {
        if (btn.dataset.lang === lang) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    translatePage();
}

function translatePage() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (TRANSLATIONS[currentLanguage] && TRANSLATIONS[currentLanguage][key]) {
            el.textContent = TRANSLATIONS[currentLanguage][key];
        }
    });
    
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (TRANSLATIONS[currentLanguage] && TRANSLATIONS[currentLanguage][key]) {
            el.placeholder = TRANSLATIONS[currentLanguage][key];
        }
    });
    
    updateRadiusValue();
}

async function estimateLocationByIP() {
    try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        if (data.latitude && data.longitude) {
            estimatedUserLocation = {
                lat: data.latitude,
                lng: data.longitude,
                city: data.city,
                state: data.region_code,
                country: data.country_code,
                estimated: true
            };
            console.log('Estimated location by IP:', estimatedUserLocation);
            
            if (!viewingStarredOnly) applyFilters();
            return estimatedUserLocation;
        }
    } catch (e) {
        console.error('IP location estimation failed:', e);
    }
    return null;
}

function requestLocationOnLoad() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                userLocation = { lat: position.coords.latitude, lng: position.coords.longitude };
                console.log('Location acquired:', userLocation);
                if (!viewingStarredOnly) applyFilters();
                if (map && mapOpen) addUserLocationMarker();
            },
            (error) => console.log('Location permission denied or unavailable:', error.message),
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    }
}

function loadStarredListings() {
    const stored = getCookie('starredListings');
    if (stored) {
        try { starredListings = JSON.parse(stored); } catch (e) { starredListings = []; }
    }
    updateStarredCount();
}

function saveStarredListings() {
    setCookie('starredListings', JSON.stringify(starredListings), 365);
    updateStarredCount();
}

function toggleStar(listingId, event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    const index = starredListings.indexOf(listingId);
    if (index > -1) starredListings.splice(index, 1);
    else starredListings.push(listingId);
    saveStarredListings();
    renderListings();
}

function updateStarredCount() {
    document.getElementById('starredCount').textContent = starredListings.length;
}

function toggleStarredView() {
    viewingStarredOnly = !viewingStarredOnly;
    if (viewingStarredOnly) {
        if (starredListings.length === 0) {
            alert('You haven\'t starred any listings yet!');
            viewingStarredOnly = false;
            return;
        }
        filteredListings = allListings.filter(l => starredListings.includes(l.id));
        displayedListingsCount = filteredListings.length;
        document.getElementById('resultsCount').textContent = `${filteredListings.length} starred ${filteredListings.length === 1 ? 'listing' : 'listings'}`;
        document.getElementById('starredBtn').style.backgroundColor = '#fbbf24';
        document.getElementById('starredBtn').style.color = '#78350f';
    } else {
        displayedListingsCount = 25;
        applyFilters();
        document.getElementById('starredBtn').style.backgroundColor = '';
        document.getElementById('starredBtn').style.color = '';
    }
    renderListings();
    updateResultsCount();
}

window.toggleStar = toggleStar;
window.switchLanguage = switchLanguage;

async function loadListings() {
    try {
        console.log('📥 Loading listings from Supabase...');
        
        const { data, error } = await supabase
            .from('listings')
            .select('*')
            .eq('visible', true)
            .order('business_name');
        
        if (error) throw error;
        
        allListings = data || [];
        filteredListings = [...allListings];
        
        SUBCATEGORIES = extractSubcategoriesFromListings(allListings);
        console.log('✅ Loaded', allListings.length, 'listings');
        
        populateCountryFilter();
        updateLocationSubtitle();
        applyFilters();
        updateResultsCount();
        geocodeAllListings();
    } catch (error) {
        console.error('❌ Error loading listings:', error);
        document.getElementById('listingsContainer').innerHTML = 
            '<p class="text-center text-gray-600 py-12">Error loading listings. Please try again.</p>';
    }
}

function checkFilterPosition() {
    const screenWidth = window.innerWidth;
    const toggleBtn = document.getElementById('toggleFilterPosition');
    const desktopLayout = document.getElementById('desktopLayout');
    const desktopFilters = document.getElementById('desktopFiltersContainer');
    const mapBtn = document.getElementById('mapBtnDesktop');
    const listingsContainer = document.getElementById('listingsContainer');
    
    if (screenWidth >= 1024) {
        toggleBtn.style.display = 'block';
        mapBtn.classList.remove('hidden');
        if (filterPosition === 'left') {
            desktopLayout.classList.add('with-left-filters');
            desktopFilters.classList.remove('hidden');
            if (currentView === 'grid') {
                listingsContainer.classList.remove('listings-3-col');
                listingsContainer.classList.add('listings-2-col');
            }
        } else {
            desktopLayout.classList.remove('with-left-filters');
            desktopFilters.classList.add('hidden');
            if (currentView === 'grid') {
                listingsContainer.classList.remove('listings-2-col');
                listingsContainer.classList.add('listings-3-col');
            }
        }
    } else {
        toggleBtn.style.display = 'none';
        desktopLayout.classList.remove('with-left-filters');
        desktopFilters.classList.add('hidden');
        mapBtn.classList.add('hidden');
        if (currentView === 'grid') {
            listingsContainer.classList.remove('listings-2-col', 'listings-3-col');
        }
    }
}
// ============================================
// LISTINGS PAGE JAVASCRIPT - PART 3
// Filters and URL Management
// ============================================

function loadFiltersFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('q');
    if (searchQuery) document.getElementById('searchInput').value = searchQuery;
    
    const category = urlParams.get('category');
    if (category && CATEGORIES.includes(category)) selectedCategory = category;
    
    const subcategories = urlParams.get('subcategories');
    if (subcategories) selectedSubcategories = subcategories.split(',');
    
    const subMode = urlParams.get('submode');
    if (subMode === 'all' || subMode === 'any') {
        subcategoryMode = subMode;
        setSubcategoryMode(subMode, true);
    }
    
    const country = urlParams.get('country');
    if (country) {
        selectedCountry = country;
        document.getElementById('countryFilter').value = country;
        document.getElementById('countryFilter2').value = country;
        if (country === 'USA') {
            document.getElementById('stateFilterContainer').classList.remove('hidden');
            document.getElementById('stateFilterContainer2').classList.remove('hidden');
            populateStateFilter('USA');
        }
    }
    
    const state = urlParams.get('state');
    if (state) {
        selectedState = state;
        document.getElementById('stateFilter').value = state;
        document.getElementById('stateFilter2').value = state;
    }
    
    const radius = urlParams.get('radius');
    if (radius) {
        selectedRadius = parseInt(radius);
        document.getElementById('radiusFilter').value = radius;
        document.getElementById('radiusFilter2').value = radius;
        updateRadiusValue();
    }
    
    if (urlParams.get('open') === 'true') {
        openNowOnly = true;
        document.getElementById('openNowFilter').checked = true;
        document.getElementById('openNowFilter2').checked = true;
    }
    
    if (urlParams.get('closed') === 'true') {
        closedNowOnly = true;
        document.getElementById('closedNowFilter').checked = true;
        document.getElementById('closedNowFilter2').checked = true;
    }
    
    if (urlParams.get('opening') === 'true') {
        openingSoonOnly = true;
        document.getElementById('openingSoonFilter').checked = true;
        document.getElementById('openingSoonFilter2').checked = true;
    }
    
    if (urlParams.get('closing') === 'true') {
        closingSoonOnly = true;
        document.getElementById('closingSoonFilter').checked = true;
        document.getElementById('closingSoonFilter2').checked = true;
    }
    
    if (urlParams.get('hours') === 'unknown') {
        hoursUnknownOnly = true;
        document.getElementById('hoursUnknownFilter').checked = true;
        document.getElementById('hoursUnknownFilter2').checked = true;
    }
    
    if (urlParams.get('online') === 'true') {
        onlineOnly = true;
        document.getElementById('onlineOnlyFilter').checked = true;
        document.getElementById('onlineOnlyFilter2').checked = true;
    }
}

function updateURL() {
    const url = new URL(window.location);
    const searchTerm = document.getElementById('searchInput').value;
    url.search = '';
    if (selectedCategory && selectedCategory !== 'All') url.searchParams.set('category', selectedCategory);
    if (selectedSubcategories.length > 0) {
        url.searchParams.set('subcategories', selectedSubcategories.join(','));
        url.searchParams.set('submode', subcategoryMode);
    }
    if (selectedCountry) url.searchParams.set('country', selectedCountry);
    if (selectedState) url.searchParams.set('state', selectedState);
    if (selectedRadius > 0) url.searchParams.set('radius', selectedRadius);
    if (openNowOnly) url.searchParams.set('open', 'true');
    if (closedNowOnly) url.searchParams.set('closed', 'true');
    if (openingSoonOnly) url.searchParams.set('opening', 'true');
    if (closingSoonOnly) url.searchParams.set('closing', 'true');
    if (hoursUnknownOnly) url.searchParams.set('hours', 'unknown');
    if (onlineOnly) url.searchParams.set('online', 'true');
    if (searchTerm) url.searchParams.set('q', searchTerm);
    window.history.replaceState({}, '', url);
}

window.setSubcategoryMode = function(mode, skipUpdate) {
    subcategoryMode = mode;
    document.querySelectorAll('.toggle-option').forEach(opt => {
        if (opt.dataset.mode === mode) opt.classList.add('active');
        else opt.classList.remove('active');
    });
    if (!skipUpdate) {
        updateURL();
        if (!viewingStarredOnly) applyFilters();
    }
};

function normalizeString(str) {
    return str.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
}

function getFullAddress(listing) {
    if (listing.city && listing.state) {
        if (listing.address) {
            return `${listing.address}, ${listing.city}, ${listing.state} ${listing.zip_code || ''}`.trim();
        } else {
            return `${listing.city}, ${listing.state}`.trim();
        }
    }
    return listing.address || '';
}

function isBasedIn(listing) {
    return listing.city && listing.state && !listing.address;
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 3959;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

function clearAllFilters() {
    selectedCategory = 'All';
    selectedSubcategories = [];
    selectedCountry = '';
    selectedState = '';
    selectedRadius = 0;
    openNowOnly = false;
    closedNowOnly = false;
    openingSoonOnly = false;
    closingSoonOnly = false;
    hoursUnknownOnly = false;
    onlineOnly = false;
    
    document.getElementById('searchInput').value = '';
    ['categorySearch', 'categorySearch2'].forEach(id => document.getElementById(id).value = '');
    ['locationSearch', 'locationSearch2'].forEach(id => document.getElementById(id).value = '');
    ['countryFilter', 'countryFilter2'].forEach(id => document.getElementById(id).value = '');
    ['stateFilter', 'stateFilter2'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('stateFilterContainer').classList.add('hidden');
    document.getElementById('stateFilterContainer2').classList.add('hidden');
    ['radiusFilter', 'radiusFilter2'].forEach(id => document.getElementById(id).value = '0');
    ['openNowFilter', 'openNowFilter2'].forEach(id => document.getElementById(id).checked = false);
    ['closedNowFilter', 'closedNowFilter2'].forEach(id => document.getElementById(id).checked = false);
    ['openingSoonFilter', 'openingSoonFilter2'].forEach(id => document.getElementById(id).checked = false);
    ['closingSoonFilter', 'closingSoonFilter2'].forEach(id => document.getElementById(id).checked = false);
    ['hoursUnknownFilter', 'hoursUnknownFilter2'].forEach(id => document.getElementById(id).checked = false);
    ['onlineOnlyFilter', 'onlineOnlyFilter2'].forEach(id => document.getElementById(id).checked = false);
    
    ['subcategoryContainer', 'subcategoryContainer2'].forEach(id => {
        document.getElementById(id).classList.add('hidden');
    });
    
    updateRadiusValue();
    updateURL();
    createCategoryButtons();
    displayedListingsCount = 25;
    if (!viewingStarredOnly) applyFilters();
}

function updateRadiusValue() {
    ['radiusValue', 'radiusValue2'].forEach(id => {
        const valueSpan = document.getElementById(id);
        if (selectedRadius === 0) {
            valueSpan.textContent = currentLanguage === 'el' ? TRANSLATIONS.el.anyDistance : TRANSLATIONS.en.anyDistance;
        } else {
            valueSpan.textContent = `${selectedRadius} ${selectedRadius === 1 ? 'mile' : 'miles'}`;
        }
    });
}

function populateCountryFilter() {
    const countries = [...new Set(allListings.map(l => l.country || 'USA'))].sort();
    ['countryFilter', 'countryFilter2'].forEach(id => {
        const select = document.getElementById(id);
        select.innerHTML = '<option value="">All Countries</option>';
        countries.forEach(country => {
            const option = document.createElement('option');
            option.value = country;
            option.textContent = country === 'USA' ? 'United States' : country;
            select.appendChild(option);
        });
    });
}

function populateStateFilter(country) {
    if (country === 'USA') {
        const states = [...new Set(allListings.filter(l => (l.country || 'USA') === 'USA').map(l => l.state))].sort();
        ['stateFilter', 'stateFilter2'].forEach(id => {
            const select = document.getElementById(id);
            select.innerHTML = '<option value="">All States</option>';
            states.forEach(state => {
                const option = document.createElement('option');
                option.value = state;
                option.textContent = `${US_STATES[state] || state} (${state})`;
                select.appendChild(option);
            });
        });
    }
}

function updateLocationSubtitle() {
    const urlPath = window.location.pathname;
    const pathParts = urlPath.split('/').filter(p => p);
    let subtitle = 'All Listings';
    if (pathParts.length >= 2 && pathParts[0] === 'listings') {
        const country = pathParts[1].toUpperCase();
        if (country === 'USA' && pathParts.length >= 3) {
            const state = pathParts[2].toUpperCase();
            subtitle = `${US_STATES[state] || state}, United States Listings`;
        } else if (country === 'USA') {
            subtitle = 'United States Listings';
        } else {
            subtitle = `${country} Listings`;
        }
    }
    document.getElementById('locationSubtitle').textContent = subtitle;
}
// ============================================
// LISTINGS PAGE JAVASCRIPT - PART 4
// Hours and Status Functions
// ============================================

function isOpenNow(hours) {
    if (!hours || typeof hours !== 'object' || Object.keys(hours).length === 0) return null;
    const hasAnyHours = Object.values(hours).some(h => h && h.trim() !== '');
    if (!hasAnyHours) return null;
    const now = new Date();
    const centralTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Chicago' }));
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = days[centralTime.getDay()];
    const todayHours = hours[today];
    if (!todayHours || todayHours.toLowerCase() === 'closed') return false;
    const match = todayHours.match(/(\d{1,2}):(\d{2})\s*(AM|PM)\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match) return null;
    const [, startHour, startMin, startPeriod, endHour, endMin, endPeriod] = match;
    let start = parseInt(startHour);
    let end = parseInt(endHour);
    if (startPeriod.toUpperCase() === 'PM' && start !== 12) start += 12;
    if (startPeriod.toUpperCase() === 'AM' && start === 12) start = 0;
    if (endPeriod.toUpperCase() === 'PM' && end !== 12) end += 12;
    if (endPeriod.toUpperCase() === 'AM' && end === 12) end = 0;
    const currentMinutes = centralTime.getHours() * 60 + centralTime.getMinutes();
    const startMinutes = start * 60 + parseInt(startMin);
    const endMinutes = end * 60 + parseInt(endMin);
    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
}

function isOpeningSoon(hours) {
    if (!hours || typeof hours !== 'object') return false;
    const now = new Date();
    const centralTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Chicago' }));
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = days[centralTime.getDay()];
    const todayHours = hours[today];
    if (!todayHours || todayHours.toLowerCase() === 'closed') return false;
    const match = todayHours.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match) return false;
    const [, startHour, startMin, startPeriod] = match;
    let start = parseInt(startHour);
    if (startPeriod.toUpperCase() === 'PM' && start !== 12) start += 12;
    if (startPeriod.toUpperCase() === 'AM' && start === 12) start = 0;
    const currentMinutes = centralTime.getHours() * 60 + centralTime.getMinutes();
    const startMinutes = start * 60 + parseInt(startMin);
    const diff = startMinutes - currentMinutes;
    return diff > 0 && diff <= 60;
}

function isClosingSoon(hours) {
    if (!hours || typeof hours !== 'object') return false;
    const now = new Date();
    const centralTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Chicago' }));
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = days[centralTime.getDay()];
    const todayHours = hours[today];
    if (!todayHours || todayHours.toLowerCase() === 'closed') return false;
    const match = todayHours.match(/(\d{1,2}):(\d{2})\s*(AM|PM)\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match) return false;
    const [, , , , endHour, endMin, endPeriod] = match;
    let end = parseInt(endHour);
    if (endPeriod.toUpperCase() === 'PM' && end !== 12) end += 12;
    if (endPeriod.toUpperCase() === 'AM' && end === 12) end = 0;
    const currentMinutes = centralTime.getHours() * 60 + centralTime.getMinutes();
    const endMinutes = end * 60 + parseInt(endMin);
    const diff = endMinutes - currentMinutes;
    return diff > 0 && diff <= 60;
}

function hasUnknownHours(listing) {
    if (!listing.address || isBasedIn(listing)) return false;
    if (!listing.hours || typeof listing.hours !== 'object') return true;
    const hasAnyHours = Object.values(listing.hours).some(h => h && h.trim() !== '');
    if (!hasAnyHours) return true;
    const now = new Date();
    const centralTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Chicago' }));
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = days[centralTime.getDay()];
    const todayHours = listing.hours[today];
    return !todayHours || todayHours.trim() === '';
}

function updateResultsCount() {
    const count = filteredListings.length;
    if (!viewingStarredOnly) {
        document.getElementById('resultsCount').textContent = `${count} ${count === 1 ? 'listing' : 'listings'} found${selectedCategory !== 'All' ? ` in ${selectedCategory}` : ''}`;
    }
}

function loadMoreListings() {
    displayedListingsCount += 25;
    renderListings();
}
// ============================================
// LISTINGS PAGE JAVASCRIPT - PART 5
// Apply Filters Function
// ============================================

function applyFilters() {
    const searchTerm = normalizeString(document.getElementById('searchInput').value);
    const sortOption = document.getElementById('sortSelect').value;
    
    filteredListings = allListings.filter(listing => {
        const fullAddress = getFullAddress(listing);
        const normalizedName = normalizeString(listing.business_name);
        const normalizedTagline = normalizeString(listing.tagline || '');
        const normalizedDescription = normalizeString(listing.description);
        const normalizedAddress = normalizeString(fullAddress);
        
        const matchesSearch = !searchTerm || 
            normalizedName.includes(searchTerm) ||
            normalizedTagline.includes(searchTerm) ||
            normalizedDescription.includes(searchTerm) ||
            normalizedAddress.includes(searchTerm);
            
        const matchesCategory = selectedCategory === 'All' || listing.category === selectedCategory;
        
        let matchesSubcategory = true;
        if (selectedSubcategories.length > 0 && listing.subcategories) {
            if (subcategoryMode === 'all') {
                matchesSubcategory = selectedSubcategories.every(sub => listing.subcategories.includes(sub));
            } else {
                matchesSubcategory = selectedSubcategories.some(sub => listing.subcategories.includes(sub));
            }
        } else if (selectedSubcategories.length > 0) {
            matchesSubcategory = false;
        }
        
        const matchesCountry = !selectedCountry || (listing.country || 'USA') === selectedCountry;
        const matchesState = !selectedState || listing.state === selectedState;
        
        let matchesRadius = true;
        const effectiveUserLocation = userLocation || estimatedUserLocation;
        if (selectedRadius > 0) {
            if (!effectiveUserLocation) {
                matchesRadius = true;
            } else if (!listing.coordinates) {
                matchesRadius = false;
            } else {
                const distance = calculateDistance(
                    effectiveUserLocation.lat, effectiveUserLocation.lng,
                    listing.coordinates.lat, listing.coordinates.lng
                );
                matchesRadius = distance <= selectedRadius;
            }
        }
        
        const openStatus = isOpenNow(listing.hours);
        const matchesOpenNow = !openNowOnly || openStatus === true;
        const matchesClosedNow = !closedNowOnly || openStatus === false;
        const matchesOpeningSoon = !openingSoonOnly || isOpeningSoon(listing.hours);
        const matchesClosingSoon = !closingSoonOnly || isClosingSoon(listing.hours);
        const matchesHoursUnknown = !hoursUnknownOnly || hasUnknownHours(listing);
        const matchesOnlineOnly = !onlineOnly || isBasedIn(listing);
        
        return matchesSearch && matchesCategory && matchesSubcategory && matchesCountry && 
               matchesState && matchesRadius && matchesOpenNow && matchesClosedNow &&
               matchesOpeningSoon && matchesClosingSoon && matchesHoursUnknown && matchesOnlineOnly;
    });
    
    const effectiveUserLocation = userLocation || estimatedUserLocation;
    if (effectiveUserLocation) {
        filteredListings.forEach(listing => {
            if (listing.coordinates) {
                listing._distance = calculateDistance(
                    effectiveUserLocation.lat, effectiveUserLocation.lng,
                    listing.coordinates.lat, listing.coordinates.lng
                );
            } else {
                listing._distance = Infinity;
            }
            
            listing._inUserCity = effectiveUserLocation.city && 
                listing.city && 
                listing.city.toLowerCase() === effectiveUserLocation.city.toLowerCase();
            
            listing._inUserState = effectiveUserLocation.state && 
                listing.state && 
                listing.state.toLowerCase() === effectiveUserLocation.state.toLowerCase();
        });
    }
    
    filteredListings.sort((a, b) => {
        if (sortOption === 'default') {
            const aTier = a.tier || 'FREE';
            const bTier = b.tier || 'FREE';
            const tierPriority = { PREMIUM: 3, FEATURED: 2, VERIFIED: 1, FREE: 0 };
            
            const effectiveUserLocation = userLocation || estimatedUserLocation;
            if (effectiveUserLocation) {
                if (a._inUserCity !== b._inUserCity) {
                    return b._inUserCity ? 1 : -1;
                }
                
                if (a._inUserState !== b._inUserState) {
                    return b._inUserState ? 1 : -1;
                }
            }
            
            if (tierPriority[aTier] !== tierPriority[bTier]) {
                return tierPriority[bTier] - tierPriority[aTier];
            }
            
            return a.business_name.localeCompare(b.business_name);
        } else if (sortOption === 'az') {
            return a.business_name.localeCompare(b.business_name);
        } else if (sortOption === 'closest') {
            return (a._distance || Infinity) - (b._distance || Infinity);
        }
        return 0;
    });
    
    displayedListingsCount = 25;
    renderListings();
    updateResultsCount();
    if (map) updateMapMarkers();
}
// ============================================
// LISTINGS PAGE JAVASCRIPT - PART 6
// Render Listings Function
// ============================================

function renderListings() {
    const container = document.getElementById('listingsContainer');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    
    const displayedListings = filteredListings.slice(0, displayedListingsCount);
    const hasMore = displayedListingsCount < filteredListings.length;
    
    if (filteredListings.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-600 py-12">No listings found.</p>';
        loadMoreBtn.classList.add('hidden');
        return;
    }

    if (currentView === 'grid') {
        const screenWidth = window.innerWidth;
        let gridClass = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';
        
        if (screenWidth >= 1024) {
            if (filterPosition === 'left') {
                gridClass = 'grid grid-cols-1 md:grid-cols-2 gap-6 listings-2-col';
            } else {
                gridClass = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 listings-3-col';
            }
        }
        
        container.className = gridClass;
        container.innerHTML = displayedListings.map(l => {
            const firstPhoto = l.photos && l.photos.length > 0 ? l.photos[0] : l.logo;
            const fullAddress = getFullAddress(l);
            const categorySlug = l.category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            const listingUrl = `/listings/${categorySlug}/${l.slug}`;
            const badges = [];
            
            const openStatus = isOpenNow(l.hours);
            if (openStatus === true) badges.push('<span class="badge badge-open">Open</span>');
            else if (openStatus === false) badges.push('<span class="badge badge-closed">Closed</span>');
            if (isOpeningSoon(l.hours)) badges.push('<span class="badge badge-opening-soon">Opening Soon</span>');
            if (isClosingSoon(l.hours)) badges.push('<span class="badge badge-closing-soon">Closing Soon</span>');
            if (hasUnknownHours(l)) badges.push('<span class="badge badge-hours-unknown">Hours Unknown</span>');
            
            if (l.tier === 'FEATURED' || l.tier === 'PREMIUM') badges.push('<span class="badge badge-featured">Featured</span>');
            if (l.verified) badges.push('<span class="badge badge-verified">Verified</span>');
            if (!l.show_claim_button && l.tier === 'FREE') badges.push('<span class="badge badge-claimed">Claimed</span>');
            
            const isStarred = starredListings.includes(l.id);
            
            return `
                <a href="${listingUrl}" class="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden block relative">
                    <button class="star-button ${isStarred ? 'starred' : ''}" onclick="toggleStar('${l.id}', event)">
                        <svg class="star-icon" viewBox="0 0 24 24">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                    </button>
                    <div class="h-48 bg-gray-200 relative">
                        <img src="${firstPhoto}" alt="${l.business_name}" class="w-full h-full object-cover">
                        ${badges.length > 0 ? `<div class="absolute top-2 left-2 flex gap-2 flex-wrap">${badges.join('')}</div>` : ''}
                    </div>
                    <div class="p-4">
                        <div class="flex gap-3 mb-3">
                            <img src="${l.logo}" alt="${l.business_name} logo" class="w-16 h-16 rounded object-cover flex-shrink-0">
                            <div class="flex-1 min-w-0">
                                <span class="text-xs font-semibold px-2 py-1 rounded-full text-white block w-fit mb-2" style="background-color:#055193;">${l.category}</span>
                                <h3 class="text-lg font-bold text-gray-900 line-clamp-1">${l.business_name}</h3>
                            </div>
                        </div>
                        <p class="text-sm text-gray-600 mb-3 line-clamp-2">${l.tagline || l.description}</p>
                        <div class="text-sm text-gray-600 space-y-1">
                            <div class="flex items-center gap-2">
                                <span>📍</span>
                                <span class="truncate">${fullAddress}</span>
                            </div>
                            ${l.phone ? `<div class="flex items-center gap-2"><span>📞</span><span class="truncate">${l.phone}</span></div>` : ''}
                        </div>
                    </div>
                </a>
            `;
        }).join('');
    } else {
        container.className = 'space-y-4';
        container.innerHTML = displayedListings.map(l => {
            const fullAddress = getFullAddress(l);
            const categorySlug = l.category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            const listingUrl = `/listings/${categorySlug}/${l.slug}`;
            const badges = [];
            
            const openStatus = isOpenNow(l.hours);
            if (openStatus === true) badges.push('<span class="badge badge-open">Open</span>');
            else if (openStatus === false) badges.push('<span class="badge badge-closed">Closed</span>');
            if (isOpeningSoon(l.hours)) badges.push('<span class="badge badge-opening-soon">Opening Soon</span>');
            if (isClosingSoon(l.hours)) badges.push('<span class="badge badge-closing-soon">Closing Soon</span>');
            if (hasUnknownHours(l)) badges.push('<span class="badge badge-hours-unknown">Hours Unknown</span>');
            
            if (l.tier === 'FEATURED' || l.tier === 'PREMIUM') badges.push('<span class="badge badge-featured">Featured</span>');
            if (l.verified) badges.push('<span class="badge badge-verified">Verified</span>');
            if (!l.show_claim_button && l.tier === 'FREE') badges.push('<span class="badge badge-claimed">Claimed</span>');
            
            const isStarred = starredListings.includes(l.id);
            
            return `
                <a href="${listingUrl}" class="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-4 flex gap-4 block relative">
                    <button class="star-button ${isStarred ? 'starred' : ''}" onclick="toggleStar('${l.id}', event)" style="top: 12px; right: 12px;">
                        <svg class="star-icon" viewBox="0 0 24 24">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                    </button>
                    <img src="${l.logo}" alt="${l.business_name}" class="w-24 h-24 rounded-lg object-cover flex-shrink-0">
                    <div class="flex-1 min-w-0 overflow-hidden pr-12">
                        <div class="flex gap-2 mb-2 flex-wrap">
                            <span class="text-xs font-semibold px-2 py-1 rounded-full text-white" style="background-color:#055193;">${l.category}</span>
                            ${badges.join('')}
                        </div>
                        <h3 class="text-lg font-bold text-gray-900 mb-1 truncate">${l.business_name}</h3>
                        <p class="text-sm text-gray-600 mb-2 line-clamp-1">${l.tagline || l.description}</p>
                        <div class="flex flex-col gap-1 text-sm text-gray-600">
                            <div class="flex items-center gap-1">
                                <span>📍</span>
                                <span class="truncate">${fullAddress}</span>
                            </div>
                            ${l.phone ? `<div class="flex items-center gap-1"><span>📞</span><span class="truncate">${l.phone}</span></div>` : ''}
                        </div>
                    </div>
                </a>
            `;
        }).join('');
    }
    
    if (hasMore) {
        loadMoreBtn.classList.remove('hidden');
        loadMoreBtn.textContent = `Load More Listings (${filteredListings.length - displayedListingsCount} remaining)`;
        loadMoreBtn.onclick = loadMoreListings;
    } else {
        loadMoreBtn.classList.add('hidden');
    }
}
// ============================================
// LISTINGS PAGE JAVASCRIPT - PART 7
// Render Listings & Display Functions
// ============================================

function renderListings() {
    const start = 0;
    const end = displayedListingsCount;
    const toDisplay = filteredListings.slice(start, end);
    
    const container = document.getElementById('listingsContainer');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    
    if (!container) return;
    
    updateResultsCount();
    
    if (loadMoreBtn) {
        if (end < filteredListings.length) {
            loadMoreBtn.classList.remove('hidden');
            loadMoreBtn.textContent = `Load More Listings (${filteredListings.length - end} remaining)`;
        } else {
            loadMoreBtn.classList.add('hidden');
        }
    }
    
    if (toDisplay.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-16">
                <p class="text-gray-600 text-lg mb-4">No listings found matching your criteria</p>
                <button onclick="clearAllFilters()" class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Clear All Filters
                </button>
            </div>
        `;
        
        if (map && markerClusterGroup) {
            markerClusterGroup.clearLayers();
        }
        return;
    }
    
    if (currentView === 'list') {
        renderListView(container, toDisplay);
    } else {
        renderGridView(container, toDisplay);
    }
    
    if (map) {
        updateMapMarkers();
    }
}

function renderGridView(container, listings) {
    const screenWidth = window.innerWidth;
    let gridClass = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';
    
    if (screenWidth >= 1024) {
        if (filterPosition === 'left') {
            gridClass = 'grid grid-cols-1 md:grid-cols-2 gap-6 listings-2-col';
        } else {
            gridClass = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 listings-3-col';
        }
    }
    
    container.className = gridClass;
    container.innerHTML = listings.map(l => {
        const firstPhoto = l.photos && l.photos.length > 0 ? l.photos[0] : l.logo;
        const fullAddress = getFullAddress(l);
        const categorySlug = l.category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const listingUrl = `/listing/${categorySlug}/${l.slug}`;
        const badges = [];
        
        const openStatus = isOpenNow(l.hours);
        if (openStatus === true) badges.push('<span class="badge badge-open">Open</span>');
        else if (openStatus === false) badges.push('<span class="badge badge-closed">Closed</span>');
        if (isOpeningSoon(l.hours)) badges.push('<span class="badge badge-opening-soon">Opening Soon</span>');
        if (isClosingSoon(l.hours)) badges.push('<span class="badge badge-closing-soon">Closing Soon</span>');
        if (hasUnknownHours(l)) badges.push('<span class="badge badge-hours-unknown">Hours Unknown</span>');
        
        if (l.tier === 'FEATURED' || l.tier === 'PREMIUM') badges.push('<span class="badge badge-featured">Featured</span>');
        if (l.verified) badges.push('<span class="badge badge-verified">Verified</span>');
        if (!l.show_claim_button && l.tier === 'FREE') badges.push('<span class="badge badge-claimed">Claimed</span>');
        
        const isStarred = starredListings.includes(l.id);
        
        return `
            <a href="${listingUrl}" class="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden block relative">
                <button class="star-button ${isStarred ? 'starred' : ''}" onclick="toggleStar('${l.id}', event)">
                    <svg class="star-icon" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                </button>
                <div class="h-48 bg-gray-200 relative">
                    <img src="${firstPhoto}" alt="${l.business_name}" class="w-full h-full object-cover">
                    ${badges.length > 0 ? `<div class="absolute top-2 left-2 flex gap-2 flex-wrap">${badges.join('')}</div>` : ''}
                </div>
                <div class="p-4">
                    <div class="flex gap-3 mb-3">
                        <img src="${l.logo}" alt="${l.business_name} logo" class="w-16 h-16 rounded object-cover flex-shrink-0">
                        <div class="flex-1 min-w-0">
                            <span class="text-xs font-semibold px-2 py-1 rounded-full text-white block w-fit mb-2" style="background-color:#055193;">${l.category}</span>
                            <h3 class="text-lg font-bold text-gray-900 line-clamp-1">${l.business_name}</h3>
                        </div>
                    </div>
                    <p class="text-sm text-gray-600 mb-3 line-clamp-2">${l.tagline || l.description}</p>
                    <div class="text-sm text-gray-600 space-y-1">
                        <div class="flex items-center gap-2">
                            <span>📍</span>
                            <span class="truncate">${fullAddress}</span>
                        </div>
                        ${l.phone ? `<div class="flex items-center gap-2"><span>📞</span><span class="truncate">${l.phone}</span></div>` : ''}
                    </div>
                </div>
            </a>
        `;
    }).join('');
}

function renderListView(container, listings) {
    container.className = 'space-y-4';
    container.innerHTML = listings.map(l => {
        const fullAddress = getFullAddress(l);
        const categorySlug = l.category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const listingUrl = `/listing/${categorySlug}/${l.slug}`;
        const badges = [];
        
        const openStatus = isOpenNow(l.hours);
        if (openStatus === true) badges.push('<span class="badge badge-open">Open</span>');
        else if (openStatus === false) badges.push('<span class="badge badge-closed">Closed</span>');
        if (isOpeningSoon(l.hours)) badges.push('<span class="badge badge-opening-soon">Opening Soon</span>');
        if (isClosingSoon(l.hours)) badges.push('<span class="badge badge-closing-soon">Closing Soon</span>');
        if (hasUnknownHours(l)) badges.push('<span class="badge badge-hours-unknown">Hours Unknown</span>');
        
        if (l.tier === 'FEATURED' || l.tier === 'PREMIUM') badges.push('<span class="badge badge-featured">Featured</span>');
        if (l.verified) badges.push('<span class="badge badge-verified">Verified</span>');
        if (!l.show_claim_button && l.tier === 'FREE') badges.push('<span class="badge badge-claimed">Claimed</span>');
        
        const isStarred = starredListings.includes(l.id);
        
        return `
            <a href="${listingUrl}" class="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-4 flex gap-4 block relative">
                <button class="star-button ${isStarred ? 'starred' : ''}" onclick="toggleStar('${l.id}', event)" style="top: 12px; right: 12px;">
                    <svg class="star-icon" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                </button>
                <img src="${l.logo}" alt="${l.business_name}" class="w-24 h-24 rounded-lg object-cover flex-shrink-0">
                <div class="flex-1 min-w-0 overflow-hidden pr-12">
                    <div class="flex gap-2 mb-2 flex-wrap">
                        <span class="text-xs font-semibold px-2 py-1 rounded-full text-white" style="background-color:#055193;">${l.category}</span>
                        ${badges.join('')}
                    </div>
                    <h3 class="text-lg font-bold text-gray-900 mb-1 truncate">${l.business_name}</h3>
                    <p class="text-sm text-gray-600 mb-2 line-clamp-1">${l.tagline || l.description}</p>
                    <div class="flex flex-col gap-1 text-sm text-gray-600">
                        <div class="flex items-center gap-1">
                            <span>📍</span>
                            <span class="truncate">${fullAddress}</span>
                        </div>
                        ${l.phone ? `<div class="flex items-center gap-1"><span>📞</span><span class="truncate">${l.phone}</span></div>` : ''}
                    </div>
                </div>
            </a>
        `;
    }).join('');
}

function updateResultsCount() {
    const count = filteredListings.length;
    if (!viewingStarredOnly) {
        document.getElementById('resultsCount').textContent = `${count} ${count === 1 ? 'listing' : 'listings'} found${selectedCategory !== 'All' ? ` in ${selectedCategory}` : ''}`;
    }
}

function setView(view) {
    currentView = view;
    document.getElementById('gridViewBtn').className = view === 'grid' ? 'p-2 rounded bg-white shadow-sm' : 'p-2 rounded';
    document.getElementById('listViewBtn').className = view === 'list' ? 'p-2 rounded bg-white shadow-sm' : 'p-2 rounded';
    document.getElementById('gridViewBtn2').className = view === 'grid' ? 'p-2 rounded bg-white shadow-sm' : 'p-2 rounded';
    document.getElementById('listViewBtn2').className = view === 'list' ? 'p-2 rounded bg-white shadow-sm' : 'p-2 rounded';
    renderListings();
}

function loadMoreListings() {
    displayedListingsCount += 25;
    renderListings();
}

window.setView = setView;
window.loadMoreListings = loadMoreListings;
// ============================================
// LISTINGS PAGE JAVASCRIPT - PART 8
// Map Functions & UI Controls
// ============================================

function initMap() {
    if (map) return;
    showMapLoading();
    map = L.map('map', { 
        center: defaultMapCenter, 
        zoom: defaultMapZoom, 
        zoomControl: true,
        scrollWheelZoom: false
    });
    
    map.on('click', function() {
        map.scrollWheelZoom.enable();
    });
    map.on('mouseout', function() {
        map.scrollWheelZoom.disable();
    });
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: null, maxZoom: 19
    }).addTo(map);
    
    markerClusterGroup = L.markerClusterGroup({
        maxClusterRadius: 50,
        disableClusteringAtZoom: 18,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        iconCreateFunction: function(cluster) {
            const count = cluster.getChildCount();
            let size = 'small';
            if (count >= 10) size = 'medium';
            if (count >= 50) size = 'large';
            return L.divIcon({
                html: `<div class="marker-cluster marker-cluster-${size}">${count}</div>`,
                className: '',
                iconSize: size === 'small' ? [40, 40] : size === 'medium' ? [50, 50] : [60, 60]
            });
        }
    });
    map.addLayer(markerClusterGroup);
    if (userLocation) addUserLocationMarker();
    
    map.on('movestart', () => {
        if (locationButtonActive && !mapMoved) {
            mapMoved = true;
            locationButtonActive = false;
            const locateBtn = document.getElementById('locateBtn');
            locateBtn.classList.remove('active');
        }
    });
    setTimeout(() => {
        map.invalidateSize();
        mapReady = true;
        updateMapMarkers();
        if (allListingsGeocoded) hideMapLoading();
    }, 500);
}

function showMapLoading() {
    const loading = document.getElementById('mapLoading');
    if (loading) loading.style.display = 'block';
}

function hideMapLoading() {
    const loading = document.getElementById('mapLoading');
    if (loading) loading.style.display = 'none';
}

function addUserLocationMarker() {
    if (!map || !userLocation) return;
    if (userLocationMarker) map.removeLayer(userLocationMarker);
    const userIcon = L.divIcon({
        html: '<div style="width: 16px; height: 16px; background: #4285F4; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 8px rgba(0,0,0,0.3);"></div>',
        className: '', iconSize: [22, 22], iconAnchor: [11, 11]
    });
    userLocationMarker = L.marker([userLocation.lat, userLocation.lng], {
        icon: userIcon, zIndexOffset: 1000
    }).addTo(map);
    userLocationMarker.bindPopup('<strong>Your Location</strong>');
}

function updateMapMarkers() {
    if (!map || !markerClusterGroup || !mapReady) return;
    markerClusterGroup.clearLayers();
    const bounds = [];
    filteredListings.forEach(listing => {
        if (listing.coordinates && !isBasedIn(listing)) {
            const openStatus = isOpenNow(listing.hours);
            const isFeatured = listing.tier === 'FEATURED' || listing.tier === 'PREMIUM';
            const firstPhoto = listing.photos && listing.photos.length > 0 ? listing.photos[0] : listing.logo;
            const iconClass = isFeatured ? 'custom-marker featured' : 'custom-marker';
            const iconHtml = `<div class="${iconClass}"><img src="${listing.logo}" alt="${listing.business_name}"></div>`;
            const customIcon = L.divIcon({ html: iconHtml, className: '', iconSize: [40, 40], iconAnchor: [20, 20] });
            const marker = L.marker([listing.coordinates.lat, listing.coordinates.lng], { icon: customIcon, riseOnHover: true });
            const badges = [];
            
            if (openStatus === true) badges.push('<span class="badge badge-open">Open</span>');
            else if (openStatus === false) badges.push('<span class="badge badge-closed">Closed</span>');
            if (isOpeningSoon(listing.hours)) badges.push('<span class="badge badge-opening-soon">Opening Soon</span>');
            if (isClosingSoon(listing.hours)) badges.push('<span class="badge badge-closing-soon">Closing Soon</span>');
            if (hasUnknownHours(listing)) badges.push('<span class="badge badge-hours-unknown">Hours Unknown</span>');
            
            if (isFeatured) badges.push('<span class="badge badge-featured">Featured</span>');
            if (listing.verified) badges.push('<span class="badge badge-verified">Verified</span>');
            if (!listing.show_claim_button && listing.tier === 'FREE') badges.push('<span class="badge badge-claimed">Claimed</span>');
            
            const categorySlug = listing.category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            const popupContent = `
                <div class="map-popup">
                    <img src="${firstPhoto}" alt="${listing.business_name}" class="map-popup-hero">
                    <div class="map-popup-content">
                        <img src="${listing.logo}" alt="${listing.business_name}" class="map-popup-logo">
                        <div class="map-popup-info">
                            <div class="map-popup-badges">${badges.join('')}</div>
                            <a href="/listing/${categorySlug}/${listing.slug}" class="map-popup-title">${listing.business_name}</a>
                            <div class="map-popup-tagline">${listing.tagline || listing.description.substring(0, 60) + '...'}</div>
                            <div class="map-popup-details">📍 ${getFullAddress(listing)}<br>${listing.phone ? '📞 ' + listing.phone : ''}</div>
                        </div>
                    </div>
                </div>
            `;
            marker.bindPopup(popupContent, { maxWidth: 320, className: 'custom-popup' });
            marker.on('popupopen', () => {
                const closeBtn = document.querySelector('.leaflet-popup-close-button');
                if (closeBtn) closeBtn.textContent = '×';
            });
            markerClusterGroup.addLayer(marker);
            bounds.push([listing.coordinates.lat, listing.coordinates.lng]);
        }
    });
    if (bounds.length > 0) map.fitBounds(L.latLngBounds(bounds), { padding: [50, 50], maxZoom: 15 });
}

function toggleSplitView() {
    splitViewActive = !splitViewActive;
    if (splitViewActive) {
        document.getElementById('normalViewControls').classList.add('hidden');
        document.getElementById('normalViewListings').classList.add('hidden');
        document.getElementById('mapContainer').classList.add('hidden');
        const splitContainer = document.getElementById('splitViewContainer');
        splitContainer.classList.remove('hidden');
        splitContainer.className = 'split-view-container';
        splitContainer.innerHTML = `
            <div class="split-view-listings">
                <div class="mb-4 flex items-center justify-between">
                    <p class="text-sm text-gray-600">${filteredListings.length} ${filteredListings.length === 1 ? 'listing' : 'listings'} found</p>
                    <select id="splitSortSelect" class="text-sm border border-gray-300 rounded-lg px-3 py-2">
                        <option value="default">Default</option>
                        <option value="az">A-Z</option>
                        <option value="closest">Closest to Me</option>
                    </select>
                </div>
                <div id="splitListingsContainer"></div>
            </div>
            <div class="split-view-map"><div id="splitMap"></div></div>
        `;
        document.getElementById('splitSortSelect').value = document.getElementById('sortSelect').value;
        document.getElementById('splitSortSelect').addEventListener('change', (e) => {
            document.getElementById('sortSelect').value = e.target.value;
            displayedListingsCount = 25;
            if (!viewingStarredOnly) applyFilters();
            else renderListings();
        });
        renderSplitViewListings();
        initSplitMap();
    } else {
        document.getElementById('splitViewContainer').classList.add('hidden');
        document.getElementById('splitViewContainer').innerHTML = '';
        document.getElementById('normalViewControls').classList.remove('hidden');
        document.getElementById('normalViewListings').classList.remove('hidden');
        document.getElementById('mapContainer').classList.remove('hidden');
        setTimeout(() => {
            if (map) {
                map.invalidateSize();
                updateMapMarkers();
            }
        }, 100);
    }
}

function renderSplitViewListings() {
    const container = document.getElementById('splitListingsContainer');
    if (!container) return;
    if (filteredListings.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-600 py-12">No listings found.</p>';
        return;
    }
    container.className = 'space-y-3';
    container.innerHTML = filteredListings.map(l => {
        const fullAddress = getFullAddress(l);
        const categorySlug = l.category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const listingUrl = `/listing/${categorySlug}/${l.slug}`;
        const badges = [];
        
        const openStatus = isOpenNow(l.hours);
        if (openStatus === true) badges.push('<span class="badge badge-open">Open</span>');
        else if (openStatus === false) badges.push('<span class="badge badge-closed">Closed</span>');
        if (isOpeningSoon(l.hours)) badges.push('<span class="badge badge-opening-soon">Opening Soon</span>');
        if (isClosingSoon(l.hours)) badges.push('<span class="badge badge-closing-soon">Closing Soon</span>');
        if (hasUnknownHours(l)) badges.push('<span class="badge badge-hours-unknown">Hours Unknown</span>');
        
        if (l.tier === 'FEATURED' || l.tier === 'PREMIUM') badges.push('<span class="badge badge-featured">Featured</span>');
        if (l.verified) badges.push('<span class="badge badge-verified">Verified</span>');
        if (!l.show_claim_button && l.tier === 'FREE') badges.push('<span class="badge badge-claimed">Claimed</span>');
        
        const isStarred = starredListings.includes(l.id);
        
        return `
            <a href="${listingUrl}" class="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-3 flex gap-3 block relative" style="margin-right: 8px;">
                <button class="star-button ${isStarred ? 'starred' : ''}" onclick="toggleStar('${l.id}', event)" style="top: 8px; right: 8px; width: 32px; height: 32px;">
                    <svg class="star-icon" style="width: 16px; height: 16px;" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                </button>
                <img src="${l.logo}" alt="${l.business_name}" class="w-16 h-16 rounded-lg object-cover flex-shrink-0">
                <div class="flex-1 min-w-0 overflow-hidden pr-8">
                    <div class="flex gap-1 mb-1 flex-wrap">
                        ${badges.join('')}
                    </div>
                    <h3 class="text-base font-bold text-gray-900 mb-1 truncate">${l.business_name}</h3>
                    <p class="text-xs text-gray-600 mb-1 truncate">${l.tagline || l.description}</p>
                    <div class="text-xs text-gray-600">
                        <div class="flex items-center gap-1 truncate">
                            <span>📍</span>
                            <span class="truncate">${fullAddress}</span>
                        </div>
                    </div>
                </div>
            </a>
        `;
    }).join('');
}

function initSplitMap() {
    const splitMapDiv = document.getElementById('splitMap');
    if (!splitMapDiv) return;
    const splitMap = L.map('splitMap', { 
        center: defaultMapCenter, 
        zoom: defaultMapZoom, 
        zoomControl: true,
        scrollWheelZoom: false
    });
    
    splitMap.on('click', function() {
        splitMap.scrollWheelZoom.enable();
    });
    splitMap.on('mouseout', function() {
        splitMap.scrollWheelZoom.disable();
    });
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: null, maxZoom: 19
    }).addTo(splitMap);
    const splitMarkerClusterGroup = L.markerClusterGroup({
        maxClusterRadius: 50, disableClusteringAtZoom: 18, spiderfyOnMaxZoom: true,
        showCoverageOnHover: false, zoomToBoundsOnClick: true,
        iconCreateFunction: function(cluster) {
            const count = cluster.getChildCount();
            let size = count >= 50 ? 'large' : count >= 10 ? 'medium' : 'small';
            return L.divIcon({
                html: `<div class="marker-cluster marker-cluster-${size}">${count}</div>`,
                className: '', iconSize: size === 'small' ? [40, 40] : size === 'medium' ? [50, 50] : [60, 60]
            });
        }
    });
    splitMap.addLayer(splitMarkerClusterGroup);
    if (userLocation) {
        const userIcon = L.divIcon({
            html: '<div style="width: 16px; height: 16px; background: #4285F4; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 8px rgba(0,0,0,0.3);"></div>',
            className: '', iconSize: [22, 22], iconAnchor: [11, 11]
        });
        L.marker([userLocation.lat, userLocation.lng], {
            icon: userIcon, zIndexOffset: 1000
        }).addTo(splitMap).bindPopup('<strong>Your Location</strong>');
    }
    const bounds = [];
    filteredListings.forEach(listing => {
        if (listing.coordinates && !isBasedIn(listing)) {
            const openStatus = isOpenNow(listing.hours);
            const isFeatured = listing.tier === 'FEATURED' || listing.tier === 'PREMIUM';
            const iconClass = isFeatured ? 'custom-marker featured' : 'custom-marker';
            const iconHtml = `<div class="${iconClass}"><img src="${listing.logo}" alt="${listing.business_name}"></div>`;
            const customIcon = L.divIcon({ html: iconHtml, className: '', iconSize: [40, 40], iconAnchor: [20, 20] });
            const marker = L.marker([listing.coordinates.lat, listing.coordinates.lng], { icon: customIcon, riseOnHover: true });
            const badges = [];
            
            if (openStatus === true) badges.push('<span class="badge badge-open">Open</span>');
            else if (openStatus === false) badges.push('<span class="badge badge-closed">Closed</span>');
            if (isOpeningSoon(listing.hours)) badges.push('<span class="badge badge-opening-soon">Opening Soon</span>');
            if (isClosingSoon(listing.hours)) badges.push('<span class="badge badge-closing-soon">Closing Soon</span>');
            if (hasUnknownHours(listing)) badges.push('<span class="badge badge-hours-unknown">Hours Unknown</span>');
            
            if (isFeatured) badges.push('<span class="badge badge-featured">Featured</span>');
            if (listing.verified) badges.push('<span class="badge badge-verified">Verified</span>');
            if (!listing.show_claim_button && listing.tier === 'FREE') badges.push('<span class="badge badge-claimed">Claimed</span>');
            
            const categorySlug = listing.category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            const firstPhoto = listing.photos && listing.photos.length > 0 ? listing.photos[0] : listing.logo;
            const popupContent = `
                <div class="map-popup">
                    <img src="${firstPhoto}" alt="${listing.business_name}" class="map-popup-hero">
                    <div class="map-popup-content">
                        <img src="${listing.logo}" alt="${listing.business_name}" class="map-popup-logo">
                        <div class="map-popup-info">
                            <div class="map-popup-badges">${badges.join('')}</div>
                            <a href="/listing/${categorySlug}/${listing.slug}" class="map-popup-title">${listing.business_name}</a>
                            <div class="map-popup-tagline">${listing.tagline || listing.description.substring(0, 60) + '...'}</div>
                            <div class="map-popup-details">📍 ${getFullAddress(listing)}<br>${listing.phone ? '📞 ' + listing.phone : ''}</div>
                        </div>
                    </div>
                </div>
            `;
            marker.bindPopup(popupContent, { maxWidth: 320, className: 'custom-popup' });
            marker.on('popupopen', () => {
                const closeBtn = document.querySelector('.leaflet-popup-close-button');
                if (closeBtn) closeBtn.textContent = '×';
            });
            splitMarkerClusterGroup.addLayer(marker);
            bounds.push([listing.coordinates.lat, listing.coordinates.lng]);
        }
    });
    if (bounds.length > 0) splitMap.fitBounds(L.latLngBounds(bounds), { padding: [50, 50], maxZoom: 15 });
    setTimeout(() => splitMap.invalidateSize(), 250);
}

window.toggleSplitView = toggleSplitView;
// ============================================
// LISTINGS PAGE JAVASCRIPT - PART 9
// Geocoding & Final Functions
// ============================================

async function geocodeAllListings() {
    let geocodedCount = 0;
    for (let listing of allListings) {
        if (!listing.coordinates && listing.address && !isBasedIn(listing)) {
            await geocodeListing(listing);
            geocodedCount++;
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    allListingsGeocoded = true;
    if (map && mapReady) {
        hideMapLoading();
        updateMapMarkers();
    }
}

async function geocodeListing(listing) {
    const fullAddress = getFullAddress(listing);
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}&limit=1`);
        const data = await response.json();
        if (data && data.length > 0) {
            listing.coordinates = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        }
    } catch (e) {
        console.error('Geocoding failed for', listing.business_name, e);
    }
}

function switchLanguage(lang) {
    currentLanguage = lang;
    setCookie('language', lang, 365);
    
    document.querySelectorAll('.lang-btn').forEach(btn => {
        if (btn.dataset.lang === lang) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    translatePage();
}

function translatePage() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (TRANSLATIONS[currentLanguage] && TRANSLATIONS[currentLanguage][key]) {
            el.textContent = TRANSLATIONS[currentLanguage][key];
        }
    });
    
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (TRANSLATIONS[currentLanguage] && TRANSLATIONS[currentLanguage][key]) {
            el.placeholder = TRANSLATIONS[currentLanguage][key];
        }
    });
    
    updateRadiusValue();
}

window.switchLanguage = switchLanguage;
// ============================================
// LISTINGS PAGE JAVASCRIPT - PART 10
// Starred Listings & Cookie Management
// ============================================

let starredListings = [];

function loadStarredListings() {
    const stored = getCookie('starredListings');
    if (stored) {
        try {
            starredListings = JSON.parse(stored);
        } catch (e) {
            starredListings = [];
        }
    }
    updateStarredCount();
}

function saveStarredListings() {
    setCookie('starredListings', JSON.stringify(starredListings), 365);
    updateStarredCount();
}

function toggleStar(listingId, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    const index = starredListings.indexOf(listingId);
    if (index > -1) {
        starredListings.splice(index, 1);
    } else {
        starredListings.push(listingId);
    }
    
    saveStarredListings();
    renderListings();
}

function updateStarredCount() {
    const countEl = document.getElementById('starredCount');
    if (countEl) {
        countEl.textContent = starredListings.length;
    }
}

function toggleStarredView() {
    const viewingStarredOnly = filteredListings.length > 0 && 
                               filteredListings.every(l => starredListings.includes(l.id));
    
    if (viewingStarredOnly) {
        // Return to normal view
        applyFilters();
        const starredBtn = document.getElementById('starredBtn');
        if (starredBtn) {
            starredBtn.style.backgroundColor = '';
            starredBtn.style.color = '';
        }
    } else {
        // Show only starred
        if (starredListings.length === 0) {
            alert("You haven't starred any listings yet!");
            return;
        }
        
        filteredListings = allListings.filter(l => starredListings.includes(l.id));
        currentPage = 1;
        renderListings();
        
        const starredBtn = document.getElementById('starredBtn');
        if (starredBtn) {
            starredBtn.style.backgroundColor = '#fbbf24';
            starredBtn.style.color = '#78350f';
        }
        
        // Update results count
        const countEl = document.getElementById('resultsCount');
        if (countEl) {
            countEl.textContent = `Showing ${filteredListings.length} starred ${filteredListings.length === 1 ? 'listing' : 'listings'}`;
        }
    }
}

function setCookie(name, value, days) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = name + '=' + encodeURIComponent(value) + '; expires=' + expires + '; path=/';
}

function getCookie(name) {
    return document.cookie.split('; ').reduce((r, v) => {
        const parts = v.split('=');
        return parts[0] === name ? decodeURIComponent(parts[1]) : r;
    }, '');
}

// Make functions globally available
window.toggleStar = toggleStar;
window.toggleStarredView = toggleStarredView;

// Load starred listings on page load
document.addEventListener('DOMContentLoaded', () => {
    loadStarredListings();
    
    const starredBtn = document.getElementById('starredBtn');
    if (starredBtn) {
        starredBtn.addEventListener('click', toggleStarredView);
    }
});
// ============================================
// LISTINGS PAGE JAVASCRIPT - PART 11
// Analytics Tracking
// ============================================

async function trackAnalytics(listingId, action, platform = null) {
    try {
        const payload = {
            event_type: 'track_analytics',
            client_payload: {
                listingId: listingId,
                action: action,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent
            }
        };
        
        if (action === 'share' && platform) {
            payload.client_payload.platform = platform;
        }
        
        await fetch('https://api.github.com/repos/thegreekdirectory/listings/dispatches', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github+json'
            },
            body: JSON.stringify(payload)
        });
    } catch (e) {
        console.log('Analytics tracking error:', e.message);
    }
}

// Track page view
window.addEventListener('load', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const listingId = urlParams.get('id');
    if (listingId) {
        trackAnalytics(listingId, 'view');
    }
});

// Track clicks on listings
document.addEventListener('click', (e) => {
    const listingCard = e.target.closest('.listing-card, .listing-row');
    if (listingCard) {
        const url = listingCard.href;
        if (url) {
            const match = url.match(/listing\/[^\/]+\/([^\/\?]+)/);
            if (match) {
                const slug = match[1];
                const listing = allListings.find(l => l.slug === slug);
                if (listing) {
                    trackAnalytics(listing.id, 'view');
                }
            }
        }
    }
});

window.trackAnalytics = trackAnalytics;
// ============================================
// LISTINGS PAGE JAVASCRIPT - PART 12
// URL Parameter Handling & Deep Linking
// ============================================

function loadFiltersFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Search query
    const searchQuery = urlParams.get('q');
    if (searchQuery) {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.value = searchQuery;
        }
    }
    
    // Category
    const category = urlParams.get('category');
    if (category) {
        const decodedCategory = decodeURIComponent(category);
        selectedCategories = [decodedCategory];
    }
    
    // Subcategories
    const subcategories = urlParams.get('subcategories');
    if (subcategories) {
        selectedSubcategories = subcategories.split(',').map(s => decodeURIComponent(s));
    }
    
    // Subcategory mode
    const subMode = urlParams.get('submode');
    if (subMode === 'all' || subMode === 'any') {
        subcategoryMode = subMode;
        window.setSubcategoryMode(subMode);
    }
    
    // Country
    const country = urlParams.get('country');
    if (country) {
        selectedCountry = country;
    }
    
    // State
    const state = urlParams.get('state');
    if (state) {
        selectedState = state;
    }
    
    // Radius
    const radius = urlParams.get('radius');
    if (radius) {
        radiusKm = parseInt(radius);
    }
    
    // Hours filters
    if (urlParams.get('open') === 'true') {
        const openNowFilter = document.getElementById('openNowFilter');
        const openNowFilter2 = document.getElementById('openNowFilter2');
        if (openNowFilter) openNowFilter.checked = true;
        if (openNowFilter2) openNowFilter2.checked = true;
    }
    
    if (urlParams.get('closed') === 'true') {
        const closedNowFilter = document.getElementById('closedNowFilter');
        const closedNowFilter2 = document.getElementById('closedNowFilter2');
        if (closedNowFilter) closedNowFilter.checked = true;
        if (closedNowFilter2) closedNowFilter2.checked = true;
    }
    
    if (urlParams.get('opening') === 'true') {
        const openingSoonFilter = document.getElementById('openingSoonFilter');
        const openingSoonFilter2 = document.getElementById('openingSoonFilter2');
        if (openingSoonFilter) openingSoonFilter.checked = true;
        if (openingSoonFilter2) openingSoonFilter2.checked = true;
    }
    
    if (urlParams.get('closing') === 'true') {
        const closingSoonFilter = document.getElementById('closingSoonFilter');
        const closingSoonFilter2 = document.getElementById('closingSoonFilter2');
        if (closingSoonFilter) closingSoonFilter.checked = true;
        if (closingSoonFilter2) closingSoonFilter2.checked = true;
    }
    
    if (urlParams.get('hours') === 'unknown') {
        const hoursUnknownFilter = document.getElementById('hoursUnknownFilter');
        const hoursUnknownFilter2 = document.getElementById('hoursUnknownFilter2');
        if (hoursUnknownFilter) hoursUnknownFilter.checked = true;
        if (hoursUnknownFilter2) hoursUnknownFilter2.checked = true;
    }
    
    if (urlParams.get('online') === 'true') {
        const onlineOnlyFilter = document.getElementById('onlineOnlyFilter');
        const onlineOnlyFilter2 = document.getElementById('onlineOnlyFilter2');
        if (onlineOnlyFilter) onlineOnlyFilter.checked = true;
        if (onlineOnlyFilter2) onlineOnlyFilter2.checked = true;
    }
    
    // Apply loaded filters
    syncDualFilters();
    renderSubcategoryFilters();
}

function updateURL() {
    const url = new URL(window.location);
    url.search = '';
    
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput?.value.trim() || '';
    
    if (selectedCategories.length > 0) {
        url.searchParams.set('category', encodeURIComponent(selectedCategories[0]));
    }
    
    if (selectedSubcategories.length > 0) {
        url.searchParams.set('subcategories', selectedSubcategories.map(s => encodeURIComponent(s)).join(','));
        url.searchParams.set('submode', subcategoryMode);
    }
    
    if (selectedCountry) {
        url.searchParams.set('country', selectedCountry);
    }
    
    if (selectedState) {
        url.searchParams.set('state', selectedState);
    }
    
    if (radiusKm > 0) {
        url.searchParams.set('radius', radiusKm);
    }
    
    const openNowFilter = document.getElementById('openNowFilter');
    if (openNowFilter?.checked) {
        url.searchParams.set('open', 'true');
    }
    
    const closedNowFilter = document.getElementById('closedNowFilter');
    if (closedNowFilter?.checked) {
        url.searchParams.set('closed', 'true');
    }
    
    const openingSoonFilter = document.getElementById('openingSoonFilter');
    if (openingSoonFilter?.checked) {
        url.searchParams.set('opening', 'true');
    }
    
    const closingSoonFilter = document.getElementById('closingSoonFilter');
    if (closingSoonFilter?.checked) {
        url.searchParams.set('closing', 'true');
    }
    
    const hoursUnknownFilter = document.getElementById('hoursUnknownFilter');
    if (hoursUnknownFilter?.checked) {
        url.searchParams.set('hours', 'unknown');
    }
    
    const onlineOnlyFilter = document.getElementById('onlineOnlyFilter');
    if (onlineOnlyFilter?.checked) {
        url.searchParams.set('online', 'true');
    }
    
    if (searchTerm) {
        url.searchParams.set('q', searchTerm);
    }
    
    window.history.replaceState({}, '', url);
}

// Load filters from URL on page load
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        loadFiltersFromURL();
        applyFilters();
    }, 100);
});

// Update URL when filters change
const originalApplyFilters = applyFilters;
applyFilters = function() {
    originalApplyFilters();
    updateURL();
};
// ============================================
// LISTINGS PAGE JAVASCRIPT - PART 13 (FINAL)
// Utility Functions & Exports
// ============================================

// Update location subtitle based on current filters
function updateLocationSubtitle() {
    const locationSubtitle = document.getElementById('locationSubtitle');
    if (!locationSubtitle) return;
    
    if (customLocation) {
        locationSubtitle.textContent = `${customLocation.city}, ${customLocation.state}`;
    } else if (userLocation) {
        locationSubtitle.textContent = 'Your Location';
    } else if (selectedState) {
        const stateName = US_STATES[selectedState] || selectedState;
        locationSubtitle.textContent = `${stateName}`;
    } else if (selectedCountry) {
        locationSubtitle.textContent = selectedCountry;
    } else {
        locationSubtitle.textContent = 'All Locations';
    }
}

// Call this when filters change
const originalHandleCountryChange = handleCountryChange;
handleCountryChange = function(e) {
    originalHandleCountryChange(e);
    updateLocationSubtitle();
};

const originalHandleStateChange = handleStateChange;
handleStateChange = function(e) {
    originalHandleStateChange(e);
    updateLocationSubtitle();
};

// Refresh button for iOS web app
function isIOSWebApp() {
    return ('standalone' in window.navigator) && window.navigator.standalone;
}

if (isIOSWebApp()) {
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.style.display = 'flex';
    }
}

// Handle iOS web app status bar
if (isIOSWebApp()) {
    document.body.style.paddingTop = '20px';
}

// Export all necessary functions
window.listingsApp = {
    applyFilters,
    clearAllFilters,
    toggleFilterPanel,
    toggleMap,
    toggleSplitView,
    switchView,
    loadMoreListings,
    handleSearch,
    handleSort,
    handleCategoryChange,
    handleSubcategoryChange,
    handleCountryChange,
    handleStateChange,
    handleRadiusChange,
    handleLocationSearch,
    selectLocation,
    setSubcategoryMode,
    toggleStar,
    toggleStarredView,
    centerOnUserLocation,
    resetMap,
    trackAnalytics
};

console.log('✅ Listings page fully initialized');
