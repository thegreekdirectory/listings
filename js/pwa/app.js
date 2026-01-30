// js/pwa/app.js (COMPLETE FIX - ALL PWA ISSUES)
// Copyright (C) The Greek Directory, 2025-present. All rights reserved. This source code is proprietary and no part may not be used, reproduced, or distributed without written permission from The Greek Directory. For more information, visit https://thegreekdirectory.org/legal.

// ============================================
// PWA APP MANAGER - COMPLETE FIX
// Fixed: Link previews, iOS status bar, theme switching, update notifications
// ============================================

// Copyright (C) The Greek Directory, 2025-present. All rights reserved.

class PWAApp {
    constructor() {
        this.isStandalone = false;
        this.deferredPrompt = null;
        this.currentVersion = '1.0.2'; // Incremented version
        this.checkForUpdates();
    }
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    async init() {
        this.checkStandalone();
        this.applyPWAMode();
        
        if (this.isStandalone) {
            this.registerServiceWorker();
            this.checkRestrictedPages();
            this.showSplashScreen();
            this.preventAllLinkPreviews();
            this.ensureStatusBarVisible();
        }
        
        this.setupExternalLinks();
        this.applyTheme();
        this.setupInstallPrompt();
    }
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    checkStandalone() {
        const mediaQuery = window.matchMedia('(display-mode: standalone)');
        const iosStandalone = window.navigator.standalone === true;
        const androidReferrer = document.referrer.includes('android-app://');
        
        this.isStandalone = mediaQuery.matches || iosStandalone || androidReferrer;
        
        console.log('Standalone mode:', this.isStandalone);
    }
    
    applyPWAMode() {
        if (this.isStandalone) {
            document.body.classList.add('pwa-mode');
            
            const main = document.querySelector('main') || document.body;
            if (!main.classList.contains('pwa-safe-content')) {
                main.classList.add('pwa-safe-content');
            }
        }
    }
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    // NEW: Prevent ALL link previews except dock
    preventAllLinkPreviews() {
        // Prevent context menu (long press menu) on all links except dock
        document.addEventListener('contextmenu', (e) => {
            const isDockLink = e.target.closest('.pwa-dock-item, .pwa-dock-more-item');
            if (!isDockLink) {
                e.preventDefault();
                return false;
            }
        }, true);
        
        // Prevent iOS link preview on touchstart
        document.addEventListener('touchstart', (e) => {
            const target = e.target.closest('a, button');
            if (target && !target.closest('.pwa-dock-item, .pwa-dock-more-item')) {
                // Add CSS to prevent callout
                target.style.webkitTouchCallout = 'none';
                target.style.webkitUserSelect = 'none';
            }
        }, { passive: true });
        
        // Prevent long press on images and other elements
        document.addEventListener('touchstart', (e) => {
            if (e.target.tagName === 'IMG' || e.target.tagName === 'VIDEO') {
                e.target.style.webkitTouchCallout = 'none';
                e.target.style.webkitUserSelect = 'none';
            }
        }, { passive: true });
        
        // Add global CSS rules
        const style = document.createElement('style');
        style.textContent = `
            /* Copyright (C) The Greek Directory, 2025-present. All rights reserved. */
            body.pwa-mode a:not(.pwa-dock-item):not(.pwa-dock-more-item),
            body.pwa-mode img,
            body.pwa-mode video {
                -webkit-touch-callout: none !important;
                -webkit-user-select: none !important;
                user-select: none !important;
            }
            
            body.pwa-mode .pwa-dock-item,
            body.pwa-mode .pwa-dock-more-item {
                -webkit-touch-callout: default !important;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    // NEW: Ensure iOS status bar is always visible
    ensureStatusBarVisible() {
        // Force status bar to stay visible on iOS
        const meta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
        if (meta) {
            meta.setAttribute('content', 'default'); // Changed from black-translucent to default
        }
        
        // Ensure safe area is respected
        const rootStyle = document.createElement('style');
        rootStyle.textContent = `
            /* Copyright (C) The Greek Directory, 2025-present. All rights reserved. */
            :root {
                --status-bar-height: env(safe-area-inset-top, 0px);
            }
            
            body.pwa-mode {
                padding-top: max(env(safe-area-inset-top, 0px), 20px) !important;
            }
            
            .pwa-safe-content {
                padding-top: 0 !important;
                margin-top: 0 !important;
            }
        `;
        document.head.appendChild(rootStyle);
    }
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/service-worker.js');
                console.log('Service Worker registered:', registration);
                
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            this.notifyUpdate();
                        }
                    });
                });
            } catch (error) {
                console.error('Service Worker registration failed:', error);
            }
        }
    }
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    checkForUpdates() {
        const savedVersion = localStorage.getItem('tgd_app_version');
        if (savedVersion && savedVersion !== this.currentVersion) {
            localStorage.setItem('tgd_update_available', 'true');
        }
        localStorage.setItem('tgd_app_version', this.currentVersion);
    }
    
    notifyUpdate() {
        localStorage.setItem('tgd_update_available', 'true');
        this.showToast('New update available! Check Settings to update.');
        
        // Update dock badge
        this.updateDockBadge();
    }
    
    // NEW: Update dock badge for settings icon
    updateDockBadge() {
        const settingsIcons = document.querySelectorAll('[data-page="settings"] .pwa-dock-icon, [href="/settings.html"] .pwa-dock-icon, [href="/settings.html"] .pwa-dock-more-icon');
        settingsIcons.forEach(icon => {
            if (!icon.querySelector('.update-badge')) {
                const badge = document.createElement('span');
                badge.className = 'update-badge';
                icon.style.position = 'relative';
                icon.appendChild(badge);
            }
        });
    }
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    showSplashScreen() {
        const splashSeen = localStorage.getItem('tgd_splash_seen');
        
        if (!splashSeen) {
            const splash = document.createElement('div');
            splash.className = 'pwa-splash';
            splash.innerHTML = `
                <picture>
                    <source srcset="https://static.thegreekdirectory.org/img/logo/white.svg" media="(prefers-color-scheme: dark)">
                    <img src="https://static.thegreekdirectory.org/img/logo/blue.svg" alt="The Greek Directory" class="pwa-splash-logo">
                </picture>
            `;
            document.body.appendChild(splash);
            
            setTimeout(() => {
                splash.classList.add('fade-out');
                setTimeout(() => {
                    splash.remove();
                }, 500);
            }, 1000);
            
            localStorage.setItem('tgd_splash_seen', 'true');
        }
    }
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    checkRestrictedPages() {
        const path = window.location.pathname;
        const restrictedPages = ['/starred.html', '/settings.html', '/map.html'];
        
        if (restrictedPages.includes(path) && !this.isStandalone) {
            window.location.href = '/404.html';
        }
    }
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    setupExternalLinks() {
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[data-external], a.external-link, a[target="_blank"]');
            
            if (link && this.isStandalone) {
                e.preventDefault();
                const url = link.href;
                
                if (window.open(url, '_blank', 'noopener,noreferrer')) {
                    console.log('Opened external link:', url);
                } else {
                    window.location.href = url;
                }
            }
        });
    }
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    // FIXED: Theme switching using body classes
    applyTheme() {
        const theme = localStorage.getItem('tgd_theme') || 'system';
        
        document.body.classList.remove('theme-light', 'theme-dark');
        
        if (theme === 'system') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.body.classList.add(prefersDark ? 'theme-dark' : 'theme-light');
        } else {
            document.body.classList.add(`theme-${theme}`);
        }
        
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            const currentTheme = localStorage.getItem('tgd_theme') || 'system';
            if (currentTheme === 'system') {
                document.body.classList.remove('theme-light', 'theme-dark');
                document.body.classList.add(e.matches ? 'theme-dark' : 'theme-light');
            }
        });
    }
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    showToast(message, duration = 3000) {
        const toast = document.createElement('div');
        toast.className = 'pwa-toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 100);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    async share(data) {
        if (navigator.share) {
            try {
                await navigator.share(data);
                return true;
            } catch (error) {
                if (error.name !== 'AbortError') {
                    return this.fallbackShare(data);
                }
            }
        } else {
            return this.fallbackShare(data);
        }
    }
    
    async fallbackShare(data) {
        try {
            await navigator.clipboard.writeText(data.url || data.text);
            this.showToast('Copied to clipboard');
            return true;
        } catch (error) {
            console.error('Share failed:', error);
            return false;
        }
    }
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    async resetApp() {
        localStorage.removeItem('tgd_theme');
        localStorage.removeItem('tgd_language');
        localStorage.removeItem('tgd_splash_seen');
        localStorage.removeItem('tgd_dock_apps');
        localStorage.removeItem('tgd_update_available');
        
        if (window.PWAStorage) {
            await window.PWAStorage.clearAll();
        }
        
        if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (const registration of registrations) {
                await registration.unregister();
            }
        }
        
        if ('caches' in window) {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map(name => caches.delete(name)));
        }
        
        this.showToast('App reset successfully');
        
        setTimeout(() => {
            window.location.href = '/index.html';
        }, 1000);
    }
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    async hardRefresh() {
        const starredBackup = [];
        const themeBackup = localStorage.getItem('tgd_theme');
        const languageBackup = localStorage.getItem('tgd_language');
        const dockBackup = localStorage.getItem('tgd_dock_apps');
        
        if (window.PWAStorage) {
            try {
                await window.PWAStorage.init();
                const starred = await window.PWAStorage.getAllStarred();
                starredBackup.push(...starred);
            } catch (error) {
                console.error('Error backing up starred listings:', error);
            }
        }
        
        if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (const registration of registrations) {
                await registration.unregister();
            }
        }
        
        if ('caches' in window) {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map(name => caches.delete(name)));
        }
        
        localStorage.clear();
        
        if (themeBackup) localStorage.setItem('tgd_theme', themeBackup);
        if (languageBackup) localStorage.setItem('tgd_language', languageBackup);
        if (dockBackup) localStorage.setItem('tgd_dock_apps', dockBackup);
        
        if (window.PWAStorage && starredBackup.length > 0) {
            try {
                await window.PWAStorage.init();
                for (const listing of starredBackup) {
                    await window.PWAStorage.addStarred(listing);
                }
            } catch (error) {
                console.error('Error restoring starred listings:', error);
            }
        }
        
        this.showToast('Cache cleared! Reloading...');
        
        setTimeout(() => {
            window.location.reload(true);
        }, 1000);
    }
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    setupInstallPrompt() {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
        });
    }
    
    async promptInstall() {
        if (!this.deferredPrompt) return false;
        
        this.deferredPrompt.prompt();
        const result = await this.deferredPrompt.choiceResult;
        
        if (result.outcome === 'accepted') {
            console.log('User accepted install prompt');
        }
        
        this.deferredPrompt = null;
        return result.outcome === 'accepted';
    }
}

// Copyright (C) The Greek Directory, 2025-present. All rights reserved.

const pwaApp = new PWAApp();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => pwaApp.init());
} else {
    pwaApp.init();
}

window.PWAApp = pwaApp;

// Copyright (C) The Greek Directory, 2025-present. All rights reserved. This source code is proprietary and no part may not be used, reproduced, or distributed without written permission from The Greek Directory. For more information, visit https://thegreekdirectory.org/legal.
