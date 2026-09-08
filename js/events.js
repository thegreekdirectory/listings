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

    // Split View state — mirrors js/listings.js's own module-level
    // variables of the same names/purpose (splitViewActive, userLocation,
    // estimatedUserLocation, locationButtonActive, mapMoved,
    // selectedSplitEventId — the events-domain equivalent of Listings'
    // selectedSplitListingId). window.splitEventsMap /
    // window.splitEventsMarkerClusterGroup are intentionally NOT
    // pre-declared here, same as Listings' own window.splitMap /
    // window.splitMarkerClusterGroup — both are created lazily, once,
    // the first time initSplitEventsMap() runs, not before.
    let splitViewActive = false;
    let userLocation = null;
    let estimatedUserLocation = null;
    let locationButtonActive = false;
    let mapMoved = false;
    let selectedSplitEventId = null;
    let userLocationMarker = null;
    let splitUserLocationMarker = null;

    // Regional-page mode — set as a global by _render-region-page.js
    // before this script loads. See that file's header comment.
    const REGION = window.TGD_EVENTS_REGION || null;

    const state = {
        search: '',
        categories: new Set(),
        dateRange: 'all',
        customDateStart: '',
        customDateEnd: '',
        freeOnly: false,
        hideUnavailable: false,
    };

    // -------------------------------------------------------------------
    // Init
    // -------------------------------------------------------------------

    document.addEventListener('DOMContentLoaded', init);

    // -------------------------------------------------------------------
    // Query parameters — filters, view, and sort all round-trip through
    // the URL so a filtered view can be refreshed, shared, or reached via
    // the back button. Uses replaceState (not pushState): every filter
    // tweak replacing the current history entry, rather than creating a
    // new one per click, keeps the back button meaningful (leaves the
    // page, doesn't step through 15 individual filter toggles first).
    // -------------------------------------------------------------------

    const QUERY_PARAM_KEYS = ['q', 'cat', 'when', 'from', 'to', 'free', 'avail', 'view', 'sort'];

    function syncQueryParams() {
        const params = new URLSearchParams(window.location.search);
        QUERY_PARAM_KEYS.forEach((key) => params.delete(key));

        if (state.search) params.set('q', state.search);
        if (state.categories.size > 0) params.set('cat', [...state.categories].join(','));
        if (state.dateRange !== 'all') params.set('when', state.dateRange);
        if (state.dateRange === 'custom' && state.customDateStart) params.set('from', state.customDateStart);
        if (state.dateRange === 'custom' && state.customDateEnd) params.set('to', state.customDateEnd);
        if (state.freeOnly) params.set('free', '1');
        if (state.hideUnavailable) params.set('avail', '1');
        if (currentView !== 'grid') params.set('view', currentView);
        if (currentSort !== 'soonest') params.set('sort', currentSort);

        const query = params.toString();
        const newUrl = window.location.pathname + (query ? `?${query}` : '');
        history.replaceState(null, '', newUrl);
    }

    // Restores state{}/currentView/currentSort from the URL. Returns the
    // restored category list separately (rather than touching DOM
    // buttons directly) because the category filter buttons don't exist
    // yet at this point — renderCategoryFilters() builds them
    // asynchronously later in init(), after an RPC round-trip.
    function readQueryParamsIntoState() {
        const params = new URLSearchParams(window.location.search);
        const restoredCategories = params.get('cat') ? params.get('cat').split(',').filter(Boolean) : [];

        state.search = params.get('q') || '';
        state.categories = new Set(restoredCategories);
        state.dateRange = params.get('when') || 'all';
        state.customDateStart = params.get('from') || '';
        state.customDateEnd = params.get('to') || '';
        state.freeOnly = params.get('free') === '1';
        state.hideUnavailable = params.get('avail') === '1';

        const view = params.get('view');
        if (view && VIEW_CONTAINERS[view]) currentView = view;

        const sort = params.get('sort');
        if (sort && ['soonest', 'az', 'furthest'].includes(sort)) currentSort = sort;

        return restoredCategories;
    }

    // Applies everything restoreable immediately (search box, date
    // toggle, custom date inputs, checkboxes, sort select) — anything
    // that already exists in the DOM at init() time. Category buttons
    // are handled separately in renderCategoryFilters() itself.
    function restoreDomControlsFromState() {
        const searchInput = document.getElementById('eventSearchInput');
        if (searchInput && state.search) searchInput.value = state.search;

        document.querySelectorAll('#eventDateFilters .toggle-option').forEach((b) => {
            b.classList.toggle('active', b.dataset.range === state.dateRange);
        });
        if (state.dateRange === 'custom') {
            document.getElementById('eventCustomDateRow')?.classList.remove('hidden');
            const startInput = document.getElementById('eventCustomDateStart');
            const endInput = document.getElementById('eventCustomDateEnd');
            if (startInput) startInput.value = state.customDateStart;
            if (endInput) endInput.value = state.customDateEnd;
        }

        const freeCheckbox = document.getElementById('eventFreeOnlyFilter');
        if (freeCheckbox) freeCheckbox.checked = state.freeOnly;
        const hideUnavailableCheckbox = document.getElementById('eventHideUnavailableFilter');
        if (hideUnavailableCheckbox) hideUnavailableCheckbox.checked = state.hideUnavailable;

        const sortSelect = document.getElementById('eventSortSelect');
        if (sortSelect) sortSelect.value = currentSort;
    }

    async function init() {
        if (!window.supabase || typeof window.supabase.createClient !== 'function') {
            console.error('Supabase client library not loaded.');
            return;
        }
        eventsSupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

        if (REGION) {
            applyRegionalPageMode();
        }

        const restoredCategories = readQueryParamsIntoState();
        restoreDomControlsFromState();

        bindToolbarEvents();
        bindFilterPanelEvents();
        setView(currentView, { skipSave: true });

        await loadEvents();
        renderCategoryFilters(restoredCategories);
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

        // Map controls — same three buttons/behaviors as
        // js/listings.js's own locateBtn/resetMapBtn/splitViewBtn.
        document.getElementById('eventLocateBtn')?.addEventListener('click', requestEventsPreciseLocation);
        document.getElementById('eventResetMapBtn')?.addEventListener('click', () => {
            if (map) map.setView([41.8781, -87.6298], 9);
        });
        document.getElementById('eventSplitViewBtn')?.addEventListener('click', toggleSplitEventsView);

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

        document.getElementById('eventHideUnavailableFilter')?.addEventListener('change', (e) => {
            state.hideUnavailable = e.target.checked;
            applyFiltersAndRender();
        });

        document.querySelectorAll('#eventDateFilters .toggle-option').forEach((btn) => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#eventDateFilters .toggle-option').forEach((b) => b.classList.remove('active'));
                btn.classList.add('active');
                state.dateRange = btn.dataset.range;
                document.getElementById('eventCustomDateRow')?.classList.toggle('hidden', btn.dataset.range !== 'custom');
                applyFiltersAndRender();
            });
        });

        const customDateStart = document.getElementById('eventCustomDateStart');
        const customDateEnd = document.getElementById('eventCustomDateEnd');
        customDateStart?.addEventListener('change', () => {
            state.customDateStart = customDateStart.value;
            applyFiltersAndRender();
        });
        customDateEnd?.addEventListener('change', () => {
            state.customDateEnd = customDateEnd.value;
            applyFiltersAndRender();
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
        state.customDateStart = '';
        state.customDateEnd = '';
        state.freeOnly = false;
        state.hideUnavailable = false;

        const searchInput = document.getElementById('eventSearchInput');
        if (searchInput) searchInput.value = '';
        const freeCheckbox = document.getElementById('eventFreeOnlyFilter');
        if (freeCheckbox) freeCheckbox.checked = false;
        const hideUnavailableCheckbox = document.getElementById('eventHideUnavailableFilter');
        if (hideUnavailableCheckbox) hideUnavailableCheckbox.checked = false;
        const customStartInput = document.getElementById('eventCustomDateStart');
        if (customStartInput) customStartInput.value = '';
        const customEndInput = document.getElementById('eventCustomDateEnd');
        if (customEndInput) customEndInput.value = '';
        document.getElementById('eventCustomDateRow')?.classList.add('hidden');
        document.querySelectorAll('#eventDateFilters .toggle-option').forEach((b) => b.classList.remove('active'));
        document.querySelector('#eventDateFilters .toggle-option[data-range="all"]')?.classList.add('active');
        document.querySelectorAll('#eventCategoryFilters .toggle-option').forEach((b) => b.classList.remove('active'));

        applyFiltersAndRender();
    }

    // -------------------------------------------------------------------
    // View switching
    // -------------------------------------------------------------------

    const FEED_URL = 'https://thegreekdirectory.org/events/feed.ics';

    function toggleFeedSubscribeMenu() {
        const menu = document.getElementById('feedSubscribeMenu');
        if (!menu) return;
        menu.classList.toggle('active');
    }

    document.addEventListener('click', (e) => {
        if (e.target.closest('.add-to-calendar-wrap')) return;
        document.getElementById('feedSubscribeMenu')?.classList.remove('active');
    });

    function copyFeedLink() {
        const button = document.querySelector('#feedSubscribeMenu button');
        const flash = (text) => {
            if (!button) return;
            const original = button.textContent;
            button.textContent = text;
            setTimeout(() => { button.textContent = original; }, 1800);
        };
        navigator.clipboard.writeText(FEED_URL).then(() => {
            flash('Copied!');
        }).catch(() => {
            // Fallback for older browsers / non-HTTPS contexts, matching
            // js/event-page.js's own copyShareLink pattern — there's no
            // visible <input> here to .select(), so a temporary
            // off-screen one is created just for the copy operation.
            const tempInput = document.createElement('input');
            tempInput.value = FEED_URL;
            tempInput.style.position = 'fixed';
            tempInput.style.left = '-9999px';
            document.body.appendChild(tempInput);
            tempInput.select();
            document.execCommand('copy');
            document.body.removeChild(tempInput);
            flash('Copied!');
        });
    }

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

        // Split View is a sub-mode of Map view specifically (its own
        // toggle button lives inside the map's own controls, same as
        // Listings' splitViewBtn). Switching to Grid/List/Calendar while
        // it's active needs to close it first — same safeguard as
        // js/listings.js's toggleMap() calling toggleSplitView() when
        // splitViewActive is true — otherwise its DOM/Leaflet instance
        // stays alive underneath whatever view gets shown instead
        // (VIEW_CONTAINERS below doesn't know about
        // #eventSplitViewContainer at all, so nothing would ever hide it
        // on its own). Switching TO 'map' while already in Split View is
        // fine as-is: re-clicking Map shouldn't kick the user out of it.
        if (splitViewActive && view !== 'map') {
            toggleSplitEventsView();
        }

        Object.entries(VIEW_CONTAINERS).forEach(([key, id]) => {
            const el = document.getElementById(id);
            if (el) el.classList.toggle('hidden', key !== view);
        });

        document.querySelectorAll('#eventsViewToggle button[data-view]').forEach((btn) => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });

        updateFilterPanelPosition(view);

        if (view === 'grid') renderGrid();
        if (view === 'list') renderList();
        if (view === 'calendar') renderCalendar();
        if (view === 'map') renderMap();

        if (!opts.skipSave) syncQueryParams();
    }

    // Moves the single #eventFilterPanel between its two DOM slots
    // depending on the active view — sidebar slot for Grid/List (the
    // default), back to its original overlay slot for Calendar/Map.
    // See functions/events/_app-shell.js's own comments on
    // #eventFilterPanelOverlaySlot / #eventDesktopFiltersSlot for why
    // this moves ONE panel rather than keeping two synced copies.
    // Actually reparenting the panel (not just a CSS class flip) is
    // what's needed here specifically: a CSS-only "hide it here, show a
    // copy there" would require the two-copy approach this deliberately
    // avoids, since there's only one #eventFilterPanel in the DOM.
    // Safe to call on every view change, including grid<->list (an
    // no-op moveTo when already in the target slot — appendChild on a
    // node already in that exact position is a harmless no-op, not a
    // detach/reattach that would lose scroll position or focus).
    function updateFilterPanelPosition(view) {
        const panel = document.getElementById('eventFilterPanel');
        const sidebarSlot = document.getElementById('eventDesktopFiltersSlot');
        const overlaySlot = document.getElementById('eventFilterPanelOverlaySlot');
        if (!panel || !sidebarSlot || !overlaySlot) return;

        const wantsSidebar = (view === 'grid' || view === 'list');
        const targetSlot = wantsSidebar ? sidebarSlot : overlaySlot;
        if (panel.parentElement !== targetSlot) {
            targetSlot.appendChild(panel);
        }

        // .events-sidebar-mode on <body> is a pure CSS hook (see
        // css/events.css) that hides the "Filters" toolbar button at
        // desktop widths while the panel is sitting in the sidebar —
        // clicking it would otherwise appear to do nothing, since a
        // persistent sticky sidebar isn't something the button's
        // show/hide toggle logic (bindToolbarEvents' plain
        // classList.toggle('hidden')) is meant to control. Mirrors
        // js/listings.js's own checkFilterPosition(), which hides
        // #desktopFilterToggleBtn the same way once its (opt-in, off by
        // default there) left-sidebar mode is active.
        document.body.classList.toggle('events-sidebar-mode', wantsSidebar);
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

        if (range === 'custom') {
            if (state.customDateStart) {
                const rangeStart = new Date(state.customDateStart + 'T00:00:00');
                if (start < rangeStart) return false;
            }
            if (state.customDateEnd) {
                // Inclusive of the whole end day, not just up to midnight.
                const rangeEnd = new Date(state.customDateEnd + 'T23:59:59.999');
                if (start > rangeEnd) return false;
            }
            return true;
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
            if (state.hideUnavailable && ['cancelled', 'postponed', 'sold_out'].includes(event.status)) return false;
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

        syncQueryParams();
    }

    function updateFilterCount() {
        const count = state.categories.size
            + (state.freeOnly ? 1 : 0)
            + (state.hideUnavailable ? 1 : 0)
            + (state.dateRange !== 'all' ? 1 : 0);
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

    async function renderCategoryFilters(restoredCategories) {
        const container = document.getElementById('eventCategoryFilters');
        if (!container) return;

        const { data, error } = await eventsSupabase.rpc('get_event_category_counts');
        if (error || !Array.isArray(data)) return;

        container.innerHTML = data
            .filter((row) => row.category)
            .map((row) => `<button class="toggle-option" data-category="${escapeAttr(row.category)}">${escapeHtml(row.category)} (${row.count})</button>`)
            .join('');

        const restoredSet = new Set(restoredCategories || []);
        container.querySelectorAll('button[data-category]').forEach((btn) => {
            // state.categories was already populated by readQueryParamsIntoState()
            // earlier in init() — this only needs to reflect that in the
            // buttons themselves, which didn't exist yet at that point.
            if (restoredSet.has(btn.dataset.category)) btn.classList.add('active');

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

    // Tier/status badges — factored out of buildEventCardHtml (which
    // used to inline this same logic) so buildEventMapPopupContent
    // below can reuse it too, rather than a third copy-paste of the
    // same tier/status checks. Mirrors js/listings.js's buildBadges()
    // shape (build an array, join it), minus the hours-based
    // open/closed/opening-soon/closing-soon badges, which don't apply
    // to events — status/cancelled/postponed/sold_out already covers
    // events' equivalent "is this actually happening" concern.
    function buildEventBadges(event) {
        const badges = [];
        if (event.tier === 'PREMIUM') badges.push('<span class="event-badge event-badge-premium">Premium</span>');
        else if (event.tier === 'FEATURED') badges.push('<span class="event-badge event-badge-featured">Featured</span>');
        if (event.status === 'cancelled') badges.push('<span class="event-badge event-badge-cancelled">Cancelled</span>');
        else if (event.status === 'postponed') badges.push('<span class="event-badge event-badge-postponed">Postponed</span>');
        else if (event.status === 'sold_out') badges.push('<span class="event-badge event-badge-soldout">Sold Out</span>');
        return badges;
    }

    function buildEventCardHtml(event) {
        const { dateLabel, timeLabel } = formatCardDateTime(event);
        const badges = buildEventBadges(event);

        const locationLabel = [event.city, event.state].filter(Boolean).join(', ');

        return `
        <div class="event-card-wrap">
            ${badges.length ? `<div class="event-card-badges">${badges.join('')}</div>` : ''}
            <a class="event-card card-shadow" href="/event/${escapeAttr(event.slug || '')}">
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
        <a class="flex items-center gap-4 bg-white rounded-lg p-3 card-shadow hover-bounce event-list-row" href="/event/${escapeAttr(event.slug || '')}">
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

    // "Current Location" — a focused port of js/listings.js's
    // requestPreciseLocation()/addUserLocationMarker(): precise
    // browser-geolocation-on-click, recentering the map and dropping a
    // marker. Deliberately NOT porting that file's estimateLocationByIP()
    // / estimatedUserLocation / radius-filter integration alongside it —
    // those exist there to feed a distance-based sort/radius filter
    // events has no equivalent of (confirmed: no radius filter anywhere
    // in this file or in #eventFilterPanel), so porting the automatic
    // IP-estimation-on-load machinery too would be introducing a new,
    // unrequested sorting feature rather than the "Current Location...
    // functionality EXACTLY like in Listings" that was actually asked
    // for — the button's own click-to-locate behavior, not everything
    // else that happens to reference userLocation in that file.
    const LOCATION_PERMISSION_STORAGE_KEY = 'tgd_events_location_permission';

    function storeEventsLocationPermission(granted) {
        try {
            localStorage.setItem(LOCATION_PERMISSION_STORAGE_KEY, granted ? 'true' : 'false');
        } catch (_) {
            // no-op — private browsing / storage disabled
        }
    }

    function requestEventsPreciseLocation() {
        if (!navigator.geolocation) {
            console.error('Geolocation not supported by this browser');
            return;
        }

        const onSuccess = (position) => {
            storeEventsLocationPermission(true);
            userLocation = { lat: position.coords.latitude, lng: position.coords.longitude };
            locationButtonActive = true;
            updateLocateButtonActiveState();
            if (map) {
                map.setView([userLocation.lat, userLocation.lng], 13);
                addEventsUserLocationMarker(map, false);
            }
            if (window.splitEventsMap) {
                window.splitEventsMap.setView([userLocation.lat, userLocation.lng], 13);
                addEventsUserLocationMarker(window.splitEventsMap, true);
            }
        };

        const onError = (error) => {
            locationButtonActive = false;
            updateLocateButtonActiveState();
            if (error.code === 1) {
                console.log('Geolocation permission denied');
                storeEventsLocationPermission(false);
            } else if (error.code === 3) {
                console.log('Geolocation timeout');
            } else {
                console.log('Location error:', error.message);
            }
        };

        navigator.geolocation.getCurrentPosition(
            onSuccess,
            onError,
            { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
        );
    }

    function updateLocateButtonActiveState() {
        document.querySelectorAll('#eventLocateBtn, #splitEventLocateBtn').forEach((btn) => {
            btn.classList.toggle('locate-active', locationButtonActive);
        });
    }

    // isSplit picks which of the two marker-holding variables
    // (userLocationMarker for the plain map, splitUserLocationMarker for
    // the split-view map) gets updated — same two-marker split
    // js/listings.js keeps for the same reason: the plain map and the
    // split map are two independent Leaflet instances that can both be
    // alive if a visitor opens Split View without first closing the
    // plain map view (setView() hides the container but doesn't tear
    // down the Leaflet instance itself — see renderMap()'s own "already
    // initialized" guard below).
    function addEventsUserLocationMarker(mapInstance, isSplit) {
        if (!mapInstance || !userLocation) return;
        const existing = isSplit ? splitUserLocationMarker : userLocationMarker;
        if (existing) mapInstance.removeLayer(existing);
        const userIcon = window.L.divIcon({
            html: '<div style="width: 16px; height: 16px; background: #4285F4; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 8px rgba(0,0,0,0.3);"></div>',
            className: '', iconSize: [22, 22], iconAnchor: [11, 11],
        });
        const marker = window.L.marker([userLocation.lat, userLocation.lng], {
            icon: userIcon, zIndexOffset: 1000,
        }).addTo(mapInstance);
        marker.bindPopup('<strong>Your Location</strong>');
        if (isSplit) splitUserLocationMarker = marker;
        else userLocationMarker = marker;
    }

    // Builds one event marker and adds it to the given cluster group —
    // factored out of renderMap() so updateSplitEventsMapMarkers() below
    // can build identical markers for the split-view map's own cluster
    // group without a second copy of this same tier-class/icon/popup
    // logic. Returns the marker's [lat, lng] pair (for bounds-fitting by
    // the caller) or null if the event has no usable coordinates.
    function addEventMarkerToCluster(event, clusterGroup) {
        const coords = event.coordinates;
        if (!coords || typeof coords.lat !== 'number' || typeof coords.lng !== 'number') return null;

        const tierClass = event.tier === 'PREMIUM' ? 'tier-premium' : event.tier === 'FEATURED' ? 'tier-featured' : 'tier-free';
        const icon = window.L.divIcon({
            className: `custom-marker event-marker ${tierClass}`,
            html: '<div></div>',
            iconSize: [28, 28],
        });

        const marker = window.L.marker([coords.lat, coords.lng], { icon, eventId: event.id });
        marker.bindPopup(buildEventMapPopupContent(event), { maxWidth: 320, className: 'custom-popup' });
        marker.on('popupopen', () => {
            const closeBtn = document.querySelector('.leaflet-popup-close-button');
            if (closeBtn) closeBtn.textContent = '\u00d7';
        });
        clusterGroup.addLayer(marker);
        return [coords.lat, coords.lng];
    }

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
            const pos = addEventMarkerToCluster(event, markerClusterGroup);
            if (pos) bounds.push(pos);
        });

        if (bounds.length > 0) {
            map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
        }

        if (loading) loading.style.display = 'none';
        setTimeout(() => map.invalidateSize(), 100);
    }

    // -------------------------------------------------------------------
    // Split View — mirrors js/listings.js's toggleSplitView() /
    // renderSplitViewListings() / updateSplitMapMarkers() / initSplitMap().
    //
    // Deliberately NOT ported alongside these: the star/favorite button
    // (events have no starred-events system), the distance/radius-based
    // map filtering (selectedRadius / mapVisibleRadiusMiles /
    // calculateDistance — events have no radius filter, confirmed
    // earlier, so there is nothing for that filtering to be driven by),
    // and the "closest to me" sort option's automatic
    // requestPreciseLocation('closest-sort') trigger (same reason — no
    // distance-based sort exists for events to wire that into). Every
    // event within the current filtered set is always shown on the
    // split map, same as the plain map view already does.
    // -------------------------------------------------------------------

    function toggleSplitEventsView() {
        splitViewActive = !splitViewActive;

        if (splitViewActive) {
            document.getElementById('eventMapContainer')?.classList.add('hidden');
            const splitContainer = document.getElementById('eventSplitViewContainer');
            if (!splitContainer) { splitViewActive = false; return; }
            splitContainer.classList.remove('hidden');
            splitContainer.className = 'split-view-container';
            splitContainer.style.position = 'relative';
            splitContainer.style.zIndex = '10';
            splitContainer.innerHTML = `
                <div class="split-view-listings">
                    <div class="mb-3 flex items-center justify-between px-2">
                        <p class="text-sm text-gray-600" id="splitEventResultsCount"></p>
                    </div>
                    <div id="splitEventsListContainer"></div>
                </div>
                <div class="split-view-map" style="position: relative; z-index: 10;">
                    <div id="splitEventsMap"></div>
                    <div class="map-controls">
                        <button class="map-control-btn" id="splitEventViewToggleBtn" title="Exit split view">
                            <svg width="16" height="16" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" fill="#045093"><rect x="15" y="4" width="2" height="24"/><path d="M10,7V25H4V7h6m0-2H4A2,2,0,0,0,2,7V25a2,2,0,0,0,2,2h6a2,2,0,0,0,2-2V7a2,2,0,0,0-2-2Z"/><path d="M28,7V25H22V7h6m0-2H22a2,2,0,0,0-2,2V25a2,2,0,0,0,2,2h6a2,2,0,0,0,2-2V7a2,2,0,0,0-2-2Z"/></svg>
                            <span class="desktop-only">Exit Split View</span>
                        </button>
                        <button class="map-control-btn" id="splitEventLocateBtn" title="Find my location">
                            <svg id="splitEventLocateBtnIcon" width="16" height="16" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" fill="#045093">
                                <polygon points="0,9.28 9.894,9.99 10.78,20 20,0"/>
                            </svg>
                            <span class="desktop-only">Current Location</span>
                        </button>
                        <button class="map-control-btn" id="splitEventResetMapBtn" title="Reset map view">
                            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                            <span class="desktop-only">Reload</span>
                        </button>
                    </div>
                </div>
            `;

            document.getElementById('splitEventViewToggleBtn')?.addEventListener('click', toggleSplitEventsView);
            document.getElementById('splitEventLocateBtn')?.addEventListener('click', requestEventsPreciseLocation);
            document.getElementById('splitEventResetMapBtn')?.addEventListener('click', () => {
                if (window.splitEventsMap) window.splitEventsMap.setView([41.8781, -87.6298], 9);
            });

            renderSplitEventsListings();
            initSplitEventsMap();
        } else {
            const splitContainer = document.getElementById('eventSplitViewContainer');
            if (splitContainer) {
                splitContainer.classList.add('hidden');
                splitContainer.innerHTML = '';
            }
            document.getElementById('eventMapContainer')?.classList.remove('hidden');
            setTimeout(() => {
                if (map) {
                    map.invalidateSize();
                }
            }, 100);
        }
    }

    function renderSplitEventsListings() {
        const container = document.getElementById('splitEventsListContainer');
        if (!container) return;

        const splitEvents = filteredEvents;
        const resultsCount = document.getElementById('splitEventResultsCount');

        if (splitEvents.length === 0) {
            container.innerHTML = '<p class="text-center text-gray-600 py-12">No events found.</p>';
            if (resultsCount) resultsCount.textContent = '0 events found';
            return;
        }

        if (resultsCount) {
            resultsCount.textContent = `${splitEvents.length} ${splitEvents.length === 1 ? 'event' : 'events'} found`;
        }

        container.className = 'space-y-3';
        container.innerHTML = splitEvents.map((event) => {
            const { dateLabel, timeLabel } = formatCardDateTime(event);
            const badges = buildEventBadges(event);
            const locationLabel = [event.city, event.state].filter(Boolean).join(', ');
            const hasCoordinates = event.coordinates && typeof event.coordinates.lat === 'number' && typeof event.coordinates.lng === 'number';
            const isSelected = String(selectedSplitEventId) === String(event.id);
            const eventUrl = `/event/${escapeAttr(event.slug || '')}`;
            const posterImage = event.poster_image || '';
            const posterHtml = posterImage
                ? `<img src="${escapeAttr(posterImage)}" alt="${escapeAttr(event.title || '')}" class="w-16 h-16 rounded-lg object-cover flex-shrink-0">`
                : '<div class="w-16 h-16 rounded-lg bg-gray-200 flex-shrink-0 flex items-center justify-center text-gray-400 text-xs">No image</div>';

            const innerContent = `
                <div class="flex gap-1 mb-1 flex-wrap">${badges.join('')}</div>
                <h3 class="text-base font-bold text-gray-900 mb-1 truncate">${escapeHtml(event.title || '')}</h3>
                <p class="text-xs text-gray-600 mb-1 truncate">${escapeHtml(dateLabel)}${timeLabel ? ` \u00b7 ${escapeHtml(timeLabel)}` : ''}</p>
                ${locationLabel ? `
                    <div class="text-xs text-gray-600">
                        <div class="flex items-center gap-1 truncate">
                            <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                            <span class="truncate">${escapeHtml(event.custom_venue_name || locationLabel)}</span>
                        </div>
                    </div>
                ` : ''}
            `;

            return `
                <div class="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-3 relative split-listing-item ${isSelected ? 'selected-listing' : ''}" style="margin-right: 8px; display: flex; gap: 12px;">
                    ${hasCoordinates ? `
                        <button type="button" class="split-listing-content" onclick="if(typeof selectSplitEvent === 'function') selectSplitEvent('${escapeAttr(event.id)}', ${event.coordinates.lat}, ${event.coordinates.lng});">
                            ${posterHtml}
                            <div class="flex-1 min-w-0 overflow-hidden ${isSelected ? 'pr-2' : 'pr-8'}">${innerContent}</div>
                        </button>
                        ${isSelected ? `<a href="${escapeAttr(eventUrl)}" class="split-listing-visit-btn">Visit</a>` : ''}
                    ` : `
                        <a href="${escapeAttr(eventUrl)}" class="flex gap-3 flex-1 min-w-0">
                            ${posterHtml}
                            <div class="flex-1 min-w-0 overflow-hidden pr-8">${innerContent}</div>
                        </a>
                    `}
                </div>
            `;
        }).join('');
    }

    function updateSplitEventsMapMarkers() {
        if (!window.splitEventsMap || !window.splitEventsMarkerClusterGroup) return;
        window.splitEventsMarkerClusterGroup.clearLayers();

        const bounds = [];
        filteredEvents.forEach((event) => {
            const pos = addEventMarkerToCluster(event, window.splitEventsMarkerClusterGroup);
            if (pos) bounds.push(pos);
        });

        if (bounds.length > 0) {
            window.splitEventsMap.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
        }

        setTimeout(() => window.splitEventsMap.invalidateSize(), 250);
    }

    function initSplitEventsMap() {
        const splitMapDiv = document.getElementById('splitEventsMap');
        if (!splitMapDiv || !window.L) return;

        window.splitEventsMap = window.L.map('splitEventsMap', {
            preferCanvas: true,
            center: userLocation ? [userLocation.lat, userLocation.lng] : [41.8781, -87.6298],
            zoom: userLocation ? 13 : 9,
            zoomControl: true,
            scrollWheelZoom: false,
            touchZoom: true,
            doubleClickZoom: true,
        });

        window.splitEventsMap.on('click', () => window.splitEventsMap.scrollWheelZoom.enable());
        window.splitEventsMap.on('mouseout', () => window.splitEventsMap.scrollWheelZoom.disable());

        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 19,
            updateWhenIdle: true,
            updateWhenZooming: false,
            keepBuffer: 1,
            reuseTiles: true,
        }).addTo(window.splitEventsMap);

        window.splitEventsMarkerClusterGroup = window.L.markerClusterGroup({
            maxClusterRadius: 50,
            disableClusteringAtZoom: 18,
            spiderfyOnMaxZoom: true,
            showCoverageOnHover: false,
            zoomToBoundsOnClick: true,
            animate: true,
            animateAddingMarkers: false,
            chunkedLoading: true,
            chunkInterval: 300,
            chunkDelay: 0,
            iconCreateFunction: (cluster) => {
                const count = cluster.getChildCount();
                const size = count >= 50 ? 'large' : count >= 10 ? 'medium' : 'small';
                return window.L.divIcon({
                    html: `<div class="marker-cluster marker-cluster-${size}">${count}</div>`,
                    className: '', iconSize: size === 'small' ? [40, 40] : size === 'medium' ? [50, 50] : [60, 60],
                });
            },
        });
        window.splitEventsMap.addLayer(window.splitEventsMarkerClusterGroup);

        if (userLocation) addEventsUserLocationMarker(window.splitEventsMap, true);
        updateSplitEventsMapMarkers();
    }

    // Called from each split-list-item's onclick (see
    // renderSplitEventsListings() above) — pans/zooms the split map to
    // that event's marker and opens its popup, same interaction as
    // Listings' own window.selectSplitListing.
    window.selectSplitEvent = function selectSplitEvent(eventId, lat, lng) {
        selectedSplitEventId = eventId;
        if (window.splitEventsMap) {
            window.splitEventsMap.setView([lat, lng], 15);
            window.splitEventsMarkerClusterGroup?.eachLayer((marker) => {
                const markerLatLng = marker.getLatLng();
                if (Math.abs(markerLatLng.lat - lat) < 0.0001 && Math.abs(markerLatLng.lng - lng) < 0.0001) {
                    window.splitEventsMarkerClusterGroup.zoomToShowLayer(marker, () => marker.openPopup());
                }
            });
        }
        renderSplitEventsListings();
    };

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

    // Condensed date(s)+time formatter for the map popup specifically —
    // same underlying logic as functions/event/[[slug]].js's
    // formatEventDateTime (multi-day range detection via a same-day
    // string comparison in the event's own timezone, all-day handling,
    // same-day start–end shown as a single time range rather than two
    // full timestamps) but abbreviated month/no-year/no-weekday output,
    // since that function's full "Saturday, September 6, 2026" format
    // was written for a full-width detail-page header and would wrap
    // awkwardly in a 280px popup. Can't literally reuse that function
    // here even if a shorter format were fine — it lives in a Cloudflare
    // Function file (server-side execution context), this runs in the
    // browser — so this mirrors its logic rather than importing it.
    function formatPopupDateTime(event) {
        const start = new Date(event.start_at);
        if (Number.isNaN(start.getTime())) return '';
        const end = event.end_at ? new Date(event.end_at) : null;
        const tz = event.timezone || 'America/Chicago';

        const dateFmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: tz });
        const dayKeyFmt = new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric', month: 'numeric', day: 'numeric' });
        const timeFmt = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: tz });

        const sameDay = end ? dayKeyFmt.format(start) === dayKeyFmt.format(end) : true;

        let dateLabel = dateFmt.format(start);
        if (end && !sameDay) dateLabel += ` \u2013 ${dateFmt.format(end)}`;

        if (event.all_day) return `${dateLabel} \u00b7 All day`;

        const timeLabel = (end && sameDay)
            ? `${timeFmt.format(start)} \u2013 ${timeFmt.format(end)}`
            : timeFmt.format(start);

        return `${dateLabel} \u00b7 ${timeLabel}`;
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

    // -------------------------------------------------------------------
    // Map popup — address/phone/directions helpers.
    //
    // js/listings.js already has getFullAddress/getDirectionsUrl/
    // formatPhoneDisplay, but that file is never loaded on any events
    // page (events.html, functions/events/index.js, and
    // _render-region-page.js all load ONLY js/events.js) — so those
    // globals genuinely don't exist in this page's scope, not just
    // "aren't called yet." Same reasoning for window.TGDDirections
    // (defined in js/pwa/directions.js, listings.js's preferred path
    // for getDirectionsUrl when present): that script isn't loaded here
    // either, so the plain Google Maps URL fallback listings.js falls
    // back to when TGDDirections is absent is actually the ONLY path
    // that applies on this page — written directly rather than
    // including a dead conditional branch that can never take the
    // other path in this file's context.
    // -------------------------------------------------------------------

    function getFullEventAddress(event) {
        if (event.city && event.state) {
            if (event.address) {
                return `${event.address}, ${event.city}, ${event.state} ${event.zip_code || ''}`.trim();
            }
            return `${event.city}, ${event.state}`.trim();
        }
        return event.address || '';
    }

    function getEventDirectionsUrl(event) {
        const fullAddr = getFullEventAddress(event);
        return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fullAddr)}`;
    }

    function formatPhoneDisplay(phone) {
        if (!phone) return '';
        const digits = phone.replace(/\D/g, '');
        if (phone.startsWith('+1') && digits.length === 11) {
            return `(${digits.substr(1, 3)}) ${digits.substr(4, 3)}-${digits.substr(7, 4)}`;
        }
        return phone;
    }

    // Full-parity map popup — mirrors js/listings.js's
    // buildMapPopupContent() structure and class names exactly (same
    // .map-popup/.map-popup-content/.map-popup-title/.map-popup-badges/
    // .map-popup-details classes, which is what actually makes this
    // look identical to the Listings popup: several of the *!important*
    // rules in css/listings.css — e.g. ".map-popup-title { display:
    // inline-flex !important }" and ".map-popup-details svg { stroke:
    // #045093 !important }" — only apply to elements carrying those
    // exact class names, not to a differently-classed lookalike, so
    // reusing the real class names is what makes the !important-layered
    // styling actually kick in here too, not just copying visible pixel
    // values by hand into a parallel set of classes). Differences from
    // the listing version, per what the reported gap actually asked
    // for: poster image instead of a business hero+logo pair (events
    // don't have a separate logo field), address+phone+date(s)/time
    // instead of tagline+hours-based Call button (events have no
    // weekly-hours schedule to check — generateCallButton's ONLY
    // condition is listing.phone, so the event version keeps that exact
    // same unconditional-on-phone-alone behavior), tier/status badges
    // via the already-existing buildEventBadges() instead of
    // hours-based open/closed badges.
    function buildEventMapPopupContent(event) {
        const badges = buildEventBadges(event);
        const posterImage = event.poster_image || '';
        const fullAddr = getFullEventAddress(event);
        const directionsUrl = getEventDirectionsUrl(event);
        const dateTimeLabel = formatPopupDateTime(event);

        const callButtonHtml = event.contact_phone ? `
            <a href="tel:${escapeAttr(event.contact_phone)}"
               onclick="event.stopPropagation();"
               style="position:absolute;bottom:8px;right:116px;display:inline-flex;align-items:center;gap:4px;padding:6px 10px;background:#10b981;color:white;border-radius:6px;font-size:12px;font-weight:500;text-decoration:none;box-shadow:0 2px 4px rgba(0,0,0,0.1);transition:background 0.2s;z-index:10;"
               onmouseover="this.style.background='#059669'"
               onmouseout="this.style.background='#10b981'">
                <svg style="width:14px;height:14px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                </svg>
                Call
            </a>` : '';

        return `
            <div class="map-popup" style="width: 280px;">
                ${posterImage ? `
                    <img src="${escapeAttr(posterImage)}"
                         alt="${escapeAttr(event.title || '')}"
                         style="width:100%;height:140px;object-fit:cover;border-radius:12px 12px 0 0;">
                ` : `
                    <div style="width:100%;height:140px;background:linear-gradient(135deg, #045093 0%, #0369a1 100%);border-radius:12px 12px 0 0;display:flex;align-items:center;justify-content:center;">
                        <svg style="width:48px;height:48px;color:rgba(255,255,255,0.5);" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                            <rect x="3" y="4" width="18" height="18" rx="2"/><path stroke-linecap="round" d="M16 2v4M8 2v4M3 10h18"/>
                        </svg>
                    </div>
                `}

                <div class="map-popup-content" style="padding: 12px; padding-bottom: 50px; position: relative;">
                    <div class="map-popup-info">
                        <div class="map-popup-badges" style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px;">
                            ${badges.join('')}
                        </div>

                        <a href="/event/${escapeAttr(event.slug || '')}"
                           class="map-popup-title"
                           style="font-size:16px;font-weight:700;color:#1f2937;text-decoration:none;display:flex;align-items:center;gap:4px;margin-bottom:6px;line-height:1.3;">
                            ${escapeHtml(event.title || '')}
                        </a>

                        ${dateTimeLabel ? `
                            <div class="map-popup-tagline" style="font-size:13px;color:#6b7280;margin-bottom:8px;line-height:1.4;">
                                ${escapeHtml(dateTimeLabel)}
                            </div>
                        ` : ''}

                        <div class="map-popup-details" style="font-size:12px;color:#6b7280;margin-bottom:4px;">
                            ${fullAddr ? `
                                <div style="display:flex;align-items:start;gap:6px;margin-bottom:4px;">
                                    <svg style="width:14px;height:14px;margin-top:2px;flex-shrink:0;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                                    </svg>
                                    <span style="line-height:1.4;">${escapeHtml(fullAddr)}</span>
                                </div>
                            ` : ''}

                            ${event.contact_phone ? `
                                <div style="display:flex;align-items:center;gap:6px;">
                                    <svg style="width:14px;height:14px;flex-shrink:0;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                                    </svg>
                                    <span>${escapeHtml(formatPhoneDisplay(event.contact_phone))}</span>
                                </div>
                            ` : ''}
                        </div>

                        ${callButtonHtml}

                        ${fullAddr ? `
                            <a href="${escapeAttr(directionsUrl)}"
                               target="_blank"
                               rel="noopener noreferrer"
                               onclick="event.stopPropagation();"
                               style="position:absolute;bottom:8px;right:8px;display:inline-flex;align-items:center;gap:4px;padding:6px 10px;background:#045093;color:white;border-radius:6px;font-size:12px;font-weight:500;text-decoration:none;box-shadow:0 2px 4px rgba(0,0,0,0.1);transition:background 0.2s;"
                               onmouseover="this.style.background='#033d7a'"
                               onmouseout="this.style.background='#045093'">
                                <svg style="width:14px;height:14px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
                                </svg>
                                Directions
                            </a>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    window.toggleFeedSubscribeMenu = toggleFeedSubscribeMenu;
    window.copyFeedLink = copyFeedLink;
})();
