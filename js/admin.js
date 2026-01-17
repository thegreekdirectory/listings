const GITHUB_OWNER = 'thegreekdirectory';
const GITHUB_REPO = 'listings';
const DATABASE_PATH = 'listings-database.json';

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

const CATEGORY_IMAGES = {
    'automotive-transportation': {
        main: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&q=80',
        logo: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=200&h=200&fit=crop&q=80'
    },
    'beauty-health': {
        main: 'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=800&q=80',
        logo: 'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=200&h=200&fit=crop&q=80'
    },
    'church-religious-organization': {
        main: 'https://images.unsplash.com/photo-1601231656153-73aa7f115365?w=800&q=80',
        logo: 'https://images.unsplash.com/photo-1601231656153-73aa7f115365?w=200&h=200&fit=crop&q=80'
    },
    'cultural-fraternal-organization': {
        main: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80',
        logo: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=200&h=200&fit=crop&q=80'
    },
    'education-community': {
        main: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&q=80',
        logo: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=200&h=200&fit=crop&q=80'
    },
    'entertainment-arts-recreation': {
        main: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80',
        logo: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200&h=200&fit=crop&q=80'
    },
    'food-hospitality': {
        main: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
        logo: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&h=200&fit=crop&q=80'
    },
    'grocery-imports': {
        main: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80',
        logo: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&h=200&fit=crop&q=80'
    },
    'home-construction': {
        main: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&q=80',
        logo: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=200&h=200&fit=crop&q=80'
    },
    'industrial-manufacturing': {
        main: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80',
        logo: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=200&h=200&fit=crop&q=80'
    },
    'pets-veterinary': {
        main: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&q=80',
        logo: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=200&h=200&fit=crop&q=80'
    },
    'professional-business-services': {
        main: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80',
        logo: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=200&h=200&fit=crop&q=80'
    },
    'real-estate-development': {
        main: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80',
        logo: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=200&h=200&fit=crop&q=80'
    },
    'retail-shopping': {
        main: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80',
        logo: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200&h=200&fit=crop&q=80'
    }
};

function getCategoryDefaults(category) {
    const slug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return CATEGORY_IMAGES[slug] || {
        main: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80',
        logo: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=200&h=200&fit=crop&q=80'
    };
}

let githubToken = null;
let allListings = [], editingListing = null;
let selectedSubcategories = [], nextListingId = 1;
let ownerFieldsVisibility = { name: true, title: true, greece: false, email: false, phone: false };
let currentAnalyticsListing = null, currentAnalyticsTab = 'overview';
let deletingListingId = null;
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

async function handleAdminLogin() {
    const token = document.getElementById('githubToken').value.trim();
    
    if (!token) {
        showError('Incorrect token. Try again.');
        return;
    }
    
    clearAuthMessage();
    
    try {
        const response = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}`, {
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (response.ok) {
            githubToken = token;
            localStorage.setItem('admin_github_token', token);
            showSuccess('Authentication successful!');
            await loadListings();
            showDashboard();
        } else {
            showError('Invalid token or insufficient permissions');
        }
    } catch (error) {
        showError('Authentication failed: ' + error.message);
    }
}

function showDashboard() {
    document.getElementById('loginPage').classList.add('hidden');
    document.getElementById('dashboardPage').classList.remove('hidden');
    renderTable();
}

function showLoginPage() {
    document.getElementById('loginPage').classList.remove('hidden');
    document.getElementById('dashboardPage').classList.add('hidden');
    githubToken = null;
    localStorage.removeItem('admin_github_token');
}

document.addEventListener('DOMContentLoaded', async () => {
    const savedToken = localStorage.getItem('admin_github_token');
    
    if (savedToken) {
        document.getElementById('githubToken').value = savedToken;
        await handleAdminLogin();
    }
    
    setupEventListeners();
});

document.getElementById('logoutBtn').addEventListener('click', () => {
    if (confirm('Are you sure you want to logout?')) {
        showLoginPage();
    }
});

async function loadListings() {
    console.log('📥 Loading listings from GitHub...');
    try {
        const response = await fetch(`https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/main/${DATABASE_PATH}`);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.status}`);
        }
        
        const data = await response.json();
        allListings = data.listings || [];
        console.log('Loaded', allListings.length, 'listings');
        
        nextListingId = Math.max(...allListings.map(l => l.listingId || 0), 0) + 1;
        console.log('Next listing ID will be:', nextListingId);
        
        renderTable();
    } catch (error) {
        console.error('❌ Error loading listings:', error);
        alert('Failed to load listings');
    }
}

function generateSlug(name) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function renderTable() {
    const tbody = document.getElementById('listingsTableBody');
    const searchTerm = document.getElementById('adminSearch') ? document.getElementById('adminSearch').value.toLowerCase() : '';
    
    const filtered = searchTerm ? allListings.filter(l => 
        l.businessName.toLowerCase().includes(searchTerm) ||
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
        
        return `
        <tr class="border-b hover:bg-gray-50">
            <td class="py-4 px-4 text-sm font-mono text-gray-600">#${l.listingId || 'N/A'}</td>
            <td class="py-4 px-4">
                <label class="inline-flex items-center cursor-pointer">
                    <input type="checkbox" ${l.visible ? 'checked' : ''} onchange="toggleVisibility('${l.id}')" class="w-4 h-4">
                    <span class="ml-2 text-sm">${l.visible ? '👁️ Visible' : '🚫 Hidden'}</span>
                </label>
            </td>
            <td class="py-4 px-4">
                <span class="px-2 py-1 rounded text-xs font-medium ${tierColors[tier]}">${tier}</span>
            </td>
            <td class="py-4 px-4 font-medium">${l.businessName}</td>
            <td class="py-4 px-4 text-gray-600">${l.category}</td>
            <td class="py-4 px-4 text-sm text-gray-600">${l.city || ''}, ${l.state || ''}</td>
            <td class="py-4 px-4 text-sm text-gray-600">${new Date(l.metadata.updatedAt).toLocaleString()}</td>
            <td class="py-4 px-4">
                <div class="flex justify-end gap-2">
                    <button onclick="showAnalytics('${l.id}')" class="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200">📊</button>
                    <button onclick="editListing('${l.id}')" class="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200">Edit</button>
                    <a href="${listingUrl}" target="_blank" class="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">View</a>
                    <button onclick="showDeleteModal('${l.id}')" class="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200">Delete</button>
                </div>
            </td>
        </tr>
    `}).join('');
}

window.toggleVisibility = async function(id) {
    const listing = allListings.find(l => l.id === id);
    listing.visible = !listing.visible;
    listing.metadata.updatedAt = new Date().toISOString();
    await saveToGitHub(true);
};

window.editListing = function(id) {
    editingListing = allListings.find(l => l.id === id);
    document.getElementById('modalTitle').textContent = 'Edit Listing';
    fillForm(editingListing);
    document.getElementById('editModal').classList.remove('hidden');
};

window.handleAdminLogin = handleAdminLogin;
        window.showAnalytics = function(id) {
    const listing = allListings.find(l => l.id === id);
    if (!listing) return;
    
    currentAnalyticsListing = listing;
    currentAnalyticsTab = 'overview';
    
    const businessNameSpan = document.getElementById('analyticsBusinessName');
    const lastUpdatedSpan = document.getElementById('analyticsLastUpdated');
    
    if (businessNameSpan) businessNameSpan.textContent = listing.businessName;
    if (lastUpdatedSpan) lastUpdatedSpan.textContent = new Date().toLocaleString();
    
    renderAnalyticsContent();
    
    document.getElementById('analyticsModal').classList.remove('hidden');
};

window.switchAnalyticsTab = function(tab) {
    currentAnalyticsTab = tab;
    
    document.querySelectorAll('.analytics-tab').forEach(t => {
        t.classList.remove('active');
    });
    
    const activeTab = document.querySelector(`.analytics-tab[data-tab="${tab}"]`);
    if (activeTab) {
        activeTab.classList.add('active');
    }
    
    renderAnalyticsContent();
};

document.getElementById('closeAnalytics').addEventListener('click', () => {
    document.getElementById('analyticsModal').classList.add('hidden');
    currentAnalyticsListing = null;
    currentAnalyticsTab = 'overview';
});

document.getElementById('refreshAnalytics').addEventListener('click', async () => {
    if (!currentAnalyticsListing) return;
    await loadListings();
    const updatedListing = allListings.find(l => l.id === currentAnalyticsListing.id);
    if (updatedListing) {
        currentAnalyticsListing = updatedListing;
        const lastUpdatedSpan = document.getElementById('analyticsLastUpdated');
        if (lastUpdatedSpan) lastUpdatedSpan.textContent = new Date().toLocaleString();
        renderAnalyticsContent();
    }
});

function renderAnalyticsContent() {
    if (!currentAnalyticsListing) return;
    
    const analytics = currentAnalyticsListing.analytics || {
        views: 0,
        callClicks: 0,
        websiteClicks: 0,
        directionClicks: 0,
        shareClicks: 0,
        sharePlatforms: {},
        videoPlays: 0,
        lastViewed: 'Never',
        detailedViews: []
    };
    
    const content = document.getElementById('analyticsContent');
    if (!content) return;
    
    let html = '';
    
    if (currentAnalyticsTab === 'overview') {
        html = `
            <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <div class="analytics-stat-card">
                    <div class="text-4xl font-bold mb-2">${analytics.views || 0}</div>
                    <div class="text-sm opacity-90">Total Views</div>
                </div>
                <div class="analytics-stat-card" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
                    <div class="text-4xl font-bold mb-2">${analytics.callClicks || 0}</div>
                    <div class="text-sm opacity-90">Call Clicks</div>
                </div>
                <div class="analytics-stat-card" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
                    <div class="text-4xl font-bold mb-2">${analytics.websiteClicks || 0}</div>
                    <div class="text-sm opacity-90">Website Clicks</div>
                </div>
                <div class="analytics-stat-card" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
                    <div class="text-4xl font-bold mb-2">${analytics.directionClicks || 0}</div>
                    <div class="text-sm opacity-90">Direction Clicks</div>
                </div>
                <div class="analytics-stat-card" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);">
                    <div class="text-4xl font-bold mb-2">${analytics.shareClicks || 0}</div>
                    <div class="text-sm opacity-90">Share Clicks</div>
                </div>
                <div class="analytics-stat-card" style="background: linear-gradient(135deg, #30cfd0 0%, #330867 100%);">
                    <div class="text-lg font-bold mb-2">${analytics.lastViewed ? new Date(analytics.lastViewed).toLocaleString() : 'Never'}</div>
                    <div class="text-sm opacity-90">Last Viewed</div>
                </div>
            </div>
            
            ${analytics.detailedViews && analytics.detailedViews.length > 0 ? `
                <div class="bg-gray-50 rounded-lg p-4">
                    <h3 class="font-bold text-gray-900 mb-3">Recent Activity (Last 30 actions)</h3>
                    <div class="space-y-2">
                        ${analytics.detailedViews.slice(-30).reverse().map(v => `
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
        const now = new Date();
        let filteredViews = [];
        
        if (currentAnalyticsTab === 'today') {
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            filteredViews = analytics.detailedViews?.filter(v => new Date(v.timestamp) >= todayStart) || [];
        } else if (currentAnalyticsTab === 'yesterday') {
            const yesterdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
            const yesterdayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            filteredViews = analytics.detailedViews?.filter(v => {
                const d = new Date(v.timestamp);
                return d >= yesterdayStart && d < yesterdayEnd;
            }) || [];
        } else if (currentAnalyticsTab === 'week') {
            const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            filteredViews = analytics.detailedViews?.filter(v => new Date(v.timestamp) >= weekStart) || [];
        } else if (currentAnalyticsTab === 'month') {
            const monthStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            filteredViews = analytics.detailedViews?.filter(v => new Date(v.timestamp) >= monthStart) || [];
        } else if (currentAnalyticsTab === 'alltime') {
            filteredViews = analytics.detailedViews || [];
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
        function clearForm() {
    document.querySelectorAll('#editModal input, #editModal textarea, #editModal select').forEach(el => {
        if (el.type === 'checkbox') el.checked = false;
        else el.value = '';
    });
    document.getElementById('editCountry').value = 'USA';
    document.getElementById('editTier').value = 'FREE';
    
    const descriptionMaxEl = document.getElementById('descriptionMax');
    const taglineCountEl = document.getElementById('taglineCount');
    const descriptionCountEl = document.getElementById('descriptionCount');
    
    if (descriptionMaxEl) descriptionMaxEl.textContent = '2000';
    if (taglineCountEl) taglineCountEl.textContent = '0';
    if (descriptionCountEl) descriptionCountEl.textContent = '0';
    
    selectedSubcategories = [];
    ownerFieldsVisibility = { name: true, title: true, greece: false, email: false, phone: false };
    
    document.querySelectorAll('.visibility-toggle').forEach(btn => {
        const field = btn.getAttribute('data-field');
        if (ownerFieldsVisibility[field]) {
            btn.className = 'visibility-toggle visible';
            btn.textContent = 'Visible';
        } else {
            btn.className = 'visibility-toggle hidden';
            btn.textContent = 'Hidden';
        }
    });
    
    const subcatContainer = document.getElementById('subcategoriesContainer');
    if (subcatContainer) subcatContainer.classList.add('hidden');
}

function fillForm(l) {
    const editListingId = document.getElementById('editListingId');
    const editBusinessName = document.getElementById('editBusinessName');
    const editTagline = document.getElementById('editTagline');
    const taglineCount = document.getElementById('taglineCount');
    const editDescription = document.getElementById('editDescription');
    const descriptionCount = document.getElementById('descriptionCount');
    const editCategory = document.getElementById('editCategory');
    const editTier = document.getElementById('editTier');
    const editPlacesUrl = document.getElementById('editPlacesUrl');
    const descriptionMax = document.getElementById('descriptionMax');
    
    if (editListingId) editListingId.value = l.listingId || 'N/A';
    if (editBusinessName) editBusinessName.value = l.businessName;
    if (editTagline) editTagline.value = l.tagline || '';
    if (taglineCount) taglineCount.textContent = (l.tagline || '').length;
    if (editDescription) editDescription.value = l.description || '';
    if (descriptionCount) descriptionCount.textContent = (l.description || '').length;
    if (editCategory) editCategory.value = l.category;
    if (editTier) editTier.value = l.tier || 'FREE';
    if (editPlacesUrl) editPlacesUrl.value = l.placesUrlEnding || '';
    
    const maxDesc = (l.tier === 'FREE' ? 1000 : 2000);
    if (descriptionMax) descriptionMax.textContent = maxDesc;
    
    selectedSubcategories = l.subcategories || [];
    updateSubcategoriesForCategory();
    
    const editPhone = document.getElementById('editPhone');
    const editAddress = document.getElementById('editAddress');
    const editCity = document.getElementById('editCity');
    const editState = document.getElementById('editState');
    const editZipCode = document.getElementById('editZipCode');
    const editCountry = document.getElementById('editCountry');
    const editEmail = document.getElementById('editEmail');
    const editWebsite = document.getElementById('editWebsite');
    const editShowClaim = document.getElementById('editShowClaim');
    
    if (editPhone) editPhone.value = l.phone || '';
    if (editAddress) editAddress.value = l.address || '';
    if (editCity) editCity.value = l.city || '';
    if (editState) editState.value = l.state || 'IL';
    if (editZipCode) editZipCode.value = l.zipCode || '';
    if (editCountry) editCountry.value = l.country || 'USA';
    if (editEmail) editEmail.value = l.email || '';
    if (editWebsite) editWebsite.value = l.website || '';
    if (editShowClaim) editShowClaim.checked = l.showClaimButton !== false;

    const h = l.hours || {};
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    days.forEach(day => {
        const el = document.getElementById(`editHours${day}`);
        if (el) el.value = h[day.toLowerCase()] || '';
    });

    const editLogo = document.getElementById('editLogo');
    if (editLogo) editLogo.value = l.logo || '';

    const editPhotos = document.getElementById('editPhotos');
    if (editPhotos && l.photos && l.photos.length > 0) {
        editPhotos.value = l.photos.join('\n');
    }

    const s = l.socialMedia || {};
    ['Facebook', 'Instagram', 'Twitter', 'Youtube', 'Tiktok', 'Linkedin', 'Other1', 'Other2', 'Other3'].forEach(field => {
        const el = document.getElementById(`edit${field}`);
        if (el) el.value = s[field.toLowerCase()] || '';
    });

    const r = l.reviews || {};
    ['Google', 'Yelp', 'Tripadvisor', 'ReviewOther1', 'ReviewOther2', 'ReviewOther3'].forEach(field => {
        const el = document.getElementById(`edit${field}`);
        const key = field.replace('Review', '').toLowerCase().replace('other', 'other');
        if (el) el.value = r[key] || '';
    });

    const o = l.ownerInfo || {};
    const editOwnerName = document.getElementById('editOwnerName');
    const editOwnerTitle = document.getElementById('editOwnerTitle');
    const editOwnerGreece = document.getElementById('editOwnerGreece');
    const editOwnerEmail = document.getElementById('editOwnerEmail');
    const editOwnerPhone = document.getElementById('editOwnerPhone');
    
    if (editOwnerName) editOwnerName.value = o.fullName || '';
    if (editOwnerTitle) editOwnerTitle.value = o.title || '';
    if (editOwnerGreece) editOwnerGreece.value = o.fromGreece || '';
    if (editOwnerEmail) editOwnerEmail.value = o.ownerEmail || '';
    if (editOwnerPhone) editOwnerPhone.value = o.ownerPhone || '';
    
    ownerFieldsVisibility = o.visibility || { name: true, title: true, greece: false, email: false, phone: false };
    document.querySelectorAll('.visibility-toggle').forEach(btn => {
        const field = btn.getAttribute('data-field');
        if (ownerFieldsVisibility[field]) {
            btn.className = 'visibility-toggle visible';
            btn.textContent = 'Visible';
        } else {
            btn.className = 'visibility-toggle hidden';
            btn.textContent = 'Hidden';
        }
    });
}

window.updateCharCounter = function(field) {
    if (field === 'tagline') {
        const input = document.getElementById('editTagline');
        const counter = document.getElementById('taglineCount');
        counter.textContent = input.value.length;
    } else if (field === 'description') {
        const input = document.getElementById('editDescription');
        const counter = document.getElementById('descriptionCount');
        const max = parseInt(document.getElementById('descriptionMax').textContent);
        const current = input.value.length;
        
        counter.textContent = current;
        counter.parentElement.className = 'text-xs text-gray-500 mt-1';
        
        if (current > max) {
            counter.parentElement.className = 'text-xs text-red-600 mt-1';
            input.value = input.value.substring(0, max);
            counter.textContent = max;
        } else if (current > max * 0.9) {
            counter.parentElement.className = 'text-xs text-yellow-600 mt-1';
        }
    }
};

window.updateVerifiedBasedOnTier = function() {
    const tier = document.getElementById('editTier');
    if (!tier) return;
    const maxDesc = (tier.value === 'FREE' ? 1000 : 2000);
    const descMaxEl = document.getElementById('descriptionMax');
    if (descMaxEl) descMaxEl.textContent = maxDesc;
    updateCharCounter('description');
};

window.toggleOwnerFieldVisibility = function(field) {
    ownerFieldsVisibility[field] = !ownerFieldsVisibility[field];
    const button = document.querySelector(`.visibility-toggle[data-field="${field}"]`);
    if (!button) return;
    if (ownerFieldsVisibility[field]) {
        button.className = 'visibility-toggle visible';
        button.textContent = 'Visible';
    } else {
        button.className = 'visibility-toggle hidden';
        button.textContent = 'Hidden';
    }
    const visField = document.getElementById('ownerFieldsVisibility');
    if (visField) visField.value = JSON.stringify(ownerFieldsVisibility);
};

window.updateSubcategoriesForCategory = function() {
    const category = document.getElementById('editCategory');
    const container = document.getElementById('subcategoriesContainer');
    
    if (!category || !container) return;
    
    if (SUBCATEGORIES[category.value]) {
        container.classList.remove('hidden');
        const checkboxDiv = document.getElementById('subcategoryCheckboxes');
        if (!checkboxDiv) return;
        checkboxDiv.innerHTML = '';
        SUBCATEGORIES[category.value].forEach(sub => {
            const checked = selectedSubcategories.includes(sub);
            const div = document.createElement('div');
            div.className = 'subcategory-checkbox';
            div.innerHTML = `
                <input type="checkbox" id="subcat-${sub.replace(/\s+/g, '-')}" ${checked ? 'checked' : ''} onchange="toggleSubcategory('${sub}')">
                <label for="subcat-${sub.replace(/\s+/g, '-')}">${sub}</label>
            `;
            checkboxDiv.appendChild(div);
        });
    } else {
        container.classList.add('hidden');
    }
};

window.toggleSubcategory = function(subcategory) {
    const index = selectedSubcategories.indexOf(subcategory);
    if (index > -1) {
        selectedSubcategories.splice(index, 1);
    } else {
        selectedSubcategories.push(subcategory);
    }
};
        async function geocodeAddress(address, city, state, zipCode) {
    const fullAddress = `${address}, ${city}, ${state} ${zipCode || ''}`.trim();
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}&limit=1`);
        const data = await response.json();
        if (data && data.length > 0) {
            return {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon)
            };
        }
        return null;
    } catch (e) {
        console.error('Geocoding failed:', e);
        return null;
    }
}

async function getFormData() {
    const editBusinessName = document.getElementById('editBusinessName');
    const editTagline = document.getElementById('editTagline');
    const editCategory = document.getElementById('editCategory');
    const editTier = document.getElementById('editTier');
    const editDescription = document.getElementById('editDescription');
    
    if (!editBusinessName || !editTagline || !editCategory || !editTier) {
        alert('Required form fields missing');
        return null;
    }
    
    const name = editBusinessName.value.trim();
    const tagline = editTagline.value.trim();
    const category = editCategory.value;
    const tier = editTier.value;
    const description = editDescription ? editDescription.value : '';
    
    if (!name) { alert('Business name required'); return null; }
    if (!tagline) { alert('Tagline required'); return null; }
    if (!category) { alert('Category required'); return null; }
    if (selectedSubcategories.length === 0) {
        alert('At least one subcategory required');
        return null;
    }

    const maxDesc = (tier === 'FREE' ? 1000 : 2000);
    if (description.length > maxDesc) {
        alert(`Description too long! Max ${maxDesc} characters for ${tier} tier.`);
        return null;
    }

    let slug;
    if (editingListing) {
        slug = editingListing.slug;
    } else {
        slug = generateSlug(name);
    }

    const getData = (id) => {
        const el = document.getElementById(id);
        return el ? el.value || null : null;
    };

    const editPhotos = document.getElementById('editPhotos');
    let photosArray = [];
    if (editPhotos && editPhotos.value.trim()) {
        photosArray = editPhotos.value.split('\n').map(url => url.trim()).filter(url => url);
    }

    return {
        businessName: name,
        tagline: tagline,
        description: description,
        category: category,
        subcategories: selectedSubcategories,
        phone: getData('editPhone'),
        address: getData('editAddress'),
        city: getData('editCity'),
        state: getData('editState'),
        zipCode: getData('editZipCode'),
        country: getData('editCountry') || 'USA',
        email: getData('editEmail'),
        website: getData('editWebsite'),
        tier: tier,
        verified: tier !== 'FREE',
        showClaimButton: document.getElementById('editShowClaim') ? document.getElementById('editShowClaim').checked : true,
        placesUrlEnding: getData('editPlacesUrl'),
        slug: slug,
        logo: getData('editLogo'),
        photos: photosArray,
        hours: {
            monday: getData('editHoursMonday'),
            tuesday: getData('editHoursTuesday'),
            wednesday: getData('editHoursWednesday'),
            thursday: getData('editHoursThursday'),
            friday: getData('editHoursFriday'),
            saturday: getData('editHoursSaturday'),
            sunday: getData('editHoursSunday')
        },
        socialMedia: {
            facebook: getData('editFacebook'),
            instagram: getData('editInstagram'),
            twitter: getData('editTwitter'),
            youtube: getData('editYoutube'),
            tiktok: getData('editTiktok'),
            linkedin: getData('editLinkedin'),
            other1: getData('editOther1'),
            other2: getData('editOther2'),
            other3: getData('editOther3')
        },
        reviews: {
            google: getData('editGoogle'),
            yelp: getData('editYelp'),
            tripadvisor: getData('editTripadvisor'),
            other1: getData('editReviewOther1'),
            other2: getData('editReviewOther2'),
            other3: getData('editReviewOther3')
        },
        ownerInfo: {
            fullName: getData('editOwnerName'),
            title: getData('editOwnerTitle'),
            fromGreece: getData('editOwnerGreece'),
            ownerEmail: getData('editOwnerEmail'),
            ownerPhone: getData('editOwnerPhone'),
            visibility: ownerFieldsVisibility
        }
    };
}

async function saveToGitHub(silent = false) {
    console.log('💾 Starting database save to GitHub...');
    console.log('Current allListings count:', allListings.length);
    
    if (!githubToken) {
        alert('ERROR: No GitHub token available');
        return false;
    }
    
    try {
        console.log('Fetching current database file info...');
        const fileInfoResponse = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${DATABASE_PATH}`, {
            headers: {
                'Authorization': `token ${githubToken}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (!fileInfoResponse.ok) {
            throw new Error(`Failed to fetch file info: ${fileInfoResponse.status}`);
        }
        
        const fileInfo = await fileInfoResponse.json();
        const currentSha = fileInfo.sha;
        
        const databaseContent = { listings: allListings };
        const jsonString = JSON.stringify(databaseContent, null, 2);
        const base64Content = btoa(unescape(encodeURIComponent(jsonString)));
        
        console.log('Updating file on GitHub...');
        const updateResponse = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${DATABASE_PATH}`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${githubToken}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `Update listings database - ${allListings.length} listings`,
                content: base64Content,
                sha: currentSha
            })
        });

        if (updateResponse.ok) {
            console.log('✅ Database saved successfully to GitHub!');
            
            if (!silent) {
                alert('✅ Database saved successfully!');
            }
            
            return true;
        } else {
            const errorData = await updateResponse.json();
            console.error('❌ Failed to save database:', errorData);
            alert(`ERROR: Failed to save database. ${errorData.message || 'Unknown error'}`);
            return false;
        }
    } catch (error) {
        console.error('❌ Error in saveToGitHub:', error);
        alert(`ERROR: ${error.message}`);
        return false;
    }
}

async function saveEditHandler() {
    console.log('=== SAVE BUTTON CLICKED ===');
    
    const listing = await getFormData();
    if (!listing) {
        console.log('Form data validation failed');
        return;
    }

    console.log('Form data collected:', listing.businessName);

    const slug = listing.slug;
    const categorySlug = listing.category.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    console.log('Slug:', slug);
    console.log('Category slug:', categorySlug);

    if (listing.address && listing.city && listing.state) {
        console.log('🌍 Geocoding address...');
        const coords = await geocodeAddress(listing.address, listing.city, listing.state, listing.zipCode);
        if (coords) {
            listing.coordinates = coords;
            console.log('✅ Geocoded:', coords);
        } else {
            console.log('⚠️ Geocoding failed, continuing without coordinates');
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const defaults = getCategoryDefaults(listing.category);
    
    if (!listing.logo || listing.logo.trim() === '') {
        listing.logo = defaults.logo;
        console.log('Using default logo:', listing.logo);
    } else {
        console.log('Using provided logo:', listing.logo);
    }

    if (!listing.photos || listing.photos.length === 0) {
        listing.photos = [defaults.main];
        console.log('Using default photo');
    } else {
        console.log('Using provided photos:', listing.photos.length);
    }

    listing.verified = listing.tier !== 'FREE';

    if (editingListing) {
        console.log('📝 UPDATING existing listing:', editingListing.id);
        const index = allListings.findIndex(l => l.id === editingListing.id);
        console.log('Found at index:', index);
        
        listing.id = editingListing.id;
        listing.listingId = editingListing.listingId;
        listing.metadata = {
            createdAt: editingListing.metadata.createdAt,
            updatedAt: new Date().toISOString()
        };
        listing.analytics = editingListing.analytics || {
            views: 0,
            callClicks: 0,
            websiteClicks: 0,
            directionClicks: 0,
            shareClicks: 0,
            sharePlatforms: {},
            videoPlays: 0,
            lastViewed: new Date().toISOString(),
            detailedViews: []
        };
        listing.visible = editingListing.visible !== undefined ? editingListing.visible : true;
        
        allListings[index] = listing;
        console.log('Updated listing at index', index);
    } else {
        console.log('✨ CREATING new listing');
        listing.id = slug;
        listing.listingId = nextListingId;
        console.log('Assigned listing ID:', listing.listingId);
        
        nextListingId++;
        
        listing.visible = true;
        listing.metadata = {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        listing.analytics = {
            views: 0,
            callClicks: 0,
            websiteClicks: 0,
            directionClicks: 0,
            shareClicks: 0,
            sharePlatforms: {},
            videoPlays: 0,
            lastViewed: new Date().toISOString(),
            detailedViews: []
        };
        
        allListings.push(listing);
        console.log('Added to allListings array, new count:', allListings.length);
    }

    console.log('');
    console.log('📦 STEP 1: Saving database...');
    const dbSaved = await saveToGitHub(false);
    
    if (!dbSaved) {
        console.error('❌ Database save failed, aborting...');
        alert('Failed to save database. Listing page will not be generated.');
        return;
    }
    
    console.log('✅ Database saved successfully');
    console.log('');

    console.log('📄 STEP 2: Generating listing page...');
    const pageGenerated = await generateListingPage(listing);
    
    if (!pageGenerated) {
        console.log('⚠️ Page generation failed, but database was saved');
        alert('⚠️ Database saved but page generation failed. Check console for errors.');
    } else {
        console.log('✅ Page generated successfully');
        alert('✅ Listing saved and page generated successfully!');
    }
    console.log('');

    console.log('=== SAVE COMPLETE ===');
    console.log('');
    
    document.getElementById('editModal').classList.add('hidden');
    selectedSubcategories = [];
    
    renderTable();
}
        

// Place this entire function in admin.html after saveToGitHub function
async function generateListingPage(listing) {
    console.log('📄 Generating listing page for:', listing.businessName);
    
    if (!githubToken) {
        console.error('No GitHub token available');
        return false;
    }
    
    try {
        // Fetch the template
        const templateResponse = await fetch(`https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/main/listing-template.html`);
        
        if (!templateResponse.ok) {
            throw new Error('Failed to fetch template');
        }
        
        let template = await templateResponse.text();
        
        // Generate values
        const categorySlug = listing.category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const listingUrl = `https://listings.thegreekdirectory.org/listings/${categorySlug}/${listing.slug}`;
        const cityState = listing.city && listing.state ? ` in ${listing.city}, ${listing.state}` : '';
        const inCity = listing.city ? ` in ${listing.city}` : '';
        const fullAddress = listing.address && listing.city && listing.state 
            ? `${listing.address}, ${listing.city}, ${listing.state} ${listing.zipCode || ''}`
            : listing.city && listing.state 
            ? `${listing.city}, ${listing.state}`
            : '';
        
        // Basic replacements
        template = template.replace(/{{BUSINESS_NAME}}/g, listing.businessName);
        template = template.replace(/{{CITY_STATE}}/g, cityState);
        template = template.replace(/{{IN_CITY}}/g, inCity);
        template = template.replace(/{{TAGLINE}}/g, listing.tagline || '');
        template = template.replace(/{{LISTING_URL}}/g, listingUrl);
        template = template.replace(/{{LOGO}}/g, listing.logo || '');
        template = template.replace(/{{CATEGORY}}/g, listing.category);
        template = template.replace(/{{DESCRIPTION}}/g, (listing.description || '').replace(/\n/g, '<br>'));
        template = template.replace(/{{ADDRESS}}/g, listing.address || '');
        template = template.replace(/{{CITY}}/g, listing.city || '');
        template = template.replace(/{{STATE}}/g, listing.state || '');
        template = template.replace(/{{ZIP_CODE}}/g, listing.zipCode || '');
        template = template.replace(/{{COUNTRY}}/g, listing.country || 'USA');
        template = template.replace(/{{PHONE}}/g, listing.phone || '');
        template = template.replace(/{{EMAIL}}/g, listing.email || '');
        template = template.replace(/{{WEBSITE}}/g, listing.website || '');
        template = template.replace(/{{WEBSITE_DOMAIN}}/g, listing.website ? new URL(listing.website).hostname : '');
        template = template.replace(/{{LISTING_ID}}/g, listing.id);
        template = template.replace(/{{BUSINESS_NAME_ENCODED}}/g, encodeURIComponent(listing.businessName));
        template = template.replace(/{{FULL_ADDRESS}}/g, fullAddress);
        
        const coordinates = listing.coordinates 
            ? `${listing.coordinates.lat},${listing.coordinates.lng}` 
            : '';
        template = template.replace(/{{COORDINATES}}/g, coordinates);
        
        const hoursJson = JSON.stringify(listing.hours || {});
        template = template.replace(/{{HOURS_JSON}}/g, hoursJson);
        
        // Photos carousel
        const photosSlides = (listing.photos && listing.photos.length > 0 
            ? listing.photos 
            : [listing.logo]).map(photo => 
            `<div class="carousel-slide h-full"><img src="${photo}" alt="${listing.businessName}" class="w-full h-full object-cover"></div>`
        ).join('');
        template = template.replace(/{{PHOTOS_SLIDES}}/g, photosSlides);
        
        const totalPhotos = (listing.photos && listing.photos.length > 0 ? listing.photos.length : 1);
        template = template.replace(/{{TOTAL_PHOTOS}}/g, totalPhotos);
        
        const carouselControls = totalPhotos > 1 
            ? `<div class="carousel-nav carousel-prev" onclick="prevSlide()">‹</div>
               <div class="carousel-nav carousel-next" onclick="nextSlide()">›</div>
               <div class="carousel-dots">${Array.from({length: totalPhotos}, (_, i) => 
                   `<div class="carousel-dot ${i === 0 ? 'active' : ''}" onclick="goToSlide(${i})"></div>`
               ).join('')}</div>` 
            : '';
        template = template.replace(/{{CAROUSEL_CONTROLS}}/g, carouselControls);
        
        // Subcategories
        const subcategoriesTags = listing.subcategories && listing.subcategories.length > 0
            ? listing.subcategories.map(sub => `<span class="subcategory-tag">${sub}</span>`).join('')
            : '';
        template = template.replace(/{{SUBCATEGORIES_TAGS}}/g, subcategoriesTags);
        
        // Status badges
        const statusBadges = [];
        if (listing.tier === 'FEATURED' || listing.tier === 'PREMIUM') statusBadges.push('<span class="badge badge-featured">Featured</span>');
        if (listing.verified) statusBadges.push('<span class="badge badge-verified">Verified</span>');
        if (!listing.showClaimButton && listing.tier === 'FREE') statusBadges.push('<span class="badge badge-claimed">Claimed</span>');
        if (listing.hours && Object.values(listing.hours).some(h => h)) {
            statusBadges.push('<span class="badge" id="openClosedBadge">...</span>');
        }
        template = template.replace(/{{STATUS_BADGES}}/g, statusBadges.join(''));
        
        template = template.replace(/{{TAGLINE_DISPLAY}}/g, listing.tagline ? `<p class="text-gray-600 italic mb-2">"${listing.tagline}"</p>` : '');
        // Contact sections
        const addressSection = listing.address ? `
            <div class="flex items-start gap-2">
                <svg class="w-5 h-5 text-gray-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
                <span>${fullAddress}</span>
            </div>
        ` : '';
        template = template.replace(/{{ADDRESS_SECTION}}/g, addressSection);
        
        const phoneSection = listing.phone ? `
            <div class="flex items-center gap-2">
                <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                </svg>
                <span>${listing.phone}</span>
            </div>
        ` : '';
        template = template.replace(/{{PHONE_SECTION}}/g, phoneSection);
        
        const emailSection = listing.email ? `
            <div class="flex items-center gap-2">
                <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                </svg>
                <span>${listing.email}</span>
            </div>
        ` : '';
        template = template.replace(/{{EMAIL_SECTION}}/g, emailSection);
        
        const websiteSection = listing.website ? `
            <div class="flex items-center gap-2">
                <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path>
                </svg>
                <a href="${listing.website}" target="_blank" class="text-blue-600 hover:underline">${listing.website}</a>
            </div>
        ` : '';
        template = template.replace(/{{WEBSITE_SECTION}}/g, websiteSection);
        
        // Hours section
        let hoursSection = '';
        if (listing.hours && Object.values(listing.hours).some(h => h)) {
            const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
            const hoursHTML = days.map(day => {
                const hours = listing.hours[day.toLowerCase()];
                if (hours) {
                    return `<div class="flex justify-between text-sm"><span class="font-medium">${day}:</span><span>${hours}</span></div>`;
                }
                return '';
            }).filter(h => h).join('');
            
            if (hoursHTML) {
                hoursSection = `
                    <div>
                        <h3 class="font-semibold text-gray-900 mb-2">Hours</h3>
                        <div class="space-y-1">${hoursHTML}</div>
                        <div id="openStatusText" class="mt-2"></div>
                        <div class="hours-disclaimer">Hours may not be accurate. Please call to confirm.</div>
                    </div>
                `;
            }
        }
        template = template.replace(/{{HOURS_SECTION}}/g, hoursSection);
        
        // Action Buttons
        const phoneButton = listing.phone ? `
            <a href="tel:${listing.phone}" class="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium" onclick="trackClick('call')">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                </svg>
                Call
            </a>
        ` : '';
        template = template.replace(/{{PHONE_BUTTON}}/g, phoneButton);
        
        const emailButton = listing.email ? `
            <a href="mailto:${listing.email}" class="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                </svg>
                Email
            </a>
        ` : '';
        template = template.replace(/{{EMAIL_BUTTON}}/g, emailButton);
        
        const websiteButton = listing.website ? `
            <a href="${listing.website}" target="_blank" class="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium" onclick="trackClick('website')">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path>
                </svg>
                Website
            </a>
        ` : '';
        template = template.replace(/{{WEBSITE_BUTTON}}/g, websiteButton);
        
        const directionsButton = listing.address ? `
            <a href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fullAddress)}" target="_blank" class="flex items-center justify-center gap-2 px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 font-medium" onclick="trackClick('directions')">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path>
                </svg>
                Directions
            </a>
        ` : '';
        template = template.replace(/{{DIRECTIONS_BUTTON}}/g, directionsButton);
        // Social Media Section
        let socialMediaSection = '';
        if (listing.socialMedia && Object.values(listing.socialMedia).some(v => v)) {
            const sm = listing.socialMedia;
            let socialLinks = '';
            
            if (sm.facebook) socialLinks += `<a href="https://facebook.com/${sm.facebook}" target="_blank" rel="noopener noreferrer" class="social-icon social-facebook"><svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg></a>`;
            if (sm.instagram) socialLinks += `<a href="https://instagram.com/${sm.instagram}" target="_blank" rel="noopener noreferrer" class="social-icon social-instagram"><svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg></a>`;
            if (sm.twitter) socialLinks += `<a href="https://twitter.com/${sm.twitter}" target="_blank" rel="noopener noreferrer" class="social-icon social-twitter"><svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></a>`;
            if (sm.youtube) socialLinks += `<a href="https://youtube.com/@${sm.youtube}" target="_blank" rel="noopener noreferrer" class="social-icon social-youtube"><svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg></a>`;
            if (sm.tiktok) socialLinks += `<a href="https://tiktok.com/@${sm.tiktok}" target="_blank" rel="noopener noreferrer" class="social-icon social-tiktok"><svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg></a>`;
            if (sm.linkedin) socialLinks += `<a href="${sm.linkedin}" target="_blank" rel="noopener noreferrer" class="social-icon social-linkedin"><svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg></a>`;
            
            if (socialLinks) {
                socialMediaSection = `
                    <div>
                        <h2 class="text-xl font-bold text-gray-900 mb-3">Social Media</h2>
                        <div class="flex flex-wrap gap-2">
                            ${socialLinks}
                        </div>
                    </div>
                `;
            }
        }
        template = template.replace(/{{SOCIAL_MEDIA_SECTION}}/g, socialMediaSection);
        
        // Review Sites Section
        let reviewSection = '';
        if (listing.reviews && Object.values(listing.reviews).some(v => v)) {
            const r = listing.reviews;
            let reviewLinks = '';
            
            if (r.google) reviewLinks += `<a href="${r.google}" target="_blank" rel="noopener noreferrer" class="social-icon social-google"><svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg></a>`;
            if (r.yelp) reviewLinks += `<a href="${r.yelp}" target="_blank" rel="noopener noreferrer" class="social-icon social-yelp"><svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M21.111 18.226c-.141.969-2.119 3.483-3.029 3.847-.311.124-.611.094-.85-.09-.154-.12-2.314-2.164-2.762-2.728-.347-.437-.387-.8-.098-1.146.098-.117 1.433-1.575 1.722-1.903.422-.48 1.055-.595 1.601-.257.582.364 3.204 1.75 3.379 2.035.176.284.176.607.037.876zM11.883 4.348h-.002c-.022.011-.047.021-.07.032-.021.01-.042.019-.062.029l-.013.005a.45.45 0 0 0-.07.043l-.01.006-.014.01-.012.007-.011.007L5.896 7.842l-.028.017a.63.63 0 0 0-.271.34c-.104.326.121.77.6 1.247l.002.002c.015.015.03.029.046.044l.01.01.014.013 3.836 3.667a.45.45 0 0 0 .628.005l1.993-1.865a.626.626 0 0 0 .005-.851l-3.836-3.667-.014-.014-.013-.012a.451.451 0 0 0-.044-.044l-.002-.002c-.477-.478-.921-.703-1.247-.6-.107.034-.2.103-.294.178l-.012.01.001-.001z"/></svg></a>`;
            if (r.tripadvisor) reviewLinks += `<a href="${r.tripadvisor}" target="_blank" rel="noopener noreferrer" class="social-icon social-tripadvisor"><svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M12.006 4.295c-2.67 0-5.338.784-7.645 2.353H0l1.963 2.135a5.997 5.997 0 0 0 4.04 10.43 5.976 5.976 0 0 0 4.075-1.6L12 19.705l1.922-2.09a5.972 5.972 0 0 0 4.072 1.598 6 6 0 0 0 4.039-10.429L24 6.647h-4.361c-2.307-1.569-4.974-2.352-7.633-2.352zm-5.99 4.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9zm11.985 0a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9zm-11.985 1.5a3 3 0 1 0 0 6 3 3 0 0 0 0-6zm11.985 0a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/></svg></a>`;
            
            if (reviewLinks) {
                reviewSection = `
                    <div>
                        <h2 class="text-xl font-bold text-gray-900 mb-3">Reviews</h2>
                        <div class="flex flex-wrap gap-2">
                            ${reviewLinks}
                        </div>
                    </div>
                `;
            }
        }
        template = template.replace(/{{REVIEW_SECTION}}/g, reviewSection);
        
        // Map Section
        const mapSection = listing.coordinates && listing.address ? `
            <div>
                <h2 class="text-xl font-bold text-gray-900 mb-3">Location</h2>
                <div id="listingMap"></div>
            </div>
        ` : '';
        template = template.replace(/{{MAP_SECTION}}/g, mapSection);
        
        // Owner Info Section
        let ownerInfoSection = '';
        if (listing.ownerInfo) {
            const owner = listing.ownerInfo;
            const vis = owner.visibility || {};
            const items = [];
            
            if (vis.name && owner.fullName) items.push(`<p><strong>Owner:</strong> ${owner.fullName}</p>`);
            if (vis.title && owner.title) items.push(`<p><strong>Title:</strong> ${owner.title}</p>`);
            if (vis.greece && owner.fromGreece) items.push(`<p><strong>From Greece:</strong> ${owner.fromGreece}</p>`);
            if (vis.email && owner.ownerEmail) items.push(`<p><strong>Email:</strong> <a href="mailto:${owner.ownerEmail}" class="text-blue-600 hover:underline">${owner.ownerEmail}</a></p>`);
            if (vis.phone && owner.ownerPhone) items.push(`<p><strong>Phone:</strong> <a href="tel:${owner.ownerPhone}" class="text-blue-600 hover:underline">${owner.ownerPhone}</a></p>`);
            
            if (items.length > 0) {
                ownerInfoSection = `
                    <div class="owner-info-section">
                        <h3 class="text-lg font-bold text-gray-900 mb-3">Owner Information</h3>
                        ${items.join('')}
                    </div>
                `;
            }
        }
        template = template.replace(/{{OWNER_INFO_SECTION}}/g, ownerInfoSection);
        
        // Claim button
        const claimButton = listing.showClaimButton
            ? `<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                   <h3 class="text-lg font-bold text-gray-900 mb-2">Is this your business?</h3>
                   <p class="text-gray-700 mb-4">Claim this listing to manage your information and tag it as Claimed.</p>
                   <a href="mailto:contact@thegreekdirectory.org?subject=Claim%20My%20Listing%3A%20${encodeURIComponent(listing.businessName)}%20-%20${encodeURIComponent(listing.city)}%2C%20${encodeURIComponent(listing.state)}%2C%20${encodeURIComponent(listing.country)}" class="inline-block px-6 py-3 text-white rounded-lg font-semibold" style="background-color:#055193;">Claim This Business</a>
               </div>`
            : '';
        template = template.replace(/{{CLAIM_BUTTON}}/g, claimButton);
        
        // Hours schema for SEO
        template = template.replace(/{{HOURS_SCHEMA}}/g, '[]');
        
        // Save the generated HTML file
        const filePath = `listings/${categorySlug}/${listing.slug}.html`;
        
        console.log('Saving listing page to:', filePath);
        
        // Get current file SHA (if exists)
        let currentSha = null;
        try {
            const fileInfoResponse = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`, {
                headers: {
                    'Authorization': `token ${githubToken}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (fileInfoResponse.ok) {
                const fileInfo = await fileInfoResponse.json();
                currentSha = fileInfo.sha;
                console.log('File exists, will update');
            }
        } catch (e) {
            console.log('File does not exist, will create new');
        }
        
        // Encode content
        const base64Content = btoa(unescape(encodeURIComponent(template)));
        
        // Upload to GitHub
        const uploadBody = {
            message: `Generate listing page for ${listing.businessName}`,
            content: base64Content
        };
        
        if (currentSha) {
            uploadBody.sha = currentSha;
        }
        
        const uploadResponse = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${githubToken}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(uploadBody)
        });

        if (uploadResponse.ok) {
            console.log('✅ Listing page generated successfully at:', filePath);
            return true;
        } else {
            const errorData = await uploadResponse.json();
            console.error('❌ Failed to generate listing page:', errorData);
            alert('Page generation failed: ' + (errorData.message || 'Unknown error'));
            return false;
        }
    } catch (error) {
        console.error('❌ Error generating listing page:', error);
        alert('Error generating page: ' + error.message);
        return false;
    }
}

        
        window.showDeleteModal = function(id) {
    deletingListingId = id;
    const listing = allListings.find(l => l.id === id);
    document.getElementById('deleteBusinessName').textContent = listing.businessName;
    document.getElementById('deleteModal').classList.remove('hidden');
};

document.getElementById('cancelDelete').addEventListener('click', () => {
    document.getElementById('deleteModal').classList.add('hidden');
    deletingListingId = null;
    document.getElementById('deleteConfirmInput').value = '';
});

document.getElementById('confirmDelete').addEventListener('click', async () => {
    const confirmText = document.getElementById('deleteConfirmInput').value;
    if (confirmText !== 'DELETE') {
        alert('You must type DELETE to confirm');
        return;
    }
    
    const index = allListings.findIndex(l => l.id === deletingListingId);
    if (index > -1) {
        allListings.splice(index, 1);
        await saveToGitHub(false);
        document.getElementById('deleteModal').classList.add('hidden');
        deletingListingId = null;
        document.getElementById('deleteConfirmInput').value = '';
        alert('Listing deleted successfully');
    }
});

function setupEventListeners() {
    const newListingBtn = document.getElementById('newListingBtn');
    if (newListingBtn) {
        newListingBtn.addEventListener('click', () => {
            editingListing = null;
            document.getElementById('modalTitle').textContent = 'New Listing';
            clearForm();
            document.getElementById('editModal').classList.remove('hidden');
        });
    }

    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadListings);
    }

    const closeModal = document.getElementById('closeModal');
    if (closeModal) {
        closeModal.addEventListener('click', () => {
            if (confirm('Are you sure you want to cancel? All inputted info will be deleted.')) {
                document.getElementById('editModal').classList.add('hidden');
                clearForm();
            }
        });
    }

    const cancelEdit = document.getElementById('cancelEdit');
    if (cancelEdit) {
        cancelEdit.addEventListener('click', () => {
            if (confirm('Are you sure you want to cancel? All inputted info will be deleted.')) {
                document.getElementById('editModal').classList.add('hidden');
                clearForm();
            }
        });
    }

    const editTagline = document.getElementById('editTagline');
    if (editTagline) {
        editTagline.addEventListener('input', (e) => {
            const count = e.target.value.length;
            const countSpan = document.getElementById('taglineCount');
            if (countSpan) countSpan.textContent = count;
            if (count > 75) {
                e.target.value = e.target.value.substring(0, 75);
                if (countSpan) countSpan.textContent = '75';
            }
        });
    }

    const editDescription = document.getElementById('editDescription');
    if (editDescription) {
        editDescription.addEventListener('input', () => {
            updateCharCounter('description');
        });
    }

    const editBusinessName = document.getElementById('editBusinessName');
    if (editBusinessName) {
        editBusinessName.addEventListener('input', () => {
            // Could add slug preview here
        });
    }

    const editTier = document.getElementById('editTier');
    if (editTier) {
        editTier.addEventListener('change', () => {
            updateVerifiedBasedOnTier();
        });
    }

    const saveEdit = document.getElementById('saveEdit');
    if (saveEdit) {
        saveEdit.addEventListener('click', saveEditHandler);
    }
}
