// ============================================
// BUSINESS DASHBOARD FUNCTIONALITY
// ============================================

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

let uploadedImages = { logo: null, photos: [] };
let photosSortable = null;
let selectedSubcategories = [];
let settingsVisibility = { email: false, phone: false };

async function loadListingData() {
    if (!ownerData || !ownerData.listing_id) {
        console.error('No listing ID found in owner data');
        return;
    }
    
    try {
        console.log('📥 Loading listing data from GitHub...');
        
        const response = await fetch(`https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/main/${DATABASE_PATH}`);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch database: ${response.status}`);
        }
        
        const data = await response.json();
        allListings = data.listings || [];
        
        currentListing = allListings.find(l => l.id === ownerData.listing_id);
        
        if (!currentListing) {
            throw new Error('Listing not found in database');
        }
        
        console.log('✅ Listing data loaded:', currentListing.businessName);
        
    } catch (error) {
        console.error('❌ Error loading listing data:', error);
        alert('Failed to load listing data. Please try again.');
    }
}

function renderDashboard() {
    if (!currentListing) return;
    
    document.getElementById('businessName').textContent = currentListing.businessName;
    document.getElementById('listingIdDisplay').textContent = `#${currentListing.listingId}`;
    
    const tier = currentListing.tier || 'FREE';
    const tierBadge = document.getElementById('tierBadge');
    tierBadge.textContent = tier + ' Tier';
    tierBadge.className = `tier-badge tier-${tier}`;
    
    const categorySlug = currentListing.category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const listingUrl = `https://listings.thegreekdirectory.org/listings/${categorySlug}/${currentListing.slug}`;
    document.getElementById('viewLiveBtn').href = listingUrl;
    
    renderOverview();
    renderEditForm();
    renderAnalytics();
    renderSettings();
}

function switchTab(tab) {
    ['overview', 'edit', 'analytics', 'settings'].forEach(t => {
        document.getElementById(`content-${t}`).classList.add('hidden');
        document.getElementById(`tab-${t}`).className = 'px-4 py-2 rounded-lg font-medium bg-white border border-gray-300 text-gray-700';
    });
    
    document.getElementById(`content-${tab}`).classList.remove('hidden');
    document.getElementById(`tab-${tab}`).className = 'px-4 py-2 rounded-lg font-medium bg-white border-2 border-blue-600 text-blue-600';
}

function renderOverview() {
    if (!currentListing) return;
    
    const tier = currentListing.tier || 'FREE';
    const features = {
        'FREE': [
            '✅ Basic listing with logo and 1 photo',
            '✅ Contact information (phone, email, website)',
            '✅ Hours of operation',
            '✅ Social media links',
            '✅ Review site links',
            '✅ Tagline (max 75 characters)',
            '✅ Description (max 1000 characters)',
            '✅ Basic analytics (total views and engagement)'
        ],
        'VERIFIED': [
            '✅ All FREE features',
            '✅ Verified badge',
            '✅ Extended description (max 2000 characters)',
            '✅ Enhanced analytics (website, call, and direction clicks)',
            '✅ Monthly analytics totals'
        ],
        'FEATURED': [
            '✅ All VERIFIED features',
            '✅ Featured badge and priority placement',
            '✅ Photo gallery (up to 5 photos)',
            '✅ Advanced analytics (click breakdown and trends)',
            '✅ Category placement indicator'
        ],
        'PREMIUM': [
            '✅ All FEATURED features',
            '✅ Premium badge and top placement',
            '✅ Extended photo gallery (up to 15 photos)',
            '✅ Video embedding (1 video)',
            '✅ Comprehensive analytics (video plays, comparative performance)',
            '✅ Full engagement history'
        ]
    };
    
    const featuresList = document.getElementById('tierFeatures');
    featuresList.innerHTML = features[tier].map(f => `<div class="flex items-start gap-2"><span>${f}</span></div>`).join('');
    
    const mainImage = (currentListing.photos && currentListing.photos.length > 0) ? currentListing.photos[0] : currentListing.logo;
    document.getElementById('previewMainImage').src = mainImage;
    document.getElementById('previewLogo').src = currentListing.logo;
    document.getElementById('previewBusinessName').textContent = currentListing.businessName;
    document.getElementById('previewTagline').textContent = currentListing.tagline ? `"${currentListing.tagline}"` : '';
    document.getElementById('previewCategory').textContent = currentListing.category;
    
    const fullAddress = currentListing.address ? 
        `${currentListing.address}, ${currentListing.city}, ${currentListing.state} ${currentListing.zipCode || ''}` : 
        `${currentListing.city}, ${currentListing.state}`;
    
    let details = `<div><span class="font-semibold">Listing ID:</span> #${currentListing.listingId}</div>`;
    if (currentListing.subcategories && currentListing.subcategories.length > 0) {
        details += `<div><span class="font-semibold">Subcategories:</span> ${currentListing.subcategories.join(', ')}</div>`;
    }
    details += `<div><span class="font-semibold">Location:</span> ${fullAddress}</div>`;
    if (currentListing.phone) {
        details += `<div><span class="font-semibold">Phone:</span> ${currentListing.phone}</div>`;
    }
    if (currentListing.email) {
        details += `<div><span class="font-semibold">Email:</span> ${currentListing.email}</div>`;
    }
    if (currentListing.website) {
        details += `<div><span class="font-semibold">Website:</span> <a href="${currentListing.website}" target="_blank" class="text-blue-600 hover:underline">${currentListing.website}</a></div>`;
    }
    
    document.getElementById('previewDetails').innerHTML = details;
}
function renderSettings() {
    if (!ownerData) return;
    
    document.getElementById('settingsOwnerEmail').value = ownerData.owner_email || '';
    document.getElementById('settingsOwnerPhone').value = ownerData.owner_phone || '';
    
    settingsVisibility = {
        email: ownerData.email_visible || false,
        phone: ownerData.phone_visible || false
    };
    
    document.querySelectorAll('.visibility-toggle').forEach(btn => {
        const field = btn.getAttribute('data-field');
        if (settingsVisibility[field]) {
            btn.className = 'visibility-toggle visible';
            btn.textContent = 'Visible';
        } else {
            btn.className = 'visibility-toggle hidden';
            btn.textContent = 'Hidden';
        }
    });
}

window.toggleSettingsFieldVisibility = function(field) {
    settingsVisibility[field] = !settingsVisibility[field];
    const button = document.querySelector(`.visibility-toggle[data-field="${field}"]`);
    if (settingsVisibility[field]) {
        button.className = 'visibility-toggle visible';
        button.textContent = 'Visible';
    } else {
        button.className = 'visibility-toggle hidden';
        button.textContent = 'Hidden';
    }
};

async function updatePassword() {
    const newPassword = document.getElementById('settingsNewPassword').value;
    const confirmPassword = document.getElementById('settingsConfirmPassword').value;
    
    if (!newPassword || !confirmPassword) {
        alert('Please enter and confirm your new password');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }
    
    if (newPassword.length < 6) {
        alert('Password must be at least 6 characters');
        return;
    }
    
    const result = await window.TGDAuth.updatePassword(newPassword);
    
    if (result.success) {
        alert(result.message);
        document.getElementById('settingsNewPassword').value = '';
        document.getElementById('settingsConfirmPassword').value = '';
    } else {
        alert('Error: ' + result.error);
    }
}

async function saveSettings() {
    if (!ownerData) return;
    
    const updatedEmail = document.getElementById('settingsOwnerEmail').value.trim();
    const updatedPhone = document.getElementById('settingsOwnerPhone').value.trim();
    
    const updates = {
        owner_email: updatedEmail,
        owner_phone: updatedPhone,
        email_visible: settingsVisibility.email,
        phone_visible: settingsVisibility.phone
    };
    
    const result = await window.TGDAuth.updateBusinessOwnerContact(updates);
    
    if (result.success) {
        ownerData = result.data;
        alert('Settings saved successfully!');
        renderSettings();
    } else {
        alert('Error: ' + result.error);
    }
}

window.saveSettings = saveSettings;
window.updatePassword = updatePassword;
window.switchTab = switchTab;
window.loadListingData = loadListingData;
// ============================================
// ANALYTICS RENDERING
// ============================================

function renderAnalytics() {
    if (!currentListing) return;
    
    const tier = currentListing.tier || 'FREE';
    const analytics = currentListing.analytics || {
        views: 0,
        callClicks: 0,
        websiteClicks: 0,
        directionClicks: 0,
        shareClicks: 0,
        videoPlays: 0,
        lastViewed: 'Never',
        detailedViews: []
    };
    
    let html = '';
    
    if (tier === 'FREE') {
        html = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="analytics-stat-card">
                    <div class="text-4xl font-bold mb-2">${analytics.views || 0}</div>
                    <div class="text-sm opacity-90">Total Views</div>
                </div>
                <div class="analytics-stat-card" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
                    <div class="text-4xl font-bold mb-2">${(analytics.callClicks || 0) + (analytics.websiteClicks || 0) + (analytics.directionClicks || 0) + (analytics.shareClicks || 0)}</div>
                    <div class="text-sm opacity-90">Total Engagement</div>
                </div>
            </div>
            <div class="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p class="text-sm text-blue-900"><strong>Want more detailed analytics?</strong> Upgrade to Verified tier or higher to see individual click breakdowns, trends, and more!</p>
            </div>
        `;
    } else if (tier === 'VERIFIED') {
        html = `
            <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
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
            <div class="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p class="text-sm text-blue-900"><strong>Want advanced analytics?</strong> Upgrade to Featured or Premium tier for click breakdowns, trends, and comparative performance!</p>
            </div>
        `;
    } else {
        const recentViews = analytics.detailedViews?.slice(-30) || [];
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
                <div class="analytics-stat-card" style="background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);">
                    <div class="text-4xl font-bold mb-2">${recentViews.length}</div>
                    <div class="text-sm opacity-90">Recent Activity</div>
                </div>
            </div>
            <div class="bg-gray-50 rounded-lg p-4">
                <h3 class="font-bold text-gray-900 mb-3">Recent Activity (Last 30 actions)</h3>
                <div class="space-y-2">
                    ${recentViews.slice(-10).reverse().map(v => `
                        <div class="flex justify-between text-sm">
                            <span class="font-medium">${v.action}</span>
                            <span class="text-gray-600">${new Date(v.timestamp).toLocaleString()}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    document.getElementById('analyticsContent').innerHTML = html;
}
// ============================================
// EDIT FORM RENDERING
// ============================================

function renderEditForm() {
    if (!currentListing) return;
    
    const tier = currentListing.tier || 'FREE';
    const maxDesc = tier === 'FREE' ? 1000 : 2000;
    const maxPhotos = tier === 'FREE' ? 1 : tier === 'FEATURED' ? 5 : tier === 'PREMIUM' ? 15 : 1;
    
    selectedSubcategories = currentListing.subcategories || [];
    
    let html = `
        <div>
            <h3 class="text-lg font-bold text-gray-900 mb-4">Basic Information</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="md:col-span-2 disabled-field">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Listing ID</label>
                    <input type="text" value="#${currentListing.listingId}" class="w-full px-4 py-2 border border-gray-300 rounded-lg" disabled>
                    <p class="info-notice">Listing ID number cannot be changed.</p>
                </div>
                <div class="md:col-span-2 disabled-field">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Business Name</label>
                    <input type="text" value="${currentListing.businessName}" class="w-full px-4 py-2 border border-gray-300 rounded-lg" disabled>
                    <p class="info-notice">Contact Support to change this information.</p>
                </div>
                <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Tagline (max 75 chars) *</label>
                    <input type="text" id="editTagline" value="${currentListing.tagline || ''}" maxlength="75" class="w-full px-4 py-2 border border-gray-300 rounded-lg" oninput="updateCharCounter('tagline')">
                    <p class="char-counter mt-1"><span id="taglineCount">${(currentListing.tagline || '').length}</span>/75 characters</p>
                </div>
                <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Description (max ${maxDesc} chars)</label>
                    <textarea id="editDescription" rows="5" class="w-full px-4 py-2 border border-gray-300 rounded-lg" oninput="updateCharCounter('description')">${currentListing.description || ''}</textarea>
                    <p class="char-counter mt-1"><span id="descriptionCount">${(currentListing.description || '').length}</span>/<span id="descriptionMax">${maxDesc}</span> characters</p>
                </div>
                <div class="disabled-field">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <input type="text" value="${currentListing.category}" class="w-full px-4 py-2 border border-gray-300 rounded-lg" disabled>
                    <p class="info-notice">Contact Support to change this information.</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Subcategories</label>
                    <div id="subcategoriesGrid" class="grid grid-cols-2 gap-2"></div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <input type="tel" id="editPhone" value="${currentListing.phone || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input type="email" id="editEmail" value="${currentListing.email || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                </div>
                <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Website</label>
                    <input type="url" id="editWebsite" value="${currentListing.website || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                </div>
                <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Address</label>
                    <input type="text" id="editAddress" value="${currentListing.address || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">City</label>
                    <input type="text" id="editCity" value="${currentListing.city || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">State</label>
                    <input type="text" id="editState" value="${currentListing.state || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Zip Code</label>
                    <input type="text" id="editZipCode" value="${currentListing.zipCode || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                </div>
            </div>
        </div>
    `;
    
    html += `
        <div>
            <h3 class="text-lg font-bold text-gray-900 mb-4">Hours of Operation</h3>
            <div class="grid grid-cols-1 gap-3">
                ${['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => `
                    <div class="flex gap-2">
                        <label class="w-28 flex items-center font-medium text-gray-700">${day}:</label>
                        <input type="text" id="editHours${day}" value="${currentListing.hours && currentListing.hours[day.toLowerCase()] ? currentListing.hours[day.toLowerCase()] : ''}" class="flex-1 px-4 py-2 border border-gray-300 rounded-lg" placeholder="9:00 AM - 5:00 PM or Closed">
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    document.getElementById('editForm').innerHTML = html;
    
    renderSubcategories();
    
    if (currentListing.photos && currentListing.photos.length > 0) {
        uploadedImages.photos = currentListing.photos.map(url => ({ url: url, existing: true }));
        renderPhotosPreview();
    }
    
    setupImageHandlers();
}

function renderSubcategories() {
    const category = currentListing.category;
    const grid = document.getElementById('subcategoriesGrid');
    
    if (SUBCATEGORIES[category] && SUBCATEGORIES[category].length > 0) {
        grid.innerHTML = '';
        SUBCATEGORIES[category].forEach(sub => {
            const div = document.createElement('div');
            div.className = 'subcategory-checkbox';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `subcat-${sub}`;
            checkbox.value = sub;
            checkbox.checked = selectedSubcategories.includes(sub);
            checkbox.onchange = () => toggleSubcategory(sub);
            
            const label = document.createElement('label');
            label.htmlFor = `subcat-${sub}`;
            label.textContent = sub;
            label.className = 'cursor-pointer flex-1 text-sm';
            
            div.appendChild(checkbox);
            div.appendChild(label);
            grid.appendChild(div);
        });
    }
}

function toggleSubcategory(subcategory) {
    const index = selectedSubcategories.indexOf(subcategory);
    if (index > -1) {
        selectedSubcategories.splice(index, 1);
    } else {
        selectedSubcategories.push(subcategory);
    }
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
        counter.parentElement.className = 'char-counter mt-1';
        
        if (current > max) {
            counter.parentElement.className = 'char-counter error mt-1';
            input.value = input.value.substring(0, max);
            counter.textContent = max;
        } else if (current > max * 0.9) {
            counter.parentElement.className = 'char-counter warning mt-1';
        }
    }
};

function setupImageHandlers() {
    const logoUpload = document.getElementById('logoUpload');
    const photosUpload = document.getElementById('photosUpload');
    
    if (logoUpload) {
        logoUpload.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    uploadedImages.logo = { 
                        file: file,
                        base64: event.target.result.split(',')[1],
                        url: event.target.result
                    };
                    const logoPreview = document.getElementById('logoPreview');
                    if (logoPreview) {
                        logoPreview.innerHTML = `<img src="${event.target.result}" class="image-preview">`;
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    }

    if (photosUpload) {
        photosUpload.addEventListener('change', async (e) => {
            const tier = currentListing.tier || 'FREE';
            const maxPhotos = tier === 'FREE' ? 1 : tier === 'FEATURED' ? 5 : tier === 'PREMIUM' ? 15 : 1;
            
            const files = Array.from(e.target.files).slice(0, maxPhotos - uploadedImages.photos.length);
            
            for (const file of files) {
                const reader = new FileReader();
                await new Promise((resolve) => {
                    reader.onload = (event) => {
                        uploadedImages.photos.push({ 
                            file: file,
                            base64: event.target.result.split(',')[1],
                            url: event.target.result
                        });
                        renderPhotosPreview();
                        resolve();
                    };
                    reader.readAsDataURL(file);
                });
            }
        });
    }
}

function renderPhotosPreview() {
    const preview = document.getElementById('photosPreview');
    if (!preview) return;
    
    preview.innerHTML = uploadedImages.photos.map((photo, idx) => `
        <div class="photo-item" data-index="${idx}">
            <div class="photo-number">#${idx + 1}</div>
            <img src="${photo.url}" class="image-preview">
            <div class="delete-photo" onclick="deletePhoto(${idx})">×</div>
        </div>
    `).join('');
    
    if (photosSortable) {
        photosSortable.destroy();
    }
    initPhotosSortable();
}

function initPhotosSortable() {
    const preview = document.getElementById('photosPreview');
    if (preview && preview.children.length > 0) {
        photosSortable = Sortable.create(preview, {
            animation: 150,
            ghostClass: 'sortable-ghost',
            onEnd: function(evt) {
                const oldIndex = evt.oldIndex;
                const newIndex = evt.newIndex;
                const item = uploadedImages.photos.splice(oldIndex, 1)[0];
                uploadedImages.photos.splice(newIndex, 0, item);
                renderPhotosPreview();
            }
        });
    }
}

window.deletePhoto = function(index) {
    uploadedImages.photos.splice(index, 1);
    renderPhotosPreview();
};
// ============================================
// SAVE CHANGES FUNCTIONALITY
// ============================================

async function saveChanges() {
    const tagline = document.getElementById('editTagline').value.trim();
    if (!tagline) {
        alert('Tagline is required');
        return;
    }
    
    const tier = currentListing.tier || 'FREE';
    const maxDesc = tier === 'FREE' ? 1000 : 2000;
    const description = document.getElementById('editDescription').value;
    
    if (description.length > maxDesc) {
        alert(`Description too long! Maximum ${maxDesc} characters for ${tier} tier.`);
        return;
    }
    
    const changes = [];
    if (currentListing.tagline !== tagline) changes.push(`Tagline: "${currentListing.tagline}" → "${tagline}"`);
    if (currentListing.description !== description) changes.push('Description updated');
    
    const newSubcategories = selectedSubcategories.sort().join(',');
    const oldSubcategories = (currentListing.subcategories || []).sort().join(',');
    if (oldSubcategories !== newSubcategories) changes.push(`Subcategories: ${oldSubcategories || 'None'} → ${newSubcategories}`);
    
    const newPhone = document.getElementById('editPhone').value || null;
    if (currentListing.phone !== newPhone) changes.push(`Phone: ${currentListing.phone || 'None'} → ${newPhone || 'None'}`);
    
    const newEmail = document.getElementById('editEmail').value || null;
    if (currentListing.email !== newEmail) changes.push(`Email: ${currentListing.email || 'None'} → ${newEmail || 'None'}`);
    
    const newWebsite = document.getElementById('editWebsite').value || null;
    if (currentListing.website !== newWebsite) changes.push(`Website: ${currentListing.website || 'None'} → ${newWebsite || 'None'}`);
    
    const newAddress = document.getElementById('editAddress').value || null;
    if (currentListing.address !== newAddress) changes.push(`Address: ${currentListing.address || 'None'} → ${newAddress || 'None'}`);
    
    if (uploadedImages.logo && !uploadedImages.logo.existing) changes.push('Logo updated');
    if (uploadedImages.photos.some(p => !p.existing)) changes.push('Photos updated');
    
    if (changes.length === 0) {
        alert('No changes detected.');
        return;
    }
    
    const confirmMessage = `Are you sure you want to save these changes?\n\nChanges:\n${changes.map(c => `• ${c}`).join('\n')}\n\nThese changes will be submitted for review.`;
    
    if (!confirm(confirmMessage)) return;
    
    // Update listing data
    currentListing.tagline = tagline;
    currentListing.description = description;
    currentListing.subcategories = selectedSubcategories;
    currentListing.phone = newPhone;
    currentListing.email = newEmail;
    currentListing.website = newWebsite;
    currentListing.address = newAddress;
    currentListing.city = document.getElementById('editCity').value || null;
    currentListing.state = document.getElementById('editState').value || null;
    currentListing.zipCode = document.getElementById('editZipCode').value || null;
    
    currentListing.hours = {
        monday: document.getElementById('editHoursMonday').value || null,
        tuesday: document.getElementById('editHoursTuesday').value || null,
        wednesday: document.getElementById('editHoursWednesday').value || null,
        thursday: document.getElementById('editHoursThursday').value || null,
        friday: document.getElementById('editHoursFriday').value || null,
        saturday: document.getElementById('editHoursSaturday').value || null,
        sunday: document.getElementById('editHoursSunday').value || null
    };
    
    if (uploadedImages.photos.length > 0) {
        currentListing.photos = uploadedImages.photos.map(p => p.url);
    }
    
    currentListing.metadata.updatedAt = new Date().toISOString();
    
    // Update in allListings array
    const index = allListings.findIndex(l => l.id === currentListing.id);
    if (index !== -1) {
        allListings[index] = currentListing;
        
        // Prepare for GitHub update
        const databaseContent = { listings: allListings };
        const jsonString = JSON.stringify(databaseContent, null, 2);
        
        // Use Supabase Edge Function to update GitHub
        const result = await window.TGDAuth.updateGitHubFile(
            GITHUB_OWNER,
            GITHUB_REPO,
            DATABASE_PATH,
            jsonString,
            `Update ${currentListing.businessName} - Business Portal`
        );
        
        if (result.success) {
            alert('✅ Changes submitted successfully! They will be reviewed and published soon.');
            renderDashboard();
            switchTab('overview');
        } else {
            alert('❌ Failed to save changes: ' + result.error);
        }
    }
}

window.saveChanges = saveChanges;
// ============================================
// SOCIAL MEDIA & REVIEWS SECTIONS
// ============================================

function renderSocialMediaSection() {
    if (!currentListing || !currentListing.socialMedia) return '';
    
    const sm = currentListing.socialMedia;
    let socialLinks = '';
    
    if (sm.facebook) socialLinks += `<a href="https://facebook.com/${sm.facebook}" target="_blank" rel="noopener noreferrer" class="social-icon">Facebook</a>`;
    if (sm.instagram) socialLinks += `<a href="https://instagram.com/${sm.instagram}" target="_blank" rel="noopener noreferrer" class="social-icon">Instagram</a>`;
    if (sm.twitter) socialLinks += `<a href="https://twitter.com/${sm.twitter}" target="_blank" rel="noopener noreferrer" class="social-icon">Twitter</a>`;
    if (sm.youtube) socialLinks += `<a href="https://youtube.com/@${sm.youtube}" target="_blank" rel="noopener noreferrer" class="social-icon">YouTube</a>`;
    if (sm.tiktok) socialLinks += `<a href="https://tiktok.com/@${sm.tiktok}" target="_blank" rel="noopener noreferrer" class="social-icon">TikTok</a>`;
    if (sm.linkedin) socialLinks += `<a href="${sm.linkedin}" target="_blank" rel="noopener noreferrer" class="social-icon">LinkedIn</a>`;
    
    if (socialLinks) {
        return `
            <div class="mt-4">
                <h4 class="font-semibold text-gray-700 mb-2">Social Media</h4>
                <div class="flex flex-wrap gap-2">
                    ${socialLinks}
                </div>
            </div>
        `;
    }
    return '';
}

function renderReviewsSection() {
    if (!currentListing || !currentListing.reviews) return '';
    
    const r = currentListing.reviews;
    let reviewLinks = '';
    
    if (r.google) reviewLinks += `<a href="${r.google}" target="_blank" rel="noopener noreferrer" class="social-icon">Google</a>`;
    if (r.yelp) reviewLinks += `<a href="${r.yelp}" target="_blank" rel="noopener noreferrer" class="social-icon">Yelp</a>`;
    if (r.tripadvisor) reviewLinks += `<a href="${r.tripadvisor}" target="_blank" rel="noopener noreferrer" class="social-icon">TripAdvisor</a>`;
    
    if (reviewLinks) {
        return `
            <div class="mt-4">
                <h4 class="font-semibold text-gray-700 mb-2">Reviews</h4>
                <div class="flex flex-wrap gap-2">
                    ${reviewLinks}
                </div>
            </div>
        `;
    }
    return '';
}
