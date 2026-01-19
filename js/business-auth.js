// ============================================
// BUSINESS PORTAL AUTHENTICATION
// Complete authentication handling
// ============================================

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
    
    resultsDiv.innerHTML = matches.map(l => {
        const owner = l.owner && l.owner.length > 0 ? l.owner[0] : null;
        const isClaimed = owner && owner.owner_user_id;
        
        return `
        <div class="p-2 hover:bg-gray-100 cursor-pointer rounded ${isClaimed ? 'opacity-50' : ''}" 
             onclick="${isClaimed ? '' : `selectListing('${l.id}', '${l.business_name.replace(/'/g, "\\'")}', ${!!owner?.confirmation_key})`}">
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
