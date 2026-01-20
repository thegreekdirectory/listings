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
    
    if (country === 'USA' && digits.length === 10) {
        return `(${digits.substr(0, 3)}) ${digits.substr(3, 3)}-${digits.substr(6, 4)}`;
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
                placeholder="${country === 'USA' ? '(555) 123-4567' : 'Phone number'}"
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
    
    if (country === 'USA') {
        if (value.length >= 6) {
            input.value = `(${value.substr(0, 3)}) ${value.substr(3, 3)}-${value.substr(6)}`;
        } else if (value.length >= 3) {
            input.value = `(${value.substr(0, 3)}) ${value.substr(3)}`;
        } else {
            input.value = value;
        }
    } else {
        input.value = value;
    }
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

// ============================================
// ADMIN PORTAL - UPDATED TABLE RENDERING
// Include Generate Page button in actions
// ============================================

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
        const listingUrl = `/listings/${categorySlug}/${l.slug}`;
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
// Edit Listing & Form Management
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
    
    const phoneContainer = document.getElementById('editPhoneContainer');
    if (phoneContainer) {
        phoneContainer.innerHTML = createPhoneInput(listing?.phone || '', userCountry);
    }
    
    const ownerPhoneContainer = document.getElementById('editOwnerPhoneContainer');
    if (ownerPhoneContainer) {
        ownerPhoneContainer.innerHTML = createPhoneInput(owner?.owner_phone || '', userCountry);
    }
    
    updateSubcategoriesForCategory();
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
        
        alert('Listing saved successfully!');
        document.getElementById('editModal').classList.add('hidden');
        await loadListings();
        
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
window.toggleVisibility = toggleVisibility;
window.updateSubcategoriesForCategory = updateSubcategoriesForCategory;
window.toggleSubcategory = toggleSubcategory;
window.setPrimarySubcategory = setPrimarySubcategory;
window.toggleChainFields = toggleChainFields;
window.checkSlugAvailability = checkSlugAvailability;
// ============================================
// ADMIN PORTAL - PART 5
// CSV Upload Functionality
// ============================================

window.uploadCSV = function() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = handleCSVUpload;
    input.click();
};

async function handleCSVUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async function(e) {
        const text = e.target.result;
        const rows = parseCSV(text);
        
        if (rows.length === 0) {
            alert('No data found in CSV');
            return;
        }
        
        const headers = rows[0];
        const data = rows.slice(1);
        
        if (!confirm(`Upload ${data.length} listings from CSV?\n\nThis will create new listings.`)) {
            return;
        }
        
        let successful = 0;
        let failed = 0;
        
        for (let row of data) {
            try {
                const listing = parseCSVRow(headers, row);
                
                const { error } = await adminSupabase
                    .from('listings')
                    .insert(listing);
                
                if (error) throw error;
                
                successful++;
            } catch (error) {
                console.error('Failed to upload row:', error);
                failed++;
            }
        }
        
        alert(`Upload complete!\n\nSuccessful: ${successful}\nFailed: ${failed}`);
        await loadListings();
    };
    
    reader.readAsText(file);
}

function parseCSV(text) {
    const lines = text.split('\n');
    const result = [];
    
    for (let line of lines) {
        if (!line.trim()) continue;
        
        const row = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                row.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        row.push(current.trim());
        result.push(row);
    }
    
    return result;
}

function parseCSVRow(headers, row) {
    const listing = {
        visible: true,
        verified: false,
        tier: 'FREE'
    };
    
    headers.forEach((header, index) => {
        const value = row[index] ? row[index].trim() : '';
        
        switch (header.toLowerCase()) {
            case 'business_name':
            case 'businessname':
            case 'name':
                listing.business_name = value;
                listing.slug = value.toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-|-$/g, '');
                break;
            case 'tagline':
                listing.tagline = value.substring(0, 75);
                break;
            case 'description':
                listing.description = value;
                break;
            case 'category':
                listing.category = value;
                break;
            case 'subcategories':
                if (value) {
                    listing.subcategories = value.split('|').map(s => s.trim());
                    listing.primary_subcategory = listing.subcategories[0];
                }
                break;
            case 'phone':
                listing.phone = value;
                break;
            case 'email':
                listing.email = value;
                break;
            case 'website':
                listing.website = value;
                break;
            case 'address':
                listing.address = value;
                break;
            case 'city':
                listing.city = value;
                break;
            case 'state':
                listing.state = value;
                break;
            case 'zip_code':
            case 'zipcode':
            case 'zip':
                listing.zip_code = value;
                break;
            case 'country':
                listing.country = value || 'USA';
                break;
            case 'tier':
                if (['FREE', 'VERIFIED', 'FEATURED', 'PREMIUM'].includes(value.toUpperCase())) {
                    listing.tier = value.toUpperCase();
                    listing.verified = listing.tier !== 'FREE';
                }
                break;
            case 'logo':
                listing.logo = value;
                break;
            case 'photos':
                if (value) {
                    listing.photos = value.split('|').map(s => s.trim());
                }
                break;
        }
    });
    
    if (!listing.business_name) {
        throw new Error('Business name is required');
    }
    
    if (!listing.category) {
        throw new Error('Category is required');
    }
    
    return listing;
}

function addCSVUploadButton() {
    const container = document.querySelector('.max-w-7xl.mx-auto.px-4.py-6 .mb-6');
    if (!container) return;
    
    const existingBtn = document.getElementById('csvUploadBtn');
    if (existingBtn) return;
    
    const button = document.createElement('button');
    button.id = 'csvUploadBtn';
    button.className = 'px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700';
    button.textContent = '📁 Upload CSV';
    button.onclick = uploadCSV;
    
    container.insertBefore(button, container.children[1]);
}

setTimeout(addCSVUploadButton, 100);

window.uploadCSV = uploadCSV;
// ============================================
// ADMIN PORTAL - PAGE GENERATION PART 1
// ADD THIS TO END OF admin.js (after all existing code)
// ============================================

// Category default images mapping
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

async function generateListingPage(listing) {
    try {
        console.log('📄 Generating page for:', listing.business_name);
        
        // Fetch template
        const templateResponse = await fetch('https://raw.githubusercontent.com/thegreekdirectory/listings/main/listing-template.html');
        if (!templateResponse.ok) {
            throw new Error('Failed to fetch template');
        }
        
        let template = await templateResponse.text();
        
        // Apply default images if needed
        const defaultImage = CATEGORY_DEFAULT_IMAGES[listing.category];
        
        if (!listing.logo && defaultImage) {
            listing.logo = `${defaultImage}?w=200&h=200&fit=crop&q=80`;
        }
        
        if (!listing.photos || listing.photos.length === 0) {
            listing.photos = [`${defaultImage}?w=800&q=80`];
        }
        
        // Generate all replacements
        const replacements = generateTemplateReplacements(listing);
        
        // Replace all placeholders
        Object.keys(replacements).forEach(key => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            template = template.replace(regex, replacements[key]);
        });
        
        // Save to GitHub
        const categorySlug = listing.category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const filePath = `listings/${categorySlug}/${listing.slug}.html`;
        
        const success = await saveToGitHub(filePath, template, listing.business_name);
        
        if (success) {
            console.log('✅ Page generated successfully');
            return true;
        } else {
            console.error('❌ Failed to save page to GitHub');
            return false;
        }
        
    } catch (error) {
        console.error('Error generating page:', error);
        return false;
    }
}

function generateTemplateReplacements(listing) {
    const categorySlug = listing.category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const listingUrl = `https://listings.thegreekdirectory.org/listings/${categorySlug}/${listing.slug}`;
    
    const cityState = listing.city && listing.state ? ` in ${listing.city}, ${listing.state}` : '';
    const inCity = listing.city ? ` in ${listing.city}` : '';
    
    return {
        'BUSINESS_NAME': escapeHtml(listing.business_name),
        'BUSINESS_NAME_ENCODED': encodeURIComponent(listing.business_name),
        'CITY_STATE': cityState,
        'IN_CITY': inCity,
        'TAGLINE': escapeHtml(listing.tagline || ''),
        'DESCRIPTION': escapeHtml(listing.description || ''),
        'CATEGORY': escapeHtml(listing.category),
        'LISTING_URL': listingUrl,
        'LOGO': listing.logo || '',
        'ADDRESS': escapeHtml(listing.address || ''),
        'CITY': escapeHtml(listing.city || ''),
        'STATE': escapeHtml(listing.state || ''),
        'ZIP_CODE': escapeHtml(listing.zip_code || ''),
        'COUNTRY': escapeHtml(listing.country || 'USA'),
        'PHONE': listing.phone || '',
        'EMAIL': listing.email || '',
        'WEBSITE': listing.website || '',
        
        'PHOTOS_SLIDES': generatePhotoSlides(listing),
        'CAROUSEL_CONTROLS': generateCarouselControls(listing),
        'SUBCATEGORIES_TAGS': generateSubcategoryTags(listing),
        'STATUS_BADGES': generateStatusBadges(listing),
        'TAGLINE_DISPLAY': listing.tagline ? `<p class="text-gray-600 italic mb-2">"${escapeHtml(listing.tagline)}"</p>` : '',
        
        'ADDRESS_SECTION': generateAddressSection(listing),
        'PHONE_SECTION': generatePhoneSection(listing),
        'EMAIL_SECTION': generateEmailSection(listing),
        'WEBSITE_SECTION': generateWebsiteSection(listing),
        'HOURS_SECTION': generateHoursSection(listing),
        
        'PHONE_BUTTON': generatePhoneButton(listing),
        'EMAIL_BUTTON': generateEmailButton(listing),
        'WEBSITE_BUTTON': generateWebsiteButton(listing),
        'DIRECTIONS_BUTTON': generateDirectionsButton(listing),
        
        'OWNER_INFO_SECTION': generateOwnerInfoSection(listing),
        'SOCIAL_MEDIA_SECTION': generateSocialMediaSection(listing),
        'REVIEW_SECTION': generateReviewSection(listing),
        'MAP_SECTION': generateMapSection(listing),
        'CLAIM_BUTTON': listing.show_claim_button ? generateClaimButton() : '',
        
        'HOURS_SCHEMA': generateHoursSchema(listing)
    };
}

function generatePhotoSlides(listing) {
    const photos = listing.photos || [];
    if (photos.length === 0) return '';
    
    return photos.map((photo, index) => `
        <div class="carousel-slide ${index === 0 ? 'active' : ''}" style="background-image: url('${photo}')"></div>
    `).join('');
}

function generateCarouselControls(listing) {
    const photos = listing.photos || [];
    if (photos.length <= 1) return '';
    
    return `
        <button class="carousel-btn prev" onclick="changeSlide(-1)">❮</button>
        <button class="carousel-btn next" onclick="changeSlide(1)">❯</button>
        <div class="carousel-dots">
            ${photos.map((_, index) => `
                <span class="dot ${index === 0 ? 'active' : ''}" onclick="goToSlide(${index})"></span>
            `).join('')}
        </div>
    `;
}

function generateSubcategoryTags(listing) {
    if (!listing.subcategories || listing.subcategories.length === 0) return '';
    
    return listing.subcategories.map(sub => {
        const isPrimary = sub === listing.primary_subcategory;
        return `<span class="text-xs px-2 py-1 rounded ${isPrimary ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-700'}">${escapeHtml(sub)}</span>`;
    }).join(' ');
}

function generateStatusBadges(listing) {
    const badges = [];
    
    if (listing.tier === 'PREMIUM') {
        badges.push('<span class="text-xs px-2 py-1 rounded bg-purple-100 text-purple-800">👑 Premium</span>');
        badges.push('<span class="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800">⭐ Featured</span>');
        badges.push('<span class="text-xs px-2 py-1 rounded bg-green-100 text-green-800">✓ Verified</span>');
    } else if (listing.tier === 'FEATURED') {
        badges.push('<span class="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800">⭐ Featured</span>');
        badges.push('<span class="text-xs px-2 py-1 rounded bg-green-100 text-green-800">✓ Verified</span>');
    } else if (listing.tier === 'VERIFIED') {
        badges.push('<span class="text-xs px-2 py-1 rounded bg-green-100 text-green-800">✓ Verified</span>');
    }
    
    if (listing.is_chain) {
        badges.push('<span class="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">🔗 Chain</span>');
    }
    
    return badges.join(' ');
}

function generateAddressSection(listing) {
    if (!listing.address && !listing.city) return '';
    
    const parts = [];
    if (listing.address) parts.push(listing.address);
    if (listing.city) parts.push(listing.city);
    if (listing.state) parts.push(listing.state);
    if (listing.zip_code) parts.push(listing.zip_code);
    
    return `
        <div class="flex items-start gap-2">
            <span class="text-gray-600">📍</span>
            <span class="text-gray-700">${escapeHtml(parts.join(', '))}</span>
        </div>
    `;
}

function generatePhoneSection(listing) {
    if (!listing.phone) return '';
    
    const formatted = formatPhoneForDisplay(listing.phone);
    return `
        <div class="flex items-start gap-2">
            <span class="text-gray-600">📞</span>
            <a href="tel:${listing.phone}" class="text-blue-600 hover:underline">${formatted}</a>
        </div>
    `;
}

function generateEmailSection(listing) {
    if (!listing.email) return '';
    
    return `
        <div class="flex items-start gap-2">
            <span class="text-gray-600">✉️</span>
            <a href="mailto:${listing.email}" class="text-blue-600 hover:underline">${escapeHtml(listing.email)}</a>
        </div>
    `;
}

function generateWebsiteSection(listing) {
    if (!listing.website) return '';
    
    let displayUrl = listing.website.replace(/^https?:\/\//, '').replace(/\/$/, '');
    
    return `
        <div class="flex items-start gap-2">
            <span class="text-gray-600">🌐</span>
            <a href="${listing.website}" target="_blank" rel="noopener" class="text-blue-600 hover:underline">${escapeHtml(displayUrl)}</a>
        </div>
    `;
}

function generateHoursSection(listing) {
    if (!listing.hours || Object.keys(listing.hours).length === 0) return '';
    
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    return `
        <div class="border-t pt-3">
            <h3 class="font-semibold text-gray-900 mb-2">Hours</h3>
            <div class="space-y-1 text-sm">
                ${dayKeys.map((key, index) => {
                    const hours = listing.hours[key] || 'Closed';
                    return `<div class="flex justify-between"><span>${days[index]}:</span><span class="text-gray-600">${escapeHtml(hours)}</span></div>`;
                }).join('')}
            </div>
        </div>
    `;
}

function generatePhoneButton(listing) {
    if (!listing.phone) return '';
    return `<a href="tel:${listing.phone}" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"><span>📞</span><span>Call</span></a>`;
}

function generateEmailButton(listing) {
    if (!listing.email) return '';
    return `<a href="mailto:${listing.email}" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"><span>✉️</span><span>Email</span></a>`;
}

function generateWebsiteButton(listing) {
    if (!listing.website) return '';
    return `<a href="${listing.website}" target="_blank" rel="noopener" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"><span>🌐</span><span>Website</span></a>`;
}

function generateDirectionsButton(listing) {
    if (!listing.address && !listing.city) return '';
    
    const query = listing.address ? `${listing.address}, ${listing.city}, ${listing.state}` : `${listing.business_name}, ${listing.city}, ${listing.state}`;
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
    
    return `<a href="${mapsUrl}" target="_blank" rel="noopener" class="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2"><span>🗺️</span><span>Directions</span></a>`;
}

function formatPhoneForDisplay(phone) {
    if (!phone) return '';
    
    const digits = phone.replace(/\D/g, '');
    
    if (phone.startsWith('+1') && digits.length === 11) {
        const usDigits = digits.substr(1);
        return `(${usDigits.substr(0, 3)}) ${usDigits.substr(3, 3)}-${usDigits.substr(6, 4)}`;
    }
    
    if (digits.length === 10) {
        return `(${digits.substr(0, 3)}) ${digits.substr(3, 3)}-${digits.substr(6, 4)}`;
    }
    
    return phone;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
// ============================================
// ADMIN PORTAL - PART 6
// Generate Listing Pages Functionality
// ============================================

window.generateListingPage = async function(listingId) {
    try {
        const listing = allListings.find(l => l.id === listingId);
        if (!listing) {
            alert('Listing not found');
            return;
        }
        
        if (!confirm(`Generate static HTML page for "${listing.business_name}"?\n\nThis will create/update the listing page.`)) {
            return;
        }
        
        // Fetch the template
        const templateResponse = await fetch('https://raw.githubusercontent.com/thegreekdirectory/listings/main/listing-template.html');
        if (!templateResponse.ok) {
            throw new Error('Failed to fetch template');
        }
        
        let template = await templateResponse.text();
        
        // Replace template variables
        const categorySlug = listing.category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const listingUrl = `https://listings.thegreekdirectory.org/listings/${categorySlug}/${listing.slug}`;
        
        // Basic replacements
        template = template.replace(/{{BUSINESS_NAME}}/g, listing.business_name);
        template = template.replace(/{{TAGLINE}}/g, listing.tagline || '');
        template = template.replace(/{{LISTING_URL}}/g, listingUrl);
        template = template.replace(/{{BUSINESS_NAME_ENCODED}}/g, encodeURIComponent(listing.business_name));
        template = template.replace(/{{CATEGORY}}/g, listing.category);
        template = template.replace(/{{LOGO}}/g, listing.logo || '');
        template = template.replace(/{{DESCRIPTION}}/g, listing.description || '');
        
        // City/State
        if (listing.city && listing.state) {
            template = template.replace(/{{CITY_STATE}}/g, ` in ${listing.city}, ${listing.state}`);
            template = template.replace(/{{IN_CITY}}/g, ` in ${listing.city}, ${listing.state}`);
        } else {
            template = template.replace(/{{CITY_STATE}}/g, '');
            template = template.replace(/{{IN_CITY}}/g, '');
        }
        
        // Address components
        template = template.replace(/{{ADDRESS}}/g, listing.address || '');
        template = template.replace(/{{CITY}}/g, listing.city || '');
        template = template.replace(/{{STATE}}/g, listing.state || '');
        template = template.replace(/{{ZIP_CODE}}/g, listing.zip_code || '');
        template = template.replace(/{{COUNTRY}}/g, listing.country || 'USA');
        template = template.replace(/{{PHONE}}/g, listing.phone || '');
        
        // Status badges
        let statusBadges = '';
        if (listing.tier === 'PREMIUM') {
            statusBadges += '<span class="text-sm font-semibold px-3 py-1 rounded-full bg-yellow-100 text-yellow-800">⭐ Featured</span>';
            statusBadges += '<span class="text-sm font-semibold px-3 py-1 rounded-full bg-blue-100 text-blue-800 ml-2">✓ Verified</span>';
        } else if (listing.tier === 'FEATURED') {
            statusBadges += '<span class="text-sm font-semibold px-3 py-1 rounded-full bg-yellow-100 text-yellow-800">⭐ Featured</span>';
        } else if (listing.tier === 'VERIFIED') {
            statusBadges += '<span class="text-sm font-semibold px-3 py-1 rounded-full bg-blue-100 text-blue-800">✓ Verified</span>';
        }
        
        if (listing.is_chain) {
            statusBadges += '<span class="text-sm font-semibold px-3 py-1 rounded-full bg-purple-100 text-purple-800 ml-2">🔗 Chain</span>';
        }
        
        template = template.replace(/{{STATUS_BADGES}}/g, statusBadges);
        
        // Subcategories
        let subcategoriesTags = '';
        if (listing.subcategories && listing.subcategories.length > 0) {
            subcategoriesTags = listing.subcategories.map(sub => {
                const isPrimary = sub === listing.primary_subcategory;
                return `<span class="text-xs font-medium px-2 py-1 rounded-full ${isPrimary ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-700'}">${sub}</span>`;
            }).join('');
        }
        template = template.replace(/{{SUBCATEGORIES_TAGS}}/g, subcategoriesTags);
        
        // Tagline display
        let taglineDisplay = '';
        if (listing.tagline) {
            taglineDisplay = `<p class="text-gray-600 italic mb-2">"${listing.tagline}"</p>`;
        }
        template = template.replace(/{{TAGLINE_DISPLAY}}/g, taglineDisplay);
        
        // Photos/carousel
        const photos = listing.photos || [];
        let photosSlides = '';
        let carouselControls = '';
        
        if (photos.length > 0) {
            photosSlides = photos.map((photo, index) => 
                `<img src="${photo}" alt="Photo ${index + 1}" class="carousel-slide ${index === 0 ? 'active' : ''}" data-index="${index}">`
            ).join('');
            
            if (photos.length > 1) {
                carouselControls = `
                    <button class="carousel-prev" onclick="changeSlide(-1)">❮</button>
                    <button class="carousel-next" onclick="changeSlide(1)">❯</button>
                    <div class="carousel-dots">
                        ${photos.map((_, index) => 
                            `<span class="dot ${index === 0 ? 'active' : ''}" onclick="goToSlide(${index})"></span>`
                        ).join('')}
                    </div>
                `;
            }
        } else if (listing.logo) {
            photosSlides = `<img src="${listing.logo}" alt="${listing.business_name} logo" class="carousel-slide active">`;
        }
        
        template = template.replace(/{{PHOTOS_SLIDES}}/g, photosSlides);
        template = template.replace(/{{CAROUSEL_CONTROLS}}/g, carouselControls);
        
        // Contact sections
        let addressSection = '';
        if (listing.address || listing.city || listing.state) {
            const addressParts = [];
            if (listing.address) addressParts.push(listing.address);
            if (listing.city && listing.state) addressParts.push(`${listing.city}, ${listing.state} ${listing.zip_code || ''}`.trim());
            
            addressSection = `
                <div class="flex items-start gap-2 text-sm">
                    <span class="text-gray-600">📍</span>
                    <span class="text-gray-700">${addressParts.join(', ')}</span>
                </div>
            `;
        }
        template = template.replace(/{{ADDRESS_SECTION}}/g, addressSection);
        
        let phoneSection = '';
        if (listing.phone) {
            phoneSection = `
                <div class="flex items-start gap-2 text-sm">
                    <span class="text-gray-600">📞</span>
                    <a href="tel:${listing.phone}" class="text-blue-600 hover:underline" onclick="trackClick('call')">${formatPhoneNumber(listing.phone)}</a>
                </div>
            `;
        }
        template = template.replace(/{{PHONE_SECTION}}/g, phoneSection);
        
        let emailSection = '';
        if (listing.email) {
            emailSection = `
                <div class="flex items-start gap-2 text-sm">
                    <span class="text-gray-600">✉️</span>
                    <a href="mailto:${listing.email}" class="text-blue-600 hover:underline" onclick="trackClick('email')">${listing.email}</a>
                </div>
            `;
        }
        template = template.replace(/{{EMAIL_SECTION}}/g, emailSection);
        
        let websiteSection = '';
        if (listing.website) {
            websiteSection = `
                <div class="flex items-start gap-2 text-sm">
                    <span class="text-gray-600">🌐</span>
                    <a href="${listing.website}" target="_blank" rel="noopener" class="text-blue-600 hover:underline" onclick="trackClick('website')">${new URL(listing.website).hostname}</a>
                </div>
            `;
        }
        template = template.replace(/{{WEBSITE_SECTION}}/g, websiteSection);
        
        // Hours section
        let hoursSection = '';
        if (listing.hours && Object.keys(listing.hours).some(day => listing.hours[day])) {
            const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
            const today = new Date().getDay();
            const todayIndex = today === 0 ? 6 : today - 1;
            
            const hoursRows = days.map((day, index) => {
                const dayKey = day.toLowerCase();
                const hours = listing.hours[dayKey] || 'Closed';
                const isToday = index === todayIndex;
                
                return `
                    <div class="flex justify-between py-2 border-b ${isToday ? 'font-bold' : ''}">
                        <span>${day}${isToday ? ' (Today)' : ''}</span>
                        <span>${hours}</span>
                    </div>
                `;
            }).join('');
            
            hoursSection = `
                <div class="mb-4">
                    <h3 class="font-bold text-gray-900 mb-2">Hours</h3>
                    <div class="space-y-1 text-sm">
                        ${hoursRows}
                    </div>
                </div>
            `;
        }
        template = template.replace(/{{HOURS_SECTION}}/g, hoursSection);
        
        // Action buttons
        let phoneButton = '';
        if (listing.phone) {
            phoneButton = `
                <a href="tel:${listing.phone}" class="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg text-center font-medium hover:bg-green-700" onclick="trackClick('call')">
                    📞 Call
                </a>
            `;
        }
        template = template.replace(/{{PHONE_BUTTON}}/g, phoneButton);
        
        let emailButton = '';
        if (listing.email) {
            emailButton = `
                <a href="mailto:${listing.email}" class="flex-1 py-3 px-4 rounded-lg text-center font-medium border-2 hover:bg-gray-50" style="border-color:#055193;color:#055193;" onclick="trackClick('email')">
                    ✉️ Email
                </a>
            `;
        }
        template = template.replace(/{{EMAIL_BUTTON}}/g, emailButton);
        
        let websiteButton = '';
        if (listing.website) {
            websiteButton = `
                <a href="${listing.website}" target="_blank" rel="noopener" class="flex-1 text-white py-3 px-4 rounded-lg text-center font-medium hover:opacity-90" style="background-color:#055193;" onclick="trackClick('website')">
                    🌐 Website
                </a>
            `;
        }
        template = template.replace(/{{WEBSITE_BUTTON}}/g, websiteButton);
        
        let directionsButton = '';
        if (listing.address || listing.places_url_ending) {
            const mapsUrl = listing.places_url_ending 
                ? `https://www.google.com/maps/place/?q=place_id:${listing.places_url_ending}`
                : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(listing.address || listing.business_name)}`;
            
            directionsButton = `
                <a href="${mapsUrl}" target="_blank" rel="noopener" class="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg text-center font-medium hover:bg-blue-700" onclick="trackClick('directions')">
                    🗺️ Directions
                </a>
            `;
        }
        template = template.replace(/{{DIRECTIONS_BUTTON}}/g, directionsButton);
        
        // Owner info section
        let ownerInfoSection = '';
        const owner = listing.owner && listing.owner.length > 0 ? listing.owner[0] : null;
        
        if (owner && (owner.full_name || owner.title || owner.from_greece || 
            (owner.email_visible && owner.owner_email) || 
            (owner.phone_visible && owner.owner_phone))) {
            
            let ownerDetails = '';
            
            if (owner.full_name) {
                ownerDetails += `<div class="text-sm"><span class="font-semibold">Name:</span> ${owner.full_name}</div>`;
            }
            if (owner.title) {
                ownerDetails += `<div class="text-sm"><span class="font-semibold">Title:</span> ${owner.title}</div>`;
            }
            if (owner.from_greece) {
                ownerDetails += `<div class="text-sm"><span class="font-semibold">From:</span> ${owner.from_greece}, Greece</div>`;
            }
            if (owner.email_visible && owner.owner_email) {
                ownerDetails += `<div class="text-sm"><span class="font-semibold">Email:</span> <a href="mailto:${owner.owner_email}" class="text-blue-600 hover:underline">${owner.owner_email}</a></div>`;
            }
            if (owner.phone_visible && owner.owner_phone) {
                ownerDetails += `<div class="text-sm"><span class="font-semibold">Phone:</span> <a href="tel:${owner.owner_phone}" class="text-blue-600 hover:underline">${formatPhoneNumber(owner.owner_phone)}</a></div>`;
            }
            
            ownerInfoSection = `
                <div class="mb-4 p-4 rounded-lg" style="background-color:#f0f9ff;">
                    <h3 class="font-bold text-gray-900 mb-2">Owner Information</h3>
                    <div class="space-y-1">
                        ${ownerDetails}
                    </div>
                </div>
            `;
        }
        template = template.replace(/{{OWNER_INFO_SECTION}}/g, ownerInfoSection);
        
        // Social media section
        let socialMediaSection = '';
        const socialMedia = listing.social_media || {};
        const hasSocial = Object.values(socialMedia).some(v => v);
        
        if (hasSocial) {
            let socialIcons = '';
            
            if (socialMedia.facebook) {
                socialIcons += `<a href="https://facebook.com/${socialMedia.facebook}" target="_blank" rel="noopener" class="text-blue-600 hover:text-blue-800" onclick="trackClick('social', 'facebook')">📘 Facebook</a>`;
            }
            if (socialMedia.instagram) {
                socialIcons += `<a href="https://instagram.com/${socialMedia.instagram}" target="_blank" rel="noopener" class="text-pink-600 hover:text-pink-800" onclick="trackClick('social', 'instagram')">📷 Instagram</a>`;
            }
            if (socialMedia.twitter) {
                socialIcons += `<a href="https://twitter.com/${socialMedia.twitter}" target="_blank" rel="noopener" class="text-blue-400 hover:text-blue-600" onclick="trackClick('social', 'twitter')">𝕏 Twitter</a>`;
            }
            if (socialMedia.youtube) {
                socialIcons += `<a href="https://youtube.com/${socialMedia.youtube}" target="_blank" rel="noopener" class="text-red-600 hover:text-red-800" onclick="trackClick('social', 'youtube')">▶️ YouTube</a>`;
            }
            if (socialMedia.tiktok) {
                socialIcons += `<a href="https://tiktok.com/@${socialMedia.tiktok}" target="_blank" rel="noopener" class="text-black hover:text-gray-700" onclick="trackClick('social', 'tiktok')">♪ TikTok</a>`;
            }
            if (socialMedia.linkedin) {
                socialIcons += `<a href="${socialMedia.linkedin}" target="_blank" rel="noopener" class="text-blue-700 hover:text-blue-900" onclick="trackClick('social', 'linkedin')">💼 LinkedIn</a>`;
            }
            
            if (socialIcons) {
                socialMediaSection = `
                    <div class="mb-4">
                        <h3 class="font-bold text-gray-900 mb-2">Social Media</h3>
                        <div class="flex flex-wrap gap-3 text-sm">
                            ${socialIcons}
                        </div>
                    </div>
                `;
            }
        }
        template = template.replace(/{{SOCIAL_MEDIA_SECTION}}/g, socialMediaSection);
        
        // Review section
        let reviewSection = '';
        const reviews = listing.reviews || {};
        const hasReviews = Object.values(reviews).some(v => v);
        
        if (hasReviews) {
            let reviewLinks = '';
            
            if (reviews.google) {
                reviewLinks += `<a href="${reviews.google}" target="_blank" rel="noopener" class="inline-block px-4 py-2 bg-white border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 text-sm font-medium">⭐ Google Reviews</a>`;
            }
            if (reviews.yelp) {
                reviewLinks += `<a href="${reviews.yelp}" target="_blank" rel="noopener" class="inline-block px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium">Yelp Reviews</a>`;
            }
            if (reviews.tripadvisor) {
                reviewLinks += `<a href="${reviews.tripadvisor}" target="_blank" rel="noopener" class="inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">TripAdvisor</a>`;
            }
            
            if (reviewLinks) {
                reviewSection = `
                    <div class="mb-4">
                        <h3 class="font-bold text-gray-900 mb-2">Reviews</h3>
                        <div class="flex flex-wrap gap-2">
                            ${reviewLinks}
                        </div>
                    </div>
                `;
            }
        }
        template = template.replace(/{{REVIEW_SECTION}}/g, reviewSection);
        
        // Map section
        let mapSection = '';
        if (listing.coordinates && listing.coordinates.lat && listing.coordinates.lng) {
            mapSection = `
                <div class="mb-4">
                    <h3 class="font-bold text-gray-900 mb-2">Location</h3>
                    <div id="listingMap" class="w-full h-64 rounded-lg bg-gray-200" data-lat="${listing.coordinates.lat}" data-lng="${listing.coordinates.lng}"></div>
                </div>
            `;
        }
        template = template.replace(/{{MAP_SECTION}}/g, mapSection);
        
        // Claim button
        let claimButton = '';
        const isClaimed = owner && owner.owner_user_id;
        
        if (!isClaimed && listing.show_claim_button) {
            claimButton = `
                <div class="mt-6 p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg text-center">
                    <h3 class="font-bold text-gray-900 mb-2">Is this your business?</h3>
                    <p class="text-sm text-gray-700 mb-3">Claim your listing to manage your information and connect with customers.</p>
                    <a href="/business.html" class="inline-block px-6 py-3 text-white rounded-lg font-medium" style="background-color:#055193;">Claim This Listing</a>
                </div>
            `;
        }
        template = template.replace(/{{CLAIM_BUTTON}}/g, claimButton);
        
        // Hours schema for structured data
        let hoursSchema = '[]';
        if (listing.hours && Object.keys(listing.hours).some(day => listing.hours[day])) {
            const schemaHours = [];
            const dayMap = {
                'monday': 'Monday',
                'tuesday': 'Tuesday',
                'wednesday': 'Wednesday',
                'thursday': 'Thursday',
                'friday': 'Friday',
                'saturday': 'Saturday',
                'sunday': 'Sunday'
            };
            
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
            
            if (schemaHours.length > 0) {
                hoursSchema = JSON.stringify(schemaHours);
            }
        }
        template = template.replace(/{{HOURS_SCHEMA}}/g, hoursSchema);
        
        // Data attribute for listing ID
        template = template.replace('<body class="bg-gray-50">', `<body class="bg-gray-50" data-listing-id="${listing.id}">`);
        
        console.log('Generated HTML for:', listing.business_name);
        
        // Now upload to GitHub
        const filePath = `listings/${categorySlug}/${listing.slug}.html`;
        
        // Check if file exists
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
        
        // Upload to GitHub
        const base64Content = btoa(unescape(encodeURIComponent(template)));
        
        const uploadBody = {
            message: `${currentSha ? 'Update' : 'Create'} listing page for ${listing.business_name}`,
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
        
        alert(`✅ Listing page generated successfully!\n\nURL: ${listingUrl}`);
        
    } catch (error) {
        console.error('Error generating listing page:', error);
        alert('❌ Failed to generate listing page: ' + error.message);
    }
};

window.generateAllListingPages = async function() {
    if (!confirm('Generate static HTML pages for ALL listings?\n\nThis may take several minutes.')) {
        return;
    }
    
    const visibleListings = allListings.filter(l => l.visible);
    
    let successful = 0;
    let failed = 0;
    
    for (const listing of visibleListings) {
        try {
            await generateListingPage(listing.id);
            successful++;
            
            // Add small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
            console.error(`Failed to generate page for ${listing.business_name}:`, error);
            failed++;
        }
    }
    
    alert(`Generation complete!\n\nSuccessful: ${successful}\nFailed: ${failed}`);
};

function addGeneratePageButtons() {
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

setTimeout(addGeneratePageButtons, 100);

window.generateListingPage = generateListingPage;
window.generateAllListingPages = generateAllListingPages;
