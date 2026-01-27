// js/index.js
// Copyright (C) The Greek Directory, 2025-present. All rights reserved. This source code is proprietary and no part may not be used, reproduced, or distributed without written permission from The Greek Directory. For more information, visit https://thegreekdirectory.org/legal.

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

// Copyright (C) The Greek Directory, 2025-present. All rights reserved.

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

let indexSupabase = null;
let allListings = [];

function formatPhoneDisplay(phone) {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');
    if (phone.startsWith('+1') && digits.length === 11) {
        return `(${digits.substr(1, 3)}) ${digits.substr(4, 3)}-${digits.substr(7, 4)}`;
    }
    return phone;
}

// Copyright (C) The Greek Directory, 2025-present. All rights reserved.

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Initializing homepage...');
    
    indexSupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    setupSearch();
    renderCategories();
    await loadListings();
    renderFeaturedListings();
    renderRecentListings();
});

function setupSearch() {
    const searchInput = document.getElementById('mainSearch');
    
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }
}

function performSearch() {
    const searchInput = document.getElementById('mainSearch');
    const query = searchInput?.value.trim();
    
    if (query) {
        window.location.href = `/listings?q=${encodeURIComponent(query)}`;
    }
}

// Copyright (C) The Greek Directory, 2025-present. All rights reserved.

function searchByCategory(categoryName) {
    const encodedCategory = encodeURIComponent(categoryName);
    window.location.href = `/listings?category=${encodedCategory}`;
}

window.handleHeroLocationSearch = function(query) {
    const resultsDiv = document.getElementById('heroLocationResults');
    
    if (!query || query.length < 2) {
        resultsDiv.classList.add('hidden');
        return;
    }
    
    const queryLower = query.toLowerCase();
    const matches = [];
    const seen = new Set();
    
    allListings.forEach(listing => {
        if (listing.city && listing.city.toLowerCase().includes(queryLower)) {
            const key = `${listing.city}-${listing.state}`;
            if (!seen.has(key)) {
                matches.push({
                    type: 'city',
                    city: listing.city,
                    state: listing.state,
                    display: `${listing.city}, ${listing.state}`
                });
                seen.add(key);
            }
        }
    });
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    Object.entries(US_STATES).forEach(([code, name]) => {
        if (name.toLowerCase().includes(queryLower) || code.toLowerCase().includes(queryLower)) {
            if (!seen.has(code)) {
                matches.push({
                    type: 'state',
                    state: code,
                    display: `${name} (${code})`
                });
                seen.add(code);
            }
        }
    });
    
    if (matches.length > 0) {
        resultsDiv.innerHTML = matches.slice(0, 8).map(match => `
            <div class="px-4 py-3 hover:bg-gray-100 cursor-pointer text-gray-800" 
                 onclick="selectHeroLocation('${match.type}', '${match.city || ''}', '${match.state}')">
                ${match.display}
            </div>
        `).join('');
        resultsDiv.classList.remove('hidden');
    } else {
        resultsDiv.classList.add('hidden');
    }
};

window.selectHeroLocation = function(type, city, state) {
    const resultsDiv = document.getElementById('heroLocationResults');
    resultsDiv.classList.add('hidden');
    
    if (type === 'city') {
        window.location.href = `/listings?country=USA&state=${state}`;
    } else if (type === 'state') {
        window.location.href = `/listings?country=USA&state=${state}`;
    }
};

// Copyright (C) The Greek Directory, 2025-present. All rights reserved.

document.addEventListener('click', (e) => {
    const resultsDiv = document.getElementById('heroLocationResults');
    const searchInput = document.getElementById('heroLocationSearch');
    
    if (resultsDiv && searchInput && !resultsDiv.contains(e.target) && !searchInput.contains(e.target)) {
        resultsDiv.classList.add('hidden');
    }
});

function renderCategories() {
    const grid = document.getElementById('categoriesGrid');
    
    if (!grid) return;
    
    grid.innerHTML = CATEGORIES.map(category => `
        <a href="/listings?category=${encodeURIComponent(category.name)}" class="category-card">
            <div class="category-icon">${category.icon}</div>
            <div class="category-name">${category.name}</div>
            <div class="category-count" id="count-${category.slug}">Loading...</div>
        </a>
    `).join('');
    
    updateCategoryCounts();
}

// Copyright (C) The Greek Directory, 2025-present. All rights reserved.

async function updateCategoryCounts() {
    try {
        const { data, error } = await indexSupabase
            .from('listings')
            .select('category')
            .eq('visible', true);
        
        if (error) throw error;
        
        const counts = {};
        data.forEach(listing => {
            counts[listing.category] = (counts[listing.category] || 0) + 1;
        });
        
        CATEGORIES.forEach(category => {
            const count = counts[category.name] || 0;
            const countEl = document.getElementById(`count-${category.slug}`);
            if (countEl) {
                countEl.textContent = `${count} businesses`;
            }
        });
        
    } catch (error) {
        console.error('Error loading category counts:', error);
    }
}

async function loadListings() {
    try {
        console.log('📥 Loading listings...');
        
        const { data: listings, error } = await indexSupabase
            .from('listings')
            .select('*')
            .eq('visible', true)
            .order('created_at', { ascending: false })
            .limit(100);
        
        if (error) throw error;
        
        allListings = listings || [];
        console.log(`✅ Loaded ${allListings.length} listings`);
        
    } catch (error) {
        console.error('❌ Error loading listings:', error);
    }
}

// Copyright (C) The Greek Directory, 2025-present. All rights reserved.

function renderFeaturedListings() {
    const container = document.getElementById('featuredListings');
    
    if (!container) return;
    
    const featured = allListings
        .filter(l => l.tier === 'FEATURED' || l.tier === 'PREMIUM')
        .slice(0, 6);
    
    if (featured.length === 0) {
        container.innerHTML = '<p class="loading">No featured businesses yet.</p>';
        return;
    }
    
    container.innerHTML = featured.map(listing => renderListingCard(listing)).join('');
}

function renderRecentListings() {
    const container = document.getElementById('recentListings');
    
    if (!container) return;
    
    const recent = allListings.slice(0, 6);
    
    if (recent.length === 0) {
        container.innerHTML = '<p class="loading">No businesses yet.</p>';
        return;
    }
    
    container.innerHTML = recent.map(listing => renderListingCard(listing)).join('');
}

// Copyright (C) The Greek Directory, 2025-present. All rights reserved.

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
    
    return `
        <a href="${url}" class="listing-card">
            ${mainImage ? `<img src="${mainImage}" alt="${listing.business_name}" class="listing-image" onerror="this.style.display='none'">` : ''}
            <div class="listing-content">
                <div class="flex items-start justify-between mb-3">
                    <div class="flex-1">
                        ${badges.length > 0 ? `<div class="listing-badges mb-2">${badges.join('')}</div>` : ''}
                        <h3 class="listing-name">${listing.business_name}</h3>
                        ${listing.tagline ? `<p class="listing-tagline">"${listing.tagline}"</p>` : ''}
                    </div>
                    ${listing.logo && mainImage !== listing.logo ? `<img src="${listing.logo}" alt="${listing.business_name} logo" class="w-12 h-12 rounded-lg object-cover ml-2 flex-shrink-0">` : ''}
                </div>
                <span class="listing-category">${listing.category}</span>
                ${listing.city && listing.state ? `
                    <p class="listing-location">📍 ${listing.city}, ${listing.state}</p>
                ` : ''}
                ${listing.phone ? `
                    <p class="listing-location">📞 ${phoneDisplay}</p>
                ` : ''}
            </div>
        </a>
    `;
}

// Copyright (C) The Greek Directory, 2025-present. All rights reserved.

window.performSearch = performSearch;
window.searchByCategory = searchByCategory;

// Copyright (C) The Greek Directory, 2025-present. All rights reserved. This source code is proprietary and no part may not be used, reproduced, or distributed without written permission from The Greek Directory. For more information, visit https://thegreekdirectory.org/legal.
