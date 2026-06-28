// js/app-home.js
// PWA Homepage — The Greek Directory
// Copyright (C) The Greek Directory, 2025-present. All rights reserved.

'use strict';

/* ============================================================
   CONSTANTS
   ============================================================ */

const SUPABASE_URL     = 'https://luetekzqrrgdxtopzvqw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1ZXRla3pxcnJnZHh0b3B6dnF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNDc2NDcsImV4cCI6MjA4MzkyMzY0N30.TIrNG8VGumEJc_9JvNHW-Q-UWfUGpPxR0v8POjWZJYg';

/** Categories with icons — keeps parity with js/index.js */
const CATEGORIES = [
    { name: 'Automotive & Transportation',       icon: '🚗' },
    { name: 'Beauty & Health',                   icon: '💅' },
    { name: 'Church & Religious Organization',   icon: '⛪' },
    { name: 'Cultural/Fraternal Organization',   icon: '🎭' },
    { name: 'Education & Community',             icon: '📚' },
    { name: 'Entertainment, Arts & Recreation',  icon: '🎨' },
    { name: 'Food & Hospitality',                icon: '🍽️' },
    { name: 'Grocery & Imports',                 icon: '🛒' },
    { name: 'Home & Construction',               icon: '🏠' },
    { name: 'Industrial & Manufacturing',        icon: '🏭' },
    { name: 'Pets & Veterinary',                 icon: '🐾' },
    { name: 'Professional & Business Services',  icon: '💼' },
    { name: 'Real Estate & Development',         icon: '🏢' },
    { name: 'Retail & Shopping',                 icon: '🛍️' },
];

/** Verified / claimed checkmark SVG */
const CHECKMARK_SVG = `<svg class="ah-checkmark" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Verified" role="img"><circle cx="12" cy="12" r="12" fill="#045093"/><path d="M7 12.5l3.5 3.5L17 9" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

/** Location icon (inline, tiny) */
const LOC_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>`;

/* ============================================================
   MODULE STATE
   ============================================================ */

let _supabase       = null;
let _allListings    = [];
let _searchTimer    = null;
let _activeDropIdx  = -1;
let _categoryCounts = {};

/* ============================================================
   UTILITIES
   ============================================================ */

function _escHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function _fmtPhone(phone) {
    if (!phone) return '';
    const d = phone.replace(/\D/g, '');
    if (phone.startsWith('+1') && d.length === 11) {
        return `(${d.substr(1,3)}) ${d.substr(4,3)}-${d.substr(7,4)}`;
    }
    return phone;
}

/** Returns the best display image URL for a listing (first photo or logo). */
function _listingImg(listing) {
    const photos = Array.isArray(listing.photos) ? listing.photos : [];
    return photos[0] || listing.logo || null;
}

/** Whether the listing deserves the checkmark badge. */
function _showsCheckmark(listing) {
    return listing.tier === 'FEATURED' || listing.tier === 'PREMIUM' || listing.is_claimed;
}

/* ============================================================
   SUPABASE INIT
   ============================================================ */

function _initSupabase() {
    if (_supabase) return _supabase;
    if (typeof window.supabase === 'undefined') return null;
    _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return _supabase;
}

/* ============================================================
   DATA LOADING
   ============================================================ */

/**
 * Loads all visible listings once and populates module-level `_allListings`.
 * Uses only the columns needed for the homepage.
 */
async function _loadListings() {
    const sb = _initSupabase();
    if (!sb) return;

    try {
        const { data, error } = await sb
            .from('listings')
            .select('id, business_name, tagline, category, city, state, slug, logo, photos, tier, verified, is_claimed')
            .eq('visible', true)
            .order('created_at', { ascending: false })
            .limit(120);

        if (error) throw error;

        _allListings = data || [];
        _buildCategoryCounts();
    } catch (err) {
        console.error('[app-home] Error loading listings:', err);
    }
}

/** Tally listings per category for the explorer grid. */
function _buildCategoryCounts() {
    _categoryCounts = {};
    _allListings.forEach(l => {
        const cat = l.category || '';
        _categoryCounts[cat] = (_categoryCounts[cat] || 0) + 1;
    });
}

/* ============================================================
   RENDER — FEATURED RAIL
   ============================================================ */

function _renderFeatured() {
    const rail    = document.getElementById('ahFeaturedRail');
    const section = document.getElementById('ahFeaturedSection');
    if (!rail || !section) return;

    const featured = _allListings
        .filter(l => l.tier === 'FEATURED' || l.tier === 'PREMIUM')
        .slice(0, 8);

    if (!featured.length) {
        section.style.display = 'none';
        return;
    }

    section.style.display = '';
    rail.innerHTML = featured.map(_featCard).join('');
}

function _featCard(listing) {
    const url        = `/listing/${_escHtml(listing.slug)}`;
    const imgUrl     = _listingImg(listing);
    const checkmark  = _showsCheckmark(listing) ? CHECKMARK_SVG : '';
    const tierClass  = listing.tier === 'PREMIUM'  ? 'ah-badge-premium'
                     : listing.tier === 'FEATURED' ? 'ah-badge-featured'
                     : '';
    const tierLabel  = listing.tier === 'PREMIUM'  ? 'Premium'
                     : listing.tier === 'FEATURED' ? 'Featured'
                     : '';
    const loc = listing.city && listing.state ? `${_escHtml(listing.city)}, ${_escHtml(listing.state)}` : '';

    return `
<a href="${url}" class="ah-feat-card" role="listitem" aria-label="${_escHtml(listing.business_name)}">
    <div class="ah-feat-img-wrap">
        ${imgUrl
            ? `<img src="${_escHtml(imgUrl)}" alt="" class="ah-feat-img" loading="lazy" decoding="async" onerror="this.style.display='none'">`
            : `<div style="width:100%;height:100%;background:linear-gradient(135deg,#045093 0%,#0a5ca3 100%);"></div>`
        }
        <div class="ah-feat-img-gradient" aria-hidden="true"></div>
        ${tierLabel ? `<span class="ah-feat-badge ${tierClass}">${tierLabel}</span>` : ''}
        ${listing.logo && imgUrl !== listing.logo
            ? `<img src="${_escHtml(listing.logo)}" alt="" class="ah-feat-logo" loading="lazy" decoding="async" onerror="this.style.display='none'">`
            : ''}
    </div>
    <div class="ah-feat-body">
        <h3 class="ah-feat-name">${_escHtml(listing.business_name)}${checkmark}</h3>
        ${listing.tagline ? `<p class="ah-feat-tagline">"${_escHtml(listing.tagline)}"</p>` : '<p class="ah-feat-tagline"></p>'}
        <div class="ah-feat-meta">
            <span class="ah-feat-category">${_escHtml(listing.category)}</span>
            ${loc ? `<span class="ah-feat-loc">${loc}</span>` : ''}
        </div>
    </div>
</a>`.trim();
}

/* ============================================================
   RENDER — CATEGORY EXPLORER GRID
   ============================================================ */

function _renderCategories() {
    const grid = document.getElementById('ahCategoriesGrid');
    if (!grid) return;

    // Show all 14 categories, ordered by count descending, then alphabetically
    const sorted = [...CATEGORIES].sort((a, b) => {
        const ca = _categoryCounts[a.name] || 0;
        const cb = _categoryCounts[b.name] || 0;
        return cb - ca || a.name.localeCompare(b.name);
    });

    grid.innerHTML = sorted.map(cat => {
        const count = _categoryCounts[cat.name] || 0;
        const label = count === 1 ? '1 listing' : count > 0 ? `${count} listings` : 'Coming soon';
        return `
<a href="/listings?category=${encodeURIComponent(cat.name)}"
   class="ah-cat-card"
   role="listitem"
   aria-label="Browse ${_escHtml(cat.name)} — ${label}">
    <div class="ah-cat-icon" aria-hidden="true">${cat.icon}</div>
    <div class="ah-cat-info">
        <div class="ah-cat-name">${_escHtml(cat.name)}</div>
        <div class="ah-cat-count">${label}</div>
    </div>
    <span class="ah-cat-arrow" aria-hidden="true">›</span>
</a>`.trim();
    }).join('');
}

/* ============================================================
   RENDER — RECENT LISTINGS GRID
   ============================================================ */

function _renderRecent() {
    const grid = document.getElementById('ahRecentGrid');
    if (!grid) return;

    const recent = _allListings.slice(0, 9);

    if (!recent.length) {
        grid.innerHTML = `<p style="color:var(--ah-text-400);font-size:0.9rem;">No listings yet.</p>`;
        return;
    }

    grid.innerHTML = recent.map(_listCard).join('');
}

function _listCard(listing) {
    const url       = `/listing/${_escHtml(listing.slug)}`;
    const imgUrl    = _listingImg(listing);
    const checkmark = _showsCheckmark(listing) ? CHECKMARK_SVG : '';
    const loc       = listing.city && listing.state
        ? `${_escHtml(listing.city)}, ${_escHtml(listing.state)}`
        : '';

    const imgHtml = imgUrl
        ? `<img src="${_escHtml(imgUrl)}" alt="" class="ah-list-img" loading="lazy" decoding="async" onerror="this.parentNode.innerHTML='${_placeholderHtml()}';">`
        : `<div class="ah-list-img-placeholder" aria-hidden="true">${_placeholderSvg()}</div>`;

    return `
<a href="${url}" class="ah-list-card" role="listitem" aria-label="${_escHtml(listing.business_name)}">
    ${imgHtml}
    <div class="ah-list-info">
        <h3 class="ah-list-name">${_escHtml(listing.business_name)}${checkmark}</h3>
        ${listing.tagline ? `<p class="ah-list-tagline">"${_escHtml(listing.tagline)}"</p>` : ''}
        <div class="ah-list-row">
            <span class="ah-list-category">${_escHtml(listing.category)}</span>
            ${loc ? `<span class="ah-list-loc">${LOC_ICON}<span>${loc}</span></span>` : ''}
        </div>
    </div>
</a>`.trim();
}

function _placeholderSvg() {
    return `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-1 11l-4-5-3 4-2-2.5L6 15h12z"/></svg>`;
}

function _placeholderHtml() {
    return `<div class="ah-list-img-placeholder" aria-hidden="true">${_placeholderSvg()}</div>`;
}

/* ============================================================
   SEARCH — PREDICTIVE DROPDOWN
   ============================================================ */

function _setupSearch() {
    const input    = document.getElementById('ahSearchInput');
    const btn      = document.getElementById('ahSearchBtn');
    const dropdown = document.getElementById('ahSearchDropdown');
    const trigger  = document.getElementById('ahPwaSearchTrigger');

    if (!input || !btn || !dropdown) return;

    // Keyboard nav on input
    input.addEventListener('keydown', e => {
        const items = dropdown.querySelectorAll('.ah-drop-item');
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            _activeDropIdx = Math.min(_activeDropIdx + 1, items.length - 1);
            _syncDropFocus(items);
            return;
        }
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            _activeDropIdx = Math.max(_activeDropIdx - 1, -1);
            _syncDropFocus(items);
            return;
        }
        if (e.key === 'Enter') {
            if (_activeDropIdx >= 0 && items[_activeDropIdx]) {
                items[_activeDropIdx].click();
            } else {
                _hideDropdown();
                _performSearch();
            }
            return;
        }
        if (e.key === 'Escape') {
            _hideDropdown();
            input.blur();
        }
    });

    // Predictive on input
    input.addEventListener('input', () => {
        _activeDropIdx = -1;
        clearTimeout(_searchTimer);
        const q = input.value.trim();
        if (q.length < 2) { _hideDropdown(); return; }
        _searchTimer = setTimeout(() => _showPredictions(q), 180);
    });

    // Search button
    btn.addEventListener('click', () => {
        _hideDropdown();
        _performSearch();
    });

    // PWA topbar search trigger — scrolls to and focuses search
    if (trigger) {
        trigger.addEventListener('click', () => {
            const heroInput = document.getElementById('ahSearchInput');
            if (heroInput) {
                heroInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setTimeout(() => heroInput.focus(), 300);
            }
        });
    }

    // Close on outside click
    document.addEventListener('click', e => {
        const wrap = document.querySelector('.ah-search-wrap');
        if (wrap && !wrap.contains(e.target)) _hideDropdown();
    });

    // Close on scroll away
    document.addEventListener('scroll', () => {
        if (!document.getElementById('ahSearchInput').matches(':focus')) _hideDropdown();
    }, { passive: true });
}

function _syncDropFocus(items) {
    items.forEach((item, i) => item.classList.toggle('ah-focused', i === _activeDropIdx));
}

function _showPredictions(rawQuery) {
    const dropdown = document.getElementById('ahSearchDropdown');
    if (!dropdown) return;

    const q = rawQuery.toLowerCase();
    let html = '';

    // 1. Business matches
    const biz = _allListings
        .filter(l =>
            l.business_name?.toLowerCase().includes(q) ||
            l.tagline?.toLowerCase().includes(q)
        )
        .slice(0, 5);

    if (biz.length) {
        html += `<div class="ah-drop-label">Businesses</div>`;
        html += biz.map(l => {
            const thumb = _listingImg(l);
            const loc   = l.city && l.state ? `${l.city}, ${l.state}` : '';
            const imgHtml = thumb
                ? `<img src="${_escHtml(thumb)}" alt="" class="ah-drop-thumb" loading="lazy" onerror="this.style.display='none'">`
                : `<div class="ah-drop-placeholder" aria-hidden="true">🏢</div>`;
            return `
<a href="/listing/${_escHtml(l.slug)}" class="ah-drop-item" role="option">
    ${imgHtml}
    <div class="ah-drop-info">
        <div class="ah-drop-name">${_escHtml(l.business_name)}</div>
        <div class="ah-drop-meta">${_escHtml(l.category)}${loc ? ` · ${_escHtml(loc)}` : ''}</div>
    </div>
    <span class="ah-drop-arrow" aria-hidden="true">›</span>
</a>`;
        }).join('');
    }

    // 2. Category matches
    const cats = CATEGORIES.filter(c => c.name.toLowerCase().includes(q)).slice(0, 4);

    if (cats.length) {
        html += `<div class="ah-drop-label">Categories</div>`;
        html += cats.map(c => `
<a href="/listings?category=${encodeURIComponent(c.name)}" class="ah-drop-item" role="option">
    <div class="ah-drop-icon" aria-hidden="true">${c.icon}</div>
    <div class="ah-drop-info">
        <div class="ah-drop-name">${_escHtml(c.name)}</div>
        <div class="ah-drop-meta">Browse all businesses</div>
    </div>
    <span class="ah-drop-arrow" aria-hidden="true">›</span>
</a>`).join('');
    }

    // 3. Location matches
    const seen = new Set();
    const locs = [];
    _allListings.forEach(l => {
        if (l.city?.toLowerCase().includes(q)) {
            const key = `${l.city}-${l.state}`;
            if (!seen.has(key)) {
                locs.push({ city: l.city, state: l.state });
                seen.add(key);
            }
        }
    });
    const topLocs = locs.slice(0, 3);

    if (topLocs.length) {
        html += `<div class="ah-drop-label">Locations</div>`;
        html += topLocs.map(loc => `
<a href="/listings?state=${encodeURIComponent(loc.state)}" class="ah-drop-item" role="option">
    <div class="ah-drop-icon location" aria-hidden="true">📍</div>
    <div class="ah-drop-info">
        <div class="ah-drop-name">${_escHtml(loc.city)}, ${_escHtml(loc.state)}</div>
        <div class="ah-drop-meta">Browse businesses in this area</div>
    </div>
    <span class="ah-drop-arrow" aria-hidden="true">›</span>
</a>`).join('');
    }

    if (!html) {
        dropdown.innerHTML = `<div class="ah-drop-no-results">No results for "<strong>${_escHtml(rawQuery)}</strong>"</div>`;
        dropdown.classList.remove('ah-hidden');
        return;
    }

    // Footer "Search all for…"
    html += `
<div class="ah-drop-footer" id="ahDropFooter" role="option" tabindex="0"
     onclick="_appHome.performSearch()" onkeydown="if(event.key==='Enter'){_appHome.performSearch();}">
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
        <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35" stroke-linecap="round"/>
    </svg>
    <span>Search all listings for "<strong>${_escHtml(rawQuery)}</strong>"</span>
</div>`;

    dropdown.innerHTML = html;
    dropdown.classList.remove('ah-hidden');
}

function _hideDropdown() {
    const dd = document.getElementById('ahSearchDropdown');
    if (dd) { dd.classList.add('ah-hidden'); dd.innerHTML = ''; }
    _activeDropIdx = -1;
}

function _performSearch() {
    const input = document.getElementById('ahSearchInput');
    const q = input?.value.trim();
    if (q) window.location.href = `/listings?q=${encodeURIComponent(q)}`;
}

/* ============================================================
   CATEGORY CHIP CLICK
   ============================================================ */

function _setupChips() {
    const chips = document.querySelectorAll('.ah-chip[data-category]');
    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            const cat = chip.dataset.category;
            window.location.href = `/listings?category=${encodeURIComponent(cat)}`;
        });
    });
}

/* ============================================================
   HERO PARALLAX (lightweight, passive)
   ============================================================ */

function _setupHeroParallax() {
    const bg = document.querySelector('.ah-hero-bg');
    if (!bg) return;

    // Trigger the slight zoom-out CSS transition
    bg.classList.add('loaded');

    window.addEventListener('scroll', () => {
        const y = window.scrollY;
        if (y > 600) return; // stop past hero
        bg.style.transform = `translateY(${y * 0.28}px) scale(1)`;
    }, { passive: true });
}

/* ============================================================
   CLEAR SKELETONS
   ============================================================ */

function _clearSkeletons(gridId) {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    grid.querySelectorAll('.ah-card-skeleton, .ah-list-skeleton').forEach(el => el.remove());
}

/* ============================================================
   INIT
   ============================================================ */

async function _init() {
    // Set up interactivity immediately (no data dependency)
    _setupSearch();
    _setupChips();
    _setupHeroParallax();

    // Pre-populate categories with zero counts so grid appears fast
    _renderCategories();

    // Load listings, then re-render dynamic sections
    await _loadListings();

    _clearSkeletons('ahFeaturedRail');
    _clearSkeletons('ahRecentGrid');
    _renderFeatured();
    _renderCategories();   // re-render with real counts
    _renderRecent();
}

/* ============================================================
   BOOT
   ============================================================ */

// We need supabase to be loaded before init
function _waitForSupabase(attempts) {
    if (typeof window.supabase !== 'undefined') {
        _init();
        return;
    }
    if (attempts <= 0) {
        // Supabase unavailable — still render static UI
        _setupSearch();
        _setupChips();
        _setupHeroParallax();
        _renderCategories();
        _clearSkeletons('ahFeaturedRail');
        _clearSkeletons('ahRecentGrid');
        return;
    }
    setTimeout(() => _waitForSupabase(attempts - 1), 150);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => _waitForSupabase(20));
} else {
    _waitForSupabase(20);
}

/* ============================================================
   PUBLIC API (exposed for inline onclick safety)
   ============================================================ */
window._appHome = {
    performSearch: _performSearch,
    hideDropdown: _hideDropdown,
    searchByCategory(name) {
        window.location.href = `/listings?category=${encodeURIComponent(name)}`;
    },
};

// Mirror the existing homepage globals for any shared scripts that
// reference them (e.g., dock.js calling window.performSearch).
window.performSearch    = _performSearch;
window.searchByCategory = window._appHome.searchByCategory;
window.hideDropdown     = _hideDropdown;
