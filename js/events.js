/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
This source code is proprietary and no part may not be used, reproduced, or distributed
without written permission from The Greek Directory. Unauthorized use, copying, modification,
or distribution of this code can result in legal action to the fullest extent permitted by law.
*/

// js/events.js
//
// Powers events.html AND functions/events/_render-region-page.js's
// output (e.g. /events/chicago) — both mount the same #eventsApp-style
// DOM structure and load this one script, so every filter/sort/view
// interaction is implemented exactly once. See _render-region-page.js's
// own header comment for the reasoning behind sharing this file instead
// of forking a second copy for regional pages.
//
// Data loading is client-side, straight from Supabase using the public
// anon key + RLS (tgd_events_select — visible rows only), the same
// architecture js/listings.js already uses for the public directory.
// The Cloudflare Functions in functions/events/ own routing + the
// initial HTML shell + edge caching; this file owns everything that
// happens after the page has loaded in a real visitor's browser.

(function () {
    'use strict';

    // Same Supabase project + anon key already public in js/listings.js —
    // intentionally the identical constant, not a new credential.
    const SUPABASE_URL = 'https://luetekzqrrgdxtopzvqw.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1ZXRla3pxcnJnZHh0b3B6dnF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNDc2NDcsImV4cCI6MjA4MzkyMzY0N30.TIrNG8VGumEJc_9JvNHW-Q-UWfUGpPxR0v8POjWZJYg';

    let eventsSupabase = null;
    let allEvents = [];           // full fetched set for the current query scope
    let filteredEvents = [];      // after search/category/date/free-only filters
    let currentView = localStorage.getItem('tgd_events_layout') || 'grid';
    let currentSort = 'soonest';
    let calendarCursor = new Date();  // month currently shown in calendar view
    let map = null;
    let markerClusterGroup = null;
    let loadMoreOffset = 0;
    const PAGE_SIZE = 24;

    // Regional-page mode — set as a global by _render-region-page.js
    // before this script loads. See that file's header comment.
    const REGION = window.TGD_EVENTS_REGION || null;

    const state = {
        search: '',
        categories: new Set(),
        dateRange: 'all',
        freeOnly: false,
    };

    // -------------------------------------------------------------------
    // Init
    // -------------------------------------------------------------------

    document.addEventListener('DOMContentLoaded', init);

    async function init() {
        if (!window.supabase || typeof window.supabase.createClient !== 'function') {
            console.error('Supabase client library not loaded.');
            return;
        }
        eventsSupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

        if (REGION) {
            applyRegionalPageMode();
        }

        bindToolbarEvents();
        bindFilterPanelEvents();
        setView(currentView, { skipSave: true });

        await loadEvents();
        renderCategoryFilters();
        applyFiltersAndRender();
    }

    // Hides the location-search filter (redundant on a page already
    // confined to one region's cities) and swaps in region-specific
    // empty-state / results-count copy.
    function applyRegionalPageMode() {
        document.querySelectorAll('.event-regional-hide').forEach((el) => el.classList.add('hidden'));
    }

    // -------------------------------------------------------------------
    // Data loading
    // -------------------------------------------------------------------

    async function loadEvents() {
        try {
            let data, error;
            if (REGION) {
                ({ data, error } = await eventsSupabase.rpc('get_events_by_cities', {
                    p_cities: REGION.cities,
                    p_state: REGION.state,
                    limit_count: 500,
                    offset_count: 0,
                }));
            } else {
                ({ data, error } = await eventsSupabase.rpc('get_upcoming_events', { limit_count: 500 }));
            }

            if (error) throw error;
            allEvents = Array.isArray(data) ? data : [];
        } catch (err) {
            console.error('Failed to load events:', err);
            allEvents = [];
            showEmptyState(true, 'We could not load events right now. Please try again shortly.');
        }
    }

    // -------------------------------------------------------------------
    // Toolbar: filter button, view toggle, sort
    // -------------------------------------------------------------------

    function bindToolbarEvents() {
        const filterBtn = document.getElementById('eventFilterBtn');
        const filterPanel = document.getElementById('eventFilterPanel');
        const closeFilterBtn = document.getElementById('eventCloseFilterBtn');
        const clearFiltersBtn = document.getElementById('eventClearFiltersBtn');

        filterBtn?.addEventListener('click', () => filterPanel?.classList.toggle('hidden'));
        closeFilterBtn?.addEventListener('click', () => filterPanel?.classList.add('hidden'));
        clearFiltersBtn?.addEventListener('click', clearAllFilters);

        const viewToggle = document.getElementById('eventsViewToggle');
        viewToggle?.querySelectorAll('button[data-view]').forEach((btn) => {
            btn.addEventListener('click', () => setView(btn.dataset.view));
        });

        const sortSelect = document.getElementById('eventSortSelect');
        sortSelect?.addEventListener('change', () => {
            currentSort = sortSelect.value;
            applyFiltersAndRender();
        });

        const searchInput = document.getElementById('eventSearchInput');
        let searchDebounce;
        searchInput?.addEventListener('input', () => {
            clearTimeout(searchDebounce);
            searchDebounce = setTimeout(() => {
                state.search = searchInput.value.trim().toLowerCase();
                applyFiltersAndRender();
            }, 200);
        });

        document.getElementById('eventLoadMoreBtn')?.addEventListener('click', () => renderGrid({ append: true }));
        document.getElementById('eventListLoadMoreBtn')?.addEventListener('click', () => renderList({ append: true }));

        document.getElementById('calendarPrevBtn')?.addEventListener('click', () => {
            calendarCursor.setMonth(calendarCursor.getMonth() - 1);
            renderCalendar();
        });
        document.getElementById('calendarNextBtn')?.addEventListener('click', () => {
            calendarCursor.setMonth(calendarCursor.getMonth() + 1);
            renderCalendar();
        });
    }

    function bindFilterPanelEvents() {
        document.getElementById('eventFreeOnlyFilter')?.addEventListener('change', (e) => {
            state.freeOnly = e.target.checked;
            applyFiltersAndRender();
        });

        document.querySelectorAll('#eventDateFilters .toggle-option').forEach((btn) => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#eventDateFilters .toggle-option').forEach((b) => b.classList.remove('active'));
                btn.classList.add('active');
                state.dateRange = btn.dataset.range;
                applyFiltersAndRender();
            });
        });

        const locationInput = document.getElementById('eventLocationSearch');
        let locDebounce;
        locationInput?.addEventListener('input', () => {
            clearTimeout(locDebounce);
            locDebounce = setTimeout(async () => {
                const query = locationInput.value.trim();
                if (!query) {
                    // Cleared the field — reload the original unfiltered-by-location
                    // set rather than leaving whatever the last city search left behind.
                    await loadEvents();
                    applyFiltersAndRender();
                    return;
                }
                const { data, error } = await eventsSupabase.rpc('get_events_by_location', {
                    p_city: query,
                    limit_count: 200,
                    offset_count: 0,
                });
                if (!error && Array.isArray(data)) {
                    allEvents = data;
                    applyFiltersAndRender();
                }
            }, 300);
        });
    }

    function clearAllFilters() {
        state.search = '';
        state.categories.clear();
        state.dateRange = 'all';
        state.freeOnly = false;

        const searchInput = document.getElementById('eventSearchInput');
        if (searchInput) searchInput.value = '';
        const freeCheckbox = document.getElementById('eventFreeOnlyFilter');
        if (freeCheckbox) freeCheckbox.checked = false;
        document.querySelectorAll('#eventDateFilters .toggle-option').forEach((b) => b.classList.remove('active'));
        document.querySelector('#eventDateFilters .toggle-option[data-range="all"]')?.classList.add('active');
        document.querySelectorAll('#eventCategoryFilters .toggle-option').forEach((b) => b.classList.remove('active'));

        applyFiltersAndRender();
    }

    // -------------------------------------------------------------------
    // View switching
    // -------------------------------------------------------------------

    const VIEW_CONTAINERS = {
        grid: 'eventGridView',
        list: 'eventListView',
        calendar: 'eventCalendarContainer',
        map: 'eventMapContainer',
    };

    function setView(view, opts) {
        opts = opts || {};
        currentView = view;
        if (!opts.skipSave) localStorage.setItem('tgd_events_layout', view);

        Object.entries(VIEW_CONTAINERS).forEach(([key, id]) => {
            const el = document.getElementById(id);
            if (el) el.classList.toggle('hidden', key !== view);
        });

        document.querySelectorAll('#eventsViewToggle button[data-view]').forEach((btn) => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });

        if (view === 'calendar') renderCalendar();
        if (view === 'map') renderMap();
    }

    // -------------------------------------------------------------------
    // Filtering + sorting
    // -------------------------------------------------------------------

    function matchesDateRange(event, range) {
        if (range === 'all') return true;
        const start = new Date(event.start_at);
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);

        if (range === 'today') return start >= startOfToday && start < endOfToday;

        if (range === 'weekend') {
            const day = now.getDay();
            const daysUntilSat = (6 - day + 7) % 7;
            const satStart = new Date(startOfToday.getTime() + daysUntilSat * 86400000);
            const sunEnd = new Date(satStart.getTime() + 2 * 86400000);
            return start >= satStart && start < sunEnd;
        }

        if (range === 'week') {
            const weekEnd = new Date(startOfToday.getTime() + 7 * 86400000);
            return start >= startOfToday && start < weekEnd;
        }

        if (range === 'month') {
            return start.getMonth() === now.getMonth() && start.getFullYear() === now.getFullYear();
        }

        return true;
    }

    function applyFiltersAndRender() {
        filteredEvents = allEvents.filter((event) => {
            if (state.search) {
                const haystack = [event.title, event.tagline, event.category, event.city]
                    .filter(Boolean)
                    .join(' ')
                    .toLowerCase();
                if (!haystack.includes(state.search)) return false;
            }
            if (state.categories.size > 0 && !state.categories.has(event.category)) return false;
            if (state.freeOnly && !event.is_free) return false;
            if (!matchesDateRange(event, state.dateRange)) return false;
            return true;
        });

        filteredEvents.sort((a, b) => {
            if (currentSort === 'az') return (a.title || '').localeCompare(b.title || '');
            if (currentSort === 'furthest') return new Date(b.start_at) - new Date(a.start_at);
            return new Date(a.start_at) - new Date(b.start_at); // soonest (default)
        });

        loadMoreOffset = 0;
        updateFilterCount();
        updateResultsCount();
        showEmptyState(filteredEvents.length === 0);

        if (currentView === 'grid') renderGrid();
        else if (currentView === 'list') renderList();
        else if (currentView === 'calendar') renderCalendar();
        else if (currentView === 'map') renderMap();
    }

    function updateFilterCount() {
        const count = state.categories.size + (state.freeOnly ? 1 : 0) + (state.dateRange !== 'all' ? 1 : 0);
        const badge = document.getElementById('eventFilterCount');
        if (!badge) return;
        badge.textContent = String(count);
        badge.classList.toggle('hidden', count === 0);
    }

    function updateResultsCount() {
        const el = document.getElementById('eventResultsCount');
        if (!el) return;
        const n = filteredEvents.length;
        el.textContent = `${n} event${n === 1 ? '' : 's'}${REGION ? ` in ${REGION.label}` : ''}`;
    }

    function showEmptyState(show, customMessage) {
        const empty = document.getElementById('eventsEmptyState');
        if (!empty) return;
        empty.classList.toggle('hidden', !show);
        if (show && customMessage) {
            const msgEl = empty.querySelector('p:last-child');
            if (msgEl) msgEl.textContent = customMessage;
        }
    }

    // -------------------------------------------------------------------
    // Category filter chips — built dynamically from get_event_category_counts()
    // -------------------------------------------------------------------

    async function renderCategoryFilters() {
        const container = document.getElementById('eventCategoryFilters');
        if (!container) return;

        const { data, error } = await eventsSupabase.rpc('get_event_category_counts');
        if (error || !Array.isArray(data)) return;

        container.innerHTML = data
            .filter((row) => row.category)
            .map((row) => `<button class="toggle-option" data-category="${escapeAttr(row.category)}">${escapeHtml(row.category)} (${row.count})</button>`)
            .join('');

        container.querySelectorAll('button[data-category]').forEach((btn) => {
            btn.addEventListener('click', () => {
                const cat = btn.dataset.category;
                if (state.categories.has(cat)) {
                    state.categories.delete(cat);
                    btn.classList.remove('active');
                } else {
                    state.categories.add(cat);
                    btn.classList.add('active');
                }
                applyFiltersAndRender();
            });
        });
    }

    // -------------------------------------------------------------------
    // Grid view
    // -------------------------------------------------------------------

    function renderGrid(opts) {
        opts = opts || {};
        const container = document.getElementById('eventsContainer');
        const loadMoreBtn = document.getElementById('eventLoadMoreBtn');
        if (!container) return;

        if (!opts.append) {
            container.innerHTML = '';
            loadMoreOffset = 0;
        }

        const slice = filteredEvents.slice(loadMoreOffset, loadMoreOffset + PAGE_SIZE);
        container.insertAdjacentHTML('beforeend', slice.map(buildEventCardHtml).join(''));
        loadMoreOffset += slice.length;

        if (loadMoreBtn) loadMoreBtn.classList.toggle('hidden', loadMoreOffset >= filteredEvents.length);
    }

    function buildEventCardHtml(event) {
        const { dateLabel, timeLabel } = formatCardDateTime(event);
        const badges = [];
        if (event.tier === 'PREMIUM') badges.push('<span class="event-badge event-badge-premium">Premium</span>');
        else if (event.tier === 'FEATURED') badges.push('<span class="event-badge event-badge-featured">Featured</span>');
        if (event.status === 'cancelled') badges.push('<span class="event-badge event-badge-cancelled">Cancelled</span>');
        else if (event.status === 'postponed') badges.push('<span class="event-badge event-badge-postponed">Postponed</span>');
        else if (event.status === 'sold_out') badges.push('<span class="event-badge event-badge-soldout">Sold Out</span>');

        const locationLabel = [event.city, event.state].filter(Boolean).join(', ');

        return `
        <div class="event-card-wrap">
            ${badges.length ? `<div class="event-card-badges">${badges.join('')}</div>` : ''}
            <a class="event-card card-shadow hover-bounce" href="/event/${escapeAttr(event.slug || '')}">
                ${event.poster_image
                    ? `<img class="event-card-poster" src="${escapeAttr(event.poster_image)}" alt="${escapeAttr(event.title || '')}" loading="lazy">`
                    : `<div class="event-card-poster-placeholder"><span>${escapeHtml(event.category || 'Event')}</span></div>`}
                <div class="event-card-body">
                    <span class="event-card-date">${escapeHtml(dateLabel)}${timeLabel ? ` \u00b7 ${escapeHtml(timeLabel)}` : ''}</span>
                    <span class="event-card-title">${escapeHtml(event.title || '')}</span>
                    ${locationLabel ? `<span class="event-card-location">${escapeHtml(event.custom_venue_name || locationLabel)}</span>` : ''}
                </div>
            </a>
        </div>`;
    }

    // -------------------------------------------------------------------
    // List view
    // -------------------------------------------------------------------

    function renderList(opts) {
        opts = opts || {};
        const container = document.getElementById('eventsListContainer');
        const loadMoreBtn = document.getElementById('eventListLoadMoreBtn');
        if (!container) return;

        if (!opts.append) {
            container.innerHTML = '';
            loadMoreOffset = 0;
        }

        const slice = filteredEvents.slice(loadMoreOffset, loadMoreOffset + PAGE_SIZE);
        container.insertAdjacentHTML('beforeend', slice.map(buildEventListRowHtml).join(''));
        loadMoreOffset += slice.length;

        if (loadMoreBtn) loadMoreBtn.classList.toggle('hidden', loadMoreOffset >= filteredEvents.length);
    }

    function buildEventListRowHtml(event) {
        const { dateLabel, timeLabel } = formatCardDateTime(event);
        const locationLabel = [event.city, event.state].filter(Boolean).join(', ');
        return `
        <a class="flex items-center gap-4 bg-white rounded-lg p-3 card-shadow hover-bounce" href="/event/${escapeAttr(event.slug || '')}">
            ${event.poster_image
                ? `<img src="${escapeAttr(event.poster_image)}" alt="${escapeAttr(event.title || '')}" class="w-16 h-16 rounded-lg object-cover flex-shrink-0" loading="lazy">`
                : `<div class="w-16 h-16 rounded-lg flex-shrink-0" style="background:linear-gradient(135deg,#045093,#0a6bc2);"></div>`}
            <div class="min-w-0 flex-1">
                <div class="text-xs font-bold" style="color:#045093;">${escapeHtml(dateLabel)}${timeLabel ? ` \u00b7 ${escapeHtml(timeLabel)}` : ''}</div>
                <div class="text-sm font-bold text-gray-900 truncate">${escapeHtml(event.title || '')}</div>
                ${locationLabel ? `<div class="text-xs text-gray-500 truncate">${escapeHtml(event.custom_venue_name || locationLabel)}</div>` : ''}
            </div>
            ${event.is_free ? '<span class="event-price-chip event-price-free flex-shrink-0">Free</span>' : ''}
        </a>`;
    }

    // -------------------------------------------------------------------
    // Calendar view
    // -------------------------------------------------------------------

    function renderCalendar() {
        const grid = document.getElementById('eventCalendarGrid');
        const label = document.getElementById('calendarMonthLabel');
        if (!grid || !label) return;

        const year = calendarCursor.getFullYear();
        const month = calendarCursor.getMonth();
        label.textContent = calendarCursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

        const firstOfMonth = new Date(year, month, 1);
        const startOffset = firstOfMonth.getDay(); // 0 = Sunday
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date();

        // Group this month's filtered events by day-of-month for O(1) lookup while building cells.
        const eventsByDay = {};
        filteredEvents.forEach((event) => {
            const d = new Date(event.start_at);
            if (d.getFullYear() === year && d.getMonth() === month) {
                const day = d.getDate();
                (eventsByDay[day] = eventsByDay[day] || []).push(event);
            }
        });

        const weekdayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
            .map((d) => `<div class="event-calendar-weekday">${d}</div>`)
            .join('');

        const emptyCells = Array.from({ length: startOffset }, () => '<div class="event-calendar-day is-empty"></div>').join('');

        const dayCells = Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
            const dayEvents = eventsByDay[day] || [];
            const dots = dayEvents
                .slice(0, 4)
                .map((e) => {
                    const tierClass = e.tier === 'PREMIUM' ? 'tier-premium' : e.tier === 'FEATURED' ? 'tier-featured' : '';
                    return `<span class="event-calendar-dot ${tierClass}" data-slug="${escapeAttr(e.slug || '')}" title="${escapeAttr(e.title || '')}"></span>`;
                })
                .join('');
            const more = dayEvents.length > 4 ? `<span class="event-calendar-more">+${dayEvents.length - 4}</span>` : '';

            return `<div class="event-calendar-day${isToday ? ' is-today' : ''}" data-day="${day}">
                <span class="event-calendar-day-num">${day}</span>
                <div class="event-calendar-dot-row">${dots}${more}</div>
            </div>`;
        }).join('');

        grid.innerHTML = weekdayHeaders + emptyCells + dayCells;

        grid.querySelectorAll('.event-calendar-day[data-day]').forEach((cell) => {
            cell.addEventListener('click', () => {
                const day = parseInt(cell.dataset.day, 10);
                showCalendarDayDetail(year, month, day, eventsByDay[day] || []);
            });
        });
    }

    function showCalendarDayDetail(year, month, day, dayEvents) {
        const detail = document.getElementById('calendarDayDetail');
        if (!detail) return;

        if (dayEvents.length === 0) {
            detail.classList.add('hidden');
            return;
        }

        const dateLabel = new Date(year, month, day).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
        detail.innerHTML = `<h4 class="font-semibold text-gray-900 mb-3">${escapeHtml(dateLabel)}</h4>` +
            `<div class="space-y-2">${dayEvents.map(buildEventListRowHtml).join('')}</div>`;
        detail.classList.remove('hidden');
    }

    // -------------------------------------------------------------------
    // Map view — mirrors js/listings.js's Leaflet + markercluster setup,
    // using events' coordinates jsonb field instead of listings.coordinates.
    // -------------------------------------------------------------------

    function renderMap() {
        const container = document.getElementById('eventsMap');
        const loading = document.getElementById('eventMapLoading');
        if (!container || !window.L) return;

        if (!map) {
            map = window.L.map(container, { scrollWheelZoom: true }).setView([41.8781, -87.6298], 9); // Chicago default
            window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors',
            }).addTo(map);
            markerClusterGroup = window.L.markerClusterGroup();
            map.addLayer(markerClusterGroup);
        }

        markerClusterGroup.clearLayers();

        const bounds = [];
        filteredEvents.forEach((event) => {
            const coords = event.coordinates;
            if (!coords || typeof coords.lat !== 'number' || typeof coords.lng !== 'number') return;

            const tierClass = event.tier === 'PREMIUM' ? 'tier-premium' : event.tier === 'FEATURED' ? 'tier-featured' : 'tier-free';
            const icon = window.L.divIcon({
                className: `custom-marker event-marker ${tierClass}`,
                html: '<div></div>',
                iconSize: [28, 28],
            });

            const marker = window.L.marker([coords.lat, coords.lng], { icon });
            const { dateLabel, timeLabel } = formatCardDateTime(event);
            // .map-popup-content and .map-popup-title are real, shared
            // classes already styled in css/listings.css — reused as-is.
            // .event-map-popup-sub / .event-map-popup-link are NOT shared
            // site classes (listings.css has no generic "subtitle"/"link"
            // popup class, only .map-popup-tagline, which is specifically
            // a business tagline field that doesn't apply here) — defined
            // fresh in css/events.css instead of misusing a
            // listing-specific class name.
            marker.bindPopup(`
                <div class="map-popup-content">
                    <div class="map-popup-title">${escapeHtml(event.title || '')}</div>
                    <div class="event-map-popup-sub">${escapeHtml(dateLabel)}${timeLabel ? ` \u00b7 ${escapeHtml(timeLabel)}` : ''}</div>
                    <a href="/event/${escapeAttr(event.slug || '')}" class="event-map-popup-link">View Event</a>
                </div>
            `);
            markerClusterGroup.addLayer(marker);
            bounds.push([coords.lat, coords.lng]);
        });

        if (bounds.length > 0) {
            map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
        }

        if (loading) loading.style.display = 'none';
        setTimeout(() => map.invalidateSize(), 100);
    }

    // -------------------------------------------------------------------
    // Shared formatting / escaping helpers
    // -------------------------------------------------------------------

    function formatCardDateTime(event) {
        const start = new Date(event.start_at);
        if (Number.isNaN(start.getTime())) return { dateLabel: '', timeLabel: '' };
        const dateLabel = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const timeLabel = event.all_day ? '' : start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        return { dateLabel, timeLabel };
    }

    function escapeHtml(text) {
        if (text === null || text === undefined) return '';
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function escapeAttr(text) {
        return escapeHtml(text);
    }
})();
