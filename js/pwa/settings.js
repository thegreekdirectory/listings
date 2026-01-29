// js/pwa/settings.js (COMPLETE REPLACEMENT WITH WORKING THEME + UPDATE BANNER)
// Copyright (C) The Greek Directory, 2025-present. All rights reserved.

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
    
    renderSettings() {
        const container = document.getElementById('settingsContainer');
        if (!container) return;
        
        const currentTheme = localStorage.getItem('tgd_theme') || 'system';
        const currentLanguage = localStorage.getItem('tgd_language') || 'en';
        const updateAvailable = localStorage.getItem('tgd_update_available') === 'true';
        
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
                
                <!-- Dock Customization Section -->
                <div class="bg-white rounded-lg p-6 shadow-sm mb-6">
                    <h2 class="text-xl font-bold text-gray-900 mb-4">Dock Apps</h2>
                    <p class="text-sm text-gray-600 mb-4">Customize which apps appear in your dock and their order. Home and Settings are required.</p>
                    <div id="dockCustomization" class="space-y-3"></div>
                </div>
                
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
                
                <!-- Actions Section -->
                <div class="bg-white rounded-lg p-6 shadow-sm mb-6">
                    <h2 class="text-xl font-bold text-gray-900 mb-4">Actions</h2>
                    <button id="shareAppBtn" class="w-full mb-3 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold">
                        Share App
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
    
    setupEventListeners() {
        // Theme selection with immediate feedback
        document.querySelectorAll('input[name="theme"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const theme = e.target.value;
                localStorage.setItem('tgd_theme', theme);
                this.applyTheme(theme);
                
                // Update UI to show selection
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
        
        // Language selection
        document.querySelectorAll('input[name="language"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const language = e.target.value;
                localStorage.setItem('tgd_language', language);
                
                // Update UI
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
        
        // Reset app button
        const resetBtn = document.getElementById('resetAppBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetApp();
            });
        }
    }
    
    applyTheme(theme) {
        const root = document.documentElement;
        
        if (theme === 'system') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        } else {
            root.setAttribute('data-theme', theme);
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

const settingsManager = new SettingsManager();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => settingsManager.init());
} else {
    settingsManager.init();
}

window.settingsManager = settingsManager;

// Copyright (C) The Greek Directory, 2025-present. All rights reserved.
