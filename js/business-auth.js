// ============================================
// BUSINESS PORTAL AUTHENTICATION
// ============================================

const GITHUB_OWNER = 'thegreekdirectory';
const GITHUB_REPO = 'listings';
const DATABASE_PATH = 'listings-database.json';

let currentUser = null;
let currentListing = null;
let ownerData = null;
let allListings = [];

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Initializing Business Portal...');
    
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

async function handleAuthSuccess(session) {
    currentUser = session.user;
    
    ownerData = await window.TGDAuth.getBusinessOwnerData();
    
    if (!ownerData) {
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

async function searchListingForSignup() {
    const searchTerm = document.getElementById('signUpListingSearch').value.trim().toLowerCase();
    const resultsDiv = document.getElementById('listingSearchResults');
    
    if (searchTerm.length < 2) {
        resultsDiv.innerHTML = '';
        return;
    }
    
    if (!allListings || allListings.length === 0) {
        try {
            const response = await fetch(`https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/main/${DATABASE_PATH}`);
            const data = await response.json();
            allListings = data.listings;
        } catch (error) {
            console.error('Error loading listings:', error);
            return;
        }
    }
    
    const matches = allListings.filter(l => 
        l.businessName.toLowerCase().includes(searchTerm) ||
        l.listingId.toString().includes(searchTerm) ||
        l.id.includes(searchTerm)
    ).slice(0, 5);
    
    if (matches.length === 0) {
        resultsDiv.innerHTML = '<p class="text-sm text-gray-500 p-2">No listings found</p>';
        return;
    }
    
    resultsDiv.innerHTML = matches.map(l => `
        <div class="p-2 hover:bg-gray-100 cursor-pointer rounded" onclick="selectListing('${l.id}', '${l.businessName}')">
            <div class="font-medium">${l.businessName}</div>
            <div class="text-xs text-gray-500">ID: ${l.listingId} • ${l.city}, ${l.state}</div>
        </div>
    `).join('');
}

function selectListing(listingId, businessName) {
    document.getElementById('signUpListingId').value = listingId;
    document.getElementById('signUpListingSearch').value = businessName;
    document.getElementById('listingSearchResults').innerHTML = '';
}

async function handleSignUp() {
    const listingId = document.getElementById('signUpListingId').value;
    const email = document.getElementById('signUpEmail').value.trim();
    const phone = document.getElementById('signUpPhone').value.trim();
    const password = document.getElementById('signUpPassword').value;
    const confirmPassword = document.getElementById('signUpPasswordConfirm').value;
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
    
    if (!agreeTerms) {
        showError('Please agree to the Terms of Service and Privacy Policy');
        return;
    }
    
    clearAuthMessage();
    const result = await window.TGDAuth.signUpBusinessOwner(email, password, listingId, phone);
    
    if (result.success) {
        showSuccess(result.message);
        setTimeout(() => showSignInForm(), 3000);
    } else {
        showError(result.error);
    }
}

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
