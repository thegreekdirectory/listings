// js/business-auth.js
/*
 * THE GREEK DIRECTORY — Business Portal Authentication
 * © The Greek Directory 2025. All rights reserved.
 */

// ─── Shared State (window-exposed for dashboard.js) ─────────────
const COUNTRY_CODES = {
  'USA':       '1',
  'Greece':    '30',
  'Canada':    '1',
  'UK':        '44',
  'Cyprus':    '357',
  'Australia': '61'
};

window.BP = window.BP || {};
window.BP.userCountry  = 'USA';
window.BP.currentUser  = null;
window.BP.currentListing = null;
window.BP.ownerData    = null;

// ─── Initialise ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  detectUserCountry(); // fire-and-forget

  window.TGDAuth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session) {
      await handleAuthSuccess(session);
    } else if (event === 'SIGNED_OUT') {
      showAuthPage();
    }
  });

  const session = await window.TGDAuth.getCurrentSession();
  if (session) {
    await handleAuthSuccess(session);
  } else {
    showAuthPage();
  }
});

// ─── Country Detection ───────────────────────────────────────────
async function detectUserCountry() {
  try {
    const res  = await fetch('https://ipapi.co/json/');
    const data = await res.json();
    const map  = { US: 'USA', GR: 'Greece', CA: 'Canada', GB: 'UK', CY: 'Cyprus', AU: 'Australia' };
    window.BP.userCountry = map[data.country_code] || 'USA';
  } catch (_) { /* stay USA */ }
}

// ─── Auth Success → load data → show dashboard ──────────────────
async function handleAuthSuccess(session) {
  window.BP.currentUser = session.user;

  const ownerData = await window.TGDAuth.getBusinessOwnerData();
  if (!ownerData || ownerData.length === 0) {
    showAuthMsg('Could not load business owner data. Please contact support.', 'error');
    await window.TGDAuth.signOut();
    showAuthPage();
    return;
  }
  window.BP.ownerData = ownerData;

  // loadListingData is defined in business-dashboard.js
  await window.BP.loadListingData();
  showDashboard();
}

// ─── Page Visibility ─────────────────────────────────────────────
function showAuthPage() {
  document.getElementById('authPage').classList.remove('hidden');
  document.getElementById('dashboardPage').classList.add('hidden');
  showSignInForm();
}

function showDashboard() {
  document.getElementById('authPage').classList.add('hidden');
  document.getElementById('dashboardPage').classList.remove('hidden');

  const user  = window.BP.currentUser;
  const email = user?.email || '';
  const initial = email.charAt(0).toUpperCase() || '?';

  document.getElementById('sbUserEmail').textContent = email;
  document.getElementById('sbAvatar').textContent    = initial;

  if (typeof window.BP.renderDashboard === 'function') {
    window.BP.renderDashboard();
  }

  syncTabWithHash();
}

// ─── Auth Form Switching ─────────────────────────────────────────
function showSignInForm() {
  _showForm('signInForm');
  clearAuthMsg();
}

function showSignUpForm() {
  _showForm('signUpForm');
  clearAuthMsg();
}

function showForgotPassword() {
  _showForm('forgotPasswordForm');
  clearAuthMsg();
}

function _showForm(id) {
  ['signInForm', 'signUpForm', 'forgotPasswordForm'].forEach(f => {
    document.getElementById(f)?.classList.toggle('hidden', f !== id);
  });
}

// ─── Auth Messages ───────────────────────────────────────────────
function showAuthMsg(text, type = 'error') {
  const el = document.getElementById('authMsg');
  if (!el) return;
  el.textContent = text;
  el.className = `bp-auth-msg bp-auth-msg--${type} visible`;
}

function clearAuthMsg() {
  const el = document.getElementById('authMsg');
  if (!el) return;
  el.className = 'bp-auth-msg';
}

// ─── Button Loading State ────────────────────────────────────────
function setBtnLoading(id, loading) {
  const btn = document.getElementById(id);
  if (!btn) return;
  btn.disabled = loading;
  btn.classList.toggle('bp-btn--loading', loading);
}

// ─── Sign In ─────────────────────────────────────────────────────
async function handleSignIn() {
  const email    = document.getElementById('siEmail').value.trim();
  const password = document.getElementById('siPassword').value;

  if (!email || !password) {
    showAuthMsg('Please enter both email and password.');
    return;
  }

  clearAuthMsg();
  setBtnLoading('signInBtn', true);

  const result = await window.TGDAuth.signInBusinessOwner(email, password);

  setBtnLoading('signInBtn', false);

  if (!result.success) {
    showAuthMsg(result.error || 'Sign in failed. Please try again.');
  }
  // On success, onAuthStateChange fires → handleAuthSuccess → showDashboard
}

// ─── Sign Up ─────────────────────────────────────────────────────
let _allListings = [];

async function searchListingForSignup() {
  const term       = document.getElementById('suSearch').value.trim().toLowerCase();
  const resultsDiv = document.getElementById('listingSearchResults');

  if (term.length < 2) {
    resultsDiv.innerHTML = '';
    resultsDiv.classList.remove('open');
    document.getElementById('confirmKeyRow').classList.add('hidden');
    return;
  }

  // Lazy-load listings once
  if (_allListings.length === 0) {
    const { data, error } = await window.TGDAuth.supabaseClient
      .from('listings')
      .select('id, business_name, city, state, is_claimed, slug')
      .eq('visible', true)
      .order('business_name');

    if (!error && data) _allListings = data;

    // Also load business_owners to check for confirmation keys
    const { data: owners } = await window.TGDAuth.supabaseClient
      .from('business_owners')
      .select('listing_id, confirmation_key, owner_user_id');

    if (owners) {
      _allListings = _allListings.map(l => {
        const owner = owners.find(o => o.listing_id === l.id);
        return { ...l, _hasKey: !!(owner?.confirmation_key), _isClaimed: !!(owner?.owner_user_id) };
      });
    }
  }

  const matches = _allListings.filter(l =>
    l.business_name.toLowerCase().includes(term) ||
    String(l.id).includes(term)
  ).slice(0, 6);

  if (matches.length === 0) {
    resultsDiv.innerHTML = '<div class="bp-search-result-item"><span class="meta">No listings found.</span></div>';
    resultsDiv.classList.add('open');
    return;
  }

  resultsDiv.innerHTML = matches.map(l => `
    <div class="bp-search-result-item ${l._isClaimed ? 'claimed' : ''}"
         onclick="${l._isClaimed ? '' : `selectListing('${l.id}','${l.business_name.replace(/'/g, "\\'")}',${l._hasKey})`}"
         style="${l._isClaimed ? 'cursor:default;' : ''}">
      <div class="name">${l.business_name}${l._isClaimed ? ' <span style="color:var(--error);font-size:.72rem;">· Already claimed</span>' : ''}</div>
      <div class="meta">${[l.city, l.state].filter(Boolean).join(', ')}</div>
    </div>
  `).join('');
  resultsDiv.classList.add('open');
}

function selectListing(id, name, hasKey) {
  document.getElementById('suSearch').value       = name;
  document.getElementById('suListingId').value    = id;
  document.getElementById('listingSearchResults').classList.remove('open');
  document.getElementById('confirmKeyRow').classList.toggle('hidden', !hasKey);
}

async function handleSignUp() {
  const listingId    = document.getElementById('suListingId').value;
  const confirmKey   = document.getElementById('suConfirmKey').value.trim();
  const email        = document.getElementById('suEmail').value.trim();
  const phone        = document.getElementById('suPhone').value.trim();
  const password     = document.getElementById('suPassword').value;
  const passConfirm  = document.getElementById('suPasswordConfirm').value;
  const agreeTerms   = document.getElementById('agreeTerms').checked;
  const keyRowHidden = document.getElementById('confirmKeyRow').classList.contains('hidden');

  if (!listingId)       return showAuthMsg('Please search for and select your business listing.');
  if (!email)           return showAuthMsg('Please enter your business email.');
  if (password.length < 6) return showAuthMsg('Password must be at least 6 characters.');
  if (password !== passConfirm) return showAuthMsg('Passwords do not match.');
  if (!keyRowHidden && !confirmKey) return showAuthMsg('Please enter your confirmation key.');
  if (!agreeTerms)      return showAuthMsg('You must agree to the Terms of Service and Privacy Policy.');

  clearAuthMsg();
  setBtnLoading('signUpBtn', true);

  const result = await window.TGDAuth.signUpBusinessOwner(
    email, password, listingId, keyRowHidden ? 'no-key-required' : confirmKey, phone || null
  );

  setBtnLoading('signUpBtn', false);

  if (result.success) {
    showAuthMsg(result.message, 'success');
    setTimeout(() => showSignInForm(), 4000);
  } else {
    showAuthMsg(result.error || 'Sign up failed. Please try again.');
  }
}

// ─── Password Reset ──────────────────────────────────────────────
async function handlePasswordReset() {
  const email = document.getElementById('resetEmail').value.trim();
  if (!email) return showAuthMsg('Please enter your email address.');

  clearAuthMsg();
  setBtnLoading('resetBtn', true);

  const result = await window.TGDAuth.resetPassword(email);

  setBtnLoading('resetBtn', false);

  if (result.success) {
    showAuthMsg(result.message, 'success');
  } else {
    showAuthMsg(result.error || 'Password reset failed.');
  }
}

// ─── Logout ──────────────────────────────────────────────────────
async function logout() {
  if (typeof window.BP.showConfirmModal === 'function') {
    window.BP.showConfirmModal({
      title: 'Sign Out',
      message: 'Are you sure you want to sign out of the Business Portal?',
      confirmLabel: 'Sign Out',
      onConfirm: async () => {
        await window.TGDAuth.signOut();
        showAuthPage();
      }
    });
  } else {
    await window.TGDAuth.signOut();
    showAuthPage();
  }
}

// ─── Tab Hash Sync (shared) ──────────────────────────────────────
function syncTabWithHash() {
  const hash   = (window.location.hash || '').replace('#', '').trim();
  const valid  = ['overview', 'edit', 'analytics', 'settings'];
  const target = valid.includes(hash) ? hash : 'overview';
  if (typeof window.BP.switchTab === 'function') window.BP.switchTab(target);
}

window.addEventListener('hashchange', syncTabWithHash);

// ─── Phone Utilities (used in dashboard.js too) ──────────────────
function formatPhoneDisplay(phone) {
  if (!phone) return '';
  const d = String(phone).replace(/\D/g, '');
  if (d.length === 11 && d.startsWith('1')) {
    return `(${d.slice(1,4)}) ${d.slice(4,7)}-${d.slice(7,11)}`;
  }
  if (d.length === 10) {
    return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6,10)}`;
  }
  return phone;
}

function normalizePhoneE164(value, country = 'USA') {
  if (!value) return null;
  const digits = String(value).replace(/\D/g, '');
  if (!digits) return null;
  if (country === 'USA' || country === 'Canada') {
    if (digits.length === 10) return `+1${digits}`;
    if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
    return null;
  }
  const code    = COUNTRY_CODES[country] || '1';
  const national = digits.startsWith(code) ? digits.slice(code.length) : digits;
  return national ? `+${code}${national}` : null;
}

function createPhoneInput(containerId, currentE164 = '', country = null) {
  const selectedCountry = country || window.BP.userCountry || 'USA';
  const raw = (currentE164 || '').replace(/\D/g, '');
  let digits = raw;
  if ((selectedCountry === 'USA' || selectedCountry === 'Canada') && raw.length === 11 && raw.startsWith('1')) {
    digits = raw.slice(1);
  }
  const formatted = digits.length === 10
    ? `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6,10)}`
    : digits;

  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = `
    <div class="bp-phone-wrap">
      <select class="phone-country" onchange="onPhoneCountryChange(this)">
        ${Object.entries(COUNTRY_CODES).map(([c,code]) =>
          `<option value="${c}" ${selectedCountry===c?'selected':''}>${c} +${code}</option>`
        ).join('')}
      </select>
      <input class="bp-input phone-number" type="tel"
             value="${formatted}"
             placeholder="${(selectedCountry==='USA'||selectedCountry==='Canada') ? '(555) 123-4567' : 'Phone number'}"
             oninput="formatPhoneInput(this)">
    </div>
  `;
}

window.onPhoneCountryChange = function(select) {
  const input  = select.closest('.bp-phone-wrap').querySelector('.phone-number');
  const digits = input.value.replace(/\D/g, '');
  input.value  = digits;
  formatPhoneInput(input);
};

window.formatPhoneInput = function(input) {
  const wrap    = input.closest('.bp-phone-wrap');
  const country = wrap ? wrap.querySelector('.phone-country')?.value : 'USA';
  let d = input.value.replace(/\D/g, '');
  if ((country === 'USA' || country === 'Canada') && d.length > 10) d = d.slice(0, 10);
  if (country === 'USA' || country === 'Canada') {
    if (d.length >= 6) input.value = `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`;
    else if (d.length >= 3) input.value = `(${d.slice(0,3)}) ${d.slice(3)}`;
    else input.value = d;
  } else {
    input.value = d;
  }
};

function getPhoneValue(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return null;
  const countryEl = container.querySelector('.phone-country');
  const numEl     = container.querySelector('.phone-number');
  if (!numEl?.value?.trim()) return null;
  return normalizePhoneE164(numEl.value, countryEl?.value || 'USA');
}

// ─── Expose Globals ──────────────────────────────────────────────
Object.assign(window, {
  handleSignIn,
  handleSignUp,
  handlePasswordReset,
  logout,
  showSignInForm,
  showSignUpForm,
  showForgotPassword,
  searchListingForSignup,
  selectListing,
  syncTabWithHash
});

Object.assign(window.BP, {
  formatPhoneDisplay,
  normalizePhoneE164,
  createPhoneInput,
  getPhoneValue,
  COUNTRY_CODES
});
