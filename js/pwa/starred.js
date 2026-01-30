// js/pwa/starred.js (COMPLETE REPLACEMENT)
// Copyright (C) The Greek Directory, 2025-present. All rights reserved. This source code is proprietary and no part may not be used, reproduced, or distributed without written permission from The Greek Directory. For more information, visit https://thegreekdirectory.org/legal.

// ============================================
// PWA STARRED LISTINGS MANAGER
// Manages starred listings functionality
// ============================================

// Copyright (C) The Greek Directory, 2025-present. All rights reserved.

class StarredManager {
    constructor() {
        this.storage = window.PWAStorage;
        this.initialized = false;
    }
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    async init() {
        if (this.initialized) return;
        
        try {
            await this.storage.init();
            this.initialized = true;
            await this.updateStarredCount();
        } catch (error) {
            console.error('Failed to initialize StarredManager:', error);
        }
    }
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    async toggleStar(listingId, listingData) {
        try {
            await this.init();
            
            const isStarred = await this.storage.isStarred(listingId);
            
            if (isStarred) {
                await this.storage.removeStarred(listingId);
                this.updateStarButtons(listingId, false);
                if (window.PWAApp) {
                    window.PWAApp.showToast('Removed from starred');
                }
            } else {
                await this.storage.addStarred(listingData);
                this.updateStarButtons(listingId, true);
                if (window.PWAApp) {
                    window.PWAApp.showToast('Added to starred');
                }
            }
            
            await this.updateStarredCount();
            
            return !isStarred;
        } catch (error) {
            console.error('Toggle star failed:', error);
            if (window.PWAApp) {
                window.PWAApp.showToast('Failed to update starred status');
            }
            return false;
        }
    }
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    updateStarButtons(listingId, isStarred) {
        const buttons = document.querySelectorAll(`[data-listing-id="${listingId}"], [onclick*="'${listingId}'"]`);
        buttons.forEach(btn => {
            if (isStarred) {
                btn.classList.add('starred');
            } else {
                btn.classList.remove('starred');
            }
        });
    }
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    async updateStarredCount() {
        try {
            const count = await this.storage.getStarredCount();
            const badges = document.querySelectorAll('.starred-count-badge');
            badges.forEach(badge => {
                badge.textContent = count;
                badge.style.display = count > 0 ? 'inline' : 'none';
            });
        } catch (error) {
            console.error('Update starred count failed:', error);
        }
    }
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    async renderStarredListings(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        try {
            await this.init();
            const starred = await this.storage.getAllStarred();
            
            if (starred.length === 0) {
                container.innerHTML = `
                    <div class="text-center py-12">
                        <div class="text-6xl mb-4">⭐</div>
                        <h2 class="text-2xl font-bold text-gray-900 mb-2">No starred listings yet</h2>
                        <p class="text-gray-600 mb-6">Star your favorite businesses to access them quickly</p>
                        <a href="/listings.html" class="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                            Browse Listings
                        </a>
                    </div>
                `;
                return;
            }
            
            container.innerHTML = starred.map(listing => this.createListingCard(listing)).join('');
        } catch (error) {
            console.error('Failed to render starred listings:', error);
            container.innerHTML = `
                <div class="text-center py-12">
                    <div class="text-6xl mb-4">❌</div>
                    <h2 class="text-2xl font-bold text-gray-900 mb-2">Error loading starred listings</h2>
                    <p class="text-gray-600">Please try again later</p>
                </div>
            `;
        }
    }
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    createListingCard(listing) {
        const categorySlug = (listing.category || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const url = `/listing/${categorySlug}/${listing.slug}`;
        const mainImage = (listing.photos && listing.photos.length > 0) ? listing.photos[0] : listing.logo;
        
        return `
            <a href="${url}" class="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden block">
                <div class="h-48 bg-gray-200 relative">
                    ${mainImage ? `<img src="${mainImage}" alt="${listing.business_name}" class="w-full h-full object-cover" loading="lazy">` : '<div class="w-full h-full flex items-center justify-center text-gray-400 text-xl">No image</div>'}
                    <button class="star-button starred absolute top-3 right-3 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center" onclick="handleStarClick('${listing.id}', event)" data-listing-id="${listing.id}">
                        <svg class="star-icon w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                    </button>
                </div>
                <div class="p-4">
                    <div class="flex gap-3 mb-3">
                        ${listing.logo ? `<img src="${listing.logo}" alt="${listing.business_name} logo" class="w-16 h-16 rounded object-cover flex-shrink-0" loading="lazy">` : '<div class="w-16 h-16 rounded bg-gray-200 flex-shrink-0"></div>'}
                        <div class="flex-1 min-w-0">
                            <span class="text-xs font-semibold px-2 py-1 rounded-full text-white block w-fit mb-2" style="background-color:#045093;">${listing.category || 'Uncategorized'}</span>
                            <h3 class="text-lg font-bold text-gray-900 line-clamp-1">${listing.business_name}</h3>
                        </div>
                    </div>
                    <p class="text-sm text-gray-600 mb-3 line-clamp-2">${listing.tagline || listing.description || ''}</p>
                    ${listing.city && listing.state ? `<p class="text-sm text-gray-600">📍 ${listing.city}, ${listing.state}</p>` : ''}
                </div>
            </a>
        `;
    }
}

// Copyright (C) The Greek Directory, 2025-present. All rights reserved.

const starredManager = new StarredManager();

window.StarredManager = starredManager;

// Copyright (C) The Greek Directory, 2025-present. All rights reserved.

// Global function for star button clicks
window.handleStarClick = async function(listingId, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    try {
        // Get listing data from the current page or from storage
        let listingData = window.currentListingData || {};
        
        if (!listingData.id) {
            // Try to get from storage if already starred
            await window.PWAStorage.init();
            const starred = await window.PWAStorage.getAllStarred();
            listingData = starred.find(l => l.id === listingId) || { id: listingId };
        }
        
        await starredManager.toggleStar(listingId, listingData);
    } catch (error) {
        console.error('Star click handler failed:', error);
    }
};

// js/pwa/storage.js (ADD DEBUGGING AND FIX)
// Add after getAllStarred method:

async getAllStarred() {
    try {
        await this.init();
        const transaction = this.db.transaction(['starredListings'], 'readonly');
        const store = transaction.objectStore('starredListings');
        const request = store.getAll();
        
        return new Promise((resolve, reject) => {
            request.onsuccess = () => {
                console.log('Retrieved starred listings:', request.result);
                resolve(request.result || []);
            };
            request.onerror = () => {
                console.error('Get all starred failed:', request.error);
                reject(request.error);
            };
        });
    } catch (error) {
        console.error('getAllStarred failed:', error);
        return [];
    }
}

// Copyright (C) The Greek Directory, 2025-present. All rights reserved. This source code is proprietary and no part may not be used, reproduced, or distributed without written permission from The Greek Directory. For more information, visit https://thegreekdirectory.org/legal.
