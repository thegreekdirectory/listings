/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
This source code is proprietary and no part may not be used, reproduced, or distributed 
without written permission from The Greek Directory. Unauthorized use, copying, modification, 
or distribution of this code will result in legal action to the fullest extent permitted by law.
*/

// ============================================
// ADMIN PORTAL - PART 1
// Configuration & State Management
// ============================================

const SUPABASE_URL = 'https://luetekzqrrgdxtopzvqw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1ZXRla3pxcnJnZHh0b3B6dnF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNDc2NDcsImV4cCI6MjA4MzkyMzY0N30.TIrNG8VGumEJc_9JvNHW-Q-UWfUGpPxR0v8POjWZJYg';

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
*/

const CATEGORIES = [
    'Automotive & Transportation', 'Beauty & Health', 'Church & Religious Organization',
    'Cultural/Fraternal Organization', 'Education & Community', 'Entertainment, Arts & Recreation',
    'Food & Hospitality', 'Grocery & Imports', 'Home & Construction', 'Industrial & Manufacturing',
    'Pets & Veterinary', 'Professional & Business Services', 'Real Estate & Development', 'Retail & Shopping'
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

const COUNTRY_CODES = {
    'USA': '+1',
    'Greece': '+30',
    'Canada': '+1',
    'UK': '+44',
    'Cyprus': '+357',
    'Australia': '+61'
};

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
*/

const CATEGORY_DEFAULT_IMAGES = {
    'Automotive & Transportation': 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3',
    'Beauty & Health': 'https://images.unsplash.com/photo-1560750588-73207b1ef5b8',
    'Church & Religious Organization': 'https://images.unsplash.com/photo-1601231656153-73aa7f115365',
    'Cultural/Fraternal Organization': 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac',
    'Education & Community': 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1',
    'Entertainment, Arts & Recreation': 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819',
    'Food & Hospitality': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4',
    'Grocery & Imports': 'https://images.unsplash.com/photo-1542838132-92c53300491e',
    'Home & Construction': 'https://images.unsplash.com/photo-1503387762-592deb58ef4e',
    'Industrial & Manufacturing': 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158',
    'Pets & Veterinary': 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b',
    'Professional & Business Services': 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40',
    'Real Estate & Development': 'https://images.unsplash.com/photo-1560518883-ce09059eeffa',
    'Retail & Shopping': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8'
};

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
*/

let adminSupabase = null;
let currentAdminUser = null;
let adminGithubToken = null;
let allListings = [];
let editingListing = null;
let selectedSubcategories = [];
let primarySubcategory = null;
let userCountry = 'USA';

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Initializing Admin Portal...');
    
    adminSupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Supabase initialized');
    
    await detectUserCountry();
    setupEventListeners();
    
    const savedToken = localStorage.getItem('tgd_admin_token');
    if (savedToken) {
        document.getElementById('githubToken').value = savedToken;
        handleAdminLogin();
    }
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
or distribution of this code can result in legal action to the fullest extent permitted by law.
*/

// ============================================
// ADMIN PORTAL - PART 2
// Authentication & Login Functions
// ============================================

async function handleAdminLogin() {
    const token = document.getElementById('githubToken').value.trim();
    
    if (!token) {
        showError('Please enter your GitHub token');
        return;
    }
    
    clearAuthMessage();
    
    try {
        const response = await fetch('https://api.github.com/repos/thegreekdirectory/listings', {
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Invalid GitHub token');
        }
        
        adminGithubToken = token;
        localStorage.setItem('tgd_admin_token', token);
        
        showSuccess('Login successful!');
        showDashboard();
        await loadListings();
        
    } catch (error) {
        console.error('Login error:', error);
        showError('Invalid GitHub token. Please check and try again.');
    }
}

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
*/

function showLoginPage() {
    document.getElementById('loginPage').classList.remove('hidden');
    document.getElementById('dashboardPage').classList.add('hidden');
}

function showDashboard() {
    document.getElementById('loginPage').classList.add('hidden');
    document.getElementById('dashboardPage').classList.remove('hidden');
}

async function logout() {
    if (confirm('Are you sure you want to logout?')) {
        adminGithubToken = null;
        localStorage.removeItem('tgd_admin_token');
        showLoginPage();
    }
}

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
*/

function showError(message) {
    const msgDiv = document.getElementById('authMessage');
    msgDiv.className = 'error-message';
    msgDiv.textContent = message;
    msgDiv.classList.remove('hidden');
}

function showSuccess(message) {
    const msgDiv = document.getElementById('authMessage');
    msgDiv.className = 'success-message';
    msgDiv.textContent = message;
    msgDiv.classList.remove('hidden');
}

function clearAuthMessage() {
    const msgDiv = document.getElementById('authMessage');
    msgDiv.classList.add('hidden');
    msgDiv.textContent = '';
}

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
*/

function formatPhoneNumber(phone, country = 'USA') {
    if (!phone) return '';
    
    const digits = phone.replace(/\D/g, '');
    
    if (phone.startsWith('+1') && digits.length === 11) {
        return `(${digits.substr(1, 3)}) ${digits.substr(4, 3)}-${digits.substr(7, 4)}`;
    }
    
    return phone;
}

function createPhoneInput(value = '', country = 'USA') {
    const digits = value ? value.replace(/\D/g, '') : '';
    
    return `
        <div class="flex gap-2">
            <select class="phone-country-select px-3 py-2 border border-gray-300 rounded-lg" onchange="updatePhoneFormat(this)">
                ${Object.entries(COUNTRY_CODES).map(([c, code]) => 
                    `<option value="${c}" ${country === c ? 'selected' : ''}>${c} ${code}</option>`
                ).join('')}
            </select>
            <input type="tel" class="phone-number-input flex-1 px-4 py-2 border border-gray-300 rounded-lg" 
                value="${digits}" 
                placeholder="${country === 'USA' ? '5551234567' : 'Phone number'}"
                oninput="formatPhoneInput(this)">
        </div>
    `;
}

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
*/

window.formatPhoneInput = function(input) {
    const country = input.closest('.flex').querySelector('.phone-country-select').value;
    let value = input.value.replace(/\D/g, '');
    
    if (country === 'USA' && value.length > 10) {
        value = value.substr(0, 10);
    }
    
    input.value = value;
};

window.updatePhoneFormat = function(select) {
    const input = select.closest('.flex').querySelector('.phone-number-input');
    const digits = input.value.replace(/\D/g, '');
    input.value = digits;
    formatPhoneInput(input);
};

function getPhoneValue(container) {
    const countrySelect = container.querySelector('.phone-country-select');
    const phoneInput = container.querySelector('.phone-number-input');
    
    if (!phoneInput || !phoneInput.value.trim()) return null;
    
    const country = countrySelect ? countrySelect.value : 'USA';
    const digits = phoneInput.value.replace(/\D/g, '');
    const code = COUNTRY_CODES[country];
    
    return `${code}${digits}`;
}

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
*/

window.handleAdminLogin = handleAdminLogin;
window.logout = logout;

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
This source code is proprietary and no part may not be used, reproduced, or distributed 
without written permission from The Greek Directory. Unauthorized use, copying, modification, 
or distribution of this code can result in legal action to the fullest extent permitted by law.
*/
/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
This source code is proprietary and no part may not be used, reproduced, or distributed 
without written permission from The Greek Directory. Unauthorized use, copying, modification, 
or distribution of this code can result in legal action to the fullest extent permitted by law.
*/

// ============================================
// ADMIN PORTAL - PART 3
// Load & Render Listings
// ============================================

async function loadListings() {
    try {
        console.log('📥 Loading listings from Supabase...');
        
        const { data: listings, error } = await adminSupabase
            .from('listings')
            .select(`
                *,
                owner:business_owners(*)
            `)
            .order('id', { ascending: true });
        
        if (error) throw error;
        
        allListings = listings || [];
        console.log(`✅ Loaded ${allListings.length} listings`);
        
        renderTable();
        
    } catch (error) {
        console.error('❌ Error loading listings:', error);
        alert('Failed to load listings: ' + error.message);
    }
}

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
*/

function renderTable() {
    const tbody = document.getElementById('listingsTableBody');
    const searchTerm = document.getElementById('adminSearch')?.value.toLowerCase() || '';
    
    const filtered = searchTerm ? allListings.filter(l => 
        l.business_name.toLowerCase().includes(searchTerm) ||
        l.category.toLowerCase().includes(searchTerm) ||
        (l.city && l.city.toLowerCase().includes(searchTerm)) ||
        (l.id && l.id.toString().includes(searchTerm))
    ) : allListings;
    
    tbody.innerHTML = filtered.map(l => {
        const categorySlug = l.category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const listingUrl = `/listing/${categorySlug}/${l.slug}`;
        const tier = l.tier || 'FREE';
        const tierColors = {
            FREE: 'bg-gray-100 text-gray-700',
            VERIFIED: 'bg-blue-100 text-blue-700',
            FEATURED: 'bg-yellow-100 text-yellow-700',
            PREMIUM: 'bg-purple-100 text-purple-700'
        };
        
        const ownerInfo = l.owner && l.owner.length > 0 ? l.owner[0] : null;
        const isClaimed = ownerInfo && ownerInfo.is_claimed;
        
        let badges = '';
        if (tier === 'PREMIUM') {
            badges = '<span class="ml-2 px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-700">⭐ Featured</span>';
            badges += '<span class="ml-2 px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">✓ Verified</span>';
        } else if (tier === 'FEATURED') {
            badges = '<span class="ml-2 px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-700">⭐ Featured</span>';
        } else if (tier === 'VERIFIED') {
            badges += '<span class="ml-2 px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">✓ Verified</span>';
        }
        
        if (isClaimed) {
            badges += '<span class="ml-2 px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">✓ Claimed</span>';
        }
        
        if (l.is_chain) {
            badges += '<span class="ml-2 px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-700">🔗 Chain</span>';
        }
        
        /*
        Copyright (C) The Greek Directory, 2025-present. All rights reserved.
        */
        
        return `
        <tr class="border-b hover:bg-gray-50">
            <td class="py-4 px-4 text-sm font-mono text-gray-600">#${l.id}</td>
            <td class="py-4 px-4">
                <label class="inline-flex items-center cursor-pointer">
                    <input type="checkbox" ${l.visible ? 'checked' : ''} onchange="toggleVisibility('${l.id}')" class="w-4 h-4">
                    <span class="ml-2 text-sm">${l.visible ? '👁️ Visible' : '🚫 Hidden'}</span>
                </label>
            </td>
            <td class="py-4 px-4">
                <span class="px-2 py-1 rounded text-xs font-medium ${tierColors[tier]}">${tier}</span>
                ${badges}
            </td>
            <td class="py-4 px-4 font-medium">${l.business_name}</td>
            <td class="py-4 px-4 text-gray-600">${l.category}</td>
            <td class="py-4 px-4 text-sm text-gray-600">${l.city || ''}, ${l.state || ''}</td>
            <td class="py-4 px-4 text-sm text-gray-600">
                <button onclick="viewAnalytics('${l.id}')" class="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs hover:bg-purple-200">
                    📊 Analytics
                </button>
            </td>
            <td class="py-4 px-4 text-sm text-gray-600">${new Date(l.updated_at).toLocaleString()}</td>
            <td class="py-4 px-4">
                <div class="flex justify-end gap-2 flex-wrap">
                    <button onclick="editListing('${l.id}')" class="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200">Edit</button>
                    <a href="${listingUrl}" target="_blank" class="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">View</a>
                    <button onclick="generateListingPage('${l.id}')" class="px-3 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200" title="Generate Static Page">🔨</button>
                    ${isClaimed ? `<button onclick="sendMagicLink('${l.id}')" class="px-3 py-1 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200">🔗</button>` : ''}
                    <button onclick="deleteListing('${l.id}')" class="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200">Delete</button>
                </div>
            </td>
        </tr>
    `}).join('');
}

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
*/

window.toggleVisibility = async function(id) {
    try {
        const listing = allListings.find(l => l.id === id);
        const newVisible = !listing.visible;
        
        const { error } = await adminSupabase
            .from('listings')
            .update({ visible: newVisible })
            .eq('id', id);
        
        if (error) throw error;
        
        listing.visible = newVisible;
        renderTable();
        
    } catch (error) {
        console.error('Error toggling visibility:', error);
        alert('Failed to update visibility');
    }
};

window.loadListings = loadListings;

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
This source code is proprietary and no part may not be used, reproduced, or distributed 
without written permission from The Greek Directory. Unauthorized use, copying, modification, 
or distribution of this code can result in legal action to the fullest extent permitted by law.
*/
// admin.js - Part 4
/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
This source code is proprietary and no part may not be used, reproduced, or distributed 
without written permission from The Greek Directory. Unauthorized use, copying, modification, 
or distribution of this code will result in legal action to the fullest extent permitted by law.
*/

// ============================================
// ADMIN PORTAL - PART 4
// Analytics Modal & Viewing
// ============================================

window.viewAnalytics = async function(listingId) {
    const listing = allListings.find(l => l.id === listingId);
    if (!listing) return;
    
    try {
        /*
        Copyright (C) The Greek Directory, 2025-present. All rights reserved.
        */
        
        // Fetch analytics data from Supabase
        const { data: analyticsData, error } = await adminSupabase
            .from('listing_analytics')
            .select('*')
            .eq('listing_id', listingId)
            .order('timestamp', { ascending: false });
        
        if (error) throw error;
        
        // Aggregate analytics
        const analytics = {
            views: 0,
            call_clicks: 0,
            website_clicks: 0,
            direction_clicks: 0,
            share_clicks: 0,
            video_plays: 0,
            detailedViews: analyticsData || [],
            sharePlatforms: {}
        };
        
        if (analyticsData && analyticsData.length > 0) {
            analyticsData.forEach(event => {
                switch(event.action) {
                    case 'view':
                        analytics.views++;
                        break;
                    case 'call':
                        analytics.call_clicks++;
                        break;
                    case 'website':
                        analytics.website_clicks++;
                        break;
                    case 'directions':
                        analytics.direction_clicks++;
                        break;
                    case 'share':
                        analytics.share_clicks++;
                        if (event.platform) {
                            analytics.sharePlatforms[event.platform] = (analytics.sharePlatforms[event.platform] || 0) + 1;
                        }
                        break;
                    case 'video':
                        analytics.video_plays++;
                        break;
                }
            });
        }
        
        /*
        Copyright (C) The Greek Directory, 2025-present. All rights reserved.
        */
        
        // Create analytics modal HTML
        const modalHTML = `
            <div id="analyticsModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                <div class="bg-white rounded-lg max-w-6xl w-full my-8">
                    <div class="p-6 border-b flex items-center justify-between">
                        <h2 class="text-2xl font-bold text-gray-900">Analytics: ${listing.business_name}</h2>
                        <button onclick="closeAnalyticsModal()" class="text-gray-500 hover:text-gray-700 text-2xl">×</button>
                    </div>
                    <div class="p-6 max-h-[70vh] overflow-y-auto">
                        ${generateAnalyticsContent(listing, analytics, analytics.detailedViews, analytics.sharePlatforms)}
                    </div>
                    <div class="p-6 border-t flex justify-end">
                        <button onclick="closeAnalyticsModal()" class="px-6 py-2 bg-gray-200 text-gray-900 rounded-lg font-medium">Close</button>
                    </div>
                </div>
            </div>
        `;
        
        // Remove existing modal if present
        const existingModal = document.getElementById('analyticsModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
    } catch (error) {
        console.error('Error loading analytics:', error);
        alert('Failed to load analytics: ' + error.message);
    }
};

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
*/

function generateAnalyticsContent(listing, analytics, detailedViews, sharePlatforms) {
    const views = analytics.views || 0;
    const callClicks = analytics.call_clicks || 0;
    const websiteClicks = analytics.website_clicks || 0;
    const directionClicks = analytics.direction_clicks || 0;
    const shareClicks = analytics.share_clicks || 0;
    const videoPlays = analytics.video_plays || 0;
    const lastViewed = detailedViews.length > 0 ? new Date(detailedViews[0].timestamp).toLocaleString() : 'Never';
    
    // Summary stats
    let content = `
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <div class="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 rounded-lg">
                <div class="text-3xl font-bold">${views}</div>
                <div class="text-sm opacity-90">Total Views</div>
            </div>
            <div class="bg-gradient-to-br from-green-500 to-green-600 text-white p-4 rounded-lg">
                <div class="text-3xl font-bold">${callClicks}</div>
                <div class="text-sm opacity-90">Call Clicks</div>
            </div>
            <div class="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-4 rounded-lg">
                <div class="text-3xl font-bold">${websiteClicks}</div>
                <div class="text-sm opacity-90">Website Clicks</div>
            </div>
            <div class="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-4 rounded-lg">
                <div class="text-3xl font-bold">${directionClicks}</div>
                <div class="text-sm opacity-90">Direction Clicks</div>
            </div>
            <div class="bg-gradient-to-br from-pink-500 to-pink-600 text-white p-4 rounded-lg">
                <div class="text-3xl font-bold">${shareClicks}</div>
                <div class="text-sm opacity-90">Shares</div>
            </div>
            <div class="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white p-4 rounded-lg">
                <div class="text-3xl font-bold">${videoPlays}</div>
                <div class="text-sm opacity-90">Video Plays</div>
            </div>
        </div>
        
        <div class="mb-6 p-4 bg-gray-50 rounded-lg">
            <div class="text-sm text-gray-600">Last Viewed: <span class="font-semibold text-gray-900">${lastViewed}</span></div>
        </div>
    `;
    
    /*
    Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    */
    
    // Share platforms breakdown
    if (Object.keys(sharePlatforms).length > 0) {
        content += `
            <div class="mb-6">
                <h3 class="text-lg font-bold text-gray-900 mb-3">Share Platform Breakdown</h3>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        `;
        
        Object.entries(sharePlatforms).forEach(([platform, count]) => {
            const platformNames = {
                'facebook': '📘 Facebook',
                'twitter': '🐦 Twitter/X',
                'linkedin': '💼 LinkedIn',
                'sms': '💬 SMS',
                'email': '📧 Email',
                'native': '📱 Native Share'
            };
            
            content += `
                <div class="bg-white border border-gray-200 p-3 rounded-lg">
                    <div class="text-2xl font-bold text-gray-900">${count}</div>
                    <div class="text-xs text-gray-600">${platformNames[platform] || platform}</div>
                </div>
            `;
        });
        
        content += `
                </div>
            </div>
        `;
    }
    
    /*
    Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    */
    
    // Detailed activity log
    if (detailedViews.length > 0) {
        content += `
            <div class="mb-6">
                <h3 class="text-lg font-bold text-gray-900 mb-3">Activity Log (Last ${Math.min(detailedViews.length, 100)} Events)</h3>
                <div class="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <table class="w-full text-sm">
                        <thead class="bg-gray-50 border-b">
                            <tr>
                                <th class="text-left py-2 px-4 font-semibold">Timestamp</th>
                                <th class="text-left py-2 px-4 font-semibold">Action</th>
                                <th class="text-left py-2 px-4 font-semibold">Details</th>
                            </tr>
                        </thead>
                        <tbody>
        `;
        
        // Show latest 100 events
        const recentViews = detailedViews.slice(0, 100);
        
        recentViews.forEach(view => {
            const timestamp = new Date(view.timestamp).toLocaleString();
            const actionIcons = {
                'view': '👁️ View',
                'call': '📞 Call',
                'website': '🌐 Website',
                'directions': '🗺️ Directions',
                'share': '📤 Share',
                'video': '🎥 Video'
            };
            
            const actionText = actionIcons[view.action] || view.action;
            const platform = view.platform ? ` (${view.platform})` : '';
            const userAgent = view.user_agent ? view.user_agent.substring(0, 50) + '...' : 'Unknown';
            
            content += `
                <tr class="border-b hover:bg-gray-50">
                    <td class="py-2 px-4 text-gray-600">${timestamp}</td>
                    <td class="py-2 px-4 font-medium">${actionText}${platform}</td>
                    <td class="py-2 px-4 text-xs text-gray-500">${userAgent}</td>
                </tr>
            `;
        });
        
        content += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    } else {
        content += `
            <div class="p-8 text-center bg-gray-50 rounded-lg">
                <div class="text-gray-400 text-4xl mb-2">📊</div>
                <div class="text-gray-600">No detailed analytics available yet</div>
            </div>
        `;
    }
    
    return content;
}

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
*/

window.closeAnalyticsModal = function() {
    const modal = document.getElementById('analyticsModal');
    if (modal) {
        modal.remove();
    }
};

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
This source code is proprietary and no part may not be used, reproduced, or distributed 
without written permission from The Greek Directory. Unauthorized use, copying, modification, 
or distribution of this code will result in legal action to the fullest extent permitted by law.
*/
// admin.js - Part 5
/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
This source code is proprietary and no part may not be used, reproduced, or distributed 
without written permission from The Greek Directory. Unauthorized use, copying, modification, 
or distribution of this code will result in legal action to the fullest extent permitted by law.
*/

// ============================================
// ADMIN PORTAL - PART 5
// Edit Listing & Form Management - Part 1
// ============================================

window.editListing = async function(id) {
    try {
        const { data: listing, error } = await adminSupabase
            .from('listings')
            .select(`
                *,
                owner:business_owners(*)
            `)
            .eq('id', id)
            .single();
        
        if (error) throw error;
        
        editingListing = listing;
        selectedSubcategories = listing.subcategories || [];
        primarySubcategory = listing.primary_subcategory || null;
        
        document.getElementById('modalTitle').textContent = 'Edit Listing';
        fillEditForm(listing);
        document.getElementById('editModal').classList.remove('hidden');
        
    } catch (error) {
        console.error('Error loading listing:', error);
        alert('Failed to load listing');
    }
};

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
*/

window.newListing = async function() {
    try {
        const { data: maxIdResult, error: maxIdError } = await adminSupabase
            .from('listings')
            .select('id')
            .order('id', { ascending: false })
            .limit(1);
        
        if (maxIdError) throw maxIdError;
        
        const nextId = maxIdResult && maxIdResult.length > 0 ? maxIdResult[0].id + 1 : 1;
        
        editingListing = {
            id: nextId,
            business_name: '',
            tagline: '',
            description: '',
            category: CATEGORIES[0],
            subcategories: [],
            tier: 'FREE',
            verified: false,
            visible: true,
            is_chain: false,
            is_claimed: false
        };
        
        selectedSubcategories = [];
        primarySubcategory = null;
        
        document.getElementById('modalTitle').textContent = 'New Listing';
        fillEditForm(editingListing);
        document.getElementById('editModal').classList.remove('hidden');
        
    } catch (error) {
        console.error('Error creating new listing:', error);
        alert('Failed to create new listing');
    }
};

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
*/

function fillEditForm(listing) {
    const owner = listing?.owner && listing.owner.length > 0 ? listing.owner[0] : null;
    
    const formContent = document.getElementById('editFormContent');
    formContent.innerHTML = `
        <div class="space-y-6">
            <!-- Basic Info -->
            <div>
                <h3 class="text-lg font-bold mb-4">Basic Information</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="md:col-span-2">
                        <label class="block text-sm font-medium mb-2">Business Name *</label>
                        <input type="text" id="editBusinessName" value="${listing?.business_name || ''}" class="w-full px-4 py-2 border rounded-lg">
                    </div>
                    <div class="md:col-span-2">
                        <label class="block text-sm font-medium mb-2">Slug</label>
                        <div class="flex gap-2">
                            <input type="text" id="editSlug" value="${listing?.slug || ''}" class="flex-1 px-4 py-2 border rounded-lg" placeholder="auto-generated">
                            <button type="button" onclick="checkSlugAvailability()" class="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200">Check</button>
                        </div>
                        <p class="text-xs text-gray-500 mt-1" id="slugStatus"></p>
                    </div>
                    <div class="md:col-span-2">
                        <label class="block text-sm font-medium mb-2">Tagline (max 75) *</label>
                        <input type="text" id="editTagline" value="${listing?.tagline || ''}" maxlength="75" class="w-full px-4 py-2 border rounded-lg" oninput="updateCharCounters()">
                        <p class="text-xs text-gray-500 mt-1"><span id="taglineCount">${(listing?.tagline || '').length}</span>/75</p>
                    </div>
                    <div class="md:col-span-2">
                        <label class="block text-sm font-medium mb-2">Description *</label>
                        <textarea id="editDescription" rows="5" class="w-full px-4 py-2 border rounded-lg" oninput="updateCharCounters()">${listing?.description || ''}</textarea>
                        <p class="text-xs text-gray-500 mt-1"><span id="descCount">${(listing?.description || '').length}</span> characters</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Category *</label>
                        <select id="editCategory" class="w-full px-4 py-2 border rounded-lg" onchange="updateSubcategoriesForCategory()">
                            ${CATEGORIES.map(cat => `<option value="${cat}" ${listing?.category === cat ? 'selected' : ''}>${cat}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Tier</label>
                        <select id="editTier" class="w-full px-4 py-2 border rounded-lg">
                            <option value="FREE" ${listing?.tier === 'FREE' ? 'selected' : ''}>FREE</option>
                            <option value="VERIFIED" ${listing?.tier === 'VERIFIED' ? 'selected' : ''}>VERIFIED</option>
                            <option value="FEATURED" ${listing?.tier === 'FEATURED' ? 'selected' : ''}>FEATURED</option>
                            <option value="PREMIUM" ${listing?.tier === 'PREMIUM' ? 'selected' : ''}>PREMIUM</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- Subcategories -->
            <div id="subcategoriesContainer">
                <div class="flex items-center justify-between mb-2">
                    <label class="block text-sm font-medium">Subcategories *</label>
                    <span class="text-xs text-gray-500">Select at least one</span>
                </div>
                <div id="subcategoryCheckboxes" class="grid grid-cols-2 gap-2"></div>
            </div>

            <!-- Chain Info -->
            <div>
                <label class="flex items-center gap-2 mb-4">
                    <input type="checkbox" id="editIsChain" ${listing?.is_chain ? 'checked' : ''} onchange="toggleChainFields()">
                    <span class="text-sm font-medium">This is a chain business</span>
                </label>
                <div id="chainFieldsContainer" class="${listing?.is_chain ? '' : 'hidden'} grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">Chain Name</label>
                        <input type="text" id="editChainName" value="${listing?.chain_name || ''}" class="w-full px-4 py-2 border rounded-lg">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Chain ID</label>
                        <input type="text" id="editChainId" value="${listing?.chain_id || ''}" class="w-full px-4 py-2 border rounded-lg" placeholder="Auto-generated if empty">
                    </div>
                </div>
            </div>

            <!-- Claimed Status -->
            <div>
                <label class="flex items-center gap-2">
                    <input type="checkbox" id="editIsClaimed" ${listing?.is_claimed ? 'checked' : ''}>
                    <span class="text-sm font-medium">Business is claimed</span>
                </label>
                <p class="text-xs text-gray-500 mt-1">If claimed, no confirmation key will be generated</p>
            </div>

            <!-- Location -->
            <div>
                <h3 class="text-lg font-bold mb-4">Location</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="md:col-span-2">
                        <label class="block text-sm font-medium mb-2">Address</label>
                        <input type="text" id="editAddress" value="${listing?.address || ''}" class="w-full px-4 py-2 border rounded-lg">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">City</label>
                        <input type="text" id="editCity" value="${listing?.city || ''}" class="w-full px-4 py-2 border rounded-lg">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">State</label>
                        <select id="editState" class="w-full px-4 py-2 border rounded-lg">
                            <option value="">Select State</option>
                            ${Object.entries(US_STATES).map(([code, name]) => 
                                `<option value="${code}" ${listing?.state === code ? 'selected' : ''}>${name}</option>`
                            ).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Zip Code</label>
                        <input type="text" id="editZipCode" value="${listing?.zip_code || ''}" class="w-full px-4 py-2 border rounded-lg">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Country</label>
                        <select id="editCountry" class="w-full px-4 py-2 border rounded-lg">
                            <option value="USA" ${listing?.country === 'USA' ? 'selected' : ''}>USA</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- Contact -->
            <div>
                <h3 class="text-lg font-bold mb-4">Contact Information</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">Phone</label>
                        <div id="editPhoneContainer"></div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Email</label>
                        <input type="email" id="editEmail" value="${listing?.email || ''}" class="w-full px-4 py-2 border rounded-lg">
                    </div>
                    <div class="md:col-span-2">
                        <label class="block text-sm font-medium mb-2">Website</label>
                        <input type="url" id="editWebsite" value="${listing?.website || ''}" class="w-full px-4 py-2 border rounded-lg">
                    </div>
                </div>
            </div>
    `;
    
    const phoneContainer = document.getElementById('editPhoneContainer');
    if (phoneContainer) {
        phoneContainer.innerHTML = createPhoneInput(listing?.phone || '', userCountry);
    }
    
    fillEditFormContinuation(listing, owner);
}

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
This source code is proprietary and no part may not be used, reproduced, or distributed 
without written permission from The Greek Directory. Unauthorized use, copying, modification, 
or distribution of this code will result in legal action to the fullest extent permitted by law.
*/
// admin.js Part 6 - Edit Form Continuation (Hours, Social, Reviews, Owner, Media)

function fillEditFormContinuation(listing, owner) {
    const formContent = document.getElementById('editFormContent');
    formContent.innerHTML += `
            <!-- Hours -->
            <div>
                <h3 class="text-lg font-bold text-gray-900 mb-4">Hours of Operation</h3>
                <div class="grid grid-cols-1 gap-3">
                    ${['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => `
                        <div class="flex gap-2">
                            <label class="w-28 flex items-center font-medium text-gray-700">${day}:</label>
                            <input type="text" id="editHours${day}" value="${listing?.hours && listing.hours[day.toLowerCase()] ? listing.hours[day.toLowerCase()] : ''}" class="flex-1 px-4 py-2 border border-gray-300 rounded-lg" placeholder="9:00 AM - 5:00 PM or Closed">
                        </div>
                    `).join('')}
                </div>
            </div>

            <!--
            Copyright (C) The Greek Directory, 2025-present. All rights reserved.
            This source code is proprietary and no part may not be used, reproduced, or distributed 
            without written permission from The Greek Directory. Unauthorized use, copying, modification, 
            or distribution of this code will result in legal action to the fullest extent permitted by law.
            -->

            <!-- Social Media -->
            <div>
                <h3 class="text-lg font-bold text-gray-900 mb-4">Social Media Links</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Facebook</label>
                        <input type="text" id="editFacebook" value="${listing?.social_media?.facebook || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="username">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Instagram</label>
                        <input type="text" id="editInstagram" value="${listing?.social_media?.instagram || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="username">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Twitter/X</label>
                        <input type="text" id="editTwitter" value="${listing?.social_media?.twitter || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="username">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">YouTube</label>
                        <input type="text" id="editYoutube" value="${listing?.social_media?.youtube || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="channel">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">TikTok</label>
                        <input type="text" id="editTiktok" value="${listing?.social_media?.tiktok || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="username">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">LinkedIn</label>
                        <input type="url" id="editLinkedin" value="${listing?.social_media?.linkedin || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Full URL">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Other Social 1</label>
                        <input type="url" id="editSocialOther1" value="${listing?.social_media?.other1 || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Full URL">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Other Social 2</label>
                        <input type="url" id="editSocialOther2" value="${listing?.social_media?.other2 || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Full URL">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Other Social 3</label>
                        <input type="url" id="editSocialOther3" value="${listing?.social_media?.other3 || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Full URL">
                    </div>
                </div>
            </div>

            <!--
            Copyright (C) The Greek Directory, 2025-present. All rights reserved.
            This source code is proprietary and no part may not be used, reproduced, or distributed 
            without written permission from The Greek Directory. Unauthorized use, copying, modification, 
            or distribution of this code will result in legal action to the fullest extent permitted by law.
            -->

            <!-- Reviews -->
            <div>
                <h3 class="text-lg font-bold text-gray-900 mb-4">Review Sites</h3>
                <p class="text-sm text-gray-600 mb-4">Add review links if not present (locked fields require Support)</p>
                <div class="grid grid-cols-1 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Google Reviews</label>
                        <input type="url" id="editGoogleReviews" value="${listing?.reviews?.google || ''}" 
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg" 
                            ${listing?.reviews?.google ? 'disabled' : ''} 
                            placeholder="Full Google Reviews URL">
                        ${listing?.reviews?.google ? '<p class="info-notice">Contact Support to change</p>' : ''}
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Yelp</label>
                        <input type="url" id="editYelp" value="${listing?.reviews?.yelp || ''}" 
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg" 
                            ${listing?.reviews?.yelp ? 'disabled' : ''} 
                            placeholder="Full Yelp URL">
                        ${listing?.reviews?.yelp ? '<p class="info-notice">Contact Support to change</p>' : ''}
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">TripAdvisor</label>
                        <input type="url" id="editTripadvisor" value="${listing?.reviews?.tripadvisor || ''}" 
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg" 
                            ${listing?.reviews?.tripadvisor ? 'disabled' : ''} 
                            placeholder="Full TripAdvisor URL">
                        ${listing?.reviews?.tripadvisor ? '<p class="info-notice">Contact Support to change</p>' : ''}
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Other Review Site 1</label>
                        <input type="url" id="editReviewOther1" value="${listing?.reviews?.other1 || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Full URL">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Other Review Site 2</label>
                        <input type="url" id="editReviewOther2" value="${listing?.reviews?.other2 || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Full URL">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Other Review Site 3</label>
                        <input type="url" id="editReviewOther3" value="${listing?.reviews?.other3 || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Full URL">
                    </div>
                </div>
            </div>

            <!--
            Copyright (C) The Greek Directory, 2025-present. All rights reserved.
            This source code is proprietary and no part may not be used, reproduced, or distributed 
            without written permission from The Greek Directory. Unauthorized use, copying, modification, 
            or distribution of this code will result in legal action to the fullest extent permitted by law.
            -->

            <!-- Owner Info -->
            <div>
                <h3 class="text-lg font-bold text-gray-900 mb-4">Owner Information</h3>
                ${owner?.owner_user_id ? '<p class="text-sm text-green-600 mb-4">✓ This listing is claimed</p>' : '<p class="text-sm text-gray-600 mb-4">This listing is not claimed</p>'}
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Owner Name</label>
                        <input type="text" id="editOwnerName" value="${owner?.full_name || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Title</label>
                        <input type="text" id="editOwnerTitle" value="${owner?.title || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">From Greece</label>
                        <input type="text" id="editOwnerGreece" value="${owner?.from_greece || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="e.g. Athens">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Owner Email</label>
                        <input type="email" id="editOwnerEmail" value="${owner?.owner_email || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Owner Phone</label>
                        <div id="editOwnerPhoneContainer"></div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Confirmation Key</label>
                        <input type="text" id="editConfirmationKey" value="${owner?.confirmation_key || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg" ${owner?.owner_user_id ? 'disabled title="Cannot change - listing is claimed"' : ''} placeholder="${owner?.owner_user_id ? 'Listing is claimed' : 'Auto-generated if empty'}">
                    </div>
                </div>
            </div>

            <!--
            Copyright (C) The Greek Directory, 2025-present. All rights reserved.
            This source code is proprietary and no part may not be used, reproduced, or distributed 
            without written permission from The Greek Directory. Unauthorized use, copying, modification, 
            or distribution of this code will result in legal action to the fullest extent permitted by law.
            -->

            <!-- Media -->
            <div>
                <h3 class="text-lg font-bold text-gray-900 mb-4">Media</h3>
                <div class="grid grid-cols-1 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Logo URL</label>
                        <input type="url" id="editLogo" value="${listing?.logo || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Photos (one per line)</label>
                        <textarea id="editPhotos" rows="4" class="w-full px-4 py-2 border border-gray-300 rounded-lg">${listing?.photos ? listing.photos.join('\n') : ''}</textarea>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Video URL (YouTube/Vimeo embed)</label>
                        <input type="url" id="editVideo" value="${listing?.video || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="https://www.youtube.com/embed/...">
                    </div>
                </div>
            </div>
        </div>
    `;
    
    /*
    Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    This source code is proprietary and no part may not be used, reproduced, or distributed 
    without written permission from The Greek Directory. Unauthorized use, copying, modification, 
    or distribution of this code will result in legal action to the fullest extent permitted by law.
    */
    
    const ownerPhoneContainer = document.getElementById('editOwnerPhoneContainer');
    if (ownerPhoneContainer) {
        ownerPhoneContainer.innerHTML = createPhoneInput(owner?.owner_phone || '', userCountry);
    }
    
    updateSubcategoriesForCategory();
}

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
This source code is proprietary and no part may not be used, reproduced, or distributed 
without written permission from The Greek Directory. Unauthorized use, copying, modification, 
or distribution of this code will result in legal action to the fullest extent permitted by law.
*/
// admin.js Part 7 - Geocoding & Save Listing Functions

async function geocodeAddress(address, city, state, zipCode) {
    try {
        const fullAddress = [address, city, state, zipCode].filter(Boolean).join(', ');
        
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}&limit=1`,
            {
                headers: {
                    'User-Agent': 'TheGreekDirectory/1.0'
                }
            }
        );
        
        const data = await response.json();
        
        if (data && data.length > 0) {
            return {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon)
            };
        }
        
        return null;
    } catch (error) {
        console.error('Geocoding error:', error);
        return null;
    }
}

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
This source code is proprietary and no part may not be used, reproduced, or distributed 
without written permission from The Greek Directory. Unauthorized use, copying, modification, 
or distribution of this code will result in legal action to the fullest extent permitted by law.
*/

async function saveListing() {
    try {
        const businessName = document.getElementById('editBusinessName').value.trim();
        const tagline = document.getElementById('editTagline').value.trim();
        
        if (!businessName) {
            alert('Business name is required');
            return;
        }
        
        if (!tagline) {
            alert('Tagline is required');
            return;
        }
        
        if (selectedSubcategories.length === 0) {
            alert('At least one subcategory is required');
            return;
        }
        
        const isChain = document.getElementById('editIsChain').checked;
        const chainName = document.getElementById('editChainName').value.trim();
        
        if (isChain && !chainName) {
            alert('Chain name is required for chain listings');
            return;
        }
        
        const photosText = document.getElementById('editPhotos').value;
        const photos = photosText ? photosText.split('\n').map(url => url.trim()).filter(url => url) : [];
        
        let chainId = document.getElementById('editChainId')?.value.trim();
        if (isChain && !chainId) {
            chainId = `chain-${chainName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;
        }
        
        const phoneContainer = document.getElementById('editPhoneContainer');
        const phone = getPhoneValue(phoneContainer);
        
        let slug = document.getElementById('editSlug').value.trim();
        if (!slug) {
            slug = businessName.toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '');
        }
        
        const address = document.getElementById('editAddress').value.trim() || null;
        const city = document.getElementById('editCity').value.trim() || null;
        const state = document.getElementById('editState').value || null;
        const zipCode = document.getElementById('editZipCode').value.trim() || null;
        
        /*
        Copyright (C) The Greek Directory, 2025-present. All rights reserved.
        This source code is proprietary and no part may not be used, reproduced, or distributed 
        without written permission from The Greek Directory. Unauthorized use, copying, modification, 
        or distribution of this code will result in legal action to the fullest extent permitted by law.
        */
        
        // AUTO-GEOCODING
        let coordinates = null;
        if (address && city && state) {
            console.log('🌍 Auto-geocoding address...');
            coordinates = await geocodeAddress(address, city, state, zipCode);
            if (coordinates) {
                console.log('✅ Coordinates found:', coordinates);
            } else {
                console.log('⚠️ Could not geocode address');
            }
        }
        
        const listingData = {
            business_name: businessName,
            slug: slug,
            tagline: tagline,
            description: document.getElementById('editDescription').value.trim(),
            category: document.getElementById('editCategory').value,
            subcategories: selectedSubcategories,
            primary_subcategory: primarySubcategory,
            tier: document.getElementById('editTier').value,
            verified: document.getElementById('editTier').value !== 'FREE',
            is_chain: isChain,
            chain_name: isChain ? chainName : null,
            chain_id: isChain ? chainId : null,
            address: address,
            city: city,
            state: state,
            zip_code: zipCode,
            country: document.getElementById('editCountry').value || 'USA',
            coordinates: coordinates,
            phone: phone,
            email: document.getElementById('editEmail').value.trim() || null,
            website: document.getElementById('editWebsite').value.trim() || null,
            logo: document.getElementById('editLogo').value.trim() || null,
            photos: photos,
            video: document.getElementById('editVideo').value.trim() || null,
            visible: editingListing?.visible !== false,
            hours: {
                monday: document.getElementById('editHoursMonday').value.trim() || null,
                tuesday: document.getElementById('editHoursTuesday').value.trim() || null,
                wednesday: document.getElementById('editHoursWednesday').value.trim() || null,
                thursday: document.getElementById('editHoursThursday').value.trim() || null,
                friday: document.getElementById('editHoursFriday').value.trim() || null,
                saturday: document.getElementById('editHoursSaturday').value.trim() || null,
                sunday: document.getElementById('editHoursSunday').value.trim() || null
            },
            social_media: {
                facebook: document.getElementById('editFacebook').value.trim() || null,
                instagram: document.getElementById('editInstagram').value.trim() || null,
                twitter: document.getElementById('editTwitter').value.trim() || null,
                youtube: document.getElementById('editYoutube').value.trim() || null,
                tiktok: document.getElementById('editTiktok').value.trim() || null,
                linkedin: document.getElementById('editLinkedin').value.trim() || null,
                other1: document.getElementById('editSocialOther1').value.trim() || null,
                other2: document.getElementById('editSocialOther2').value.trim() || null,
                other3: document.getElementById('editSocialOther3').value.trim() || null
            },
            reviews: {
                google: document.getElementById('editGoogleReviews').value.trim() || null,
                yelp: document.getElementById('editYelp').value.trim() || null,
                tripadvisor: document.getElementById('editTripadvisor').value.trim() || null,
                other1: document.getElementById('editReviewOther1').value.trim() || null,
                other2: document.getElementById('editReviewOther2').value.trim() || null,
                other3: document.getElementById('editReviewOther3').value.trim() || null
            }
        };
        
        /*
        Copyright (C) The Greek Directory, 2025-present. All rights reserved.
        This source code is proprietary and no part may not be used, reproduced, or distributed 
        without written permission from The Greek Directory. Unauthorized use, copying, modification, 
        or distribution of this code will result in legal action to the fullest extent permitted by law.
        */
        
        let savedListing;
        const isExisting = editingListing && editingListing.id && allListings.find(l => l.id === editingListing.id);
        
        if (isExisting) {
            const { data, error } = await adminSupabase
                .from('listings')
                .update(listingData)
                .eq('id', editingListing.id)
                .select()
                .single();
            
            if (error) throw error;
            savedListing = data;
        } else {
            const { data, error } = await adminSupabase
                .from('listings')
                .insert(listingData)
                .select()
                .single();
            
            if (error) throw error;
            savedListing = data;
        }
        
        await saveOwnerInfo(savedListing.id);
        
        document.getElementById('editModal').classList.add('hidden');
        await loadListings();
        
        console.log('🔨 Auto-generating listing page...');
        await generateListingPage(savedListing.id);
        
        /*
        Copyright (C) The Greek Directory, 2025-present. All rights reserved.
        This source code is proprietary and no part may not be used, reproduced, or distributed 
        without written permission from The Greek Directory. Unauthorized use, copying, modification, 
        or distribution of this code will result in legal action to the fullest extent permitted by law.
        */
        
        // UPDATE SITEMAP
        console.log('🗺️ Updating sitemap...');
        await updateSitemap();
        console.log('✅ Sitemap updated successfully!');
        
        alert('✅ Listing saved and sitemap updated!');
        
    } catch (error) {
        console.error('Error saving listing:', error);
        alert('Failed to save listing: ' + error.message);
    }
}

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
This source code is proprietary and no part may not be used, reproduced, or distributed 
without written permission from The Greek Directory. Unauthorized use, copying, modification, 
or distribution of this code will result in legal action to the fullest extent permitted by law.
*/

async function saveOwnerInfo(listingId) {
    const ownerPhoneContainer = document.getElementById('editOwnerPhoneContainer');
    const ownerPhone = getPhoneValue(ownerPhoneContainer);
    
    const ownerData = {
        listing_id: listingId,
        full_name: document.getElementById('editOwnerName').value.trim() || null,
        title: document.getElementById('editOwnerTitle').value.trim() || null,
        from_greece: document.getElementById('editOwnerGreece').value.trim() || null,
        owner_email: document.getElementById('editOwnerEmail').value.trim() || null,
        owner_phone: ownerPhone,
        confirmation_key: document.getElementById('editConfirmationKey').value.trim() || null
    };
    
    const { data: existing } = await adminSupabase
        .from('business_owners')
        .select('*')
        .eq('listing_id', listingId)
        .maybeSingle();
    
    if (existing) {
        const updates = { ...ownerData };
        
        if (existing.owner_user_id) {
            delete updates.confirmation_key;
        }
        
        const { error } = await adminSupabase
            .from('business_owners')
            .update(updates)
            .eq('listing_id', listingId);
        
        if (error) throw error;
        
    } else {
        if (!ownerData.confirmation_key) {
            const words = [
                'alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta', 'eta', 'theta',
                'iota', 'kappa', 'lambda', 'sigma', 'omega', 'phoenix', 'apollo',
                'athena', 'zeus', 'hera', 'poseidon', 'demeter', 'ares', 'hermes'
            ];
            const word1 = words[Math.floor(Math.random() * words.length)];
            const word2 = words[Math.floor(Math.random() * words.length)];
            const word3 = words[Math.floor(Math.random() * words.length)];
            ownerData.confirmation_key = `${word1}-${word2}-${word3}`;
        }
        
        const { error } = await adminSupabase
            .from('business_owners')
            .insert(ownerData);
        
        if (error) throw error;
    }
}

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
This source code is proprietary and no part may not be used, reproduced, or distributed 
without written permission from The Greek Directory. Unauthorized use, copying, modification, 
or distribution of this code will result in legal action to the fullest extent permitted by law.
*/

window.saveListing = saveListing;

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
This source code is proprietary and no part may not be used, reproduced, or distributed 
without written permission from The Greek Directory. Unauthorized use, copying, modification, 
or distribution of this code will result in legal action to the fullest extent permitted by law.
*/
// admin.js Part 8 - Delete Listing & Magic Link Functions

window.sendMagicLink = async function(listingId) {
    try {
        const { data: listing, error: listingError } = await adminSupabase
            .from('listings')
            .select(`
                business_name,
                owner:business_owners(owner_email, owner_user_id)
            `)
            .eq('id', listingId)
            .single();
        
        if (listingError) throw listingError;
        
        const owner = listing.owner && listing.owner.length > 0 ? listing.owner[0] : null;
        if (!owner || !owner.owner_email || !owner.owner_user_id) {
            alert('No claimed owner email found for this listing');
            return;
        }
        
        const confirmText = prompt(`Send magic link to ${owner.owner_email}?\n\nType "CONFIRM" to proceed.`);
        
        if (confirmText !== 'CONFIRM') {
            return;
        }
        
        const { error } = await adminSupabase.auth.signInWithOtp({
            email: owner.owner_email,
            options: {
                emailRedirectTo: `${window.location.origin}/business.html`
            }
        });
        
        if (error) throw error;
        
        alert(`Magic link sent successfully to ${owner.owner_email}`);
        
    } catch (error) {
        console.error('Error sending magic link:', error);
        alert('Failed to send magic link: ' + error.message);
    }
};

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
This source code is proprietary and no part may not be used, reproduced, or distributed 
without written permission from The Greek Directory. Unauthorized use, copying, modification, 
or distribution of this code will result in legal action to the fullest extent permitted by law.
*/

window.deleteListing = async function(listingId) {
    const listing = allListings.find(l => l.id === listingId);
    if (!listing) return;
    
    const confirmText = prompt(`Are you sure you want to DELETE "${listing.business_name}"?\n\nThis action CANNOT be undone.\n\nType "DELETE" to confirm.`);
    
    if (confirmText !== 'DELETE') {
        return;
    }
    
    try {
        const { error: ownerError } = await adminSupabase
            .from('business_owners')
            .delete()
            .eq('listing_id', listingId);
        
        if (ownerError) console.error('Error deleting owner:', ownerError);
        
        const { error } = await adminSupabase
            .from('listings')
            .delete()
            .eq('id', listingId);
        
        if (error) throw error;
        
        alert('✅ Listing deleted successfully');
        await loadListings();
        
    } catch (error) {
        console.error('Error deleting listing:', error);
        alert('Failed to delete listing: ' + error.message);
    }
};

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
This source code is proprietary and no part may not be used, reproduced, or distributed 
without written permission from The Greek Directory. Unauthorized use, copying, modification, 
or distribution of this code will result in legal action to the fullest extent permitted by law.
*/

window.editListing = editListing;
window.newListing = newListing;
window.deleteListing = deleteListing;
window.sendMagicLink = sendMagicLink;

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
This source code is proprietary and no part may not be used, reproduced, or distributed 
without written permission from The Greek Directory. Unauthorized use, copying, modification, 
or distribution of this code will result in legal action to the fullest extent permitted by law.
*/
// admin.js Part 9 - Page Generation Helper Functions

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
This source code is proprietary and no part may not be used, reproduced, or distributed 
without written permission from The Greek Directory. Unauthorized use, copying, modification, 
or distribution of this code will result in legal action to the fullest extent permitted by law.
*/

function generateHoursSchema(listing) {
    if (!listing.hours || Object.keys(listing.hours).length === 0) {
        return '[]';
    }
    
    const dayMap = {
        'monday': 'Monday',
        'tuesday': 'Tuesday',
        'wednesday': 'Wednesday',
        'thursday': 'Thursday',
        'friday': 'Friday',
        'saturday': 'Saturday',
        'sunday': 'Sunday'
    };
    
    const schemaHours = [];
    
    Object.entries(listing.hours).forEach(([day, hours]) => {
        if (hours && hours.toLowerCase() !== 'closed') {
            const match = hours.match(/(\d{1,2}):?(\d{2})?\s*(AM|PM)?\s*-\s*(\d{1,2}):?(\d{2})?\s*(AM|PM)?/i);
            if (match) {
                schemaHours.push({
                    "@type": "OpeningHoursSpecification",
                    "dayOfWeek": dayMap[day],
                    "opens": match[1] + (match[2] || ':00') + (match[3] || ''),
                    "closes": match[4] + (match[5] || ':00') + (match[6] || '')
                });
            }
        }
    });
    
    return JSON.stringify(schemaHours);
}

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
This source code is proprietary and no part may not be used, reproduced, or distributed 
without written permission from The Greek Directory. Unauthorized use, copying, modification, 
or distribution of this code will result in legal action to the fullest extent permitted by law.
*/

function generateSocialMediaSection(listing) {
    const socialMedia = listing.social_media || {};
    const hasSocial = Object.values(socialMedia).some(v => v);
    
    if (!hasSocial) return '';
    
    let socialIcons = '';
    
    const socialSVGs = {
        facebook: '<svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>',
        instagram: '<svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>',
        twitter: '<svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
        youtube: '<svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>',
        tiktok: '<svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>',
        linkedin: '<svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>'
    };
    
    if (socialMedia.facebook) {
        socialIcons += `<a href="https://facebook.com/${socialMedia.facebook}" target="_blank" rel="noopener noreferrer" class="social-icon social-facebook">${socialSVGs.facebook}</a>`;
    }
    if (socialMedia.instagram) {
        socialIcons += `<a href="https://instagram.com/${socialMedia.instagram}" target="_blank" rel="noopener noreferrer" class="social-icon social-instagram">${socialSVGs.instagram}</a>`;
    }
    if (socialMedia.twitter) {
        socialIcons += `<a href="https://twitter.com/${socialMedia.twitter}" target="_blank" rel="noopener noreferrer" class="social-icon social-twitter">${socialSVGs.twitter}</a>`;
    }
    if (socialMedia.youtube) {
        socialIcons += `<a href="https://youtube.com/@${socialMedia.youtube}" target="_blank" rel="noopener noreferrer" class="social-icon social-youtube">${socialSVGs.youtube}</a>`;
    }
    if (socialMedia.tiktok) {
        socialIcons += `<a href="https://tiktok.com/@${socialMedia.tiktok}" target="_blank" rel="noopener noreferrer" class="social-icon social-tiktok">${socialSVGs.tiktok}</a>`;
    }
    if (socialMedia.linkedin) {
        socialIcons += `<a href="${socialMedia.linkedin}" target="_blank" rel="noopener noreferrer" class="social-icon social-linkedin">${socialSVGs.linkedin}</a>`;
    }
    
    // Handle "other" social media links
    if (socialMedia.other1) {
        socialIcons += `<a href="${socialMedia.other1}" target="_blank" rel="noopener noreferrer" class="social-icon social-other"><svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 22C6.486 22 2 17.514 2 12S6.486 2 12 2s10 4.486 10 10-4.486 10-10 10zm1-11h4v2h-4v4h-2v-4H7v-2h4V7h2v4z"/></svg></a>`;
    }
    if (socialMedia.other2) {
        socialIcons += `<a href="${socialMedia.other2}" target="_blank" rel="noopener noreferrer" class="social-icon social-other"><svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 22C6.486 22 2 17.514 2 12S6.486 2 12 2s10 4.486 10 10-4.486 10-10 10zm1-11h4v2h-4v4h-2v-4H7v-2h4V7h2v4z"/></svg></a>`;
    }
    if (socialMedia.other3) {
        socialIcons += `<a href="${socialMedia.other3}" target="_blank" rel="noopener noreferrer" class="social-icon social-other"><svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 22C6.486 22 2 17.514 2 12S6.486 2 12 2s10 4.486 10 10-4.486 10-10 10zm1-11h4v2h-4v4h-2v-4H7v-2h4V7h2v4z"/></svg></a>`;
    }
    
    if (!socialIcons) return '';
    
    return `
        <div>
            <h2 class="text-xl font-bold text-gray-900 mb-3">Social Media</h2>
            <div class="flex flex-wrap gap-2">
                ${socialIcons}
            </div>
        </div>
    `;
}

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
This source code is proprietary and no part may not be used, reproduced, or distributed 
without written permission from The Greek Directory. Unauthorized use, copying, modification, 
or distribution of this code will result in legal action to the fullest extent permitted by law.
*/

function generateReviewSection(listing) {
    const reviews = listing.reviews || {};
    const hasReviews = Object.values(reviews).some(v => v);
    
    if (!hasReviews) return '';
    
    let reviewLinks = '';
    
    const googleSVG = '<svg width="22" height="22" viewBox="0 0 256 262" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid"><path d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027" fill="#4285F4"/><path d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1" fill="#34A853"/><path d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782" fill="#FBBC05"/><path d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251" fill="#EB4335"/></svg>';
    
    const yelpSVG = '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 1000 385" fill="none"><path d="M806.495 227.151L822.764 223.392C823.106 223.313 823.671 223.183 824.361 222.96C828.85 221.753 832.697 218.849 835.091 214.862C837.485 210.874 838.241 206.113 837.198 201.582C837.175 201.482 837.153 201.388 837.13 201.289C836.596 199.117 835.66 197.065 834.37 195.239C832.547 192.926 830.291 190.991 827.728 189.542C824.711 187.82 821.553 186.358 818.289 185.171L800.452 178.659C790.441 174.937 780.432 171.309 770.328 167.771C763.776 165.439 758.224 163.393 753.4 161.901C752.49 161.62 751.485 161.34 750.669 161.058C744.837 159.271 740.739 158.53 737.272 158.505C734.956 158.42 732.649 158.841 730.511 159.738C728.283 160.699 726.282 162.119 724.639 163.906C723.822 164.835 723.054 165.806 722.337 166.815C721.665 167.843 721.049 168.907 720.491 170.001C719.876 171.174 719.348 172.391 718.911 173.642C715.6 183.428 713.951 193.7 714.032 204.029C714.091 213.368 714.342 225.354 719.475 233.479C720.712 235.564 722.372 237.366 724.348 238.769C728.004 241.294 731.7 241.627 735.544 241.904C741.289 242.316 746.855 240.905 752.403 239.623L806.45 227.135L806.495 227.151Z" fill="#FF1A1A"/></svg>';
    
    const tripadvisorSVG = '<svg width="22" height="22" viewBox="0 0 256 191" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid"><path d="M128.023 95.364c.18-.003 21.732-.043 41.012 10.96 10.505 5.996 18.636 14.103 24.156 24.095 3.808 6.895 6.255 14.181 7.28 21.691.96 7.02.559 13.946-1.193 20.593-3.504 13.289-11.443 24.806-23.631 34.29a84.124 84.124 0 0 1-15.377 9.274c-11.309 5.282-23.201 7.819-35.39 7.555-12.066-.26-23.573-3.333-34.24-9.142a83.773 83.773 0 0 1-14.84-9.588c-11.893-9.397-19.793-20.743-23.5-33.746-1.85-6.495-2.387-13.163-1.6-19.924a84.124 84.124 0 0 1 7.28-21.691c5.52-9.992 13.65-18.099 24.156-24.095 19.278-11.003 40.83-10.963 41.012-10.96l4.875-.313z" fill="#34E0A1"/></svg>';
    
    if (reviews.google) {
        reviewLinks += `<a href="${reviews.google}" target="_blank" rel="noopener noreferrer" class="social-icon social-google">${googleSVG}</a>`;
    }
    if (reviews.yelp) {
        reviewLinks += `<a href="${reviews.yelp}" target="_blank" rel="noopener noreferrer" class="social-icon social-yelp">${yelpSVG}</a>`;
    }
    if (reviews.tripadvisor) {
        reviewLinks += `<a href="${reviews.tripadvisor}" target="_blank" rel="noopener noreferrer" class="social-icon social-tripadvisor">${tripadvisorSVG}</a>`;
    }
    
    // Handle "other" review links
    if (reviews.other1) {
        reviewLinks += `<a href="${reviews.other1}" target="_blank" rel="noopener noreferrer" class="social-icon social-other"><svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg></a>`;
    }
    if (reviews.other2) {
        reviewLinks += `<a href="${reviews.other2}" target="_blank" rel="noopener noreferrer" class="social-icon social-other"><svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg></a>`;
    }
    if (reviews.other3) {
        reviewLinks += `<a href="${reviews.other3}" target="_blank" rel="noopener noreferrer" class="social-icon social-other"><svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg></a>`;
    }
    
    if (!reviewLinks) return '';
    
    return `
        <div>
            <h2 class="text-xl font-bold text-gray-900 mb-3">Reviews</h2>
            <div class="flex flex-wrap gap-2">
                ${reviewLinks}
            </div>
        </div>
    `;
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
// ADMIN PORTAL - PART 10
// CSV Upload Functions (Complete)
// ============================================

window.handleCSVUpload = async function(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    console.log('📁 Processing CSV file:', file.name);
    
    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const text = e.target.result;
            const rows = text.split('\n').map(row => row.trim()).filter(row => row);
            
            if (rows.length < 2) {
                alert('CSV file is empty or invalid');
                return;
            }
            
            const headers = rows[0].split(',').map(h => h.trim().replace(/"/g, ''));
            console.log('📋 CSV Headers:', headers);
            
            const listings = [];
            
            for (let i = 1; i < rows.length; i++) {
                const values = rows[i].split(',').map(v => v.trim().replace(/"/g, ''));
                
                if (values.length < headers.length) {
                    console.warn(`⚠️ Row ${i + 1} has fewer columns than headers, skipping`);
                    continue;
                }
                
                const listing = {};
                headers.forEach((header, index) => {
                    listing[header] = values[index] || '';
                });
                
                listings.push(listing);
            }
            
            console.log(`✅ Parsed ${listings.length} listings from CSV`);
            
            if (!confirm(`Upload ${listings.length} listings to database?\n\nThis will create new listings for all entries in the CSV.`)) {
                return;
            }
            
            await uploadListingsFromCSV(listings);
            
        } catch (error) {
            console.error('Error parsing CSV:', error);
            alert('Failed to parse CSV: ' + error.message);
        }
    };
    
    reader.readAsText(file);
    event.target.value = '';
};

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
*/

async function uploadListingsFromCSV(listings) {
    let successful = 0;
    let failed = 0;
    const failedListings = [];
    
    console.log('📤 Starting bulk upload...');
    
    for (const csvListing of listings) {
        try {
            const businessName = csvListing.business_name || csvListing.BusinessName || csvListing['Business Name'];
            
            if (!businessName) {
                console.warn('⚠️ Skipping row without business name');
                failed++;
                continue;
            }
            
            const slug = (csvListing.slug || businessName.toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, ''));
            
            const category = csvListing.category || csvListing.Category || CATEGORIES[0];
            
            const subcategoriesStr = csvListing.subcategories || csvListing.Subcategories || '';
            const subcategories = subcategoriesStr ? subcategoriesStr.split('|').map(s => s.trim()).filter(s => s) : [];
            
            const photosStr = csvListing.photos || csvListing.Photos || '';
            const photos = photosStr ? photosStr.split('|').map(p => p.trim()).filter(p => p) : [];
            
            let coordinates = null;
            const coordsStr = csvListing.coordinates || csvListing.Coordinates || '';
            if (coordsStr) {
                const [lat, lng] = coordsStr.split(',').map(c => parseFloat(c.trim()));
                if (!isNaN(lat) && !isNaN(lng)) {
                    coordinates = { lat, lng };
                }
            }
            
            /*
            Copyright (C) The Greek Directory, 2025-present. All rights reserved.
            */
            
            const listingData = {
                business_name: businessName,
                slug: slug,
                tagline: csvListing.tagline || csvListing.Tagline || '',
                description: csvListing.description || csvListing.Description || '',
                category: category,
                subcategories: subcategories,
                primary_subcategory: subcategories.length > 0 ? subcategories[0] : null,
                tier: csvListing.tier || csvListing.Tier || 'FREE',
                verified: (csvListing.tier || csvListing.Tier || 'FREE') !== 'FREE',
                visible: csvListing.visible === 'false' ? false : true,
                is_chain: csvListing.is_chain === 'true',
                is_claimed: csvListing.is_claimed === 'true',
                chain_name: csvListing.chain_name || csvListing.ChainName || null,
                chain_id: csvListing.chain_id || csvListing.ChainID || null,
                address: csvListing.address || csvListing.Address || null,
                city: csvListing.city || csvListing.City || null,
                state: csvListing.state || csvListing.State || null,
                zip_code: csvListing.zip_code || csvListing.ZipCode || csvListing['Zip Code'] || null,
                country: csvListing.country || csvListing.Country || 'USA',
                coordinates: coordinates,
                phone: csvListing.phone || csvListing.Phone || null,
                email: csvListing.email || csvListing.Email || null,
                website: csvListing.website || csvListing.Website || null,
                logo: csvListing.logo || csvListing.Logo || null,
                photos: photos,
                video: csvListing.video || csvListing.Video || null,
                hours: parseHours(csvListing),
                social_media: parseSocialMedia(csvListing),
                reviews: parseReviews(csvListing)
            };
            
            /*
            Copyright (C) The Greek Directory, 2025-present. All rights reserved.
            */
            
            const { data, error } = await adminSupabase
                .from('listings')
                .insert(listingData)
                .select()
                .single();
            
            if (error) throw error;
            
            // Create analytics entry
            await adminSupabase
                .from('analytics')
                .insert({
                    listing_id: data.id,
                    views: 0,
                    call_clicks: 0,
                    website_clicks: 0,
                    direction_clicks: 0,
                    share_clicks: 0,
                    video_plays: 0,
                    last_viewed: new Date().toISOString()
                });
            
            const ownerData = {
                listing_id: data.id,
                full_name: csvListing.owner_name || csvListing.OwnerName || csvListing['Owner Name'] || null,
                title: csvListing.owner_title || csvListing.OwnerTitle || csvListing['Owner Title'] || null,
                from_greece: csvListing.from_greece || csvListing.FromGreece || csvListing['From Greece'] || null,
                owner_email: csvListing.owner_email || csvListing.OwnerEmail || csvListing['Owner Email'] || null,
                owner_phone: csvListing.owner_phone || csvListing.OwnerPhone || csvListing['Owner Phone'] || null,
                confirmation_key: csvListing.confirmation_key || null,
                email_visible: false,
                phone_visible: false
            };
            
            if (!listingData.is_claimed && !ownerData.confirmation_key) {
                const words = [
                    'alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta', 'eta', 'theta',
                    'iota', 'kappa', 'lambda', 'sigma', 'omega', 'phoenix', 'apollo'
                ];
                const word1 = words[Math.floor(Math.random() * words.length)];
                const word2 = words[Math.floor(Math.random() * words.length)];
                const word3 = words[Math.floor(Math.random() * words.length)];
                ownerData.confirmation_key = `${word1}-${word2}-${word3}`;
            }
            
            if (listingData.is_claimed) {
                ownerData.confirmation_key = null;
            }
            
            const { error: ownerError } = await adminSupabase
                .from('business_owners')
                .insert(ownerData);
            
            if (ownerError) {
                console.warn('⚠️ Failed to create owner record for', businessName, ownerError);
            }
            
            successful++;
            console.log(`✅ Uploaded: ${businessName}`);
            
            await new Promise(resolve => setTimeout(resolve, 500));
            
        } catch (error) {
            console.error(`❌ Failed to upload:`, error);
            failed++;
            failedListings.push(csvListing.business_name || 'Unknown');
        }
    }
    
    console.log('📊 Upload Summary:');
    console.log(`   ✅ Successful: ${successful}`);
    console.log(`   ❌ Failed: ${failed}`);
    
    await loadListings();
    
    alert(`CSV Upload complete!\n\nSuccessful: ${successful}\nFailed: ${failed}${failedListings.length > 0 ? '\n\nFailed listings:\n' + failedListings.join('\n') : ''}`);
}

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
*/

function parseHours(csvListing) {
    const hours = {};
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    days.forEach(day => {
        const value = csvListing[`hours_${day}`] || csvListing[`Hours${day.charAt(0).toUpperCase() + day.slice(1)}`] || null;
        if (value) {
            hours[day] = value;
        }
    });
    
    return Object.keys(hours).length > 0 ? hours : null;
}

function parseSocialMedia(csvListing) {
    return {
        facebook: csvListing.facebook || csvListing.Facebook || null,
        instagram: csvListing.instagram || csvListing.Instagram || null,
        twitter: csvListing.twitter || csvListing.Twitter || null,
        youtube: csvListing.youtube || csvListing.YouTube || null,
        tiktok: csvListing.tiktok || csvListing.TikTok || null,
        linkedin: csvListing.linkedin || csvListing.LinkedIn || null,
        other1_name: csvListing.other_social_1_name || csvListing.OtherSocial1Name || null,
        other1: csvListing.other_social_1 || csvListing.OtherSocial1 || null,
        other2_name: csvListing.other_social_2_name || csvListing.OtherSocial2Name || null,
        other2: csvListing.other_social_2 || csvListing.OtherSocial2 || null,
        other3_name: csvListing.other_social_3_name || csvListing.OtherSocial3Name || null,
        other3: csvListing.other_social_3 || csvListing.OtherSocial3 || null
    };
}

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
*/

function parseReviews(csvListing) {
    return {
        google: csvListing.google_reviews || csvListing.GoogleReviews || null,
        yelp: csvListing.yelp || csvListing.Yelp || null,
        tripadvisor: csvListing.tripadvisor || csvListing.TripAdvisor || null,
        other1_name: csvListing.other_review_1_name || csvListing.OtherReview1Name || null,
        other1: csvListing.other_review_1 || csvListing.OtherReview1 || null,
        other2_name: csvListing.other_review_2_name || csvListing.OtherReview2Name || null,
        other2: csvListing.other_review_2 || csvListing.OtherReview2 || null,
        other3_name: csvListing.other_review_3_name || csvListing.OtherReview3Name || null,
        other3: csvListing.other_review_3 || csvListing.OtherReview3 || null
    };
}

// Bind to button click
document.addEventListener('DOMContentLoaded', () => {
    const generateAllBtn = document.getElementById('generateAllBtn');
    if (generateAllBtn) {
        generateAllBtn.addEventListener('click', generateAllListingPages);
    }
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
// ADMIN PORTAL - PART 11 (FINAL)
// Additional Utility Functions & Event Handlers
// ============================================

// Initialize event listeners on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('Admin portal event listeners initialized');
    
    // Close analytics modal on outside click
    document.addEventListener('click', (e) => {
        const analyticsModal = document.getElementById('analyticsModal');
        if (analyticsModal && e.target === analyticsModal) {
            closeAnalyticsModal();
        }
    });
    
    // Close edit modal on outside click
    document.addEventListener('click', (e) => {
        const editModal = document.getElementById('editModal');
        if (editModal && e.target === editModal) {
            if (confirm('Discard changes?')) {
                editModal.classList.add('hidden');
            }
        }
    });
    
    // Handle escape key to close modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const analyticsModal = document.getElementById('analyticsModal');
            const editModal = document.getElementById('editModal');
            
            if (analyticsModal && !analyticsModal.classList.contains('hidden')) {
                closeAnalyticsModal();
            } else if (editModal && !editModal.classList.contains('hidden')) {
                if (confirm('Discard changes?')) {
                    editModal.classList.add('hidden');
                }
            }
        }
    });
});

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
*/

// Format date for display
function formatDate(dateString) {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    // Less than 1 minute
    if (diff < 60000) {
        return 'Just now';
    }
    
    // Less than 1 hour
    if (diff < 3600000) {
        const minutes = Math.floor(diff / 60000);
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    }
    
    // Less than 24 hours
    if (diff < 86400000) {
        const hours = Math.floor(diff / 3600000);
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }
    
    // Less than 7 days
    if (diff < 604800000) {
        const days = Math.floor(diff / 86400000);
        return `${days} day${days > 1 ? 's' : ''} ago`;
    }
    
    // Format as date
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
*/

// Export listings to CSV
window.exportListingsToCSV = function() {
    if (!allListings || allListings.length === 0) {
        alert('No listings to export');
        return;
    }
    
    const headers = [
        'ID', 'Business Name', 'Slug', 'Tagline', 'Description',
        'Category', 'Subcategories', 'Primary Subcategory',
        'Tier', 'Verified', 'Visible', 'Is Chain', 'Is Claimed',
        'Chain Name', 'Chain ID',
        'Address', 'City', 'State', 'Zip Code', 'Country',
        'Coordinates', 'Phone', 'Email', 'Website',
        'Logo', 'Photos', 'Video',
        'Hours Monday', 'Hours Tuesday', 'Hours Wednesday', 'Hours Thursday',
        'Hours Friday', 'Hours Saturday', 'Hours Sunday',
        'Facebook', 'Instagram', 'Twitter', 'YouTube', 'TikTok', 'LinkedIn',
        'Other Social 1 Name', 'Other Social 1', 'Other Social 2 Name', 'Other Social 2',
        'Other Social 3 Name', 'Other Social 3',
        'Google Reviews', 'Yelp', 'TripAdvisor',
        'Other Review 1 Name', 'Other Review 1', 'Other Review 2 Name', 'Other Review 2',
        'Other Review 3 Name', 'Other Review 3',
        'Owner Name', 'Owner Title', 'Owner Email', 'Owner Phone',
        'From Greece', 'Confirmation Key',
        'Created At', 'Updated At'
    ];
    
    /*
    Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    */
    
    let csv = headers.join(',') + '\n';
    
    allListings.forEach(listing => {
        const owner = listing.owner && listing.owner.length > 0 ? listing.owner[0] : {};
        
        const row = [
            listing.id,
            `"${(listing.business_name || '').replace(/"/g, '""')}"`,
            listing.slug || '',
            `"${(listing.tagline || '').replace(/"/g, '""')}"`,
            `"${(listing.description || '').replace(/"/g, '""')}"`,
            listing.category || '',
            `"${(listing.subcategories || []).join('|')}"`,
            listing.primary_subcategory || '',
            listing.tier || 'FREE',
            listing.verified ? 'true' : 'false',
            listing.visible ? 'true' : 'false',
            listing.is_chain ? 'true' : 'false',
            listing.is_claimed ? 'true' : 'false',
            listing.chain_name || '',
            listing.chain_id || '',
            listing.address || '',
            listing.city || '',
            listing.state || '',
            listing.zip_code || '',
            listing.country || 'USA',
            listing.coordinates ? `"${listing.coordinates.lat},${listing.coordinates.lng}"` : '',
            listing.phone || '',
            listing.email || '',
            listing.website || '',
            listing.logo || '',
            `"${(listing.photos || []).join('|')}"`,
            listing.video || '',
            (listing.hours?.monday || '').replace(/"/g, '""'),
            (listing.hours?.tuesday || '').replace(/"/g, '""'),
            (listing.hours?.wednesday || '').replace(/"/g, '""'),
            (listing.hours?.thursday || '').replace(/"/g, '""'),
            (listing.hours?.friday || '').replace(/"/g, '""'),
            (listing.hours?.saturday || '').replace(/"/g, '""'),
            (listing.hours?.sunday || '').replace(/"/g, '""'),
            listing.social_media?.facebook || '',
            listing.social_media?.instagram || '',
            listing.social_media?.twitter || '',
            listing.social_media?.youtube || '',
            listing.social_media?.tiktok || '',
            listing.social_media?.linkedin || '',
            listing.social_media?.other1_name || '',
            listing.social_media?.other1 || '',
            listing.social_media?.other2_name || '',
            listing.social_media?.other2 || '',
            listing.social_media?.other3_name || '',
            listing.social_media?.other3 || '',
            listing.reviews?.google || '',
            listing.reviews?.yelp || '',
            listing.reviews?.tripadvisor || '',
            listing.reviews?.other1_name || '',
            listing.reviews?.other1 || '',
            listing.reviews?.other2_name || '',
            listing.reviews?.other2 || '',
            listing.reviews?.other3_name || '',
            listing.reviews?.other3 || '',
            owner.full_name || '',
            owner.title || '',
            owner.owner_email || '',
            owner.owner_phone || '',
            owner.from_greece || '',
            owner.confirmation_key || '',
            listing.created_at || '',
            listing.updated_at || ''
        ];
        
        csv += row.join(',') + '\n';
    });
    
    /*
    Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    */
    
    // Create download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `listings-export-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log(`✅ Exported ${allListings.length} listings to CSV`);
};

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
*/

// Bulk update listings
window.bulkUpdateListings = async function() {
    const selectedIds = Array.from(document.querySelectorAll('.listing-checkbox:checked'))
        .map(cb => cb.dataset.listingId);
    
    if (selectedIds.length === 0) {
        alert('No listings selected');
        return;
    }
    
    const action = prompt(`Update ${selectedIds.length} listings:\n\n1. Change tier\n2. Toggle visibility\n3. Toggle verified\n\nEnter number (1-3):`);
    
    if (!action) return;
    
    try {
        let updates = {};
        
        switch (action) {
            case '1':
                const tier = prompt('Enter tier (FREE, VERIFIED, FEATURED, PREMIUM):')?.toUpperCase();
                if (!['FREE', 'VERIFIED', 'FEATURED', 'PREMIUM'].includes(tier)) {
                    alert('Invalid tier');
                    return;
                }
                updates.tier = tier;
                updates.verified = tier !== 'FREE';
                break;
                
            case '2':
                const visible = confirm('Make visible? (Cancel = hide)');
                updates.visible = visible;
                break;
                
            case '3':
                const verified = confirm('Make verified? (Cancel = unverify)');
                updates.verified = verified;
                break;
                
            default:
                alert('Invalid action');
                return;
        }
        
        if (!confirm(`Apply changes to ${selectedIds.length} listings?`)) {
            return;
        }
        
        /*
        Copyright (C) The Greek Directory, 2025-present. All rights reserved.
        */
        
        let successful = 0;
        let failed = 0;
        
        for (const id of selectedIds) {
            try {
                const { error } = await adminSupabase
                    .from('listings')
                    .update(updates)
                    .eq('id', id);
                
                if (error) throw error;
                successful++;
            } catch (error) {
                console.error('Error updating listing', id, error);
                failed++;
            }
        }
        
        alert(`Bulk update complete!\n\nSuccessful: ${successful}\nFailed: ${failed}`);
        await loadListings();
        
    } catch (error) {
        console.error('Bulk update error:', error);
        alert('Failed to update listings: ' + error.message);
    }
};

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
*/

// Add export button to admin dashboard
function addExportButton() {
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn && !document.getElementById('exportBtn')) {
        const exportBtn = document.createElement('button');
        exportBtn.id = 'exportBtn';
        exportBtn.className = 'px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700';
        exportBtn.textContent = '📥 Export CSV';
        exportBtn.onclick = exportListingsToCSV;
        
        refreshBtn.parentNode.insertBefore(exportBtn, refreshBtn.nextSibling);
    }
}

// Add export button when dashboard loads
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.addedNodes.length) {
            const dashboardPage = document.getElementById('dashboardPage');
            if (dashboardPage && !dashboardPage.classList.contains('hidden')) {
                addExportButton();
            }
        }
    });
});

if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
}

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
*/

// Console helper functions
window.adminHelpers = {
    // Quick stats
    stats: function() {
        if (!allListings || allListings.length === 0) {
            console.log('No listings loaded');
            return;
        }
        
        const total = allListings.length;
        const visible = allListings.filter(l => l.visible).length;
        const verified = allListings.filter(l => l.verified).length;
        const claimed = allListings.filter(l => l.is_claimed).length;
        
        const tiers = {
            FREE: allListings.filter(l => l.tier === 'FREE').length,
            VERIFIED: allListings.filter(l => l.tier === 'VERIFIED').length,
            FEATURED: allListings.filter(l => l.tier === 'FEATURED').length,
            PREMIUM: allListings.filter(l => l.tier === 'PREMIUM').length
        };
        
        console.log('📊 Listings Statistics:');
        console.log(`Total: ${total}`);
        console.log(`Visible: ${visible} (${Math.round(visible/total*100)}%)`);
        console.log(`Verified: ${verified} (${Math.round(verified/total*100)}%)`);
        console.log(`Claimed: ${claimed} (${Math.round(claimed/total*100)}%)`);
        console.log('\nTier Distribution:');
        console.log(`FREE: ${tiers.FREE}`);
        console.log(`VERIFIED: ${tiers.VERIFIED}`);
        console.log(`FEATURED: ${tiers.FEATURED}`);
        console.log(`PREMIUM: ${tiers.PREMIUM}`);
    },
    
    /*
    Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    */
    
    // Find listings by criteria
    find: function(criteria) {
        if (!allListings || allListings.length === 0) {
            console.log('No listings loaded');
            return [];
        }
        
        const results = allListings.filter(listing => {
            for (const key in criteria) {
                if (typeof criteria[key] === 'string') {
                    if (!listing[key] || !listing[key].toLowerCase().includes(criteria[key].toLowerCase())) {
                        return false;
                    }
                } else {
                    if (listing[key] !== criteria[key]) {
                        return false;
                    }
                }
            }
            return true;
        });
        
        console.log(`Found ${results.length} listing(s)`);
        return results;
    },
    
    // Export helpers
    export: exportListingsToCSV
};

console.log('💡 Admin helpers available: window.adminHelpers.stats(), .find(), .export()');

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
// ADMIN PORTAL - PART 12 (CONTINUATION)
// Template Replacements - Social & Review Sections
// ============================================

function generateSocialMediaSection(listing) {
    const socialMedia = listing.social_media || {};
    const hasSocial = Object.values(socialMedia).some(v => v);
    
    if (!hasSocial) return '';
    
    let socialIcons = '';
    
    const socialSVGs = {
        facebook: '<svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>',
        instagram: '<svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>',
        twitter: '<svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
        youtube: '<svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>',
        tiktok: '<svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>',
        linkedin: '<svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>'
    };
    
    /*
    Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    */
    
    if (socialMedia.facebook) {
        socialIcons += `<a href="https://facebook.com/${socialMedia.facebook}" target="_blank" rel="noopener noreferrer" class="social-icon social-facebook" title="Facebook">${socialSVGs.facebook}</a>`;
    }
    if (socialMedia.instagram) {
        socialIcons += `<a href="https://instagram.com/${socialMedia.instagram}" target="_blank" rel="noopener noreferrer" class="social-icon social-instagram" title="Instagram">${socialSVGs.instagram}</a>`;
    }
    if (socialMedia.twitter) {
        socialIcons += `<a href="https://twitter.com/${socialMedia.twitter}" target="_blank" rel="noopener noreferrer" class="social-icon social-twitter" title="X (Twitter)">${socialSVGs.twitter}</a>`;
    }
    if (socialMedia.youtube) {
        socialIcons += `<a href="https://youtube.com/@${socialMedia.youtube}" target="_blank" rel="noopener noreferrer" class="social-icon social-youtube" title="YouTube">${socialSVGs.youtube}</a>`;
    }
    if (socialMedia.tiktok) {
        socialIcons += `<a href="https://tiktok.com/@${socialMedia.tiktok}" target="_blank" rel="noopener noreferrer" class="social-icon social-tiktok" title="TikTok">${socialSVGs.tiktok}</a>`;
    }
    if (socialMedia.linkedin) {
        socialIcons += `<a href="${socialMedia.linkedin}" target="_blank" rel="noopener noreferrer" class="social-icon social-linkedin" title="LinkedIn">${socialSVGs.linkedin}</a>`;
    }
    
    // Other social links
    if (socialMedia.other1 && socialMedia.other1_name) {
        socialIcons += `<a href="${socialMedia.other1}" target="_blank" rel="noopener noreferrer" class="social-icon social-other" title="${escapeHtml(socialMedia.other1_name)}">🔗</a>`;
    }
    if (socialMedia.other2 && socialMedia.other2_name) {
        socialIcons += `<a href="${socialMedia.other2}" target="_blank" rel="noopener noreferrer" class="social-icon social-other" title="${escapeHtml(socialMedia.other2_name)}">🔗</a>`;
    }
    if (socialMedia.other3 && socialMedia.other3_name) {
        socialIcons += `<a href="${socialMedia.other3}" target="_blank" rel="noopener noreferrer" class="social-icon social-other" title="${escapeHtml(socialMedia.other3_name)}">🔗</a>`;
    }
    
    if (!socialIcons) return '';
    
    return `
        <div>
            <h2 class="text-xl font-bold text-gray-900 mb-3">Social Media</h2>
            <div class="flex flex-wrap gap-2">
                ${socialIcons}
            </div>
        </div>
    `;
}

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
*/

function generateReviewSection(listing) {
    const reviews = listing.reviews || {};
    const hasReviews = Object.values(reviews).some(v => v);
    
    if (!hasReviews) return '';
    
    let reviewLinks = '';
    
    const googleSVG = '<svg width="22" height="22" viewBox="0 0 256 262" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid"><path d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027" fill="#4285F4"/><path d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1" fill="#34A853"/><path d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782" fill="#FBBC05"/><path d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251" fill="#EB4335"/></svg>';
    
    const yelpSVG = '<svg width="22" height="22" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg"><path d="M219.307 134.643l-49.387 15.446c-4.376 1.376-9.042-.554-10.764-4.693l-11.803-28.428c-1.722-4.14.227-8.87 4.351-10.554l49.386-20.184c4.124-1.684 8.827.294 10.505 4.433l11.065 27.289c1.677 4.138-.229 8.87-3.353 16.691zm-83.265-26.303l16.548-47.606c1.468-4.226 6.015-6.538 10.166-5.161l28.022 9.264c4.15 1.377 6.54 5.838 5.337 9.958l-18.074 61.853c-1.204 4.12-5.542 6.555-9.693 5.441l-27.872-7.485c-4.151-1.113-6.382-5.382-4.434-9.455l.000-16.809zm-43.085 100.493c-4.272 1.161-8.778-1.149-10.064-5.152l-8.67-26.968c-1.287-4.003.821-8.317 4.708-9.634l58.474-19.823c3.887-1.317 8.123 1.029 9.454 5.24l8.937 28.302c1.331 4.21-.766 8.708-4.685 10.041l-58.154 18.994z" fill="#D32323"/></svg>';
    
    const tripadvisorSVG = '<svg width="22" height="22" viewBox="0 0 256 191" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid"><path d="M128.023 95.364c.18-.003 21.732-.043 41.012 10.96 10.505 5.996 18.636 14.103 24.156 24.095 3.808 6.895 6.255 14.181 7.28 21.691.96 7.02.559 13.946-1.193 20.593-3.504 13.289-11.443 24.806-23.631 34.29a84.124 84.124 0 0 1-15.377 9.274c-11.309 5.282-23.201 7.819-35.39 7.555-12.066-.26-23.573-3.333-34.24-9.142a83.773 83.773 0 0 1-14.84-9.588c-11.893-9.397-19.793-20.743-23.5-33.746-1.85-6.495-2.387-13.163-1.6-19.924a84.124 84.124 0 0 1 7.28-21.691c5.52-9.992 13.65-18.099 24.156-24.095 19.278-11.003 40.83-10.963 41.012-10.96l4.875-.313z" fill="#34E0A1"/></svg>';
    
    /*
    Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    */
    
    if (reviews.google) {
        reviewLinks += `<a href="${reviews.google}" target="_blank" rel="noopener noreferrer" class="social-icon social-google" title="Google Reviews">${googleSVG}</a>`;
    }
    if (reviews.yelp) {
        reviewLinks += `<a href="${reviews.yelp}" target="_blank" rel="noopener noreferrer" class="social-icon social-yelp" title="Yelp">${yelpSVG}</a>`;
    }
    if (reviews.tripadvisor) {
        reviewLinks += `<a href="${reviews.tripadvisor}" target="_blank" rel="noopener noreferrer" class="social-icon social-tripadvisor" title="TripAdvisor">${tripadvisorSVG}</a>`;
    }
    
    // Other review links
    if (reviews.other1 && reviews.other1_name) {
        reviewLinks += `<a href="${reviews.other1}" target="_blank" rel="noopener noreferrer" class="social-icon social-other" title="${escapeHtml(reviews.other1_name)}">⭐</a>`;
    }
    if (reviews.other2 && reviews.other2_name) {
        reviewLinks += `<a href="${reviews.other2}" target="_blank" rel="noopener noreferrer" class="social-icon social-other" title="${escapeHtml(reviews.other2_name)}">⭐</a>`;
    }
    if (reviews.other3 && reviews.other3_name) {
        reviewLinks += `<a href="${reviews.other3}" target="_blank" rel="noopener noreferrer" class="social-icon social-other" title="${escapeHtml(reviews.other3_name)}">⭐</a>`;
    }
    
    if (!reviewLinks) return '';
    
    return `
        <div>
            <h2 class="text-xl font-bold text-gray-900 mb-3">Reviews</h2>
            <div class="flex flex-wrap gap-2">
                ${reviewLinks}
            </div>
        </div>
    `;
}

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
*/

// Generate other links section (for custom links that aren't social or reviews)
function generateOtherLinksSection(listing) {
    // This function can be extended in the future if needed
    // Currently just returns empty string as other links are handled in social/reviews
    return '';
}

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
This source code is proprietary and no part may not be used, reproduced, or distributed 
without written permission from The Greek Directory. Unauthorized use, copying, modification, 
or distribution of this code will result in legal action to the fullest extent permitted by law.
*/
