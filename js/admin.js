// js/admin.js - PART 1
// Copyright (C) The Greek Directory, 2025-present. All rights reserved. This source code is proprietary and no part may not be used, reproduced, or distributed without written permission from The Greek Directory. Unauthorized use, copying, modification, or distribution of this code will result in legal action to the fullest extent permitted by law. For more information, visit https://thegreekdirectory.org/legal.

// ============================================
// ADMIN PORTAL - PART 1
// Configuration & State Management
// ============================================

const SUPABASE_URL = 'https://luetekzqrrgdxtopzvqw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1ZXRla3pxcnJnZHh0b3B6dnF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNDc2NDcsImV4cCI6MjA4MzkyMzY0N30.TIrNG8VGumEJc_9JvNHW-Q-UWfUGpPxR0v8POjWZJYg';
const CLOUDFLARE_IMAGES_ACCOUNT_ID = window.CLOUDFLARE_IMAGES_ACCOUNT_ID || '';
const CLOUDFLARE_IMAGES_TOKEN = window.CLDFLR_STRIMG_KEY || window.CLOUDFLARE_IMAGES_TOKEN || '';

const CTA_ICON_SVGS = {
    link: '<svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M10.59 13.41a1 1 0 001.41 0l4.24-4.24a3 3 0 10-4.24-4.24l-1.41 1.41a1 1 0 11-1.41-1.41l1.41-1.41a5 5 0 017.07 7.07l-4.24 4.24a3 3 0 01-4.24 0 1 1 0 010-1.41z"/><path d="M13.41 10.59a1 1 0 010 1.41l-4.24 4.24a3 3 0 11-4.24-4.24l1.41-1.41a1 1 0 011.41 1.41l-1.41 1.41a1 1 0 004.24 4.24l4.24-4.24a1 1 0 011.41 0z"/></svg>',
    bolt: '<svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z"/></svg>',
    calendar: '<svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M7 2a1 1 0 011 1v1h8V3a1 1 0 112 0v1h1a2 2 0 012 2v3H2V6a2 2 0 012-2h1V3a1 1 0 011-1zm14 9v9a2 2 0 01-2 2H5a2 2 0 01-2-2v-9h18z"/></svg>',
    phone: '<svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M6.62 10.79a15.534 15.534 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V20a1 1 0 01-1 1C10.85 21 3 13.15 3 3a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.46.57 3.59a1 1 0 01-.24 1.01l-2.2 2.19z"/></svg>',
    cart: '<svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M7 4H5L2 11v2h2.4l1.6 7h12l1.6-7H22v-2l-3-7h-2l2 7H5l2-7zm1 16a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zm7.5-1.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z"/></svg>',
    star: '<svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>'
};

// Copyright (C) The Greek Directory, 2025-present. All rights reserved.

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

const COUNTRY_CODES = {
    'USA': '+1',
    'Greece': '+30',
    'Canada': '+1',
    'UK': '+44',
    'Cyprus': '+357',
    'Australia': '+61'
};

// Copyright (C) The Greek Directory, 2025-present. All rights reserved.

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

// Copyright (C) The Greek Directory, 2025-present. All rights reserved.

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

// Copyright (C) The Greek Directory, 2025-present. All rights reserved.

async function detectUserCountry() {
    try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        if (data.country_code === 'US') {
            userCountry = 'USA';
        } else if (data.country_code === 'GR') {
            userCountry = 'Greece';
        } else if (data.country_code === 'CA') {
            userCountry = 'Canada';
        } else if (data.country_code === 'GB') {
            userCountry = 'UK';
        } else if (data.country_code === 'CY') {
            userCountry = 'Cyprus';
        } else if (data.country_code === 'AU') {
            userCountry = 'Australia';
        }
    } catch (error) {
        console.log('Could not detect country, defaulting to USA');
        userCountry = 'USA';
    }
}

// Copyright (C) The Greek Directory, 2025-present. All rights reserved.

function setupEventListeners() {
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', handleAdminLogin);
    }
    
    document.getElementById('logoutBtn')?.addEventListener('click', logout);
    document.getElementById('newListingBtn')?.addEventListener('click', newListing);
    document.getElementById('refreshBtn')?.addEventListener('click', loadListings);
    document.getElementById('adminSearch')?.addEventListener('input', renderTable);
    document.getElementById('saveEdit')?.addEventListener('click', saveListing);
    document.getElementById('generateAllBtn')?.addEventListener('click', generateAllListingPages);
    document.getElementById('csvUpload')?.addEventListener('change', handleCSVUpload);
    document.getElementById('cancelEdit')?.addEventListener('click', () => {
        if (confirm('Discard changes?')) {
            document.getElementById('editModal').classList.add('hidden');
        }
    });
    document.getElementById('closeModal')?.addEventListener('click', () => {
        if (confirm('Discard changes?')) {
            document.getElementById('editModal').classList.add('hidden');
        }
    });
    document.getElementById('closeAnalyticsModal')?.addEventListener('click', () => {
        if (typeof closeAnalyticsModal === 'function') {
            closeAnalyticsModal();
        }
    });
    document.getElementById('analyticsModal')?.addEventListener('click', (event) => {
        if (event.target && event.target.id === 'analyticsModal') {
            if (typeof closeAnalyticsModal === 'function') {
                closeAnalyticsModal();
            }
        }
    });
}

// Copyright (C) The Greek Directory, 2025-present. All rights reserved. This source code is proprietary and no part may not be used, reproduced, or distributed without written permission from The Greek Directory. Unauthorized use, copying, modification, or distribution of this code will result in legal action to the fullest extent permitted by law. For more information, visit https://thegreekdirectory.org/legal.
// js/admin.js - PART 2
// Copyright (C) The Greek Directory, 2025-present. All rights reserved. This source code is proprietary and no part may not be used, reproduced, or distributed without written permission from The Greek Directory. Unauthorized use, copying, modification, or distribution of this code will result in legal action to the fullest extent permitted by law. For more information, visit https://thegreekdirectory.org/legal.

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

// Copyright (C) The Greek Directory, 2025-present. All rights reserved.

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

// Copyright (C) The Greek Directory, 2025-present. All rights reserved.

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

// Copyright (C) The Greek Directory, 2025-present. All rights reserved.

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

// Copyright (C) The Greek Directory, 2025-present. All rights reserved.

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

// Copyright (C) The Greek Directory, 2025-present. All rights reserved.

window.handleAdminLogin = handleAdminLogin;
window.logout = logout;

// Copyright (C) The Greek Directory, 2025-present. All rights reserved. This source code is proprietary and no part may not be used, reproduced, or distributed without written permission from The Greek Directory. Unauthorized use, copying, modification, or distribution of this code will result in legal action to the fullest extent permitted by law. For more information, visit https://thegreekdirectory.org/legal.
// js/admin.js - PART 3
// Copyright (C) The Greek Directory, 2025-present. All rights reserved. This source code is proprietary and no part may not be used, reproduced, or distributed without written permission from The Greek Directory. Unauthorized use, copying, modification, or distribution of this code will result in legal action to the fullest extent permitted by law. For more information, visit https://thegreekdirectory.org/legal.

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

// Copyright (C) The Greek Directory, 2025-present. All rights reserved.

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
        const listingUrl = `/listing/${l.slug}`;
        const tier = l.tier || 'FREE';
        const tierColors = {
            FREE: 'bg-gray-100 text-gray-700',
            VERIFIED: 'bg-blue-100 text-blue-700',
            FEATURED: 'bg-yellow-100 text-yellow-700',
            PREMIUM: 'bg-purple-100 text-purple-700'
        };
        
        const ownerInfo = l.owner && l.owner.length > 0 ? l.owner[0] : null;
        const isClaimed = l.is_claimed === true;
        
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
        
        // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
        
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

// Copyright (C) The Greek Directory, 2025-present. All rights reserved.

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

// Copyright (C) The Greek Directory, 2025-present. All rights reserved. This source code is proprietary and no part may not be used, reproduced, or distributed without written permission from The Greek Directory. Unauthorized use, copying, modification, or distribution of this code will result in legal action to the fullest extent permitted by law. For more information, visit https://thegreekdirectory.org/legal.
// js/admin.js - PART 4 (FIXED)
// Copyright (C) The Greek Directory, 2025-present. All rights reserved.

// ============================================
// ADMIN PORTAL - PART 4
// Analytics Modal & Viewing
// ============================================

window.viewAnalytics = async function(listingId) {
    console.log('📊 viewAnalytics called for listing:', listingId);
    
    const listing = allListings.find(l => l.id === listingId);
    if (!listing) {
        console.error('Listing not found:', listingId);
        alert('Listing not found');
        return;
    }
    
    console.log('Found listing:', listing.business_name);
    
    try {
        console.log('Fetching analytics data...');
        
        // Fetch analytics data from Supabase
        const { data: analyticsData, error } = await adminSupabase
            .from('listing_analytics')
            .select('*')
            .eq('listing_id', listingId)
            .order('timestamp', { ascending: false });
        
        if (error) {
            console.error('Analytics fetch error:', error);
            throw error;
        }
        
        console.log('Analytics data fetched:', analyticsData?.length || 0, 'events');
        
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
        
        console.log('Aggregated analytics:', analytics);
        
        // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
        
        const modal = document.getElementById('analyticsModal');
        const modalTitle = document.getElementById('analyticsModalTitle');
        const modalContent = document.getElementById('analyticsContent');

        if (modalTitle) {
            modalTitle.textContent = `Analytics: ${listing.business_name}`;
        }
        if (modalContent) {
            modalContent.innerHTML = generateAnalyticsContent(listing, analytics, analytics.detailedViews, analytics.sharePlatforms);
        }

        if (modal) {
            modal.classList.remove('hidden');
        }
        console.log('✅ Analytics modal displayed');
        
    } catch (error) {
        console.error('Error loading analytics:', error);
        alert('Failed to load analytics: ' + error.message);
    }
};

// Copyright (C) The Greek Directory, 2025-present. All rights reserved.

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
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    // Share platforms breakdown
    if (Object.keys(sharePlatforms).length > 0) {
        content += `
            <div class="mb-6">
                <h3 class="text-lg font-bold text-gray-900 mb-3">Share Platform Breakdown</h3>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        `;
        
        const platformNames = {
            'facebook': '📘 Facebook',
            'twitter': '🐦 Twitter/X',
            'linkedin': '💼 LinkedIn',
            'sms': '💬 SMS',
            'email': '📧 Email',
            'native': '📱 Native Share'
        };
        
        Object.entries(sharePlatforms).forEach(([platform, count]) => {
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
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
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
                <div class="text-gray-600">No analytics data available yet</div>
                <div class="text-sm text-gray-500 mt-2">Visit the listing page to generate some activity</div>
            </div>
        `;
    }
    
    return content;
}

// Copyright (C) The Greek Directory, 2025-present. All rights reserved.

window.closeAnalyticsModal = function() {
    const modal = document.getElementById('analyticsModal');
    if (modal) {
        modal.classList.add('hidden');
    }
};

// Copyright (C) The Greek Directory, 2025-present. All rights reserved.

// Copyright (C) The Greek Directory, 2025-present. All rights reserved. This source code is proprietary and no part may not be used, reproduced, or distributed without written permission from The Greek Directory. Unauthorized use, copying, modification, or distribution of this code will result in legal action to the fullest extent permitted by law. For more information, visit https://thegreekdirectory.org/legal.
// js/admin.js - PART 5
// Copyright (C) The Greek Directory, 2025-present. All rights reserved. This source code is proprietary and no part may not be used, reproduced, or distributed without written permission from The Greek Directory. Unauthorized use, copying, modification, or distribution of this code will result in legal action to the fullest extent permitted by law. For more information, visit https://thegreekdirectory.org/legal.

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

// Copyright (C) The Greek Directory, 2025-present. All rights reserved.

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

// Copyright (C) The Greek Directory, 2025-present. All rights reserved.

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

// Copyright (C) The Greek Directory, 2025-present. All rights reserved. This source code is proprietary and no part may not be used, reproduced, or distributed without written permission from The Greek Directory. Unauthorized use, copying, modification, or distribution of this code will result in legal action to the fullest extent permitted by law. For more information, visit https://thegreekdirectory.org/legal.
// js/admin.js - PART 6
// Copyright (C) The Greek Directory, 2025-present. All rights reserved. This source code is proprietary and no part may not be used, reproduced, or distributed without written permission from The Greek Directory. Unauthorized use, copying, modification, or distribution of this code will result in legal action to the fullest extent permitted by law. For more information, visit https://thegreekdirectory.org/legal.

// ============================================
// ADMIN PORTAL - PART 6
// Edit Form Continuation (Hours, Social, Reviews, Owner, Media)
// ============================================

function fillEditFormContinuation(listing, owner) {
    const formContent = document.getElementById('editFormContent');
    formContent.innerHTML += `
            <!-- Hours -->
            <div>
                <h3 class="text-lg font-bold mb-4">Hours of Operation</h3>
                <div class="grid grid-cols-1 gap-3">
                    ${['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
                        const dayLower = day.toLowerCase();
                        const hours = listing?.hours && listing.hours[dayLower] ? listing.hours[dayLower] : '';
                        const isClosed = hours.toLowerCase() === 'closed';
                        const is24Hours = hours.toLowerCase().includes('24') || hours.toLowerCase().includes('open 24');
                        
                        return `
                        <div class="flex gap-2 items-center">
                            <label class="w-28 flex items-center font-medium text-gray-700">${day}:</label>
                            <input type="text" id="editHours${day}" value="${hours}" class="flex-1 px-4 py-2 border border-gray-300 rounded-lg" placeholder="9:00 AM - 5:00 PM or 7:00 PM - 3:00 AM" ${isClosed || is24Hours ? 'disabled' : ''}>
                            <label class="flex items-center gap-1">
                                <input type="checkbox" id="editClosed${day}" ${isClosed ? 'checked' : ''} onchange="toggleDayClosed('${day}')">
                                <span class="text-sm">Closed</span>
                            </label>
                            <label class="flex items-center gap-1">
                                <input type="checkbox" id="edit24Hours${day}" ${is24Hours ? 'checked' : ''} onchange="toggle24Hours('${day}')">
                                <span class="text-sm">24 Hours</span>
                            </label>
                        </div>
                    `}).join('')}
                </div>
            </div>

            <!-- Additional Information -->
            <div>
                <h3 class="text-lg font-bold mb-4">Additional Information</h3>
                <p class="text-sm text-gray-500 mb-2">Add extra info fields (Info Name + Info Value) to display on the listing page.</p>
                <div id="additionalInfoFields" class="space-y-2"></div>
                <button type="button" onclick="addAdditionalInfoRow()" class="mt-2 text-sm text-blue-600">+ Add Info Field</button>
            </div>

            <!-- Custom CTA Buttons -->
            <div>
                <h3 class="text-lg font-bold mb-4">Custom CTA Buttons</h3>
                <p class="text-sm text-gray-500 mb-2">Featured listings can add 1 custom CTA. Premium listings can add 2.</p>
                <div id="customCtaFields" class="space-y-2"></div>
                <button type="button" id="addCustomCtaBtn" onclick="addCustomCtaRow()" class="mt-2 text-sm text-blue-600">+ Add CTA Button</button>
            </div>

            <!-- Social Media -->
            <div>
                <h3 class="text-lg font-bold mb-4">Social Media Links</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">Facebook</label>
                        <input type="text" id="editFacebook" value="${listing?.social_media?.facebook || ''}" class="w-full px-4 py-2 border rounded-lg" placeholder="username">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Instagram</label>
                        <input type="text" id="editInstagram" value="${listing?.social_media?.instagram || ''}" class="w-full px-4 py-2 border rounded-lg" placeholder="username">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Twitter/X</label>
                        <input type="text" id="editTwitter" value="${listing?.social_media?.twitter || ''}" class="w-full px-4 py-2 border rounded-lg" placeholder="username">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">YouTube</label>
                        <input type="text" id="editYoutube" value="${listing?.social_media?.youtube || ''}" class="w-full px-4 py-2 border rounded-lg" placeholder="channel">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">TikTok</label>
                        <input type="text" id="editTiktok" value="${listing?.social_media?.tiktok || ''}" class="w-full px-4 py-2 border rounded-lg" placeholder="username">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">LinkedIn</label>
                        <input type="url" id="editLinkedin" value="${listing?.social_media?.linkedin || ''}" class="w-full px-4 py-2 border rounded-lg" placeholder="Full URL">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Other Social 1 Name</label>
                        <input type="text" id="editOtherSocial1Name" value="${listing?.social_media?.other1_name || ''}" class="w-full px-4 py-2 border rounded-lg" placeholder="e.g. Threads">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Other Social 1 URL</label>
                        <input type="url" id="editOtherSocial1" value="${listing?.social_media?.other1 || ''}" class="w-full px-4 py-2 border rounded-lg" placeholder="Full URL">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Other Social 2 Name</label>
                        <input type="text" id="editOtherSocial2Name" value="${listing?.social_media?.other2_name || ''}" class="w-full px-4 py-2 border rounded-lg" placeholder="e.g. Discord">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Other Social 2 URL</label>
                        <input type="url" id="editOtherSocial2" value="${listing?.social_media?.other2 || ''}" class="w-full px-4 py-2 border rounded-lg" placeholder="Full URL">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Other Social 3 Name</label>
                        <input type="text" id="editOtherSocial3Name" value="${listing?.social_media?.other3_name || ''}" class="w-full px-4 py-2 border rounded-lg" placeholder="e.g. Pinterest">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Other Social 3 URL</label>
                        <input type="url" id="editOtherSocial3" value="${listing?.social_media?.other3 || ''}" class="w-full px-4 py-2 border rounded-lg" placeholder="Full URL">
                    </div>
                </div>
            </div>

            <!-- Reviews -->
            <div>
                <h3 class="text-lg font-bold mb-4">Review Sites</h3>
                <div class="grid grid-cols-1 gap-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">Google Reviews</label>
                        <input type="url" id="editGoogleReviews" value="${listing?.reviews?.google || ''}" class="w-full px-4 py-2 border rounded-lg" placeholder="Full Google Reviews URL">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Yelp</label>
                        <input type="url" id="editYelp" value="${listing?.reviews?.yelp || ''}" class="w-full px-4 py-2 border rounded-lg" placeholder="Full Yelp URL">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">TripAdvisor</label>
                        <input type="url" id="editTripadvisor" value="${listing?.reviews?.tripadvisor || ''}" class="w-full px-4 py-2 border rounded-lg" placeholder="Full TripAdvisor URL">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Other Review 1 Name</label>
                        <input type="text" id="editOtherReview1Name" value="${listing?.reviews?.other1_name || ''}" class="w-full px-4 py-2 border rounded-lg" placeholder="e.g. BBB">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Other Review 1 URL</label>
                        <input type="url" id="editOtherReview1" value="${listing?.reviews?.other1 || ''}" class="w-full px-4 py-2 border rounded-lg" placeholder="Full URL">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Other Review 2 Name</label>
                        <input type="text" id="editOtherReview2Name" value="${listing?.reviews?.other2_name || ''}" class="w-full px-4 py-2 border rounded-lg" placeholder="e.g. Angi">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Other Review 2 URL</label>
                        <input type="url" id="editOtherReview2" value="${listing?.reviews?.other2 || ''}" class="w-full px-4 py-2 border rounded-lg" placeholder="Full URL">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Other Review 3 Name</label>
                        <input type="text" id="editOtherReview3Name" value="${listing?.reviews?.other3_name || ''}" class="w-full px-4 py-2 border rounded-lg" placeholder="e.g. OpenTable">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Other Review 3 URL</label>
                        <input type="url" id="editOtherReview3" value="${listing?.reviews?.other3 || ''}" class="w-full px-4 py-2 border rounded-lg" placeholder="Full URL">
                    </div>
                </div>
            </div>

            <!-- Owner Info -->
            <div>
                <h3 class="text-lg font-bold mb-4">Owner Information</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div class="md:col-span-2">
                        <label class="flex items-center gap-2">
                            <input type="checkbox" id="editIsClaimed" ${listing?.is_claimed ? 'checked' : ''} onchange="toggleClaimedFields()">
                            <span class="text-sm font-medium">This listing is claimed</span>
                        </label>
                        <p class="text-xs text-gray-500 mt-1">When checked, confirmation key will be cleared</p>
                    </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">Owner Name</label>
                        <input type="text" id="editOwnerName" value="${owner?.full_name || ''}" class="w-full px-4 py-2 border rounded-lg">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Title</label>
                        <input type="text" id="editOwnerTitle" value="${owner?.title || ''}" class="w-full px-4 py-2 border rounded-lg">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">From Greece</label>
                        <input type="text" id="editOwnerGreece" value="${owner?.from_greece || ''}" class="w-full px-4 py-2 border rounded-lg" placeholder="e.g. Athens">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Owner Email</label>
                        <input type="email" id="editOwnerEmail" value="${owner?.owner_email || ''}" class="w-full px-4 py-2 border rounded-lg">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Owner Phone</label>
                        <div id="editOwnerPhoneContainer"></div>
                    </div>
                    <div id="confirmationKeyField">
                        <label class="block text-sm font-medium mb-2">Confirmation Key</label>
                        <input type="text" id="editConfirmationKey" value="${owner?.confirmation_key || ''}" class="w-full px-4 py-2 border rounded-lg" ${listing?.is_claimed ? 'disabled title="Listing is claimed"' : ''} placeholder="${listing?.is_claimed ? 'Listing is claimed' : 'Auto-generated if empty'}">
                    </div>
                </div>
            </div>

            <!-- Media -->
            <div>
                <h3 class="text-lg font-bold mb-4">Media</h3>
                <div class="grid grid-cols-1 gap-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">Logo URL</label>
                        <input type="url" id="editLogo" value="${listing?.logo || ''}" class="w-full px-4 py-2 border rounded-lg">
                        <div class="flex items-center gap-2 mt-2">
                            <input type="file" id="editLogoFile" accept="image/*" class="flex-1">
                            <button type="button" id="uploadLogoBtn" class="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg">Upload Logo</button>
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Photos (one per line)</label>
                        <textarea id="editPhotos" rows="4" class="w-full px-4 py-2 border rounded-lg">${listing?.photos ? listing.photos.join('\n') : ''}</textarea>
                        <div class="flex items-center gap-2 mt-2">
                            <input type="file" id="editPhotosFiles" accept="image/*" multiple class="flex-1">
                            <button type="button" id="uploadPhotosBtn" class="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg">Upload Photos</button>
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Video URL (YouTube/Vimeo embed)</label>
                        <input type="url" id="editVideo" value="${listing?.video || ''}" class="w-full px-4 py-2 border rounded-lg" placeholder="https://www.youtube.com/embed/...">
                        <div class="flex items-center gap-2 mt-2">
                            <input type="file" id="editVideoFile" accept="video/*" class="flex-1">
                            <button type="button" id="uploadVideoBtn" class="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg">Upload Video</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const ownerPhoneContainer = document.getElementById('editOwnerPhoneContainer');
    if (ownerPhoneContainer) {
        ownerPhoneContainer.innerHTML = createPhoneInput(owner?.owner_phone || '', userCountry);
    }

    updateSubcategoriesForCategory();
    renderAdditionalInfoRows(listing?.additional_info || []);
    renderCustomCtaRows(listing?.custom_ctas || [], listing?.tier || 'FREE');
    setupCloudflareUploadHandlers();

    const tierSelect = document.getElementById('editTier');
    if (tierSelect) {
        tierSelect.addEventListener('change', () => {
            const allowed = getAllowedCustomCtas(tierSelect.value);
            const container = document.getElementById('customCtaFields');
            if (container) {
                while (container.children.length > allowed) {
                    container.lastElementChild.remove();
                }
                updateCustomCtaAddState(allowed, container.children.length, document.getElementById('addCustomCtaBtn'));
            }
        });
    }
}

// Copyright (C) The Greek Directory, 2025-present. All rights reserved.

window.checkSlugAvailability = async function() {
    const slug = document.getElementById('editSlug').value.trim();
    const statusEl = document.getElementById('slugStatus');
    
    if (!slug) {
        statusEl.textContent = 'Enter a slug to check';
        statusEl.className = 'text-xs text-gray-500 mt-1';
        return;
    }
    
    try {
        const { data, error } = await adminSupabase
            .from('listings')
            .select('id')
            .eq('slug', slug)
            .maybeSingle();
        
        if (error) throw error;
        
        if (data && data.id !== editingListing?.id) {
            statusEl.textContent = '❌ Slug already in use';
            statusEl.className = 'text-xs text-red-600 mt-1';
        } else {
            statusEl.textContent = '✅ Slug available';
            statusEl.className = 'text-xs text-green-600 mt-1';
        }
    } catch (error) {
        statusEl.textContent = 'Error checking slug';
        statusEl.className = 'text-xs text-red-600 mt-1';
    }
};

// Copyright (C) The Greek Directory, 2025-present. All rights reserved.

function updateCharCounters() {
    const tagline = document.getElementById('editTagline')?.value || '';
    const desc = document.getElementById('editDescription')?.value || '';
    
    const taglineCount = document.getElementById('taglineCount');
    const descCount = document.getElementById('descCount');
    
    if (taglineCount) taglineCount.textContent = tagline.length;
    if (descCount) descCount.textContent = desc.length;
}

function getAllowedCustomCtas(tier) {
    if (tier === 'PREMIUM') return 2;
    if (tier === 'FEATURED') return 1;
    return 0;
}

function renderAdditionalInfoRows(infoRows = []) {
    const container = document.getElementById('additionalInfoFields');
    if (!container) return;
    const rows = infoRows.length ? infoRows : [];
    container.innerHTML = rows.map((row, index) => `
        <div class="grid grid-cols-1 md:grid-cols-[1fr,1fr,auto] gap-2 items-center">
            <input type="text" class="additional-info-name w-full px-3 py-2 border rounded-lg" placeholder="Info Name" maxlength="30" value="${escapeHtml(row?.name || '')}">
            <input type="text" class="additional-info-value w-full px-3 py-2 border rounded-lg" placeholder="Info Value" maxlength="120" value="${escapeHtml(row?.value || '')}">
            <button type="button" class="text-sm text-red-600" onclick="removeAdditionalInfoRow(${index})">Remove</button>
        </div>
    `).join('');
    container.dataset.count = rows.length;
}

window.addAdditionalInfoRow = function() {
    const container = document.getElementById('additionalInfoFields');
    if (!container) return;
    const newRow = document.createElement('div');
    newRow.className = 'grid grid-cols-1 md:grid-cols-[1fr,1fr,auto] gap-2 items-center';
    newRow.innerHTML = `
        <input type="text" class="additional-info-name w-full px-3 py-2 border rounded-lg" placeholder="Info Name" maxlength="30">
        <input type="text" class="additional-info-value w-full px-3 py-2 border rounded-lg" placeholder="Info Value" maxlength="120">
        <button type="button" class="text-sm text-red-600" onclick="this.closest('div').remove()">Remove</button>
    `;
    container.appendChild(newRow);
};

window.removeAdditionalInfoRow = function(index) {
    const container = document.getElementById('additionalInfoFields');
    if (!container) return;
    const rows = Array.from(container.children);
    if (rows[index]) rows[index].remove();
};

function renderCustomCtaRows(ctas = [], tier = 'FREE') {
    const container = document.getElementById('customCtaFields');
    const addBtn = document.getElementById('addCustomCtaBtn');
    if (!container) return;
    const allowed = getAllowedCustomCtas(tier);
    const rows = (ctas || []).slice(0, allowed);
    container.innerHTML = rows.map((cta, index) => `
        <div class="grid grid-cols-1 md:grid-cols-[1fr,120px,140px,1fr,auto] gap-2 items-center">
            <input type="text" class="cta-name w-full px-3 py-2 border rounded-lg" placeholder="Button Name" maxlength="15" value="${escapeHtml(cta?.name || '')}">
            <input type="color" class="cta-color w-full h-10 border rounded-lg" value="${cta?.color || '#055193'}">
            <select class="cta-icon w-full px-3 py-2 border rounded-lg">
                ${Object.keys(CTA_ICON_SVGS).map(icon => `<option value="${icon}" ${cta?.icon === icon ? 'selected' : ''}>${icon}</option>`).join('')}
            </select>
            <input type="url" class="cta-link w-full px-3 py-2 border rounded-lg" placeholder="https://..." value="${escapeHtml(cta?.link || '')}">
            <button type="button" class="text-sm text-red-600" onclick="removeCustomCtaRow(${index})">Remove</button>
        </div>
    `).join('');
    updateCustomCtaAddState(allowed, rows.length, addBtn);
}

window.addCustomCtaRow = function() {
    const container = document.getElementById('customCtaFields');
    if (!container) return;
    const tier = document.getElementById('editTier')?.value || 'FREE';
    const allowed = getAllowedCustomCtas(tier);
    if (container.children.length >= allowed) return;
    const row = document.createElement('div');
    row.className = 'grid grid-cols-1 md:grid-cols-[1fr,120px,140px,1fr,auto] gap-2 items-center';
    row.innerHTML = `
        <input type="text" class="cta-name w-full px-3 py-2 border rounded-lg" placeholder="Button Name" maxlength="15">
        <input type="color" class="cta-color w-full h-10 border rounded-lg" value="#055193">
        <select class="cta-icon w-full px-3 py-2 border rounded-lg">
            ${Object.keys(CTA_ICON_SVGS).map(icon => `<option value="${icon}">${icon}</option>`).join('')}
        </select>
        <input type="url" class="cta-link w-full px-3 py-2 border rounded-lg" placeholder="https://...">
        <button type="button" class="text-sm text-red-600" onclick="this.closest('div').remove()">Remove</button>
    `;
    container.appendChild(row);
    updateCustomCtaAddState(allowed, container.children.length, document.getElementById('addCustomCtaBtn'));
};

window.removeCustomCtaRow = function(index) {
    const container = document.getElementById('customCtaFields');
    if (!container) return;
    const rows = Array.from(container.children);
    if (rows[index]) rows[index].remove();
    const tier = document.getElementById('editTier')?.value || 'FREE';
    const allowed = getAllowedCustomCtas(tier);
    updateCustomCtaAddState(allowed, container.children.length, document.getElementById('addCustomCtaBtn'));
};

function updateCustomCtaAddState(allowed, count, addBtn) {
    if (!addBtn) return;
    addBtn.disabled = allowed === 0 || count >= allowed;
    addBtn.classList.toggle('opacity-50', addBtn.disabled);
}

async function uploadToCloudflare(file) {
    if (!CLOUDFLARE_IMAGES_ACCOUNT_ID || !CLOUDFLARE_IMAGES_TOKEN) {
        alert('Cloudflare Images is not configured. Set CLOUDFLARE_IMAGES_ACCOUNT_ID and CLDFLR_STRIMG_KEY.');
        return null;
    }
    const formData = new FormData();
    formData.append('file', file);
    formData.append('metadata', JSON.stringify({ uploaded_by: 'admin-portal' }));

    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_IMAGES_ACCOUNT_ID}/images/v1`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${CLOUDFLARE_IMAGES_TOKEN}`
        },
        body: formData
    });

    if (!response.ok) {
        console.error('Cloudflare upload failed', await response.text());
        alert('Cloudflare upload failed.');
        return null;
    }

    const result = await response.json();
    return result?.result?.variants?.[0] || result?.result?.url || null;
}

function setupCloudflareUploadHandlers() {
    const logoInput = document.getElementById('editLogoFile');
    const logoUploadBtn = document.getElementById('uploadLogoBtn');
    const photosInput = document.getElementById('editPhotosFiles');
    const photosUploadBtn = document.getElementById('uploadPhotosBtn');
    const videoInput = document.getElementById('editVideoFile');
    const videoUploadBtn = document.getElementById('uploadVideoBtn');
    const logoField = document.getElementById('editLogo');
    const photosField = document.getElementById('editPhotos');
    const videoField = document.getElementById('editVideo');

    if (logoUploadBtn && logoInput && logoField) {
        logoUploadBtn.onclick = async () => {
            if (!logoInput.files || !logoInput.files[0]) return;
            const url = await uploadToCloudflare(logoInput.files[0]);
            if (url) {
                logoField.value = url;
            }
        };
    }

    if (photosUploadBtn && photosInput && photosField) {
        photosUploadBtn.onclick = async () => {
            const files = Array.from(photosInput.files || []);
            if (!files.length) return;
            const urls = [];
            for (const file of files) {
                const url = await uploadToCloudflare(file);
                if (url) urls.push(url);
            }
            if (urls.length) {
                const existing = photosField.value ? photosField.value.split('\n').map(v => v.trim()).filter(Boolean) : [];
                photosField.value = [...existing, ...urls].join('\n');
            }
        };
    }

    if (videoUploadBtn && videoInput && videoField) {
        videoUploadBtn.onclick = async () => {
            if (!videoInput.files || !videoInput.files[0]) return;
            const url = await uploadToCloudflare(videoInput.files[0]);
            if (url) {
                videoField.value = url;
            }
        };
    }
}

window.updateSubcategoriesForCategory = function() {
    const category = document.getElementById('editCategory')?.value;
    const container = document.getElementById('subcategoriesContainer');
    const checkboxDiv = document.getElementById('subcategoryCheckboxes');
    
    if (!category || !SUBCATEGORIES[category] || SUBCATEGORIES[category].length === 0) {
        container.classList.add('hidden');
        return;
    }
    
    container.classList.remove('hidden');
    checkboxDiv.innerHTML = '';
    
    SUBCATEGORIES[category].forEach(sub => {
        const isSelected = selectedSubcategories.includes(sub);
        const isPrimary = sub === primarySubcategory;
        
        const div = document.createElement('div');
        div.className = 'flex items-center gap-2 p-2 border rounded';
        div.innerHTML = `
            <input type="checkbox" id="subcat-${sub.replace(/\s+/g, '-')}" 
                ${isSelected ? 'checked' : ''} 
                onchange="toggleSubcategory('${sub.replace(/'/g, "\\'")}')">
            <label for="subcat-${sub.replace(/\s+/g, '-')}" class="flex-1 text-sm">${sub}</label>
            <input type="radio" name="primarySub" 
                ${isPrimary ? 'checked' : ''} 
                ${!isSelected ? 'disabled' : ''}
                onchange="setPrimarySubcategory('${sub.replace(/'/g, "\\'")}')"
                title="Primary">
        `;
        checkboxDiv.appendChild(div);
    });
};

// Copyright (C) The Greek Directory, 2025-present. All rights reserved.

window.toggleSubcategory = function(subcategory) {
    const index = selectedSubcategories.indexOf(subcategory);
    
    if (index > -1) {
        selectedSubcategories.splice(index, 1);
        if (primarySubcategory === subcategory) {
            primarySubcategory = selectedSubcategories.length > 0 ? selectedSubcategories[0] : null;
        }
    } else {
        selectedSubcategories.push(subcategory);
        if (!primarySubcategory) {
            primarySubcategory = subcategory;
        }
    }
    
    updateSubcategoriesForCategory();
};

window.setPrimarySubcategory = function(subcategory) {
    primarySubcategory = subcategory;
    updateSubcategoriesForCategory();
};

window.toggleChainFields = function() {
    const isChain = document.getElementById('editIsChain')?.checked;
    const container = document.getElementById('chainFieldsContainer');
    
    if (isChain) {
        container.classList.remove('hidden');
    } else {
        container.classList.add('hidden');
    }
};

// Copyright (C) The Greek Directory, 2025-present. All rights reserved.

window.toggleClaimedFields = function() {
    const isClaimed = document.getElementById('editIsClaimed')?.checked;
    const confirmationKeyInput = document.getElementById('editConfirmationKey');
    
    if (isClaimed) {
        confirmationKeyInput.disabled = true;
        confirmationKeyInput.placeholder = 'Listing is claimed';
        confirmationKeyInput.title = 'Listing is claimed';
    } else {
        confirmationKeyInput.disabled = false;
        confirmationKeyInput.placeholder = 'Auto-generated if empty';
        confirmationKeyInput.title = '';
    }
};

window.toggleDayClosed = function(day) {
    const input = document.getElementById(`editHours${day}`);
    const closedCheckbox = document.getElementById(`editClosed${day}`);
    const hours24Checkbox = document.getElementById(`edit24Hours${day}`);
    
    if (closedCheckbox.checked) {
        input.value = 'Closed';
        input.disabled = true;
        hours24Checkbox.checked = false;
    } else {
        if (input.value.toLowerCase() === 'closed') {
            input.value = '';
        }
        input.disabled = false;
    }
};

// Copyright (C) The Greek Directory, 2025-present. All rights reserved.

window.toggle24Hours = function(day) {
    const input = document.getElementById(`editHours${day}`);
    const closedCheckbox = document.getElementById(`editClosed${day}`);
    const hours24Checkbox = document.getElementById(`edit24Hours${day}`);
    
    if (hours24Checkbox.checked) {
        input.value = 'Open 24 Hours';
        input.disabled = true;
        closedCheckbox.checked = false;
    } else {
        if (input.value.toLowerCase().includes('24') || input.value.toLowerCase().includes('open 24')) {
            input.value = '';
        }
        input.disabled = false;
    }
};

// Copyright (C) The Greek Directory, 2025-present. All rights reserved. This source code is proprietary and no part may not be used, reproduced, or distributed without written permission from The Greek Directory. Unauthorized use, copying, modification, or distribution of this code will result in legal action to the fullest extent permitted by law. For more information, visit https://thegreekdirectory.org/legal.
// js/admin.js - PART 7
// Copyright (C) The Greek Directory, 2025-present. All rights reserved. This source code is proprietary and no part may not be used, reproduced, or distributed without written permission from The Greek Directory. Unauthorized use, copying, modification, or distribution of this code will result in legal action to the fullest extent permitted by law. For more information, visit https://thegreekdirectory.org/legal.

// ============================================
// ADMIN PORTAL - PART 7
// Geocoding & Save Listing Functions
// ============================================

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

// Copyright (C) The Greek Directory, 2025-present. All rights reserved.

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
        
// In saveListing function, replace the slug generation with:

let slug = document.getElementById('editSlug').value.trim();
if (!slug) {
    // Transliterate Greek to Latin
    const greekToLatin = {
        'α': 'a', 'β': 'b', 'γ': 'g', 'δ': 'd', 'ε': 'e', 'ζ': 'z', 'η': 'h', 'θ': 'th',
        'ι': 'i', 'κ': 'k', 'λ': 'l', 'μ': 'm', 'ν': 'n', 'ξ': 'x', 'ο': 'o', 'π': 'p',
        'ρ': 'r', 'σ': 's', 'ς': 's', 'τ': 't', 'υ': 'y', 'φ': 'f', 'χ': 'ch', 'ψ': 'ps', 'ω': 'o',
        'Α': 'a', 'Β': 'b', 'Γ': 'g', 'Δ': 'd', 'Ε': 'e', 'Ζ': 'z', 'Η': 'h', 'Θ': 'th',
        'Ι': 'i', 'Κ': 'k', 'Λ': 'l', 'Μ': 'm', 'Ν': 'n', 'Ξ': 'x', 'Ο': 'o', 'Π': 'p',
        'Ρ': 'r', 'Σ': 's', 'Τ': 't', 'Υ': 'y', 'Φ': 'f', 'Χ': 'ch', 'Ψ': 'ps', 'Ω': 'o'
    };
    
    let transliterated = businessName;
    for (const [greek, latin] of Object.entries(greekToLatin)) {
        transliterated = transliterated.replace(new RegExp(greek, 'g'), latin);
    }
    
    slug = transliterated.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}
        
        const address = document.getElementById('editAddress').value.trim() || null;
        const city = document.getElementById('editCity').value.trim() || null;
        const state = document.getElementById('editState').value || null;
        const zipCode = document.getElementById('editZipCode').value.trim() || null;
        
        // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
        
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
        
        const isClaimed = document.getElementById('editIsClaimed').checked;
        const additionalInfoRows = Array.from(document.querySelectorAll('#additionalInfoFields .grid')).map(row => {
            const name = row.querySelector('.additional-info-name')?.value.trim();
            const value = row.querySelector('.additional-info-value')?.value.trim();
            if (!name || !value) return null;
            return { name: name.slice(0, 30), value: value.slice(0, 120) };
        }).filter(Boolean);

        const tierValue = document.getElementById('editTier').value;
        const allowedCtas = getAllowedCustomCtas(tierValue);
        const customCtas = Array.from(document.querySelectorAll('#customCtaFields .grid')).map(row => {
            const name = row.querySelector('.cta-name')?.value.trim().slice(0, 15);
            const link = row.querySelector('.cta-link')?.value.trim();
            if (!name || !link) return null;
            return {
                name,
                color: row.querySelector('.cta-color')?.value || '#055193',
                icon: row.querySelector('.cta-icon')?.value || 'link',
                link
            };
        }).filter(Boolean).slice(0, allowedCtas);
        
        const listingData = {
            business_name: businessName,
            slug: slug,
            tagline: tagline,
            description: document.getElementById('editDescription').value.trim(),
            category: document.getElementById('editCategory').value,
            subcategories: selectedSubcategories,
            primary_subcategory: primarySubcategory,
            tier: tierValue,
            verified: tierValue !== 'FREE',
            is_chain: isChain,
            is_claimed: isClaimed,
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
            additional_info: additionalInfoRows,
            custom_ctas: customCtas,
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
                other1_name: document.getElementById('editOtherSocial1Name').value.trim() || null,
                other1: document.getElementById('editOtherSocial1').value.trim() || null,
                other2_name: document.getElementById('editOtherSocial2Name').value.trim() || null,
                other2: document.getElementById('editOtherSocial2').value.trim() || null,
                other3_name: document.getElementById('editOtherSocial3Name').value.trim() || null,
                other3: document.getElementById('editOtherSocial3').value.trim() || null
            },
            reviews: {
                google: document.getElementById('editGoogleReviews').value.trim() || null,
                yelp: document.getElementById('editYelp').value.trim() || null,
                tripadvisor: document.getElementById('editTripadvisor').value.trim() || null,
                other1_name: document.getElementById('editOtherReview1Name').value.trim() || null,
                other1: document.getElementById('editOtherReview1').value.trim() || null,
                other2_name: document.getElementById('editOtherReview2Name').value.trim() || null,
                other2: document.getElementById('editOtherReview2').value.trim() || null,
                other3_name: document.getElementById('editOtherReview3Name').value.trim() || null,
                other3: document.getElementById('editOtherReview3').value.trim() || null
            }
        };
        
        // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
        
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
        
        await saveOwnerInfo(savedListing.id, isClaimed);
        
        document.getElementById('editModal').classList.add('hidden');
        await loadListings();
        
        console.log('🔨 Auto-generating listing page...');
        await generateListingPage(savedListing.id);
        
        // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
        
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

// Copyright (C) The Greek Directory, 2025-present. All rights reserved.

async function saveOwnerInfo(listingId, isClaimed) {
    const ownerPhoneContainer = document.getElementById('editOwnerPhoneContainer');
    const ownerPhone = getPhoneValue(ownerPhoneContainer);
    
    const ownerData = {
        listing_id: listingId,
        full_name: document.getElementById('editOwnerName').value.trim() || null,
        title: document.getElementById('editOwnerTitle').value.trim() || null,
        from_greece: document.getElementById('editOwnerGreece').value.trim() || null,
        owner_email: document.getElementById('editOwnerEmail').value.trim() || null,
        owner_phone: ownerPhone,
        confirmation_key: isClaimed ? null : (document.getElementById('editConfirmationKey').value.trim() || null)
    };
    
    const { data: existing } = await adminSupabase
        .from('business_owners')
        .select('*')
        .eq('listing_id', listingId)
        .maybeSingle();
    
    if (existing) {
        const updates = { ...ownerData };
        
        // If claimed, clear confirmation key
        if (isClaimed) {
            updates.confirmation_key = null;
        }
        
        const { error } = await adminSupabase
            .from('business_owners')
            .update(updates)
            .eq('listing_id', listingId);
        
        if (error) throw error;
        
    } else {
        // Generate confirmation key if not claimed and not provided
        if (!isClaimed && !ownerData.confirmation_key) {
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

// Copyright (C) The Greek Directory, 2025-present. All rights reserved.

window.saveListing = saveListing;

// Copyright (C) The Greek Directory, 2025-present. All rights reserved. This source code is proprietary and no part may not be used, reproduced, or distributed without written permission from The Greek Directory. Unauthorized use, copying, modification, or distribution of this code will result in legal action to the fullest extent permitted by law. For more information, visit https://thegreekdirectory.org/legal.
// js/admin.js - PART 8
// Copyright (C) The Greek Directory, 2025-present. All rights reserved. This source code is proprietary and no part may not be used, reproduced, or distributed without written permission from The Greek Directory. Unauthorized use, copying, modification, or distribution of this code will result in legal action to the fullest extent permitted by law. For more information, visit https://thegreekdirectory.org/legal.

// ============================================
// ADMIN PORTAL - PART 8
// Delete Listing & Magic Link Functions
// ============================================

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

// Copyright (C) The Greek Directory, 2025-present. All rights reserved.

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

// Copyright (C) The Greek Directory, 2025-present. All rights reserved.

window.editListing = editListing;
window.newListing = newListing;
window.deleteListing = deleteListing;
window.sendMagicLink = sendMagicLink;

// Copyright (C) The Greek Directory, 2025-present. All rights reserved. This source code is proprietary and no part may not be used, reproduced, or distributed without written permission from The Greek Directory. Unauthorized use, copying, modification, or distribution of this code will result in legal action to the fullest extent permitted by law. For more information, visit https://thegreekdirectory.org/legal.
// js/admin.js - PART 9
// Copyright (C) The Greek Directory, 2025-present. All rights reserved. This source code is proprietary and no part may not be used, reproduced, or distributed without written permission from The Greek Directory. Unauthorized use, copying, modification, or distribution of this code will result in legal action to the fullest extent permitted by law. For more information, visit https://thegreekdirectory.org/legal.

// ============================================
// ADMIN PORTAL - PART 9
// Page Generation Helper Functions
// ============================================

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Copyright (C) The Greek Directory, 2025-present. All rights reserved.

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

// Copyright (C) The Greek Directory, 2025-present. All rights reserved.

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
        linkedin: '<svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>',
        other: '<svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm0 22c-5.514 0-10-4.486-10-10s4.486-10 10-10 10 4.486 10 10-4.486 10-10 10zm1-11h-2v-6h2v6zm0 4h-2v-2h2v2z"/></svg>'
    };
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    if (socialMedia.facebook) {
        socialIcons += `<a href="https://facebook.com/${socialMedia.facebook}" target="_blank" rel="noopener noreferrer" class="social-icon social-facebook" title="Facebook">${socialSVGs.facebook}</a>`;
    }
    if (socialMedia.instagram) {
        socialIcons += `<a href="https://instagram.com/${socialMedia.instagram}" target="_blank" rel="noopener noreferrer" class="social-icon social-instagram" title="Instagram">${socialSVGs.instagram}</a>`;
    }
    if (socialMedia.twitter) {
        socialIcons += `<a href="https://twitter.com/${socialMedia.twitter}" target="_blank" rel="noopener noreferrer" class="social-icon social-twitter" title="Twitter/X">${socialSVGs.twitter}</a>`;
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
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    // Other social links (1-3)
    if (socialMedia.other1 && socialMedia.other1_name) {
        socialIcons += `<a href="${socialMedia.other1}" target="_blank" rel="noopener noreferrer" class="social-icon social-other" title="${escapeHtml(socialMedia.other1_name)}">${socialSVGs.other}</a>`;
    }
    if (socialMedia.other2 && socialMedia.other2_name) {
        socialIcons += `<a href="${socialMedia.other2}" target="_blank" rel="noopener noreferrer" class="social-icon social-other" title="${escapeHtml(socialMedia.other2_name)}">${socialSVGs.other}</a>`;
    }
    if (socialMedia.other3 && socialMedia.other3_name) {
        socialIcons += `<a href="${socialMedia.other3}" target="_blank" rel="noopener noreferrer" class="social-icon social-other" title="${escapeHtml(socialMedia.other3_name)}">${socialSVGs.other}</a>`;
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

// Copyright (C) The Greek Directory, 2025-present. All rights reserved.

function generateReviewSection(listing) {
    const reviews = listing.reviews || {};
    const hasReviews = Object.values(reviews).some(v => v);
    
    if (!hasReviews) return '';
    
    let reviewLinks = '';
    
    const googleSVG = '<svg width="22" height="22" viewBox="0 0 256 262" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid"><path d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027" fill="#4285F4"/><path d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1" fill="#34A853"/><path d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782" fill="#FBBC05"/><path d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251" fill="#EB4335"/></svg>';
    
    const yelpSVG = '<img class="review-icon" src="https://static.thegreekdirectory.org/img/ylogo.svg" alt="Yelp">';
    
    const tripadvisorSVG = '<img class="review-icon" src="https://static.thegreekdirectory.org/img/talogo.svg" alt="TripAdvisor">';
    
    const starSVG = '<svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    if (reviews.google) {
        reviewLinks += `<a href="${reviews.google}" target="_blank" rel="noopener noreferrer" class="social-icon social-google" title="Google Reviews">${googleSVG}</a>`;
    }
    if (reviews.yelp) {
        reviewLinks += `<a href="${reviews.yelp}" target="_blank" rel="noopener noreferrer" class="social-icon social-yelp" title="Yelp">${yelpSVG}</a>`;
    }
    if (reviews.tripadvisor) {
        reviewLinks += `<a href="${reviews.tripadvisor}" target="_blank" rel="noopener noreferrer" class="social-icon social-tripadvisor" title="TripAdvisor">${tripadvisorSVG}</a>`;
    }
    
    // Other review links (1-3)
    if (reviews.other1 && reviews.other1_name) {
        reviewLinks += `<a href="${reviews.other1}" target="_blank" rel="noopener noreferrer" class="social-icon social-other" title="${escapeHtml(reviews.other1_name)}">${starSVG}</a>`;
    }
    if (reviews.other2 && reviews.other2_name) {
        reviewLinks += `<a href="${reviews.other2}" target="_blank" rel="noopener noreferrer" class="social-icon social-other" title="${escapeHtml(reviews.other2_name)}">${starSVG}</a>`;
    }
    if (reviews.other3 && reviews.other3_name) {
        reviewLinks += `<a href="${reviews.other3}" target="_blank" rel="noopener noreferrer" class="social-icon social-other" title="${escapeHtml(reviews.other3_name)}">${starSVG}</a>`;
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

// Copyright (C) The Greek Directory, 2025-present. All rights reserved. This source code is proprietary and no part may not be used, reproduced, or distributed without written permission from The Greek Directory. Unauthorized use, copying, modification, or distribution of this code will result in legal action to the fullest extent permitted by law. For more information, visit https://thegreekdirectory.org/legal.
// js/admin.js - PART 10
// Copyright (C) The Greek Directory, 2025-present. All rights reserved. This source code is proprietary and no part may not be used, reproduced, or distributed without written permission from The Greek Directory. Unauthorized use, copying, modification, or distribution of this code will result in legal action to the fullest extent permitted by law. For more information, visit https://thegreekdirectory.org/legal.

// ============================================
// ADMIN PORTAL - PART 10
// Template Replacements Generation - Part 1
// ============================================

function generateTemplateReplacements(listing) {
    const categorySlug = listing.category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const listingUrl = `https://listings.thegreekdirectory.org/listing/${listing.slug}`;
    
    const cityState = listing.city && listing.state ? ` in ${listing.city}, ${listing.state}` : '';
    const inCity = listing.city ? ` in ${listing.city}` : '';
    
    const photos = listing.photos || [];
    const totalPhotos = photos.length || 1;
    const photosArray = (photos.length ? photos : (listing.logo ? [listing.logo] : [])).map(photo => `'${String(photo).replace(/'/g, "\\'")}'`).join(', ');
    
    // Generate photo slides
    let photosSlides = '';
    if (photos.length > 0) {
        photosSlides = photos.map((photo, index) => 
            `<div class="carousel-slide" style="background: url('${photo}') center/cover;"></div>`
        ).join('');
    } else if (listing.logo) {
        photosSlides = `<div class="carousel-slide" style="background: url('${listing.logo}') center/cover;"></div>`;
    }
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    // Generate carousel controls
    let carouselControls = '';
    if (photos.length > 1) {
        const dots = photos.map((_, index) => 
            `<span class="carousel-dot ${index === 0 ? 'active' : ''}" onclick="goToSlide(${index})"></span>`
        ).join('');
        carouselControls = `
            <button class="carousel-nav carousel-prev" onclick="prevSlide()">❮</button>
            <button class="carousel-nav carousel-next" onclick="nextSlide()">❯</button>
            <div class="carousel-dots">${dots}</div>
        `;
    }
    
    // Generate subcategory tags
    let subcategoriesTags = '';
    if (listing.subcategories && listing.subcategories.length > 0) {
        subcategoriesTags = listing.subcategories.map(sub => 
            `<span class="subcategory-tag">${escapeHtml(sub)}</span>`
        ).join('');
    }
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    // Generate status badges
    const isFeatured = listing.tier === 'FEATURED' || listing.tier === 'PREMIUM';
    const isVerified = listing.verified || listing.tier === 'VERIFIED';
    const isClaimed = listing.is_claimed || (listing.owner && listing.owner[0] && listing.owner[0].owner_user_id);

    let statusBadges = '';
    if (isFeatured) {
        statusBadges += '<span class="badge badge-featured">Featured</span>';
    } else if (isVerified) {
        statusBadges += '<span class="badge badge-verified">Verified</span>';
    }
    
    if (listing.is_chain) {
        statusBadges += '<span class="badge" style="background:#9333ea;color:white;">Chain</span>';
    }
    
    statusBadges += '<span class="badge badge-closed" id="openClosedBadge">Closed</span>';

    const claimedCheckmark = (isFeatured || isVerified || isClaimed) ? ' <svg style="width:20px;height:20px;flex-shrink:0;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="12" fill="#045193"></circle><path d="M7 12.5l3.5 3.5L17 9" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"></path></svg>' : '';

    const allowedCustomCtas = getAllowedCustomCtas(listing.tier);
    const customCtas = (listing.custom_ctas || []).slice(0, allowedCustomCtas);
    const customCtaButtons = customCtas.map(cta => {
        const name = (cta?.name || '').trim().slice(0, 15);
        const safeName = escapeHtml(name || 'Learn More');
        const trackingName = (name || 'Custom CTA').replace(/'/g, "\\'");
        const safeLink = cta?.link ? escapeHtml(cta.link) : '#';
        const safeColor = cta?.color || '#055193';
        const iconKey = cta?.icon || 'link';
        const iconSvg = CTA_ICON_SVGS[iconKey] || CTA_ICON_SVGS.link;
        return `
            <a href="${safeLink}" target="_blank" rel="noopener noreferrer" class="cta-custom-button" style="background-color:${safeColor};" onclick="trackClick('custom_cta', '${trackingName}')">
                ${iconSvg}
                ${safeName}
            </a>
        `;
    }).join('');
    
    const taglineDisplay = listing.tagline ? `<p class="text-gray-600 italic mb-2">"${escapeHtml(listing.tagline)}"</p>` : '';
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    // Address section - only show if has street address with number
    let addressSection = '';
    const hasStreetAddress = listing.address && /\d/.test(listing.address);
    
    if (hasStreetAddress || (listing.city && listing.state)) {
        const addressParts = [];
        if (hasStreetAddress) {
            addressParts.push(escapeHtml(listing.address));
        }
        if (listing.city && listing.state) {
            addressParts.push(`${escapeHtml(listing.city)}, ${escapeHtml(listing.state)}${listing.zip_code ? ' ' + escapeHtml(listing.zip_code) : ''}`);
        }
        
        if (addressParts.length > 0) {
            addressSection = `
                <div class="flex items-start gap-2">
                    <svg class="w-5 h-5 text-gray-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                    <span>${addressParts.join(', ')}</span>
                </div>
            `;
        }
    }
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    let phoneSection = '';
    if (listing.phone) {
        phoneSection = `
            <div class="flex items-center gap-2">
                <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                </svg>
                <span>${listing.phone}</span>
            </div>
        `;
    }
    
    let emailSection = '';
    if (listing.email) {
        emailSection = `
            <div class="flex items-center gap-2">
                <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                </svg>
                <span>${escapeHtml(listing.email)}</span>
            </div>
        `;
    }
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    let websiteSection = '';
    if (listing.website) {
        const displayUrl = listing.website.replace(/^https?:\/\//, '').replace(/\/$/, '');
        websiteSection = `
            <div class="flex items-center gap-2">
                <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path>
                </svg>
                <a href="${listing.website}" target="_blank" class="text-blue-600 hover:underline">${escapeHtml(displayUrl)}</a>
            </div>
        `;
    }
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    let hoursSection = '';
    if (listing.hours && Object.keys(listing.hours).some(day => listing.hours[day])) {
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        
        const hoursRows = dayKeys.map((key, index) => {
            const hours = listing.hours[key] || 'Closed';
            return `<div class="flex justify-between text-sm"><span class="font-medium">${days[index]}:</span><span>${escapeHtml(hours)}</span></div>`;
        }).join('');
        
        hoursSection = `
            <div>
                <h3 class="font-semibold text-gray-900 mb-2">Hours</h3>
                <div class="space-y-1">${hoursRows}</div>
                <div id="openStatusText" class="mt-2 text-sm"></div>
                <div class="hours-disclaimer">Hours may not be accurate. Please call to confirm.</div>
            </div>
        `;
    }
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    let phoneButton = '';
    if (listing.phone) {
        phoneButton = `
            <a href="tel:${listing.phone}" class="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium" onclick="trackClick('call')">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                </svg>
                Call
            </a>
        `;
    }
    
    let emailButton = '';
    if (listing.email) {
        emailButton = `
            <a href="mailto:${listing.email}" class="flex items-center justify-center gap-2 px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-700 font-medium">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                </svg>
                Email
            </a>
        `;
    }
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    let websiteButton = '';
    if (listing.website) {
        websiteButton = `
            <a href="${listing.website}" target="_blank" class="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium" onclick="trackClick('website')">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path>
                </svg>
                Website
            </a>
        `;
    }
    
    // Only show directions if has street address with number
    let directionsButton = '';
    if (hasStreetAddress && listing.city) {
        const destination = `${listing.address}, ${listing.city}, ${listing.state} ${listing.zip_code || ''}`.trim();
        const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
        
        directionsButton = `
            <a href="${mapsUrl}" target="_blank" class="flex items-center justify-center gap-2 px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 font-medium" onclick="trackClick('directions')">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path>
                </svg>
                Directions
            </a>
        `;
    }
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    return {
        'BUSINESS_NAME': escapeHtml(listing.business_name),
        'BUSINESS_NAME_ENCODED': encodeURIComponent(listing.business_name),
        'CITY_STATE': cityState,
        'IN_CITY': inCity,
        'TAGLINE': escapeHtml(listing.tagline || ''),
        'DESCRIPTION': escapeHtml(listing.description || ''),
        'CATEGORY': escapeHtml(listing.category),
        'LISTING_URL': listingUrl,
        'LISTING_ID': listing.id,
        'LOGO': listing.logo || '',
        'ADDRESS': escapeHtml(listing.address || ''),
        'CITY': escapeHtml(listing.city || ''),
        'STATE': escapeHtml(listing.state || ''),
        'ZIP_CODE': escapeHtml(listing.zip_code || ''),
        'COUNTRY': escapeHtml(listing.country || 'USA'),
        'PHONE': listing.phone || '',
        'WEBSITE_DOMAIN': listing.website ? new URL(listing.website).hostname : '',
        'TOTAL_PHOTOS': totalPhotos,
        'PHOTOS_SLIDES': photosSlides,
        'PHOTOS_ARRAY': photosArray,
        'CAROUSEL_CONTROLS': carouselControls,
        'SUBCATEGORIES_TAGS': subcategoriesTags,
        'STATUS_BADGES': statusBadges,
        'CLAIMED_CHECKMARK': claimedCheckmark,
        'TAGLINE_DISPLAY': taglineDisplay,
        'ADDRESS_SECTION': addressSection,
        'PHONE_SECTION': phoneSection,
        'EMAIL_SECTION': emailSection,
        'WEBSITE_SECTION': websiteSection,
        'HOURS_SECTION': hoursSection,
        'PHONE_BUTTON': phoneButton,
        'EMAIL_BUTTON': emailButton,
        'WEBSITE_BUTTON': websiteButton,
        'DIRECTIONS_BUTTON': directionsButton,
        'CUSTOM_CTA_BUTTONS': customCtaButtons
    };
}

// Copyright (C) The Greek Directory, 2025-present. All rights reserved. This source code is proprietary and no part may not be used, reproduced, or distributed without written permission from The Greek Directory. Unauthorized use, copying, modification, or distribution of this code will result in legal action to the fullest extent permitted by law. For more information, visit https://thegreekdirectory.org/legal.
// js/admin.js - PART 11
// Copyright (C) The Greek Directory, 2025-present. All rights reserved. This source code is proprietary and no part may not be used, reproduced, or distributed without written permission from The Greek Directory. Unauthorized use, copying, modification, or distribution of this code will result in legal action to the fullest extent permitted by law. For more information, visit https://thegreekdirectory.org/legal.

// ============================================
// ADMIN PORTAL - PART 11
// Template Replacements Generation - Part 2 & Related Listings
// ============================================

function generateTemplateReplacementsPart2(listing) {
    let additionalInfoSection = '';
    const additionalInfo = (listing.additional_info || []).filter(info => info && info.name && info.value);
    if (additionalInfo.length > 0) {
        const rows = additionalInfo.map(info => `
            <div class="flex items-start justify-between gap-4 text-sm text-gray-700 border-b border-gray-200 pb-2">
                <span class="font-medium">${escapeHtml(info.name)}</span>
                <span class="text-right">${escapeHtml(info.value)}</span>
            </div>
        `).join('');
        additionalInfoSection = `
            <div class="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                <h3 class="text-lg font-bold text-gray-900 mb-3">Additional Information</h3>
                <div class="space-y-2">${rows}</div>
            </div>
        `;
    }

    let ownerInfoSection = '';
    const owner = listing.owner && listing.owner.length > 0 ? listing.owner[0] : null;
    if (owner && (owner.full_name || owner.title)) {
        let ownerDetails = '';
        if (owner.full_name) ownerDetails += `<p><strong>Owner:</strong> ${escapeHtml(owner.full_name)}</p>`;
        if (owner.title) ownerDetails += `<p><strong>Title:</strong> ${escapeHtml(owner.title)}</p>`;
        if (owner.from_greece) ownerDetails += `<p><strong>From:</strong> ${escapeHtml(owner.from_greece)}, Greece</p>`;
        if (owner.email_visible && owner.owner_email) ownerDetails += `<p><strong>Email:</strong> <a href="mailto:${owner.owner_email}" class="text-blue-600 hover:underline">${escapeHtml(owner.owner_email)}</a></p>`;
        if (owner.phone_visible && owner.owner_phone) ownerDetails += `<p><strong>Phone:</strong> <a href="tel:${owner.owner_phone}" class="text-blue-600 hover:underline">${owner.owner_phone}</a></p>`;
        
        ownerInfoSection = `
            <div class="owner-info-section">
                <h3 class="text-lg font-bold text-gray-900 mb-3">Owner Information</h3>
                ${ownerDetails}
            </div>
        `;
    }
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    const socialMediaSection = generateSocialMediaSection(listing);
    const reviewSection = generateReviewSection(listing);
    
    // Only show map if has street address with number
    let mapSection = '';
    const hasStreetAddress = listing.address && /\d/.test(listing.address);
    if (hasStreetAddress && listing.coordinates && listing.coordinates.lat && listing.coordinates.lng) {
        mapSection = `
            <div>
                <h2 class="text-xl font-bold text-gray-900 mb-3">Location</h2>
                <div id="listingMap"></div>
            </div>
        `;
    }
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    // Generate Related Listings section for chain businesses
    let relatedListingsSection = '';
    if (listing.is_chain && listing.chain_id) {
        relatedListingsSection = `
            <div class="mt-8">
                <h2 class="text-xl font-bold text-gray-900 mb-4">Related Listings</h2>
                <div id="relatedListingsContainer" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <p class="text-gray-600 col-span-full">Loading related locations...</p>
                </div>
            </div>
            <script>
            // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
            
            // Load related chain listings
            (async function() {
                try {
                    const chainId = '${listing.chain_id}';
                    const currentListingId = '${listing.id}';
                    
                    const response = await fetch('https://luetekzqrrgdxtopzvqw.supabase.co/rest/v1/listings?chain_id=eq.' + chainId + '&visible=eq.true&select=*', {
                        headers: {
                            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1ZXRla3pxcnJnZHh0b3B6dnF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNDc2NDcsImV4cCI6MjA4MzkyMzY0N30.TIrNG8VGumEJc_9JvNHW-Q-UWfUGpPxR0v8POjWZJYg'
                        }
                    });
                    
                    if (!response.ok) throw new Error('Failed to load related listings');
                    
                    const data = await response.json();
                    const relatedListings = data.filter(l => l.id !== currentListingId);
                    
                    const container = document.getElementById('relatedListingsContainer');
                    
                    if (relatedListings.length === 0) {
                        container.innerHTML = '<p class="text-gray-600 col-span-full">No other locations found.</p>';
                        return;
                    }
                    
                    container.innerHTML = relatedListings.map(l => {
                        const listingUrl = '/listing/' + l.slug;
                        const location = (l.city && l.state) ? l.city + ', ' + l.state : (l.city || l.state || 'Location TBD');
                        
                        return \`
                            <a href="\${listingUrl}" class="block bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow">
                                <div class="flex items-start gap-3">
                                    \${l.logo ? \`<img src="\${l.logo}" alt="\${l.business_name}" class="w-16 h-16 rounded-lg object-cover flex-shrink-0">\` : ''}
                                    <div class="flex-1 min-w-0">
                                        <h3 class="font-bold text-gray-900 mb-1">\${l.business_name}</h3>
                                        <p class="text-sm text-gray-600 mb-1">📍 \${location}</p>
                                        \${l.phone ? \`<p class="text-sm text-gray-600">📞 \${l.phone}</p>\` : ''}
                                    </div>
                                </div>
                            </a>
                        \`;
                    }).join('');
                    
                } catch (error) {
                    console.error('Error loading related listings:', error);
                    document.getElementById('relatedListingsContainer').innerHTML = 
                        '<p class="text-gray-600 col-span-full">Failed to load related locations.</p>';
                }
            })();
            
            // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
            </script>
        `;
    }
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    let claimButton = '';
    const isClaimed = listing.is_claimed || (owner && owner.owner_user_id);
    if (!isClaimed && listing.show_claim_button !== false) {
        const cityState = listing.city && listing.state ? `${listing.city}, ${listing.state}` : '';
        const country = listing.country && listing.country !== 'USA' ? `, ${listing.country}` : '';
        const locationInfo = listing.state ? cityState + country : (listing.city ? listing.city + country : '');
        const subject = encodeURIComponent(`Claim My Listing: ${listing.business_name}${locationInfo ? ' - ' + locationInfo : ''}`);
        
        claimButton = `
            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                <h3 class="text-lg font-bold text-gray-900 mb-2">Is this your business?</h3>
                <p class="text-gray-700 mb-4">Claim this listing to manage your information and connect with customers.</p>
                <a href="mailto:contact@thegreekdirectory.org?subject=${subject}" class="inline-block px-6 py-3 text-white rounded-lg font-semibold" style="background-color:#055193;">Claim This Listing</a>
            </div>
        `;
    }
    
    const hoursSchema = generateHoursSchema(listing);
    const hasStreetAddress2 = listing.address && /\d/.test(listing.address);
    const coordinates = (hasStreetAddress2 && listing.coordinates) ? `${listing.coordinates.lat},${listing.coordinates.lng}` : '';
    const fullAddress = hasStreetAddress2 ? [listing.address, listing.city, listing.state, listing.zip_code].filter(Boolean).join(', ') : '';
    const hoursJson = listing.hours ? JSON.stringify(listing.hours) : 'null';
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    return {
        'ADDITIONAL_INFO_SECTION': additionalInfoSection,
        'OWNER_INFO_SECTION': ownerInfoSection,
        'SOCIAL_MEDIA_SECTION': socialMediaSection,
        'REVIEW_SECTION': reviewSection,
        'MAP_SECTION': mapSection,
        'RELATED_LISTINGS_SECTION': relatedListingsSection,
        'CLAIM_BUTTON': claimButton,
        'HOURS_SCHEMA': hoursSchema,
        'COORDINATES': coordinates,
        'FULL_ADDRESS': fullAddress,
        'HOURS_JSON': hoursJson
    };
}

// Copyright (C) The Greek Directory, 2025-present. All rights reserved. This source code is proprietary and no part may not be used, reproduced, or distributed without written permission from The Greek Directory. Unauthorized use, copying, modification, or distribution of this code will result in legal action to the fullest extent permitted by law. For more information, visit https://thegreekdirectory.org/legal.
// js/admin.js - PART 12
// Copyright (C) The Greek Directory, 2025-present. All rights reserved. This source code is proprietary and no part may not be used, reproduced, or distributed without written permission from The Greek Directory. Unauthorized use, copying, modification, or distribution of this code will result in legal action to the fullest extent permitted by law. For more information, visit https://thegreekdirectory.org/legal.

// ============================================
// ADMIN PORTAL - PART 12
// Generate Listing Page & Analytics Tracking
// ============================================

window.generateListingPage = async function(listingId) {
    try {
        const { data: listing, error } = await adminSupabase
            .from('listings')
            .select(`
                *,
                owner:business_owners(*)
            `)
            .eq('id', listingId)
            .single();
        
        if (error) throw error;
        if (!listing) {
            console.error('Listing not found');
            return;
        }
        
        console.log('📄 Generating page for:', listing.business_name);
        
        // Apply default images if needed
        const defaultImage = CATEGORY_DEFAULT_IMAGES[listing.category];
        
        if (!listing.logo && defaultImage) {
            listing.logo = `${defaultImage}?w=200&h=200&fit=crop&q=80`;
            
            // Update in database
            await adminSupabase
                .from('listings')
                .update({ logo: listing.logo })
                .eq('id', listingId);
        }
        
        if (!listing.photos || listing.photos.length === 0) {
            listing.photos = [`${defaultImage}?w=800&q=80`];
            
            // Update in database
            await adminSupabase
                .from('listings')
                .update({ photos: listing.photos })
                .eq('id', listingId);
        }
        
        // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
        
        // Create analytics entry if it doesn't exist
        const { data: analyticsEntry } = await adminSupabase
            .from('analytics')
            .select('*')
            .eq('listing_id', listingId)
            .maybeSingle();
        
        if (!analyticsEntry) {
            console.log('Creating analytics entry for listing:', listingId);
            await adminSupabase
                .from('analytics')
                .insert({
                    listing_id: listingId,
                    views: 0,
                    call_clicks: 0,
                    website_clicks: 0,
                    direction_clicks: 0,
                    share_clicks: 0,
                    video_plays: 0,
                    last_viewed: new Date().toISOString()
                });
        }
        
        const templateResponse = await fetch('https://raw.githubusercontent.com/thegreekdirectory/listings/main/listing-template.html');
        if (!templateResponse.ok) {
            throw new Error('Failed to fetch template');
        }
        
        let template = await templateResponse.text();
        
        const replacements1 = generateTemplateReplacements(listing);
        const replacements2 = generateTemplateReplacementsPart2(listing);
        const replacements = { ...replacements1, ...replacements2 };
        
        Object.keys(replacements).forEach(key => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            template = template.replace(regex, replacements[key]);
        });
        
        // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
        
        const filePath = `listing/${listing.slug}.html`;
        
        await saveToGitHub(filePath, template, listing.business_name);
        
        await updateSitemap();
        
        console.log('✅ Page generated successfully');
        
    } catch (error) {
        console.error('Error generating page:', error);
        alert('❌ Failed to generate listing page: ' + error.message);
    }
};

// Copyright (C) The Greek Directory, 2025-present. All rights reserved.

async function updateSitemap() {
    try {
        const { data: listings, error } = await adminSupabase
            .from('listings')
            .select('*')
            .eq('visible', true);
        
        if (error) throw error;
        
        const database = { listings: listings || [] };
        
        const now = new Date().toISOString().split('T')[0];
        const baseUrl = 'https://thegreekdirectory.org';
        
        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
`;
        
        // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
        
        // Collect unique places (cities)
        const places = new Set();
        const usStates = new Set();
        
        // Define major city mappings for each state
        const majorCityMappings = {
            'IL': {
                'Chicago': 'chicago',
                'Chicagoland': 'chicagoland',
                'Springfield': 'springfield',
                'Rockford': 'rockford',
                'Peoria': 'peoria',
                'Champaign': 'champaign',
                'Urbana': 'champaign'
            }
        };
        
        // Chicago suburbs that should map to "chicagoland"
        const chicagolandCities = [
            'oak forest', 'deerfield', 'downers grove', 'oakbrook terrace', 
            'niles', 'glenview', 'evanston', 'skokie', 'northbrook',
            'schaumburg', 'naperville', 'aurora', 'joliet', 'elgin',
            'cicero', 'arlington heights', 'palatine', 'bolingbrook',
            'des plaines', 'orland park', 'tinley park', 'oak lawn',
            'berwyn', 'mount prospect', 'wheaton', 'hoffman estates',
            'oak park', 'buffalo grove', 'bartlett', 'streamwood',
            'carol stream', 'lombard', 'elmhurst', 'park ridge'
        ];
        
        database.listings.forEach(listing => {
            if (listing.visible !== false && listing.city && listing.state && (listing.country || 'USA') === 'USA') {
                const city = listing.city.toLowerCase();
                const state = listing.state;
                
                let citySlug;
                
                // Check if it's Illinois and a Chicago suburb
                if (state === 'IL' && chicagolandCities.includes(city)) {
                    citySlug = 'chicagoland';
                } else if (majorCityMappings[state] && majorCityMappings[state][listing.city]) {
                    // Use major city mapping if available
                    citySlug = majorCityMappings[state][listing.city];
                } else {
                    // For non-major cities, just use state
                    citySlug = null;
                }
                
                const stateSlug = state.toLowerCase();
                usStates.add(stateSlug);
                
                if (citySlug) {
                    places.add(`${stateSlug}/${citySlug}`);
                }
            }
        });
        
        // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
        
        // Add state pages
        usStates.forEach(state => {
            xml += `  <url>
    <loc>${baseUrl}/places/usa/${state}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
`;
        });
        
        // Add place pages
        places.forEach(place => {
            xml += `  <url>
    <loc>${baseUrl}/places/usa/${place}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
        });
        
        // Collect unique categories
        const categories = new Set();
        database.listings.forEach(listing => {
            if (listing.visible !== false && listing.category) {
                categories.add(listing.category);
            }
        });
        
        // Add category pages
        categories.forEach(category => {
            const categorySlug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            xml += `  <url>
    <loc>${baseUrl}/category/${categorySlug}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;
        });
        
        // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
        
        // Add individual listings
        database.listings.forEach(listing => {
            if (listing.visible !== false) {
                const categorySlug = listing.category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                const listingSlug = listing.slug;
                const lastMod = listing.updated_at ? 
                    listing.updated_at.split('T')[0] : now;
                
                xml += `  <url>
    <loc>${baseUrl}/listing/${listingSlug}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
`;
            }
        });
        
        xml += `</urlset>`;
        
        await saveToGitHub('sitemap.xml', xml, 'Sitemap');
        
        console.log('✅ Sitemap updated successfully');
        
    } catch (error) {
        console.error('Error updating sitemap:', error);
    }
}

// Copyright (C) The Greek Directory, 2025-present. All rights reserved.

async function saveToGitHub(filePath, content, businessName) {
    try {
        let currentSha = null;
        try {
            const fileInfoResponse = await fetch(
                `https://api.github.com/repos/thegreekdirectory/listings/contents/${filePath}`,
                {
                    headers: {
                        'Authorization': `token ${adminGithubToken}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                }
            );
            
            if (fileInfoResponse.ok) {
                const fileInfo = await fileInfoResponse.json();
                currentSha = fileInfo.sha;
            }
        } catch (error) {
            console.log('File does not exist, will create new');
        }
        
        const base64Content = btoa(unescape(encodeURIComponent(content)));
        
        const uploadBody = {
            message: `${currentSha ? 'Update' : 'Create'} listing page for ${businessName}`,
            content: base64Content,
            committer: {
                name: 'TGD Admin',
                email: 'admin@thegreekdirectory.org'
            }
        };
        
        if (currentSha) {
            uploadBody.sha = currentSha;
        }
        
        // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
        
        const uploadResponse = await fetch(
            `https://api.github.com/repos/thegreekdirectory/listings/contents/${filePath}`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${adminGithubToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(uploadBody)
            }
        );
        
        if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json();
            throw new Error(`GitHub upload failed: ${errorData.message}`);
        }
        
        return true;
    } catch (error) {
        console.error('Error saving to GitHub:', error);
        throw error;
    }
}

// Copyright (C) The Greek Directory, 2025-present. All rights reserved. This source code is proprietary and no part may not be used, reproduced, or distributed without written permission from The Greek Directory. Unauthorized use, copying, modification, or distribution of this code will result in legal action to the fullest extent permitted by law. For more information, visit https://thegreekdirectory.org/legal.
// js/admin.js - PART 13
// Copyright (C) The Greek Directory, 2025-present. All rights reserved. This source code is proprietary and no part may not be used, reproduced, or distributed without written permission from The Greek Directory. Unauthorized use, copying, modification, or distribution of this code will result in legal action to the fullest extent permitted by law. For more information, visit https://thegreekdirectory.org/legal.

// ============================================
// ADMIN PORTAL - PART 13
// Generate All Pages & CSV Upload
// ============================================

window.generateAllListingPages = async function() {
    if (!confirm('This will generate pages for ALL visible listings. This may take several minutes. Continue?')) {
        return;
    }
    
    const visibleListings = allListings.filter(l => l.visible);
    
    console.log(`🔨 Generating ${visibleListings.length} listing pages...`);
    
    let successful = 0;
    let failed = 0;
    const failedListings = [];
    
    for (const listing of visibleListings) {
        try {
            await generateListingPage(listing.id);
            successful++;
            console.log(`✅ Generated: ${listing.business_name}`);
            
            // Rate limit: wait 1 second between GitHub API calls
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
            console.error(`❌ Failed: ${listing.business_name}`, error);
            failed++;
            failedListings.push(listing.business_name);
        }
    }
    
    console.log('📊 Generation Summary:');
    console.log(`   ✅ Successful: ${successful}`);
    console.log(`   ❌ Failed: ${failed}`);
    if (failedListings.length > 0) {
        console.log('   Failed listings:', failedListings.join(', '));
    }
    
    alert(`Generation complete!\n\nSuccessful: ${successful}\nFailed: ${failed}${failedListings.length > 0 ? '\n\nFailed listings:\n' + failedListings.join('\n') : ''}`);
};

// Copyright (C) The Greek Directory, 2025-present. All rights reserved.

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

// Copyright (C) The Greek Directory, 2025-present. All rights reserved.

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
            
            const isClaimed = csvListing.is_claimed === 'true' || csvListing.is_claimed === '1';
            
            // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
            
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
                is_claimed: isClaimed,
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
            
            // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
            
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
                confirmation_key: isClaimed ? null : (csvListing.confirmation_key || null)
            };
            
            // Generate confirmation key if not claimed and not provided
            if (!isClaimed && !ownerData.confirmation_key) {
                const words = [
                    'alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta', 'eta', 'theta',
                    'iota', 'kappa', 'lambda', 'sigma', 'omega', 'phoenix', 'apollo'
                ];
                const word1 = words[Math.floor(Math.random() * words.length)];
                const word2 = words[Math.floor(Math.random() * words.length)];
                const word3 = words[Math.floor(Math.random() * words.length)];
                ownerData.confirmation_key = `${word1}-${word2}-${word3}`;
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

// Copyright (C) The Greek Directory, 2025-present. All rights reserved.

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

// Copyright (C) The Greek Directory, 2025-present. All rights reserved.

// Bind to button click
document.addEventListener('DOMContentLoaded', () => {
    const generateAllBtn = document.getElementById('generateAllBtn');
    if (generateAllBtn) {
        generateAllBtn.addEventListener('click', generateAllListingPages);
    }
});

// Copyright (C) The Greek Directory, 2025-present. All rights reserved. This source code is proprietary and no part may not be used, reproduced, or distributed without written permission from The Greek Directory. Unauthorized use, copying, modification, or distribution of this code will result in legal action to the fullest extent permitted by law. For more information, visit https://thegreekdirectory.org/legal.
