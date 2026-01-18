// ============================================
// ADMIN PORTAL - MAIN JAVASCRIPT
// Part 1: Configuration, Authentication & Core Functions
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

// ============================================
// GLOBAL STATE
// ============================================
let supabase = null;
let currentAdminUser = null;
let allListings = [];
let editingListing = null;
let selectedSubcategories = [];
let primarySubcategory = null;
let currentAnalyticsListing = null;
let currentAnalyticsTab = 'overview';
let deletingListingId = null;

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Initializing Admin Portal...');
    
    // Initialize Supabase
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Supabase initialized');
    
    // Check authentication
    await checkAuthState();
    
    // Setup event listeners
    setupEventListeners();
    
    console.log('✅ Admin Portal initialization complete');
});

// ============================================
// AUTHENTICATION FUNCTIONS
// ============================================
async function checkAuthState() {
    const session = await supabase.auth.getSession();
    
    if (session.data.session) {
        currentAdminUser = session.data.session.user;
        
        // Check if user is admin (you can customize this check)
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
        
        // Check if user is admin
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

// ============================================
// LOAD LISTINGS FROM SUPABASE
// ============================================
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

// ============================================
// RENDER TABLE
// ============================================
function renderTable() {
    const tbody = document.getElementById('listingsTableBody');
    const searchTerm = document.getElementById('adminSearch') ? document.getElementById('adminSearch').value.toLowerCase() : '';
    
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
                    <button onclick="showAnalytics('${l.id}')" class="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200">📊</button>
                    <button onclick="editListing('${l.id}')" class="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200">Edit</button>
                    <a href="${listingUrl}" target="_blank" class="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">View</a>
                    ${isClaimed ? `<button onclick="sendMagicLink('${l.id}')" class="px-3 py-1 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200">🔗</button>` : ''}
                    <button onclick="showDeleteModal('${l.id}')" class="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200">Delete</button>
                </div>
            </td>
        </tr>
    `}).join('');
}

// ============================================
// TOGGLE VISIBILITY
// ============================================
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

// ============================================
// UTILITY FUNCTIONS
// ============================================
function generateSlug(name) {
    return name.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

function generateConfirmationKey() {
    const words = [
        'alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta', 'eta', 'theta',
        'iota', 'kappa', 'lambda', 'sigma', 'omega', 'phoenix', 'apollo',
        'athena', 'zeus', 'hera', 'poseidon', 'demeter', 'ares', 'hermes',
        'helios', 'selene', 'nike', 'tyche', 'eros', 'chaos', 'gaia', 'uranus',
        'titan', 'atlas', 'prometheus', 'olympus', 'sparta', 'athens', 'delphi',
        'corinth', 'thebes', 'argos', 'crete', 'rhodes', 'cyprus', 'aegean'
    ];
    
    const word1 = words[Math.floor(Math.random() * words.length)];
    const word2 = words[Math.floor(Math.random() * words.length)];
    const word3 = words[Math.floor(Math.random() * words.length)];
    
    return `${word1}-${word2}-${word3}`;
}

function generateMetaDescription(listing) {
    const parts = [];
    
    if (listing.tagline) {
        parts.push(listing.tagline);
    }
    
    if (listing.city && listing.state) {
        parts.push(`in ${listing.city}, ${listing.state}`);
    } else if (listing.state) {
        parts.push(`in ${listing.state}`);
    }
    
    if (parts.length === 0 && listing.description) {
        return listing.description.substring(0, 155) + '...';
    }
    
    let meta = parts.join(' ');
    if (meta.length > 155) {
        meta = meta.substring(0, 152) + '...';
    }
    
    return meta;
}

// Make functions globally available
window.handleAdminLogin = handleAdminLogin;
window.logout = logout;
window.loadListings = loadListings;
// ============================================
// ADMIN PORTAL - PART 2
// Edit Listing, Form Management & Save Functions
// ============================================

// ============================================
// EDIT LISTING
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
        document.getElementById('modalTitle').textContent = 'Edit Listing';
        fillForm(listing);
        document.getElementById('editModal').classList.remove('hidden');
        
    } catch (error) {
        console.error('Error loading listing:', error);
        alert('Failed to load listing');
    }
};

window.newListing = function() {
    editingListing = null;
    document.getElementById('modalTitle').textContent = 'New Listing';
    clearForm();
    document.getElementById('editModal').classList.remove('hidden');
};

// ============================================
// FORM MANAGEMENT
// ============================================
function fillForm(listing) {
    // Basic info
    document.getElementById('editListingId').value = listing.id || '';
    document.getElementById('editBusinessName').value = listing.business_name || '';
    document.getElementById('editTagline').value = listing.tagline || '';
    document.getElementById('editDescription').value = listing.description || '';
    document.getElementById('editCategory').value = listing.category || CATEGORIES[0];
    document.getElementById('editTier').value = listing.tier || 'FREE';
    
    // Chain info
    document.getElementById('editIsChain').checked = listing.is_chain || false;
    document.getElementById('editChainName').value = listing.chain_name || '';
    document.getElementById('editChainId').value = listing.chain_id || '';
    toggleChainFields();
    
    // Subcategories
    selectedSubcategories = listing.subcategories || [];
    primarySubcategory = listing.primary_subcategory || null;
    updateSubcategoriesDisplay();
    
    // Location
    document.getElementById('editAddress').value = listing.address || '';
    document.getElementById('editCity').value = listing.city || '';
    document.getElementById('editState').value = listing.state || 'IL';
    document.getElementById('editZipCode').value = listing.zip_code || '';
    document.getElementById('editCountry').value = listing.country || 'USA';
    document.getElementById('editPlacesUrl').value = listing.places_url_ending || '';
    
    // Contact
    document.getElementById('editPhone').value = listing.phone || '';
    document.getElementById('editEmail').value = listing.email || '';
    document.getElementById('editWebsite').value = listing.website || '';
    
    // Hours
    const hours = listing.hours || {};
    ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].forEach(day => {
        const el = document.getElementById(`editHours${day}`);
        if (el) el.value = hours[day.toLowerCase()] || '';
    });
    
    // Media
    document.getElementById('editLogo').value = listing.logo || '';
    document.getElementById('editPhotos').value = listing.photos ? listing.photos.join('\n') : '';
    
    // Social Media
    const social = listing.social_media || {};
    ['Facebook', 'Instagram', 'Twitter', 'Youtube', 'Tiktok', 'Linkedin', 'Other1', 'Other2', 'Other3'].forEach(field => {
        const el = document.getElementById(`edit${field}`);
        if (el) el.value = social[field.toLowerCase()] || '';
    });
    
    // Reviews
    const reviews = listing.reviews || {};
    ['Google', 'Yelp', 'Tripadvisor', 'ReviewOther1', 'ReviewOther2', 'ReviewOther3'].forEach(field => {
        const el = document.getElementById(`edit${field}`);
        const key = field.replace('Review', '').toLowerCase();
        if (el) el.value = reviews[key] || '';
    });
    
    // Owner Info
    const owner = listing.owner && listing.owner.length > 0 ? listing.owner[0] : null;
    if (owner) {
        document.getElementById('editOwnerName').value = owner.full_name || '';
        document.getElementById('editOwnerTitle').value = owner.title || '';
        document.getElementById('editOwnerGreece').value = owner.from_greece || '';
        document.getElementById('editOwnerEmail').value = owner.owner_email || '';
        document.getElementById('editOwnerPhone').value = owner.owner_phone || '';
        document.getElementById('editConfirmationKey').value = owner.confirmation_key || '';
        
        // Show if listing is claimed
        if (owner.user_id) {
            document.getElementById('claimedIndicator').classList.remove('hidden');
        } else {
            document.getElementById('claimedIndicator').classList.add('hidden');
        }
    }
    
    document.getElementById('editShowClaim').checked = listing.show_claim_button !== false;
    
    updateCharCounters();
}

function clearForm() {
    document.querySelectorAll('#editModal input, #editModal textarea, #editModal select').forEach(el => {
        if (el.type === 'checkbox') el.checked = false;
        else el.value = '';
    });
    
    document.getElementById('editCountry').value = 'USA';
    document.getElementById('editState').value = 'IL';
    document.getElementById('editTier').value = 'FREE';
    document.getElementById('editCategory').value = CATEGORIES[0];
    
    selectedSubcategories = [];
    primarySubcategory = null;
    updateSubcategoriesDisplay();
    
    document.getElementById('claimedIndicator').classList.add('hidden');
    document.getElementById('chainFieldsContainer').classList.add('hidden');
    
    updateCharCounters();
}

function updateCharCounters() {
    const tagline = document.getElementById('editTagline').value;
    const description = document.getElementById('editDescription').value;
    const tier = document.getElementById('editTier').value;
    const maxDesc = tier === 'FREE' ? 1000 : 2000;
    
    document.getElementById('taglineCount').textContent = tagline.length;
    document.getElementById('descriptionCount').textContent = description.length;
    document.getElementById('descriptionMax').textContent = maxDesc;
    
    if (description.length > maxDesc) {
        document.getElementById('editDescription').value = description.substring(0, maxDesc);
        document.getElementById('descriptionCount').textContent = maxDesc;
    }
}

window.updateCharCounter = function(field) {
    updateCharCounters();
};

window.updateVerifiedBasedOnTier = function() {
    updateCharCounters();
};

// ============================================
// CHAIN MANAGEMENT
// ============================================
function toggleChainFields() {
    const isChain = document.getElementById('editIsChain').checked;
    const container = document.getElementById('chainFieldsContainer');
    
    if (isChain) {
        container.classList.remove('hidden');
    } else {
        container.classList.add('hidden');
        document.getElementById('editChainName').value = '';
        document.getElementById('editChainId').value = '';
    }
}

window.toggleChainFields = toggleChainFields;

// ============================================
// SUBCATEGORY MANAGEMENT
// ============================================
function updateSubcategoriesDisplay() {
    const category = document.getElementById('editCategory').value;
    const container = document.getElementById('subcategoriesContainer');
    
    if (!SUBCATEGORIES[category] || SUBCATEGORIES[category].length === 0) {
        container.classList.add('hidden');
        return;
    }
    
    container.classList.remove('hidden');
    const checkboxDiv = document.getElementById('subcategoryCheckboxes');
    checkboxDiv.innerHTML = '';
    
    SUBCATEGORIES[category].forEach(sub => {
        const isSelected = selectedSubcategories.includes(sub);
        const isPrimary = sub === primarySubcategory;
        
        const div = document.createElement('div');
        div.className = 'subcategory-checkbox';
        div.innerHTML = `
            <input type="checkbox" id="subcat-${sub.replace(/\s+/g, '-')}" 
                ${isSelected ? 'checked' : ''} 
                onchange="toggleSubcategory('${sub}')">
            <label for="subcat-${sub.replace(/\s+/g, '-')}">${sub}</label>
            <input type="radio" name="primarySub" 
                ${isPrimary ? 'checked' : ''} 
                ${!isSelected ? 'disabled' : ''}
                onchange="setPrimarySubcategory('${sub}')"
                title="Set as primary">
        `;
        checkboxDiv.appendChild(div);
    });
}

window.updateSubcategoriesForCategory = function() {
    const category = document.getElementById('editCategory').value;
    
    // Clear subcategories if category changed
    if (editingListing && editingListing.category !== category) {
        selectedSubcategories = [];
        primarySubcategory = null;
    }
    
    updateSubcategoriesDisplay();
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
    
    updateSubcategoriesDisplay();
};

window.setPrimarySubcategory = function(subcategory) {
    primarySubcategory = subcategory;
    updateSubcategoriesDisplay();
};

// ============================================
// SAVE LISTING
// ============================================
async function saveListing() {
    try {
        // Validate form
        const businessName = document.getElementById('editBusinessName').value.trim();
        const tagline = document.getElementById('editTagline').value.trim();
        const category = document.getElementById('editCategory').value;
        
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
        
        // Prepare listing data
        const tier = document.getElementById('editTier').value;
        const description = document.getElementById('editDescription').value;
        const maxDesc = tier === 'FREE' ? 1000 : 2000;
        
        if (description.length > maxDesc) {
            alert(`Description too long! Max ${maxDesc} characters for ${tier} tier.`);
            return;
        }
        
        const isChain = document.getElementById('editIsChain').checked;
        const chainName = isChain ? document.getElementById('editChainName').value.trim() : null;
        const chainId = isChain ? document.getElementById('editChainId').value.trim() : null;
        
        if (isChain && !chainName) {
            alert('Chain name is required for chain listings');
            return;
        }
        
        const photosText = document.getElementById('editPhotos').value;
        const photos = photosText ? photosText.split('\n').map(url => url.trim()).filter(url => url) : [];
        
        const listingData = {
            business_name: businessName,
            tagline: tagline,
            description: description,
            category: category,
            subcategories: selectedSubcategories,
            primary_subcategory: primarySubcategory,
            tier: tier,
            verified: tier !== 'FREE',
            is_chain: isChain,
            chain_name: chainName,
            chain_id: chainId,
            address: document.getElementById('editAddress').value.trim() || null,
            city: document.getElementById('editCity').value.trim() || null,
            state: document.getElementById('editState').value || null,
            zip_code: document.getElementById('editZipCode').value.trim() || null,
            country: document.getElementById('editCountry').value || 'USA',
            places_url_ending: document.getElementById('editPlacesUrl').value.trim() || null,
            phone: document.getElementById('editPhone').value.trim() || null,
            email: document.getElementById('editEmail').value.trim() || null,
            website: document.getElementById('editWebsite').value.trim() || null,
            logo: document.getElementById('editLogo').value.trim() || null,
            photos: photos,
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
                other1: document.getElementById('editOther1').value.trim() || null,
                other2: document.getElementById('editOther2').value.trim() || null,
                other3: document.getElementById('editOther3').value.trim() || null
            },
            reviews: {
                google: document.getElementById('editGoogle').value.trim() || null,
                yelp: document.getElementById('editYelp').value.trim() || null,
                tripadvisor: document.getElementById('editTripadvisor').value.trim() || null,
                other1: document.getElementById('editReviewOther1').value.trim() || null,
                other2: document.getElementById('editReviewOther2').value.trim() || null,
                other3: document.getElementById('editReviewOther3').value.trim() || null
            },
            show_claim_button: document.getElementById('editShowClaim').checked,
            meta_description: generateMetaDescription({
                tagline: tagline,
                city: document.getElementById('editCity').value,
                state: document.getElementById('editState').value,
                description: description
            })
        };
        
        // Generate slug if new listing
        if (!editingListing) {
            listingData.slug = generateSlug(businessName);
        }
        
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
            // Create new listing
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
        owner_phone: document.getElementById('editOwnerPhone').value.trim() || null
    };
    
    // Check if owner info exists
    const { data: existing } = await supabase
        .from('business_owners')
        .select('*')
        .eq('listing_id', listingId)
        .single();
    
    if (existing) {
        // Update existing
        const { error } = await supabase
            .from('business_owners')
            .update(ownerData)
            .eq('listing_id', listingId);
        
        if (error) throw error;
    } else {
        // Create new with confirmation key
        ownerData.confirmation_key = generateConfirmationKey();
        
        const { error } = await supabase
            .from('business_owners')
            .insert(ownerData);
        
        if (error) throw error;
    }
}

window.saveListing = saveListing;

// Setup event listeners
function setupEditFormListeners() {
    document.getElementById('editBusinessName')?.addEventListener('input', updateCharCounters);
    document.getElementById('editTagline')?.addEventListener('input', updateCharCounters);
    document.getElementById('editDescription')?.addEventListener('input', updateCharCounters);
    document.getElementById('editTier')?.addEventListener('change', updateCharCounters);
    document.getElementById('editCategory')?.addEventListener('change', updateSubcategoriesForCategory);
    document.getElementById('editIsChain')?.addEventListener('change', toggleChainFields);
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
// ============================================
// ADMIN PORTAL - PART 3
// Analytics, Delete, Magic Link & Event Listeners
// ============================================

// ============================================
// ANALYTICS FUNCTIONS
// ============================================
window.showAnalytics = async function(id) {
    try {
        const { data: listing, error } = await supabase
            .from('listings')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        
        currentAnalyticsListing = listing;
        currentAnalyticsTab = 'overview';
        
        document.getElementById('analyticsBusinessName').textContent = listing.business_name;
        document.getElementById('analyticsLastUpdated').textContent = new Date().toLocaleString();
        
        renderAnalyticsContent();
        document.getElementById('analyticsModal').classList.remove('hidden');
        
    } catch (error) {
        console.error('Error loading analytics:', error);
        alert('Failed to load analytics');
    }
};

window.switchAnalyticsTab = function(tab) {
    currentAnalyticsTab = tab;
    
    document.querySelectorAll('.analytics-tab').forEach(t => {
        t.classList.remove('active');
    });
    
    document.querySelector(`.analytics-tab[data-tab="${tab}"]`)?.classList.add('active');
    
    renderAnalyticsContent();
};

function renderAnalyticsContent() {
    if (!currentAnalyticsListing) return;
    
    const analytics = currentAnalyticsListing.analytics || {
        views: 0,
        call_clicks: 0,
        website_clicks: 0,
        direction_clicks: 0,
        share_clicks: 0,
        last_viewed: null,
        detailed_views: []
    };
    
    const content = document.getElementById('analyticsContent');
    
    let html = '';
    
    if (currentAnalyticsTab === 'overview') {
        html = `
            <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <div class="analytics-stat-card">
                    <div class="text-4xl font-bold mb-2">${analytics.views || 0}</div>
                    <div class="text-sm opacity-90">Total Views</div>
                </div>
                <div class="analytics-stat-card" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
                    <div class="text-4xl font-bold mb-2">${analytics.call_clicks || 0}</div>
                    <div class="text-sm opacity-90">Call Clicks</div>
                </div>
                <div class="analytics-stat-card" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
                    <div class="text-4xl font-bold mb-2">${analytics.website_clicks || 0}</div>
                    <div class="text-sm opacity-90">Website Clicks</div>
                </div>
                <div class="analytics-stat-card" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
                    <div class="text-4xl font-bold mb-2">${analytics.direction_clicks || 0}</div>
                    <div class="text-sm opacity-90">Direction Clicks</div>
                </div>
                <div class="analytics-stat-card" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);">
                    <div class="text-4xl font-bold mb-2">${analytics.share_clicks || 0}</div>
                    <div class="text-sm opacity-90">Share Clicks</div>
                </div>
                <div class="analytics-stat-card" style="background: linear-gradient(135deg, #30cfd0 0%, #330867 100%);">
                    <div class="text-lg font-bold mb-2">${analytics.last_viewed ? new Date(analytics.last_viewed).toLocaleString() : 'Never'}</div>
                    <div class="text-sm opacity-90">Last Viewed</div>
                </div>
            </div>
            
            ${analytics.detailed_views && analytics.detailed_views.length > 0 ? `
                <div class="bg-gray-50 rounded-lg p-4">
                    <h3 class="font-bold text-gray-900 mb-3">Recent Activity (Last 30 actions)</h3>
                    <div class="space-y-2">
                        ${analytics.detailed_views.slice(-30).reverse().map(v => `
                            <div class="analytics-detail-row flex justify-between text-sm">
                                <span class="font-medium">${v.action}</span>
                                <span class="text-gray-600">${new Date(v.timestamp).toLocaleString()}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : '<p class="text-gray-600">No detailed analytics available yet.</p>'}
        `;
    } else {
        // Time-based analytics
        const now = new Date();
        let filteredViews = [];
        
        if (currentAnalyticsTab === 'today') {
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            filteredViews = analytics.detailed_views?.filter(v => new Date(v.timestamp) >= todayStart) || [];
        } else if (currentAnalyticsTab === 'yesterday') {
            const yesterdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
            const yesterdayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            filteredViews = analytics.detailed_views?.filter(v => {
                const d = new Date(v.timestamp);
                return d >= yesterdayStart && d < yesterdayEnd;
            }) || [];
        } else if (currentAnalyticsTab === 'week') {
            const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            filteredViews = analytics.detailed_views?.filter(v => new Date(v.timestamp) >= weekStart) || [];
        } else if (currentAnalyticsTab === 'month') {
            const monthStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            filteredViews = analytics.detailed_views?.filter(v => new Date(v.timestamp) >= monthStart) || [];
        } else if (currentAnalyticsTab === 'alltime') {
            filteredViews = analytics.detailed_views || [];
        }
        
        const views = filteredViews.filter(v => v.action === 'view').length;
        const calls = filteredViews.filter(v => v.action === 'call').length;
        const websites = filteredViews.filter(v => v.action === 'website').length;
        const directions = filteredViews.filter(v => v.action === 'directions').length;
        const shares = filteredViews.filter(v => v.action.includes('share')).length;
        
        html = `
            <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <div class="analytics-stat-card">
                    <div class="text-4xl font-bold mb-2">${views}</div>
                    <div class="text-sm opacity-90">Views</div>
                </div>
                <div class="analytics-stat-card" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
                    <div class="text-4xl font-bold mb-2">${calls}</div>
                    <div class="text-sm opacity-90">Call Clicks</div>
                </div>
                <div class="analytics-stat-card" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
                    <div class="text-4xl font-bold mb-2">${websites}</div>
                    <div class="text-sm opacity-90">Website Clicks</div>
                </div>
                <div class="analytics-stat-card" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
                    <div class="text-4xl font-bold mb-2">${directions}</div>
                    <div class="text-sm opacity-90">Direction Clicks</div>
                </div>
                <div class="analytics-stat-card" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);">
                    <div class="text-4xl font-bold mb-2">${shares}</div>
                    <div class="text-sm opacity-90">Share Clicks</div>
                </div>
                <div class="analytics-stat-card" style="background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);">
                    <div class="text-4xl font-bold mb-2">${filteredViews.length}</div>
                    <div class="text-sm opacity-90">Total Actions</div>
                </div>
            </div>
            
            ${filteredViews.length > 0 ? `
                <div class="bg-gray-50 rounded-lg p-4">
                    <h3 class="font-bold text-gray-900 mb-3">Activity Details</h3>
                    <div class="space-y-2">
                        ${filteredViews.slice().reverse().slice(0, 50).map(v => `
                            <div class="analytics-detail-row flex justify-between text-sm">
                                <span class="font-medium">${v.action}</span>
                                <span class="text-gray-600">${new Date(v.timestamp).toLocaleString()}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : '<p class="text-gray-600">No activity in this time period.</p>'}
        `;
    }
    
    content.innerHTML = html;
}

// ============================================
// DELETE FUNCTIONS
// ============================================
window.showDeleteModal = async function(id) {
    try {
        const { data: listing, error } = await supabase
            .from('listings')
            .select('business_name')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        
        deletingListingId = id;
        document.getElementById('deleteBusinessName').textContent = listing.business_name;
        document.getElementById('deleteModal').classList.remove('hidden');
        
    } catch (error) {
        console.error('Error loading listing:', error);
        alert('Failed to load listing');
    }
};

window.confirmDelete = async function() {
    const confirmText = document.getElementById('deleteConfirmInput').value;
    
    if (confirmText !== 'DELETE') {
        alert('You must type DELETE to confirm');
        return;
    }
    
    try {
        // Delete owner info first
        await supabase
            .from('business_owners')
            .delete()
            .eq('listing_id', deletingListingId);
        
        // Delete listing
        const { error } = await supabase
            .from('listings')
            .delete()
            .eq('id', deletingListingId);
        
        if (error) throw error;
        
        document.getElementById('deleteModal').classList.add('hidden');
        document.getElementById('deleteConfirmInput').value = '';
        deletingListingId = null;
        
        alert('Listing deleted successfully');
        await loadListings();
        
    } catch (error) {
        console.error('Error deleting listing:', error);
        alert('Failed to delete listing: ' + error.message);
    }
};

// ============================================
// MAGIC LINK FUNCTIONS
// ============================================
window.sendMagicLink = async function(listingId) {
    try {
        const { data: listing, error: listingError } = await supabase
            .from('listings')
            .select(`
                business_name,
                owner:business_owners(owner_email)
            `)
            .eq('id', listingId)
            .single();
        
        if (listingError) throw listingError;
        
        const owner = listing.owner && listing.owner.length > 0 ? listing.owner[0] : null;
        if (!owner || !owner.owner_email) {
            alert('No owner email found for this listing');
            return;
        }
        
        const confirmText = prompt(`Are you sure you want to send a magic link to ${owner.owner_email}?\n\nType "CONFIRM" to proceed.`);
        
        if (confirmText !== 'CONFIRM') {
            return;
        }
        
        // Send magic link via Supabase Auth
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

window.sendPasswordReset = async function(listingId) {
    try {
        const { data: listing, error: listingError } = await supabase
            .from('listings')
            .select(`
                business_name,
                owner:business_owners(owner_email)
            `)
            .eq('id', listingId)
            .single();
        
        if (listingError) throw listingError;
        
        const owner = listing.owner && listing.owner.length > 0 ? listing.owner[0] : null;
        if (!owner || !owner.owner_email) {
            alert('No owner email found for this listing');
            return;
        }
        
        const confirmText = prompt(`Are you sure you want to send a password reset link to ${owner.owner_email}?\n\nType "CONFIRM" to proceed.`);
        
        if (confirmText !== 'CONFIRM') {
            return;
        }
        
        // Send password reset
        const { error } = await supabase.auth.resetPasswordForEmail(owner.owner_email, {
            redirectTo: `${window.location.origin}/business.html?reset=true`
        });
        
        if (error) throw error;
        
        alert(`Password reset link sent successfully to ${owner.owner_email}`);
        
    } catch (error) {
        console.error('Error sending password reset:', error);
        alert('Failed to send password reset: ' + error.message);
    }
};

// ============================================
// EVENT LISTENERS SETUP
// ============================================
function setupEventListeners() {
    // Login
    document.getElementById('adminLoginBtn')?.addEventListener('click', handleAdminLogin);
    document.getElementById('adminPassword')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleAdminLogin();
    });
    
    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', logout);
    
    // New Listing
    document.getElementById('newListingBtn')?.addEventListener('click', newListing);
    
    // Refresh
    document.getElementById('refreshBtn')?.addEventListener('click', loadListings);
    
    // Search
    document.getElementById('adminSearch')?.addEventListener('input', renderTable);
    
    // Analytics
    document.getElementById('closeAnalytics')?.addEventListener('click', () => {
        document.getElementById('analyticsModal').classList.add('hidden');
        currentAnalyticsListing = null;
        currentAnalyticsTab = 'overview';
    });
    
    document.getElementById('refreshAnalytics')?.addEventListener('click', async () => {
        if (!currentAnalyticsListing) return;
        
        const { data: listing, error } = await supabase
            .from('listings')
            .select('*')
            .eq('id', currentAnalyticsListing.id)
            .single();
        
        if (!error && listing) {
            currentAnalyticsListing = listing;
            document.getElementById('analyticsLastUpdated').textContent = new Date().toLocaleString();
            renderAnalyticsContent();
        }
    });
    
    // Delete
    document.getElementById('cancelDelete')?.addEventListener('click', () => {
        document.getElementById('deleteModal').classList.add('hidden');
        document.getElementById('deleteConfirmInput').value = '';
        deletingListingId = null;
    });
    
    document.getElementById('confirmDelete')?.addEventListener('click', confirmDelete);
    
    // Edit form
    setupEditFormListeners();
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupEventListeners);
} else {
    setupEventListeners();
}
