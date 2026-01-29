// js/pwa/app.js (COMPLETE REPLACEMENT)
// Copyright (C) The Greek Directory, 2025-present. All rights reserved. This source code is proprietary and no part may not be used, reproduced, or distributed without written permission from The Greek Directory. For more information, visit https://thegreekdirectory.org/legal.

// ============================================
// PWA APP MANAGER
// Main PWA functionality and initialization
// ============================================

// Copyright (C) The Greek Directory, 2025-present. All rights reserved.

class PWAApp {
    constructor() {
        this.isStandalone = false;
        this.deferredPrompt = null;
        this.currentVersion = '1.0.1';
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
        }
        
        this.setupExternalLinks();
        this.applyTheme();
        this.setupInstallPrompt();
        this.preventLinkPreviews();
    }
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    checkStandalone() {
        // Check multiple methods for cross-platform compatibility
        const mediaQuery = window.matchMedia('(display-mode: standalone)');
        const iosStandalone = window.navigator.standalone === true;
        const androidReferrer = document.referrer.includes('android-app://');
        
        this.isStandalone = mediaQuery.matches || iosStandalone || androidReferrer;
        
        console.log('Standalone mode:', this.isStandalone);
    }
    
    applyPWAMode() {
        if (this.isStandalone) {
            document.body.classList.add('pwa-mode');
            
            // Add safe content wrapper
            const main = document.querySelector('main') || document.body;
            if (!main.classList.contains('pwa-safe-content')) {
                main.classList.add('pwa-safe-content');
            }
        }
    }
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    preventLinkPreviews() {
        // Prevent long-press link preview on all links except dock
        document.addEventListener('touchstart', (e) => {
            const target = e.target.closest('a');
            if (target && !target.classList.contains('pwa-dock-item')) {
                e.preventDefault();
            }
        }, { passive: false });
        
        // Prevent context menu on links
        document.addEventListener('contextmenu', (e) => {
            const target = e.target.closest('a');
            if (target && !target.classList.contains('pwa-dock-item')) {
                e.preventDefault();
            }
        });
    }
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/service-worker.js');
                console.log('Service Worker registered:', registration);
                
                // Check for updates
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
        const restrictedPages = ['/starred.html', '/settings.html'];
        
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
                
                // Try to open in system browser
                if (window.open(url, '_blank', 'noopener,noreferrer')) {
                    console.log('Opened external link:', url);
                } else {
                    // Fallback for iOS
                    window.location.href = url;
                }
            }
        });
    }
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    applyTheme() {
        const theme = localStorage.getItem('tgd_theme') || 'system';
        const root = document.documentElement;
        
        if (theme === 'system') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        } else {
            root.setAttribute('data-theme', theme);
        }
        
        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (theme === 'system') {
                root.setAttribute('data-theme', e.matches ? 'dark' : 'light');
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
        // Clear localStorage
        localStorage.removeItem('tgd_theme');
        localStorage.removeItem('tgd_language');
        localStorage.removeItem('tgd_splash_seen');
        localStorage.removeItem('tgd_dock_apps');
        localStorage.removeItem('tgd_update_available');
        
        // Clear IndexedDB
        if (window.PWAStorage) {
            await window.PWAStorage.clearAll();
        }
        
        // Unregister service worker
        if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (const registration of registrations) {
                await registration.unregister();
            }
        }
        
        // Clear caches
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
