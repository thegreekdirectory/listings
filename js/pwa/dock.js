// js/pwa/dock.js (COMPLETE REPLACEMENT)
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
        
        // All available apps
        this.availableApps = [
            { id: 'home', label: 'Home', icon: '🏠', path: '/index.html', required: true },
            { id: 'search', label: 'Search', icon: '🔍', path: '/listings.html', required: false },
            { id: 'map', label: 'Map', icon: '🗺️', path: '/map.html', required: false },
            { id: 'starred', label: 'Starred', icon: '⭐', path: '/starred.html', required: false },
            { id: 'settings', label: 'Settings', icon: '⚙️', path: '/settings.html', required: true }
        ];
        
        // Default dock order
        this.defaultDockOrder = ['home', 'search', 'map', 'starred', 'settings'];
        
        // Load saved dock configuration or use default
        this.loadDockConfig();
    }
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    loadDockConfig() {
        const saved = localStorage.getItem('tgd_dock_apps');
        if (saved) {
            try {
                this.dockApps = JSON.parse(saved);
            } catch (e) {
                this.dockApps = this.defaultDockOrder.slice();
            }
        } else {
            this.dockApps = this.defaultDockOrder.slice();
        }
        
        // Ensure required apps are present
        if (!this.dockApps.includes('home')) {
            this.dockApps.unshift('home');
        }
        if (!this.dockApps.includes('settings')) {
            this.dockApps.push('settings');
        }
    }
    
    saveDockConfig() {
        localStorage.setItem('tgd_dock_apps', JSON.stringify(this.dockApps));
    }
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    getDockApps() {
        return this.dockApps.map(id => this.availableApps.find(app => app.id === id)).filter(Boolean);
    }
    
    getAvailableApps() {
        return this.availableApps;
    }
    
    moveDockApp(appId, direction) {
        const index = this.dockApps.indexOf(appId);
        if (index === -1) return;
        
        const app = this.availableApps.find(a => a.id === appId);
        if (app && app.required) return; // Can't move required apps beyond their boundaries
        
        if (direction === 'up' && index > 0) {
            // Don't move past home if it's required
            if (index === 1 && this.availableApps.find(a => a.id === this.dockApps[0])?.required) return;
            
            [this.dockApps[index], this.dockApps[index - 1]] = [this.dockApps[index - 1], this.dockApps[index]];
        } else if (direction === 'down' && index < this.dockApps.length - 1) {
            // Don't move past settings if it's required
            if (index === this.dockApps.length - 2 && this.availableApps.find(a => a.id === this.dockApps[this.dockApps.length - 1])?.required) return;
            
            [this.dockApps[index], this.dockApps[index + 1]] = [this.dockApps[index + 1], this.dockApps[index]];
        }
        
        this.saveDockConfig();
        this.refreshDock();
    }
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    addDockApp(appId) {
        if (this.dockApps.includes(appId)) return;
        
        // Add before the last item (settings)
        this.dockApps.splice(this.dockApps.length - 1, 0, appId);
        this.saveDockConfig();
        this.refreshDock();
    }
    
    removeDockApp(appId) {
        const app = this.availableApps.find(a => a.id === appId);
        if (app && app.required) return;
        
        this.dockApps = this.dockApps.filter(id => id !== appId);
        this.saveDockConfig();
        this.refreshDock();
    }
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    init() {
        if (!window.PWAApp || !window.PWAApp.isStandalone) return;
        
        this.createDock();
        this.setupLongPress();
    }
    
    refreshDock() {
        const existingDock = document.querySelector('.pwa-dock');
        if (existingDock) {
            existingDock.remove();
        }
        this.createDock();
        this.setupLongPress();
    }
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    createDock() {
        const dock = document.createElement('nav');
        dock.className = 'pwa-dock';
        
        const dockApps = this.getDockApps();
        dock.innerHTML = dockApps.map(app => `
            <a href="${app.path}" class="pwa-dock-item ${this.isActive(app.path) ? 'active' : ''}" data-page="${app.id}">
                <div class="pwa-dock-icon">${app.icon}</div>
                <div class="pwa-dock-label">${app.label}</div>
            </a>
        `).join('');
        
        document.body.appendChild(dock);
    }
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    isActive(path) {
        const currentPath = window.location.pathname;
        
        // Exact match
        if (currentPath === path) return true;
        
        // Root path matches
        if (path === '/index.html' && (currentPath === '/' || currentPath === '/index.html')) return true;
        
        // Partial match for listings and individual listing pages
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

window.pwaDock = pwaDock;

// Copyright (C) The Greek Directory, 2025-present. All rights reserved. This source code is proprietary and no part may not be used, reproduced, or distributed without written permission from The Greek Directory. For more information, visit https://thegreekdirectory.org/legal.
