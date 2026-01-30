// js/pwa/settings.js (COMPLETE WITH DOCK AUTO-HIDE AND FIXED SOCIAL LINKS)
// Copyright (C) The Greek Directory, 2025-present. All rights reserved. This source code is proprietary and no part may not be used, reproduced, or distributed without written permission from The Greek Directory. For more information, visit https://thegreekdirectory.org/legal.

// ============================================
// PWA SETTINGS MANAGER - COMPLETE WITH DOCK BEHAVIOR
// Copyright (C) The Greek Directory, 2025-present. All rights reserved.
// ============================================

class SettingsManager {
    constructor() {
        this.app = window.PWAApp;
        this.dockManager = null;
    }
    
    init() {
        this.dockManager = window.pwaDock;
        this.renderSettings();
        this.setupEventListeners();
    }
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    renderSettings() {
        const container = document.getElementById('settingsContainer');
        if (!container) return;
        
        const currentTheme = localStorage.getItem('tgd_theme') || 'system';
        const currentLanguage = localStorage.getItem('tgd_language') || 'en';
        const updateAvailable = localStorage.getItem('tgd_update_available') === 'true';
        const dockAutoHide = localStorage.getItem('tgd_dock_autohide') === 'true';
        
        container.innerHTML = `
            <div class="max-w-2xl mx-auto">
                <h1 class="text-3xl font-bold text-gray-900 mb-6">Settings</h1>
                
                ${updateAvailable ? `
                <div class="update-banner">
                    <h2>🎉 New Update Available!</h2>
                    <p>Version ${this.app?.currentVersion || '1.0.1'} is ready to install. Update now to get the latest features and improvements.</p>
                    <button onclick="settingsManager.installUpdate()">Update Now</button>
                </div>
                ` : ''}
                
                <!-- Copyright (C) The Greek Directory, 2025-present. All rights reserved. -->
                
                <!-- Dock Customization Section -->
                <div class="bg-white rounded-lg p-6 shadow-sm mb-6">
                    <h2 class="text-xl font-bold text-gray-900 mb-4">Dock Apps</h2>
                    <p class="text-sm text-gray-600 mb-4">Customize which apps appear in your dock and their order. Home and Settings are required.</p>
                    <div id="dockCustomization" class="space-y-3"></div>
                </div>
                
                <!-- Dock Behavior Section -->
                <div class="bg-white rounded-lg p-6 shadow-sm mb-6">
                    <h2 class="text-xl font-bold text-gray-900 mb-4">Dock Behavior</h2>
                    <p class="text-sm text-gray-600 mb-4">Choose how the dock behaves when you scroll</p>
                    <div class="space-y-3">
                        <label class="flex items-center justify-between cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors border-2 ${!dockAutoHide ? 'border-blue-500 bg-blue-50' : 'border-transparent'}">
                            <div>
                                <span class="text-gray-700 font-medium block">Always Visible</span>
                                <span class="text-xs text-gray-500">Dock stays at the bottom at all times</span>
                            </div>
                            <input type="radio" name="dockBehavior" value="cemented" ${!dockAutoHide ? 'checked' : ''} class="w-5 h-5 text-blue-600">
                        </label>
                        <label class="flex items-center justify-between cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors border-2 ${dockAutoHide ? 'border-blue-500 bg-blue-50' : 'border-transparent'}">
                            <div>
                                <span class="text-gray-700 font-medium block">Auto-Hide</span>
                                <span class="text-xs text-gray-500">Dock hides when scrolling down, shows when scrolling up</span>
                            </div>
                            <input type="radio" name="dockBehavior" value="autohide" ${dockAutoHide ? 'checked' : ''} class="w-5 h-5 text-blue-600">
                        </label>
                    </div>
                </div>
                
                <!-- Copyright (C) The Greek Directory, 2025-present. All rights reserved. -->
                
                <!-- Appearance Section -->
                <div class="bg-white rounded-lg p-6 shadow-sm mb-6">
                    <h2 class="text-xl font-bold text-gray-900 mb-4">Appearance</h2>
                    <div class="space-y-3">
                        <label class="flex items-center justify-between cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors border-2 ${currentTheme === 'system' ? 'border-blue-500 bg-blue-50' : 'border-transparent'}">
                            <span class="text-gray-700 font-medium">System Default</span>
                            <input type="radio" name="theme" value="system" ${currentTheme === 'system' ? 'checked' : ''} class="w-5 h-5 text-blue-600">
                        </label>
                        <label class="flex items-center justify-between cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors border-2 ${currentTheme === 'light' ? 'border-blue-500 bg-blue-50' : 'border-transparent'}">
                            <span class="text-gray-700 font-medium">Light Mode</span>
                            <input type="radio" name="theme" value="light" ${currentTheme === 'light' ? 'checked' : ''} class="w-5 h-5 text-blue-600">
                        </label>
                        <label class="flex items-center justify-between cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors border-2 ${currentTheme === 'dark' ? 'border-blue-500 bg-blue-50' : 'border-transparent'}">
                            <span class="text-gray-700 font-medium">Dark Mode</span>
                            <input type="radio" name="theme" value="dark" ${currentTheme === 'dark' ? 'checked' : ''} class="w-5 h-5 text-blue-600">
                        </label>
                    </div>
                </div>
                
                <!-- Copyright (C) The Greek Directory, 2025-present. All rights reserved. -->
                
                <!-- Language Section -->
                <div class="bg-white rounded-lg p-6 shadow-sm mb-6">
                    <h2 class="text-xl font-bold text-gray-900 mb-4">Language</h2>
                    <div class="space-y-3">
                        <label class="flex items-center justify-between cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors border-2 ${currentLanguage === 'en' ? 'border-blue-500 bg-blue-50' : 'border-transparent'}">
                            <span class="text-gray-700 font-medium">English (US)</span>
                            <input type="radio" name="language" value="en" ${currentLanguage === 'en' ? 'checked' : ''} class="w-5 h-5 text-blue-600">
                        </label>
                        <label class="flex items-center justify-between cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors border-2 ${currentLanguage === 'el' ? 'border-blue-500 bg-blue-50' : 'border-transparent'}">
                            <span class="text-gray-700 font-medium">Ελληνικά (Greek)</span>
                            <input type="radio" name="language" value="el" ${currentLanguage === 'el' ? 'checked' : ''} class="w-5 h-5 text-blue-600">
                        </label>
                    </div>
                </div>
                
                <!-- Copyright (C) The Greek Directory, 2025-present. All rights reserved. -->
                
                <!-- Social Media Section -->
                <div class="bg-white rounded-lg p-6 shadow-sm mb-6">
                    <h2 class="text-xl font-bold text-gray-900 mb-4">Follow Us</h2>
                    <p class="text-sm text-gray-600 mb-4">Stay updated with the latest Greek business listings and community news</p>
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <a href="https://facebook.com/thegreekdirectory" target="_blank" rel="noopener noreferrer" data-external class="flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-white font-semibold transition-transform hover:scale-105" style="background-color: #1877F2;">
                            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                            <span class="hidden sm:inline">Facebook</span>
                        </a>
                        <a href="https://instagram.com/thegreekdirectory" target="_blank" rel="noopener noreferrer" data-external class="flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-white font-semibold transition-transform hover:scale-105" style="background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%);">
                            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                            <span class="hidden sm:inline">Instagram</span>
                        </a>
                        <a href="https://youtube.com/@thegreekdirectory" target="_blank" rel="noopener noreferrer" data-external class="flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-white font-semibold transition-transform hover:scale-105" style="background-color: #FF0000;">
                            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                            <span class="hidden sm:inline">YouTube</span>
                        </a>
                    </div>
                </div>
                
                <!-- Copyright (C) The Greek Directory, 2025-present. All rights reserved. -->
                
                <!-- Links Section -->
                <div class="bg-white rounded-lg p-6 shadow-sm mb-6">
                    <h2 class="text-xl font-bold text-gray-900 mb-4">Help & Support</h2>
                    <div class="space-y-3">
                        <a href="https://support.thegreekdirectory.org" target="_blank" rel="noopener noreferrer" data-external class="external-link flex items-center justify-between py-3 px-3 rounded-lg hover:bg-gray-50 text-gray-700 hover:text-blue-600 transition-colors">
                            <span>Support</span>
                            <span>→</span>
                        </a>
                        <a href="https://thegreekdirectory.org/contact" target="_blank" rel="noopener noreferrer" data-external class="external-link flex items-center justify-between py-3 px-3 rounded-lg hover:bg-gray-50 text-gray-700 hover:text-blue-600 transition-colors">
                            <span>Contact</span>
                            <span>→</span>
                        </a>
                        <a href="https://thegreekdirectory.org/legal" target="_blank" rel="noopener noreferrer" data-external class="external-link flex items-center justify-between py-3 px-3 rounded-lg hover:bg-gray-50 text-gray-700 hover:text-blue-600 transition-colors">
                            <span>Legal</span>
                            <span>→</span>
                        </a>
                        <a href="https://thegreekdirectory.org" target="_blank" rel="noopener noreferrer" data-external class="external-link flex items-center justify-between py-3 px-3 rounded-lg hover:bg-gray-50 text-gray-700 hover:text-blue-600 transition-colors">
                            <span>Open Website</span>
                            <span>→</span>
                        </a>
                    </div>
                </div>
                
                <!-- Copyright (C) The Greek Directory, 2025-present. All rights reserved. -->
                
                <!-- Actions Section -->
                <div class="bg-white rounded-lg p-6 shadow-sm mb-6">
                    <h2 class="text-xl font-bold text-gray-900 mb-4">Actions</h2>
                    <button id="shareAppBtn" class="w-full mb-3 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold">
                        Share App
                    </button>
                    <button id="hardRefreshBtn" class="w-full mb-3 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold">
                        Clear Cache & Reload
                    </button>
                    <button id="resetAppBtn" class="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold">
                        Reset App
                    </button>
                </div>
                
                <!-- App Info -->
                <div class="text-center text-sm text-gray-500 mb-24">
                    <p>The Greek Directory</p>
                    <p>Version ${this.app?.currentVersion || '1.0.1'}</p>
                    <p class="mt-2">© 2025 The Greek Directory</p>
                </div>
            </div>
        `;
        
        this.renderDockCustomization();
    }
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    renderDockCustomization() {
        const container = document.getElementById('dockCustomization');
        if (!container || !this.dockManager) return;
        
        const dockApps = this.dockManager.getDockApps();
        const availableApps = this.dockManager.getAvailableApps();
        
        container.innerHTML = `
            <div class="space-y-2" id="dockAppsList">
                ${dockApps.map((app, index) => `
                    <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg" data-app-id="${app.id}">
                        <div class="flex flex-col gap-1">
                            <button class="text-gray-400 hover:text-gray-600 ${index === 0 ? 'invisible' : ''}" onclick="settingsManager.moveDockApp('${app.id}', 'up')">▲</button>
                            <button class="text-gray-400 hover:text-gray-600 ${index === dockApps.length - 1 ? 'invisible' : ''}" onclick="settingsManager.moveDockApp('${app.id}', 'down')">▼</button>
                        </div>
                        <div class="text-2xl">${app.icon}</div>
                        <div class="flex-1">
                            <div class="font-semibold text-gray-900">${app.label}</div>
                        </div>
                        ${!app.required ? `
                            <button onclick="settingsManager.removeDockApp('${app.id}')" class="text-red-600 hover:text-red-700 px-3 py-1 rounded">
                                Remove
                            </button>
                        ` : `
                            <span class="text-xs text-gray-500 px-3 py-1">Required</span>
                        `}
                    </div>
                `).join('')}
            </div>
            
            ${availableApps.filter(app => !dockApps.find(d => d.id === app.id)).length > 0 ? `
                <div class="mt-4 pt-4 border-t border-gray-200">
                    <h3 class="text-sm font-semibold text-gray-700 mb-2">Available Apps</h3>
                    <div class="space-y-2">
                        ${availableApps.filter(app => !dockApps.find(d => d.id === app.id)).map(app => `
                            <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                <div class="text-2xl">${app.icon}</div>
                                <div class="flex-1">
                                    <div class="font-semibold text-gray-900">${app.label}</div>
                                </div>
                                <button onclick="settingsManager.addDockApp('${app.id}')" class="text-blue-600 hover:text-blue-700 px-3 py-1 rounded font-semibold">
                                    Add
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        `;
    }
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    moveDockApp(appId, direction) {
        if (this.dockManager) {
            this.dockManager.moveDockApp(appId, direction);
            this.renderDockCustomization();
        }
    }
    
    addDockApp(appId) {
        if (this.dockManager) {
            this.dockManager.addDockApp(appId);
            this.renderDockCustomization();
        }
    }
    
    removeDockApp(appId) {
        if (this.dockManager) {
            this.dockManager.removeDockApp(appId);
            this.renderDockCustomization();
        }
    }
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    setupEventListeners() {
        // Dock behavior selection
        document.querySelectorAll('input[name="dockBehavior"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const autoHide = e.target.value === 'autohide';
                
                if (this.dockManager) {
                    this.dockManager.setAutoHide(autoHide);
                }
                
                document.querySelectorAll('input[name="dockBehavior"]').forEach(r => {
                    const label = r.closest('label');
                    if (r.checked) {
                        label.classList.add('border-blue-500', 'bg-blue-50');
                    } else {
                        label.classList.remove('border-blue-500', 'bg-blue-50');
                    }
                });
                
                if (window.PWAApp) {
                    window.PWAApp.showToast(autoHide ? 'Dock will auto-hide' : 'Dock will stay visible');
                }
            });
        });
        
        // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
        
        // Theme selection
        document.querySelectorAll('input[name="theme"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const theme = e.target.value;
                localStorage.setItem('tgd_theme', theme);
                this.applyTheme(theme);
                
                document.querySelectorAll('input[name="theme"]').forEach(r => {
                    const label = r.closest('label');
                    if (r.checked) {
                        label.classList.add('border-blue-500', 'bg-blue-50');
                    } else {
                        label.classList.remove('border-blue-500', 'bg-blue-50');
                    }
                });
                
                if (window.PWAApp) {
                    window.PWAApp.showToast('Theme updated');
                }
            });
        });
        
        // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
        
        // Language selection
        document.querySelectorAll('input[name="language"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const language = e.target.value;
                localStorage.setItem('tgd_language', language);
                
                document.querySelectorAll('input[name="language"]').forEach(r => {
                    const label = r.closest('label');
                    if (r.checked) {
                        label.classList.add('border-blue-500', 'bg-blue-50');
                    } else {
                        label.classList.remove('border-blue-500', 'bg-blue-50');
                    }
                });
                
                if (window.PWAApp) {
                    window.PWAApp.showToast('Language updated - Reload to apply');
                }
            });
        });
        
        // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
        
        // Share app button
        const shareBtn = document.getElementById('shareAppBtn');
        if (shareBtn) {
            shareBtn.addEventListener('click', async () => {
                const shareData = {
                    title: 'The Greek Directory',
                    text: 'Download The Greek Directory to find Greek-owned businesses near you!',
                    url: 'https://app.thegreekdirectory.org'
                };
                
                if (navigator.share) {
                    try {
                        await navigator.share(shareData);
                    } catch (error) {
                        if (error.name !== 'AbortError') {
                            this.fallbackShare(shareData);
                        }
                    }
                } else {
                    this.fallbackShare(shareData);
                }
            });
        }
        
        // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
        
        // Hard refresh button
        const hardRefreshBtn = document.getElementById('hardRefreshBtn');
        if (hardRefreshBtn) {
            hardRefreshBtn.addEventListener('click', async () => {
                if (confirm('This will clear all cached data and reload the app. Your starred listings and settings will be preserved. Continue?')) {
                    if (window.PWAApp && window.PWAApp.hardRefresh) {
                        await window.PWAApp.hardRefresh();
                    }
                }
            });
        }
        
        // Reset app button
        const resetBtn = document.getElementById('resetAppBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetApp();
            });
        }
    }
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    applyTheme(theme) {
        if (window.PWAApp && window.PWAApp.applyTheme) {
            window.PWAApp.applyTheme();
        }
    }
    
    async fallbackShare(data) {
        try {
            await navigator.clipboard.writeText(data.url || data.text);
            if (window.PWAApp) {
                window.PWAApp.showToast('Copied to clipboard');
            }
        } catch (error) {
            console.error('Share failed:', error);
        }
    }
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    installUpdate() {
        localStorage.removeItem('tgd_update_available');
        if (window.PWAApp) {
            window.PWAApp.showToast('Updating app...');
        }
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    }
    
    resetApp() {
        if (confirm('Are you sure you want to reset the app? This will clear all starred listings, preferences, and dock customizations.')) {
            if (window.PWAApp) {
                window.PWAApp.resetApp();
            }
        }
    }
}

// Copyright (C) The Greek Directory, 2025-present. All rights reserved.

const settingsManager = new SettingsManager();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => settingsManager.init());
} else {
    settingsManager.init();
}

window.settingsManager = settingsManager;

// Copyright (C) The Greek Directory, 2025-present. All rights reserved. This source code is proprietary and no part may not be used, reproduced, or distributed without written permission from The Greek Directory. For more information, visit https://thegreekdirectory.org/legal.
