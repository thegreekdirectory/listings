// ============================================
// INDEX PAGE JAVASCRIPT
// Homepage functionality
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

let indexSupabase = null;
let allListings = [];

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
        window.location.href = `/search?q=${encodeURIComponent(query)}`;
    }
}

function renderCategories() {
    const grid = document.getElementById('categoriesGrid');
    
    if (!grid) return;
    
    grid.innerHTML = CATEGORIES.map(category => `
        <a href="/category/${category.slug}" class="category-card">
            <div class="category-icon">${category.icon}</div>
            <div class="category-name" data-translate="category.${getCategoryKey(category.name)}">${category.name}</div>
            <div class="category-count" id="count-${category.slug}">Loading...</div>
        </a>
    `).join('');
    
    updateCategoryCounts();
}

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

function renderListingCard(listing) {
    const categorySlug = listing.category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const url = `/listings/${categorySlug}/${listing.slug}`;
    
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
    
    return `
        <a href="${url}" class="listing-card" data-no-translate>
            ${mainImage ? `<img src="${mainImage}" alt="${listing.business_name}" class="listing-image" onerror="this.style.display='none'">` : ''}
            <div class="listing-content">
                ${badges.length > 0 ? `<div class="listing-badges">${badges.join('')}</div>` : ''}
                <h3 class="listing-name">${listing.business_name}</h3>
                ${listing.tagline ? `<p class="listing-tagline">"${listing.tagline}"</p>` : ''}
                <span class="listing-category" data-translate="category.${getCategoryKey(listing.category)}">${listing.category}</span>
                ${listing.city && listing.state ? `
                    <p class="listing-location">📍 ${listing.city}, ${listing.state}</p>
                ` : ''}
                ${listing.phone ? `
                    <p class="listing-location">📞 ${listing.phone}</p>
                ` : ''}
            </div>
        </a>
    `;
}

function getCategoryKey(category) {
    const keyMap = {
        'Automotive & Transportation': 'automotive',
        'Beauty & Health': 'beauty',
        'Church & Religious Organization': 'church',
        'Cultural/Fraternal Organization': 'cultural',
        'Education & Community': 'education',
        'Entertainment, Arts & Recreation': 'entertainment',
        'Food & Hospitality': 'food',
        'Grocery & Imports': 'grocery',
        'Home & Construction': 'home',
        'Industrial & Manufacturing': 'industrial',
        'Pets & Veterinary': 'pets',
        'Professional & Business Services': 'professional',
        'Real Estate & Development': 'realestate',
        'Retail & Shopping': 'retail'
    };
    return keyMap[category] || category.toLowerCase();
}

window.performSearch = performSearch;
