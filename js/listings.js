/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
This source code is proprietary and no part may not be used, reproduced, or distributed 
without written permission from The Greek Directory. Unauthorized use, copying, modification, 
or distribution of this code will result in legal action to the fullest extent permitted by law.
*/

// ============================================
// LISTINGS PAGE JAVASCRIPT - PART 1
// Configuration & State Management
// ============================================

const SUPABASE_URL = 'https://luetekzqrrgdxtopzvqw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1ZXRla3pxcnJnZHh0b3B6dnF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNDc2NDcsImV4cCI6MjA4MzkyMzY0N30.TIrNG8VGumEJc_9JvNHW-Q-UWfUGpPxR0v8POjWZJYg';

const CATEGORIES = [
    'Automotive & Transportation', 'Beauty & Health', 'Church & Religious Organization',
    'Cultural/Fraternal Organization', 'Education & Community', 'Entertainment, Arts & Recreation',
    'Food & Hospitality', 'Grocery & Imports', 'Home & Construction', 'Industrial & Manufacturing',
    'Pets & Veterinary', 'Professional & Business Services', 'Real Estate & Development', 'Retail & Shopping'
];

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
*/

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

let listingsSupabase = null;
let SUBCATEGORIES = {};
let allListings = [], filteredListings = [], currentView = 'grid', selectedCategory = 'All';
let selectedSubcategories = [], subcategoryMode = 'any', selectedCountry = '', selectedState = '';
let selectedRadius = 50, openNowOnly = false, closedNowOnly = false, openingSoonOnly = false;
let closingSoonOnly = false, hoursUnknownOnly = false, onlineOnly = false, userLocation = null;
let map = null, mapOpen = false, splitViewActive = false, filtersOpen = false;
let markerClusterGroup = null, defaultMapCenter = [41.8781, -87.6298], defaultMapZoom = 10;
let userLocationMarker = null, mapReady = false, allListingsGeocoded = false;
let starredListings = [], viewingStarredOnly = false, mapMoved = false, locationButtonActive = false;
let filterPosition = 'left';
let searchDebounceTimer = null;
let displayedListingsCount = 25;
let estimatedUserLocation = null;
// Track whether desktop filters are in overlay mode (when map is open)
let desktopFiltersOverlay = false;

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
*/

// SVG for the verified checkmark icon (white checkmark in blue circle)
const VERIFIED_CHECKMARK_SVG = `<svg style="width:20px;height:20px;flex-shrink:0;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="12" fill="#055193"/><path d="M7 12.5l3.5 3.5L17 9" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

function formatPhoneDisplay(phone) {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');
    if (phone.startsWith('+1') && digits.length === 11) {
        return `(${digits.substr(1, 3)}) ${digits.substr(4, 3)}-${digits.substr(7, 4)}`;
    }
    return phone;
}

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
    // If URL has ?starred=1, activate starred-only view after listings load
    if (new URLSearchParams(window.location.search).get('starred') === '1') {
        viewingStarredOnly = true;
    }
}

function saveStarredListings() {
    setCookie('starredListings', JSON.stringify(starredListings), 365);
    updateStarredCount();
}

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
*/

function toggleStar(listingId, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.

    const index = starredListings.indexOf(listingId);
    if (index > -1) {
        starredListings.splice(index, 1);
    } else {
        starredListings.push(listingId);
    }
    saveStarredListings();

    // Update every star button for this listing (matched by data-listing-id)
    document.querySelectorAll('.star-button[data-listing-id="' + listingId + '"]').forEach(btn => {
        if (starredListings.includes(listingId)) {
            btn.classList.add('starred');
        } else {
            btn.classList.remove('starred');
        }
    });

    // If viewing starred-only, re-filter (listing may have just been unstarred)
    if (viewingStarredOnly) {
        filteredListings = allListings.filter(l => starredListings.includes(l.id));
        displayedListingsCount = filteredListings.length;
        renderListings();
        updateResultsCount();
    }
}

function updateStarredCount() {
    const countEl = document.getElementById('starredCount');
    if (countEl) {
        countEl.textContent = starredListings.length;
    }
    const headerCountEl = document.getElementById('headerStarredCount');
    if (headerCountEl) {
        headerCountEl.textContent = starredListings.length;
    }
}

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
*/

function toggleStarredView() {
    viewingStarredOnly = !viewingStarredOnly;
    const starredBtn = document.getElementById('starredBtn');
    
    if (viewingStarredOnly) {
        if (starredListings.length === 0) {
            alert('You haven\'t starred any listings yet!');
            viewingStarredOnly = false;
            return;
        }
        filteredListings = allListings.filter(l => starredListings.includes(l.id));
        displayedListingsCount = filteredListings.length;
        document.getElementById('resultsCount').textContent = `${filteredListings.length} starred ${filteredListings.length === 1 ? 'listing' : 'listings'}`;
        if (starredBtn) {
            starredBtn.style.backgroundColor = '#fbbf24';
            starredBtn.style.color = '#78350f';
        }
    } else {
        displayedListingsCount = 25;
        applyFilters();
        if (starredBtn) {
            starredBtn.style.backgroundColor = '';
            starredBtn.style.color = '';
        }
    }
    renderListings();
    updateResultsCount();
}

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
*/

function setCookie(name, value, days) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = name + '=' + encodeURIComponent(value) + '; expires=' + expires + '; path=/; SameSite=Lax';
}

function getCookie(name) {
    const nameEQ = name + '=';
    const cookies = document.cookie.split('; ');
    for (let i = 0; i < cookies.length; i++) {
        if (cookies[i].indexOf(nameEQ) === 0) {
            return decodeURIComponent(cookies[i].substring(nameEQ.length));
        }
    }
    return '';
}

function isIOSWebApp() {
    return ('standalone' in window.navigator) && window.navigator.standalone;
}

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
*/

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

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
*/

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

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
*/

document.addEventListener('DOMContentLoaded', () => {
    if (isIOSWebApp()) {
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) refreshBtn.style.display = 'flex';
    }
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
});

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
This source code is proprietary and no part may not be used, reproduced, or distributed 
without written permission from The Greek Directory. Unauthorized use, copying, modification, 
or distribution of this code will result in legal action to the fullest extent permitted by law.
*/
/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
This source code is proprietary and no part may not be used, reproduced, or distributed 
without written permission from The Greek Directory. Unauthorized use, copying, modification, 
or distribution of this code will result in legal action to the fullest extent permitted by law.
*/

// ============================================
// LISTINGS PAGE JAVASCRIPT - PART 2
// Filter Position & URL Management
// ============================================

function checkFilterPosition() {
    const screenWidth = window.innerWidth;
    const toggleBtn = document.getElementById('toggleFilterPosition');
    const desktopLayout = document.getElementById('desktopLayout');
    const desktopFilters = document.getElementById('desktopFiltersContainer');
    const mapBtn = document.getElementById('mapBtnDesktop');
    const listingsContainer = document.getElementById('listingsContainer');
    const desktopFilterToggleBtn = document.getElementById('desktopFilterToggleBtn');
    
    if (screenWidth >= 1024) {
        if (toggleBtn) toggleBtn.style.display = 'block';
        if (mapBtn) mapBtn.classList.remove('hidden');
        
        if (filterPosition === 'left' && !mapOpen) {
            // Sidebar visible — hide the toggle button
            if (desktopLayout) desktopLayout.classList.add('with-left-filters');
            if (desktopFilters) {
                desktopFilters.classList.remove('hidden');
                desktopFilters.classList.remove('desktop-filters-overlay');
            }
            if (desktopFilterToggleBtn) desktopFilterToggleBtn.style.display = 'none';
            if (currentView === 'grid' && listingsContainer) {
                listingsContainer.classList.remove('listings-3-col');
                listingsContainer.classList.add('listings-2-col');
            }
        } else if (filterPosition === 'left' && mapOpen && !splitViewActive) {
            // Full-mode map: sidebar stays next to the listings column (below the map).
            if (desktopLayout) desktopLayout.classList.add('with-left-filters');
            if (desktopFilters) {
                desktopFilters.classList.remove('hidden');
                desktopFilters.classList.remove('desktop-filters-overlay');
            }
            desktopFiltersOverlay = false;
            if (desktopFilterToggleBtn) desktopFilterToggleBtn.style.display = 'none';
            if (currentView === 'grid' && listingsContainer) {
                listingsContainer.classList.remove('listings-3-col');
                listingsContainer.classList.add('listings-2-col');
            }
        } else if (filterPosition === 'left' && mapOpen && splitViewActive) {
            // Split-view mode: hide the sidebar entirely (split view has its own layout)
            if (desktopLayout) desktopLayout.classList.remove('with-left-filters');
            if (desktopFilters) {
                desktopFilters.classList.add('hidden');
                desktopFilters.classList.remove('desktop-filters-overlay');
            }
            desktopFiltersOverlay = false;
            if (desktopFilterToggleBtn) desktopFilterToggleBtn.style.display = 'none';
            if (currentView === 'grid' && listingsContainer) {
                listingsContainer.classList.remove('listings-2-col');
                listingsContainer.classList.add('listings-3-col');
            }
        } else {
            // filterPosition === 'top' (filters collapsed) — show toggle button
            if (desktopLayout) desktopLayout.classList.remove('with-left-filters');
            if (desktopFilters) {
                desktopFilters.classList.add('hidden');
                desktopFilters.classList.remove('desktop-filters-overlay');
            }
            desktopFiltersOverlay = false;
            if (desktopFilterToggleBtn) desktopFilterToggleBtn.style.display = 'flex';
            if (currentView === 'grid' && listingsContainer) {
                listingsContainer.classList.remove('listings-2-col');
                listingsContainer.classList.add('listings-3-col');
            }
        }
    } else {
        // Mobile
        if (toggleBtn) toggleBtn.style.display = 'none';
        if (desktopLayout) desktopLayout.classList.remove('with-left-filters');
        if (desktopFilters) {
            desktopFilters.classList.add('hidden');
            desktopFilters.classList.remove('desktop-filters-overlay');
        }
        desktopFiltersOverlay = false;
        if (desktopFilterToggleBtn) desktopFilterToggleBtn.style.display = 'none';
        if (mapBtn) mapBtn.classList.add('hidden');
        if (currentView === 'grid' && listingsContainer) {
            listingsContainer.classList.remove('listings-2-col', 'listings-3-col');
        }
    }
}

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
*/

function loadFiltersFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('q');
    if (searchQuery) {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) searchInput.value = searchQuery;
    }
    
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
        const countryFilter = document.getElementById('countryFilter');
        const countryFilter2 = document.getElementById('countryFilter2');
        if (countryFilter) countryFilter.value = country;
        if (countryFilter2) countryFilter2.value = country;
        
        if (country === 'USA') {
            const stateContainer = document.getElementById('stateFilterContainer');
            const stateContainer2 = document.getElementById('stateFilterContainer2');
            if (stateContainer) stateContainer.classList.remove('hidden');
            if (stateContainer2) stateContainer2.classList.remove('hidden');
            populateStateFilter('USA');
        }
    }
    
    const state = urlParams.get('state');
    if (state) {
        selectedState = state;
        const stateFilter = document.getElementById('stateFilter');
        const stateFilter2 = document.getElementById('stateFilter2');
        if (stateFilter) stateFilter.value = state;
        if (stateFilter2) stateFilter2.value = state;
    }
    
    const radius = urlParams.get('radius');
    if (radius) {
        selectedRadius = parseInt(radius);
        const radiusFilter = document.getElementById('radiusFilter');
        const radiusFilter2 = document.getElementById('radiusFilter2');
        if (radiusFilter) radiusFilter.value = radius;
        if (radiusFilter2) radiusFilter2.value = radius;
        updateRadiusValue();
    }
    
    if (urlParams.get('open') === 'true') {
        openNowOnly = true;
        const openFilter = document.getElementById('openNowFilter');
        const openFilter2 = document.getElementById('openNowFilter2');
        if (openFilter) openFilter.checked = true;
        if (openFilter2) openFilter2.checked = true;
    }
    
    if (urlParams.get('closed') === 'true') {
        closedNowOnly = true;
        const closedFilter = document.getElementById('closedNowFilter');
        const closedFilter2 = document.getElementById('closedNowFilter2');
        if (closedFilter) closedFilter.checked = true;
        if (closedFilter2) closedFilter2.checked = true;
    }
    
    if (urlParams.get('opening') === 'true') {
        openingSoonOnly = true;
        const openingSoonFilter = document.getElementById('openingSoonFilter');
        const openingSoonFilter2 = document.getElementById('openingSoonFilter2');
        if (openingSoonFilter) openingSoonFilter.checked = true;
        if (openingSoonFilter2) openingSoonFilter2.checked = true;
    }
    
    if (urlParams.get('closing') === 'true') {
        closingSoonOnly = true;
        const closingSoonFilter = document.getElementById('closingSoonFilter');
        const closingSoonFilter2 = document.getElementById('closingSoonFilter2');
        if (closingSoonFilter) closingSoonFilter.checked = true;
        if (closingSoonFilter2) closingSoonFilter2.checked = true;
    }
    
    if (urlParams.get('hours') === 'unknown') {
        hoursUnknownOnly = true;
        const hoursUnknownFilter = document.getElementById('hoursUnknownFilter');
        const hoursUnknownFilter2 = document.getElementById('hoursUnknownFilter2');
        if (hoursUnknownFilter) hoursUnknownFilter.checked = true;
        if (hoursUnknownFilter2) hoursUnknownFilter2.checked = true;
    }
    
    if (urlParams.get('online') === 'true') {
        onlineOnly = true;
        const onlineFilter = document.getElementById('onlineOnlyFilter');
        const onlineFilter2 = document.getElementById('onlineOnlyFilter2');
        if (onlineFilter) onlineFilter.checked = true;
        if (onlineFilter2) onlineFilter2.checked = true;
    }

    // Re-render category & subcategory buttons so they reflect the URL state.
    // createCategoryButtons() already ran once during init (with selectedCategory still 'All'),
    // so we must call it again now that selectedCategory may have been updated from the URL.
    createCategoryButtons();
    updateSubcategoryDisplay();
}

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
*/

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

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
*/

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

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
*/

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

window.toggleStar = toggleStar;

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
This source code is proprietary and no part may not be used, reproduced, or distributed 
without written permission from The Greek Directory. Unauthorized use, copying, modification, 
or distribution of this code will result in legal action to the fullest extent permitted by law.
*/
/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
This source code is proprietary and no part may not be used, reproduced, or distributed 
without written permission from The Greek Directory. Unauthorized use, copying, modification, 
or distribution of this code will result in legal action to the fullest extent permitted by law.
*/

// ============================================
// LISTINGS PAGE JAVASCRIPT - PART 3
// Load Listings & Filtering Logic
// ============================================

async function loadListings() {
    try {
        listingsSupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        
        const { data, error } = await listingsSupabase
            .from('listings')
            .select('*')
            .eq('visible', true)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        allListings = data || [];
        filteredListings = [...allListings];
        
        SUBCATEGORIES = extractSubcategoriesFromListings(allListings);
        console.log('Loaded subcategories:', SUBCATEGORIES);
        
        populateCountryFilter();
        updateLocationSubtitle();
        applyFilters();
        // If ?starred=1 was set (flag set by loadStarredListings before listings arrived),
        // now filter down to starred only and update the count display.
        if (viewingStarredOnly) {
            if (starredListings.length === 0) {
                viewingStarredOnly = false;
            } else {
                filteredListings = allListings.filter(l => starredListings.includes(l.id));
                displayedListingsCount = filteredListings.length;
            }
        }
        updateResultsCount();
        renderListings();
        geocodeAllListings();
    } catch (error) {
        console.error('Error loading listings:', error);
        const listingsContainer = document.getElementById('listingsContainer');
        if (listingsContainer) {
            listingsContainer.innerHTML = '<p class="text-center text-gray-600 py-12">Error loading listings. Please try again.</p>';
        }
    }
}

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
*/

function applyFilters() {
    const searchInput = document.getElementById('searchInput');
    const searchTerm = normalizeString(searchInput ? searchInput.value : '');
    const sortSelect = document.getElementById('sortSelect');
    const sortOption = sortSelect ? sortSelect.value : 'default';
    
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
    
    /*
    Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    */
    
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
    
    // SORTING LOGIC WITH RANDOM OPTION
    filteredListings.sort((a, b) => {
        if (sortOption === 'random') {
            return Math.random() - 0.5;
        } else if (sortOption === 'default') {
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
    
    /*
    Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    */
    
    displayedListingsCount = 25;
    renderListings();
    updateResultsCount();
    if (map) updateMapMarkers();
}

function loadMoreListings() {
    displayedListingsCount += 25;
    renderListings();
}

function normalizeString(str) {
    return str.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
}

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
*/

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

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
*/

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

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
*/

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

function isBasedIn(listing) {
    return listing.city && listing.state && !listing.address;
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

// ============================================
// BADGE & CHECKMARK HELPER
// Centralised logic: tag hierarchy + verified checkmark
// - Featured listings: "Featured" badge only (no Verified, no Claimed)
// - Verified listings (non-Featured): "Verified" badge only (no Claimed)
// - No "Claimed" badge anywhere; no "Hours Unknown" badge anywhere
// - Verified listings get a checkmark icon rendered separately next to the name
// ============================================

function buildBadges(listing) {
    const badges = [];
    const openStatus = isOpenNow(listing.hours);
    const openingSoon = isOpeningSoon(listing.hours);
    const closingSoon = isClosingSoon(listing.hours);

    // Only ONE hours-status badge: the most specific state wins.
    // Closed + Opening Soon → "Opening Soon" only.
    // Open + Closing Soon   → "Closing Soon" only.
    // Open  (not closing)   → "Open".
    // Closed (not opening)  → "Closed".
    if (openingSoon) {
        badges.push('<span class="badge badge-opening-soon">Opening Soon</span>');
    } else if (closingSoon) {
        badges.push('<span class="badge badge-closing-soon">Closing Soon</span>');
    } else if (openStatus === true) {
        badges.push('<span class="badge badge-open">Open</span>');
    } else if (openStatus === false) {
        badges.push('<span class="badge badge-closed">Closed</span>');
    }

    // Tier / verification hierarchy:
    // FEATURED or PREMIUM → show "Featured" badge only
    // VERIFIED tier OR verified flag (but not featured) → show "Verified" badge only
    // FREE tier with show_claim_button === false → nothing (no Claimed badge)
    const isFeatured = listing.tier === 'FEATURED' || listing.tier === 'PREMIUM';
    const isVerified  = listing.verified || listing.tier === 'VERIFIED';

    if (isFeatured) {
        badges.push('<span class="badge badge-featured">Featured</span>');
    } else if (isVerified) {
        badges.push('<span class="badge badge-verified">Verified</span>');
    }
    // No "Claimed" badge, no "Hours Unknown" badge

    return badges;
}

// Returns true if the listing should show the verified-checkmark icon next to its name.
// Shown for: Featured/Premium tier, Verified tier, or any listing where the business
// has claimed it (show_claim_button === false).
function showsVerifiedCheckmark(listing) {
    const isFeatured = listing.tier === 'FEATURED' || listing.tier === 'PREMIUM';
    const isVerified  = listing.verified || listing.tier === 'VERIFIED';
    return isFeatured || isVerified || listing.show_claim_button === false;
}

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
This source code is proprietary and no part may not be used, reproduced, or distributed 
without written permission from The Greek Directory. Unauthorized use, copying, modification, 
or distribution of this code will result in legal action to the fullest extent permitted by law.
*/
/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
This source code is proprietary and no part may not be used, reproduced, or distributed 
without written permission from The Greek Directory. Unauthorized use, copying, modification, 
or distribution of this code will result in legal action to the fullest extent permitted by law.
*/

// ============================================
// LISTINGS PAGE JAVASCRIPT - PART 4
// Rendering Functions
// ============================================

function renderListings() {
    const container = document.getElementById('listingsContainer');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    
    if (!container) return;
    
    const displayedListings = filteredListings.slice(0, displayedListingsCount);
    const hasMore = displayedListingsCount < filteredListings.length;
    
    if (filteredListings.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-600 py-12">No listings found.</p>';
        if (loadMoreBtn) loadMoreBtn.classList.add('hidden');
        return;
    }

    if (currentView === 'grid') {
        const screenWidth = window.innerWidth;
        let gridClass = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';
        
        if (screenWidth >= 1024) {
            if (filterPosition === 'left' && !mapOpen) {
                gridClass = 'grid grid-cols-1 md:grid-cols-2 gap-6 listings-2-col';
            } else {
                gridClass = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 listings-3-col';
            }
        }
        
        container.className = gridClass;
        container.innerHTML = displayedListings.map(l => {
            const firstPhoto = l.photos && l.photos.length > 0 ? l.photos[0] : (l.logo || '');
            const fullAddress = getFullAddress(l);
            const categorySlug = l.category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            const listingUrl = `/listing/${categorySlug}/${l.slug}`;
            const badges = buildBadges(l);
            const isStarred = starredListings.includes(l.id);
            const logoImage = l.logo || '';
            const checkmarkHtml = showsVerifiedCheckmark(l) ? VERIFIED_CHECKMARK_SVG : '';
            
            return `
                <a href="${listingUrl}" class="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden block relative">
                    <button class="star-button ${isStarred ? 'starred' : ''}" data-listing-id="${l.id}">
                        <svg class="star-icon" viewBox="0 0 24 24">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                    </button>
                    <div class="h-48 bg-gray-200 relative">
                        ${firstPhoto ? `<img src="${firstPhoto}" alt="${l.business_name}" class="w-full h-full object-cover">` : '<div class="w-full h-full flex items-center justify-center text-gray-400">No image</div>'}
                        ${badges.length > 0 ? `<div class="absolute top-2 left-2 flex gap-2 flex-wrap">${badges.join('')}</div>` : ''}
                    </div>
                    <div class="p-4">
                        <div class="flex gap-3 mb-3">
                            ${logoImage ? `<img src="${logoImage}" alt="${l.business_name} logo" class="w-16 h-16 rounded object-cover flex-shrink-0">` : '<div class="w-16 h-16 rounded bg-gray-200 flex-shrink-0 flex items-center justify-center text-gray-400 text-xs">No logo</div>'}
                            <div class="flex-1 min-w-0">
                                <span class="text-xs font-semibold px-2 py-1 rounded-full text-white block w-fit mb-2" style="background-color:#055193;">${l.category}</span>
                                <h3 class="text-lg font-bold text-gray-900 line-clamp-1 flex items-center gap-1.5">${l.business_name} ${checkmarkHtml}</h3>
                            </div>
                        </div>
                        <p class="text-sm text-gray-600 mb-3 line-clamp-2">${l.tagline || l.description}</p>
                        <div class="text-sm text-gray-600 space-y-1">
                            <div class="flex items-center gap-2">
                                <svg class="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                                <span class="truncate">${fullAddress}</span>
                            </div>
                            ${l.phone ? `<div class="flex items-center gap-2"><svg class="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg><span class="truncate">${formatPhoneDisplay(l.phone)}</span></div>` : ''}
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
            const listingUrl = `/listing/${categorySlug}/${l.slug}`;
            const badges = buildBadges(l);
            const isStarred = starredListings.includes(l.id);
            const logoImage = l.logo || '';
            const checkmarkHtml = showsVerifiedCheckmark(l) ? VERIFIED_CHECKMARK_SVG : '';
            
            return `
                <a href="${listingUrl}" class="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-4 flex gap-4 block relative">
                    <button class="star-button ${isStarred ? 'starred' : ''}" data-listing-id="${l.id}" style="top: 12px; right: 12px;">
                        <svg class="star-icon" viewBox="0 0 24 24">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                    </button>
                    ${logoImage ? `<img src="${logoImage}" alt="${l.business_name}" class="w-24 h-24 rounded-lg object-cover flex-shrink-0">` : '<div class="w-24 h-24 rounded-lg bg-gray-200 flex-shrink-0 flex items-center justify-center text-gray-400 text-xs">No logo</div>'}
                    <div class="flex-1 min-w-0 overflow-hidden pr-12">
                        <div class="flex gap-2 mb-2 flex-wrap">
                            <span class="text-xs font-semibold px-2 py-1 rounded-full text-white" style="background-color:#055193;">${l.category}</span>
                            ${badges.join('')}
                        </div>
                        <h3 class="text-lg font-bold text-gray-900 mb-1 truncate flex items-center gap-1.5">${l.business_name} ${checkmarkHtml}</h3>
                        <p class="text-sm text-gray-600 mb-2 line-clamp-1">${l.tagline || l.description}</p>
                        <div class="flex flex-col gap-1 text-sm text-gray-600">
                            <div class="flex items-center gap-1">
                                <svg class="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                                <span class="truncate">${fullAddress}</span>
                            </div>
                            ${l.phone ? `<div class="flex items-center gap-1"><svg class="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg><span class="truncate">${formatPhoneDisplay(l.phone)}</span></div>` : ''}
                        </div>
                    </div>
                </a>
            `;
        }).join('');
    }
    
    if (loadMoreBtn) {
        if (hasMore) {
            loadMoreBtn.classList.remove('hidden');
            loadMoreBtn.textContent = `Load More Listings (${filteredListings.length - displayedListingsCount} remaining)`;
            loadMoreBtn.onclick = loadMoreListings;
        } else {
            loadMoreBtn.classList.add('hidden');
        }
    }

    // Delegated click handler for star buttons.
    // Inline onclick="toggleStar('id', event)" is unreliable: 'event' is not
    // guaranteed to be the current MouseEvent in all browsers when used in an
    // inline attribute, and the button-inside-<a> pattern can race with navigation.
    // This single listener on the container catches every star click cleanly.
    container.addEventListener('click', function starClickDelegate(e) {
        const starBtn = e.target.closest('.star-button');
        if (!starBtn) return;                          // not a star click
        e.preventDefault();                            // block the parent <a> navigation
        e.stopPropagation();                           // stop bubble entirely
        const id = starBtn.getAttribute('data-listing-id');
        if (id) toggleStar(id, e);
    });
}

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
*/

function updateResultsCount() {
    const count = filteredListings.length;
    const resultsCount = document.getElementById('resultsCount');
    if (!resultsCount) return;
    if (viewingStarredOnly) {
        resultsCount.textContent = `${count} starred ${count === 1 ? 'listing' : 'listings'}`;
    } else {
        resultsCount.textContent = `${count} ${count === 1 ? 'listing' : 'listings'} found${selectedCategory !== 'All' ? ` in ${selectedCategory}` : ''}`;
    }
}

function updateRadiusValue() {
    ['radiusValue', 'radiusValue2'].forEach(id => {
        const valueSpan = document.getElementById(id);
        if (valueSpan) {
            if (selectedRadius === 0) {
                valueSpan.textContent = 'Any distance';
            } else {
                valueSpan.textContent = `${selectedRadius} ${selectedRadius === 1 ? 'mile' : 'miles'}`;
            }
        }
    });
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
    const locationSubtitle = document.getElementById('locationSubtitle');
    if (locationSubtitle) {
        locationSubtitle.textContent = subtitle;
    }
}

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
*/

function populateCountryFilter() {
    const countries = [...new Set(allListings.map(l => l.country || 'USA'))].sort();
    ['countryFilter', 'countryFilter2'].forEach(id => {
        const select = document.getElementById(id);
        if (select) {
            select.innerHTML = '<option value="">All Countries</option>';
            countries.forEach(country => {
                const option = document.createElement('option');
                option.value = country;
                option.textContent = country === 'USA' ? 'United States' : country;
                select.appendChild(option);
            });
        }
    });
}

function populateStateFilter(country) {
    if (country === 'USA') {
        const states = [...new Set(allListings.filter(l => (l.country || 'USA') === 'USA').map(l => l.state))].sort();
        ['stateFilter', 'stateFilter2'].forEach(id => {
            const select = document.getElementById(id);
            if (select) {
                select.innerHTML = '<option value="">All States</option>';
                states.forEach(state => {
                    const option = document.createElement('option');
                    option.value = state;
                    option.textContent = `${US_STATES[state] || state} (${state})`;
                    select.appendChild(option);
                });
            }
        });
    }
}

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
This source code is proprietary and no part may not be used, reproduced, or distributed 
without written permission from The Greek Directory. Unauthorized use, copying, modification, 
or distribution of this code will result in legal action to the fullest extent permitted by law.
*/
/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
This source code is proprietary and no part may not be used, reproduced, or distributed 
without written permission from The Greek Directory. Unauthorized use, copying, modification, 
or distribution of this code will result in legal action to the fullest extent permitted by law.
*/

// ============================================
// LISTINGS PAGE JAVASCRIPT - PART 5
// Event Listeners & UI Interactions
// ============================================

function setupEventListeners() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            updateURL();
            if (!viewingStarredOnly) {
                displayedListingsCount = 25;
                applyFilters();
            }
        });
    }
    
    const filterBtn = document.getElementById('filterBtn');
    if (filterBtn) filterBtn.addEventListener('click', toggleFilters);
    
    const closeFilterBtn = document.getElementById('closeFilterBtn');
    if (closeFilterBtn) closeFilterBtn.addEventListener('click', toggleFilters);
    
    const mapBtn = document.getElementById('mapBtn');
    if (mapBtn) mapBtn.addEventListener('click', toggleMap);
    
    const mapBtnDesktop = document.getElementById('mapBtnDesktop');
    if (mapBtnDesktop) mapBtnDesktop.addEventListener('click', toggleMap);
    
    const gridViewBtn = document.getElementById('gridViewBtn');
    if (gridViewBtn) gridViewBtn.addEventListener('click', () => setView('grid'));
    
    const listViewBtn = document.getElementById('listViewBtn');
    if (listViewBtn) listViewBtn.addEventListener('click', () => setView('list'));
    
    const gridViewBtn2 = document.getElementById('gridViewBtn2');
    if (gridViewBtn2) gridViewBtn2.addEventListener('click', () => setView('grid'));
    
    const listViewBtn2 = document.getElementById('listViewBtn2');
    if (listViewBtn2) listViewBtn2.addEventListener('click', () => setView('list'));
    
    const starredBtn = document.getElementById('starredBtn');
    if (starredBtn) starredBtn.addEventListener('click', toggleStarredView);
    
    const splitViewBtn = document.getElementById('splitViewBtn');
    if (splitViewBtn) splitViewBtn.addEventListener('click', toggleSplitView);
    
    const clearFiltersBtn = document.getElementById('clearFiltersBtn');
    if (clearFiltersBtn) clearFiltersBtn.addEventListener('click', clearAllFilters);
    
    const clearFiltersBtn2 = document.getElementById('clearFiltersBtn2');
    if (clearFiltersBtn2) clearFiltersBtn2.addEventListener('click', clearAllFilters);
    
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) refreshBtn.addEventListener('click', () => window.location.reload());
    
    const toggleFilterPosition = document.getElementById('toggleFilterPosition');
    if (toggleFilterPosition) {
        toggleFilterPosition.addEventListener('click', () => {
            if (filterPosition === 'left') {
                filterPosition = 'top';
            } else {
                filterPosition = 'left';
            }
            // Close overlay if it was open
            closeDesktopFiltersOverlay();
            checkFilterPosition();
        });
    }

    // Desktop filter toggle button (appears when filters are collapsed or map is open)
    const desktopFilterToggleBtn = document.getElementById('desktopFilterToggleBtn');
    if (desktopFilterToggleBtn) {
        desktopFilterToggleBtn.addEventListener('click', () => {
            if (mapOpen) {
                // Map is open — sidebar can't coexist, so use the overlay
                toggleDesktopFiltersOverlay();
            } else {
                // Map is closed — just restore the normal sidebar
                filterPosition = 'left';
                checkFilterPosition();
            }
        });
    }

    // Close overlay when clicking the backdrop
    const desktopFiltersBackdrop = document.getElementById('desktopFiltersBackdrop');
    if (desktopFiltersBackdrop) {
        desktopFiltersBackdrop.addEventListener('click', closeDesktopFiltersOverlay);
    }

    /*
    Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    */

    ['radiusFilter', 'radiusFilter2'].forEach(id => {
        const slider = document.getElementById(id);
        if (slider) {
            slider.addEventListener('input', (e) => {
                selectedRadius = parseInt(e.target.value);
                const radiusFilter = document.getElementById('radiusFilter');
                const radiusFilter2 = document.getElementById('radiusFilter2');
                if (radiusFilter) radiusFilter.value = selectedRadius;
                if (radiusFilter2) radiusFilter2.value = selectedRadius;
                updateRadiusValue();
                updateURL();
                if (!viewingStarredOnly) {
                    displayedListingsCount = 25;
                    applyFilters();
                }
            });
        }
    });
    
    ['openNowFilter', 'openNowFilter2'].forEach(id => {
        const checkbox = document.getElementById(id);
        if (checkbox) {
            checkbox.addEventListener('change', (e) => {
                openNowOnly = e.target.checked;
                const openFilter = document.getElementById('openNowFilter');
                const openFilter2 = document.getElementById('openNowFilter2');
                if (openFilter) openFilter.checked = openNowOnly;
                if (openFilter2) openFilter2.checked = openNowOnly;
                updateURL();
                if (!viewingStarredOnly) {
                    displayedListingsCount = 25;
                    applyFilters();
                }
            });
        }
    });

    ['closedNowFilter', 'closedNowFilter2'].forEach(id => {
        const checkbox = document.getElementById(id);
        if (checkbox) {
            checkbox.addEventListener('change', (e) => {
                closedNowOnly = e.target.checked;
                const closedFilter = document.getElementById('closedNowFilter');
                const closedFilter2 = document.getElementById('closedNowFilter2');
                if (closedFilter) closedFilter.checked = closedNowOnly;
                if (closedFilter2) closedFilter2.checked = closedNowOnly;
                updateURL();
                if (!viewingStarredOnly) {
                    displayedListingsCount = 25;
                    applyFilters();
                }
            });
        }
    });

    ['openingSoonFilter', 'openingSoonFilter2'].forEach(id => {
        const checkbox = document.getElementById(id);
        if (checkbox) {
            checkbox.addEventListener('change', (e) => {
                openingSoonOnly = e.target.checked;
                const openingSoonFilter = document.getElementById('openingSoonFilter');
                const openingSoonFilter2 = document.getElementById('openingSoonFilter2');
                if (openingSoonFilter) openingSoonFilter.checked = openingSoonOnly;
                if (openingSoonFilter2) openingSoonFilter2.checked = openingSoonOnly;
                updateURL();
                if (!viewingStarredOnly) {
                    displayedListingsCount = 25;
                    applyFilters();
                }
            });
        }
    });

    ['closingSoonFilter', 'closingSoonFilter2'].forEach(id => {
        const checkbox = document.getElementById(id);
        if (checkbox) {
            checkbox.addEventListener('change', (e) => {
                closingSoonOnly = e.target.checked;
                const closingSoonFilter = document.getElementById('closingSoonFilter');
                const closingSoonFilter2 = document.getElementById('closingSoonFilter2');
                if (closingSoonFilter) closingSoonFilter.checked = closingSoonOnly;
                if (closingSoonFilter2) closingSoonFilter2.checked = closingSoonOnly;
                updateURL();
                if (!viewingStarredOnly) {
                    displayedListingsCount = 25;
                    applyFilters();
                }
            });
        }
    });

    ['hoursUnknownFilter', 'hoursUnknownFilter2'].forEach(id => {
        const checkbox = document.getElementById(id);
        if (checkbox) {
            checkbox.addEventListener('change', (e) => {
                hoursUnknownOnly = e.target.checked;
                const hoursUnknownFilter = document.getElementById('hoursUnknownFilter');
                const hoursUnknownFilter2 = document.getElementById('hoursUnknownFilter2');
                if (hoursUnknownFilter) hoursUnknownFilter.checked = hoursUnknownOnly;
                if (hoursUnknownFilter2) hoursUnknownFilter2.checked = hoursUnknownOnly;
                updateURL();
                if (!viewingStarredOnly) {
                    displayedListingsCount = 25;
                    applyFilters();
                }
            });
        }
    });
    
    ['onlineOnlyFilter', 'onlineOnlyFilter2'].forEach(id => {
        const checkbox = document.getElementById(id);
        if (checkbox) {
            checkbox.addEventListener('change', (e) => {
                onlineOnly = e.target.checked;
                const onlineFilter = document.getElementById('onlineOnlyFilter');
                const onlineFilter2 = document.getElementById('onlineOnlyFilter2');
                if (onlineFilter) onlineFilter.checked = onlineOnly;
                if (onlineFilter2) onlineFilter2.checked = onlineOnly;
                updateURL();
                if (!viewingStarredOnly) {
                    displayedListingsCount = 25;
                    applyFilters();
                }
            });
        }
    });
    
    /*
    Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    */
    
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            displayedListingsCount = 25;
            if (!viewingStarredOnly) applyFilters();
            else renderListings();
        });
    }
    
    ['countryFilter', 'countryFilter2'].forEach(id => {
        const select = document.getElementById(id);
        if (select) {
            select.addEventListener('change', (e) => {
                selectedCountry = e.target.value;
                const countryFilter = document.getElementById('countryFilter');
                const countryFilter2 = document.getElementById('countryFilter2');
                if (countryFilter) countryFilter.value = selectedCountry;
                if (countryFilter2) countryFilter2.value = selectedCountry;
                
                if (selectedCountry === 'USA') {
                    const stateContainer = document.getElementById('stateFilterContainer');
                    const stateContainer2 = document.getElementById('stateFilterContainer2');
                    if (stateContainer) stateContainer.classList.remove('hidden');
                    if (stateContainer2) stateContainer2.classList.remove('hidden');
                    populateStateFilter('USA');
                } else {
                    const stateContainer = document.getElementById('stateFilterContainer');
                    const stateContainer2 = document.getElementById('stateFilterContainer2');
                    if (stateContainer) stateContainer.classList.add('hidden');
                    if (stateContainer2) stateContainer2.classList.add('hidden');
                    selectedState = '';
                }
                updateURL();
                if (!viewingStarredOnly) {
                    displayedListingsCount = 25;
                    applyFilters();
                }
            });
        }
    });
    
    ['stateFilter', 'stateFilter2'].forEach(id => {
        const select = document.getElementById(id);
        if (select) {
            select.addEventListener('change', (e) => {
                selectedState = e.target.value;
                const stateFilter = document.getElementById('stateFilter');
                const stateFilter2 = document.getElementById('stateFilter2');
                if (stateFilter) stateFilter.value = selectedState;
                if (stateFilter2) stateFilter2.value = selectedState;
                updateURL();
                if (!viewingStarredOnly) {
                    displayedListingsCount = 25;
                    applyFilters();
                }
            });
        }
    });
    
    /*
    Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    */
    
    const locateBtn = document.getElementById('locateBtn');
    if (locateBtn) {
        locateBtn.addEventListener('click', () => {
            if (userLocation) {
                locationButtonActive = true;
                mapMoved = false;
                locateBtn.classList.add('active');
                // Color the locate icon blue
                const locateIcon = document.getElementById('locateBtnIcon');
                if (locateIcon) locateIcon.setAttribute('fill', '#045093');
                if (map) {
                    map.setView([userLocation.lat, userLocation.lng], 13);
                    addUserLocationMarker();
                }
            } else {
                requestLocationOnLoad();
            }
        });
    }
    
    const resetMapBtn = document.getElementById('resetMapBtn');
    if (resetMapBtn) {
        resetMapBtn.addEventListener('click', () => {
            if (map) {
                map.setView(defaultMapCenter, defaultMapZoom);
                if (mapReady && allListingsGeocoded) updateMapMarkers();
            }
        });
    }
    
    ['categorySearch', 'categorySearch2'].forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', (e) => {
                if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
                searchDebounceTimer = setTimeout(() => {
                    filterCategoriesAndSubcategories(e.target.value);
                }, 300);
            });
        }
    });

    setupLocationSearch();
    
    window.addEventListener('resize', checkFilterPosition);
}

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
*/

// Desktop filters overlay management (used when map is open or filters are collapsed)
function toggleDesktopFiltersOverlay() {
    if (desktopFiltersOverlay) {
        closeDesktopFiltersOverlay();
    } else {
        openDesktopFiltersOverlay();
    }
}

function openDesktopFiltersOverlay() {
    desktopFiltersOverlay = true;
    const desktopFilters = document.getElementById('desktopFiltersContainer');
    const backdrop = document.getElementById('desktopFiltersBackdrop');
    if (desktopFilters) {
        desktopFilters.classList.remove('hidden');
        desktopFilters.classList.add('desktop-filters-overlay');
    }
    if (backdrop) backdrop.classList.remove('hidden');
}

function closeDesktopFiltersOverlay() {
    desktopFiltersOverlay = false;
    const desktopFilters = document.getElementById('desktopFiltersContainer');
    const backdrop = document.getElementById('desktopFiltersBackdrop');
    if (desktopFilters) {
        desktopFilters.classList.add('hidden');
        desktopFilters.classList.remove('desktop-filters-overlay');
    }
    if (backdrop) backdrop.classList.add('hidden');
}

function syncFilters() {
    const filterPairs = [
        'categorySearch', 'openNowFilter', 'closedNowFilter', 'openingSoonFilter',
        'closingSoonFilter', 'hoursUnknownFilter', 'onlineOnlyFilter', 'radiusFilter',
        'countryFilter', 'stateFilter', 'locationSearch'
    ];

    filterPairs.forEach(base => {
        const elem1 = document.getElementById(base);
        const elem2 = document.getElementById(base + '2');
        if (!elem1 || !elem2) return;
        
        elem1.addEventListener('input', () => { 
            if (base.includes('Filter') && elem1.type === 'checkbox') {
                elem2.checked = elem1.checked;
            } else {
                elem2.value = elem1.value;
            }
        });
        elem1.addEventListener('change', () => {
            if (base.includes('Filter') && elem1.type === 'checkbox') {
                elem2.checked = elem1.checked;
            } else {
                elem2.value = elem1.value;
            }
        });
        
        elem2.addEventListener('input', () => {
            if (base.includes('Filter') && elem2.type === 'checkbox') {
                elem1.checked = elem2.checked;
            } else {
                elem1.value = elem2.value;
            }
        });
        elem2.addEventListener('change', () => {
            if (base.includes('Filter') && elem2.type === 'checkbox') {
                elem1.checked = elem2.checked;
            } else {
                elem1.value = elem2.value;
            }
        });
    });
}

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
*/

function toggleFilters() {
    const panel = document.getElementById('filterPanel');
    if (!panel) return;
    
    filtersOpen = !filtersOpen;
    if (filtersOpen) {
        panel.classList.remove('hidden');
        if (mapOpen) toggleMap();
    } else {
        panel.classList.add('hidden');
    }
}

function toggleMap() {
    const container = document.getElementById('mapContainer');
    if (!container) return;
    
    mapOpen = !mapOpen;
    if (mapOpen) {
        container.classList.remove('hidden');
        if (filtersOpen) toggleFilters();
        if (splitViewActive) toggleSplitView();
        // Close desktop sidebar filters; user can reopen as overlay via toggle button
        closeDesktopFiltersOverlay();
        checkFilterPosition();
        if (map) {
            setTimeout(() => {
                map.invalidateSize();
                updateMapMarkers();
                if (userLocation) addUserLocationMarker();
                if (allListingsGeocoded) hideMapLoading();
            }, 100);
        }
    } else {
        container.classList.add('hidden');
        // Restore normal filter position state
        checkFilterPosition();
    }
}

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
*/

function setView(view) {
    currentView = view;
    const gridViewBtn = document.getElementById('gridViewBtn');
    const listViewBtn = document.getElementById('listViewBtn');
    const gridViewBtn2 = document.getElementById('gridViewBtn2');
    const listViewBtn2 = document.getElementById('listViewBtn2');
    
    if (gridViewBtn) gridViewBtn.className = view === 'grid' ? 'p-2 rounded bg-white shadow-sm' : 'p-2 rounded';
    if (listViewBtn) listViewBtn.className = view === 'list' ? 'p-2 rounded bg-white shadow-sm' : 'p-2 rounded';
    if (gridViewBtn2) gridViewBtn2.className = view === 'grid' ? 'p-2 rounded bg-white shadow-sm' : 'p-2 rounded';
    if (listViewBtn2) listViewBtn2.className = view === 'list' ? 'p-2 rounded bg-white shadow-sm' : 'p-2 rounded';
    
    renderListings();
}

function showMapLoading() {
    const loading = document.getElementById('mapLoading');
    if (loading) loading.style.display = 'block';
}

function hideMapLoading() {
    const loading = document.getElementById('mapLoading');
    if (loading) loading.style.display = 'none';
}

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
This source code is proprietary and no part may not be used, reproduced, or distributed 
without written permission from The Greek Directory. Unauthorized use, copying, modification, 
or distribution of this code will result in legal action to the fullest extent permitted by law.
*/
/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
This source code is proprietary and no part may not be used, reproduced, or distributed 
without written permission from The Greek Directory. Unauthorized use, copying, modification, 
or distribution of this code will result in legal action to the fullest extent permitted by law.
*/

// ============================================
// LISTINGS PAGE JAVASCRIPT - PART 6
// Category & Filter Management
// ============================================

function createCategoryButtons(filteredCategories) {
    const categoriesToShow = filteredCategories && filteredCategories.length > 0 ? filteredCategories : CATEGORIES;
    
    ['categoryFilters', 'categoryFilters2'].forEach(containerId => {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = '';
        
        const allButton = document.createElement('button');
        allButton.className = selectedCategory === 'All' ? 
            'px-3 py-2 rounded-lg text-sm font-medium text-white' : 
            'px-3 py-2 rounded-lg text-sm font-medium bg-white text-gray-700 border border-gray-300';
        if (selectedCategory === 'All') allButton.style.backgroundColor = '#055193';
        allButton.textContent = 'All';
        allButton.onclick = () => filterByCategory('All');
        container.appendChild(allButton);
        
        categoriesToShow.forEach(cat => {
            const button = document.createElement('button');
            button.className = selectedCategory === cat ? 
                'px-3 py-2 rounded-lg text-sm font-medium text-white' : 
                'px-3 py-2 rounded-lg text-sm font-medium bg-white text-gray-700 border border-gray-300 text-left';
            if (selectedCategory === cat) button.style.backgroundColor = '#055193';
            button.textContent = cat;
            button.onclick = () => filterByCategory(cat);
            container.appendChild(button);
        });
    });
}

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
*/

function filterByCategory(category) {
    selectedCategory = category || 'All';
    selectedSubcategories = [];
    
    createCategoryButtons();
    updateSubcategoryDisplay();
    updateURL();
    displayedListingsCount = 25;
    if (!viewingStarredOnly) applyFilters();
}

function updateSubcategoryDisplay(matchingSubcategories) {
    if (selectedCategory && selectedCategory !== 'All' && SUBCATEGORIES[selectedCategory]) {
        ['subcategoryContainer', 'subcategoryContainer2'].forEach((containerId, idx) => {
            const filtersId = idx === 0 ? 'subcategoryFilters' : 'subcategoryFilters2';
            const container = document.getElementById(containerId);
            const filtersDiv = document.getElementById(filtersId);
            
            if (container) container.classList.remove('hidden');
            if (filtersDiv) {
                filtersDiv.innerHTML = '';
                SUBCATEGORIES[selectedCategory].forEach(sub => {
                    const tag = document.createElement('div');
                    tag.className = 'subcategory-tag';
                    tag.textContent = sub;
                    if (selectedSubcategories.includes(sub)) {
                        tag.classList.add('selected');
                    }
                    tag.onclick = () => toggleSubcategory(sub);
                    filtersDiv.appendChild(tag);
                });
            }
        });
    } else if (matchingSubcategories && matchingSubcategories.length > 0) {
        ['subcategoryContainer', 'subcategoryContainer2'].forEach((containerId, idx) => {
            const filtersId = idx === 0 ? 'subcategoryFilters' : 'subcategoryFilters2';
            const container = document.getElementById(containerId);
            const filtersDiv = document.getElementById(filtersId);
            
            if (container) container.classList.remove('hidden');
            if (filtersDiv) {
                filtersDiv.innerHTML = '';
                
                matchingSubcategories.forEach(item => {
                    const tag = document.createElement('div');
                    tag.className = 'subcategory-tag';
                    tag.textContent = `${item.subcategory} (${item.category})`;
                    if (selectedSubcategories.includes(item.subcategory)) {
                        tag.classList.add('selected');
                    }
                    tag.onclick = () => toggleSubcategory(item.subcategory);
                    filtersDiv.appendChild(tag);
                });
            }
        });
    } else {
        ['subcategoryContainer', 'subcategoryContainer2'].forEach(id => {
            const container = document.getElementById(id);
            if (container) container.classList.add('hidden');
        });
    }
}

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
*/

function toggleSubcategory(subcategory) {
    const index = selectedSubcategories.indexOf(subcategory);
    if (index > -1) {
        selectedSubcategories.splice(index, 1);
    } else {
        selectedSubcategories.push(subcategory);
    }
    
    updateSubcategoryDisplay();
    updateURL();
    displayedListingsCount = 25;
    if (!viewingStarredOnly) applyFilters();
}

function filterCategoriesAndSubcategories(searchTerm) {
    searchTerm = searchTerm.toLowerCase();
    
    const elem1 = document.getElementById('categorySearch');
    const elem2 = document.getElementById('categorySearch2');
    if (elem1) elem1.value = searchTerm;
    if (elem2) elem2.value = searchTerm;

    if (!searchTerm) {
        selectedSubcategories = [];
        updateSubcategoryDisplay();
        createCategoryButtons();
        if (!viewingStarredOnly) {
            displayedListingsCount = 25;
            applyFilters();
        }
        return;
    }
    
    const matchingSubcategories = [];
    const matchingCategories = new Set();
    
    Object.entries(SUBCATEGORIES).forEach(([category, subs]) => {
        subs.forEach(sub => {
            if (sub.toLowerCase().includes(searchTerm)) {
                matchingSubcategories.push({ category, subcategory: sub });
                matchingCategories.add(category);
            }
        });
    });

    CATEGORIES.forEach(cat => {
        if (cat.toLowerCase().includes(searchTerm)) {
            matchingCategories.add(cat);
        }
    });

    createCategoryButtons(Array.from(matchingCategories));

    if (matchingSubcategories.length > 0) {
        updateSubcategoryDisplay(matchingSubcategories);
    } else {
        updateSubcategoryDisplay();
    }
    
    updateURL();
    if (!viewingStarredOnly) {
        displayedListingsCount = 25;
        applyFilters();
    }
}

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
*/

function clearAllFilters() {
    selectedCategory = 'All';
    selectedSubcategories = [];
    selectedCountry = '';
    selectedState = '';
    selectedRadius = 50;
    openNowOnly = false;
    closedNowOnly = false;
    openingSoonOnly = false;
    closingSoonOnly = false;
    hoursUnknownOnly = false;
    onlineOnly = false;
    
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = '';
    
    ['categorySearch', 'categorySearch2'].forEach(id => {
        const elem = document.getElementById(id);
        if (elem) elem.value = '';
    });
    
    ['locationSearch', 'locationSearch2'].forEach(id => {
        const elem = document.getElementById(id);
        if (elem) elem.value = '';
    });
    
    ['countryFilter', 'countryFilter2'].forEach(id => {
        const elem = document.getElementById(id);
        if (elem) elem.value = '';
    });
    
    ['stateFilter', 'stateFilter2'].forEach(id => {
        const elem = document.getElementById(id);
        if (elem) elem.value = '';
    });
    
    const stateContainer = document.getElementById('stateFilterContainer');
    const stateContainer2 = document.getElementById('stateFilterContainer2');
    if (stateContainer) stateContainer.classList.add('hidden');
    if (stateContainer2) stateContainer2.classList.add('hidden');
    
    ['radiusFilter', 'radiusFilter2'].forEach(id => {
        const elem = document.getElementById(id);
        if (elem) elem.value = '50';
    });
    
    ['openNowFilter', 'openNowFilter2'].forEach(id => {
        const elem = document.getElementById(id);
        if (elem) elem.checked = false;
    });
    
    ['closedNowFilter', 'closedNowFilter2'].forEach(id => {
        const elem = document.getElementById(id);
        if (elem) elem.checked = false;
    });
    
    ['openingSoonFilter', 'openingSoonFilter2'].forEach(id => {
        const elem = document.getElementById(id);
        if (elem) elem.checked = false;
    });
    
    ['closingSoonFilter', 'closingSoonFilter2'].forEach(id => {
        const elem = document.getElementById(id);
        if (elem) elem.checked = false;
    });
    
    ['hoursUnknownFilter', 'hoursUnknownFilter2'].forEach(id => {
        const elem = document.getElementById(id);
        if (elem) elem.checked = false;
    });
    
    ['onlineOnlyFilter', 'onlineOnlyFilter2'].forEach(id => {
        const elem = document.getElementById(id);
        if (elem) elem.checked = false;
    });
    
    ['subcategoryContainer', 'subcategoryContainer2'].forEach(id => {
        const elem = document.getElementById(id);
        if (elem) elem.classList.add('hidden');
    });
    
    updateRadiusValue();
    updateURL();
    createCategoryButtons();
    displayedListingsCount = 25;
    if (!viewingStarredOnly) applyFilters();
}

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
*/

function setupLocationSearch() {
    // FIX: use the correct results div IDs that match the HTML.
    // HTML has: id="locationSearchResults" and id="locationSearchResults2"
    // We map each input to its correct results div explicitly.
    const locationInputs = [
        { inputId: 'locationSearch',  resultsId: 'locationSearchResults' },
        { inputId: 'locationSearch2', resultsId: 'locationSearchResults2' }
    ];

    locationInputs.forEach(({ inputId, resultsId }) => {
        const input = document.getElementById(inputId);
        const resultsDiv = document.getElementById(resultsId);
        
        if (!input || !resultsDiv) return;

        input.addEventListener('input', () => {
            const query = input.value.toLowerCase().trim();
            
            // Sync the other input
            const otherId = inputId === 'locationSearch' ? 'locationSearch2' : 'locationSearch';
            const otherInput = document.getElementById(otherId);
            if (otherInput) otherInput.value = input.value;

            if (query.length < 2) {
                resultsDiv.style.display = 'none';
                return;
            }

            const matches = [];
            const seen = new Set();

            allListings.forEach(listing => {
                const city = listing.city?.toLowerCase();
                const state = listing.state?.toLowerCase();
                const zip = listing.zip_code?.toLowerCase();
                const country = (listing.country || 'USA').toLowerCase();

                if (city && city.includes(query) && !seen.has(`city-${city}-${listing.state}`)) {
                    matches.push({ type: 'city', value: listing.city, state: listing.state, display: `${listing.city}, ${listing.state}` });
                    seen.add(`city-${city}-${listing.state}`);
                }
                if (state && state.includes(query) && !seen.has(`state-${state}`)) {
                    matches.push({ type: 'state', value: listing.state, display: US_STATES[listing.state] || listing.state });
                    seen.add(`state-${state}`);
                }
                if (zip && zip.includes(query) && !seen.has(`zip-${zip}`)) {
                    matches.push({ type: 'zip', value: listing.zip_code, city: listing.city, state: listing.state, display: `${listing.zip_code} (${listing.city}, ${listing.state})` });
                    seen.add(`zip-${zip}`);
                }
                if (country.includes(query) && !seen.has(`country-${country}`)) {
                    matches.push({ type: 'country', value: listing.country || 'USA', display: listing.country === 'USA' ? 'United States' : listing.country });
                    seen.add(`country-${country}`);
                }
            });

            if (matches.length > 0) {
                resultsDiv.innerHTML = matches.slice(0, 10).map(m => 
                    `<div class="location-search-result" data-type="${m.type}" data-value="${m.value}" data-state="${m.state || ''}" data-city="${m.city || ''}">${m.display}</div>`
                ).join('');
                resultsDiv.style.display = 'block';

                resultsDiv.querySelectorAll('.location-search-result').forEach(elem => {
                    elem.addEventListener('click', () => {
                        const type = elem.dataset.type;
                        const value = elem.dataset.value;

                        if (type === 'city') {
                            const state = elem.dataset.state;
                            selectedCountry = 'USA';
                            selectedState = state;
                            const countryFilter = document.getElementById('countryFilter');
                            const countryFilter2 = document.getElementById('countryFilter2');
                            if (countryFilter) countryFilter.value = 'USA';
                            if (countryFilter2) countryFilter2.value = 'USA';
                            
                            const stateContainer = document.getElementById('stateFilterContainer');
                            const stateContainer2 = document.getElementById('stateFilterContainer2');
                            if (stateContainer) stateContainer.classList.remove('hidden');
                            if (stateContainer2) stateContainer2.classList.remove('hidden');
                            
                            populateStateFilter('USA');
                            
                            const stateFilter = document.getElementById('stateFilter');
                            const stateFilter2 = document.getElementById('stateFilter2');
                            if (stateFilter) stateFilter.value = state;
                            if (stateFilter2) stateFilter2.value = state;
                        } else if (type === 'state') {
                            selectedCountry = 'USA';
                            selectedState = value;
                            const countryFilter = document.getElementById('countryFilter');
                            const countryFilter2 = document.getElementById('countryFilter2');
                            if (countryFilter) countryFilter.value = 'USA';
                            if (countryFilter2) countryFilter2.value = 'USA';
                            
                            const stateContainer = document.getElementById('stateFilterContainer');
                            const stateContainer2 = document.getElementById('stateFilterContainer2');
                            if (stateContainer) stateContainer.classList.remove('hidden');
                            if (stateContainer2) stateContainer2.classList.remove('hidden');
                            
                            populateStateFilter('USA');
                            
                            const stateFilter = document.getElementById('stateFilter');
                            const stateFilter2 = document.getElementById('stateFilter2');
                            if (stateFilter) stateFilter.value = value;
                            if (stateFilter2) stateFilter2.value = value;
                        } else if (type === 'zip') {
                            const state = elem.dataset.state;
                            selectedCountry = 'USA';
                            selectedState = state;
                            const countryFilter = document.getElementById('countryFilter');
                            const countryFilter2 = document.getElementById('countryFilter2');
                            if (countryFilter) countryFilter.value = 'USA';
                            if (countryFilter2) countryFilter2.value = 'USA';
                            
                            const stateContainer = document.getElementById('stateFilterContainer');
                            const stateContainer2 = document.getElementById('stateFilterContainer2');
                            if (stateContainer) stateContainer.classList.remove('hidden');
                            if (stateContainer2) stateContainer2.classList.remove('hidden');
                            
                            populateStateFilter('USA');
                            
                            const stateFilter = document.getElementById('stateFilter');
                            const stateFilter2 = document.getElementById('stateFilter2');
                            if (stateFilter) stateFilter.value = state;
                            if (stateFilter2) stateFilter2.value = state;
                        } else if (type === 'country') {
                            selectedCountry = value;
                            selectedState = '';
                            const countryFilter = document.getElementById('countryFilter');
                            const countryFilter2 = document.getElementById('countryFilter2');
                            if (countryFilter) countryFilter.value = value;
                            if (countryFilter2) countryFilter2.value = value;
                            
                            if (value === 'USA') {
                                const stateContainer = document.getElementById('stateFilterContainer');
                                const stateContainer2 = document.getElementById('stateFilterContainer2');
                                if (stateContainer) stateContainer.classList.remove('hidden');
                                if (stateContainer2) stateContainer2.classList.remove('hidden');
                                populateStateFilter('USA');
                            } else {
                                const stateContainer = document.getElementById('stateFilterContainer');
                                const stateContainer2 = document.getElementById('stateFilterContainer2');
                                if (stateContainer) stateContainer.classList.add('hidden');
                                if (stateContainer2) stateContainer2.classList.add('hidden');
                            }
                        }

                        // Clear both inputs and hide both results divs
                        ['locationSearch', 'locationSearch2'].forEach(id => {
                            const el = document.getElementById(id);
                            if (el) el.value = '';
                        });
                        ['locationSearchResults', 'locationSearchResults2'].forEach(id => {
                            const el = document.getElementById(id);
                            if (el) el.style.display = 'none';
                        });

                        updateURL();
                        if (!viewingStarredOnly) {
                            displayedListingsCount = 25;
                            applyFilters();
                        }
                    });
                });
            } else {
                resultsDiv.style.display = 'none';
            }
        });

        input.addEventListener('blur', () => {
            setTimeout(() => {
                resultsDiv.style.display = 'none';
            }, 200);
        });
    });
}

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
This source code is proprietary and no part may not be used, reproduced, or distributed 
without written permission from The Greek Directory. Unauthorized use, copying, modification, 
or distribution of this code will result in legal action to the fullest extent permitted by law.
*/
/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
This source code is proprietary and no part may not be used, reproduced, or distributed 
without written permission from The Greek Directory. Unauthorized use, copying, modification, 
or distribution of this code will result in legal action to the fullest extent permitted by law.
*/

// ============================================
// LISTINGS PAGE JAVASCRIPT - PART 7
// Map Functions & Geocoding
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
            if (locateBtn) locateBtn.classList.remove('active');
            // Reset locate icon back to black
            const locateIcon = document.getElementById('locateBtnIcon');
            if (locateIcon) locateIcon.setAttribute('fill', '#000000');
        }
    });
    
    setTimeout(() => {
        map.invalidateSize();
        mapReady = true;
        updateMapMarkers();
        if (allListingsGeocoded) hideMapLoading();
    }, 500);
}

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
*/

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

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
*/

function updateMapMarkers() {
    if (!map || !markerClusterGroup || !mapReady) return;
    markerClusterGroup.clearLayers();
    const bounds = [];
    filteredListings.forEach(listing => {
        if (listing.coordinates && !isBasedIn(listing)) {
            const isFeatured = listing.tier === 'FEATURED' || listing.tier === 'PREMIUM';
            const firstPhoto = listing.photos && listing.photos.length > 0 ? listing.photos[0] : (listing.logo || '');
            const logoImage = listing.logo || '';
            
            const iconClass = isFeatured ? 'custom-marker featured' : 'custom-marker';
            const iconHtml = logoImage ? 
                `<div class="${iconClass}"><img src="${logoImage}" alt="${listing.business_name}"></div>` :
                `<div class="${iconClass}"><div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:12px;color:#666;">No logo</div></div>`;
            const customIcon = L.divIcon({ html: iconHtml, className: '', iconSize: [40, 40], iconAnchor: [20, 20] });
            const marker = L.marker([listing.coordinates.lat, listing.coordinates.lng], { icon: customIcon, riseOnHover: true });
            const badges = buildBadges(listing);
            const checkmarkHtml = showsVerifiedCheckmark(listing) ? '<span style="display:inline-flex;align-items:center;margin-left:4px;"><svg style="width:14px;height:14px;" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="12" fill="#055193"/><path d="M7 12.5l3.5 3.5L17 9" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>' : '';
            
            const categorySlug = listing.category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            const heroImage = firstPhoto || '';
            const popupContent = `
                <div class="map-popup">
                    ${heroImage ? `<img src="${heroImage}" alt="${listing.business_name}" class="map-popup-hero">` : '<div class="map-popup-hero" style="background:#f3f4f6;display:flex;align-items:center;justify-content:center;color:#9ca3af;">No image</div>'}
                    <div class="map-popup-content">
                        ${logoImage ? `<img src="${logoImage}" alt="${listing.business_name}" class="map-popup-logo">` : '<div class="map-popup-logo" style="background:#f3f4f6;display:flex;align-items:center;justify-content:center;font-size:10px;color:#9ca3af;">No logo</div>'}
                        <div class="map-popup-info">
                            <div class="map-popup-badges">${badges.join('')}</div>
                            <a href="/listing/${categorySlug}/${listing.slug}" class="map-popup-title" style="display:inline-flex;align-items:center;gap:4px;">${listing.business_name}${checkmarkHtml}</a>
                            <div class="map-popup-tagline">${listing.tagline || listing.description.substring(0, 60) + '...'}</div>
                            <div class="map-popup-details"><svg style="width:14px;height:14px;vertical-align:middle;" fill="none" stroke="#6b7280" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg> ${getFullAddress(listing)}<br>${listing.phone ? '<svg style="width:14px;height:14px;vertical-align:middle;" fill="none" stroke="#6b7280" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg> ' + formatPhoneDisplay(listing.phone) : ''}</div>
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

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
This source code is proprietary and no part may not be used, reproduced, or distributed 
without written permission from The Greek Directory. Unauthorized use, copying, modification, 
or distribution of this code will result in legal action to the fullest extent permitted by law.
*/
/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
This source code is proprietary and no part may not be used, reproduced, or distributed 
without written permission from The Greek Directory. Unauthorized use, copying, modification, 
or distribution of this code can result in legal action to the fullest extent permitted by law.
*/

// ============================================
// LISTINGS PAGE JAVASCRIPT - PART 8
// Split View Functions
// ============================================

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
                <div class="mb-3 flex items-center justify-between px-2">
                    <div class="flex items-center gap-2">
                        <p class="text-sm text-gray-600">${filteredListings.length} ${filteredListings.length === 1 ? 'listing' : 'listings'} found</p>
                        <button id="splitFiltersBtn" class="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
                            <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg> Filters
                        </button>
                    </div>
                    <select id="splitSortSelect" class="text-sm border border-gray-300 rounded-lg px-3 py-2">
                        <option value="default">Default</option>
                        <option value="az">A-Z</option>
                        <option value="closest">Closest to Me</option>
                        <option value="random">Random</option>
                    </select>
                </div>
                <div id="splitListingsContainer"></div>
            </div>
            <div class="split-view-map">
                <div id="splitMap"></div>
                <div class="map-controls">
                    <button class="map-control-btn" id="splitViewToggleBtn" onclick="toggleSplitView()" title="Exit split view">
                        <svg width="16" height="16" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" fill="#000000"><rect x="15" y="4" width="2" height="24"/><path d="M10,7V25H4V7h6m0-2H4A2,2,0,0,0,2,7V25a2,2,0,0,0,2,2h6a2,2,0,0,0,2-2V7a2,2,0,0,0-2-2Z"/><path d="M28,7V25H22V7h6m0-2H22a2,2,0,0,0-2,2V25a2,2,0,0,0,2,2h6a2,2,0,0,0,2-2V7a2,2,0,0,0-2-2Z"/></svg>
                        <span class="desktop-only">Exit Split View</span>
                    </button>
                    <button class="map-control-btn" id="splitLocateBtn" title="Find my location">
                        <svg id="splitLocateBtnIcon" width="16" height="16" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" fill="#000000">
                            <polygon points="0,9.28 9.894,9.99 10.78,20 20,0"/>
                        </svg>
                        <span class="desktop-only">Current Location</span>
                    </button>
                    <button class="map-control-btn" id="splitResetMapBtn" title="Reset map view">
                        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                        <span class="desktop-only">Reload</span>
                    </button>
                </div>
            </div>
        `;
        // Hide desktop sidebar in split view; checkFilterPosition will enforce via splitViewActive branch
        checkFilterPosition();
        // Close filterPanel if it was open from before entering split view
        if (filtersOpen) { filtersOpen = false; document.getElementById('filterPanel').classList.add('hidden'); }

        document.getElementById('splitSortSelect').value = document.getElementById('sortSelect').value;
        document.getElementById('splitSortSelect').addEventListener('change', (e) => {
            document.getElementById('sortSelect').value = e.target.value;
            displayedListingsCount = 25;
            if (!viewingStarredOnly) applyFilters();
            else renderListings();
        });

        // Filters button in split view opens the top filterPanel
        const splitFiltersBtn = document.getElementById('splitFiltersBtn');
        if (splitFiltersBtn) {
            splitFiltersBtn.addEventListener('click', toggleFilters);
        }

        renderSplitViewListings();
        initSplitMap();
    } else {
        document.getElementById('splitViewContainer').classList.add('hidden');
        document.getElementById('splitViewContainer').innerHTML = '';
        document.getElementById('normalViewControls').classList.remove('hidden');
        document.getElementById('normalViewListings').classList.remove('hidden');
        document.getElementById('mapContainer').classList.remove('hidden');
        checkFilterPosition();
        setTimeout(() => {
            if (map) {
                map.invalidateSize();
                updateMapMarkers();
            }
        }, 100);
    }
}

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
*/

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
        const badges = buildBadges(l);
        const isStarred = starredListings.includes(l.id);
        const logoImage = l.logo || '';
        const checkmarkHtml = showsVerifiedCheckmark(l) ? '<svg style="width:16px;height:16px;flex-shrink:0;" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="12" fill="#055193"/><path d="M7 12.5l3.5 3.5L17 9" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>' : '';
        
        return `
            <a href="${listingUrl}" class="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-3 flex gap-3 block relative" style="margin-right: 8px;">
                <button class="star-button ${isStarred ? 'starred' : ''}" data-listing-id="${l.id}" style="top: 8px; right: 8px; width: 32px; height: 32px;">
                    <svg class="star-icon" style="width: 16px; height: 16px;" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                </button>
                ${logoImage ? `<img src="${logoImage}" alt="${l.business_name}" class="w-16 h-16 rounded-lg object-cover flex-shrink-0">` : '<div class="w-16 h-16 rounded-lg bg-gray-200 flex-shrink-0 flex items-center justify-center text-gray-400 text-xs">No logo</div>'}
                <div class="flex-1 min-w-0 overflow-hidden pr-8">
                    <div class="flex gap-1 mb-1 flex-wrap">
                        ${badges.join('')}
                    </div>
                    <h3 class="text-base font-bold text-gray-900 mb-1 truncate flex items-center gap-1">${l.business_name} ${checkmarkHtml}</h3>
                    <p class="text-xs text-gray-600 mb-1 truncate">${l.tagline || l.description}</p>
                    <div class="text-xs text-gray-600">
                        <div class="flex items-center gap-1 truncate">
                            <svg class="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                            <span class="truncate">${fullAddress}</span>
                        </div>
                    </div>
                </div>
            </a>
        `;
    }).join('');

    // Delegated click handler for star buttons in split view (same pattern as renderListings)
    container.addEventListener('click', function starClickDelegate(e) {
        const starBtn = e.target.closest('.star-button');
        if (!starBtn) return;
        e.preventDefault();
        e.stopPropagation();
        const id = starBtn.getAttribute('data-listing-id');
        if (id) toggleStar(id, e);
    });
}

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
*/

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
    
    /*
    Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    */
    
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
            const isFeatured = listing.tier === 'FEATURED' || listing.tier === 'PREMIUM';
            const logoImage = listing.logo || '';
            
            const iconClass = isFeatured ? 'custom-marker featured' : 'custom-marker';
            const iconHtml = logoImage ?
                `<div class="${iconClass}"><img src="${logoImage}" alt="${listing.business_name}"></div>` :
                `<div class="${iconClass}"><div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:12px;color:#666;">No logo</div></div>`;
            const customIcon = L.divIcon({ html: iconHtml, className: '', iconSize: [40, 40], iconAnchor: [20, 20] });
            const marker = L.marker([listing.coordinates.lat, listing.coordinates.lng], { icon: customIcon, riseOnHover: true });
            const badges = buildBadges(listing);
            const checkmarkHtml = showsVerifiedCheckmark(listing) ? '<span style="display:inline-flex;align-items:center;margin-left:4px;"><svg style="width:14px;height:14px;" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="12" fill="#055193"/><path d="M7 12.5l3.5 3.5L17 9" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>' : '';
            
            const categorySlug = listing.category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            const firstPhoto = listing.photos && listing.photos.length > 0 ? listing.photos[0] : (listing.logo || '');
            const popupContent = `
                <div class="map-popup">
                    ${firstPhoto ? `<img src="${firstPhoto}" alt="${listing.business_name}" class="map-popup-hero">` : '<div class="map-popup-hero" style="background:#f3f4f6;display:flex;align-items:center;justify-content:center;color:#9ca3af;">No image</div>'}
                    <div class="map-popup-content">
                        ${logoImage ? `<img src="${logoImage}" alt="${listing.business_name}" class="map-popup-logo">` : '<div class="map-popup-logo" style="background:#f3f4f6;display:flex;align-items:center;justify-content:center;font-size:10px;color:#9ca3af;">No logo</div>'}
                        <div class="map-popup-info">
                            <div class="map-popup-badges">${badges.join('')}</div>
                            <a href="/listing/${categorySlug}/${listing.slug}" class="map-popup-title" style="display:inline-flex;align-items:center;gap:4px;">${listing.business_name}${checkmarkHtml}</a>
                            <div class="map-popup-tagline">${listing.tagline || listing.description.substring(0, 60) + '...'}</div>
                            <div class="map-popup-details"><svg style="width:14px;height:14px;vertical-align:middle;" fill="none" stroke="#6b7280" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg> ${getFullAddress(listing)}<br>${listing.phone ? '<svg style="width:14px;height:14px;vertical-align:middle;" fill="none" stroke="#6b7280" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg> ' + formatPhoneDisplay(listing.phone) : ''}</div>
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
    
    /*
    Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    */
    
    // Add event listeners for split map controls
    const splitLocateBtn = document.getElementById('splitLocateBtn');
    if (splitLocateBtn) {
        splitLocateBtn.addEventListener('click', () => {
            if (userLocation) {
                splitMap.setView([userLocation.lat, userLocation.lng], 13);
                // Color the locate icon blue
                const splitLocateIcon = document.getElementById('splitLocateBtnIcon');
                if (splitLocateIcon) splitLocateIcon.setAttribute('fill', '#045093');
                // Reset on any map move
                const resetOnce = () => {
                    if (splitLocateIcon) splitLocateIcon.setAttribute('fill', '#000000');
                    splitMap.off('movestart', resetOnce);
                };
                splitMap.on('movestart', resetOnce);
            }
        });
    }
    
    document.getElementById('splitResetMapBtn')?.addEventListener('click', () => {
        splitMap.setView(defaultMapCenter, defaultMapZoom);
    });
}

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
This source code is proprietary and no part may not be used, reproduced, or distributed 
without written permission from The Greek Directory. Unauthorized use, copying, modification, 
or distribution of this code can result in legal action to the fullest extent permitted by law.
*/
