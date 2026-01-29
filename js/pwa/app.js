// js/pwa/app.js
// Copyright (C) The Greek Directory, 2025-present. All rights reserved. This source code is proprietary and no part may not be used, reproduced, or distributed without written permission from The Greek Directory. For more information, visit https://thegreekdirectory.org/legal.

// ============================================
// PWA APP CORE
// Main app initialization and utilities
// ============================================

// Copyright (C) The Greek Directory, 2025-present. All rights reserved.

class PWAApp {
    constructor() {
        this.isStandalone = this.checkStandalone();
        this.hasSeenSplash = localStorage.getItem('tgd_splash_seen') === 'true';
        this.theme = localStorage.getItem('tgd_theme') || 'system';
        this.language = localStorage.getItem('tgd_language') || 'en';
    }
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    checkStandalone() {
        return (
            window.matchMedia('(display-mode: standalone)').matches ||
            window.navigator.standalone === true ||
            document.referrer.includes('android-app://')
        );
    }
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    async init() {
        console.log('🚀 PWA App initializing...');
        console.log('Standalone mode:', this.isStandalone);
        
        // Register service worker
        await this.registerServiceWorker();
        
        // Apply theme
        this.applyTheme();
        
        // Apply language
        this.applyLanguage();
        
        // Show splash screen on first launch
        if (this.isStandalone && !this.hasSeenSplash) {
            await this.showSplashScreen();
        }
        
        // Initialize PWA mode
        if (this.isStandalone) {
            document.body.classList.add('pwa-mode');
        }
        
        // Redirect restricted pages if not in standalone mode
        this.checkRestrictedPages();
        
        // Setup external link handler
        this.setupExternalLinks();
        
        // Setup install prompt
        this.setupInstallPrompt();
        
        console.log('✅ PWA App initialized');
    }
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/service-worker.js');
                console.log('Service Worker registered:', registration.scope);
                
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            console.log('New service worker available');
                            this.showUpdateNotification();
                        }
                    });
                });
            } catch (error) {
                console.error('Service Worker registration failed:', error);
            }
        }
    }
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    async showSplashScreen() {
        return new Promise((resolve) => {
            const splash = document.createElement('div');
            splash.className = 'pwa-splash';
            splash.innerHTML = `
                <img src="https://static.thegreekdirectory.org/img/logo/blue.svg" 
                     alt="The Greek Directory" 
                     class="pwa-splash-logo">
            `;
            document.body.appendChild(splash);
            
            setTimeout(() => {
                splash.classList.add('fade-out');
                setTimeout(() => {
                    document.body.removeChild(splash);
                    localStorage.setItem('tgd_splash_seen', 'true');
                    resolve();
                }, 500);
            }, 1000);
        });
    }
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    checkRestrictedPages() {
        const path = window.location.pathname;
        const restrictedPages = ['/starred.html', '/settings.html'];
        
        if (restrictedPages.some(page => path.includes(page)) && !this.isStandalone) {
            window.location.href = '/404.html';
        }
    }
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    setupExternalLinks() {
        document.addEventListener('click', (e) => {
            let target = e.target;
            
            // Find the link element (could be nested)
            while (target && target.tagName !== 'A') {
                target = target.parentElement;
            }
            
            if (!target || target.tagName !== 'A') return;
            
            const href = target.getAttribute('href');
            const isExternal = target.hasAttribute('data-external') || 
                             target.classList.contains('external-link') ||
                             target.getAttribute('target') === '_blank';
            
            if (isExternal && this.isStandalone && href) {
                e.preventDefault();
                this.openExternal(href);
            }
        });
    }
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    openExternal(url) {
        // Try to open in system browser
        const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
        
        // iOS fallback
        if (!newWindow && /iPhone|iPad|iPod/.test(navigator.userAgent)) {
            window.location.href = url;
        }
    }
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    applyTheme() {
        const root = document.documentElement;
        
        if (this.theme === 'system') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        } else {
            root.setAttribute('data-theme', this.theme);
        }
    }
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    setTheme(theme) {
        this.theme = theme;
        localStorage.setItem('tgd_theme', theme);
        this.applyTheme();
    }
    
    applyLanguage() {
        document.documentElement.lang = this.language;
        // Language implementation would go here
    }
    
    setLanguage(language) {
        this.language = language;
        localStorage.setItem('tgd_language', language);
        this.applyLanguage();
        // Reload page to apply translations
        window.location.reload();
    }
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    showToast(message, duration = 3000) {
        const toast = document.createElement('div');
        toast.className = 'pwa-toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
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
                    console.error('Share failed:', error);
                }
                return false;
            }
        } else {
            // Fallback: copy to clipboard
            try {
                await navigator.clipboard.writeText(data.url || data.text);
                this.showToast('Copied to clipboard');
                return true;
            } catch (error) {
                console.error('Clipboard failed:', error);
                return false;
            }
        }
    }
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    resetApp() {
        if (confirm('Are you sure you want to reset the app? This will clear all starred listings and preferences.')) {
            // Clear localStorage
            localStorage.removeItem('tgd_theme');
            localStorage.removeItem('tgd_language');
            localStorage.removeItem('tgd_splash_seen');
            
            // Clear IndexedDB
            if (window.PWAStorage) {
                window.PWAStorage.clearAll().then(() => {
                    this.showToast('App reset successfully');
                    setTimeout(() => {
                        window.location.href = '/index.html';
                    }, 1000);
                });
            } else {
                this.showToast('App reset successfully');
                setTimeout(() => {
                    window.location.href = '/index.html';
                }, 1000);
            }
        }
    }
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    setupInstallPrompt() {
        let deferredPrompt;
        
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            
            // Show custom install UI if not already installed
            if (!this.isStandalone) {
                this.showInstallPrompt(deferredPrompt);
            }
        });
        
        window.addEventListener('appinstalled', () => {
            console.log('PWA installed');
            deferredPrompt = null;
        });
    }
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    showInstallPrompt(deferredPrompt) {
        // Don't show if user dismissed it before
        if (localStorage.getItem('tgd_install_dismissed') === 'true') return;
        
        const prompt = document.createElement('div');
        prompt.className = 'pwa-install-prompt';
        prompt.innerHTML = `
            <div class="pwa-install-content">
                <div class="pwa-install-icon">
                    <img src="https://static.thegreekdirectory.org/img/logo/blue.svg" alt="TGD">
                </div>
                <div class="pwa-install-text">
                    <h3>Install The Greek Directory</h3>
                    <p>Install our app for a better experience</p>
                </div>
            </div>
            <div class="pwa-install-actions">
                <button class="pwa-install-btn pwa-install-btn-primary" id="installBtn">Install</button>
                <button class="pwa-install-btn pwa-install-btn-secondary" id="dismissBtn">Not Now</button>
            </div>
        `;
        
        document.body.appendChild(prompt);
        setTimeout(() => prompt.classList.add('show'), 10);
        
        document.getElementById('installBtn').addEventListener('click', async () => {
            prompt.classList.remove('show');
            setTimeout(() => document.body.removeChild(prompt), 300);
            
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                console.log('Install outcome:', outcome);
            }
        });
        
        document.getElementById('dismissBtn').addEventListener('click', () => {
            prompt.classList.remove('show');
            setTimeout(() => document.body.removeChild(prompt), 300);
            localStorage.setItem('tgd_install_dismissed', 'true');
        });
    }
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    showUpdateNotification() {
        if (confirm('A new version is available. Reload to update?')) {
            window.location.reload();
        }
    }
}

// Copyright (C) The Greek Directory, 2025-present. All rights reserved.

// Initialize app
const pwaApp = new PWAApp();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => pwaApp.init());
} else {
    pwaApp.init();
}

window.PWAApp = pwaApp;

// Copyright (C) The Greek Directory, 2025-present. All rights reserved. This source code is proprietary and no part may not be used, reproduced, or distributed without written permission from The Greek Directory. For more information, visit https://thegreekdirectory.org/legal.
