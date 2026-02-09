// js/business-dashboard.js - COMPLETE
/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
This source code is proprietary and no part may not be used, reproduced, or distributed 
without written permission from The Greek Directory. Unauthorized use, copying, modification, 
or distribution of this code will result in legal action to the fullest extent permitted by law.
*/

// ============================================
// BUSINESS DASHBOARD FUNCTIONALITY - COMPLETE
// Configuration & State Management
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

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
*/

let uploadedImages = { logo: null, photos: [], video: null };
let photosSortable = null;
let selectedSubcategories = [];
let primarySubcategory = null;
let settingsVisibility = { email: false, phone: false };
let currentMaxPhotos = 1;
let currentMaxCtas = 0;

async function loadListingData() {
    if (!ownerData || ownerData.length === 0) {
        console.error('No owner data available');
        return;
    }
    
    const listingId = ownerData[0].listing_id;
    
    try {
        const { data, error } = await window.TGDAuth.supabaseClient
            .from('listings')
            .select('*')
            .eq('id', listingId)
            .single();
        
        if (error) throw error;
        
        currentListing = data;
        console.log('Listing loaded:', currentListing);
        
    } catch (error) {
        console.error('Error loading listing:', error);
        alert('Failed to load listing data');
    }
}

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
*/

function renderDashboard() {
    if (!currentListing) return;
    
    document.getElementById('businessName').textContent = currentListing.business_name;
    document.getElementById('listingIdDisplay').textContent = `#${currentListing.id}`;
    
    const tier = currentListing.tier || 'FREE';
    const tierBadge = document.getElementById('tierBadge');
    tierBadge.textContent = tier + ' Tier';
    tierBadge.className = `tier-badge tier-${tier}`;
    
    const categorySlug = currentListing.category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const listingUrl = `https://thegreekdirectory.org/listing/${currentListing.slug}`;
    
    const viewBtn = document.getElementById('viewLiveBtn');
    if (viewBtn) {
        viewBtn.href = listingUrl;
    }
    
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

const CLOUDFLARE_STORAGE_KEY = 'tgdCloudflareImagesConfig';

function getStoredCloudflareConfig() {
    try {
        const stored = localStorage.getItem(CLOUDFLARE_STORAGE_KEY);
        return stored ? JSON.parse(stored) : {};
    } catch (error) {
        console.warn('Unable to read Cloudflare config from storage:', error);
        return {};
    }
}

function setStoredCloudflareConfig(config) {
    try {
        localStorage.setItem(CLOUDFLARE_STORAGE_KEY, JSON.stringify(config));
    } catch (error) {
        console.warn('Unable to save Cloudflare config:', error);
    }
}

function getCloudflareConfig() {
    const config = window.CLOUDFLARE_IMAGES_CONFIG || {};
    const stored = getStoredCloudflareConfig();
    return {
        accountId: stored.accountId || config.accountId || '',
        apiKey: stored.apiKey || config.apiKey || ''
    };
}

function setMediaUploadStatus(message, isError = false) {
    const statusEl = document.getElementById('mediaUploadStatus');
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.className = `text-sm ${isError ? 'text-red-600' : 'text-gray-600'}`;
}

async function uploadToCloudflareImages(file) {
    const { accountId, apiKey } = getCloudflareConfig();
    if (!accountId || !apiKey) {
        throw new Error('Cloudflare Images credentials are missing. Add them in the Media section.');
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`
        },
        body: formData
    });
    
    const result = await response.json();
    if (!response.ok || !result.success) {
        const errorMessage = result?.errors?.[0]?.message || 'Upload failed.';
        throw new Error(errorMessage);
    }
    
    const variants = result?.result?.variants || [];
    return variants[0] || result?.result?.url || '';
}

function updateMediaPreview() {
    const logoPreview = document.getElementById('mediaLogoPreview');
    if (logoPreview) {
        const logoUrl = uploadedImages.logo || currentListing?.logo || '';
        logoPreview.src = logoUrl || '';
        logoPreview.classList.toggle('hidden', !logoUrl);
    }
    
    const photosPreview = document.getElementById('mediaPhotosPreview');
    if (photosPreview) {
        const allPhotos = [...(currentListing?.photos || []), ...uploadedImages.photos];
        photosPreview.innerHTML = allPhotos.map(url => `
            <img src="${url}" alt="Listing photo" class="w-20 h-20 rounded-lg object-cover">
        `).join('');
    }
}

async function handleLogoUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
        setMediaUploadStatus('Uploading logo...');
        const url = await uploadToCloudflareImages(file);
        uploadedImages.logo = url;
        updateMediaPreview();
        setMediaUploadStatus('Logo uploaded successfully.');
    } catch (error) {
        console.error('Logo upload failed:', error);
        setMediaUploadStatus(`Logo upload failed: ${error.message}`, true);
    }
}

async function handlePhotosUpload(event) {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;
    
    const existingCount = (currentListing?.photos || []).length + uploadedImages.photos.length;
    const availableSlots = currentMaxPhotos - existingCount;
    if (availableSlots <= 0) {
        setMediaUploadStatus(`Photo limit reached for your tier (${currentMaxPhotos}).`, true);
        return;
    }
    
    try {
        setMediaUploadStatus('Uploading photos...');
        const uploadFiles = files.slice(0, availableSlots);
        for (const file of uploadFiles) {
            const url = await uploadToCloudflareImages(file);
            uploadedImages.photos.push(url);
        }
        updateMediaPreview();
        setMediaUploadStatus('Photos uploaded successfully.');
    } catch (error) {
        console.error('Photo upload failed:', error);
        setMediaUploadStatus(`Photo upload failed: ${error.message}`, true);
    }
}

async function handleVideoUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
        setMediaUploadStatus('Uploading video...');
        const url = await uploadToCloudflareImages(file);
        uploadedImages.video = url;
        setMediaUploadStatus('Video uploaded successfully.');
    } catch (error) {
        console.error('Video upload failed:', error);
        setMediaUploadStatus(`Video upload failed: ${error.message}`, true);
    }
}

function attachMediaUploadHandlers() {
    const logoUpload = document.getElementById('editLogoUpload');
    if (logoUpload) logoUpload.onchange = handleLogoUpload;
    
    const photosUpload = document.getElementById('editPhotosUpload');
    if (photosUpload) photosUpload.onchange = handlePhotosUpload;
    
    const videoUpload = document.getElementById('editVideoUpload');
    if (videoUpload) videoUpload.onchange = handleVideoUpload;
}

function attachCloudflareConfigHandlers() {
    const accountInput = document.getElementById('cloudflareAccountId');
    const apiKeyInput = document.getElementById('cloudflareApiKey');
    if (!accountInput || !apiKeyInput) return;
    
    const config = getCloudflareConfig();
    accountInput.value = config.accountId || '';
    apiKeyInput.value = config.apiKey || '';
    
    const saveConfig = () => {
        setStoredCloudflareConfig({
            accountId: accountInput.value.trim(),
            apiKey: apiKeyInput.value.trim()
        });
    };
    
    accountInput.addEventListener('input', saveConfig);
    apiKeyInput.addEventListener('input', saveConfig);
}

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
*/

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
    
    const categorySlug = currentListing.category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const listingUrl = `https://thegreekdirectory.org/listing/${currentListing.slug}`;
    
    const content = document.getElementById('content-overview');
    content.innerHTML = `
        <div class="bg-white rounded-lg p-6 shadow-sm">
            <h2 class="text-2xl font-bold text-gray-900 mb-4">Welcome!</h2>
            <p class="text-gray-700 mb-4">Manage your listing on The Greek Directory. Your current tier allows you to access the following features:</p>
            
            <div class="space-y-2 mb-6">
                ${features[tier].map(f => `<div class="flex items-start gap-2"><span>${f}</span></div>`).join('')}
            </div>
            
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 class="font-semibold text-blue-900 mb-2">Quick Actions</h3>
                <div class="flex gap-3 flex-wrap">
                    <button onclick="switchTab('edit')" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Edit Listing</button>
                    <button onclick="switchTab('analytics')" class="px-4 py-2 bg-white text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50">View Analytics</button>
                    <a id="viewLiveBtn" href="${listingUrl}" target="_blank" class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">View Live Page</a>
                </div>
            </div>
        </div>

        <div class="bg-white rounded-lg p-6 shadow-sm">
            <h3 class="text-xl font-bold text-gray-900 mb-4">Listing Preview</h3>
            <div class="preview-card">
                <img id="previewMainImage" src="${(currentListing.photos && currentListing.photos.length > 0) ? currentListing.photos[0] : currentListing.logo}" alt="Main preview" class="preview-main-image">
                <div class="preview-info">
                    <div class="flex items-start justify-between mb-3">
                        <div class="flex-1">
                            <h4 id="previewBusinessName" class="text-2xl font-bold text-gray-900 mb-1">${currentListing.business_name}</h4>
                            <p id="previewTagline" class="text-gray-600 italic text-sm mb-2">${currentListing.tagline || ''}</p>
                            <div id="previewCategory" class="inline-block px-3 py-1 text-sm font-semibold text-white rounded-full mb-2" style="background-color:#055193;">${currentListing.category}</div>
                        </div>
                        ${currentListing.logo ? `<img id="previewLogo" src="${currentListing.logo}" alt="Logo" class="preview-logo ml-4">` : ''}
                    </div>
                    <div id="previewDetails" class="text-sm text-gray-700 space-y-1">
                        <div><span class="font-semibold">Listing ID:</span> #${currentListing.id}</div>
                        ${currentListing.subcategories && currentListing.subcategories.length > 0 ? 
                            `<div><span class="font-semibold">Subcategories:</span> ${currentListing.subcategories.join(', ')}</div>` : ''}
                        ${currentListing.city && currentListing.state ? 
                            `<div><span class="font-semibold">📍 Location:</span> ${currentListing.city}, ${currentListing.state}</div>` : ''}
                        ${currentListing.phone ? 
                            `<div><span class="font-semibold">📞 Phone:</span> ${formatPhoneNumber(currentListing.phone)}</div>` : ''}
                        ${currentListing.email ? 
                            `<div><span class="font-semibold">✉️ Email:</span> ${currentListing.email}</div>` : ''}
                        ${currentListing.website ? 
                            `<div><span class="font-semibold">🌐 Website:</span> <a href="${currentListing.website}" target="_blank" class="text-blue-600 hover:underline">${currentListing.website}</a></div>` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;
}

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
*/

function renderEditForm() {
    if (!currentListing) return;
    
    const tier = currentListing.tier || 'FREE';
    const maxDesc = tier === 'FREE' ? 1000 : 2000;
    const maxPhotos = tier === 'FREE' ? 1 : tier === 'FEATURED' ? 5 : tier === 'PREMIUM' ? 15 : 1;
    const maxCtas = tier === 'PREMIUM' ? 2 : tier === 'FEATURED' ? 1 : 0;
    currentMaxPhotos = maxPhotos;
    currentMaxCtas = maxCtas;
    uploadedImages = { logo: null, photos: [], video: null };
    
    selectedSubcategories = currentListing.subcategories || [];
    primarySubcategory = currentListing.primary_subcategory || null;
    
    const content = document.getElementById('content-edit');
    content.innerHTML = `
        <div class="bg-white rounded-lg p-6 shadow-sm">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-bold text-gray-900">Edit Your Listing</h2>
                <button onclick="saveChanges()" class="px-6 py-2 text-white rounded-lg font-medium" style="background-color: #055193;">Save Changes</button>
            </div>
            
            <div class="space-y-6">
                <!-- Basic Information -->
                <div>
                    <h3 class="text-lg font-bold text-gray-900 mb-4">Basic Information</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="md:col-span-2 disabled-field">
                            <label class="block text-sm font-medium text-gray-700 mb-2">Business Name</label>
                            <input type="text" value="${currentListing.business_name}" class="w-full px-4 py-2 border border-gray-300 rounded-lg" disabled>
                            <p class="info-notice">Contact Support to change this</p>
                        </div>
                        <div class="md:col-span-2">
                            <label class="block text-sm font-medium text-gray-700 mb-2">Tagline (max 75 chars) *</label>
                            <input type="text" id="editTagline" value="${currentListing.tagline || ''}" maxlength="75" class="w-full px-4 py-2 border border-gray-300 rounded-lg" oninput="updateCharCounter('tagline')">
                            <p class="char-counter mt-1"><span id="taglineCount">${(currentListing.tagline || '').length}</span>/75</p>
                        </div>
                        <div class="md:col-span-2">
                            <label class="block text-sm font-medium text-gray-700 mb-2">Description (max ${maxDesc} chars)</label>
                            <textarea id="editDescription" rows="5" class="w-full px-4 py-2 border border-gray-300 rounded-lg" oninput="updateCharCounter('description')">${currentListing.description || ''}</textarea>
                            <p class="char-counter mt-1"><span id="descriptionCount">${(currentListing.description || '').length}</span>/<span id="descriptionMax">${maxDesc}</span></p>
                        </div>
                        <div class="disabled-field">
                            <label class="block text-sm font-medium text-gray-700 mb-2">Category</label>
                            <input type="text" value="${currentListing.category}" class="w-full px-4 py-2 border border-gray-300 rounded-lg" disabled>
                            <p class="info-notice">Contact Support to change this</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Subcategories</label>
                            <div id="subcategoriesGrid" class="grid grid-cols-2 gap-2"></div>
                        </div>
                    </div>
                </div>

                <!-- Location -->
                <div>
                    <h3 class="text-lg font-bold text-gray-900 mb-4">Location Information</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            <input type="text" id="editZipCode" value="${currentListing.zip_code || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                        </div>
                    </div>
                </div>

                <!-- Contact Information -->
                <div>
                    <h3 class="text-lg font-bold text-gray-900 mb-4">Contact Information</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">📞 Phone</label>
                            <div id="editPhoneContainer"></div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">✉️ Email</label>
                            <input type="email" id="editEmail" value="${currentListing.email || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                        </div>
                        <div class="md:col-span-2">
                            <label class="block text-sm font-medium text-gray-700 mb-2">🌐 Website</label>
                            <input type="url" id="editWebsite" value="${currentListing.website || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                        </div>
                    </div>
                </div>

                <!-- Media Uploads -->
                <div>
                    <h3 class="text-lg font-bold text-gray-900 mb-4">Media</h3>
                    <p class="text-sm text-gray-600 mb-4">Upload media directly to Cloudflare Images. Photo limit for your tier: ${maxPhotos}</p>
                    <div class="grid grid-cols-1 gap-4">
                        <div class="border border-gray-200 rounded-lg p-4">
                            <div class="text-sm font-semibold text-gray-800">Cloudflare Images</div>
                            <p class="text-xs text-gray-500 mt-1">Credentials are stored locally in this browser.</p>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                                <div>
                                    <label class="block text-xs font-medium text-gray-600 mb-1">Account ID</label>
                                    <input type="text" id="cloudflareAccountId" class="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Cloudflare account ID">
                                </div>
                                <div>
                                    <label class="block text-xs font-medium text-gray-600 mb-1">API Key</label>
                                    <input type="password" id="cloudflareApiKey" class="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Cloudflare API key">
                                </div>
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Logo</label>
                            <input type="file" id="editLogoUpload" accept="image/*" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                            <img id="mediaLogoPreview" src="${currentListing.logo || ''}" alt="Logo preview" class="mt-2 w-20 h-20 rounded-lg object-cover ${currentListing.logo ? '' : 'hidden'}">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Photos</label>
                            <input type="file" id="editPhotosUpload" accept="image/*" multiple class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                            <div id="mediaPhotosPreview" class="mt-3 flex flex-wrap gap-2"></div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Video (optional)</label>
                            <input type="file" id="editVideoUpload" accept="video/*" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                        </div>
                        <div id="mediaUploadStatus" class="text-sm text-gray-600"></div>
                    </div>
                </div>

                <!-- Hours -->
                <div>
                    <h3 class="text-lg font-bold text-gray-900 mb-4">Hours of Operation</h3>
                    <div class="grid grid-cols-1 gap-3">
                        ${['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
                            const dayLower = day.toLowerCase();
                            const hours = currentListing.hours && currentListing.hours[dayLower] ? currentListing.hours[dayLower] : '';
                            const isClosed = hours.toLowerCase() === 'closed';
                            const is24Hours = hours.toLowerCase().includes('24') || hours.toLowerCase().includes('open 24');
                            
                            return `
                            <div class="flex gap-2 items-center">
                                <label class="w-28 flex items-center font-medium text-gray-700">${day}:</label>
                                <input type="text" id="editHours${day}" value="${hours}" class="flex-1 px-4 py-2 border border-gray-300 rounded-lg" placeholder="9:00 AM - 5:00 PM" ${isClosed || is24Hours ? 'disabled' : ''}>
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

                <!-- Social Media -->
                <div>
                    <h3 class="text-lg font-bold text-gray-900 mb-4">Social Media Links</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Facebook</label>
                            <input type="text" id="editFacebook" value="${currentListing.social_media?.facebook || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="username">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Instagram</label>
                            <input type="text" id="editInstagram" value="${currentListing.social_media?.instagram || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="username">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Twitter/X</label>
                            <input type="text" id="editTwitter" value="${currentListing.social_media?.twitter || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="username">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">YouTube</label>
                            <input type="text" id="editYoutube" value="${currentListing.social_media?.youtube || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="channel">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">TikTok</label>
                            <input type="text" id="editTiktok" value="${currentListing.social_media?.tiktok || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="username">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">LinkedIn</label>
                            <input type="url" id="editLinkedin" value="${currentListing.social_media?.linkedin || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Full URL">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Other Social 1 Name</label>
                            <input type="text" id="editOtherSocial1Name" value="${currentListing.social_media?.other1_name || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="e.g. Pinterest">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Other Social 1 URL</label>
                            <input type="url" id="editOtherSocial1" value="${currentListing.social_media?.other1 || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Full URL">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Other Social 2 Name</label>
                            <input type="text" id="editOtherSocial2Name" value="${currentListing.social_media?.other2_name || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="e.g. Discord">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Other Social 2 URL</label>
                            <input type="url" id="editOtherSocial2" value="${currentListing.social_media?.other2 || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Full URL">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Other Social 3 Name</label>
                            <input type="text" id="editOtherSocial3Name" value="${currentListing.social_media?.other3_name || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="e.g. Reddit">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Other Social 3 URL</label>
                            <input type="url" id="editOtherSocial3" value="${currentListing.social_media?.other3 || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Full URL">
                        </div>
                    </div>
                </div>

                <!-- Review Sites -->
                <div>
                    <h3 class="text-lg font-bold text-gray-900 mb-4">Review Sites</h3>
                    <p class="text-sm text-gray-600 mb-4">Add review links if not present (locked fields require Support)</p>
                    <div class="grid grid-cols-1 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Google Reviews</label>
                            <input type="url" id="editGoogleReviews" value="${currentListing.reviews?.google || ''}" 
                                class="w-full px-4 py-2 border border-gray-300 rounded-lg" 
                                ${currentListing.reviews?.google ? 'disabled' : ''} 
                                placeholder="Full Google Reviews URL">
                            ${currentListing.reviews?.google ? '<p class="info-notice">Contact Support to change</p>' : ''}
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Yelp</label>
                            <input type="url" id="editYelp" value="${currentListing.reviews?.yelp || ''}" 
                                class="w-full px-4 py-2 border border-gray-300 rounded-lg" 
                                ${currentListing.reviews?.yelp ? 'disabled' : ''} 
                                placeholder="Full Yelp URL">
                            ${currentListing.reviews?.yelp ? '<p class="info-notice">Contact Support to change</p>' : ''}
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">TripAdvisor</label>
                            <input type="url" id="editTripadvisor" value="${currentListing.reviews?.tripadvisor || ''}" 
                                class="w-full px-4 py-2 border border-gray-300 rounded-lg" 
                                ${currentListing.reviews?.tripadvisor ? 'disabled' : ''} 
                                placeholder="Full TripAdvisor URL">
                            ${currentListing.reviews?.tripadvisor ? '<p class="info-notice">Contact Support to change</p>' : ''}
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Other Review 1 Name</label>
                            <input type="text" id="editOtherReview1Name" value="${currentListing.reviews?.other1_name || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="e.g. BBB">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Other Review 1 URL</label>
                            <input type="url" id="editOtherReview1" value="${currentListing.reviews?.other1 || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Full URL">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Other Review 2 Name</label>
                            <input type="text" id="editOtherReview2Name" value="${currentListing.reviews?.other2_name || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="e.g. Angi">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Other Review 2 URL</label>
                            <input type="url" id="editOtherReview2" value="${currentListing.reviews?.other2 || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Full URL">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Other Review 3 Name</label>
                            <input type="text" id="editOtherReview3Name" value="${currentListing.reviews?.other3_name || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="e.g. OpenTable">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Other Review 3 URL</label>
                            <input type="url" id="editOtherReview3" value="${currentListing.reviews?.other3 || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Full URL">
                        </div>
                    </div>
                </div>

                <!-- Additional Information -->
                <div>
                    <h3 class="text-lg font-bold text-gray-900 mb-4">Additional Information</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        ${[0, 1, 2, 3, 4].map(index => {
                            const info = currentListing.additional_info?.[index] || {};
                            return `
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Info Name ${index + 1}</label>
                                <input type="text" id="editInfoName${index}" value="${info.label || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg" maxlength="30">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Info Value ${index + 1}</label>
                                <input type="text" id="editInfoValue${index}" value="${info.value || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg" maxlength="120">
                            </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                <!-- Custom CTA Buttons -->
                <div>
                    <h3 class="text-lg font-bold text-gray-900 mb-4">Custom CTA Buttons</h3>
                    <p class="text-sm text-gray-600 mb-4">Featured listings get 1 CTA. Premium listings get 2. Name max 15 characters.</p>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        ${[0, 1].map(index => {
                            const cta = currentListing.custom_ctas?.[index] || {};
                            return `
                            <div class="md:col-span-2 border border-gray-200 rounded-lg p-4 space-y-3">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">CTA ${index + 1} Name</label>
                                    <input type="text" id="editCtaName${index}" value="${cta.name || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg" maxlength="15">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">CTA ${index + 1} Link</label>
                                    <input type="url" id="editCtaUrl${index}" value="${cta.url || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="https://">
                                </div>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">Button Color</label>
                                        <input type="color" id="editCtaColor${index}" value="${cta.color || '#055193'}" class="w-full h-10 border border-gray-300 rounded-lg">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">Icon (emoji or short text)</label>
                                        <input type="text" id="editCtaIcon${index}" value="${cta.icon || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg" maxlength="10">
                                    </div>
                                </div>
                            </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const phoneContainer = document.getElementById('editPhoneContainer');
    if (phoneContainer) {
        phoneContainer.innerHTML = createPhoneInput(currentListing.phone || '', userCountry);
    }
    
    renderSubcategories();
    updateMediaPreview();
    attachMediaUploadHandlers();
    attachCloudflareConfigHandlers();
}

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
*/

function renderSubcategories() {
    const category = currentListing.category;
    const grid = document.getElementById('subcategoriesGrid');
    
    if (!grid) return;
    
    if (SUBCATEGORIES[category] && SUBCATEGORIES[category].length > 0) {
        grid.innerHTML = '';
        SUBCATEGORIES[category].forEach(sub => {
            const isSelected = selectedSubcategories.includes(sub);
            const isPrimary = sub === primarySubcategory;
            
            const div = document.createElement('div');
            div.className = 'subcategory-checkbox';
            div.innerHTML = `
                <input type="checkbox" id="subcat-${sub.replace(/\s+/g, '-')}" 
                    ${isSelected ? 'checked' : ''} 
                    onchange="toggleSubcategory('${sub.replace(/'/g, "\\'")}')">
                <label for="subcat-${sub.replace(/\s+/g, '-')}" class="flex-1">${sub}</label>
                <input type="radio" name="primarySub" 
                    ${isPrimary ? 'checked' : ''} 
                    ${!isSelected ? 'disabled' : ''}
                    onchange="setPrimarySubcategory('${sub.replace(/'/g, "\\'")}')"
                    title="Primary">
            `;
            grid.appendChild(div);
        });
    }
}

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
    
    renderSubcategories();
};

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
*/

window.setPrimarySubcategory = function(subcategory) {
    primarySubcategory = subcategory;
    renderSubcategories();
};

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

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
*/

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

async function saveChanges() {
    const tagline = document.getElementById('editTagline').value.trim();
    if (!tagline) {
        alert('Tagline is required');
        return;
    }
    
    if (selectedSubcategories.length === 0) {
        alert('At least one subcategory is required');
        return;
    }
    
    const tier = currentListing.tier || 'FREE';
    const maxDesc = tier === 'FREE' ? 1000 : 2000;
    const description = document.getElementById('editDescription').value;
    
    if (description.length > maxDesc) {
        alert(`Description too long! Maximum ${maxDesc} characters for ${tier} tier.`);
        return;
    }
    
    const phoneContainer = document.getElementById('editPhoneContainer');
    const phone = getPhoneValue(phoneContainer);
    
    const additionalInfo = [];
    for (let i = 0; i < 5; i += 1) {
        const label = document.getElementById(`editInfoName${i}`)?.value.trim();
        const value = document.getElementById(`editInfoValue${i}`)?.value.trim();
        if (label && value) {
            additionalInfo.push({ label, value });
        }
    }
    
    const customCtas = [];
    for (let i = 0; i < 2; i += 1) {
        const name = document.getElementById(`editCtaName${i}`)?.value.trim();
        const url = document.getElementById(`editCtaUrl${i}`)?.value.trim();
        const color = document.getElementById(`editCtaColor${i}`)?.value.trim();
        const icon = document.getElementById(`editCtaIcon${i}`)?.value.trim();
        
        if (!name && !url && !icon) continue;
        if (!name || !url) {
            alert(`CTA ${i + 1} requires both a name and a link.`);
            return;
        }
        if (name.length > 15) {
            alert(`CTA ${i + 1} name must be 15 characters or fewer.`);
            return;
        }
        customCtas.push({
            name,
            url,
            color: color || '#055193',
            icon: icon || ''
        });
    }
    
    if (currentMaxCtas === 0 && customCtas.length > 0) {
        alert('Custom CTA buttons are only available for Featured and Premium listings.');
        return;
    }
    
    const mergedPhotos = [
        ...(currentListing.photos || []),
        ...uploadedImages.photos
    ].slice(0, currentMaxPhotos);
    const updatedLogo = uploadedImages.logo || currentListing.logo || null;
    const updatedVideo = uploadedImages.video || currentListing.video || null;

    const changes = [];
    if (currentListing.tagline !== tagline) changes.push(`Tagline updated`);
    if (currentListing.description !== description) changes.push('Description updated');
    
    const newSubcategories = selectedSubcategories.sort().join(',');
    const oldSubcategories = (currentListing.subcategories || []).sort().join(',');
    if (oldSubcategories !== newSubcategories) changes.push(`Subcategories updated`);

    if (JSON.stringify(currentListing.additional_info || []) !== JSON.stringify(additionalInfo)) {
        changes.push('Additional info updated');
    }
    if (JSON.stringify(currentListing.custom_ctas || []) !== JSON.stringify(customCtas.slice(0, currentMaxCtas))) {
        changes.push('Custom CTA buttons updated');
    }
    if ((currentListing.logo || '') !== (updatedLogo || '')) {
        changes.push('Logo updated');
    }
    if (JSON.stringify(currentListing.photos || []) !== JSON.stringify(mergedPhotos)) {
        changes.push('Photos updated');
    }
    if ((currentListing.video || '') !== (updatedVideo || '')) {
        changes.push('Video updated');
    }
    
    if (changes.length === 0) {
        alert('No changes detected.');
        return;
    }
    
    const confirmMessage = `Save these changes?\n\n${changes.map(c => `• ${c}`).join('\n')}`;
    
    if (!confirm(confirmMessage)) return;
    
    /*
    Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    */
    
    try {
        const updates = {
            tagline: tagline,
            description: description,
            subcategories: selectedSubcategories,
            primary_subcategory: primarySubcategory,
            address: document.getElementById('editAddress').value.trim() || null,
            city: document.getElementById('editCity').value.trim() || null,
            state: document.getElementById('editState').value.trim() || null,
            zip_code: document.getElementById('editZipCode').value.trim() || null,
            phone: phone,
            email: document.getElementById('editEmail').value.trim() || null,
            website: document.getElementById('editWebsite').value.trim() || null,
            logo: updatedLogo,
            photos: mergedPhotos,
            video: updatedVideo,
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
                ...currentListing.reviews,
                google: currentListing.reviews?.google || document.getElementById('editGoogleReviews').value.trim() || null,
                yelp: currentListing.reviews?.yelp || document.getElementById('editYelp').value.trim() || null,
                tripadvisor: currentListing.reviews?.tripadvisor || document.getElementById('editTripadvisor').value.trim() || null,
                other1_name: document.getElementById('editOtherReview1Name').value.trim() || null,
                other1: document.getElementById('editOtherReview1').value.trim() || null,
                other2_name: document.getElementById('editOtherReview2Name').value.trim() || null,
                other2: document.getElementById('editOtherReview2').value.trim() || null,
                other3_name: document.getElementById('editOtherReview3Name').value.trim() || null,
                other3: document.getElementById('editOtherReview3').value.trim() || null
            },
            additional_info: additionalInfo,
            custom_ctas: customCtas.slice(0, currentMaxCtas)
        };
        
        const { data, error } = await window.TGDAuth.supabaseClient
            .from('listings')
            .update(updates)
            .eq('id', currentListing.id)
            .select()
            .single();
        
        if (error) throw error;
        
        currentListing = data;
        
        alert('✅ Changes saved successfully!');
        renderDashboard();
        switchTab('overview');
        
    } catch (error) {
        console.error('Error saving changes:', error);
        alert('❌ Failed to save changes: ' + error.message);
    }
}

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
*/

function renderAnalytics() {
    if (!currentListing) return;
    
    const tier = currentListing.tier || 'FREE';
    const analytics = currentListing.analytics || {
        views: 0,
        call_clicks: 0,
        website_clicks: 0,
        direction_clicks: 0,
        share_clicks: 0,
        video_plays: 0
    };
    
    const content = document.getElementById('content-analytics');
    
    let html = '';
    
    if (tier === 'FREE') {
        html = `
            <div class="bg-white rounded-lg p-6 shadow-sm">
                <h2 class="text-2xl font-bold text-gray-900 mb-6">Analytics</h2>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="analytics-stat-card">
                        <div class="text-4xl font-bold mb-2">${analytics.views || 0}</div>
                        <div class="text-sm opacity-90">Total Views</div>
                    </div>
                    <div class="analytics-stat-card" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
                        <div class="text-4xl font-bold mb-2">${(analytics.call_clicks || 0) + (analytics.website_clicks || 0) + (analytics.direction_clicks || 0) + (analytics.share_clicks || 0)}</div>
                        <div class="text-sm opacity-90">Total Engagement</div>
                    </div>
                </div>
                <div class="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p class="text-sm text-blue-900"><strong>Want more?</strong> Upgrade to see detailed analytics!</p>
                </div>
            </div>
        `;
    } else if (tier === 'VERIFIED') {
        html = `
            <div class="bg-white rounded-lg p-6 shadow-sm">
                <h2 class="text-2xl font-bold text-gray-900 mb-6">Analytics</h2>
                
                <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div class="analytics-stat-card">
                        <div class="text-4xl font-bold mb-2">${analytics.views || 0}</div>
                        <div class="text-sm opacity-90">Views</div>
                    </div>
                    <div class="analytics-stat-card" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
                        <div class="text-4xl font-bold mb-2">${analytics.call_clicks || 0}</div>
                        <div class="text-sm opacity-90">📞 Calls</div>
                    </div>
                    <div class="analytics-stat-card" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
                        <div class="text-4xl font-bold mb-2">${analytics.website_clicks || 0}</div>
                        <div class="text-sm opacity-90">🌐 Website</div>
                    </div>
                    <div class="analytics-stat-card" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
                        <div class="text-4xl font-bold mb-2">${analytics.direction_clicks || 0}</div>
                        <div class="text-sm opacity-90">🗺️ Directions</div>
                    </div>
                    <div class="analytics-stat-card" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);">
                        <div class="text-4xl font-bold mb-2">${analytics.share_clicks || 0}</div>
                        <div class="text-sm opacity-90">Shares</div>
                    </div>
                </div>
            </div>
        `;
    } else {
        html = `
            <div class="bg-white rounded-lg p-6 shadow-sm">
                <h2 class="text-2xl font-bold text-gray-900 mb-6">Analytics</h2>
                
                <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div class="analytics-stat-card">
                        <div class="text-4xl font-bold mb-2">${analytics.views || 0}</div>
                        <div class="text-sm opacity-90">Views</div>
                    </div>
                    <div class="analytics-stat-card" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
                        <div class="text-4xl font-bold mb-2">${analytics.call_clicks || 0}</div>
                        <div class="text-sm opacity-90">📞 Calls</div>
                    </div>
                    <div class="analytics-stat-card" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
                        <div class="text-4xl font-bold mb-2">${analytics.website_clicks || 0}</div>
                        <div class="text-sm opacity-90">🌐 Website</div>
                    </div>
                    <div class="analytics-stat-card" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
                        <div class="text-4xl font-bold mb-2">${analytics.direction_clicks || 0}</div>
                        <div class="text-sm opacity-90">🗺️ Directions</div>
                    </div>
                    <div class="analytics-stat-card" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);">
                        <div class="text-4xl font-bold mb-2">${analytics.share_clicks || 0}</div>
                        <div class="text-sm opacity-90">Shares</div>
                    </div>
                    <div class="analytics-stat-card" style="background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);">
                        <div class="text-4xl font-bold mb-2">${analytics.video_plays || 0}</div>
                        <div class="text-sm opacity-90">Video Plays</div>
                    </div>
                </div>
            </div>
        `;
    }
    
    content.innerHTML = html;
}

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
*/

function renderSettings() {
    if (!ownerData || ownerData.length === 0) return;
    
    const owner = ownerData[0];
    settingsVisibility = {
        email: owner.email_visible || false,
        phone: owner.phone_visible || false
    };
    
    const content = document.getElementById('content-settings');
    content.innerHTML = `
        <div class="bg-white rounded-lg p-6 shadow-sm">
            <h2 class="text-2xl font-bold text-gray-900 mb-6">Account Settings</h2>
            
            <div class="space-y-6">
                <div>
                    <h3 class="text-lg font-bold text-gray-900 mb-4">Contact Information</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="owner-field">
                            <div class="flex-1">
                                <label class="block text-sm font-medium text-gray-700 mb-2">✉️ Owner Email</label>
                                <input type="email" id="settingsOwnerEmail" value="${owner.owner_email || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                            </div>
                            <div class="mt-2">
                                <button class="visibility-toggle ${settingsVisibility.email ? 'visible' : 'hidden'}" onclick="toggleSettingsFieldVisibility('email')">
                                    ${settingsVisibility.email ? 'Visible' : 'Hidden'}
                                </button>
                            </div>
                        </div>
                        
                        <div class="owner-field">
                            <div class="flex-1">
                                <label class="block text-sm font-medium text-gray-700 mb-2">📞 Owner Phone</label>
                                <div id="settingsOwnerPhoneContainer"></div>
                            </div>
                            <div class="mt-2">
                                <button class="visibility-toggle ${settingsVisibility.phone ? 'visible' : 'hidden'}" onclick="toggleSettingsFieldVisibility('phone')">
                                    ${settingsVisibility.phone ? 'Visible' : 'Hidden'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div>
                    <h3 class="text-lg font-bold text-gray-900 mb-4">Password</h3>
                    <div class="max-w-md space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                            <input type="password" id="settingsNewPassword" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                            <input type="password" id="settingsConfirmPassword" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                        </div>
                        <button onclick="updatePassword()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Update Password</button>
                    </div>
                </div>
                
                <div class="border-t pt-6">
                    <button onclick="saveSettings()" class="px-6 py-3 text-white rounded-lg font-medium" style="background-color: #055193;">Save Settings</button>
                </div>
            </div>
        </div>
    `;
    
    const ownerPhoneContainer = document.getElementById('settingsOwnerPhoneContainer');
    if (ownerPhoneContainer) {
        ownerPhoneContainer.innerHTML = createPhoneInput(owner.owner_phone || '', userCountry);
    }
}

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
*/

window.toggleSettingsFieldVisibility = function(field) {
    settingsVisibility[field] = !settingsVisibility[field];
    const button = document.querySelector(`.visibility-toggle[onclick*="${field}"]`);
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

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
*/

async function saveSettings() {
    if (!ownerData || ownerData.length === 0) return;
    
    const updatedEmail = document.getElementById('settingsOwnerEmail').value.trim();
    const ownerPhoneContainer = document.getElementById('settingsOwnerPhoneContainer');
    const updatedPhone = getPhoneValue(ownerPhoneContainer);
    
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
window.saveChanges = saveChanges;
window.switchTab = switchTab;
window.loadListingData = loadListingData;

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
This source code is proprietary and no part may not be used, reproduced, or distributed 
without written permission from The Greek Directory. Unauthorized use, copying, modification, 
or distribution of this code will result in legal action to the fullest extent permitted by law.
*/
