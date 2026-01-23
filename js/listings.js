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

function isIOSWebApp() {
    return ('standalone' in window.navigator) && window.navigator.standalone;
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

document.addEventListener('DOMContentLoaded', () => {
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
});

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
        updateResultsCount();
        geocodeAllListings();
    } catch (error) {
        console.error('Error loading listings:', error);
        document.getElementById('listingsContainer').innerHTML = 
            '<p class="text-center text-gray-600 py-12">Error loading listings. Please try again.</p>';
    }
}

window.toggleStar = toggleStar;
// ============================================
// LISTINGS PAGE JAVASCRIPT - PART 2
// Filtering & Business Logic
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

function loadMoreListings() {
    displayedListingsCount += 25;
    renderListings();
}

function normalizeString(str) {
    return str.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
}

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
// LISTINGS PAGE JAVASCRIPT - PART 3
// Rendering Functions
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
                            ${l.phone ? `<div class="flex items-center gap-2"><span>📞</span><span class="truncate">${formatPhoneDisplay(l.phone)}</span></div>` : ''}
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
                            ${l.phone ? `<div class="flex items-center gap-1"><span>📞</span><span class="truncate">${formatPhoneDisplay(l.phone)}</span></div>` : ''}
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

function updateResultsCount() {
    const count = filteredListings.length;
    if (!viewingStarredOnly) {
        document.getElementById('resultsCount').textContent = `${count} ${count === 1 ? 'listing' : 'listings'} found${selectedCategory !== 'All' ? ` in ${selectedCategory}` : ''}`;
    }
}

function updateRadiusValue() {
    ['radiusValue', 'radiusValue2'].forEach(id => {
        const valueSpan = document.getElementById(id);
        if (selectedRadius === 0) {
            valueSpan.textContent = 'Any distance';
        } else {
            valueSpan.textContent = `${selectedRadius} ${selectedRadius === 1 ? 'mile' : 'miles'}`;
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
    document.getElementById('locationSubtitle').textContent = subtitle;
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
// ============================================
// LISTINGS PAGE JAVASCRIPT - PART 4
// Event Listeners & UI Interactions
// ============================================

function setupEventListeners() {
    document.getElementById('searchInput').addEventListener('input', () => {
        updateURL();
        if (!viewingStarredOnly) {
            displayedListingsCount = 25;
            applyFilters();
        }
    });
    
    document.getElementById('filterBtn').addEventListener('click', toggleFilters);
    document.getElementById('closeFilterBtn').addEventListener('click', toggleFilters);
    document.getElementById('mapBtn').addEventListener('click', toggleMap);
    document.getElementById('mapBtnDesktop').addEventListener('click', toggleMap);
    document.getElementById('gridViewBtn').addEventListener('click', () => setView('grid'));
    document.getElementById('listViewBtn').addEventListener('click', () => setView('list'));
    document.getElementById('gridViewBtn2').addEventListener('click', () => setView('grid'));
    document.getElementById('listViewBtn2').addEventListener('click', () => setView('list'));
    document.getElementById('starredBtn').addEventListener('click', toggleStarredView);
    document.getElementById('splitViewBtn').addEventListener('click', toggleSplitView);
    document.getElementById('clearFiltersBtn').addEventListener('click', clearAllFilters);
    document.getElementById('clearFiltersBtn2').addEventListener('click', clearAllFilters);
    
    document.getElementById('refreshBtn').addEventListener('click', () => window.location.reload());
    
    document.getElementById('toggleFilterPosition').addEventListener('click', () => {
        if (filterPosition === 'left') {
            filterPosition = 'top';
        } else {
            filterPosition = 'left';
        }
        checkFilterPosition();
    });

    ['radiusFilter', 'radiusFilter2'].forEach(id => {
        const slider = document.getElementById(id);
        slider.addEventListener('input', (e) => {
            selectedRadius = parseInt(e.target.value);
            document.getElementById('radiusFilter').value = selectedRadius;
            document.getElementById('radiusFilter2').value = selectedRadius;
            updateRadiusValue();
            updateURL();
            if (!viewingStarredOnly) {
                displayedListingsCount = 25;
                applyFilters();
            }
        });
    });
    
    ['openNowFilter', 'openNowFilter2'].forEach(id => {
        document.getElementById(id).addEventListener('change', (e) => {
            openNowOnly = e.target.checked;
            document.getElementById('openNowFilter').checked = openNowOnly;
            document.getElementById('openNowFilter2').checked = openNowOnly;
            updateURL();
            if (!viewingStarredOnly) {
                displayedListingsCount = 25;
                applyFilters();
            }
        });
    });

    ['closedNowFilter', 'closedNowFilter2'].forEach(id => {
        document.getElementById(id).addEventListener('change', (e) => {
            closedNowOnly = e.target.checked;
            document.getElementById('closedNowFilter').checked = closedNowOnly;
            document.getElementById('closedNowFilter2').checked = closedNowOnly;
            updateURL();
            if (!viewingStarredOnly) {
                displayedListingsCount = 25;
                applyFilters();
            }
        });
    });

    ['openingSoonFilter', 'openingSoonFilter2'].forEach(id => {
        document.getElementById(id).addEventListener('change', (e) => {
            openingSoonOnly = e.target.checked;
            document.getElementById('openingSoonFilter').checked = openingSoonOnly;
            document.getElementById('openingSoonFilter2').checked = openingSoonOnly;
            updateURL();
            if (!viewingStarredOnly) {
                displayedListingsCount = 25;
                applyFilters();
            }
        });
    });

    ['closingSoonFilter', 'closingSoonFilter2'].forEach(id => {
        document.getElementById(id).addEventListener('change', (e) => {
            closingSoonOnly = e.target.checked;
            document.getElementById('closingSoonFilter').checked = closingSoonOnly;
            document.getElementById('closingSoonFilter2').checked = closingSoonOnly;
            updateURL();
            if (!viewingStarredOnly) {
                displayedListingsCount = 25;
                applyFilters();
            }
        });
    });

    ['hoursUnknownFilter', 'hoursUnknownFilter2'].forEach(id => {
        document.getElementById(id).addEventListener('change', (e) => {
            hoursUnknownOnly = e.target.checked;
            document.getElementById('hoursUnknownFilter').checked = hoursUnknownOnly;
            document.getElementById('hoursUnknownFilter2').checked = hoursUnknownOnly;
            updateURL();
            if (!viewingStarredOnly) {
                displayedListingsCount = 25;
                applyFilters();
            }
        });
    });
    
    ['onlineOnlyFilter', 'onlineOnlyFilter2'].forEach(id => {
        document.getElementById(id).addEventListener('change', (e) => {
            onlineOnly = e.target.checked;
            document.getElementById('onlineOnlyFilter').checked = onlineOnly;
            document.getElementById('onlineOnlyFilter2').checked = onlineOnly;
            updateURL();
            if (!viewingStarredOnly) {
                displayedListingsCount = 25;
                applyFilters();
            }
        });
    });
    
    document.getElementById('sortSelect').addEventListener('change', () => {
        displayedListingsCount = 25;
        if (!viewingStarredOnly) applyFilters();
        else renderListings();
    });
    
    ['countryFilter', 'countryFilter2'].forEach(id => {
        document.getElementById(id).addEventListener('change', (e) => {
            selectedCountry = e.target.value;
            document.getElementById('countryFilter').value = selectedCountry;
            document.getElementById('countryFilter2').value = selectedCountry;
            if (selectedCountry === 'USA') {
                document.getElementById('stateFilterContainer').classList.remove('hidden');
                document.getElementById('stateFilterContainer2').classList.remove('hidden');
                populateStateFilter('USA');
            } else {
                document.getElementById('stateFilterContainer').classList.add('hidden');
                document.getElementById('stateFilterContainer2').classList.add('hidden');
                selectedState = '';
            }
            updateURL();
            if (!viewingStarredOnly) {
                displayedListingsCount = 25;
                applyFilters();
            }
        });
    });
    
    ['stateFilter', 'stateFilter2'].forEach(id => {
        document.getElementById(id).addEventListener('change', (e) => {
            selectedState = e.target.value;
            document.getElementById('stateFilter').value = selectedState;
            document.getElementById('stateFilter2').value = selectedState;
            updateURL();
            if (!viewingStarredOnly) {
                displayedListingsCount = 25;
                applyFilters();
            }
        });
    });
    
    const locateBtn = document.getElementById('locateBtn');
    locateBtn.addEventListener('click', () => {
        if (userLocation) {
            locationButtonActive = true;
            mapMoved = false;
            locateBtn.classList.add('active');
            map.setView([userLocation.lat, userLocation.lng], 13);
            addUserLocationMarker();
        } else {
            requestLocationOnLoad();
        }
    });
    
    document.getElementById('resetMapBtn').addEventListener('click', () => {
        if (map) {
            map.setView(defaultMapCenter, defaultMapZoom);
            if (mapReady && allListingsGeocoded) updateMapMarkers();
        }
    });
    
    ['categorySearch', 'categorySearch2'].forEach(id => {
        document.getElementById(id).addEventListener('input', (e) => {
            if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
            searchDebounceTimer = setTimeout(() => {
                filterCategoriesAndSubcategories(e.target.value);
            }, 300);
        });
    });

    setupLocationSearch();
    
    window.addEventListener('resize', checkFilterPosition);
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

function toggleFilters() {
    const panel = document.getElementById('filterPanel');
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
    mapOpen = !mapOpen;
    if (mapOpen) {
        container.classList.remove('hidden');
        if (filtersOpen) toggleFilters();
        if (splitViewActive) toggleSplitView();
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

function showMapLoading() {
    const loading = document.getElementById('mapLoading');
    if (loading) loading.style.display = 'block';
}

function hideMapLoading() {
    const loading = document.getElementById('mapLoading');
    if (loading) loading.style.display = 'none';
}
// ============================================
// LISTINGS PAGE JAVASCRIPT - PART 5
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
            document.getElementById(containerId).classList.remove('hidden');
            const filtersDiv = document.getElementById(filtersId);
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
        });
    } else if (matchingSubcategories && matchingSubcategories.length > 0) {
        ['subcategoryContainer', 'subcategoryContainer2'].forEach((containerId, idx) => {
            const filtersId = idx === 0 ? 'subcategoryFilters' : 'subcategoryFilters2';
            document.getElementById(containerId).classList.remove('hidden');
            const filtersDiv = document.getElementById(filtersId);
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
        });
    } else {
        ['subcategoryContainer', 'subcategoryContainer2'].forEach(id => {
            document.getElementById(id).classList.add('hidden');
        });
    }
}

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

function setupLocationSearch() {
    ['locationSearch', 'locationSearch2'].forEach(id => {
        const input = document.getElementById(id);
        const resultsId = id + 'Results';
        const resultsDiv = document.getElementById(resultsId);

        input.addEventListener('input', () => {
            const query = input.value.toLowerCase().trim();
            
            if (id === 'locationSearch') {
                document.getElementById('locationSearch2').value = input.value;
            } else {
                document.getElementById('locationSearch').value = input.value;
            }

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

                if (city && city.includes(query) && !seen.has(`city-${city}`)) {
                    matches.push({ type: 'city', value: listing.city, state: listing.state, display: `${listing.city}, ${listing.state}` });
                    seen.add(`city-${city}`);
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
                            document.getElementById('countryFilter').value = 'USA';
                            document.getElementById('countryFilter2').value = 'USA';
                            document.getElementById('stateFilterContainer').classList.remove('hidden');
                            document.getElementById('stateFilterContainer2').classList.remove('hidden');
                            populateStateFilter('USA');
                            document.getElementById('stateFilter').value = state;
                            document.getElementById('stateFilter2').value = state;
                        } else if (type === 'state') {
                            selectedCountry = 'USA';
                            selectedState = value;
                            document.getElementById('countryFilter').value = 'USA';
                            document.getElementById('countryFilter2').value = 'USA';
                            document.getElementById('stateFilterContainer').classList.remove('hidden');
                            document.getElementById('stateFilterContainer2').classList.remove('hidden');
                            populateStateFilter('USA');
                            document.getElementById('stateFilter').value = value;
                            document.getElementById('stateFilter2').value = value;
                        } else if (type === 'zip') {
                            const state = elem.dataset.state;
                            selectedCountry = 'USA';
                            selectedState = state;
                            document.getElementById('countryFilter').value = 'USA';
                            document.getElementById('countryFilter2').value = 'USA';
                            document.getElementById('stateFilterContainer').classList.remove('hidden');
                            document.getElementById('stateFilterContainer2').classList.remove('hidden');
                            populateStateFilter('USA');
                            document.getElementById('stateFilter').value = state;
                            document.getElementById('stateFilter2').value = state;
                        } else if (type === 'country') {
                            selectedCountry = value;
                            selectedState = '';
                            document.getElementById('countryFilter').value = value;
                            document.getElementById('countryFilter2').value = value;
                            if (value === 'USA') {
                                document.getElementById('stateFilterContainer').classList.remove('hidden');
                                document.getElementById('stateFilterContainer2').classList.remove('hidden');
                                populateStateFilter('USA');
                            } else {
                                document.getElementById('stateFilterContainer').classList.add('hidden');
                                document.getElementById('stateFilterContainer2').classList.add('hidden');
                            }
                        }

                        input.value = '';
                        document.getElementById('locationSearch').value = '';
                        document.getElementById('locationSearch2').value = '';
                        resultsDiv.style.display = 'none';
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
// ============================================
// LISTINGS PAGE JAVASCRIPT - PART 6
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
                            <div class="map-popup-details">📍 ${getFullAddress(listing)}<br>${listing.phone ? '📞 ' + formatPhoneDisplay(listing.phone) : ''}</div>
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
                            <div class="map-popup-details">📍 ${getFullAddress(listing)}<br>${listing.phone ? '📞 ' + formatPhoneDisplay(listing.phone) : ''}</div>
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
