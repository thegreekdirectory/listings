// ============================================
// ADMIN PORTAL - PART 1
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

const COUNTRY_CODES = {
    'USA': '+1',
    'Greece': '+30',
    'Canada': '+1',
    'UK': '+44',
    'Cyprus': '+357',
    'Australia': '+61'
};

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
}

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

window.handleAdminLogin = handleAdminLogin;
window.logout = logout;
// ============================================
// ADMIN PORTAL - PART 2
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
        const isClaimed = ownerInfo && ownerInfo.owner_user_id;
        
        let badges = '';
        if (tier === 'PREMIUM') {
            badges = '<span class="ml-2 px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-700">⭐ Featured</span>';
            badges += '<span class="ml-2 px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">✓ Verified</span>';
        } else if (tier === 'FEATURED') {
            badges = '<span class="ml-2 px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-700">⭐ Featured</span>';
        } else if (tier === 'VERIFIED') {
            badges = '<span class="ml-2 px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">✓ Verified</span>';
        }
        
        if (isClaimed) {
            badges += '<span class="ml-2 px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">✓ Claimed</span>';
        }
        
        if (l.is_chain) {
            badges += '<span class="ml-2 px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-700">🔗 Chain</span>';
        }
        
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
// ============================================
// ADMIN PORTAL - PART 3
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
            is_chain: false
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
                    <div class="md:col-span-2">
                        <label class="block text-sm font-medium mb-2">Coordinates (lat, lng)</label>
                        <input type="text" id="editCoordinates" value="${listing?.coordinates ? listing.coordinates.lat + ',' + listing.coordinates.lng : ''}" class="w-full px-4 py-2 border rounded-lg" placeholder="41.8781,-87.6298">
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

function updateCharCounters() {
    const tagline = document.getElementById('editTagline')?.value || '';
    const desc = document.getElementById('editDescription')?.value || '';
    
    const taglineCount = document.getElementById('taglineCount');
    const descCount = document.getElementById('descCount');
    
    if (taglineCount) taglineCount.textContent = tagline.length;
    if (descCount) descCount.textContent = desc.length;
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
// ============================================
// ADMIN PORTAL - PART 4
// Edit Form Continuation (Hours, Social, Reviews, Owner, Media)
// ============================================

function fillEditFormContinuation(listing, owner) {
    const formContent = document.getElementById('editFormContent');
    formContent.innerHTML += `
            <!-- Hours -->
            <div>
                <h3 class="text-lg font-bold mb-4">Hours of Operation</h3>
                <div class="grid grid-cols-1 gap-3">
                    ${['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => `
                        <div class="flex gap-2">
                            <label class="w-28 flex items-center font-medium text-gray-700">${day}:</label>
                            <input type="text" id="editHours${day}" value="${listing?.hours && listing.hours[day.toLowerCase()] ? listing.hours[day.toLowerCase()] : ''}" class="flex-1 px-4 py-2 border rounded-lg" placeholder="9:00 AM - 5:00 PM or Closed">
                        </div>
                    `).join('')}
                </div>
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
                </div>
            </div>

            <!-- Owner Info -->
            <div>
                <h3 class="text-lg font-bold mb-4">Owner Information</h3>
                ${owner?.owner_user_id ? '<p class="text-sm text-green-600 mb-4">✓ This listing is claimed</p>' : '<p class="text-sm text-gray-600 mb-4">This listing is not claimed</p>'}
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
                    <div>
                        <label class="block text-sm font-medium mb-2">Confirmation Key</label>
                        <input type="text" id="editConfirmationKey" value="${owner?.confirmation_key || ''}" class="w-full px-4 py-2 border rounded-lg" ${owner?.owner_user_id ? 'disabled title="Cannot change - listing is claimed"' : ''} placeholder="${owner?.owner_user_id ? 'Listing is claimed' : 'Auto-generated if empty'}">
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
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Photos (one per line)</label>
                        <textarea id="editPhotos" rows="4" class="w-full px-4 py-2 border rounded-lg">${listing?.photos ? listing.photos.join('\n') : ''}</textarea>
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Video URL (YouTube/Vimeo embed)</label>
                        <input type="url" id="editVideo" value="${listing?.video || ''}" class="w-full px-4 py-2 border rounded-lg" placeholder="https://www.youtube.com/embed/...">
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
}
// ============================================
// ADMIN PORTAL - PART 5
// Save Listing & Delete Functions
// ============================================

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
        
        const coordinatesInput = document.getElementById('editCoordinates').value.trim();
        let coordinates = null;
        if (coordinatesInput) {
            const parts = coordinatesInput.split(',');
            if (parts.length === 2) {
                const lat = parseFloat(parts[0].trim());
                const lng = parseFloat(parts[1].trim());
                if (!isNaN(lat) && !isNaN(lng)) {
                    coordinates = { lat, lng };
                }
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
            address: document.getElementById('editAddress').value.trim() || null,
            city: document.getElementById('editCity').value.trim() || null,
            state: document.getElementById('editState').value || null,
            zip_code: document.getElementById('editZipCode').value.trim() || null,
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
                linkedin: document.getElementById('editLinkedin').value.trim() || null
            },
            reviews: {
                google: document.getElementById('editGoogleReviews').value.trim() || null,
                yelp: document.getElementById('editYelp').value.trim() || null,
                tripadvisor: document.getElementById('editTripadvisor').value.trim() || null
            }
        };
        
        let savedListing;
        const isExisting = editingListing && editingListing.id && allListings.find(l => l.id === editingListing.id);
        
        if (isExisting) {
            const { data, error } = await adminSupabase
                .from('listings')
                .update(listingData)
                .eq('id', editingListing.id);
            
            if (error) throw error;
            
            const { data: updated, error: fetchError } = await adminSupabase
                .from('listings')
                .select('*')
                .eq('id', editingListing.id)
                .single();
            
            if (fetchError) throw fetchError;
            savedListing = updated;
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
        
    } catch (error) {
        console.error('Error saving listing:', error);
        alert('Failed to save listing: ' + error.message);
    }
}

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

window.saveListing = saveListing;
window.editListing = editListing;
window.newListing = newListing;
window.deleteListing = deleteListing;
window.sendMagicLink = sendMagicLink;
// ============================================
// ADMIN PORTAL - PART 6
// Page Generation Helper Functions
// ============================================

// Copyright (C) The Greek Directory, 2025-present. All rights reserved.

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

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
    
    const yelpSVG = '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 1000 385" fill="none"><path d="M806.495 227.151L822.764 223.392C823.106 223.313 823.671 223.183 824.361 222.96C828.85 221.753 832.697 218.849 835.091 214.862C837.485 210.874 838.241 206.113 837.198 201.582C837.175 201.482 837.153 201.388 837.13 201.289C836.596 199.117 835.66 197.065 834.37 195.239C832.547 192.926 830.291 190.991 827.728 189.542C824.711 187.82 821.553 186.358 818.289 185.171L800.452 178.659C790.441 174.937 780.432 171.309 770.328 167.771C763.776 165.439 758.224 163.393 753.4 161.901C752.49 161.62 751.485 161.34 750.669 161.058C744.837 159.271 740.739 158.53 737.272 158.505C734.956 158.42 732.649 158.841 730.511 159.738C728.283 160.699 726.282 162.119 724.639 163.906C723.822 164.835 723.054 165.806 722.337 166.815C721.665 167.843 721.049 168.907 720.491 170.001C719.876 171.174 719.348 172.391 718.911 173.642C715.6 183.428 713.951 193.7 714.032 204.029C714.091 213.368 714.342 225.354 719.475 233.479C720.712 235.564 722.372 237.366 724.348 238.769C728.004 241.294 731.7 241.627 735.544 241.904C741.289 242.316 746.855 240.905 752.403 239.623L806.45 227.135L806.495 227.151Z" fill="#FF1A1A"/><path d="M987.995 140.779C983.553 131.457 977.581 122.947 970.328 115.601C969.39 114.669 968.385 113.806 967.321 113.02C966.339 112.283 965.318 111.598 964.264 110.967C963.18 110.373 962.065 109.837 960.924 109.362C958.668 108.476 956.25 108.077 953.829 108.19C951.513 108.322 949.254 108.956 947.207 110.049C944.105 111.591 940.748 114.07 936.283 118.221C935.666 118.834 934.891 119.525 934.195 120.177C930.511 123.641 926.413 127.911 921.536 132.883C914.002 140.497 906.583 148.152 899.21 155.89L886.017 169.571C883.601 172.071 881.401 174.771 879.441 177.643C877.771 180.07 876.59 182.799 875.963 185.678C875.6 187.886 875.653 190.142 876.12 192.329C876.143 192.429 876.164 192.523 876.187 192.622C877.229 197.154 879.988 201.103 883.883 203.637C887.778 206.172 892.505 207.094 897.068 206.211C897.791 206.106 898.352 205.982 898.693 205.898L969.033 189.646C974.576 188.365 980.202 187.191 985.182 184.3C988.522 182.363 991.699 180.443 993.878 176.569C995.043 174.441 995.748 172.092 995.948 169.675C997.027 160.089 992.021 149.202 987.995 140.779Z" fill="#FF1A1A"/><path d="M862.1 170.358C867.197 163.955 867.184 154.41 867.64 146.607C869.174 120.536 870.79 94.4619 872.07 68.3766C872.56 58.4962 873.624 48.7498 873.036 38.7944C872.552 30.5816 872.492 21.1521 867.307 14.4122C858.154 2.52688 838.636 3.50371 825.319 5.34732C821.239 5.91358 817.153 6.6749 813.099 7.64807C809.045 8.62124 805.033 9.6841 801.108 10.9412C788.329 15.127 770.365 22.8103 767.323 37.5341C765.608 45.858 769.672 54.3727 772.824 61.9691C776.645 71.1774 781.865 79.4721 786.622 88.1401C799.198 111.024 812.008 133.765 824.782 156.53C828.597 163.326 832.755 171.933 840.135 175.454C840.623 175.667 841.121 175.856 841.628 176.018C844.937 177.272 848.545 177.513 851.993 176.712C852.201 176.664 852.405 176.617 852.608 176.57C855.792 175.704 858.675 173.973 860.937 171.568C861.345 171.185 861.734 170.782 862.1 170.358Z" fill="#FF1A1A"/><path d="M855.997 240.155C854.008 237.355 851.184 235.258 847.931 234.162C844.677 233.065 841.16 233.027 837.881 234.051C837.111 234.307 836.361 234.618 835.636 234.983C834.515 235.554 833.445 236.221 832.439 236.976C829.507 239.148 827.039 241.97 824.791 244.8C824.221 245.522 823.7 246.483 823.022 247.1L811.708 262.663C805.295 271.382 798.971 280.123 792.7 289.003C788.608 294.735 785.068 299.576 782.273 303.859C781.743 304.666 781.193 305.567 780.689 306.284C777.338 311.469 775.441 315.252 774.467 318.622C773.735 320.862 773.503 323.234 773.788 325.572C774.1 328.008 774.92 330.35 776.195 332.447C776.873 333.499 777.604 334.516 778.385 335.495C779.196 336.436 780.058 337.332 780.966 338.18C781.936 339.105 782.973 339.957 784.07 340.729C791.879 346.162 800.428 350.066 809.421 353.083C816.904 355.567 824.682 357.053 832.555 357.504C833.894 357.572 835.237 357.543 836.572 357.417C837.809 357.309 839.04 357.136 840.26 356.9C841.479 356.615 842.681 356.266 843.863 355.853C846.162 354.993 848.255 353.66 850.008 351.94C851.667 350.279 852.944 348.276 853.749 346.07C855.057 342.81 855.917 338.671 856.483 332.526C856.532 331.652 856.657 330.604 856.744 329.644C857.19 324.545 857.395 318.556 857.723 311.514C858.276 300.685 858.71 289.903 859.053 279.09C859.053 279.09 859.782 259.875 859.78 259.865C859.946 255.437 859.81 250.53 858.582 246.121C858.042 244.008 857.17 241.994 855.997 240.155V240.155Z" fill="#FF1A1A"/><path d="M983.707 270.24C981.346 267.651 978 265.069 972.722 261.878C971.961 261.453 971.068 260.886 970.244 260.392C965.85 257.749 960.557 254.969 954.374 251.611C944.876 246.396 935.372 241.312 925.778 236.271L908.825 227.28C907.946 227.024 907.053 226.389 906.225 225.989C902.968 224.432 899.516 222.978 895.932 222.311C894.697 222.074 893.444 221.944 892.186 221.923C891.375 221.913 890.565 221.962 889.761 222.07C886.371 222.595 883.234 224.178 880.795 226.591C878.356 229.005 876.74 232.128 876.178 235.513C875.919 237.667 875.998 239.847 876.411 241.976C877.24 246.487 879.254 250.95 881.338 254.858L890.391 271.824C895.428 281.394 900.526 290.907 905.752 300.391C909.123 306.578 911.929 311.871 914.557 316.26C915.055 317.085 915.62 317.974 916.046 318.738C919.245 324.013 921.815 327.333 924.421 329.715C926.109 331.345 928.132 332.586 930.349 333.351C932.68 334.124 935.146 334.398 937.59 334.155C938.832 334.008 940.066 333.795 941.286 333.516C942.488 333.193 943.672 332.808 944.833 332.362C946.087 331.889 947.305 331.327 948.478 330.678C955.36 326.82 961.703 322.07 967.345 316.552C974.112 309.894 980.093 302.633 984.745 294.321C985.392 293.145 985.952 291.924 986.422 290.667C986.86 289.504 987.24 288.319 987.558 287.118C987.834 285.896 988.045 284.662 988.191 283.418C988.422 280.977 988.138 278.514 987.358 276.19C986.591 273.963 985.345 271.932 983.707 270.24V270.24Z" fill="#FF1A1A"/></svg>';
    
    const tripadvisorSVG = '<svg width="22" height="22" viewBox="0 0 256 191" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid"><path d="M128.023 95.364c.18-.003 21.732-.043 41.012 10.96 10.505 5.996 18.636 14.103 24.156 24.095 3.808 6.895 6.255 14.181 7.28 21.691.96 7.02.559 13.946-1.193 20.593-3.504 13.289-11.443 24.806-23.631 34.29a84.124 84.124 0 0 1-15.377 9.274c-11.309 5.282-23.201 7.819-35.39 7.555-12.066-.26-23.573-3.333-34.24-9.142a83.773 83.773 0 0 1-14.84-9.588c-11.893-9.397-19.793-20.743-23.5-33.746-1.85-6.495-2.387-13.163-1.6-19.924a84.124 84.124 0 0 1 7.28-21.691c5.52-9.992 13.65-18.099 24.156-24.095 19.278-11.003 40.83-10.963 41.012-10.96l4.875-.313z" fill="#34E0A1"/><path d="M185.17 95.053c.006.11.012.22.015.333v.015a95.512 95.512 0 0 1-1.885 28.078 95.567 95.567 0 0 1-12.645 30.534 95.513 95.513 0 0 1-42.632 37.06 95.552 95.552 0 0 1-57.13 3.735 95.56 95.56 0 0 1-30.016-13.305 95.516 95.516 0 0 1-25.733-25.3 95.539 95.539 0 0 1-13.42-30.06 95.514 95.514 0 0 1-.866-49.19A95.561 95.561 0 0 1 13.35 46.393a95.515 95.515 0 0 1 23.28-27.208A95.559 95.559 0 0 1 66.01 4.66a95.522 95.522 0 0 1 49.103.973A95.563 95.563 0 0 1 145.24 19.08a95.517 95.517 0 0 1 27.257 23.252 95.54 95.54 0 0 1 14.558 29.984c2.2 8.187 3.327 16.59 3.35 24.998-.021-.001 0 .003 0 .003l-5.234-2.264z" fill="#00AF87"/><path d="M128 60.364c-28.862 0-52.272 23.41-52.272 52.272S99.138 165 128 165s52.272-23.41 52.272-52.272S156.862 60.364 128 60.364zm0 87.273c-19.314 0-35-15.686-35-35s15.686-35 35-35 35 15.686 35 35-15.686 35-35 35z" fill="#FEFEFE"/></svg>';
    
    if (reviews.google) {
        reviewLinks += `<a href="${reviews.google}" target="_blank" rel="noopener noreferrer" class="social-icon social-google">${googleSVG}</a>`;
    }
    if (reviews.yelp) {
        reviewLinks += `<a href="${reviews.yelp}" target="_blank" rel="noopener noreferrer" class="social-icon social-yelp">${yelpSVG}</a>`;
    }
    if (reviews.tripadvisor) {
        reviewLinks += `<a href="${reviews.tripadvisor}" target="_blank" rel="noopener noreferrer" class="social-icon social-tripadvisor">${tripadvisorSVG}</a>`;
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

// Copyright (C) The Greek Directory, 2025-present. All rights reserved. This source code is proprietary and no part may not be used, reproduced, or distributed without written permission from The Greek Directory. Unauthorized use, copying, modification, or distribution of this code will result in legal action to the fullest extent permitted by law.


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

// ============================================
// ADMIN PORTAL - PART 7
// Generate Template Replacements - Part 1
// ============================================

function generateTemplateReplacements(listing) {
    const categorySlug = listing.category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const listingUrl = `https://listings.thegreekdirectory.org/listing/${categorySlug}/${listing.slug}`;
    
    const cityState = listing.city && listing.state ? ` in ${listing.city}, ${listing.state}` : '';
    const inCity = listing.city ? ` in ${listing.city}` : '';
    
    const photos = listing.photos || [];
    const totalPhotos = photos.length || 1;
    
    // Generate photo slides
    let photosSlides = '';
    if (photos.length > 0) {
        photosSlides = photos.map((photo, index) => 
            `<div class="carousel-slide" style="background: url('${photo}') center/cover;"></div>`
        ).join('');
    } else if (listing.logo) {
        photosSlides = `<div class="carousel-slide" style="background: url('${listing.logo}') center/cover;"></div>`;
    }
    
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
    
    // Generate status badges
    let statusBadges = '';
    if (listing.tier === 'PREMIUM') {
        statusBadges += '<span class="badge badge-featured">Featured</span>';
        statusBadges += '<span class="badge badge-verified">Verified</span>';
    } else if (listing.tier === 'FEATURED') {
        statusBadges += '<span class="badge badge-featured">Featured</span>';
    } else if (listing.verified || listing.tier === 'VERIFIED') {
        statusBadges += '<span class="badge badge-verified">Verified</span>';
    }
    
    if (listing.is_chain) {
        statusBadges += '<span class="badge" style="background:#9333ea;color:white;">Chain</span>';
    }
    
    statusBadges += '<span class="badge badge-closed" id="openClosedBadge">Closed</span>';
    
    const taglineDisplay = listing.tagline ? `<p class="text-gray-600 italic mb-2">"${escapeHtml(listing.tagline)}"</p>` : '';
    
    // Address section
    let addressSection = '';
    if (listing.address || listing.city || listing.state) {
        const addressParts = [];
        if (listing.address) addressParts.push(escapeHtml(listing.address));
        if (listing.city && listing.state) {
            addressParts.push(`${escapeHtml(listing.city)}, ${escapeHtml(listing.state)}${listing.zip_code ? ' ' + escapeHtml(listing.zip_code) : ''}`);
        }
        
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
    
    let directionsButton = '';
    if (listing.address || listing.city) {
        const destination = listing.address 
            ? `${listing.address}, ${listing.city}, ${listing.state} ${listing.zip_code || ''}`.trim()
            : `${listing.business_name}, ${listing.city}, ${listing.state}`;
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
        'CAROUSEL_CONTROLS': carouselControls,
        'SUBCATEGORIES_TAGS': subcategoriesTags,
        'STATUS_BADGES': statusBadges,
        'TAGLINE_DISPLAY': taglineDisplay,
        'ADDRESS_SECTION': addressSection,
        'PHONE_SECTION': phoneSection,
        'EMAIL_SECTION': emailSection,
        'WEBSITE_SECTION': websiteSection,
        'HOURS_SECTION': hoursSection,
        'PHONE_BUTTON': phoneButton,
        'EMAIL_BUTTON': emailButton,
        'WEBSITE_BUTTON': websiteButton,
        'DIRECTIONS_BUTTON': directionsButton
    };
}
// ============================================
// ADMIN PORTAL - PART 8
// Generate Template Replacements Part 2 & Page Generation
// ============================================

// Copyright (C) The Greek Directory, 2025-present. All rights reserved.

function generateTemplateReplacementsPart2(listing) {
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
    
    const socialMediaSection = generateSocialMediaSection(listing);
    const reviewSection = generateReviewSection(listing);
    
    let mapSection = '';
    if (listing.coordinates && listing.coordinates.lat && listing.coordinates.lng) {
        mapSection = `
            <div>
                <h2 class="text-xl font-bold text-gray-900 mb-3">Location</h2>
                <div id="listingMap"></div>
            </div>
        `;
    }
    
    let claimButton = '';
    const isClaimed = owner && owner.owner_user_id;
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
    const coordinates = listing.coordinates ? `${listing.coordinates.lat},${listing.coordinates.lng}` : '';
    const fullAddress = [listing.address, listing.city, listing.state, listing.zip_code].filter(Boolean).join(', ');
    const hoursJson = listing.hours ? JSON.stringify(listing.hours) : 'null';
    
    return {
        'OWNER_INFO_SECTION': ownerInfoSection,
        'SOCIAL_MEDIA_SECTION': socialMediaSection,
        'REVIEW_SECTION': reviewSection,
        'MAP_SECTION': mapSection,
        'CLAIM_BUTTON': claimButton,
        'HOURS_SCHEMA': hoursSchema,
        'COORDINATES': coordinates,
        'FULL_ADDRESS': fullAddress,
        'HOURS_JSON': hoursJson
    };
}

// Copyright (C) The Greek Directory, 2025-present. All rights reserved.

window.generateListingPage = async function(listingId) {
    try {
        const listing = allListings.find(l => l.id === listingId);
        if (!listing) {
            console.error('Listing not found');
            return;
        }
        
        console.log('📄 Generating page for:', listing.business_name);
        
        const defaultImage = CATEGORY_DEFAULT_IMAGES[listing.category];
        
        if (!listing.logo && defaultImage) {
            listing.logo = `${defaultImage}?w=200&h=200&fit=crop&q=80`;
        }
        
        if (!listing.photos || listing.photos.length === 0) {
            listing.photos = [`${defaultImage}?w=800&q=80`];
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
        
        const categorySlug = listing.category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const filePath = `listing/${categorySlug}/${listing.slug}.html`;
        
        await saveToGitHub(filePath, template, listing.business_name);
        
        await updateSitemap();
        
        console.log('✅ Page generated successfully');
        
    } catch (error) {
        console.error('Error generating page:', error);
        alert('❌ Failed to generate listing page: ' + error.message);
    }
};

async function updateSitemap() {
    try {
        const scriptResponse = await fetch('https://raw.githubusercontent.com/thegreekdirectory/listings/main/generate-sitemap.js');
        if (!scriptResponse.ok) {
            throw new Error('Failed to fetch sitemap generator script');
        }
        
        const scriptContent = await scriptResponse.text();
        
        const { data: listings, error } = await adminSupabase
            .from('listings')
            .select('*')
            .eq('visible', true);
        
        if (error) throw error;
        
        const database = { listings: listings || [] };
        
        const now = new Date().toISOString().split('T')[0];
        const baseUrl = 'https://listings.thegreekdirectory.org';
        
        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
`;
        
        const places = new Set();
        const usStates = new Set();
        
        database.listings.forEach(listing => {
            if (listing.visible !== false) {
                if (listing.city && listing.state && (listing.country || 'USA') === 'USA') {
                    const citySlug = listing.city.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                    const stateSlug = listing.state.toLowerCase();
                    places.add(`${stateSlug}/${citySlug}`);
                    usStates.add(stateSlug);
                }
            }
        });
        
        usStates.forEach(state => {
            xml += `  <url>
    <loc>${baseUrl}/places/usa/${state}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
`;
        });
        
        places.forEach(place => {
            xml += `  <url>
    <loc>${baseUrl}/places/usa/${place}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
        });
        
        const categories = new Set();
        database.listings.forEach(listing => {
            if (listing.visible !== false && listing.category) {
                categories.add(listing.category);
            }
        });
        
        categories.forEach(category => {
            const categorySlug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            xml += `  <url>
    <loc>${baseUrl}/listings/${categorySlug}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;
        });
        
        database.listings.forEach(listing => {
            if (listing.visible !== false) {
                const categorySlug = listing.category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                const listingSlug = listing.slug;
                const lastMod = listing.updated_at ? 
                    listing.updated_at.split('T')[0] : now;
                
                xml += `  <url>
    <loc>${baseUrl}/listing/${categorySlug}/${listingSlug}</loc>
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

window.generateAllListingPages = async function() {
    const visibleListings = allListings.filter(l => l.visible);
    
    console.log(`🔨 Generating ${visibleListings.length} listing pages...`);
    
    let successful = 0;
    let failed = 0;
    
    for (const listing of visibleListings) {
        try {
            await generateListingPage(listing.id);
            successful++;
            console.log(`✅ Generated: ${listing.business_name}`);
            
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
            console.error(`❌ Failed: ${listing.business_name}`, error);
            failed++;
        }
    }
    
    alert(`Generation complete!\n\nSuccessful: ${successful}\nFailed: ${failed}`);
};

function addGenerateAllButton() {
    const container = document.querySelector('.max-w-7xl.mx-auto.px-4.py-6 .mb-6');
    if (!container) return;
    
    const existingBtn = document.getElementById('generateAllBtn');
    if (existingBtn) return;
    
    const button = document.createElement('button');
    button.id = 'generateAllBtn';
    button.className = 'px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700';
    button.textContent = '🔨 Generate All Pages';
    button.onclick = generateAllListingPages;
    
    container.appendChild(button);
}

setTimeout(addGenerateAllButton, 100);

window.generateListingPage = generateListingPage;
window.generateAllListingPages = generateAllListingPages;

// Copyright (C) The Greek Directory, 2025-present. All rights reserved. This source code is proprietary and no part may not be used, reproduced, or distributed without written permission from The Greek Directory. Unauthorized use, copying, modification, or distribution of this code will result in legal action to the fullest extent permitted by law.
