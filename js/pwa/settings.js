// js/pwa/settings.js
// Copyright (C) The Greek Directory, 2025-present. All rights reserved. This source code is proprietary and no part may not be used, reproduced, or distributed without written permission from The Greek Directory. For more information, visit https://thegreekdirectory.org/legal.

// ============================================
// PWA SETTINGS MANAGER
// Handles app settings and preferences
// ============================================

// Copyright (C) The Greek Directory, 2025-present. All rights reserved.

class SettingsManager {
    constructor() {
        this.app = window.PWAApp;
    }
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    init() {
        this.renderSettings();
        this.setupEventListeners();
    }
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    renderSettings() {
        const container = document.getElementById('settingsContainer');
        if (!container) return;
        
        const currentTheme = this.app.theme;
        const currentLanguage = this.app.language;
        
        container.innerHTML = `
            <div class="max-w-2xl mx-auto">
                <h1 class="text-3xl font-bold text-gray-900 mb-6">Settings</h1>
                
                <!-- Appearance Section -->
                <div class="bg-white rounded-lg p-6 shadow-sm mb-6">
                    <h2 class="text-xl font-bold text-gray-900 mb-4">Appearance</h2>
                    <div class="space-y-3">
                        <label class="flex items-center justify-between cursor-pointer">
                            <span class="text-gray-700">System Default</span>
                            <input type="radio" name="theme" value="system" ${currentTheme === 'system' ? 'checked' : ''} class="w-5 h-5">
                        </label>
                        <label class="flex items-center justify-between cursor-pointer">
                            <span class="text-gray-700">Light Mode</span>
                            <input type="radio" name="theme" value="light" ${currentTheme === 'light' ? 'checked' : ''} class="w-5 h-5">
                        </label>
                        <label class="flex items-center justify-between cursor-pointer">
                            <span class="text-gray-700">Dark Mode</span>
                            <input type="radio" name="theme" value="dark" ${currentTheme === 'dark' ? 'checked' : ''} class="w-5 h-5">
                        </label>
                    </div>
                </div>
                
                <!-- Language Section -->
                <div class="bg-white rounded-lg p-6 shadow-sm mb-6">
                    <h2 class="text-xl font-bold text-gray-900 mb-4">Language</h2>
                    <div class="space-y-3">
                        <label class="flex items-center justify-between cursor-pointer">
                            <span class="text-gray-700">English (US)</span>
                            <input type="radio" name="language" value="en" ${currentLanguage === 'en' ? 'checked' : ''} class="w-5 h-5">
                        </label>
                        <label class="flex items-center justify-between cursor-pointer">
                            <span class="text-gray-700">Ελληνικά (Greek)</span>
                            <input type="radio" name="language" value="el" ${currentLanguage === 'el' ? 'checked' : ''} class="w-5 h-5">
                        </label>
                    </div>
                </div>
                
                <!-- Links Section -->
                <div class="bg-white rounded-lg p-6 shadow-sm mb-6">
                    <h2 class="text-xl font-bold text-gray-900 mb-4">Help & Support</h2>
                    <div class="space-y-3">
                        <a href="https://support.thegreekdirectory.org" target="_blank" rel="noopener noreferrer" data-external class="external-link flex items-center justify-between py-2 text-gray-700 hover:text-blue-600">
                            <span>Support</span>
                            <span>→</span>
                        </a>
                        <a href="https://thegreekdirectory.org/contact" target="_blank" rel="noopener noreferrer" data-external class="external-link flex items-center justify-between py-2 text-gray-700 hover:text-blue-600">
                            <span>Contact</span>
                            <span>→</span>
                        </a>
                        <a href="https://thegreekdirectory.org/legal" target="_blank" rel="noopener noreferrer" data-external class="external-link flex items-center justify-between py-2 text-gray-700 hover:text-blue-600">
                            <span>Legal</span>
                            <span>→</span>
                        </a>
                        <a href="https://thegreekdirectory.org" target="_blank" rel="noopener noreferrer" data-external class="external-link flex items-center justify-between py-2 text-gray-700 hover:text-blue-600">
                            <span>Open Website</span>
                            <span>→</span>
                        </a>
                    </div>
                </div>
                
                <!-- Actions Section -->
                <div class="bg-white rounded-lg p-6 shadow-sm mb-6">
                    <h2 class="text-xl font-bold text-gray-900 mb-4">Actions</h2>
                    <button id="shareAppBtn" class="w-full mb-3 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        Share App
                    </button>
                    <button id="resetAppBtn" class="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                        Reset App
                    </button>
                </div>
                
                <!-- App Info -->
                <div class="text-center text-sm text-gray-500 mb-24">
                    <p>The Greek Directory</p>
                    <p>Version 1.0.0</p>
                    <p class="mt-2">© 2025 The Greek Directory</p>
                </div>
            </div>
        `;
    }
    
    // Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    
    setupEventListeners() {
        // Theme selection
        document.querySelectorAll('input[name="theme"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.app.setTheme(e.target.value);
                this.app.showToast('Theme updated');
            });
        });
        
        // Language selection
        document.querySelectorAll('input[name="language"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.app.setLanguage(e.target.value);
            });
        });
        
        // Share app button
        const shareBtn = document.getElementById('shareAppBtn');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => {
                this.app.share({
                    title: 'The Greek Directory',
                    text: 'Download The Greek Directory to find Greek-owned businesses near you!',
                    url: 'https://app.thegreekdirectory.org'
                });
            });
        }
        
        // Reset app button
        const resetBtn = document.getElementById('resetAppBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.app.resetApp();
            });
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

// Copyright (C) The Greek Directory, 2025-present. All rights reserved. This source code is proprietary and no part may not be used, reproduced, or distributed without written permission from The Greek Directory. For more information, visit https://thegreekdirectory.org/legal.
