// js/pwa/dock.js
// Copyright (C) The Greek Directory, 2025-present. All rights reserved. This source code is proprietary and no part may not be used, reproduced, or distributed without written permission from The Greek Directory. For more information, visit https://thegreekdirectory.org/legal.

// ============================================
// PWA DOCK
// Bottom navigation dock with icons
// ============================================

// Copyright (C) The Greek Directory, 2025-present. All rights reserved.

class PWADock {
    constructor() {
        this.currentPath = window.location.pathname;
        this.longPressTimer = null;
        this.longPressTriggered = false;
    }
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    init() {
        if (!window.PWAApp || !window.PWAApp.isStandalone) return;
        
        this.createDock();
        this.setupLongPress();
    }
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    createDock() {
        const dock = document.createElement('nav');
        dock.className = 'pwa-dock';
        dock.innerHTML = `
            <a href="/index.html" class="pwa-dock-item ${this.isActive('/index.html') ? 'active' : ''}" data-page="home">
                <div class="pwa-dock-icon">🏠</div>
                <div class="pwa-dock-label">Home</div>
            </a>
            <a href="/listings.html" class="pwa-dock-item ${this.isActive('/listings.html') ? 'active' : ''}" data-page="search">
                <div class="pwa-dock-icon">🔍</div>
                <div class="pwa-dock-label">Search</div>
            </a>
            <a href="/starred.html" class="pwa-dock-item ${this.isActive('/starred.html') ? 'active' : ''}" data-page="starred">
                <div class="pwa-dock-icon">⭐</div>
                <div class="pwa-dock-label">Starred</div>
            </a>
            <a href="/settings.html" class="pwa-dock-item ${this.isActive('/settings.html') ? 'active' : ''}" data-page="settings">
                <div class="pwa-dock-icon">⚙️</div>
                <div class="pwa-dock-label">Settings</div>
            </a>
        `;
        
        document.body.appendChild(dock);
    }
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    isActive(path) {
        const currentPath = window.location.pathname;
        
        // Exact match
        if (currentPath === path) return true;
        
        // Root path matches
        if (path === '/index.html' && (currentPath === '/' || currentPath === '/index.html')) return true;
        
        // Partial match for listings
        if (path === '/listings.html' && currentPath.includes('/listing')) return true;
        
        return false;
    }
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    setupLongPress() {
        const dockItems = document.querySelectorAll('.pwa-dock-item');
        
        dockItems.forEach(item => {
            const page = item.dataset.page;
            const isCurrentPage = item.classList.contains('active');
            
            // Touch events for long press
            item.addEventListener('touchstart', (e) => {
                this.longPressTriggered = false;
                
                // Only allow long press on current page
                if (isCurrentPage) {
                    this.longPressTimer = setTimeout(() => {
                        this.longPressTriggered = true;
                        this.handleLongPress(page);
                    }, 500);
                }
            });
            
            item.addEventListener('touchend', (e) => {
                clearTimeout(this.longPressTimer);
                
                // Prevent navigation if long press was triggered
                if (this.longPressTriggered) {
                    e.preventDefault();
                }
            });
            
            item.addEventListener('touchmove', () => {
                clearTimeout(this.longPressTimer);
            });
            
            // Prevent context menu
            item.addEventListener('contextmenu', (e) => {
                e.preventDefault();
            });
        });
    }
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    handleLongPress(page) {
        console.log('Long press on current tab:', page);
        
        // Haptic feedback if available
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
        
        // Reload page
        window.location.reload();
    }
}

// Copyright (C) The Greek Directory, 2025-present. All rights reserved.

// Initialize dock
const pwaDock = new PWADock();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => pwaDock.init());
} else {
    pwaDock.init();
}

// Copyright (C) The Greek Directory, 2025-present. All rights reserved. This source code is proprietary and no part may not be used, reproduced, or distributed without written permission from The Greek Directory. For more information, visit https://thegreekdirectory.org/legal.
