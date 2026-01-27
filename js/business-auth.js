// js/business-auth.js - PART 1
/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
This source code is proprietary and no part may not be used, reproduced, or distributed 
without written permission from The Greek Directory. Unauthorized use, copying, modification, 
or distribution of this code will result in legal action to the fullest extent permitted by law.
*/

// ============================================
// BUSINESS PORTAL AUTHENTICATION - COMPLETE
// Complete authentication handling
// ============================================

const COUNTRY_CODES = {
    'USA': '+1',
    'Greece': '+30',
    'Canada': '+1',
    'UK': '+44',
    'Cyprus': '+357',
    'Australia': '+61'
};

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
*/

let currentUser = null;
let currentListing = null;
let ownerData = null;
let allListings = [];
let userCountry = 'USA';

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Initializing Business Portal...');
    
    await detectUserCountry();
    await checkAuthState();
    
    window.TGDAuth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event);
        if (event === 'SIGNED_IN') {
            await handleAuthSuccess(session);
        } else if (event === 'SIGNED_OUT') {
            showAuthPage();
        } else if (event === 'TOKEN_REFRESHED') {
            console.log('Token refreshed');
        }
    });
});

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
*/

async function detectUserCountry() {
    try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        if (data.country_code === 'US') {
            userCountry = 'USA';
        } else if (data.country_code === 'GR') {
            userCountry = 'Greece';
        } else if (data.country_code === 'CA') {
            userCountry = 'Canada';
        } else if (data.country_code === 'GB') {
            userCountry = 'UK';
        } else if (data.country_code === 'CY') {
            userCountry = 'Cyprus';
        } else if (data.country_code === 'AU') {
            userCountry = 'Australia';
        }
    } catch (error) {
        console.log('Could not detect country, defaulting to USA');
        userCountry = 'USA';
    }
}

async function checkAuthState() {
    console.log('🔍 Checking authentication state...');
    
    const session = await window.TGDAuth.getCurrentSession();
    
    if (session) {
        console.log('✅ User is authenticated');
        currentUser = session.user;
        await handleAuthSuccess(session);
    } else {
        console.log('❌ User not authenticated');
        showAuthPage();
    }
}

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
*/

async function handleAuthSuccess(session) {
    currentUser = session.user;
    
    ownerData = await window.TGDAuth.getBusinessOwnerData();
    
    if (!ownerData || ownerData.length === 0) {
        showError('Could not load business owner data. Please contact support.');
        await window.TGDAuth.signOut();
        showAuthPage();
        return;
    }
    
    await loadListingData();
    
    showDashboard();
}

function showAuthPage() {
    document.getElementById('authPage').classList.remove('hidden');
    document.getElementById('dashboardPage').classList.add('hidden');
}

function showDashboard() {
    document.getElementById('authPage').classList.add('hidden');
    document.getElementById('dashboardPage').classList.remove('hidden');
    renderDashboard();
}

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
*/

function showSignInForm() {
    document.getElementById('signInForm').classList.remove('hidden');
    document.getElementById('signUpForm').classList.add('hidden');
    document.getElementById('forgotPasswordForm').classList.add('hidden');
    clearAuthMessage();
}

function showSignUpForm() {
    document.getElementById('signInForm').classList.add('hidden');
    document.getElementById('signUpForm').classList.remove('hidden');
    document.getElementById('forgotPasswordForm').classList.add('hidden');
    clearAuthMessage();
}

function showForgotPassword() {
    document.getElementById('signInForm').classList.add('hidden');
    document.getElementById('signUpForm').classList.add('hidden');
    document.getElementById('forgotPasswordForm').classList.remove('hidden');
    clearAuthMessage();
}

function showError(message) {
    const msgDiv = document.getElementById('authMessage');
    msgDiv.className = 'error-message';
    msgDiv.textContent = message;
    msgDiv.classList.remove('hidden');
}

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
*/

function showSuccess(message) {
    const msgDiv = document.getElementById('authMessage');
    msgDiv.className = 'success-message';
    msgDiv.textContent = message;
    msgDiv.classList.remove('hidden');
}

function clearAuthMessage() {
    const msgDiv = document.getElementById('authMessage');
    msgDiv.classList.add('hidden');
    msgDiv.textContent = '';
}

async function handleSignIn() {
    const email = document.getElementById('signInEmail').value.trim();
    const password = document.getElementById('signInPassword').value;
    
    if (!email || !password) {
        showError('Please enter both email and password');
        return;
    }
    
    clearAuthMessage();
    const result = await window.TGDAuth.signInBusinessOwner(email, password);
    
    if (result.success) {
        showSuccess('Signing in...');
    } else {
        showError(result.error);
    }
}

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
*/

async function searchListingForSignup() {
    const searchTerm = document.getElementById('signUpListingSearch').value.trim().toLowerCase();
    const resultsDiv = document.getElementById('listingSearchResults');
    
    console.log('Search term:', searchTerm);
    
    if (searchTerm.length < 2) {
        resultsDiv.innerHTML = '';
        document.getElementById('confirmationKeyContainer').classList.add('hidden');
        return;
    }
    
    if (!allListings || allListings.length === 0) {
        try {
            console.log('Loading listings from Supabase...');
            
            const { data, error } = await window.TGDAuth.supabaseClient
                .from('listings')
                .select(`
                    *,
                    owner:business_owners(*)
                `)
                .eq('visible', true)
                .order('business_name');
            
            if (error) throw error;
            
            allListings = data;
            console.log('Loaded listings:', allListings.length);
        } catch (error) {
            console.error('Error loading listings:', error);
            resultsDiv.innerHTML = '<p class="text-sm text-red-500 p-2">Error loading listings. Please try again.</p>';
            return;
        }
    }
    
    const matches = allListings.filter(l => 
        l.business_name.toLowerCase().includes(searchTerm) ||
        (l.id && l.id.toString().includes(searchTerm))
    ).slice(0, 5);
    
    console.log('Matches found:', matches.length);
    
    if (matches.length === 0) {
        resultsDiv.innerHTML = '<p class="text-sm text-gray-500 p-2">No listings found</p>';
        document.getElementById('confirmationKeyContainer').classList.add('hidden');
        return;
    }
    
    /*
    Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    */
    
    resultsDiv.innerHTML = matches.map(l => {
        const owner = l.owner && l.owner.length > 0 ? l.owner[0] : null;
        const isClaimed = l.is_claimed === true;
        const hasKey = owner && owner.confirmation_key;
        
        return `
        <div class="p-2 hover:bg-gray-100 cursor-pointer rounded ${isClaimed ? 'opacity-50' : ''}" 
             onclick="${isClaimed ? '' : `selectListing('${l.id}', '${l.business_name.replace(/'/g, "\\'")}', ${hasKey})`}">
            <div class="font-medium">${l.business_name}</div>
            <div class="text-xs text-gray-500">
                ID: ${l.id} • ${l.city}, ${l.state}
                ${isClaimed ? ' • <span class="text-red-600">Already Claimed</span>' : ''}
            </div>
        </div>
    `}).join('');
}

function selectListing(listingId, businessName, hasConfirmationKey) {
    document.getElementById('signUpListingId').value = listingId;
    document.getElementById('signUpListingSearch').value = businessName;
    document.getElementById('listingSearchResults').innerHTML = '';
    
    const confirmationKeyContainer = document.getElementById('confirmationKeyContainer');
    if (hasConfirmationKey) {
        confirmationKeyContainer.classList.remove('hidden');
    } else {
        confirmationKeyContainer.classList.add('hidden');
    }
}

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
*/

async function handleSignUp() {
    const listingId = document.getElementById('signUpListingId').value;
    const email = document.getElementById('signUpEmail').value.trim();
    const phone = document.getElementById('signUpPhone').value.trim();
    const password = document.getElementById('signUpPassword').value;
    const confirmPassword = document.getElementById('signUpPasswordConfirm').value;
    const confirmationKey = document.getElementById('signUpConfirmationKey')?.value.trim();
    const agreeTerms = document.getElementById('agreeTerms').checked;
    
    if (!listingId) {
        showError('Please search and select your business listing');
        return;
    }
    
    if (!email) {
        showError('Please enter your business email');
        return;
    }
    
    if (!password || password.length < 6) {
        showError('Password must be at least 6 characters');
        return;
    }
    
    if (password !== confirmPassword) {
        showError('Passwords do not match');
        return;
    }
    
    const confirmationKeyContainer = document.getElementById('confirmationKeyContainer');
    if (!confirmationKeyContainer.classList.contains('hidden')) {
        if (!confirmationKey) {
            showError('Please enter the confirmation key');
            return;
        }
    }
    
    if (!agreeTerms) {
        showError('Please agree to the Terms of Service and Privacy Policy');
        return;
    }
    
    clearAuthMessage();
    const result = await window.TGDAuth.signUpBusinessOwner(
        email, 
        password, 
        listingId, 
        confirmationKey || '', 
        phone
    );
    
    if (result.success) {
        showSuccess(result.message);
        setTimeout(() => showSignInForm(), 3000);
    } else {
        showError(result.error);
    }
}

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
*/

async function handlePasswordReset() {
    const email = document.getElementById('resetEmail').value.trim();
    
    if (!email) {
        showError('Please enter your email address');
        return;
    }
    
    clearAuthMessage();
    const result = await window.TGDAuth.resetPassword(email);
    
    if (result.success) {
        showSuccess(result.message);
    } else {
        showError(result.error);
    }
}

async function logout() {
    if (confirm('Are you sure you want to logout?')) {
        await window.TGDAuth.signOut();
        showAuthPage();
    }
}

window.handleSignIn = handleSignIn;
window.handleSignUp = handleSignUp;
window.handlePasswordReset = handlePasswordReset;
window.showSignInForm = showSignInForm;
window.showSignUpForm = showSignUpForm;
window.showForgotPassword = showForgotPassword;
window.searchListingForSignup = searchListingForSignup;
window.selectListing = selectListing;
window.logout = logout;

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
*/

// Phone formatting utilities
function formatPhoneNumber(phone, country = 'USA') {
    if (!phone) return '';
    
    const digits = phone.replace(/\D/g, '');
    
    if (country === 'USA' && digits.length === 10) {
        return `(${digits.substr(0, 3)}) ${digits.substr(3, 3)}-${digits.substr(6, 4)}`;
    }
    
    return phone;
}

function createPhoneInput(value = '', country = 'USA') {
    const digits = value ? value.replace(/\D/g, '') : '';
    
    return `
        <div class="flex gap-2">
            <select class="phone-country-select px-3 py-2 border border-gray-300 rounded-lg" onchange="updatePhoneFormat(this)">
                ${Object.entries(COUNTRY_CODES).map(([c, code]) => 
                    `<option value="${c}" ${country === c ? 'selected' : ''}>${c} ${code}</option>`
                ).join('')}
            </select>
            <input type="tel" class="phone-number-input flex-1 px-4 py-2 border border-gray-300 rounded-lg" 
                value="${digits}" 
                placeholder="${country === 'USA' ? '(555) 123-4567' : 'Phone number'}"
                oninput="formatPhoneInput(this)">
        </div>
    `;
}

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
*/

window.formatPhoneInput = function(input) {
    const country = input.closest('.flex').querySelector('.phone-country-select').value;
    let value = input.value.replace(/\D/g, '');
    
    if (country === 'USA' && value.length > 10) {
        value = value.substr(0, 10);
    }
    
    if (country === 'USA') {
        if (value.length >= 6) {
            input.value = `(${value.substr(0, 3)}) ${value.substr(3, 3)}-${value.substr(6)}`;
        } else if (value.length >= 3) {
            input.value = `(${value.substr(0, 3)}) ${value.substr(3)}`;
        } else {
            input.value = value;
        }
    } else {
        input.value = value;
    }
};

window.updatePhoneFormat = function(select) {
    const input = select.closest('.flex').querySelector('.phone-number-input');
    const digits = input.value.replace(/\D/g, '');
    input.value = digits;
    formatPhoneInput(input);
};

function getPhoneValue(container) {
    const countrySelect = container.querySelector('.phone-country-select');
    const phoneInput = container.querySelector('.phone-number-input');
    
    if (!phoneInput || !phoneInput.value.trim()) return null;
    
    const country = countrySelect ? countrySelect.value : 'USA';
    const digits = phoneInput.value.replace(/\D/g, '');
    const code = COUNTRY_CODES[country];
    
    return `${code}${digits}`;
}

window.formatPhoneNumber = formatPhoneNumber;
window.createPhoneInput = createPhoneInput;
window.getPhoneValue = getPhoneValue;

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
This source code is proprietary and no part may not be used, reproduced, or distributed 
without written permission from The Greek Directory. Unauthorized use, copying, modification, 
or distribution of this code will result in legal action to the fullest extent permitted by law.
*/
