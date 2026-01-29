// js/pwa/storage.js
// Copyright (C) The Greek Directory, 2025-present. All rights reserved. This source code is proprietary and no part may not be used, reproduced, or distributed without written permission from The Greek Directory. For more information, visit https://thegreekdirectory.org/legal.

// ============================================
// PWA STORAGE MANAGER - IndexedDB
// Handles starred listings with full offline support
// ============================================

// Copyright (C) The Greek Directory, 2025-present. All rights reserved.

const DB_NAME = 'TGDDatabase';
const DB_VERSION = 1;
const STORE_NAME = 'starredListings';

class PWAStorage {
    constructor() {
        this.db = null;
    }
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            
            request.onerror = () => {
                console.error('IndexedDB error:', request.error);
                reject(request.error);
            };
            
            request.onsuccess = () => {
                this.db = request.result;
                console.log('IndexedDB initialized');
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                    objectStore.createIndex('timestamp', 'timestamp', { unique: false });
                    objectStore.createIndex('category', 'category', { unique: false });
                    console.log('Object store created');
                }
            };
        });
    }
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    async addStarred(listing) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readwrite');
            const objectStore = transaction.objectStore(STORE_NAME);
            
            const starredListing = {
                id: listing.id,
                business_name: listing.business_name,
                tagline: listing.tagline,
                description: listing.description,
                category: listing.category,
                subcategories: listing.subcategories,
                city: listing.city,
                state: listing.state,
                address: listing.address,
                phone: listing.phone,
                email: listing.email,
                website: listing.website,
                logo: listing.logo,
                photos: listing.photos || [],
                hours: listing.hours,
                social_media: listing.social_media,
                reviews: listing.reviews,
                tier: listing.tier,
                verified: listing.verified,
                slug: listing.slug,
                timestamp: Date.now()
            };
            
            const request = objectStore.add(starredListing);
            
            request.onsuccess = () => {
                console.log('Listing starred:', listing.id);
                
                // Cache images for offline use
                if (listing.logo) {
                    this.cacheImage(listing.logo);
                }
                if (listing.photos && listing.photos.length > 0) {
                    listing.photos.forEach(photo => this.cacheImage(photo));
                }
                
                resolve(true);
            };
            
            request.onerror = () => {
                console.error('Error adding starred listing:', request.error);
                reject(request.error);
            };
        });
    }
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    async removeStarred(listingId) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readwrite');
            const objectStore = transaction.objectStore(STORE_NAME);
            const request = objectStore.delete(listingId);
            
            request.onsuccess = () => {
                console.log('Listing unstarred:', listingId);
                resolve(true);
            };
            
            request.onerror = () => {
                console.error('Error removing starred listing:', request.error);
                reject(request.error);
            };
        });
    }
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    async isStarred(listingId) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readonly');
            const objectStore = transaction.objectStore(STORE_NAME);
            const request = objectStore.get(listingId);
            
            request.onsuccess = () => {
                resolve(!!request.result);
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    }
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    async getAllStarred() {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readonly');
            const objectStore = transaction.objectStore(STORE_NAME);
            const request = objectStore.getAll();
            
            request.onsuccess = () => {
                const results = request.result || [];
                results.sort((a, b) => b.timestamp - a.timestamp);
                resolve(results);
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    }
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    async getStarredCount() {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readonly');
            const objectStore = transaction.objectStore(STORE_NAME);
            const request = objectStore.count();
            
            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    }
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    async clearAll() {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readwrite');
            const objectStore = transaction.objectStore(STORE_NAME);
            const request = objectStore.clear();
            
            request.onsuccess = () => {
                console.log('All starred listings cleared');
                resolve(true);
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    }
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    cacheImage(url) {
        if (!url) return;
        
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
                type: 'CACHE_IMAGE',
                url: url
            });
        }
    }
}

// Copyright (C) The Greek Directory, 2025-present. All rights reserved.

const pwaStorage = new PWAStorage();

window.PWAStorage = pwaStorage;

// Copyright (C) The Greek Directory, 2025-present. All rights reserved. This source code is proprietary and no part may not be used, reproduced, or distributed without written permission from The Greek Directory. For more information, visit https://thegreekdirectory.org/legal.
