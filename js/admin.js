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

let supabase = null;
let currentAdminUser = null;
let allListings = [];
let editingListing = null;
let selectedSubcategories = [];
let primarySubcategory = null;

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Initializing Admin Portal...');
    
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Supabase initialized');
    
    await checkAuthState();
    setupEventListeners();
});

async function checkAuthState() {
    const session = await supabase.auth.getSession();
    
    if (session.data.session) {
        currentAdminUser = session.data.session.user;
        
        const { data: adminData } = await supabase
            .from('admin_users')
            .select('*')
            .eq('user_id', currentAdminUser.id)
            .single();
        
        if (adminData) {
            showDashboard();
            await loadListings();
        } else {
            showError('You do not have admin access');
            showLoginPage();
        }
    } else {
        showLoginPage();
    }
}

async function handleAdminLogin() {
    const email = document.getElementById('adminEmail').value.trim();
    const password = document.getElementById('adminPassword').value;
    
    if (!email || !password) {
        showError('Please enter both email and password');
        return;
    }
    
    clearAuthMessage();
    
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) throw error;
        
        currentAdminUser = data.user;
        
        const { data: adminData, error: adminError } = await supabase
            .from('admin_users')
            .select('*')
            .eq('user_id', currentAdminUser.id)
            .single();
        
        if (adminError || !adminData) {
            await supabase.auth.signOut();
            showError('You do not have admin access');
            return;
        }
        
        showSuccess('Login successful!');
        showDashboard();
        await loadListings();
        
    } catch (error) {
        console.error('Login error:', error);
        showError(error.message || 'Login failed');
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
        await supabase.auth.signOut();
        currentAdminUser = null;
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

async function loadListings() {
    try {
        console.log('📥 Loading listings from Supabase...');
        
        const { data: listings, error } = await supabase
            .from('listings')
            .select(`
                *,
                owner:business_owners(*)
            `)
            .order('business_name');
        
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
        (l.city && l.city.toLowerCase().includes(searchTerm))
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
        const isClaimed = ownerInfo && ownerInfo.user_id;
        
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
                ${isClaimed ? '<span class="ml-2 px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">Claimed</span>' : ''}
                ${l.is_chain ? '<span class="ml-2 px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-700">Chain</span>' : ''}
            </td>
            <td class="py-4 px-4 font-medium">${l.business_name}</td>
            <td class="py-4 px-4 text-gray-600">${l.category}</td>
            <td class="py-4 px-4 text-sm text-gray-600">${l.city || ''}, ${l.state || ''}</td>
            <td class="py-4 px-4 text-sm text-gray-600">${new Date(l.updated_at).toLocaleString()}</td>
            <td class="py-4 px-4">
                <div class="flex justify-end gap-2">
                    <button onclick="editListing('${l.id}')" class="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200">Edit</button>
                    <a href="${listingUrl}" target="_blank" class="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">View</a>
                    ${isClaimed ? `<button onclick="sendMagicLink('${l.id}')" class="px-3 py-1 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200">🔗</button>` : ''}
                </div>
            </td>
        </tr>
    `}).join('');
}

window.toggleVisibility = async function(id) {
    try {
        const listing = allListings.find(l => l.id === id);
        const newVisible = !listing.visible;
        
        const { error } = await supabase
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

function setupEventListeners() {
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

window.handleAdminLogin = handleAdminLogin;
window.logout = logout;
window.loadListings = loadListings;
// ============================================
// ADMIN PORTAL - PART 2
// Edit Listing & Form Management
// ============================================

window.editListing = async function(id) {
    try {
        const { data: listing, error } = await supabase
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

window.newListing = function() {
    editingListing = null;
    selectedSubcategories = [];
    primarySubcategory = null;
    document.getElementById('modalTitle').textContent = 'New Listing';
    fillEditForm(null);
    document.getElementById('editModal').classList.remove('hidden');
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
                        <label class="block text-sm font-medium mb-2">Tagline (max 75) *</label>
                        <input type="text" id="editTagline" value="${listing?.tagline || ''}" maxlength="75" class="w-full px-4 py-2 border rounded-lg">
                        <p class="text-xs text-gray-500 mt-1"><span id="taglineCount">${(listing?.tagline || '').length}</span>/75</p>
                    </div>
                    <div class="md:col-span-2">
                        <label class="block text-sm font-medium mb-2">Description *</label>
                        <textarea id="editDescription" rows="5" class="w-full px-4 py-2 border rounded-lg">${listing?.description || ''}</textarea>
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
                        <input type="text" id="editChainId" value="${listing?.chain_id || ''}" class="w-full px-4 py-2 border rounded-lg">
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
                        <input type="tel" id="editPhone" value="${listing?.phone || ''}" class="w-full px-4 py-2 border rounded-lg">
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

            <!-- Owner Info -->
            <div>
                <h3 class="text-lg font-bold mb-4">Owner Information</h3>
                ${owner?.user_id ? '<p class="text-sm text-green-600 mb-4">✓ This listing is claimed</p>' : ''}
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
                        <input type="tel" id="editOwnerPhone" value="${owner?.owner_phone || ''}" class="w-full px-4 py-2 border rounded-lg">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Confirmation Key</label>
                        <input type="text" id="editConfirmationKey" value="${owner?.confirmation_key || ''}" class="w-full px-4 py-2 border rounded-lg" ${owner?.user_id ? 'disabled' : ''}>
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
                </div>
            </div>
        </div>
    `;
    
    updateSubcategoriesForCategory();
    
    // Add input listeners
    document.getElementById('editTagline')?.addEventListener('input', updateCharCounters);
    document.getElementById('editDescription')?.addEventListener('input', updateCharCounters);
}

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
// ADMIN PORTAL - PART 3
// Save Listing & Magic Link
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
        
        const listingData = {
            business_name: businessName,
            tagline: tagline,
            description: document.getElementById('editDescription').value,
            category: document.getElementById('editCategory').value,
            subcategories: selectedSubcategories,
            primary_subcategory: primarySubcategory,
            tier: document.getElementById('editTier').value,
            verified: document.getElementById('editTier').value !== 'FREE',
            is_chain: isChain,
            chain_name: isChain ? chainName : null,
            chain_id: isChain ? document.getElementById('editChainId').value.trim() : null,
            address: document.getElementById('editAddress').value.trim() || null,
            city: document.getElementById('editCity').value.trim() || null,
            state: document.getElementById('editState').value || null,
            zip_code: document.getElementById('editZipCode').value.trim() || null,
            country: document.getElementById('editCountry').value || 'USA',
            phone: document.getElementById('editPhone').value.trim() || null,
            email: document.getElementById('editEmail').value.trim() || null,
            website: document.getElementById('editWebsite').value.trim() || null,
            logo: document.getElementById('editLogo').value.trim() || null,
            photos: photos
        };
        
        let savedListing;
        
        if (editingListing) {
            // Update existing listing
            const { data, error } = await supabase
                .from('listings')
                .update(listingData)
                .eq('id', editingListing.id)
                .select()
                .single();
            
            if (error) throw error;
            savedListing = data;
        } else {
            // Create new listing - generate slug
            listingData.slug = businessName.toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '');
            
            const { data, error } = await supabase
                .from('listings')
                .insert(listingData)
                .select()
                .single();
            
            if (error) throw error;
            savedListing = data;
        }
        
        // Handle owner info
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
    const ownerData = {
        listing_id: listingId,
        full_name: document.getElementById('editOwnerName').value.trim() || null,
        title: document.getElementById('editOwnerTitle').value.trim() || null,
        from_greece: document.getElementById('editOwnerGreece').value.trim() || null,
        owner_email: document.getElementById('editOwnerEmail').value.trim() || null,
        owner_phone: document.getElementById('editOwnerPhone').value.trim() || null,
        confirmation_key: document.getElementById('editConfirmationKey').value.trim() || null
    };
    
    // Check if owner info exists
    const { data: existing } = await supabase
        .from('business_owners')
        .select('*')
        .eq('listing_id', listingId)
        .single();
    
    if (existing) {
        // Update existing (don't overwrite user_id if already set)
        const updates = { ...ownerData };
        delete updates.confirmation_key; // Don't change confirmation key if listing is claimed
        
        if (!existing.user_id && ownerData.confirmation_key) {
            updates.confirmation_key = ownerData.confirmation_key;
        }
        
        const { error } = await supabase
            .from('business_owners')
            .update(updates)
            .eq('listing_id', listingId);
        
        if (error) throw error;
    } else {
        // Create new - generate confirmation key if not provided
        if (!ownerData.confirmation_key) {
            const words = [
                'alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta', 'eta', 'theta',
                'iota', 'kappa', 'lambda', 'sigma', 'omega', 'phoenix', 'apollo',
                'athena', 'zeus', 'hera', 'poseidon'
            ];
            const word1 = words[Math.floor(Math.random() * words.length)];
            const word2 = words[Math.floor(Math.random() * words.length)];
            const word3 = words[Math.floor(Math.random() * words.length)];
            ownerData.confirmation_key = `${word1}-${word2}-${word3}`;
        }
        
        const { error } = await supabase
            .from('business_owners')
            .insert(ownerData);
        
        if (error) throw error;
    }
}

window.sendMagicLink = async function(listingId) {
    try {
        const { data: listing, error: listingError } = await supabase
            .from('listings')
            .select(`
                business_name,
                owner:business_owners(owner_email, user_id)
            `)
            .eq('id', listingId)
            .single();
        
        if (listingError) throw listingError;
        
        const owner = listing.owner && listing.owner.length > 0 ? listing.owner[0] : null;
        if (!owner || !owner.owner_email || !owner.user_id) {
            alert('No claimed owner email found for this listing');
            return;
        }
        
        const confirmText = prompt(`Send magic link to ${owner.owner_email}?\n\nType "CONFIRM" to proceed.`);
        
        if (confirmText !== 'CONFIRM') {
            return;
        }
        
        // Send magic link
        const { error } = await supabase.auth.signInWithOtp({
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

window.saveListing = saveListing;
// ============================================
// ADMIN PORTAL - PART 4
// Hours, Social Media & Reviews Management
// ============================================

function renderHoursSection() {
    const hours = editingListing?.hours || {};
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    return `
        <div>
            <h3 class="text-lg font-bold mb-4">Hours of Operation</h3>
            <div class="space-y-2">
                ${days.map(day => `
                    <div class="flex items-center gap-3">
                        <label class="w-28 text-sm font-medium">${day}</label>
                        <input type="text" id="editHours${day}" 
                            value="${hours[day.toLowerCase()] || ''}" 
                            class="flex-1 px-4 py-2 border rounded-lg" 
                            placeholder="9:00 AM - 5:00 PM or Closed">
                    </div>
                `).join('')}
            </div>
            <p class="text-xs text-gray-500 mt-2">Leave blank or enter "Closed" for closed days</p>
        </div>
    `;
}

function renderSocialMediaSection() {
    const social = editingListing?.social_media || {};
    
    return `
        <div>
            <h3 class="text-lg font-bold mb-4">Social Media</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium mb-2">Facebook</label>
                    <input type="text" id="editFacebook" value="${social.facebook || ''}" 
                        class="w-full px-4 py-2 border rounded-lg" placeholder="username">
                </div>
                <div>
                    <label class="block text-sm font-medium mb-2">Instagram</label>
                    <input type="text" id="editInstagram" value="${social.instagram || ''}" 
                        class="w-full px-4 py-2 border rounded-lg" placeholder="username">
                </div>
                <div>
                    <label class="block text-sm font-medium mb-2">Twitter/X</label>
                    <input type="text" id="editTwitter" value="${social.twitter || ''}" 
                        class="w-full px-4 py-2 border rounded-lg" placeholder="username">
                </div>
                <div>
                    <label class="block text-sm font-medium mb-2">YouTube</label>
                    <input type="text" id="editYoutube" value="${social.youtube || ''}" 
                        class="w-full px-4 py-2 border rounded-lg" placeholder="channel">
                </div>
                <div>
                    <label class="block text-sm font-medium mb-2">TikTok</label>
                    <input type="text" id="editTiktok" value="${social.tiktok || ''}" 
                        class="w-full px-4 py-2 border rounded-lg" placeholder="username">
                </div>
                <div>
                    <label class="block text-sm font-medium mb-2">LinkedIn</label>
                    <input type="url" id="editLinkedin" value="${social.linkedin || ''}" 
                        class="w-full px-4 py-2 border rounded-lg" placeholder="Full URL">
                </div>
            </div>
            <div class="mt-4">
                <label class="block text-sm font-medium mb-2">Other Links (JSON format)</label>
                <textarea id="editSocialOther" rows="3" class="w-full px-4 py-2 border rounded-lg" 
                    placeholder='{"link": "https://example.com", "name": "Custom Site"}'>${social.other ? JSON.stringify(social.other, null, 2) : ''}</textarea>
                <p class="text-xs text-gray-500 mt-1">Add custom social links as JSON array</p>
            </div>
        </div>
    `;
}

function renderReviewsSection() {
    const reviews = editingListing?.reviews || {};
    
    return `
        <div>
            <h3 class="text-lg font-bold mb-4">Review Sites</h3>
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium mb-2">Google Reviews URL</label>
                    <input type="url" id="editGoogleReviews" value="${reviews.google || ''}" 
                        class="w-full px-4 py-2 border rounded-lg" placeholder="Full Google Reviews URL">
                </div>
                <div>
                    <label class="block text-sm font-medium mb-2">Yelp URL</label>
                    <input type="url" id="editYelp" value="${reviews.yelp || ''}" 
                        class="w-full px-4 py-2 border rounded-lg" placeholder="Full Yelp URL">
                </div>
                <div>
                    <label class="block text-sm font-medium mb-2">TripAdvisor URL</label>
                    <input type="url" id="editTripadvisor" value="${reviews.tripadvisor || ''}" 
                        class="w-full px-4 py-2 border rounded-lg" placeholder="Full TripAdvisor URL">
                </div>
            </div>
        </div>
    `;
}

function renderVisibilitySection() {
    return `
        <div>
            <h3 class="text-lg font-bold mb-4">Visibility & Status</h3>
            <div class="space-y-3">
                <label class="flex items-center gap-2">
                    <input type="checkbox" id="editVisible" ${editingListing?.visible !== false ? 'checked' : ''}>
                    <span class="text-sm font-medium">Listing is visible on site</span>
                </label>
                <label class="flex items-center gap-2">
                    <input type="checkbox" id="editShowClaimButton" ${editingListing?.show_claim_button !== false ? 'checked' : ''}>
                    <span class="text-sm font-medium">Show "Claim this listing" button</span>
                </label>
            </div>
        </div>
    `;
}

// Update fillEditForm to include new sections
function fillEditFormComplete(listing) {
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
                    <span class="text-xs text-gray-500">Select at least one and mark primary</span>
                </div>
                <div id="subcategoryCheckboxes" class="grid grid-cols-2 md:grid-cols-3 gap-2"></div>
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
                        <label class="block text-sm font-medium mb-2">Google Maps URL Ending</label>
                        <input type="text" id="editPlacesUrl" value="${listing?.places_url_ending || ''}" class="w-full px-4 py-2 border rounded-lg" placeholder="e.g., ChIJ...">
                    </div>
                </div>
            </div>

            <!-- Contact -->
            <div>
                <h3 class="text-lg font-bold mb-4">Contact Information</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">Phone</label>
                        <input type="tel" id="editPhone" value="${listing?.phone || ''}" class="w-full px-4 py-2 border rounded-lg">
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

            <!-- Owner Info -->
            <div>
                <h3 class="text-lg font-bold mb-4">Owner Information</h3>
                ${owner?.user_id ? '<p class="text-sm text-green-600 mb-4">✓ This listing is claimed</p>' : '<p class="text-sm text-gray-600 mb-4">This listing has not been claimed yet</p>'}
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">Owner Name</label>
                        <input type="text" id="editOwnerName" value="${owner?.full_name || ''}" class="w-full px-4 py-2 border rounded-lg">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Title</label>
                        <input type="text" id="editOwnerTitle" value="${owner?.title || ''}" class="w-full px-4 py-2 border rounded-lg" placeholder="e.g., Owner, Manager">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">From Greece</label>
                        <input type="text" id="editOwnerGreece" value="${owner?.from_greece || ''}" class="w-full px-4 py-2 border rounded-lg" placeholder="e.g., Athens, Crete">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Owner Email</label>
                        <input type="email" id="editOwnerEmail" value="${owner?.owner_email || ''}" class="w-full px-4 py-2 border rounded-lg">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Owner Phone</label>
                        <input type="tel" id="editOwnerPhone" value="${owner?.owner_phone || ''}" class="w-full px-4 py-2 border rounded-lg">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Confirmation Key</label>
                        <input type="text" id="editConfirmationKey" value="${owner?.confirmation_key || ''}" class="w-full px-4 py-2 border rounded-lg" ${owner?.user_id ? 'disabled title="Cannot change - listing is claimed"' : ''}>
                        ${!owner?.user_id ? '<p class="text-xs text-gray-500 mt-1">Leave blank to auto-generate</p>' : ''}
                    </div>
                </div>
            </div>

            ${renderHoursSection()}
            ${renderSocialMediaSection()}
            ${renderReviewsSection()}

            <!-- Media -->
            <div>
                <h3 class="text-lg font-bold mb-4">Media</h3>
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">Logo URL</label>
                        <input type="url" id="editLogo" value="${listing?.logo || ''}" class="w-full px-4 py-2 border rounded-lg">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Photos (one per line)</label>
                        <textarea id="editPhotos" rows="4" class="w-full px-4 py-2 border rounded-lg" placeholder="https://example.com/photo1.jpg
https://example.com/photo2.jpg">${listing?.photos ? listing.photos.join('\n') : ''}</textarea>
                        <p class="text-xs text-gray-500 mt-1">Enter one URL per line</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Video URL (YouTube embed link)</label>
                        <input type="url" id="editVideo" value="${listing?.video || ''}" class="w-full px-4 py-2 border rounded-lg" placeholder="https://www.youtube.com/embed/...">
                    </div>
                </div>
            </div>

            ${renderVisibilitySection()}
        </div>
    `;
    
    updateSubcategoriesForCategory();
}
// ============================================
// ADMIN PORTAL - PART 5
// Complete Save with All Fields
// ============================================

async function saveListingComplete() {
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
        
        if (!primarySubcategory) {
            alert('Please select a primary subcategory');
            return;
        }
        
        const isChain = document.getElementById('editIsChain').checked;
        const chainName = document.getElementById('editChainName')?.value.trim();
        
        if (isChain && !chainName) {
            alert('Chain name is required for chain listings');
            return;
        }
        
        // Parse photos
        const photosText = document.getElementById('editPhotos').value;
        const photos = photosText ? photosText.split('\n').map(url => url.trim()).filter(url => url) : [];
        
        // Parse social media other
        let socialOther = null;
        const socialOtherText = document.getElementById('editSocialOther')?.value.trim();
        if (socialOtherText) {
            try {
                socialOther = JSON.parse(socialOtherText);
            } catch (e) {
                alert('Invalid JSON format for other social links');
                return;
            }
        }
        
        // Collect hours
        const hours = {};
        ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].forEach(day => {
            const value = document.getElementById(`editHours${day}`)?.value.trim();
            if (value) {
                hours[day.toLowerCase()] = value;
            }
        });
        
        // Generate chain_id if needed
        let chainId = document.getElementById('editChainId')?.value.trim();
        if (isChain && !chainId) {
            chainId = `chain-${chainName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;
        }
        
        const listingData = {
            business_name: businessName,
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
            places_url_ending: document.getElementById('editPlacesUrl')?.value.trim() || null,
            phone: document.getElementById('editPhone').value.trim() || null,
            email: document.getElementById('editEmail').value.trim() || null,
            website: document.getElementById('editWebsite').value.trim() || null,
            logo: document.getElementById('editLogo').value.trim() || null,
            photos: photos,
            video: document.getElementById('editVideo')?.value.trim() || null,
            hours: hours,
            social_media: {
                facebook: document.getElementById('editFacebook')?.value.trim() || null,
                instagram: document.getElementById('editInstagram')?.value.trim() || null,
                twitter: document.getElementById('editTwitter')?.value.trim() || null,
                youtube: document.getElementById('editYoutube')?.value.trim() || null,
                tiktok: document.getElementById('editTiktok')?.value.trim() || null,
                linkedin: document.getElementById('editLinkedin')?.value.trim() || null,
                other: socialOther
            },
            reviews: {
                google: document.getElementById('editGoogleReviews')?.value.trim() || null,
                yelp: document.getElementById('editYelp')?.value.trim() || null,
                tripadvisor: document.getElementById('editTripadvisor')?.value.trim() || null
            },
            visible: document.getElementById('editVisible')?.checked !== false,
            show_claim_button: document.getElementById('editShowClaimButton')?.checked !== false
        };
        
        let savedListing;
        
        if (editingListing) {
            // Update existing listing
            const { data, error } = await supabase
                .from('listings')
                .update(listingData)
                .eq('id', editingListing.id)
                .select()
                .single();
            
            if (error) throw error;
            savedListing = data;
            
            console.log('✅ Listing updated:', savedListing.id);
        } else {
            // Create new listing - generate slug
            listingData.slug = businessName.toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '');
            
            // Check if slug exists
            const { data: existingSlug } = await supabase
                .from('listings')
                .select('slug')
                .eq('slug', listingData.slug)
                .single();
            
            if (existingSlug) {
                listingData.slug = `${listingData.slug}-${Date.now()}`;
            }
            
            const { data, error } = await supabase
                .from('listings')
                .insert(listingData)
                .select()
                .single();
            
            if (error) throw error;
            savedListing = data;
            
            console.log('✅ New listing created:', savedListing.id);
        }
        
        // Handle owner info
        await saveOwnerInfoComplete(savedListing.id);
        
        alert('✅ Listing saved successfully!');
        document.getElementById('editModal').classList.add('hidden');
        await loadListings();
        
    } catch (error) {
        console.error('❌ Error saving listing:', error);
        alert('Failed to save listing: ' + error.message);
    }
}

async function saveOwnerInfoComplete(listingId) {
    const ownerData = {
        listing_id: listingId,
        full_name: document.getElementById('editOwnerName')?.value.trim() || null,
        title: document.getElementById('editOwnerTitle')?.value.trim() || null,
        from_greece: document.getElementById('editOwnerGreece')?.value.trim() || null,
        owner_email: document.getElementById('editOwnerEmail')?.value.trim() || null,
        owner_phone: document.getElementById('editOwnerPhone')?.value.trim() || null,
        confirmation_key: document.getElementById('editConfirmationKey')?.value.trim() || null
    };
    
    // Check if owner info exists
    const { data: existing } = await supabase
        .from('business_owners')
        .select('*')
        .eq('listing_id', listingId)
        .maybeSingle();
    
    if (existing) {
        // Update existing (don't overwrite user_id if already set)
        const updates = { ...ownerData };
        
        // Don't change confirmation key if listing is claimed
        if (existing.user_id) {
            delete updates.confirmation_key;
        }
        
        const { error } = await supabase
            .from('business_owners')
            .update(updates)
            .eq('listing_id', listingId);
        
        if (error) throw error;
        
        console.log('✅ Owner info updated');
    } else {
        // Create new - generate confirmation key if not provided
        if (!ownerData.confirmation_key) {
            const words = [
                'alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta', 'eta', 'theta',
                'iota', 'kappa', 'lambda', 'sigma', 'omega', 'phoenix', 'apollo',
                'athena', 'zeus', 'hera', 'poseidon', 'demeter', 'ares', 'hermes',
                'helios', 'selene', 'nike', 'tyche', 'eros', 'chaos', 'gaia'
            ];
            const word1 = words[Math.floor(Math.random() * words.length)];
            const word2 = words[Math.floor(Math.random() * words.length)];
            const word3 = words[Math.floor(Math.random() * words.length)];
            ownerData.confirmation_key = `${word1}-${word2}-${word3}`;
        }
        
        const { error } = await supabase
            .from('business_owners')
            .insert(ownerData);
        
        if (error) throw error;
        
        console.log('✅ Owner info created with key:', ownerData.confirmation_key);
    }
}

// Send password reset email
window.sendPasswordReset = async function(listingId) {
    try {
        const { data: listing, error: listingError } = await supabase
            .from('listings')
            .select(`
                business_name,
                owner:business_owners(owner_email, user_id)
            `)
            .eq('id', listingId)
            .single();
        
        if (listingError) throw listingError;
        
        const owner = listing.owner && listing.owner.length > 0 ? listing.owner[0] : null;
        if (!owner || !owner.owner_email || !owner.user_id) {
            alert('No claimed owner email found for this listing');
            return;
        }
        
        const confirmText = prompt(`Send password reset email to ${owner.owner_email}?\n\nType "CONFIRM" to proceed.`);
        
        if (confirmText !== 'CONFIRM') {
            return;
        }
        
        const { error } = await supabase.auth.resetPasswordForEmail(owner.owner_email, {
            redirectTo: `${window.location.origin}/business.html?reset=true`
        });
        
        if (error) throw error;
        
        alert(`✅ Password reset email sent to ${owner.owner_email}`);
        
    } catch (error) {
        console.error('Error sending password reset:', error);
        alert('Failed to send password reset: ' + error.message);
    }
};

// Delete listing
window.deleteListing = async function(listingId) {
    const listing = allListings.find(l => l.id === listingId);
    if (!listing) return;
    
    const confirmText = prompt(`Are you sure you want to DELETE "${listing.business_name}"?\n\nThis action CANNOT be undone.\n\nType "DELETE" to confirm.`);
    
    if (confirmText !== 'DELETE') {
        return;
    }
    
    try {
        // Delete owner info first (cascade should handle this but being explicit)
        const { error: ownerError } = await supabase
            .from('business_owners')
            .delete()
            .eq('listing_id', listingId);
        
        if (ownerError) throw ownerError;
        
        // Delete listing
        const { error } = await supabase
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

// Update the main save function reference
window.saveListing = saveListingComplete;
