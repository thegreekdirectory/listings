// ============================================
// LISTINGS PAGE JAVASCRIPT - PART 1
// Configuration, State Management & Initialization
// ============================================

const SUPABASE_URL = 'https://luetekzqrrgdxtopzvqw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1ZXRla3pxcnJnZHh0b3B6dnF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNDc2NDcsImV4cCI6MjA4MzkyMzY0N30.TIrNG8VGumEJc_9JvNHW-Q-UWfUGpPxR0v8POjWZJYg';

const CATEGORIES = [
    { name: 'Automotive & Transportation', icon: '🚗', slug: 'automotive-transportation' },
    { name: 'Beauty & Health', icon: '💅', slug: 'beauty-health' },
    { name: 'Church & Religious Organization', icon: '⛪', slug: 'church-religious-organization' },
    { name: 'Cultural/Fraternal Organization', icon: '🎭', slug: 'cultural-fraternal-organization' },
    { name: 'Education & Community', icon: '📚', slug: 'education-community' },
    { name: 'Entertainment, Arts & Recreation', icon: '🎨', slug: 'entertainment-arts-recreation' },
    { name: 'Food & Hospitality', icon: '🍽️', slug: 'food-hospitality' },
    { name: 'Grocery & Imports', icon: '🛒', slug: 'grocery-imports' },
    { name: 'Home & Construction', icon: '🏠', slug: 'home-construction' },
    { name: 'Industrial & Manufacturing', icon: '🏭', slug: 'industrial-manufacturing' },
    { name: 'Pets & Veterinary', icon: '🐾', slug: 'pets-veterinary' },
    { name: 'Professional & Business Services', icon: '💼', slug: 'professional-business-services' },
    { name: 'Real Estate & Development', icon: '🏢', slug: 'real-estate-development' },
    { name: 'Retail & Shopping', icon: '🛍️', slug: 'retail-shopping' }
];

const SUBCATEGORIES = {
    'Automotive & Transportation': ['Auto Detailer', 'Auto Repair Shop', 'Car Dealer', 'Taxi & Limo Service'],
    'Beauty & Health': ['Barbershops', 'Esthetician', 'Hair Salons', 'Nail Salon', 'Spas', 'Chiropractor', 'Dentist', 'Doctor', 'Nutritionist', 'Optometrist', 'Orthodontist', 'Physical Therapist', 'Physical Trainer'],
    'Church & Religious Organization': ['Church'],
    'Cultural/Fraternal Organization': ['Dance Troupe', 'Non-Profit', 'Philanthropic Group', 'Society', 'Youth Organization'],
    'Education & Community': ['Childcare', 'Greek School', 'Senior Care', 'Tutor'],
    'Entertainment, Arts & Recreation': ['Band', 'DJs', 'Entertainment Group', 'Photographer', 'Art'],
    'Food & Hospitality': ['Banquet Hall', 'Catering Service', 'Event Venue', 'Bakeries', 'Deli', 'Pastry Shop', 'Bar', 'Breakfast', 'Coffee', 'Lunch', 'Dinner', 'Restaurant', 'Hotel', 'Airbnb'],
    'Grocery & Imports': ['Butcher Shop', 'Liquor Shop', 'Market', 'Greek Alcohol', 'Honey', 'Olive Oil', 'Food Distribution', 'Food Manufacturer'],
    'Home & Construction': ['Carpenter', 'Electrician', 'General Contractor', 'Handyman', 'HVAC', 'Landscaping', 'Painter', 'Plumber', 'Roofing', 'Tile & Stone Specialist'],
    'Industrial & Manufacturing': ['Food Manufacturer'],
    'Pets & Veterinary': ['Veterinarian', 'Pet Accessories Maker'],
    'Professional & Business Services': ['Business Services', 'Consultant', 'CPA', 'Financial Advisor', 'Insurance Agent', 'IT Service & Repair', 'Lawyer', 'Marketing & Creative Agency', 'Notaries', 'Wedding Planner', 'Travel Agency'],
    'Real Estate & Development': ['Appraiser', 'Broker', 'Developer', 'Lender', 'Property Management', 'Real Estate Agent'],
    'Retail & Shopping': ['Boutique Shop', 'ECommerce', 'Jewelry', 'Souvenir Shop']
};

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
let allListings = [];
let filteredListings = [];
let displayedListings = [];
let currentPage = 1;
const ITEMS_PER_PAGE = 20;

let userLocation = null;
let map = null;
let markerCluster = null;
let markers = [];

let selectedCategories = [];
let selectedSubcategories = [];
let subcategoryMode = 'any';
let selectedCountry = '';
let selectedState = '';
let radiusKm = 0;
let customLocation = null;

let currentView = 'grid';
let currentSort = 'default';
let isMapVisible = false;
let isSplitView = false;
let isFilterPanelVisible = false;

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Initializing Listings Page...');
    
    listingsSupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Supabase initialized');
    
    setupEventListeners();
    await getUserLocation();
    await loadListings();
    setupFilters();
    renderListings();
});

function setupEventListeners() {
    // Search
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
    }
    
    // Mobile controls
    const filterBtn = document.getElementById('filterBtn');
    const mapBtn = document.getElementById('mapBtn');
    const refreshBtn = document.getElementById('refreshBtn');
    
    if (filterBtn) filterBtn.addEventListener('click', toggleFilterPanel);
    if (mapBtn) mapBtn.addEventListener('click', toggleMap);
    if (refreshBtn) refreshBtn.addEventListener('click', () => window.location.reload());
    
    // Desktop controls
    const mapBtnDesktop = document.getElementById('mapBtnDesktop');
    if (mapBtnDesktop) mapBtnDesktop.addEventListener('click', toggleMap);
    
    // View toggles
    const gridViewBtn = document.getElementById('gridViewBtn');
    const listViewBtn = document.getElementById('listViewBtn');
    const gridViewBtn2 = document.getElementById('gridViewBtn2');
    const listViewBtn2 = document.getElementById('listViewBtn2');
    
    if (gridViewBtn) gridViewBtn.addEventListener('click', () => switchView('grid'));
    if (listViewBtn) listViewBtn.addEventListener('click', () => switchView('list'));
    if (gridViewBtn2) gridViewBtn2.addEventListener('click', () => switchView('grid'));
    if (listViewBtn2) listViewBtn2.addEventListener('click', () => switchView('list'));
    
    // Sort
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) sortSelect.addEventListener('change', handleSort);
    
    // Load more
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) loadMoreBtn.addEventListener('click', loadMoreListings);
    
    // Filter controls
    const clearFiltersBtn = document.getElementById('clearFiltersBtn');
    const clearFiltersBtn2 = document.getElementById('clearFiltersBtn2');
    const closeFilterBtn = document.getElementById('closeFilterBtn');
    
    if (clearFiltersBtn) clearFiltersBtn.addEventListener('click', clearAllFilters);
    if (clearFiltersBtn2) clearFiltersBtn2.addEventListener('click', clearAllFilters);
    if (closeFilterBtn) closeFilterBtn.addEventListener('click', toggleFilterPanel);
    
    // Filter inputs
    const categorySearch = document.getElementById('categorySearch');
    const categorySearch2 = document.getElementById('categorySearch2');
    
    if (categorySearch) categorySearch.addEventListener('input', debounce(handleCategorySearch, 300));
    if (categorySearch2) categorySearch2.addEventListener('input', debounce(handleCategorySearch, 300));
    
    const countryFilter = document.getElementById('countryFilter');
    const countryFilter2 = document.getElementById('countryFilter2');
    
    if (countryFilter) countryFilter.addEventListener('change', handleCountryChange);
    if (countryFilter2) countryFilter2.addEventListener('change', handleCountryChange);
    
    const stateFilter = document.getElementById('stateFilter');
    const stateFilter2 = document.getElementById('stateFilter2');
    
    if (stateFilter) stateFilter.addEventListener('change', handleStateChange);
    if (stateFilter2) stateFilter2.addEventListener('change', handleStateChange);
    
    const radiusFilter = document.getElementById('radiusFilter');
    const radiusFilter2 = document.getElementById('radiusFilter2');
    
    if (radiusFilter) radiusFilter.addEventListener('input', handleRadiusChange);
    if (radiusFilter2) radiusFilter2.addEventListener('input', handleRadiusChange);
    
    // Hours filters
    const hoursFilters = ['openNow', 'closedNow', 'openingSoon', 'closingSoon', 'hoursUnknown', 'onlineOnly'];
    hoursFilters.forEach(filter => {
        const filter1 = document.getElementById(`${filter}Filter`);
        const filter2 = document.getElementById(`${filter}Filter2`);
        if (filter1) filter1.addEventListener('change', applyFilters);
        if (filter2) filter2.addEventListener('change', applyFilters);
    });
    
    // Location search
    const locationSearch = document.getElementById('locationSearch');
    const locationSearch2 = document.getElementById('locationSearch2');
    
    if (locationSearch) locationSearch.addEventListener('input', debounce(handleLocationSearch, 300));
    if (locationSearch2) locationSearch2.addEventListener('input', debounce(handleLocationSearch, 300));
    
    // Map controls
    const splitViewBtn = document.getElementById('splitViewBtn');
    const locateBtn = document.getElementById('locateBtn');
    const resetMapBtn = document.getElementById('resetMapBtn');
    
    if (splitViewBtn) splitViewBtn.addEventListener('click', toggleSplitView);
    if (locateBtn) locateBtn.addEventListener('click', centerOnUserLocation);
    if (resetMapBtn) resetMapBtn.addEventListener('click', resetMap);
    
    // Desktop filter position toggle
    const toggleFilterPosition = document.getElementById('toggleFilterPosition');
    if (toggleFilterPosition) {
        toggleFilterPosition.addEventListener('click', () => {
            const layout = document.getElementById('desktopLayout');
            const filtersContainer = document.getElementById('desktopFiltersContainer');
            const content = document.querySelector('.desktop-content');
            
            if (layout.style.flexDirection === 'row-reverse') {
                layout.style.flexDirection = 'row';
            } else {
                layout.style.flexDirection = 'row-reverse';
            }
        });
    }
}

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

async function getUserLocation() {
    try {
        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                timeout: 5000,
                maximumAge: 300000
            });
        });
        
        userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
        };
        
        console.log('📍 User location:', userLocation);
        
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${userLocation.lat}&lon=${userLocation.lng}&format=json`);
        const data = await response.json();
        
        const locationSubtitle = document.getElementById('locationSubtitle');
        if (locationSubtitle && data.address) {
            const city = data.address.city || data.address.town || data.address.village || '';
            const state = data.address.state || '';
            locationSubtitle.textContent = city && state ? `${city}, ${state}` : 'Your Location';
        }
        
    } catch (error) {
        console.log('Could not get user location:', error.message);
        const locationSubtitle = document.getElementById('locationSubtitle');
        if (locationSubtitle) {
            locationSubtitle.textContent = 'All Locations';
        }
    }
}
// ============================================
// LISTINGS PAGE JAVASCRIPT - PART 2
// Load Listings & Setup Filters
// ============================================

async function loadListings() {
    try {
        console.log('📥 Loading listings from Supabase...');
        
        const { data, error } = await listingsSupabase
            .from('listings')
            .select('*')
            .eq('visible', true)
            .order('business_name');
        
        if (error) throw error;
        
        allListings = data || [];
        filteredListings = [...allListings];
        
        console.log(`✅ Loaded ${allListings.length} listings`);
        
    } catch (error) {
        console.error('❌ Error loading listings:', error);
        const container = document.getElementById('listingsContainer');
        if (container) {
            container.innerHTML = '<p class="text-center text-red-600 p-8">Failed to load listings. Please refresh the page.</p>';
        }
    }
}

function setupFilters() {
    renderCategoryFilters();
    renderCountryFilter();
    syncDualFilters();
}

function renderCategoryFilters() {
    const container1 = document.getElementById('categoryFilters');
    const container2 = document.getElementById('categoryFilters2');
    
    const categoryHTML = CATEGORIES.map(cat => `
        <label class="flex items-center gap-2 p-2 hover:bg-gray-100 rounded cursor-pointer">
            <input type="checkbox" value="${cat.name}" onchange="handleCategoryChange()" class="category-checkbox">
            <span class="text-sm">${cat.icon} ${cat.name}</span>
        </label>
    `).join('');
    
    if (container1) container1.innerHTML = categoryHTML;
    if (container2) container2.innerHTML = categoryHTML;
}

function renderCountryFilter() {
    const countries = [...new Set(allListings.map(l => l.country).filter(Boolean))].sort();
    
    const countryHTML = countries.map(country => 
        `<option value="${country}">${country}</option>`
    ).join('');
    
    const countryFilter = document.getElementById('countryFilter');
    const countryFilter2 = document.getElementById('countryFilter2');
    
    if (countryFilter) {
        const currentValue = countryFilter.value;
        countryFilter.innerHTML = '<option value="">All Countries</option>' + countryHTML;
        countryFilter.value = currentValue;
    }
    
    if (countryFilter2) {
        const currentValue = countryFilter2.value;
        countryFilter2.innerHTML = '<option value="">All Countries</option>' + countryHTML;
        countryFilter2.value = currentValue;
    }
}

function syncDualFilters() {
    // Sync category checkboxes
    document.querySelectorAll('.category-checkbox').forEach(cb => {
        cb.checked = selectedCategories.includes(cb.value);
    });
    
    // Sync country filters
    const countryFilter = document.getElementById('countryFilter');
    const countryFilter2 = document.getElementById('countryFilter2');
    if (countryFilter) countryFilter.value = selectedCountry;
    if (countryFilter2) countryFilter2.value = selectedCountry;
    
    // Sync state filters
    const stateFilter = document.getElementById('stateFilter');
    const stateFilter2 = document.getElementById('stateFilter2');
    if (stateFilter) stateFilter.value = selectedState;
    if (stateFilter2) stateFilter2.value = selectedState;
    
    // Sync radius
    const radiusFilter = document.getElementById('radiusFilter');
    const radiusFilter2 = document.getElementById('radiusFilter2');
    if (radiusFilter) radiusFilter.value = radiusKm;
    if (radiusFilter2) radiusFilter2.value = radiusKm;
    
    updateRadiusDisplay();
}

function handleCategorySearch() {
    const search1 = document.getElementById('categorySearch')?.value.toLowerCase() || '';
    const search2 = document.getElementById('categorySearch2')?.value.toLowerCase() || '';
    const searchTerm = search1 || search2;
    
    document.querySelectorAll('#categoryFilters label, #categoryFilters2 label').forEach(label => {
        const text = label.textContent.toLowerCase();
        label.style.display = text.includes(searchTerm) ? 'flex' : 'none';
    });
}

window.handleCategoryChange = function() {
    selectedCategories = Array.from(document.querySelectorAll('.category-checkbox:checked'))
        .map(cb => cb.value);
    
    syncDualFilters();
    renderSubcategoryFilters();
    applyFilters();
};

function renderSubcategoryFilters() {
    const container1 = document.getElementById('subcategoryContainer');
    const container2 = document.getElementById('subcategoryContainer2');
    const filters1 = document.getElementById('subcategoryFilters');
    const filters2 = document.getElementById('subcategoryFilters2');
    
    if (selectedCategories.length === 0) {
        if (container1) container1.classList.add('hidden');
        if (container2) container2.classList.add('hidden');
        selectedSubcategories = [];
        return;
    }
    
    const allSubcats = new Set();
    selectedCategories.forEach(cat => {
        if (SUBCATEGORIES[cat]) {
            SUBCATEGORIES[cat].forEach(sub => allSubcats.add(sub));
        }
    });
    
    const subcatArray = Array.from(allSubcats).sort();
    
    if (subcatArray.length === 0) {
        if (container1) container1.classList.add('hidden');
        if (container2) container2.classList.add('hidden');
        return;
    }
    
    const subcatHTML = subcatArray.map(sub => `
        <label class="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full cursor-pointer text-sm">
            <input type="checkbox" value="${sub}" onchange="handleSubcategoryChange()" class="subcategory-checkbox">
            <span>${sub}</span>
        </label>
    `).join('');
    
    if (filters1) filters1.innerHTML = subcatHTML;
    if (filters2) filters2.innerHTML = subcatHTML;
    if (container1) container1.classList.remove('hidden');
    if (container2) container2.classList.remove('hidden');
    
    // Restore selections
    document.querySelectorAll('.subcategory-checkbox').forEach(cb => {
        cb.checked = selectedSubcategories.includes(cb.value);
    });
}

window.handleSubcategoryChange = function() {
    selectedSubcategories = Array.from(document.querySelectorAll('.subcategory-checkbox:checked'))
        .map(cb => cb.value);
    applyFilters();
};

window.setSubcategoryMode = function(mode) {
    subcategoryMode = mode;
    
    document.querySelectorAll('.toggle-option').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.mode === mode) {
            btn.classList.add('active');
        }
    });
    
    applyFilters();
};

function handleCountryChange(e) {
    selectedCountry = e.target.value;
    
    // Sync both country filters
    const countryFilter = document.getElementById('countryFilter');
    const countryFilter2 = document.getElementById('countryFilter2');
    if (countryFilter) countryFilter.value = selectedCountry;
    if (countryFilter2) countryFilter2.value = selectedCountry;
    
    // Update state filter
    const stateContainer = document.getElementById('stateFilterContainer');
    const stateContainer2 = document.getElementById('stateFilterContainer2');
    const stateFilter = document.getElementById('stateFilter');
    const stateFilter2 = document.getElementById('stateFilter2');
    
    if (selectedCountry === 'USA') {
        if (stateContainer) stateContainer.classList.remove('hidden');
        if (stateContainer2) stateContainer2.classList.remove('hidden');
        
        const stateHTML = Object.entries(US_STATES).map(([code, name]) => 
            `<option value="${code}">${name}</option>`
        ).join('');
        
        if (stateFilter) stateFilter.innerHTML = '<option value="">All States</option>' + stateHTML;
        if (stateFilter2) stateFilter2.innerHTML = '<option value="">All States</option>' + stateHTML;
    } else {
        if (stateContainer) stateContainer.classList.add('hidden');
        if (stateContainer2) stateContainer2.classList.add('hidden');
        selectedState = '';
    }
    
    applyFilters();
}

function handleStateChange(e) {
    selectedState = e.target.value;
    
    // Sync both state filters
    const stateFilter = document.getElementById('stateFilter');
    const stateFilter2 = document.getElementById('stateFilter2');
    if (stateFilter) stateFilter.value = selectedState;
    if (stateFilter2) stateFilter2.value = selectedState;
    
    applyFilters();
}

function handleRadiusChange(e) {
    radiusKm = parseInt(e.target.value);
    
    // Sync both radius sliders
    const radiusFilter = document.getElementById('radiusFilter');
    const radiusFilter2 = document.getElementById('radiusFilter2');
    if (radiusFilter) radiusFilter.value = radiusKm;
    if (radiusFilter2) radiusFilter2.value = radiusKm;
    
    updateRadiusDisplay();
    applyFilters();
}

function updateRadiusDisplay() {
    const radiusValue = document.getElementById('radiusValue');
    const radiusValue2 = document.getElementById('radiusValue2');
    
    const text = radiusKm === 0 ? 'Any distance' : `${radiusKm} km`;
    
    if (radiusValue) radiusValue.textContent = text;
    if (radiusValue2) radiusValue2.textContent = text;
}

function handleLocationSearch(e) {
    const query = e.target.value.trim();
    const resultsContainer = e.target.id === 'locationSearch' ? 
        document.getElementById('locationSearchResults') : 
        document.getElementById('locationSearchResults2');
    
    if (!resultsContainer) return;
    
    if (query.length < 3) {
        resultsContainer.innerHTML = '';
        resultsContainer.classList.remove('active');
        return;
    }
    
    // Search through listings for matching locations
    const matches = new Set();
    allListings.forEach(listing => {
        const searchStr = `${listing.city} ${listing.state} ${listing.zip_code} ${listing.country}`.toLowerCase();
        if (searchStr.includes(query.toLowerCase())) {
            if (listing.city && listing.state) {
                matches.add(JSON.stringify({
                    display: `${listing.city}, ${listing.state}`,
                    city: listing.city,
                    state: listing.state
                }));
            }
        }
    });
    
    const matchArray = Array.from(matches).map(m => JSON.parse(m)).slice(0, 5);
    
    if (matchArray.length === 0) {
        resultsContainer.innerHTML = '<div class="p-2 text-sm text-gray-500">No locations found</div>';
    } else {
        resultsContainer.innerHTML = matchArray.map(match => `
            <div class="p-2 hover:bg-gray-100 cursor-pointer text-sm" onclick="selectLocation('${match.city}', '${match.state}')">
                ${match.display}
            </div>
        `).join('');
    }
    
    resultsContainer.classList.add('active');
}

window.selectLocation = function(city, state) {
    // Find a listing in this city to get coordinates
    const listing = allListings.find(l => l.city === city && l.state === state && l.coordinates);
    
    if (listing && listing.coordinates) {
        customLocation = {
            lat: listing.coordinates.lat,
            lng: listing.coordinates.lng,
            city: city,
            state: state
        };
        
        console.log('📍 Custom location selected:', customLocation);
        
        // Update location subtitle
        const locationSubtitle = document.getElementById('locationSubtitle');
        if (locationSubtitle) {
            locationSubtitle.textContent = `${city}, ${state}`;
        }
        
        // Clear search boxes
        const locationSearch = document.getElementById('locationSearch');
        const locationSearch2 = document.getElementById('locationSearch2');
        if (locationSearch) locationSearch.value = '';
        if (locationSearch2) locationSearch2.value = '';
        
        // Clear results
        const results1 = document.getElementById('locationSearchResults');
        const results2 = document.getElementById('locationSearchResults2');
        if (results1) {
            results1.innerHTML = '';
            results1.classList.remove('active');
        }
        if (results2) {
            results2.innerHTML = '';
            results2.classList.remove('active');
        }
        
        applyFilters();
        
        // If map is visible, center on new location
        if (map && customLocation) {
            map.setView([customLocation.lat, customLocation.lng], 10);
        }
    }
};

function clearAllFilters() {
    selectedCategories = [];
    selectedSubcategories = [];
    selectedCountry = '';
    selectedState = '';
    radiusKm = 0;
    customLocation = null;
    
    // Clear checkboxes
    document.querySelectorAll('.category-checkbox, .subcategory-checkbox').forEach(cb => {
        cb.checked = false;
    });
    
    // Clear filters
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        if (cb.id && (cb.id.includes('Filter'))) {
            cb.checked = false;
        }
    });
    
    // Clear search
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = '';
    
    // Reset location subtitle
    const locationSubtitle = document.getElementById('locationSubtitle');
    if (locationSubtitle && userLocation) {
        locationSubtitle.textContent = 'Your Location';
    }
    
    syncDualFilters();
    renderSubcategoryFilters();
    applyFilters();
}
// ============================================
// LISTINGS PAGE JAVASCRIPT - PART 3
// Apply Filters & Search
// ============================================

function applyFilters() {
    let filtered = [...allListings];
    
    // Search filter
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput?.value.toLowerCase().trim() || '';
    if (searchTerm) {
        filtered = filtered.filter(listing => {
            const searchableText = `
                ${listing.business_name}
                ${listing.tagline || ''}
                ${listing.description || ''}
                ${listing.category}
                ${(listing.subcategories || []).join(' ')}
                ${listing.city || ''}
                ${listing.state || ''}
            `.toLowerCase();
            return searchableText.includes(searchTerm);
        });
    }
    
    // Category filter
    if (selectedCategories.length > 0) {
        filtered = filtered.filter(listing => 
            selectedCategories.includes(listing.category)
        );
    }
    
    // Subcategory filter
    if (selectedSubcategories.length > 0) {
        filtered = filtered.filter(listing => {
            const listingSubcats = listing.subcategories || [];
            if (subcategoryMode === 'all') {
                return selectedSubcategories.every(sub => listingSubcats.includes(sub));
            } else {
                return selectedSubcategories.some(sub => listingSubcats.includes(sub));
            }
        });
    }
    
    // Country filter
    if (selectedCountry) {
        filtered = filtered.filter(listing => 
            listing.country === selectedCountry
        );
    }
    
    // State filter
    if (selectedState) {
        filtered = filtered.filter(listing => 
            listing.state === selectedState
        );
    }
    
    // Radius filter
    if (radiusKm > 0) {
        const center = customLocation || userLocation;
        if (center) {
            filtered = filtered.filter(listing => {
                if (!listing.coordinates) return false;
                const distance = calculateDistance(
                    center.lat, center.lng,
                    listing.coordinates.lat, listing.coordinates.lng
                );
                return distance <= radiusKm;
            });
        }
    }
    
    // Hours filters
    const now = new Date();
    const openNowChecked = document.getElementById('openNowFilter')?.checked || 
                          document.getElementById('openNowFilter2')?.checked;
    const closedNowChecked = document.getElementById('closedNowFilter')?.checked || 
                            document.getElementById('closedNowFilter2')?.checked;
    const openingSoonChecked = document.getElementById('openingSoonFilter')?.checked || 
                              document.getElementById('openingSoonFilter2')?.checked;
    const closingSoonChecked = document.getElementById('closingSoonFilter')?.checked || 
                              document.getElementById('closingSoonFilter2')?.checked;
    const hoursUnknownChecked = document.getElementById('hoursUnknownFilter')?.checked || 
                               document.getElementById('hoursUnknownFilter2')?.checked;
    const onlineOnlyChecked = document.getElementById('onlineOnlyFilter')?.checked || 
                             document.getElementById('onlineOnlyFilter2')?.checked;
    
    if (openNowChecked || closedNowChecked || openingSoonChecked || closingSoonChecked || hoursUnknownChecked || onlineOnlyChecked) {
        filtered = filtered.filter(listing => {
            const status = getBusinessStatus(listing);
            
            if (onlineOnlyChecked && (!listing.address && !listing.city)) return true;
            if (hoursUnknownChecked && status === 'unknown') return true;
            if (openNowChecked && status === 'open') return true;
            if (closedNowChecked && status === 'closed') return true;
            if (openingSoonChecked && status === 'opening-soon') return true;
            if (closingSoonChecked && status === 'closing-soon') return true;
            
            return false;
        });
    }
    
    filteredListings = filtered;
    currentPage = 1;
    renderListings();
}

function getBusinessStatus(listing) {
    if (!listing.hours) return 'unknown';
    
    const now = new Date();
    const centralTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Chicago' }));
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = days[centralTime.getDay()];
    const todayHours = listing.hours[today];
    
    if (!todayHours || todayHours.toLowerCase() === 'closed') {
        return 'closed';
    }
    
    const match = todayHours.match(/(\d{1,2}):(\d{2})\s*(AM|PM)\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match) return 'unknown';
    
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
    
    if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) {
        if (endMinutes - currentMinutes <= 60) {
            return 'closing-soon';
        }
        return 'open';
    } else if (startMinutes - currentMinutes > 0 && startMinutes - currentMinutes <= 60) {
        return 'opening-soon';
    }
    
    return 'closed';
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(degrees) {
    return degrees * (Math.PI / 180);
}

function handleSearch() {
    applyFilters();
}

function handleSort(e) {
    currentSort = e.target.value;
    
    switch (currentSort) {
        case 'az':
            filteredListings.sort((a, b) => 
                a.business_name.localeCompare(b.business_name)
            );
            break;
        case 'closest':
            if (userLocation || customLocation) {
                const center = customLocation || userLocation;
                filteredListings.sort((a, b) => {
                    if (!a.coordinates) return 1;
                    if (!b.coordinates) return -1;
                    const distA = calculateDistance(
                        center.lat, center.lng,
                        a.coordinates.lat, a.coordinates.lng
                    );
                    const distB = calculateDistance(
                        center.lat, center.lng,
                        b.coordinates.lat, b.coordinates.lng
                    );
                    return distA - distB;
                });
            }
            break;
        default:
            // Default sort (tier priority)
            const tierOrder = { 'PREMIUM': 0, 'FEATURED': 1, 'VERIFIED': 2, 'FREE': 3 };
            filteredListings.sort((a, b) => {
                const tierA = tierOrder[a.tier || 'FREE'];
                const tierB = tierOrder[b.tier || 'FREE'];
                if (tierA !== tierB) return tierA - tierB;
                return a.business_name.localeCompare(b.business_name);
            });
    }
    
    currentPage = 1;
    renderListings();
}

function formatPhoneDisplay(phone) {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');
    if (phone.startsWith('+1') && digits.length === 11) {
        return `(${digits.substr(1, 3)}) ${digits.substr(4, 3)}-${digits.substr(7, 4)}`;
    }
    return phone;
}
// ============================================
// LISTINGS PAGE JAVASCRIPT - PART 4
// Render Listings & Display Functions
// ============================================

function renderListings() {
    const start = 0;
    const end = currentPage * ITEMS_PER_PAGE;
    displayedListings = filteredListings.slice(start, end);
    
    const container = document.getElementById('listingsContainer');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    
    if (!container) return;
    
    // Update results count
    updateResultsCount();
    
    // Show/hide load more button
    if (loadMoreBtn) {
        if (end < filteredListings.length) {
            loadMoreBtn.classList.remove('hidden');
        } else {
            loadMoreBtn.classList.add('hidden');
        }
    }
    
    if (displayedListings.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-16">
                <p class="text-gray-600 text-lg mb-4">No listings found matching your criteria</p>
                <button onclick="clearAllFilters()" class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Clear All Filters
                </button>
            </div>
        `;
        
        if (map && markerCluster) {
            markerCluster.clearLayers();
        }
        return;
    }
    
    // Render based on view mode
    if (currentView === 'list') {
        renderListView(container);
    } else {
        renderGridView(container);
    }
    
    // Update map if visible
    if (isMapVisible) {
        updateMap();
    }
}

function renderGridView(container) {
    container.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';
    container.innerHTML = displayedListings.map(listing => renderListingCard(listing)).join('');
}

function renderListView(container) {
    container.className = 'space-y-4';
    container.innerHTML = displayedListings.map(listing => renderListingRow(listing)).join('');
}

function renderListingCard(listing) {
    const categorySlug = listing.category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const url = `/listing/${categorySlug}/${listing.slug}`;
    
    const photos = listing.photos || [];
    const mainImage = photos.length > 0 ? photos[0] : listing.logo;
    
    const badges = [];
    if (listing.tier === 'PREMIUM') {
        badges.push('<span class="badge badge-featured">⭐ Featured</span>');
        badges.push('<span class="badge badge-verified">✓ Verified</span>');
    } else {
        if (listing.tier === 'FEATURED') {
            badges.push('<span class="badge badge-featured">⭐ Featured</span>');
        }
        if (listing.verified || listing.tier === 'VERIFIED') {
            badges.push('<span class="badge badge-verified">✓ Verified</span>');
        }
    }
    
    const phoneDisplay = listing.phone ? formatPhoneDisplay(listing.phone) : '';
    
    let distanceText = '';
    if ((userLocation || customLocation) && listing.coordinates) {
        const center = customLocation || userLocation;
        const distance = calculateDistance(
            center.lat, center.lng,
            listing.coordinates.lat, listing.coordinates.lng
        );
        distanceText = `<p class="text-sm text-gray-500 mt-1">📍 ${distance.toFixed(1)} km away</p>`;
    }
    
    return `
        <a href="${url}" class="listing-card block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden" data-no-translate>
            ${mainImage ? `<img src="${mainImage}" alt="${listing.business_name}" class="w-full h-48 object-cover" onerror="this.style.display='none'">` : ''}
            <div class="p-4">
                <div class="flex items-start justify-between mb-2">
                    <div class="flex-1">
                        ${badges.length > 0 ? `<div class="flex gap-1 mb-2">${badges.join('')}</div>` : ''}
                        <h3 class="text-lg font-bold text-gray-900 line-clamp-2">${listing.business_name}</h3>
                        ${listing.tagline ? `<p class="text-sm text-gray-600 italic mt-1 line-clamp-1">"${listing.tagline}"</p>` : ''}
                    </div>
                    ${listing.logo && mainImage !== listing.logo ? `<img src="${listing.logo}" alt="${listing.business_name} logo" class="w-12 h-12 rounded object-cover ml-2 flex-shrink-0">` : ''}
                </div>
                <span class="inline-block px-2 py-1 text-xs font-semibold text-white rounded" style="background-color:#055193;">${listing.category}</span>
                ${listing.city && listing.state ? `<p class="text-sm text-gray-700 mt-2">📍 ${listing.city}, ${listing.state}</p>` : ''}
                ${listing.phone ? `<p class="text-sm text-gray-700 mt-1">📞 ${phoneDisplay}</p>` : ''}
                ${distanceText}
            </div>
        </a>
    `;
}

function renderListingRow(listing) {
    const categorySlug = listing.category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const url = `/listing/${categorySlug}/${listing.slug}`;
    
    const photos = listing.photos || [];
    const mainImage = photos.length > 0 ? photos[0] : listing.logo;
    
    const badges = [];
    if (listing.tier === 'PREMIUM') {
        badges.push('<span class="badge badge-featured">⭐ Featured</span>');
        badges.push('<span class="badge badge-verified">✓ Verified</span>');
    } else {
        if (listing.tier === 'FEATURED') {
            badges.push('<span class="badge badge-featured">⭐ Featured</span>');
        }
        if (listing.verified || listing.tier === 'VERIFIED') {
            badges.push('<span class="badge badge-verified">✓ Verified</span>');
        }
    }
    
    const phoneDisplay = listing.phone ? formatPhoneDisplay(listing.phone) : '';
    
    let distanceText = '';
    if ((userLocation || customLocation) && listing.coordinates) {
        const center = customLocation || userLocation;
        const distance = calculateDistance(
            center.lat, center.lng,
            listing.coordinates.lat, listing.coordinates.lng
        );
        distanceText = `<p class="text-sm text-gray-500">📍 ${distance.toFixed(1)} km away</p>`;
    }
    
    return `
        <a href="${url}" class="listing-row flex gap-4 bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow" data-no-translate>
            ${mainImage ? `<img src="${mainImage}" alt="${listing.business_name}" class="w-32 h-32 object-cover rounded flex-shrink-0" onerror="this.style.display='none'">` : ''}
            <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between mb-2">
                    <div class="flex-1">
                        ${badges.length > 0 ? `<div class="flex gap-1 mb-2">${badges.join('')}</div>` : ''}
                        <h3 class="text-xl font-bold text-gray-900">${listing.business_name}</h3>
                        ${listing.tagline ? `<p class="text-sm text-gray-600 italic mt-1">"${listing.tagline}"</p>` : ''}
                    </div>
                    ${listing.logo && mainImage !== listing.logo ? `<img src="${listing.logo}" alt="${listing.business_name} logo" class="w-16 h-16 rounded object-cover ml-4 flex-shrink-0">` : ''}
                </div>
                <span class="inline-block px-2 py-1 text-xs font-semibold text-white rounded" style="background-color:#055193;">${listing.category}</span>
                <div class="mt-2 space-y-1">
                    ${listing.city && listing.state ? `<p class="text-sm text-gray-700">📍 ${listing.city}, ${listing.state}</p>` : ''}
                    ${listing.phone ? `<p class="text-sm text-gray-700">📞 ${phoneDisplay}</p>` : ''}
                    ${distanceText}
                </div>
            </div>
        </a>
    `;
}

function updateResultsCount() {
    const countEl = document.getElementById('resultsCount');
    if (countEl) {
        countEl.textContent = `Showing ${displayedListings.length} of ${filteredListings.length} listings`;
    }
}

function loadMoreListings() {
    currentPage++;
    renderListings();
}

function switchView(view) {
    currentView = view;
    
    // Update button states
    const gridBtns = [document.getElementById('gridViewBtn'), document.getElementById('gridViewBtn2')];
    const listBtns = [document.getElementById('listViewBtn'), document.getElementById('listViewBtn2')];
    
    gridBtns.forEach(btn => {
        if (!btn) return;
        if (view === 'grid') {
            btn.classList.add('bg-white', 'shadow-sm');
            btn.classList.remove('bg-transparent');
        } else {
            btn.classList.remove('bg-white', 'shadow-sm');
            btn.classList.add('bg-transparent');
        }
    });
    
    listBtns.forEach(btn => {
        if (!btn) return;
        if (view === 'list') {
            btn.classList.add('bg-white', 'shadow-sm');
            btn.classList.remove('bg-transparent');
        } else {
            btn.classList.remove('bg-white', 'shadow-sm');
            btn.classList.add('bg-transparent');
        }
    });
    
    renderListings();
}
// ============================================
// LISTINGS PAGE JAVASCRIPT - PART 5
// Map Functions & UI Controls
// ============================================

function toggleFilterPanel() {
    isFilterPanelVisible = !isFilterPanelVisible;
    const panel = document.getElementById('filterPanel');
    
    if (panel) {
        if (isFilterPanelVisible) {
            panel.classList.remove('hidden');
        } else {
            panel.classList.add('hidden');
        }
    }
}

function toggleMap() {
    isMapVisible = !isMapVisible;
    const mapContainer = document.getElementById('mapContainer');
    const normalViewControls = document.getElementById('normalViewControls');
    const normalViewListings = document.getElementById('normalViewListings');
    
    if (!mapContainer) return;
    
    if (isMapVisible) {
        mapContainer.classList.remove('hidden');
        if (!map) {
            initializeMap();
        } else {
            updateMap();
            setTimeout(() => map.invalidateSize(), 100);
        }
        
        // Show desktop filters when map is visible
        const desktopFilters = document.getElementById('desktopFiltersContainer');
        if (desktopFilters && window.innerWidth >= 1024) {
            desktopFilters.classList.remove('hidden');
        }
    } else {
        mapContainer.classList.add('hidden');
        if (isSplitView) {
            toggleSplitView();
        }
    }
}

function initializeMap() {
    console.log('🗺️ Initializing map...');
    
    const mapElement = document.getElementById('map');
    if (!mapElement) {
        console.error('Map element not found');
        return;
    }
    
    const mapLoading = document.getElementById('mapLoading');
    if (mapLoading) mapLoading.style.display = 'flex';
    
    try {
        // Initialize map
        const center = customLocation || userLocation || { lat: 41.8781, lng: -87.6298 };
        map = L.map('map', {
            center: [center.lat, center.lng],
            zoom: userLocation ? 10 : 5,
            zoomControl: true
        });
        
        console.log('✅ Map created');
        
        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(map);
        
        console.log('✅ Tile layer added');
        
        // Initialize marker cluster
        markerCluster = L.markerClusterGroup({
            maxClusterRadius: 50,
            spiderfyOnMaxZoom: true,
            showCoverageOnHover: false,
            zoomToBoundsOnClick: true
        });
        
        map.addLayer(markerCluster);
        console.log('✅ Marker cluster initialized');
        
        // Add markers for current listings
        updateMap();
        
        // Hide loading indicator
        if (mapLoading) {
            setTimeout(() => {
                mapLoading.style.display = 'none';
            }, 500);
        }
        
        console.log('✅ Map fully initialized');
        
    } catch (error) {
        console.error('❌ Map initialization error:', error);
        if (mapLoading) mapLoading.innerHTML = '<p class="text-red-600">Failed to load map</p>';
    }
}

function updateMap() {
    if (!map || !markerCluster) return;
    
    console.log('📍 Updating map with', filteredListings.length, 'listings');
    
    // Clear existing markers
    markerCluster.clearLayers();
    markers = [];
    
    // Add markers for listings with coordinates
    const listingsWithCoords = filteredListings.filter(l => l.coordinates && l.coordinates.lat && l.coordinates.lng);
    
    console.log('📍 Found', listingsWithCoords.length, 'listings with coordinates');
    
    listingsWithCoords.forEach(listing => {
        try {
            const categorySlug = listing.category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            const url = `/listing/${categorySlug}/${listing.slug}`;
            
            const marker = L.marker([listing.coordinates.lat, listing.coordinates.lng]);
            
            const popupContent = `
                <div class="p-2">
                    <h3 class="font-bold text-sm mb-1">${listing.business_name}</h3>
                    ${listing.tagline ? `<p class="text-xs text-gray-600 italic mb-2">"${listing.tagline}"</p>` : ''}
                    <span class="inline-block px-2 py-0.5 text-xs font-semibold text-white rounded" style="background-color:#055193;">${listing.category}</span>
                    ${listing.city && listing.state ? `<p class="text-xs text-gray-700 mt-1">📍 ${listing.city}, ${listing.state}</p>` : ''}
                    <a href="${url}" class="block mt-2 text-xs text-blue-600 hover:underline">View Details →</a>
                </div>
            `;
            
            marker.bindPopup(popupContent);
            markers.push(marker);
            markerCluster.addLayer(marker);
            
        } catch (error) {
            console.error('Error adding marker for', listing.business_name, error);
        }
    });
    
    // Fit bounds if there are markers
    if (markers.length > 0) {
        try {
            const group = new L.featureGroup(markers);
            map.fitBounds(group.getBounds().pad(0.1));
        } catch (error) {
            console.error('Error fitting bounds:', error);
        }
    }
    
    console.log('✅ Map updated with', markers.length, 'markers');
}

function centerOnUserLocation() {
    if (userLocation && map) {
        map.setView([userLocation.lat, userLocation.lng], 12);
        
        // Add temporary marker for user location
        L.marker([userLocation.lat, userLocation.lng], {
            icon: L.icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
            })
        }).addTo(map).bindPopup('Your Location').openPopup();
    } else {
        alert('Location not available. Please enable location services.');
    }
}

function resetMap() {
    if (map) {
        const center = customLocation || userLocation || { lat: 41.8781, lng: -87.6298 };
        map.setView([center.lat, center.lng], userLocation ? 10 : 5);
        updateMap();
    }
}

function toggleSplitView() {
    isSplitView = !isSplitView;
    
    const mapContainer = document.getElementById('mapContainer');
    const splitViewContainer = document.getElementById('splitViewContainer');
    const normalViewControls = document.getElementById('normalViewControls');
    const normalViewListings = document.getElementById('normalViewListings');
    const desktopLayout = document.getElementById('desktopLayout');
    
    if (!mapContainer || !splitViewContainer) return;
    
    if (isSplitView) {
        // Enter split view
        splitViewContainer.classList.remove('hidden');
        mapContainer.classList.add('split-view-mode');
        
        // Clone listings into split view
        const listingsClone = normalViewListings.cloneNode(true);
        listingsClone.id = 'splitViewListings';
        splitViewContainer.innerHTML = '';
        splitViewContainer.appendChild(listingsClone);
        
        // Hide normal view
        if (normalViewControls) normalViewControls.style.display = 'none';
        if (normalViewListings) normalViewListings.style.display = 'none';
        
        // Adjust map size
        setTimeout(() => {
            if (map) map.invalidateSize();
        }, 100);
        
    } else {
        // Exit split view
        splitViewContainer.classList.add('hidden');
        mapContainer.classList.remove('split-view-mode');
        
        // Show normal view
        if (normalViewControls) normalViewControls.style.display = 'flex';
        if (normalViewListings) normalViewListings.style.display = 'block';
        
        // Adjust map size
        setTimeout(() => {
            if (map) map.invalidateSize();
        }, 100);
    }
}

// Show desktop filters on large screens when page loads
window.addEventListener('resize', () => {
    const desktopFilters = document.getElementById('desktopFiltersContainer');
    if (desktopFilters) {
        if (window.innerWidth >= 1024) {
            desktopFilters.classList.remove('hidden');
        } else {
            desktopFilters.classList.add('hidden');
        }
    }
});

// Initialize desktop filters visibility
if (window.innerWidth >= 1024) {
    const desktopFilters = document.getElementById('desktopFiltersContainer');
    if (desktopFilters) {
        desktopFilters.classList.remove('hidden');
    }
}
