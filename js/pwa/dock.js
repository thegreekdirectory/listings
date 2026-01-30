// js/pwa/dock.js (COMPLETE WITH CATEGORIES AND AUTO-HIDE)
// Copyright (C) The Greek Directory, 2025-present. All rights reserved. This source code is proprietary and no part may not be used, reproduced, or distributed without written permission from The Greek Directory. For more information, visit https://thegreekdirectory.org/legal.

// ============================================
// PWA DOCK WITH CATEGORIES AND AUTO-HIDE
// Bottom navigation dock with dynamic overflow handling and auto-hide
// ============================================

// Copyright (C) The Greek Directory, 2025-present. All rights reserved.

class PWADock {
    constructor() {
        this.currentPath = window.location.pathname;
        this.longPressTimer = null;
        this.longPressTriggered = false;
        this.maxVisibleApps = this.calculateMaxApps();
        this.autoHide = localStorage.getItem('tgd_dock_autohide') === 'true';
        this.lastScrollY = window.scrollY;
        this.scrollTimer = null;
        
        // All available apps
        this.availableApps = [
            { id: 'home', label: 'Home', icon: '🏠', path: '/index.html', required: true },
            { id: 'categories', label: 'Categories', icon: '📋', path: '/categories.html', required: false },
            { id: 'search', label: 'Search', icon: '🔍', path: '/listings.html', required: false },
            { id: 'map', label: 'Map', icon: '🗺️', path: '/map.html', required: false },
            { id: 'starred', label: 'Starred', icon: '⭐', path: '/starred.html', required: false },
            { id: 'settings', label: 'Settings', icon: '⚙️', path: '/settings.html', required: true }
        ];
        
        // Default dock order with Categories
        this.defaultDockOrder = ['home', 'categories', 'search', 'starred', 'settings'];
        
        // Load saved dock configuration or use default
        this.loadDockConfig();
        
        // Listen for resize events
        window.addEventListener('resize', () => {
            this.maxVisibleApps = this.calculateMaxApps();
            this.refreshDock();
        });
    }
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    calculateMaxApps() {
        const screenWidth = window.innerWidth;
        
        // Account for safe areas
        const safeWidth = screenWidth - 32; // 16px padding on each side
        
        // Each app needs about 70px, more button needs 60px
        if (safeWidth < 320) return 3; // Very small screens
        if (safeWidth < 375) return 4; // iPhone SE
        if (safeWidth < 414) return 5; // Standard phones
        return 6; // Larger phones
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
    
    getVisibleApps() {
        const apps = this.getDockApps();
        
        // If apps fit, show all
        if (apps.length <= this.maxVisibleApps) {
            return { visible: apps, overflow: [] };
        }
        
        // Calculate how many to show (leave room for more button)
        const visibleCount = this.maxVisibleApps - 1;
        
        // Always show home if it exists
        const homeIndex = apps.findIndex(app => app.id === 'home');
        let visible = homeIndex >= 0 ? [apps[homeIndex]] : [];
        
        // Add other apps up to the limit
        const remaining = apps.filter(app => app.id !== 'home');
        visible = visible.concat(remaining.slice(0, visibleCount - visible.length));
        
        // Everything else goes to overflow
        const overflow = remaining.slice(visibleCount - (homeIndex >= 0 ? 1 : 0));
        
        // Settings must be in overflow if there is overflow
        const settingsIndex = visible.findIndex(app => app.id === 'settings');
        if (overflow.length > 0 && settingsIndex >= 0) {
            const settings = visible.splice(settingsIndex, 1)[0];
            overflow.unshift(settings);
        }
        
        return { visible, overflow };
    }
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    moveDockApp(appId, direction) {
        const index = this.dockApps.indexOf(appId);
        if (index === -1) return;
        
        const app = this.availableApps.find(a => a.id === appId);
        if (app && app.required) return;
        
        if (direction === 'up' && index > 0) {
            if (index === 1 && this.availableApps.find(a => a.id === this.dockApps[0])?.required) return;
            [this.dockApps[index], this.dockApps[index - 1]] = [this.dockApps[index - 1], this.dockApps[index]];
        } else if (direction === 'down' && index < this.dockApps.length - 1) {
            if (index === this.dockApps.length - 2 && this.availableApps.find(a => a.id === this.dockApps[this.dockApps.length - 1])?.required) return;
            [this.dockApps[index], this.dockApps[index + 1]] = [this.dockApps[index + 1], this.dockApps[index]];
        }
        
        this.saveDockConfig();
        this.refreshDock();
    }
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    addDockApp(appId) {
        if (this.dockApps.includes(appId)) return;
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
    
    setAutoHide(enabled) {
        this.autoHide = enabled;
        localStorage.setItem('tgd_dock_autohide', enabled ? 'true' : 'false');
        
        if (enabled) {
            this.setupAutoHide();
        } else {
            this.removeAutoHide();
        }
    }
    
    setupAutoHide() {
        if (!this.autoHide) return;
        
        window.addEventListener('scroll', this.handleScroll);
    }
    
    removeAutoHide() {
        window.removeEventListener('scroll', this.handleScroll);
        
        // Show dock
        const dock = document.querySelector('.pwa-dock');
        if (dock) {
            dock.classList.remove('hidden');
        }
    }
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    handleScroll = () => {
        if (!this.autoHide) return;
        
        const currentScrollY = window.scrollY;
        const dock = document.querySelector('.pwa-dock');
        
        if (!dock) return;
        
        // Clear existing timer
        if (this.scrollTimer) {
            clearTimeout(this.scrollTimer);
        }
        
        // Scrolling down - hide dock
        if (currentScrollY > this.lastScrollY && currentScrollY > 100) {
            dock.classList.add('hidden');
        }
        // Scrolling up - show dock
        else if (currentScrollY < this.lastScrollY) {
            dock.classList.remove('hidden');
        }
        
        this.lastScrollY = currentScrollY;
        
        // Show dock after scroll stops for 1 second
        this.scrollTimer = setTimeout(() => {
            if (dock) {
                dock.classList.remove('hidden');
            }
        }, 1000);
    }
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    init() {
        if (!window.PWAApp || !window.PWAApp.isStandalone) return;
        this.createDock();
        this.setupLongPress();
        
        if (this.autoHide) {
            this.setupAutoHide();
        }
    }
    
    refreshDock() {
        const existingDock = document.querySelector('.pwa-dock');
        if (existingDock) {
            existingDock.remove();
        }
        const existingMenu = document.querySelector('.pwa-dock-more-menu');
        if (existingMenu) {
            existingMenu.remove();
        }
        this.createDock();
        this.setupLongPress();
        
        if (this.autoHide) {
            this.setupAutoHide();
        }
    }
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    createDock() {
        const dock = document.createElement('nav');
        dock.className = 'pwa-dock';
        
        const { visible, overflow } = this.getVisibleApps();
        
        // Add visible apps
        visible.forEach(app => {
            const item = this.createDockItem(app);
            dock.appendChild(item);
        });
        
        // Add more button if there's overflow
        if (overflow.length > 0) {
            const moreButton = this.createMoreButton(overflow);
            dock.appendChild(moreButton);
        }
        
        document.body.appendChild(dock);
    }
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    createDockItem(app) {
        const item = document.createElement('a');
        item.href = app.path;
        item.className = `pwa-dock-item ${this.isActive(app.path) ? 'active' : ''}`;
        item.dataset.page = app.id;
        
        const hasUpdate = app.id === 'settings' && localStorage.getItem('tgd_update_available') === 'true';
        
        item.innerHTML = `
            <div class="pwa-dock-icon">
                ${app.icon}
                ${hasUpdate ? '<span class="update-badge"></span>' : ''}
            </div>
            <div class="pwa-dock-label">${app.label}</div>
        `;
        
        return item;
    }
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    createMoreButton(overflowApps) {
        const container = document.createElement('div');
        container.className = 'pwa-dock-more';
        
        const button = document.createElement('button');
        button.className = 'pwa-dock-item';
        button.innerHTML = `
            <div class="pwa-dock-icon">☰</div>
            <div class="pwa-dock-label">More</div>
        `;
        
        const menu = document.createElement('div');
        menu.className = 'pwa-dock-more-menu';
        menu.innerHTML = overflowApps.map(app => {
            const hasUpdate = app.id === 'settings' && localStorage.getItem('tgd_update_available') === 'true';
            return `
                <a href="${app.path}" class="pwa-dock-more-item ${this.isActive(app.path) ? 'active' : ''}">
                    <div class="pwa-dock-more-icon">
                        ${app.icon}
                        ${hasUpdate ? '<span class="update-badge" style="position: absolute; top: -4px; right: -4px;"></span>' : ''}
                    </div>
                    <div class="pwa-dock-more-label">${app.label}</div>
                </a>
            `;
        }).join('');
        
        button.addEventListener('click', (e) => {
            e.preventDefault();
            menu.classList.toggle('active');
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!container.contains(e.target)) {
                menu.classList.remove('active');
            }
        });
        
        container.appendChild(button);
        document.body.appendChild(menu);
        
        return container;
    }
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    isActive(path) {
        const currentPath = window.location.pathname;
        if (currentPath === path) return true;
        if (path === '/index.html' && (currentPath === '/' || currentPath === '/index.html')) return true;
        if (path === '/listings.html' && currentPath.includes('/listing')) return true;
        if (path === '/categories.html' && currentPath === '/categories.html') return true;
        return false;
    }
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    setupLongPress() {
        const dockItems = document.querySelectorAll('.pwa-dock-item');
        
        dockItems.forEach(item => {
            const page = item.dataset.page;
            const isCurrentPage = item.classList.contains('active');
            
            item.addEventListener('touchstart', (e) => {
                this.longPressTriggered = false;
                if (isCurrentPage) {
                    this.longPressTimer = setTimeout(() => {
                        this.longPressTriggered = true;
                        this.handleLongPress(page);
                    }, 500);
                }
            });
            
            item.addEventListener('touchend', (e) => {
                clearTimeout(this.longPressTimer);
                if (this.longPressTriggered) {
                    e.preventDefault();
                }
            });
            
            item.addEventListener('touchmove', () => {
                clearTimeout(this.longPressTimer);
            });
            
            item.addEventListener('contextmenu', (e) => {
                e.preventDefault();
            });
        });
    }
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    handleLongPress(page) {
        console.log('Long press on current tab:', page);
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
        window.location.reload();
    }
}

// Copyright (C) The Greek Directory, 2025-present. All rights reserved.

const pwaDock = new PWADock();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => pwaDock.init());
} else {
    pwaDock.init();
}

window.pwaDock = pwaDock;

// Copyright (C) The Greek Directory, 2025-present. All rights reserved. This source code is proprietary and no part may not be used, reproduced, or distributed without written permission from The Greek Directory. For more information, visit https://thegreekdirectory.org/legal.
