// js/pwa/starred.js (COMPLETE FIX)
// Copyright (C) The Greek Directory, 2025-present. All rights reserved. This source code is proprietary and no part may not be used, reproduced, or distributed without written permission from The Greek Directory. For more information, visit https://thegreekdirectory.org/legal.

// ============================================
// PWA STARRED LISTINGS MANAGER - COMPLETE FIX
// Fixed: Starred functionality for all devices
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
            if (!this.storage) {
                console.error('PWAStorage not available');
                return;
            }
            
            await this.storage.init();
            this.initialized = true;
            console.log('StarredManager initialized');
            await this.updateStarredCount();
        } catch (error) {
            console.error('Failed to initialize StarredManager:', error);
        }
    }
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    async toggleStar(listingId, listingData) {
        try {
            await this.init();
            
            if (!this.initialized) {
                throw new Error('StarredManager not initialized');
            }
            
            const isStarred = await this.storage.isStarred(listingId);
            
            if (isStarred) {
                await this.storage.removeStarred(listingId);
                this.updateStarButtons(listingId, false);
                if (window.PWAApp) {
                    window.PWAApp.showToast('Removed from starred');
                }
            } else {
                if (!listingData || !listingData.id) {
                    throw new Error('Invalid listing data');
                }
                
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
        const selectors = [
            `[data-listing-id="${listingId}"]`,
            `[onclick*="'${listingId}'"]`,
            `[onclick*='"${listingId}"']`,
            `.star-button[data-id="${listingId}"]`
        ];
        
        selectors.forEach(selector => {
            const buttons = document.querySelectorAll(selector);
            buttons.forEach(btn => {
                if (isStarred) {
                    btn.classList.add('starred');
                } else {
                    btn.classList.remove('starred');
                }
            });
        });
    }
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    async updateStarredCount() {
        try {
            if (!this.initialized) return;
            
            const count = await this.storage.getStarredCount();
            
            const badges = document.querySelectorAll('#starredCount, .starred-count-badge');
            badges.forEach(badge => {
                badge.textContent = count;
                if (count > 0) {
                    badge.style.display = 'inline';
                } else {
                    badge.style.display = 'none';
                }
            });
        } catch (error) {
            console.error('Update starred count failed:', error);
        }
    }
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    async renderStarredListings(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('Container not found:', containerId);
            return;
        }
        
        try {
            await this.init();
            
            if (!this.initialized) {
                throw new Error('Not initialized');
            }
            
            const starred = await this.storage.getAllStarred();
            console.log('Starred listings:', starred);
            
            if (starred.length === 0) {
                container.innerHTML = `
                    <div class="col-span-full text-center py-12">
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
            
            await this.updateStarButtonStates(starred);
        } catch (error) {
            console.error('Failed to render starred listings:', error);
            container.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <div class="text-6xl mb-4">❌</div>
                    <h2 class="text-2xl font-bold text-gray-900 mb-2">Error loading starred listings</h2>
                    <p class="text-gray-600 mb-6">${error.message}</p>
                    <button onclick="location.reload()" class="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        Retry
                    </button>
                </div>
            `;
        }
    }
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    async updateStarButtonStates(listings) {
        for (const listing of listings) {
            this.updateStarButtons(listing.id, true);
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

window.handleStarClick = async function(listingId, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    try {
        let listingData = window.currentListingData || {};
        
        if (!listingData.id) {
            await window.PWAStorage.init();
            const starred = await window.PWAStorage.getAllStarred();
            listingData = starred.find(l => l.id === listingId);
            
            if (!listingData) {
                console.error('Listing data not found for:', listingId);
                if (window.PWAApp) {
                    window.PWAApp.showToast('Unable to star this listing');
                }
                return;
            }
        }
        
        await starredManager.toggleStar(listingId, listingData);
    } catch (error) {
        console.error('Star click handler failed:', error);
        if (window.PWAApp) {
            window.PWAApp.showToast('Error updating starred status');
        }
    }
};

// Copyright (C) The Greek Directory, 2025-present. All rights reserved.

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await starredManager.init();
        await starredManager.updateStarredCount();
        
        const starButtons = document.querySelectorAll('.star-button');
        for (const button of starButtons) {
            const listingId = button.getAttribute('data-listing-id') || 
                             button.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
            
            if (listingId) {
                const isStarred = await window.PWAStorage.isStarred(listingId);
                if (isStarred) {
                    button.classList.add('starred');
                }
            }
        }
    } catch (error) {
        console.error('Failed to initialize starred buttons:', error);
    }
});

// Copyright (C) The Greek Directory, 2025-present. All rights reserved. This source code is proprietary and no part may not be used, reproduced, or distributed without written permission from The Greek Directory. For more information, visit https://thegreekdirectory.org/legal.
