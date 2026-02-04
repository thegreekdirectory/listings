/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
This source code is proprietary and no part may not be used, reproduced, or distributed 
without written permission from The Greek Directory. Unauthorized use, copying, modification, 
or distribution of this code will result in legal action to the fullest extent permitted by law.
*/

// ============================================
// LISTINGS.JS - PART 1: CONFIGURATION & GLOBALS
// ============================================

const SUPABASE_URL = 'https://luetekzqrrgdxtopzvqw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1ZXRla3pxcnJnZHh0b3B6dnF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNDc2NDcsImV4cCI6MjA4MzkyMzY0N30.TIrNG8VGumEJc_9JvNHW-Q-UWfUGpPxR0v8POjWZJYg';

const CATEGORIES = [
    'Automotive & Transportation',
    'Beauty & Health',
    'Church & Religious Organization',
    'Cultural/Fraternal Organization',
    'Education & Community',
    'Entertainment, Arts & Recreation',
    'Food & Hospitality',
    'Grocery & Imports',
    'Home & Construction',
    'Industrial & Manufacturing',
    'Pets & Veterinary',
    'Professional & Business Services',
    'Real Estate & Development',
    'Retail & Shopping'
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

// Global State Variables
let listingsSupabase = null;
let SUBCATEGORIES = {};
let allListings = [];
let filteredListings = [];
let currentView = 'grid';
let selectedCategory = 'All';
let selectedSubcategories = [];
let subcategoryMode = 'any';
let selectedCountry = '';
let selectedState = '';
let selectedCity = '';
let selectedZip = '';
let selectedRadius = 0;
let openNowOnly = false;
let closedNowOnly = false;
let openingSoonOnly = false;
let closingSoonOnly = false;
let hoursUnknownOnly = false;
let onlineOnly = false;
let userLocation = null;
let map = null;
let mapOpen = false;
let splitViewActive = false;
let filtersOpen = false;
let markerClusterGroup = null;
let defaultMapCenter = [41.8781, -87.6298];
let defaultMapZoom = 10;
let userLocationMarker = null;
let mapReady = false;
let allListingsGeocoded = false;
let starredListings = [];
let viewingStarredOnly = false;
let mapMoved = false;
let locationButtonActive = false;
let filterPosition = 'top';
let searchDebounceTimer = null;
let displayedListingsCount = 25;
let estimatedUserLocation = null;
let selectedSplitListingId = null;
let desktopFiltersOverlay = false;
let splitMap = null;
let splitMarkerClusterGroup = null;

const VERIFIED_CHECKMARK_SVG = `<svg style="width:20px;height:20px;flex-shrink:0;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="12" fill="#055193"/><path d="M7 12.5l3.5 3.5L17 9" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

// ============================================
// UTILITY FUNCTIONS
// ============================================

function formatPhoneDisplay(phone) {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');
    if (phone.startsWith('+1') && digits.length === 11) {
        return `(${digits.substr(1, 3)}) ${digits.substr(4, 3)}-${digits.substr(7, 4)}`;
    }
    return phone;
}

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

function normalizeString(str) {
    return str.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
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
// ============================================
// LISTINGS.JS - PART 2: STARRED LISTINGS SYSTEM
// ============================================

function loadStarredListings() {
    try {
        const stored = getCookie('starredListings');
        if (stored) {
            try {
                starredListings = JSON.parse(stored);
            } catch (e) {
                console.error('Failed to parse starred listings cookie:', e);
                starredListings = [];
            }
        }
        updateStarredCount();
        if (new URLSearchParams(window.location.search).get('starred') === '1') {
            viewingStarredOnly = true;
        }
    } catch (e) {
        console.error('Failed to load starred listings:', e);
        starredListings = [];
    }
}

function saveStarredListings() {
    try {
        setCookie('starredListings', JSON.stringify(starredListings), 365);
        updateStarredCount();
    } catch (e) {
        console.error('Failed to save starred listings:', e);
        alert('Unable to save starred listings. Please check that cookies are enabled in your browser.');
    }
}

function toggleStar(listingId, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    listingId = String(listingId);
    
    const index = starredListings.indexOf(listingId);
    
    if (index > -1) {
        starredListings.splice(index, 1);
    } else {
        starredListings.push(listingId);
    }
    saveStarredListings();

    const buttons = document.querySelectorAll('.star-button[data-listing-id="' + listingId + '"]');
    
    buttons.forEach(btn => {
        if (starredListings.includes(listingId)) {
            btn.classList.add('starred');
        } else {
            btn.classList.remove('starred');
        }
    });

    if (viewingStarredOnly) {
        filteredListings = allListings.filter(l => starredListings.includes(String(l.id)));
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

function toggleStarredView() {
    loadStarredListings();
    
    viewingStarredOnly = !viewingStarredOnly;
    const headerStarBtn = document.getElementById('headerStarBtn');
    const hideStarredBtn = document.getElementById('hideStarredBtn');
    
    if (viewingStarredOnly) {
        if (starredListings.length === 0) {
            alert('You haven\'t starred any listings yet!');
            viewingStarredOnly = false;
            return;
        }
        
        if (hideStarredBtn) hideStarredBtn.classList.remove('hidden');
        
        let starredLis = allListings.filter(l => starredListings.includes(String(l.id)));
        
        if (selectedCategory && selectedCategory !== 'All') {
            starredLis = starredLis.filter(l => l.category === selectedCategory);
        }
        
        if (selectedSubcategories.length > 0) {
            starredLis = starredLis.filter(l => 
                l.subcategories && l.subcategories.some(sub => selectedSubcategories.includes(sub))
            );
        }
        
        const searchInput = document.getElementById('searchInput');
        if (searchInput && searchInput.value.trim()) {
            const searchTerm = searchInput.value.trim().toLowerCase();
            starredLis = starredLis.filter(l => 
                l.business_name.toLowerCase().includes(searchTerm) ||
                (l.description && l.description.toLowerCase().includes(searchTerm)) ||
                (l.tagline && l.tagline.toLowerCase().includes(searchTerm)) ||
                l.category.toLowerCase().includes(searchTerm) ||
                (l.subcategories && l.subcategories.some(sub => sub.toLowerCase().includes(searchTerm)))
            );
        }
        
        if (openNowOnly) starredLis = starredLis.filter(l => isOpenNow(l.hours));
        if (closedNowOnly) starredLis = starredLis.filter(l => !isOpenNow(l.hours));
        if (openingSoonOnly) starredLis = starredLis.filter(l => isOpeningSoon(l.hours));
        if (closingSoonOnly) starredLis = starredLis.filter(l => isClosingSoon(l.hours));
        if (hoursUnknownOnly) starredLis = starredLis.filter(l => !l.hours || Object.keys(l.hours).length === 0);
        if (onlineOnly) starredLis = starredLis.filter(l => l.online_only);
        
        if (selectedCountry && selectedCountry !== 'All') {
            starredLis = starredLis.filter(l => l.country === selectedCountry);
        }
        if (selectedState && selectedState !== 'All') {
            starredLis = starredLis.filter(l => l.state === selectedState);
        }
        if (selectedCity) {
            starredLis = starredLis.filter(l => l.city && l.city.toLowerCase() === selectedCity.toLowerCase());
        }
        if (selectedZip) {
            starredLis = starredLis.filter(l => l.zip_code === selectedZip);
        }
        
        if (userLocation && selectedRadius > 0 && selectedRadius < 999) {
            starredLis = starredLis.filter(l => {
                if (!l.coordinates || !l.coordinates.lat || !l.coordinates.lng) return false;
                const dist = calculateDistance(userLocation.lat, userLocation.lng, l.coordinates.lat, l.coordinates.lng);
                return dist <= selectedRadius;
            });
        }
        
        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) {
            const sortValue = sortSelect.value;
            applySortToListings(starredLis, sortValue);
        }
        
        filteredListings = starredLis;
        displayedListingsCount = filteredListings.length;
        
        document.getElementById('resultsCount').textContent = `${filteredListings.length} starred ${filteredListings.length === 1 ? 'listing' : 'listings'}`;
        
        if (headerStarBtn) {
            headerStarBtn.style.backgroundColor = '#fbbf24';
            headerStarBtn.style.color = '#78350f';
        }
    } else {
        if (hideStarredBtn) hideStarredBtn.classList.add('hidden');
        
        displayedListingsCount = 25;
        applyFilters();
        
        if (headerStarBtn) {
            headerStarBtn.style.backgroundColor = '';
            headerStarBtn.style.color = '';
        }
    }
    renderListings();
    updateResultsCount();
}

function applySortToListings(listings, sortValue) {
    if (sortValue === 'az') {
        listings.sort((a, b) => a.business_name.localeCompare(b.business_name));
    } else if (sortValue === 'closest' && userLocation) {
        listings.sort((a, b) => {
            const distA = (a.coordinates && a.coordinates.lat && a.coordinates.lng) ? 
                calculateDistance(userLocation.lat, userLocation.lng, a.coordinates.lat, a.coordinates.lng) : Infinity;
            const distB = (b.coordinates && b.coordinates.lat && b.coordinates.lng) ? 
                calculateDistance(userLocation.lat, userLocation.lng, b.coordinates.lat, b.coordinates.lng) : Infinity;
            return distA - distB;
        });
    } else if (sortValue === 'random') {
        for (let i = listings.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [listings[i], listings[j]] = [listings[j], listings[i]];
        }
    }
}
// ============================================
// LISTINGS.JS - PART 3: HOURS & STATUS FUNCTIONS
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

// ============================================
// BADGE & CHECKMARK HELPERS
// ============================================

function buildBadges(listing) {
    const badges = [];
    const openStatus = isOpenNow(listing.hours);
    const openingSoon = isOpeningSoon(listing.hours);
    const closingSoon = isClosingSoon(listing.hours);

    if (openingSoon) {
        badges.push('<span class="badge badge-opening-soon">Opening Soon</span>');
    } else if (closingSoon) {
        badges.push('<span class="badge badge-closing-soon">Closing Soon</span>');
    } else if (openStatus === true) {
        badges.push('<span class="badge badge-open">Open</span>');
    } else if (openStatus === false) {
        badges.push('<span class="badge badge-closed">Closed</span>');
    }

    const isFeatured = listing.tier === 'FEATURED' || listing.tier === 'PREMIUM';
    const isVerified  = listing.verified || listing.tier === 'VERIFIED';

    if (isFeatured) {
        badges.push('<span class="badge badge-featured">Featured</span>');
    } else if (isVerified) {
        badges.push('<span class="badge badge-verified">Verified</span>');
    }

    return badges;
}

function showsVerifiedCheckmark(listing) {
    const isFeatured = listing.tier === 'FEATURED' || listing.tier === 'PREMIUM';
    const isVerified  = listing.verified || listing.tier === 'VERIFIED';
    return isFeatured || isVerified || listing.show_claim_button === false;
}

// FIXED: Generate Call Button with proper spacing (right: 116px)
function generateCallButton(listing) {
    if (!listing.phone) return '';
    
    return `
        <a href="tel:${listing.phone}" 
           onclick="event.stopPropagation();"
           style="position:absolute;bottom:8px;right:116px;display:inline-flex;align-items:center;gap:4px;padding:6px 10px;background:#10b981;color:white;border-radius:6px;font-size:12px;font-weight:500;text-decoration:none;box-shadow:0 2px 4px rgba(0,0,0,0.1);transition:background 0.2s;z-index:10;touch-action:manipulation;-webkit-tap-highlight-color:transparent;" 
           onmouseover="this.style.background='#059669'" 
           onmouseout="this.style.background='#10b981'">
            <svg style="width:14px;height:14px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
            </svg>
            Call
        </a>
    `;
}
// ============================================
// LISTINGS.JS - PART 4: LOCATION & GEOCODING
// ============================================

function requestLocationOnLoad() {
    if (!navigator.geolocation) {
        console.error('Geolocation not supported by this browser');
        return;
    }
    
    navigator.geolocation.getCurrentPosition(
        position => {
            userLocation = { lat: position.coords.latitude, lng: position.coords.longitude };
            console.log('Location acquired:', userLocation);
            if (!viewingStarredOnly) applyFilters();
            if (map && mapOpen) addUserLocationMarker();
        },
        (error) => {
            if (error.code === 1) {
                console.log('Geolocation permission denied');
            } else if (error.code === 3) {
                console.log('Geolocation timeout');
            } else {
                console.log('Location error:', error.message);
            }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
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

async function geocodeAllListings() {
    if (allListingsGeocoded) return;
    
    console.log('Starting geocoding for', allListings.length, 'listings');
    
    for (const listing of allListings) {
        if (listing.coordinates && listing.coordinates.lat && listing.coordinates.lng) {
            continue;
        }
        
        const fullAddress = getFullAddress(listing);
        if (!fullAddress) continue;
        
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}&limit=1`
            );
            const data = await response.json();
            
            if (data && data.length > 0) {
                listing.coordinates = {
                    lat: parseFloat(data[0].lat),
                    lng: parseFloat(data[0].lon)
                };
                console.log('Geocoded:', listing.business_name, '→', listing.coordinates);
            }
            
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
            console.error('Geocoding error for', listing.business_name, ':', error);
        }
    }
    
    allListingsGeocoded = true;
    console.log('Geocoding complete');
    
    if (map) updateMapMarkers();
}

function updateLocationSubtitle() {
    const subtitle = document.getElementById('locationSubtitle');
    if (!subtitle) return;
    
    const effectiveLocation = userLocation || estimatedUserLocation;
    
    if (effectiveLocation) {
        const city = effectiveLocation.city || 'Unknown City';
        const state = effectiveLocation.state || '';
        const estimated = effectiveLocation.estimated ? ' (estimated)' : '';
        subtitle.textContent = `Showing listings near ${city}, ${state}${estimated}`;
    } else {
        subtitle.textContent = 'Showing all listings';
    }
}
// ============================================
// LISTINGS.JS - PART 5: FILTERING & URL MANAGEMENT
// ============================================

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

    const city = urlParams.get('city');
    if (city) selectedCity = city;

    const zip = urlParams.get('zip');
    if (zip) selectedZip = zip;
    
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

    createCategoryButtons();
    updateSubcategoryDisplay();
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
    if (selectedCity) url.searchParams.set('city', selectedCity);
    if (selectedZip) url.searchParams.set('zip', selectedZip);
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
// ============================================
// LISTINGS.JS - PART 6: LOAD LISTINGS & APPLY FILTERS
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
        
        if (viewingStarredOnly) {
            if (starredListings.length === 0) {
                viewingStarredOnly = false;
            } else {
                filteredListings = allListings.filter(l => starredListings.includes(String(l.id)));
                displayedListingsCount = filteredListings.length;
                console.log('Filtered to starred listings:', filteredListings.length, 'of', starredListings.length, 'starred IDs');
            }
        }
        
        updateResultsCount();
        renderListings();
        geocodeAllListings();
    } catch (error) {
        console.error('Error loading listings:', error);
        const listingsContainer = document.getElementById('listingsContainer');
        if (listingsContainer) {
            listingsContainer.innerHTML = '<div class="text-center py-12"><p class="text-red-600 font-semibold mb-2">Error Code: L101</p><p class="text-gray-600">Failed to load listings. Please try refreshing the page.</p></div>';
        }
    }
}

function applyFilters() {
    const searchInput = document.getElementById('searchInput');
    const searchTerm = normalizeString(searchInput ? searchInput.value : '');
    const sortSelect = document.getElementById('sortSelect');
    const sortOption = sortSelect ? sortSelect.value : 'default';
    
    filteredListings = allListings.filter(listing => {
        const fullAddress = getFullAddress(listing);
        const normalizedName = normalizeString(listing.business_name);
        const normalizedTagline = normalizeString(listing.tagline || '');
        const normalizedDescription = normalizeString(listing.description || '');
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
        const matchesCity = !selectedCity || (listing.city && listing.city.toLowerCase() === selectedCity.toLowerCase());
        const matchesZip = !selectedZip || (listing.zip_code && listing.zip_code === selectedZip);
        
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
               matchesState && matchesCity && matchesZip && matchesRadius && matchesOpenNow && matchesClosedNow &&
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
    
    if (!window._sortRandomSeed) {
        window._sortRandomSeed = Math.random() * 1000000;
    }
    
    function seededRandom(seed, id) {
        const x = Math.sin(seed + id) * 10000;
        return x - Math.floor(x);
    }
    
    filteredListings.sort((a, b) => {
        if (sortOption === 'random') {
            return Math.random() - 0.5;
        } else if (sortOption === 'default') {
            const aTier = a.tier || 'FREE';
            const bTier = b.tier || 'FREE';
            const tierPriority = { PREMIUM: 100, FEATURED: 50, VERIFIED: 20, FREE: 0 };
            
            const effectiveUserLocation = userLocation || estimatedUserLocation;
            
            let aScore = 0;
            let bScore = 0;
            
            aScore += tierPriority[aTier];
            bScore += tierPriority[bTier];
            
            if (effectiveUserLocation && a.coordinates && b.coordinates) {
                if (a._inUserCity) aScore += 40;
                if (b._inUserCity) bScore += 40;
                
                if (a._inUserState && !a._inUserCity) aScore += 20;
                if (b._inUserState && !b._inUserCity) bScore += 20;
                
                const aDistance = a._distance || 999;
                const bDistance = b._distance || 999;
                if (aDistance < 999) {
                    if (aDistance <= 5) aScore += 30;
                    else if (aDistance <= 10) aScore += 20;
                    else if (aDistance <= 25) aScore += 10;
                    else if (aDistance <= 50) aScore += 5;
                }
                if (bDistance < 999) {
                    if (bDistance <= 5) bScore += 30;
                    else if (bDistance <= 10) bScore += 20;
                    else if (bDistance <= 25) bScore += 10;
                    else if (bDistance <= 50) bScore += 5;
                }
            }
            
            const aRandom = seededRandom(window._sortRandomSeed, parseInt(a.id) || 0);
            const bRandom = seededRandom(window._sortRandomSeed, parseInt(b.id) || 0);
            aScore += aRandom * 40;
            bScore += bRandom * 40;
            
            if (Math.abs(aScore - bScore) > 0.1) {
                return bScore - aScore;
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
// ============================================
// LISTINGS.JS - PART 7: RENDERING FUNCTIONS
// ============================================

function renderListings() {
    const container = document.getElementById('listingsContainer');
    if (!container) return;

    if (splitViewActive) {
        renderSplitViewListings();
        return;
    }

    const listingsToShow = filteredListings.slice(0, displayedListingsCount);
    
    if (listingsToShow.length === 0) {
        container.innerHTML = '<div class="text-center py-12"><p class="text-gray-600 text-lg">No listings found matching your criteria.</p></div>';
        return;
    }

    if (currentView === 'grid') {
        container.className = 'grid gap-6 listings-3-col';
        checkFilterPosition();
        
        container.innerHTML = listingsToShow.map(listing => {
            const categorySlug = listing.category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            const listingUrl = `/listing/${categorySlug}/${listing.slug}`;
            const fullAddress = getFullAddress(listing);
            const badges = buildBadges(listing);
            const isStarred = starredListings.includes(String(listing.id));
            const firstPhoto = listing.photos && listing.photos.length > 0 ? listing.photos[0] : '';
            const logoImage = listing.logo || '';
            const checkmarkHtml = showsVerifiedCheckmark(listing) ? VERIFIED_CHECKMARK_SVG : '';
            
            return `
                <div class="listing-card bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden relative">
                    <button class="star-button ${isStarred ? 'starred' : ''}" 
                            onclick="toggleStar('${listing.id}', event)" 
                            data-listing-id="${listing.id}"
                            style="position: absolute; top: 12px; right: 12px; z-index: 10; width: 36px; height: 36px; background: rgba(255, 255, 255, 0.95); border: 1px solid rgba(0, 0, 0, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
                        <svg class="star-icon" style="width: 20px; height: 20px; transition: all 0.2s;" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                    </button>
                    
                    <a href="${listingUrl}" class="block">
                        ${firstPhoto ? 
                            `<img src="${firstPhoto}" alt="${listing.business_name}" class="w-full h-48 object-cover">` :
                            `<div class="w-full h-48 bg-gradient-to-br from-blue-800 to-blue-600 flex items-center justify-center">
                                <svg class="w-16 h-16 text-white opacity-50" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"/>
                                </svg>
                            </div>`
                        }
                        
                        <div class="p-5">
                            ${logoImage ? 
                                `<div class="flex items-start gap-3 mb-3">
                                    <img src="${logoImage}" alt="${listing.business_name} logo" class="w-16 h-16 rounded-lg object-cover flex-shrink-0 bg-white">
                                    <div class="flex-1 min-w-0">
                                        <div class="flex gap-2 mb-2 flex-wrap">${badges.join('')}</div>
                                        <h3 class="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2" style="word-wrap: break-word; hyphens: auto;">
                                            ${listing.business_name} ${checkmarkHtml}
                                        </h3>
                                    </div>
                                </div>` :
                                `<div>
                                    <div class="flex gap-2 mb-2 flex-wrap">${badges.join('')}</div>
                                    <h3 class="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2" style="word-wrap: break-word; hyphens: auto;">
                                        ${listing.business_name} ${checkmarkHtml}
                                    </h3>
                                </div>`
                            }
                            
                            ${listing.tagline ? `<p class="text-gray-700 text-sm mb-3 line-clamp-2" style="word-wrap: break-word; hyphens: auto;">${listing.tagline}</p>` : ''}
                            
                            <div class="text-sm text-gray-600 space-y-2">
                                ${fullAddress ? `
                                    <div class="flex items-start gap-2">
                                        <svg class="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                                        </svg>
                                        <span class="line-clamp-2">${fullAddress}</span>
                                    </div>
                                ` : ''}
                                
                                ${listing.phone ? `
                                    <div class="flex items-center gap-2">
                                        <svg class="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                                        </svg>
                                        <span>${formatPhoneDisplay(listing.phone)}</span>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </a>
                </div>
            `;
        }).join('');
    } else {
        container.className = 'space-y-4';
        
        container.innerHTML = listingsToShow.map(listing => {
            const categorySlug = listing.category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            const listingUrl = `/listing/${categorySlug}/${listing.slug}`;
            const fullAddress = getFullAddress(listing);
            const badges = buildBadges(listing);
            const isStarred = starredListings.includes(String(listing.id));
            const firstPhoto = listing.photos && listing.photos.length > 0 ? listing.photos[0] : '';
            const logoImage = listing.logo || '';
            const checkmarkHtml = showsVerifiedCheckmark(listing) ? VERIFIED_CHECKMARK_SVG : '';
            
            return `
                <div class="listing-card bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden relative flex">
                    <button class="star-button ${isStarred ? 'starred' : ''}" 
                            onclick="toggleStar('${listing.id}', event)" 
                            data-listing-id="${listing.id}"
                            style="position: absolute; top: 12px; right: 12px; z-index: 10; width: 36px; height: 36px; background: rgba(255, 255, 255, 0.95); border: 1px solid rgba(0, 0, 0, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
                        <svg class="star-icon" style="width: 20px; height: 20px; transition: all 0.2s;" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                    </button>
                    
                    <a href="${listingUrl}" class="flex w-full">
                        ${firstPhoto ? 
                            `<img src="${firstPhoto}" alt="${listing.business_name}" class="w-64 h-full object-cover flex-shrink-0">` :
                            `<div class="w-64 h-48 bg-gradient-to-br from-blue-800 to-blue-600 flex items-center justify-center flex-shrink-0">
                                <svg class="w-16 h-16 text-white opacity-50" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"/>
                                </svg>
                            </div>`
                        }
                        
                        <div class="p-5 flex-1 pr-16">
                            ${logoImage ? 
                                `<div class="flex items-start gap-3 mb-3">
                                    <img src="${logoImage}" alt="${listing.business_name} logo" class="w-16 h-16 rounded-lg object-cover flex-shrink-0 bg-white">
                                    <div class="flex-1 min-w-0">
                                        <div class="flex gap-2 mb-2 flex-wrap">${badges.join('')}</div>
                                        <h3 class="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2" style="word-wrap: break-word; hyphens: auto;">
                                            ${listing.business_name} ${checkmarkHtml}
                                        </h3>
                                    </div>
                                </div>` :
                                `<div>
                                    <div class="flex gap-2 mb-2 flex-wrap">${badges.join('')}</div>
                                    <h3 class="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2" style="word-wrap: break-word; hyphens: auto;">
                                        ${listing.business_name} ${checkmarkHtml}
                                    </h3>
                                </div>`
                            }
                            
                            ${listing.tagline ? `<p class="text-gray-700 text-sm mb-3 line-clamp-2" style="word-wrap: break-word; hyphens: auto;">${listing.tagline}</p>` : ''}
                            
                            <div class="text-sm text-gray-600 space-y-2">
                                ${fullAddress ? `
                                    <div class="flex items-start gap-2">
                                        <svg class="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                                        </svg>
                                        <span class="line-clamp-2">${fullAddress}</span>
                                    </div>
                                ` : ''}
                                
                                ${listing.phone ? `
                                    <div class="flex items-center gap-2">
                                        <svg class="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                                        </svg>
                                        <span>${formatPhoneDisplay(listing.phone)}</span>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </a>
                </div>
            `;
        }).join('');
    }

    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
        if (displayedListingsCount < filteredListings.length) {
            loadMoreBtn.classList.remove('hidden');
        } else {
            loadMoreBtn.classList.add('hidden');
        }
    }
}

function updateResultsCount() {
    const countEl = document.getElementById('resultsCount');
    if (countEl) {
        if (viewingStarredOnly) {
            countEl.textContent = `${filteredListings.length} starred ${filteredListings.length === 1 ? 'listing' : 'listings'}`;
        } else {
            countEl.textContent = `${filteredListings.length} ${filteredListings.length === 1 ? 'listing' : 'listings'}`;
        }
    }
}
// ============================================
// LISTINGS.JS - PART 8: MAP INITIALIZATION & CONTROLS
// ============================================

function initMap() {
    if (mapReady) return;
    
    map = L.map('map', {
        center: defaultMapCenter,
        zoom: defaultMapZoom,
        zoomControl: false
    });
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);
    
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    
    markerClusterGroup = L.markerClusterGroup({
        maxClusterRadius: 50,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: false
    });
    
    map.addLayer(markerClusterGroup);
    
    // CRITICAL FIX: Map cluster click handler with radius filter and tier sorting
    markerClusterGroup.on('clusterclick', function(event) {
        const cluster = event.layer;
        const childMarkers = cluster.getAllChildMarkers();
        
        if (childMarkers.length > 10) {
            map.setView(cluster.getLatLng(), map.getZoom() + 2);
            return;
        }
        
        // FIXED: Filter by 0.1 mile radius
        const clusterCenter = cluster.getLatLng();
        const nearbyMarkers = childMarkers.filter(m => {
            const markerPos = m.getLatLng();
            const dist = calculateDistance(
                clusterCenter.lat, clusterCenter.lng,
                markerPos.lat, markerPos.lng
            );
            return dist <= 0.1;
        });
        
        const listings = nearbyMarkers.map(m => {
            const listingId = m.options.listingId;
            return filteredListings.find(l => String(l.id) === String(listingId));
        }).filter(Boolean);
        
        if (listings.length === 0) return;
        
        // FIXED: Sort by tier
        const tierPriority = { PREMIUM: 4, FEATURED: 3, VERIFIED: 2, FREE: 1 };
        listings.sort((a, b) => {
            const aTier = a.tier || 'FREE';
            const bTier = b.tier || 'FREE';
            return tierPriority[bTier] - tierPriority[aTier];
        });
        
        // Create popup with all fixes
        const clusterPopupContent = listings.map(listing => {
            const fullAddr = getFullAddress(listing);
            const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fullAddr)}`;
            const callButton = generateCallButton(listing);
            const badges = buildBadges(listing);
            const firstPhoto = listing.photos && listing.photos.length > 0 ? listing.photos[0] : '';
            const logoImage = listing.logo || '';
            const categorySlug = listing.category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            const checkmarkHtml = showsVerifiedCheckmark(listing) ? 
                '<svg style="width:16px;height:16px;margin-left:4px;flex-shrink:0;" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="12" fill="#055193"/><path d="M7 12.5l3.5 3.5L17 9" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>' : '';
            
            return `
                <div class="map-popup" style="width: 280px; margin-bottom: ${listings.length > 1 ? '16px' : '0'}; border-bottom: ${listings.length > 1 ? '1px solid #e5e7eb; padding-bottom: 16px' : '0'};">
                    ${firstPhoto ? `
                        <img src="${firstPhoto}" alt="${listing.business_name}" style="width:100%;height:140px;object-fit:cover;border-radius:12px 12px 0 0;">
                    ` : `
                        <div style="width:100%;height:140px;background:linear-gradient(135deg, #045093 0%, #0369a1 100%);border-radius:12px 12px 0 0;display:flex;align-items:center;justify-content:center;">
                            <svg style="width:48px;height:48px;color:rgba(255,255,255,0.5);" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"/>
                            </svg>
                        </div>
                    `}
                    
                    <div class="map-popup-content" style="padding: 12px; padding-bottom: 50px; position: relative;">
                        ${logoImage ? `
                            <div style="width:48px;height:48px;background:white;border-radius:8px;padding:4px;display:flex;align-items:center;justify-content:center;position:absolute;top:-24px;right:12px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.15);">
                                <img src="${logoImage}" alt="${listing.business_name} logo" style="width:100%;height:100%;object-fit:contain;border-radius:4px;">
                            </div>
                        ` : ''}
                        
                        <div class="map-popup-info">
                            <div class="map-popup-badges" style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px;">
                                ${badges.join('')}
                            </div>
                            
                            <a href="/listing/${categorySlug}/${listing.slug}" class="map-popup-title" 
                               style="font-size:16px;font-weight:700;color:#1f2937;text-decoration:none;display:inline-flex;align-items:center;gap:4px;margin-bottom:6px;line-height:1.3;flex-wrap:wrap;word-wrap:break-word;hyphens:auto;">
                                ${listing.business_name}${checkmarkHtml}
                            </a>
                            
                            ${listing.tagline ? `
                                <div class="map-popup-tagline" style="font-size:13px;color:#6b7280;margin-bottom:8px;line-height:1.4;word-wrap:break-word;hyphens:auto;">
                                    ${listing.tagline}
                                </div>
                            ` : ''}
                            
                            <div class="map-popup-details" style="font-size:12px;color:#6b7280;margin-bottom:4px;">
                                <div style="display:flex;align-items:start;gap:6px;margin-bottom:4px;">
                                    <svg style="width:14px;height:14px;margin-top:2px;flex-shrink:0;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                                    </svg>
                                    <span style="line-height:1.4;word-wrap:break-word;hyphens:auto;">${fullAddr}</span>
                                </div>
                                ${listing.phone ? `
                                    <div style="display:flex;align-items:center;gap:6px;">
                                        <svg style="width:14px;height:14px;flex-shrink:0;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                                        </svg>
                                        <span>${formatPhoneDisplay(listing.phone)}</span>
                                    </div>
                                ` : ''}
                            </div>
                            
                            ${callButton}
                            
                            <a href="${googleMapsUrl}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation();"
                               style="position:absolute;bottom:8px;right:8px;display:inline-flex;align-items:center;gap:4px;padding:6px 10px;background:#045093;color:white;border-radius:6px;font-size:12px;font-weight:500;text-decoration:none;box-shadow:0 2px 4px rgba(0,0,0,0.1);transition:background 0.2s;touch-action:manipulation;-webkit-tap-highlight-color:transparent;" 
                               onmouseover="this.style.background='#033d7a'" onmouseout="this.style.background='#045093'">
                                <svg style="width:14px;height:14px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
                                </svg>
                                Directions
                            </a>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        const popup = L.popup({
            maxWidth: 320,
            maxHeight: 400,
            className: 'custom-popup'
        })
        .setLatLng(cluster.getLatLng())
        .setContent(`<div style="max-height: 400px; overflow-y: auto;">${clusterPopupContent}</div>`)
        .openOn(map);
    });
    
    map.on('moveend', function() {
        if (mapMoved) {
            locationButtonActive = false;
            const locationBtn = document.getElementById('centerLocationBtn');
            if (locationBtn) {
                locationBtn.classList.remove('active');
            }
        }
        mapMoved = true;
    });
    
    mapReady = true;
    updateMapMarkers();
}

function updateMapMarkers() {
    if (!map || !markerClusterGroup) return;
    
    markerClusterGroup.clearLayers();
    
    filteredListings.forEach(listing => {
        if (!listing.coordinates || !listing.coordinates.lat || !listing.coordinates.lng) return;
        
        const marker = L.marker([listing.coordinates.lat, listing.coordinates.lng], {
            listingId: listing.id
        });
        
        const fullAddr = getFullAddress(listing);
        const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fullAddr)}`;
        const callButton = generateCallButton(listing);
        const badges = buildBadges(listing);
        const firstPhoto = listing.photos && listing.photos.length > 0 ? listing.photos[0] : '';
        const logoImage = listing.logo || '';
        const categorySlug = listing.category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const checkmarkHtml = showsVerifiedCheckmark(listing) ? 
            '<svg style="width:16px;height:16px;margin-left:4px;flex-shrink:0;" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="12" fill="#055193"/><path d="M7 12.5l3.5 3.5L17 9" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>' : '';
        
        const popupContent = `
            <div class="map-popup" style="width: 280px;">
                ${firstPhoto ? `
                    <img src="${firstPhoto}" alt="${listing.business_name}" style="width:100%;height:140px;object-fit:cover;border-radius:12px 12px 0 0;">
                ` : `
                    <div style="width:100%;height:140px;background:linear-gradient(135deg, #045093 0%, #0369a1 100%);border-radius:12px 12px 0 0;display:flex;align-items:center;justify-content:center;">
                        <svg style="width:48px;height:48px;color:rgba(255,255,255,0.5);" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"/>
                        </svg>
                    </div>
                `}
                
                <div class="map-popup-content" style="padding: 12px; padding-bottom: 50px; position: relative;">
                    ${logoImage ? `
                        <div style="width:48px;height:48px;background:white;border-radius:8px;padding:4px;display:flex;align-items:center;justify-content:center;position:absolute;top:-24px;right:12px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.15);">
                            <img src="${logoImage}" alt="${listing.business_name} logo" style="width:100%;height:100%;object-fit:contain;border-radius:4px;">
                        </div>
                    ` : ''}
                    
                    <div class="map-popup-info">
                        <div class="map-popup-badges" style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px;">
                            ${badges.join('')}
                        </div>
                        
                        <a href="/listing/${categorySlug}/${listing.slug}" class="map-popup-title" 
                           style="font-size:16px;font-weight:700;color:#1f2937;text-decoration:none;display:inline-flex;align-items:center;gap:4px;margin-bottom:6px;line-height:1.3;flex-wrap:wrap;word-wrap:break-word;hyphens:auto;">
                            ${listing.business_name}${checkmarkHtml}
                        </a>
                        
                        ${listing.tagline ? `
                            <div class="map-popup-tagline" style="font-size:13px;color:#6b7280;margin-bottom:8px;line-height:1.4;word-wrap:break-word;hyphens:auto;">
                                ${listing.tagline}
                            </div>
                        ` : ''}
                        
                        <div class="map-popup-details" style="font-size:12px;color:#6b7280;margin-bottom:4px;">
                            <div style="display:flex;align-items:start;gap:6px;margin-bottom:4px;">
                                <svg style="width:14px;height:14px;margin-top:2px;flex-shrink:0;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                                </svg>
                                <span style="line-height:1.4;word-wrap:break-word;hyphens:auto;">${fullAddr}</span>
                            </div>
                            ${listing.phone ? `
                                <div style="display:flex;align-items:center;gap:6px;">
                                    <svg style="width:14px;height:14px;flex-shrink:0;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                                    </svg>
                                    <span>${formatPhoneDisplay(listing.phone)}</span>
                                </div>
                            ` : ''}
                        </div>
                        
                        ${callButton}
                        
                        <a href="${googleMapsUrl}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation();"
                           style="position:absolute;bottom:8px;right:8px;display:inline-flex;align-items:center;gap:4px;padding:6px 10px;background:#045093;color:white;border-radius:6px;font-size:12px;font-weight:500;text-decoration:none;box-shadow:0 2px 4px rgba(0,0,0,0.1);transition:background 0.2s;touch-action:manipulation;-webkit-tap-highlight-color:transparent;" 
                           onmouseover="this.style.background='#033d7a'" onmouseout="this.style.background='#045093'">
                            <svg style="width:14px;height:14px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
                            </svg>
                            Directions
                        </a>
                    </div>
                </div>
            </div>
        `;
        
        marker.bindPopup(popupContent, { maxWidth: 320, className: 'custom-popup' });
        markerClusterGroup.addLayer(marker);
    });
}
// ============================================
// LISTINGS.JS - PART 9: SPLIT VIEW & SELECTION SYSTEM
// ============================================

// FIXED: Global function for split view selection
window.selectSplitListing = function(listingId, lat, lng) {
    selectedSplitListingId = String(listingId);
    
    if (splitMap) {
        splitMap.setView([lat, lng], 15);
        
        splitMarkerClusterGroup.eachLayer(marker => {
            if (String(marker.options.listingId) === String(listingId)) {
                marker.openPopup();
            }
        });
    }
    
    renderSplitViewListings();
};

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
        const isStarred = starredListings.includes(String(l.id));
        const logoImage = l.logo || '';
        const checkmarkHtml = showsVerifiedCheckmark(l) ? 
            '<svg style="width:16px;height:16px;flex-shrink:0;" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="12" fill="#055193"/><path d="M7 12.5l3.5 3.5L17 9" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>' : '';
        const isSelected = selectedSplitListingId === String(l.id);
        
        // FIXED: Visit button only appears for selected listing
        const visitButton = isSelected && l.coordinates ? `
            <a href="${listingUrl}" class="px-4 py-2 rounded-lg text-sm font-medium text-white"
               style="background:#045093;flex-shrink:0;touch-action:manipulation;-webkit-tap-highlight-color:transparent;">
                Visit
            </a>
        ` : '';
        
        const clickHandler = l.coordinates ? 
            `onclick="selectSplitListing('${l.id}', ${l.coordinates.lat}, ${l.coordinates.lng})" style="cursor:pointer;"` : 
            '';
        
        return `
            <div class="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-3 flex gap-3 relative split-listing-item ${isSelected ? 'selected-listing' : ''}" style="margin-right: 8px;" data-listing-id="${l.id}">
                <button class="star-button ${isStarred ? 'starred' : ''}" 
                        data-listing-id="${l.id}" 
                        onclick="toggleStar('${l.id}', event)"
                        style="top: 8px; right: 8px; width: 32px; height: 32px; position: absolute; background: rgba(255, 255, 255, 0.95); border: 1px solid rgba(0, 0, 0, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; box-shadow: 0 2px 8px rgba(0,0,0,0.15); z-index: 10;">
                    <svg class="star-icon" style="width: 16px; height: 16px;" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                </button>
                
                <div class="flex gap-3 flex-1 min-w-0" ${clickHandler}>
                    ${logoImage ? 
                        `<img src="${logoImage}" alt="${l.business_name}" class="w-16 h-16 rounded-lg object-cover flex-shrink-0">` : 
                        '<div class="w-16 h-16 rounded-lg bg-gray-200 flex-shrink-0 flex items-center justify-center text-gray-400 text-xs">No logo</div>'
                    }
                    
                    <div class="flex-1 min-w-0 overflow-hidden pr-8">
                        <div class="flex gap-1 mb-1 flex-wrap">
                            ${badges.join('')}
                        </div>
                        <h3 class="text-base font-bold text-gray-900 mb-1 flex items-center gap-1.5" style="word-wrap:break-word;hyphens:auto;">
                            ${l.business_name} ${checkmarkHtml}
                        </h3>
                        <p class="text-xs text-gray-600 mb-1 truncate">${l.tagline || l.description || ''}</p>
                        <div class="text-xs text-gray-600">
                            <div class="flex items-center gap-1 truncate">
                                <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                                </svg>
                                <span class="truncate">${fullAddress}</span>
                            </div>
                        </div>
                    </div>
                </div>
                ${visitButton}
            </div>
        `;
    }).join('');
}

function initSplitMap() {
    if (!document.getElementById('splitMap')) return;
    
    splitMap = L.map('splitMap', {
        center: defaultMapCenter,
        zoom: defaultMapZoom,
        zoomControl: false
    });
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(splitMap);
    
    L.control.zoom({ position: 'bottomright' }).addTo(splitMap);
    
    splitMarkerClusterGroup = L.markerClusterGroup({
        maxClusterRadius: 50,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true
    });
    
    splitMap.addLayer(splitMarkerClusterGroup);
    updateSplitMapMarkers();
}

function updateSplitMapMarkers() {
    if (!splitMap || !splitMarkerClusterGroup) return;
    
    splitMarkerClusterGroup.clearLayers();
    
    filteredListings.forEach(listing => {
        if (!listing.coordinates || !listing.coordinates.lat || !listing.coordinates.lng) return;
        
        const marker = L.marker([listing.coordinates.lat, listing.coordinates.lng], {
            listingId: listing.id
        });
        
        const fullAddr = getFullAddress(listing);
        const popupContent = `
            <div style="text-align: center;">
                <strong>${listing.business_name}</strong><br>
                <span style="font-size: 12px; color: #666;">${fullAddr}</span>
            </div>
        `;
        
        marker.bindPopup(popupContent);
        
        marker.on('click', function() {
            selectSplitListing(listing.id, listing.coordinates.lat, listing.coordinates.lng);
        });
        
        splitMarkerClusterGroup.addLayer(marker);
    });
}
// ============================================
// LISTINGS.JS - PART 10: UI CONTROL FUNCTIONS
// ============================================

function createCategoryButtons() {
    const container = document.getElementById('categoriesContainer');
    const container2 = document.getElementById('categoriesContainer2');
    
    if (!container && !container2) return;
    
    const allButton = `
        <button onclick="selectCategory('All')" 
                class="category-btn ${selectedCategory === 'All' ? 'active' : ''}" 
                data-category="All">
            All Categories
        </button>
    `;
    
    const categoryButtons = CATEGORIES.map(cat => `
        <button onclick="selectCategory('${cat}')" 
                class="category-btn ${selectedCategory === cat ? 'active' : ''}" 
                data-category="${cat}">
            ${cat}
        </button>
    `).join('');
    
    const html = allButton + categoryButtons;
    if (container) container.innerHTML = html;
    if (container2) container2.innerHTML = html;
}

window.selectCategory = function(category) {
    selectedCategory = category;
    selectedSubcategories = [];
    createCategoryButtons();
    updateSubcategoryDisplay();
    updateURL();
    if (!viewingStarredOnly) applyFilters();
};

function updateSubcategoryDisplay() {
    const container = document.getElementById('subcategoryContainer');
    const container2 = document.getElementById('subcategoryContainer2');
    
    if (!container && !container2) return;
    
    const categorySubcats = SUBCATEGORIES[selectedCategory] || [];
    
    if (categorySubcats.length === 0 || selectedCategory === 'All') {
        if (container) container.classList.add('hidden');
        if (container2) container2.classList.add('hidden');
        return;
    }
    
    if (container) container.classList.remove('hidden');
    if (container2) container2.classList.remove('hidden');
    
    const subcatButtons = categorySubcats.map(sub => {
        const isSelected = selectedSubcategories.includes(sub);
        return `
            <button onclick="toggleSubcategory('${sub.replace(/'/g, "\\'")}
')" 
                    class="subcategory-tag ${isSelected ? 'selected' : ''}" 
                    data-subcategory="${sub}">
                ${sub}
            </button>
        `;
    }).join('');
    
    if (container) {
        const tagsContainer = container.querySelector('.subcategory-tags');
        if (tagsContainer) tagsContainer.innerHTML = subcatButtons;
    }
    if (container2) {
        const tagsContainer = container2.querySelector('.subcategory-tags');
        if (tagsContainer) tagsContainer.innerHTML = subcatButtons;
    }
}

window.toggleSubcategory = function(subcategory) {
    const index = selectedSubcategories.indexOf(subcategory);
    if (index > -1) {
        selectedSubcategories.splice(index, 1);
    } else {
        selectedSubcategories.push(subcategory);
    }
    updateSubcategoryDisplay();
    updateURL();
    if (!viewingStarredOnly) applyFilters();
};

function populateCountryFilter() {
    const countries = [...new Set(allListings.map(l => l.country || 'USA'))].sort();
    
    const countryFilter = document.getElementById('countryFilter');
    const countryFilter2 = document.getElementById('countryFilter2');
    
    const optionsHtml = '<option value="">All Countries</option>' + 
        countries.map(c => `<option value="${c}">${c}</option>`).join('');
    
    if (countryFilter) countryFilter.innerHTML = optionsHtml;
    if (countryFilter2) countryFilter2.innerHTML = optionsHtml;
}

function populateStateFilter(country) {
    const stateFilter = document.getElementById('stateFilter');
    const stateFilter2 = document.getElementById('stateFilter2');
    
    if (country === 'USA') {
        const statesInData = [...new Set(allListings.filter(l => (l.country || 'USA') === 'USA' && l.state).map(l => l.state))];
        const optionsHtml = '<option value="">All States</option>' + 
            Object.keys(US_STATES)
                .filter(code => statesInData.includes(code))
                .sort((a, b) => US_STATES[a].localeCompare(US_STATES[b]))
                .map(code => `<option value="${code}">${US_STATES[code]}</option>`)
                .join('');
        
        if (stateFilter) stateFilter.innerHTML = optionsHtml;
        if (stateFilter2) stateFilter2.innerHTML = optionsHtml;
    }
}

function updateRadiusValue() {
    const radiusFilter = document.getElementById('radiusFilter');
    const radiusFilter2 = document.getElementById('radiusFilter2');
    const radiusValue = document.getElementById('radiusValue');
    const radiusValue2 = document.getElementById('radiusValue2');
    
    const value = radiusFilter ? radiusFilter.value : (radiusFilter2 ? radiusFilter2.value : 0);
    const displayValue = value == 0 ? 'Any' : value >= 999 ? 'Any' : `${value} mi`;
    
    if (radiusValue) radiusValue.textContent = displayValue;
    if (radiusValue2) radiusValue2.textContent = displayValue;
}

function syncFilters() {
    const searchInput = document.getElementById('searchInput');
    const searchInput2 = document.getElementById('searchInput2');
    
    if (searchInput && searchInput2) {
        searchInput.addEventListener('input', () => searchInput2.value = searchInput.value);
        searchInput2.addEventListener('input', () => searchInput.value = searchInput2.value);
    }
    
    const sortSelect = document.getElementById('sortSelect');
    const sortSelect2 = document.getElementById('sortSelect2');
    
    if (sortSelect && sortSelect2) {
        sortSelect.addEventListener('change', () => {
            sortSelect2.value = sortSelect.value;
            if (!viewingStarredOnly) applyFilters();
        });
        sortSelect2.addEventListener('change', () => {
            sortSelect.value = sortSelect2.value;
            if (!viewingStarredOnly) applyFilters();
        });
    }
}

function toggleFilterPosition() {
    filterPosition = filterPosition === 'top' ? 'left' : 'top';
    checkFilterPosition();
}

function toggleDesktopFilters() {
    const desktopFilters = document.getElementById('desktopFiltersContainer');
    if (!desktopFilters) return;
    
    desktopFiltersOverlay = !desktopFiltersOverlay;
    
    if (desktopFiltersOverlay) {
        desktopFilters.classList.remove('hidden');
        desktopFilters.classList.add('desktop-filters-overlay');
    } else {
        desktopFilters.classList.add('hidden');
        desktopFilters.classList.remove('desktop-filters-overlay');
    }
}
// ============================================
// LISTINGS.JS - PART 11: EVENT LISTENERS & HANDLERS
// ============================================

function setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('searchInput');
    const searchInput2 = document.getElementById('searchInput2');
    
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            clearTimeout(searchDebounceTimer);
            searchDebounceTimer = setTimeout(() => {
                updateURL();
                if (!viewingStarredOnly) applyFilters();
            }, 300);
        });
    }
    
    if (searchInput2) {
        searchInput2.addEventListener('input', () => {
            clearTimeout(searchDebounceTimer);
            searchDebounceTimer = setTimeout(() => {
                updateURL();
                if (!viewingStarredOnly) applyFilters();
            }, 300);
        });
    }
    
    // Sort select
    const sortSelect = document.getElementById('sortSelect');
    const sortSelect2 = document.getElementById('sortSelect2');
    
    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            if (!viewingStarredOnly) applyFilters();
        });
    }
    
    if (sortSelect2) {
        sortSelect2.addEventListener('change', () => {
            if (!viewingStarredOnly) applyFilters();
        });
    }
    
    // View toggle buttons
    const gridViewBtn = document.getElementById('gridViewBtn');
    const listViewBtn = document.getElementById('listViewBtn');
    const gridViewBtn2 = document.getElementById('gridViewBtn2');
    const listViewBtn2 = document.getElementById('listViewBtn2');
    
    if (gridViewBtn) {
        gridViewBtn.addEventListener('click', () => {
            currentView = 'grid';
            if (gridViewBtn) gridViewBtn.classList.add('active');
            if (listViewBtn) listViewBtn.classList.remove('active');
            if (gridViewBtn2) gridViewBtn2.classList.add('active');
            if (listViewBtn2) listViewBtn2.classList.remove('active');
            renderListings();
        });
    }
    
    if (listViewBtn) {
        listViewBtn.addEventListener('click', () => {
            currentView = 'list';
            if (listViewBtn) listViewBtn.classList.add('active');
            if (gridViewBtn) gridViewBtn.classList.remove('active');
            if (listViewBtn2) listViewBtn2.classList.add('active');
            if (gridViewBtn2) gridViewBtn2.classList.remove('active');
            renderListings();
        });
    }
    
    if (gridViewBtn2) {
        gridViewBtn2.addEventListener('click', () => {
            currentView = 'grid';
            if (gridViewBtn) gridViewBtn.classList.add('active');
            if (listViewBtn) listViewBtn.classList.remove('active');
            if (gridViewBtn2) gridViewBtn2.classList.add('active');
            if (listViewBtn2) listViewBtn2.classList.remove('active');
            renderListings();
        });
    }
    
    if (listViewBtn2) {
        listViewBtn2.addEventListener('click', () => {
            currentView = 'list';
            if (listViewBtn) listViewBtn.classList.add('active');
            if (gridViewBtn) gridViewBtn.classList.remove('active');
            if (listViewBtn2) listViewBtn2.classList.add('active');
            if (gridViewBtn2) gridViewBtn2.classList.remove('active');
            renderListings();
        });
    }
    
    // Map button
    const mapBtn = document.getElementById('mapBtn');
    const mapBtnDesktop = document.getElementById('mapBtnDesktop');
    
    if (mapBtn) {
        mapBtn.addEventListener('click', () => {
            mapOpen = !mapOpen;
            const mapContainer = document.getElementById('mapContainer');
            const listingsSection = document.getElementById('listingsSection');
            
            if (mapOpen) {
                if (mapContainer) mapContainer.classList.remove('hidden');
                if (listingsSection) listingsSection.classList.add('hidden');
                mapBtn.textContent = 'Show Listings';
                if (!mapReady) initMap();
                else if (map) map.invalidateSize();
                if (userLocation) addUserLocationMarker();
            } else {
                if (mapContainer) mapContainer.classList.add('hidden');
                if (listingsSection) listingsSection.classList.remove('hidden');
                mapBtn.textContent = 'Show Map';
            }
            checkFilterPosition();
        });
    }
    
    if (mapBtnDesktop) {
        mapBtnDesktop.addEventListener('click', () => {
            mapOpen = !mapOpen;
            const mapContainer = document.getElementById('mapContainer');
            
            if (mapOpen) {
                if (mapContainer) mapContainer.classList.remove('hidden');
                mapBtnDesktop.textContent = 'Hide Map';
                if (!mapReady) initMap();
                else if (map) map.invalidateSize();
                if (userLocation) addUserLocationMarker();
            } else {
                if (mapContainer) mapContainer.classList.add('hidden');
                mapBtnDesktop.textContent = 'Show Map';
            }
            checkFilterPosition();
        });
    }
    
    // Split view button
    const splitViewBtn = document.getElementById('splitViewBtn');
    
    if (splitViewBtn) {
        splitViewBtn.addEventListener('click', () => {
            splitViewActive = !splitViewActive;
            const splitViewContainer = document.getElementById('splitViewContainer');
            const listingsContainer = document.getElementById('listingsContainer');
            const mapContainer = document.getElementById('mapContainer');
            
            if (splitViewActive) {
                if (splitViewContainer) splitViewContainer.classList.remove('hidden');
                if (listingsContainer) listingsContainer.classList.add('hidden');
                if (mapContainer) mapContainer.classList.add('hidden');
                splitViewBtn.textContent = 'Exit Split View';
                
                setTimeout(() => {
                    initSplitMap();
                    renderSplitViewListings();
                }, 100);
            } else {
                if (splitViewContainer) splitViewContainer.classList.add('hidden');
                if (listingsContainer) listingsContainer.classList.remove('hidden');
                splitViewBtn.textContent = 'Split View';
                selectedSplitListingId = null;
            }
            checkFilterPosition();
        });
    }
    
    // Filter button
    const filterBtn = document.getElementById('filterBtn');
    
    if (filterBtn) {
        filterBtn.addEventListener('click', () => {
            filtersOpen = !filtersOpen;
            const filtersPanel = document.getElementById('filtersPanel');
            if (filtersPanel) {
                if (filtersOpen) {
                    filtersPanel.classList.remove('hidden');
                } else {
                    filtersPanel.classList.add('hidden');
                }
            }
        });
    }
    
    // Country filter
    const countryFilter = document.getElementById('countryFilter');
    const countryFilter2 = document.getElementById('countryFilter2');
    
    if (countryFilter) {
        countryFilter.addEventListener('change', (e) => {
            selectedCountry = e.target.value;
            const stateContainer = document.getElementById('stateFilterContainer');
            
            if (e.target.value === 'USA') {
                if (stateContainer) stateContainer.classList.remove('hidden');
                populateStateFilter('USA');
            } else {
                if (stateContainer) stateContainer.classList.add('hidden');
                selectedState = '';
            }
            
            if (countryFilter2) countryFilter2.value = e.target.value;
            updateURL();
            if (!viewingStarredOnly) applyFilters();
        });
    }
    
    if (countryFilter2) {
        countryFilter2.addEventListener('change', (e) => {
            selectedCountry = e.target.value;
            const stateContainer2 = document.getElementById('stateFilterContainer2');
            
            if (e.target.value === 'USA') {
                if (stateContainer2) stateContainer2.classList.remove('hidden');
                populateStateFilter('USA');
            } else {
                if (stateContainer2) stateContainer2.classList.add('hidden');
                selectedState = '';
            }
            
            if (countryFilter) countryFilter.value = e.target.value;
            updateURL();
            if (!viewingStarredOnly) applyFilters();
        });
    }
    
    // State filter
    const stateFilter = document.getElementById('stateFilter');
    const stateFilter2 = document.getElementById('stateFilter2');
    
    if (stateFilter) {
        stateFilter.addEventListener('change', (e) => {
            selectedState = e.target.value;
            if (stateFilter2) stateFilter2.value = e.target.value;
            updateURL();
            if (!viewingStarredOnly) applyFilters();
        });
    }
    
    if (stateFilter2) {
        stateFilter2.addEventListener('change', (e) => {
            selectedState = e.target.value;
            if (stateFilter) stateFilter.value = e.target.value;
            updateURL();
            if (!viewingStarredOnly) applyFilters();
        });
    }
    
    // Radius filter
    const radiusFilter = document.getElementById('radiusFilter');
    const radiusFilter2 = document.getElementById('radiusFilter2');
    
    if (radiusFilter) {
        radiusFilter.addEventListener('input', (e) => {
            selectedRadius = parseInt(e.target.value);
            if (radiusFilter2) radiusFilter2.value = e.target.value;
            updateRadiusValue();
            updateURL();
            if (!viewingStarredOnly) applyFilters();
        });
    }
    
    if (radiusFilter2) {
        radiusFilter2.addEventListener('input', (e) => {
            selectedRadius = parseInt(e.target.value);
            if (radiusFilter) radiusFilter.value = e.target.value;
            updateRadiusValue();
            updateURL();
            if (!viewingStarredOnly) applyFilters();
        });
    }
    
    // Status filters
    const statusFilters = [
        'openNowFilter', 'closedNowFilter', 'openingSoonFilter', 
        'closingSoonFilter', 'hoursUnknownFilter', 'onlineOnlyFilter'
    ];
    
    statusFilters.forEach(filterId => {
        const filter1 = document.getElementById(filterId);
        const filter2 = document.getElementById(filterId + '2');
        
        if (filter1) {
            filter1.addEventListener('change', (e) => {
                const varName = filterId.replace('Filter', 'Only').replace('Only', 'Only');
                
                if (filterId === 'openNowFilter') openNowOnly = e.target.checked;
                else if (filterId === 'closedNowFilter') closedNowOnly = e.target.checked;
                else if (filterId === 'openingSoonFilter') openingSoonOnly = e.target.checked;
                else if (filterId === 'closingSoonFilter') closingSoonOnly = e.target.checked;
                else if (filterId === 'hoursUnknownFilter') hoursUnknownOnly = e.target.checked;
                else if (filterId === 'onlineOnlyFilter') onlineOnly = e.target.checked;
                
                if (filter2) filter2.checked = e.target.checked;
                updateURL();
                if (!viewingStarredOnly) applyFilters();
            });
        }
        
        if (filter2) {
            filter2.addEventListener('change', (e) => {
                if (filterId === 'openNowFilter') openNowOnly = e.target.checked;
                else if (filterId === 'closedNowFilter') closedNowOnly = e.target.checked;
                else if (filterId === 'openingSoonFilter') openingSoonOnly = e.target.checked;
                else if (filterId === 'closingSoonFilter') closingSoonOnly = e.target.checked;
                else if (filterId === 'hoursUnknownFilter') hoursUnknownOnly = e.target.checked;
                else if (filterId === 'onlineOnlyFilter') onlineOnly = e.target.checked;
                
                if (filter1) filter1.checked = e.target.checked;
                updateURL();
                if (!viewingStarredOnly) applyFilters();
            });
        }
    });
    
    // Load more button
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', loadMoreListings);
    }
    
    // Toggle filter position button
    const toggleFilterPositionBtn = document.getElementById('toggleFilterPosition');
    if (toggleFilterPositionBtn) {
        toggleFilterPositionBtn.addEventListener('click', toggleFilterPosition);
    }
    
    // Desktop filter toggle button
    const desktopFilterToggleBtn = document.getElementById('desktopFilterToggleBtn');
    if (desktopFilterToggleBtn) {
        desktopFilterToggleBtn.addEventListener('click', toggleDesktopFilters);
    }
    
    // Window resize
    window.addEventListener('resize', () => {
        checkFilterPosition();
        if (map && mapOpen) {
            map.invalidateSize();
        }
        if (splitMap && splitViewActive) {
            splitMap.invalidateSize();
        }
    });
}
// ============================================
// LISTINGS.JS - PART 12: INITIALIZATION & GLOBAL SETUP
// ============================================

// Set global functions
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
window.toggleStarredView = toggleStarredView;
window.selectCategory = window.selectCategory || function() {};
window.toggleSubcategory = window.toggleSubcategory || function() {};
window.selectSplitListing = window.selectSplitListing || function() {};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('Listings page initializing...');
    
    // Check if iOS web app
    if (isIOSWebApp()) {
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) refreshBtn.style.display = 'flex';
    }
    
    // Load starred listings from cookie
    loadStarredListings();
    
    // Load all listings from Supabase
    loadListings();
    
    // Setup event listeners
    setupEventListeners();
    
    // Create category buttons
    createCategoryButtons();
    
    // Request user location
    requestLocationOnLoad();
    
    // Estimate location by IP as fallback
    estimateLocationByIP();
    
    // Load filters from URL
    loadFiltersFromURL();
    
    // Initialize map (but keep it hidden initially)
    initMap();
    
    // Sync filter inputs
    syncFilters();
    
    // Check filter position
    checkFilterPosition();
    
    console.log('Listings page initialization complete');
});

// Export for debugging
if (typeof window !== 'undefined') {
    window.listingsDebug = {
        allListings: () => allListings,
        filteredListings: () => filteredListings,
        starredListings: () => starredListings,
        selectedCategory: () => selectedCategory,
        selectedSubcategories: () => selectedSubcategories,
        userLocation: () => userLocation,
        estimatedUserLocation: () => estimatedUserLocation,
        reloadListings: loadListings,
        reapplyFilters: applyFilters,
        forceRender: renderListings
    };
}

console.log('Listings.js loaded successfully - All 12 parts integrated');
// ============================================
// LISTINGS.JS - PART 13: CATEGORY & SUBCATEGORY MANAGEMENT
// ============================================

function handleCategoryClick(category) {
    selectedCategory = category;
    selectedSubcategories = [];
    createCategoryButtons();
    updateSubcategoryDisplay();
    updateURL();
    if (!viewingStarredOnly) applyFilters();
}

function handleSubcategoryToggle(subcategory) {
    const index = selectedSubcategories.indexOf(subcategory);
    if (index > -1) {
        selectedSubcategories.splice(index, 1);
    } else {
        selectedSubcategories.push(subcategory);
    }
    updateSubcategoryDisplay();
    updateURL();
    if (!viewingStarredOnly) applyFilters();
}

function clearAllFilters() {
    selectedCategory = 'All';
    selectedSubcategories = [];
    selectedCountry = '';
    selectedState = '';
    selectedCity = '';
    selectedZip = '';
    selectedRadius = 0;
    openNowOnly = false;
    closedNowOnly = false;
    openingSoonOnly = false;
    closingSoonOnly = false;
    hoursUnknownOnly = false;
    onlineOnly = false;
    
    const searchInput = document.getElementById('searchInput');
    const searchInput2 = document.getElementById('searchInput2');
    if (searchInput) searchInput.value = '';
    if (searchInput2) searchInput2.value = '';
    
    const countryFilter = document.getElementById('countryFilter');
    const countryFilter2 = document.getElementById('countryFilter2');
    if (countryFilter) countryFilter.value = '';
    if (countryFilter2) countryFilter2.value = '';
    
    const stateFilter = document.getElementById('stateFilter');
    const stateFilter2 = document.getElementById('stateFilter2');
    if (stateFilter) stateFilter.value = '';
    if (stateFilter2) stateFilter2.value = '';
    
    const stateContainer = document.getElementById('stateFilterContainer');
    const stateContainer2 = document.getElementById('stateFilterContainer2');
    if (stateContainer) stateContainer.classList.add('hidden');
    if (stateContainer2) stateContainer2.classList.add('hidden');
    
    const radiusFilter = document.getElementById('radiusFilter');
    const radiusFilter2 = document.getElementById('radiusFilter2');
    if (radiusFilter) radiusFilter.value = 0;
    if (radiusFilter2) radiusFilter2.value = 0;
    updateRadiusValue();
    
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
    });
    
    createCategoryButtons();
    updateSubcategoryDisplay();
    updateURL();
    if (!viewingStarredOnly) applyFilters();
}

function getCategoryIcon(category) {
    const icons = {
        'Automotive & Transportation': '🚗',
        'Beauty & Health': '💆',
        'Church & Religious Organization': '⛪',
        'Cultural/Fraternal Organization': '🤝',
        'Education & Community': '📚',
        'Entertainment, Arts & Recreation': '🎭',
        'Food & Hospitality': '🍽️',
        'Grocery & Imports': '🛒',
        'Home & Construction': '🏠',
        'Industrial & Manufacturing': '🏭',
        'Pets & Veterinary': '🐾',
        'Professional & Business Services': '💼',
        'Real Estate & Development': '🏘️',
        'Retail & Shopping': '🛍️'
    };
    return icons[category] || '📁';
}
// ============================================
// LISTINGS.JS - PART 14: MAP CONTROLS & INTERACTIONS
// ============================================

function centerMapOnUser() {
    if (!map || !userLocation) {
        alert('Location not available. Please enable location services.');
        return;
    }
    
    map.setView([userLocation.lat, userLocation.lng], 12);
    mapMoved = false;
    locationButtonActive = true;
    
    const locationBtn = document.getElementById('centerLocationBtn');
    if (locationBtn) {
        locationBtn.classList.add('active');
    }
    
    addUserLocationMarker();
}

function fitMapToBounds() {
    if (!map || !markerClusterGroup) return;
    
    const markers = [];
    markerClusterGroup.eachLayer(layer => {
        markers.push(layer.getLatLng());
    });
    
    if (markers.length === 0) return;
    
    if (markers.length === 1) {
        map.setView(markers[0], 12);
    } else {
        const bounds = L.latLngBounds(markers);
        map.fitBounds(bounds, { padding: [50, 50] });
    }
    
    mapMoved = false;
}

function toggleMapFullscreen() {
    const mapContainer = document.getElementById('mapContainer');
    if (!mapContainer) return;
    
    if (!document.fullscreenElement) {
        mapContainer.requestFullscreen().then(() => {
            if (map) {
                setTimeout(() => {
                    map.invalidateSize();
                }, 200);
            }
        }).catch(err => {
            console.error('Fullscreen error:', err);
        });
    } else {
        document.exitFullscreen();
    }
}

function createCustomMapIcon(listing) {
    const isFeatured = listing.tier === 'FEATURED' || listing.tier === 'PREMIUM';
    const isVerified = listing.verified || listing.tier === 'VERIFIED';
    
    let color = '#3b82f6'; // Default blue
    if (isFeatured) color = '#f59e0b'; // Amber for featured
    else if (isVerified) color = '#10b981'; // Green for verified
    
    const iconHtml = `
        <div style="
            width: 32px;
            height: 32px;
            background: ${color};
            border: 3px solid white;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
        ">
            <div style="transform: rotate(45deg); color: white; font-size: 16px; font-weight: bold;">
                ${getCategoryIcon(listing.category)}
            </div>
        </div>
    `;
    
    return L.divIcon({
        html: iconHtml,
        className: 'custom-marker-icon',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    });
}

function handleMapClick(e) {
    console.log('Map clicked at:', e.latlng);
}

function handleMarkerClick(listing) {
    console.log('Marker clicked:', listing.business_name);
}

function updateMapView() {
    if (!map) return;
    
    const mapContainer = document.getElementById('mapContainer');
    if (mapContainer && !mapContainer.classList.contains('hidden')) {
        setTimeout(() => {
            map.invalidateSize();
        }, 100);
    }
}

function closeAllPopups() {
    if (map) {
        map.closePopup();
    }
    if (splitMap) {
        splitMap.closePopup();
    }
}

function refreshMapMarkers() {
    if (map) {
        updateMapMarkers();
    }
    if (splitMap && splitViewActive) {
        updateSplitMapMarkers();
    }
}
// ============================================
// LISTINGS.JS - PART 15: SEARCH & AUTOCOMPLETE
// ============================================

let searchSuggestions = [];
let currentSearchIndex = -1;

function initSearchAutocomplete() {
    const searchInput = document.getElementById('searchInput');
    const searchInput2 = document.getElementById('searchInput2');
    
    if (searchInput) {
        searchInput.addEventListener('input', handleSearchInput);
        searchInput.addEventListener('keydown', handleSearchKeydown);
        searchInput.addEventListener('focus', showSearchSuggestions);
        searchInput.addEventListener('blur', hideSearchSuggestions);
    }
    
    if (searchInput2) {
        searchInput2.addEventListener('input', handleSearchInput);
        searchInput2.addEventListener('keydown', handleSearchKeydown);
        searchInput2.addEventListener('focus', showSearchSuggestions);
        searchInput2.addEventListener('blur', hideSearchSuggestions);
    }
}

function handleSearchInput(e) {
    const query = e.target.value.toLowerCase().trim();
    
    if (query.length < 2) {
        hideSearchSuggestions();
        return;
    }
    
    searchSuggestions = [];
    
    // Search in business names
    const nameMatches = allListings
        .filter(l => l.business_name.toLowerCase().includes(query))
        .slice(0, 5)
        .map(l => ({
            type: 'business',
            text: l.business_name,
            listing: l
        }));
    searchSuggestions.push(...nameMatches);
    
    // Search in categories
    const categoryMatches = CATEGORIES
        .filter(c => c.toLowerCase().includes(query))
        .slice(0, 3)
        .map(c => ({
            type: 'category',
            text: c
        }));
    searchSuggestions.push(...categoryMatches);
    
    // Search in cities
    const cities = [...new Set(allListings.map(l => l.city).filter(Boolean))];
    const cityMatches = cities
        .filter(c => c.toLowerCase().includes(query))
        .slice(0, 3)
        .map(c => ({
            type: 'city',
            text: c
        }));
    searchSuggestions.push(...cityMatches);
    
    showSearchSuggestions();
}

function handleSearchKeydown(e) {
    const suggestionsContainer = document.getElementById('searchSuggestions');
    if (!suggestionsContainer || searchSuggestions.length === 0) return;
    
    if (e.key === 'ArrowDown') {
        e.preventDefault();
        currentSearchIndex = Math.min(currentSearchIndex + 1, searchSuggestions.length - 1);
        highlightSuggestion(currentSearchIndex);
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        currentSearchIndex = Math.max(currentSearchIndex - 1, -1);
        highlightSuggestion(currentSearchIndex);
    } else if (e.key === 'Enter') {
        e.preventDefault();
        if (currentSearchIndex >= 0) {
            selectSuggestion(searchSuggestions[currentSearchIndex]);
        }
    } else if (e.key === 'Escape') {
        hideSearchSuggestions();
    }
}

function showSearchSuggestions() {
    if (searchSuggestions.length === 0) return;
    
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    
    let suggestionsContainer = document.getElementById('searchSuggestions');
    if (!suggestionsContainer) {
        suggestionsContainer = document.createElement('div');
        suggestionsContainer.id = 'searchSuggestions';
        suggestionsContainer.className = 'search-suggestions';
        searchInput.parentElement.appendChild(suggestionsContainer);
    }
    
    suggestionsContainer.innerHTML = searchSuggestions.map((suggestion, index) => {
        const iconMap = {
            'business': '🏢',
            'category': '📁',
            'city': '📍'
        };
        
        return `
            <div class="search-suggestion-item ${index === currentSearchIndex ? 'highlighted' : ''}" 
                 data-index="${index}"
                 onmousedown="selectSuggestionByIndex(${index})">
                <span class="suggestion-icon">${iconMap[suggestion.type]}</span>
                <span class="suggestion-text">${suggestion.text}</span>
                <span class="suggestion-type">${suggestion.type}</span>
            </div>
        `;
    }).join('');
    
    suggestionsContainer.classList.add('visible');
}

function hideSearchSuggestions() {
    setTimeout(() => {
        const suggestionsContainer = document.getElementById('searchSuggestions');
        if (suggestionsContainer) {
            suggestionsContainer.classList.remove('visible');
        }
        currentSearchIndex = -1;
    }, 200);
}

function highlightSuggestion(index) {
    const items = document.querySelectorAll('.search-suggestion-item');
    items.forEach((item, i) => {
        if (i === index) {
            item.classList.add('highlighted');
        } else {
            item.classList.remove('highlighted');
        }
    });
}

window.selectSuggestionByIndex = function(index) {
    selectSuggestion(searchSuggestions[index]);
};

function selectSuggestion(suggestion) {
    const searchInput = document.getElementById('searchInput');
    const searchInput2 = document.getElementById('searchInput2');
    
    if (suggestion.type === 'business') {
        if (searchInput) searchInput.value = suggestion.text;
        if (searchInput2) searchInput2.value = suggestion.text;
    } else if (suggestion.type === 'category') {
        selectedCategory = suggestion.text;
        if (searchInput) searchInput.value = '';
        if (searchInput2) searchInput2.value = '';
        createCategoryButtons();
        updateSubcategoryDisplay();
    } else if (suggestion.type === 'city') {
        selectedCity = suggestion.text;
        if (searchInput) searchInput.value = '';
        if (searchInput2) searchInput2.value = '';
    }
    
    hideSearchSuggestions();
    updateURL();
    if (!viewingStarredOnly) applyFilters();
}

function clearSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchInput2 = document.getElementById('searchInput2');
    
    if (searchInput) searchInput.value = '';
    if (searchInput2) searchInput2.value = '';
    
    hideSearchSuggestions();
    updateURL();
    if (!viewingStarredOnly) applyFilters();
}
// ============================================
// LISTINGS.JS - PART 16: ANALYTICS & TRACKING
// ============================================

function trackListingView(listingId, listingName) {
    console.log('Listing viewed:', listingId, listingName);
    
    // Track in localStorage for basic analytics
    try {
        const views = JSON.parse(localStorage.getItem('listingViews') || '{}');
        views[listingId] = (views[listingId] || 0) + 1;
        localStorage.setItem('listingViews', JSON.stringify(views));
    } catch (e) {
        console.error('Failed to track listing view:', e);
    }
}

function trackSearch(searchTerm) {
    console.log('Search performed:', searchTerm);
    
    try {
        const searches = JSON.parse(localStorage.getItem('searches') || '[]');
        searches.push({
            term: searchTerm,
            timestamp: new Date().toISOString()
        });
        
        // Keep only last 100 searches
        if (searches.length > 100) {
            searches.shift();
        }
        
        localStorage.setItem('searches', JSON.stringify(searches));
    } catch (e) {
        console.error('Failed to track search:', e);
    }
}

function trackCategoryView(category) {
    console.log('Category viewed:', category);
    
    try {
        const views = JSON.parse(localStorage.getItem('categoryViews') || '{}');
        views[category] = (views[category] || 0) + 1;
        localStorage.setItem('categoryViews', JSON.stringify(views));
    } catch (e) {
        console.error('Failed to track category view:', e);
    }
}

function trackFilterUsage(filterType, filterValue) {
    console.log('Filter used:', filterType, filterValue);
    
    try {
        const usage = JSON.parse(localStorage.getItem('filterUsage') || '{}');
        const key = `${filterType}:${filterValue}`;
        usage[key] = (usage[key] || 0) + 1;
        localStorage.setItem('filterUsage', JSON.stringify(usage));
    } catch (e) {
        console.error('Failed to track filter usage:', e);
    }
}

function getPopularListings() {
    try {
        const views = JSON.parse(localStorage.getItem('listingViews') || '{}');
        return Object.entries(views)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([id, count]) => ({ id, count }));
    } catch (e) {
        console.error('Failed to get popular listings:', e);
        return [];
    }
}

function getRecentSearches() {
    try {
        const searches = JSON.parse(localStorage.getItem('searches') || '[]');
        return searches
            .slice(-10)
            .reverse()
            .map(s => s.term);
    } catch (e) {
        console.error('Failed to get recent searches:', e);
        return [];
    }
}

function clearAnalytics() {
    try {
        localStorage.removeItem('listingViews');
        localStorage.removeItem('searches');
        localStorage.removeItem('categoryViews');
        localStorage.removeItem('filterUsage');
        console.log('Analytics data cleared');
    } catch (e) {
        console.error('Failed to clear analytics:', e);
    }
}
// ============================================
// LISTINGS.JS - PART 17: SHARING & EXPORT
// ============================================

function shareListings() {
    const url = window.location.href;
    const text = `Check out these ${filteredListings.length} Greek businesses on The Greek Directory`;
    
    if (navigator.share) {
        navigator.share({
            title: 'The Greek Directory',
            text: text,
            url: url
        }).then(() => {
            console.log('Shared successfully');
        }).catch(err => {
            console.error('Share failed:', err);
            copyShareLink();
        });
    } else {
        copyShareLink();
    }
}

function copyShareLink() {
    const url = window.location.href;
    
    if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(() => {
            showToast('Link copied to clipboard!');
        }).catch(err => {
            console.error('Copy failed:', err);
            fallbackCopyLink(url);
        });
    } else {
        fallbackCopyLink(url);
    }
}

function fallbackCopyLink(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.select();
    
    try {
        document.execCommand('copy');
        showToast('Link copied to clipboard!');
    } catch (err) {
        console.error('Fallback copy failed:', err);
        showToast('Failed to copy link');
    }
    
    document.body.removeChild(textArea);
}

function exportListingsCSV() {
    const headers = ['Business Name', 'Category', 'Address', 'City', 'State', 'Zip', 'Phone', 'Website'];
    const rows = filteredListings.map(l => [
        l.business_name,
        l.category,
        l.address || '',
        l.city || '',
        l.state || '',
        l.zip_code || '',
        l.phone || '',
        l.website || ''
    ]);
    
    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
        csv += row.map(cell => `"${cell}"`).join(',') + '\n';
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `greek-directory-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    showToast('Listings exported successfully!');
}

function exportStarredListingsCSV() {
    const starredData = allListings.filter(l => starredListings.includes(String(l.id)));
    
    if (starredData.length === 0) {
        showToast('No starred listings to export');
        return;
    }
    
    const headers = ['Business Name', 'Category', 'Address', 'City', 'State', 'Zip', 'Phone', 'Website'];
    const rows = starredData.map(l => [
        l.business_name,
        l.category,
        l.address || '',
        l.city || '',
        l.state || '',
        l.zip_code || '',
        l.phone || '',
        l.website || ''
    ]);
    
    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
        csv += row.map(cell => `"${cell}"`).join(',') + '\n';
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `greek-directory-starred-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    showToast(`${starredData.length} starred listings exported!`);
}

function printListings() {
    window.print();
}

function showToast(message, duration = 3000) {
    let toast = document.getElementById('toast');
    
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.style.cssText = `
            position: fixed;
            bottom: 24px;
            left: 50%;
            transform: translateX(-50%);
            background: #1f2937;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            opacity: 0;
            transition: opacity 0.3s;
        `;
        document.body.appendChild(toast);
    }
    
    toast.textContent = message;
    toast.style.opacity = '1';
    
    setTimeout(() => {
        toast.style.opacity = '0';
    }, duration);
}
// ============================================
// LISTINGS.JS - PART 18: HELPER FUNCTIONS & UTILITIES
// ============================================

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

function sanitizeHTML(str) {
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function formatTime(timeString) {
    if (!timeString) return '';
    return timeString.replace(/(\d{1,2}):(\d{2})\s*(AM|PM)/gi, (match, hour, min, period) => {
        return `${hour}:${min} ${period.toUpperCase()}`;
    });
}

function pluralize(count, singular, plural) {
    return count === 1 ? singular : (plural || singular + 's');
}

function truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
}

function generateSlug(text) {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function parseQueryString(queryString) {
    const params = {};
    const searchParams = new URLSearchParams(queryString);
    for (const [key, value] of searchParams) {
        params[key] = value;
    }
    return params;
}

function buildQueryString(params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
            searchParams.set(key, value);
        }
    });
    return searchParams.toString();
}

function getDistanceString(distanceInMiles) {
    if (!distanceInMiles || distanceInMiles === Infinity) return '';
    
    if (distanceInMiles < 0.1) {
        return 'Less than 0.1 mi away';
    } else if (distanceInMiles < 1) {
        return `${distanceInMiles.toFixed(1)} mi away`;
    } else if (distanceInMiles < 10) {
        return `${distanceInMiles.toFixed(1)} mi away`;
    } else {
        return `${Math.round(distanceInMiles)} mi away`;
    }
}

function getDayOfWeek(date) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
}

function getCurrentDayKey() {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const now = new Date();
    const centralTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Chicago' }));
    return days[centralTime.getDay()];
}

function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function isValidPhone(phone) {
    const digits = phone.replace(/\D/g, '');
    return digits.length === 10 || digits.length === 11;
}

function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

function copyToClipboard(text) {
    if (navigator.clipboard) {
        return navigator.clipboard.writeText(text);
    } else {
        return Promise.reject('Clipboard API not available');
    }
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function groupBy(array, key) {
    return array.reduce((result, item) => {
        const group = item[key];
        if (!result[group]) {
            result[group] = [];
        }
        result[group].push(item);
        return result;
    }, {});
}

function unique(array) {
    return [...new Set(array)];
}

function chunk(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function retry(fn, retries = 3, delay = 1000) {
    return fn().catch(err => {
        if (retries === 0) throw err;
        return sleep(delay).then(() => retry(fn, retries - 1, delay));
    });
}

function formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
    }).format(amount);
}

function formatNumber(number) {
    return new Intl.NumberFormat('en-US').format(number);
}

function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    
    let interval = Math.floor(seconds / 31536000);
    if (interval > 1) return interval + ' years ago';
    
    interval = Math.floor(seconds / 2592000);
    if (interval > 1) return interval + ' months ago';
    
    interval = Math.floor(seconds / 86400);
    if (interval > 1) return interval + ' days ago';
    
    interval = Math.floor(seconds / 3600);
    if (interval > 1) return interval + ' hours ago';
    
    interval = Math.floor(seconds / 60);
    if (interval > 1) return interval + ' minutes ago';
    
    return 'just now';
}

function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

function getViewportSize() {
    return {
        width: Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0),
        height: Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)
    };
}

function scrollToTop(smooth = true) {
    window.scrollTo({
        top: 0,
        behavior: smooth ? 'smooth' : 'auto'
    });
}

function scrollToElement(element, offset = 0) {
    if (typeof element === 'string') {
        element = document.querySelector(element);
    }
    if (!element) return;
    
    const top = element.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo({
        top: top,
        behavior: 'smooth'
    });
}
// ============================================
// LISTINGS.JS - PART 19: ERROR HANDLING & LOGGING
// ============================================

const ErrorCodes = {
    L101: 'Failed to load listings from database',
    L102: 'Geocoding service unavailable',
    L103: 'Failed to get user location',
    L201: 'Geolocation permission denied',
    L202: 'Geolocation not supported',
    L203: 'Geolocation timeout',
    L301: 'Failed to save starred listings',
    L302: 'Failed to load starred listings',
    L401: 'Map initialization failed',
    L402: 'Map marker update failed',
    L501: 'Cookie storage unavailable',
    L502: 'Local storage unavailable',
    L601: 'Network request failed',
    L602: 'Invalid API response'
};

function logError(code, message, error) {
    const timestamp = new Date().toISOString();
    const logEntry = {
        code,
        message,
        error: error ? error.toString() : null,
        stack: error ? error.stack : null,
        timestamp,
        url: window.location.href,
        userAgent: navigator.userAgent
    };
    
    console.error(`[${code}] ${message}`, logEntry);
    
    // Store in localStorage for debugging
    try {
        const errors = JSON.parse(localStorage.getItem('errorLog') || '[]');
        errors.push(logEntry);
        
        // Keep only last 50 errors
        if (errors.length > 50) {
            errors.shift();
        }
        
        localStorage.setItem('errorLog', JSON.stringify(errors));
    } catch (e) {
        console.error('Failed to log error:', e);
    }
}

function getErrorLog() {
    try {
        return JSON.parse(localStorage.getItem('errorLog') || '[]');
    } catch (e) {
        console.error('Failed to get error log:', e);
        return [];
    }
}

function clearErrorLog() {
    try {
        localStorage.removeItem('errorLog');
        console.log('Error log cleared');
    } catch (e) {
        console.error('Failed to clear error log:', e);
    }
}

function handleCriticalError(error) {
    console.error('Critical error:', error);
    
    const errorContainer = document.getElementById('errorContainer');
    if (errorContainer) {
        errorContainer.innerHTML = `
            <div class="error-message">
                <h3>Something went wrong</h3>
                <p>${error.message || 'An unexpected error occurred'}</p>
                <button onclick="window.location.reload()">Reload Page</button>
            </div>
        `;
        errorContainer.style.display = 'block';
    }
}

function showErrorToast(message) {
    showToast(message, 5000);
}

function validateListing(listing) {
    const errors = [];
    
    if (!listing.business_name) {
        errors.push('Business name is required');
    }
    
    if (!listing.category) {
        errors.push('Category is required');
    }
    
    if (listing.phone && !isValidPhone(listing.phone)) {
        errors.push('Invalid phone number');
    }
    
    if (listing.website && !isValidUrl(listing.website)) {
        errors.push('Invalid website URL');
    }
    
    if (listing.coordinates) {
        if (typeof listing.coordinates.lat !== 'number' || 
            typeof listing.coordinates.lng !== 'number') {
            errors.push('Invalid coordinates');
        }
    }
    
    return {
        valid: errors.length === 0,
        errors
    };
}

function handleNetworkError(error) {
    console.error('Network error:', error);
    
    if (!navigator.onLine) {
        showErrorToast('No internet connection. Please check your network.');
        return;
    }
    
    if (error.status === 429) {
        showErrorToast('Too many requests. Please wait a moment and try again.');
        return;
    }
    
    if (error.status >= 500) {
        showErrorToast('Server error. Please try again later.');
        return;
    }
    
    showErrorToast('Network request failed. Please try again.');
}

function setupErrorHandlers() {
    window.addEventListener('error', (event) => {
        logError('L999', 'Uncaught error', event.error);
    });
    
    window.addEventListener('unhandledrejection', (event) => {
        logError('L998', 'Unhandled promise rejection', event.reason);
    });
}

function checkBrowserCompatibility() {
    const issues = [];
    
    if (!window.fetch) {
        issues.push('Fetch API not supported');
    }
    
    if (!window.localStorage) {
        issues.push('Local Storage not supported');
    }
    
    if (!window.Map) {
        issues.push('Map not supported');
    }
    
    if (!navigator.geolocation) {
        issues.push('Geolocation not supported');
    }
    
    if (issues.length > 0) {
        console.warn('Browser compatibility issues:', issues);
        showToast('Your browser may not support all features');
    }
    
    return issues.length === 0;
}
// ============================================
// LISTINGS.JS - PART 20: PERFORMANCE OPTIMIZATION
// ============================================

let performanceMetrics = {
    loadStart: performance.now(),
    loadEnd: null,
    renderStart: null,
    renderEnd: null,
    filterStart: null,
    filterEnd: null
};

function measurePerformance(operation, fn) {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    
    console.log(`${operation} took ${(end - start).toFixed(2)}ms`);
    return result;
}

async function measureAsyncPerformance(operation, fn) {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    
    console.log(`${operation} took ${(end - start).toFixed(2)}ms`);
    return result;
}

function logPerformanceMetrics() {
    if (performanceMetrics.loadEnd) {
        console.log('Performance Metrics:');
        console.log(`  Total load time: ${(performanceMetrics.loadEnd - performanceMetrics.loadStart).toFixed(2)}ms`);
        
        if (performanceMetrics.renderEnd) {
            console.log(`  Render time: ${(performanceMetrics.renderEnd - performanceMetrics.renderStart).toFixed(2)}ms`);
        }
        
        if (performanceMetrics.filterEnd) {
            console.log(`  Filter time: ${(performanceMetrics.filterEnd - performanceMetrics.filterStart).toFixed(2)}ms`);
        }
    }
}

function optimizeImages() {
    const images = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                imageObserver.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
}

function lazyLoadComponents() {
    // Lazy load map only when needed
    if (!mapReady && mapOpen) {
        initMap();
    }
    
    // Lazy load split view only when activated
    if (!splitMap && splitViewActive) {
        initSplitMap();
    }
}

function cacheListings() {
    try {
        const cacheKey = 'cachedListings';
        const cacheTimestamp = 'cachedListingsTimestamp';
        const cacheExpiry = 30 * 60 * 1000; // 30 minutes
        
        const timestamp = localStorage.getItem(cacheTimestamp);
        if (timestamp && Date.now() - parseInt(timestamp) < cacheExpiry) {
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
                return JSON.parse(cached);
            }
        }
        
        return null;
    } catch (e) {
        console.error('Failed to get cached listings:', e);
        return null;
    }
}

function saveCachedListings(listings) {
    try {
        localStorage.setItem('cachedListings', JSON.stringify(listings));
        localStorage.setItem('cachedListingsTimestamp', Date.now().toString());
    } catch (e) {
        console.error('Failed to cache listings:', e);
    }
}

function clearCache() {
    try {
        localStorage.removeItem('cachedListings');
        localStorage.removeItem('cachedListingsTimestamp');
        console.log('Cache cleared');
    } catch (e) {
        console.error('Failed to clear cache:', e);
    }
}

function preloadCriticalResources() {
    // Preload fonts
    const fonts = [
        'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
    ];
    
    fonts.forEach(font => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'style';
        link.href = font;
        document.head.appendChild(link);
    });
}

function prefetchNextPage() {
    if (displayedListingsCount >= filteredListings.length) return;
    
    const nextPageListings = filteredListings.slice(
        displayedListingsCount,
        displayedListingsCount + 25
    );
    
    nextPageListings.forEach(listing => {
        if (listing.photos && listing.photos[0]) {
            const img = new Image();
            img.src = listing.photos[0];
        }
    });
}

function reduceRepaints() {
    // Batch DOM updates
    requestAnimationFrame(() => {
        // All DOM updates here
    });
}

function virtualizeListings() {
    // Implement virtual scrolling for large datasets
    const viewportHeight = window.innerHeight;
    const itemHeight = 300; // Approximate listing card height
    const buffer = 5; // Number of items to render above/below viewport
    
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - buffer);
    const endIndex = Math.min(
        filteredListings.length,
        Math.ceil((scrollTop + viewportHeight) / itemHeight) + buffer
    );
    
    return {
        startIndex,
        endIndex,
        visibleListings: filteredListings.slice(startIndex, endIndex)
    };
}

function monitorMemoryUsage() {
    if (performance.memory) {
        console.log('Memory Usage:');
        console.log(`  Used: ${(performance.memory.usedJSHeapSize / 1048576).toFixed(2)} MB`);
        console.log(`  Total: ${(performance.memory.totalJSHeapSize / 1048576).toFixed(2)} MB`);
        console.log(`  Limit: ${(performance.memory.jsHeapSizeLimit / 1048576).toFixed(2)} MB`);
    }
}

function optimizeMapPerformance() {
    if (!map) return;
    
    // Reduce marker cluster radius for better performance
    if (markerClusterGroup) {
        markerClusterGroup.options.maxClusterRadius = 30;
    }
    
    // Disable animations on mobile for better performance
    if (isMobileDevice()) {
        map.options.zoomAnimation = false;
        map.options.markerZoomAnimation = false;
    }
}

function enableServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('Service Worker registered:', registration);
            })
            .catch(error => {
                console.error('Service Worker registration failed:', error);
            });
    }
}
