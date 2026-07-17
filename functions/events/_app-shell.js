/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
This source code is proprietary and no part may not be used, reproduced, or distributed
without written permission from The Greek Directory. Unauthorized use, copying, modification,
or distribution of this code can result in legal action to the fullest extent permitted by law.
*/

// functions/events/_app-shell.js
//
// The toolbar / filter-panel / map-view / calendar-view / grid-view /
// list-view markup block that js/events.js's DOM lookups (getElementById
// calls for eventFilterBtn, eventsContainer, eventCalendarGrid, etc.)
// depend on existing in the page. Factored into its own exported
// constant and shared by BOTH functions/events/index.js (the /events
// homepage) and _render-region-page.js (e.g. /events/chicago), rather
// than each of those two files embedding its own copy of this markup.
//
// WHY THIS FACTORING EXISTS: the homepage and every regional page use
// the exact same interactive shell — same toolbar, same filter panel,
// same four view containers — and differ only in their <head> metadata
// and hero section. Two independent copies of ~125 lines of markup this
// detailed WOULD drift the moment one page's markup got hand-edited and
// the other didn't; every id here is load-bearing for js/events.js, so a
// drift isn't a cosmetic difference; it's a silently broken page (a
// missing #eventCalendarGrid means the calendar view never renders,
// with no error visible in the UI). One exported constant, imported by
// both route files, makes that class of bug structurally impossible
// instead of relying on remembering to keep two copies in sync by hand.
//
// events.html (kept in the repo root as human-readable source) contains
// this identical block inline, for anyone hand-editing the homepage
// markup directly. If this block is ever edited, mirror the edit in
// events.html's own copy — see that file's note near the TOOLBAR
// comment.

export const EVENTS_APP_SHELL_HTML = `    <!-- TOOLBAR — filters trigger, view toggle (grid / list / calendar / map), sort -->
    <div class="max-w-7xl mx-auto px-4">
        <div class="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-gray-200">
            <div class="flex items-center gap-2">
                <button id="eventFilterBtn" class="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg whitespace-nowrap shadow-sm">
                    <svg class="w-4 h-4" fill="none" stroke="#045093" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h18M6 8h12M10 12h4"/></svg>
                    <span class="text-sm font-medium">Filters</span>
                    <span id="eventFilterCount" class="hidden inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white rounded-full" style="background:#045093;">0</span>
                </button>
                <p id="eventResultsCount" class="text-sm text-gray-600 hidden sm:block">Loading...</p>
            </div>
            <div class="flex items-center gap-2">
                <div class="events-view-toggle" id="eventsViewToggle">
                    <button data-view="grid" class="active">
                        <svg width="14" height="14" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M 5,4 C 4.446,4 4,4.446 4,5 v 8 c 0,0.554 0.446,1 1,1 h 8 c 0.554,0 1,-0.446 1,-1 V 5 C 14,4.446 13.554,4 13,4 Z m 12,0 c -0.554,0 -1,0.446 -1,1 v 8 c 0,0.554 0.446,1 1,1 h 8 c 0.554,0 1,-0.446 1,-1 V 5 C 26,4.446 25.554,4 25,4 Z M 5,16 c -0.554,0 -1,0.446 -1,1 v 8 c 0,0.554 0.446,1 1,1 h 8 c 0.554,0 1,-0.446 1,-1 v -8 c 0,-0.554 -0.446,-1 -1,-1 z m 12,0 c -0.554,0 -1,0.446 -1,1 v 8 c 0,0.554 0.446,1 1,1 h 8 c 0.554,0 1,-0.446 1,-1 v -8 c 0,-0.554 -0.446,-1 -1,-1 z"/></svg>
                        Grid
                    </button>
                    <button data-view="list">
                        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 4h18v2H3zm0 6h18v2H3zm0 6h18v2H3z"/></svg>
                        List
                    </button>
                    <button data-view="calendar">
                        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path stroke-linecap="round" d="M16 2v4M8 2v4M3 10h18"/></svg>
                        Calendar
                    </button>
                    <button data-view="map">
                        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/></svg>
                        Map
                    </button>
                </div>
                <select id="eventSortSelect" class="text-sm border border-gray-300 rounded-lg px-3 py-2">
                    <option value="soonest">Soonest</option>
                    <option value="az">A-Z</option>
                    <option value="furthest">Furthest Out</option>
                </select>
            </div>
        </div>
    </div>

    <!-- FILTER PANEL — single markup, responsive (slide-down on mobile, sidebar on desktop via CSS; see css/events.css .event-filter-panel) -->
    <div id="eventFilterPanel" class="hidden">
        <div class="max-w-7xl mx-auto px-4 py-4">
            <div class="flex items-center justify-between mb-3">
                <h3 class="font-semibold text-gray-900">Filters</h3>
                <div class="flex gap-2">
                    <button id="eventClearFiltersBtn" class="text-sm text-blue-600 hover:text-blue-800 px-0 py-0">Clear All</button>
                    <button id="eventCloseFilterBtn" class="text-gray-500">✕</button>
                </div>
            </div>
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <div id="eventCategoryFilters" class="flex flex-wrap gap-2"></div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">When</label>
                    <div id="eventDateFilters" class="flex flex-wrap gap-2">
                        <button class="toggle-option active" data-range="all">Any time</button>
                        <button class="toggle-option" data-range="today">Today</button>
                        <button class="toggle-option" data-range="weekend">This Weekend</button>
                        <button class="toggle-option" data-range="week">This Week</button>
                        <button class="toggle-option" data-range="month">This Month</button>
                    </div>
                </div>
                <div class="space-y-2">
                    <label class="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" id="eventFreeOnlyFilter" class="w-4 h-4">
                        <span class="text-sm font-medium text-gray-700">Free Only</span>
                    </label>
                </div>
                <!-- Location Search — hidden entirely on regional pages (e.g. /events/chicago)
                     since every result is already confined to that region's city list;
                     js/events.js toggles this via the .event-regional-hide class when
                     window.TGD_EVENTS_REGION is present. -->
                <div class="location-search-container event-regional-hide">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Location Search</label>
                    <input type="text" id="eventLocationSearch" placeholder="City, State, or Zip..."
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <div id="eventLocationSearchResults" class="location-search-results"></div>
                </div>
            </div>
        </div>
    </div>

    <!-- MAP VIEW -->
    <div id="eventMapContainer" class="hidden border-b relative" style="max-height: calc(100vh - 60px); overflow: hidden; position:relative; z-index:30;">
        <div class="map-loading" id="eventMapLoading">
            <div class="spinner"></div>
            <p class="text-sm text-gray-600 mt-2 text-center">Loading map...</p>
        </div>
        <div id="eventsMap" style="height: 70vh;"></div>
    </div>

    <!-- CALENDAR VIEW -->
    <div id="eventCalendarContainer" class="hidden max-w-7xl mx-auto px-4 py-4">
        <div class="event-calendar">
            <div class="event-calendar-header">
                <button class="event-calendar-nav-btn" id="calendarPrevBtn" aria-label="Previous month">
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
                </button>
                <h3 id="calendarMonthLabel">Month Year</h3>
                <button class="event-calendar-nav-btn" id="calendarNextBtn" aria-label="Next month">
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
                </button>
            </div>
            <div class="event-calendar-grid" id="eventCalendarGrid"></div>
        </div>
        <div id="calendarDayDetail" class="hidden mt-4 bg-white rounded-lg p-4 card-shadow"></div>
    </div>

    <!-- GRID / LIST VIEW -->
    <div class="max-w-7xl mx-auto px-4 py-4">
        <div id="eventGridView">
            <div id="eventsContainer" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"></div>
            <button id="eventLoadMoreBtn" class="load-more-btn hidden">Load More Events</button>
        </div>
        <div id="eventListView" class="hidden">
            <div id="eventsListContainer" class="space-y-3"></div>
            <button id="eventListLoadMoreBtn" class="load-more-btn hidden">Load More Events</button>
        </div>
        <div id="eventsEmptyState" class="hidden text-center py-16">
            <p class="text-gray-500 text-lg mb-2">No events found</p>
            <p class="text-gray-400 text-sm">Try adjusting your filters or check back soon.</p>
        </div>
    </div>
`;
