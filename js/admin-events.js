/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
This source code is proprietary and no part may not be used, reproduced, or distributed
without written permission from The Greek Directory. Unauthorized use, copying, modification,
or distribution of this code can result in legal action to the fullest extent permitted by law.
*/

// js/admin-events.js
//
// Events section of the Admin Portal — a THIRD sibling view alongside
// switchAdminView('listings') / 'requests' / 'suggestions' (see
// switchAdminView() in js/admin.js). Loaded as a separate script rather
// than appended into the already-268KB js/admin.js, but calls the exact
// same adminProxy(action, payload) helper that file already defines
// globally (window.adminProxy — see js/admin.js's own definition), so
// this file assumes js/admin.js has already run and exposed that
// function plus getAdminCredentials()/getGithubToken() by the time a
// person actually opens the Events tab.
//
// WHY A SEPARATE MODAL INSTEAD OF REUSING #editModal:
// #editModal's Save button is wired to saveListing(), a ~250-line
// function specific to the listings table shape (photos array upload,
// hours JSON, GitHub static-page generation, etc). Branching that
// function on "is this a listing or an event" would make an already
// large function harder to safely change for BOTH listings and events
// going forward. A dedicated #eventEditModal with its own
// saveEvent() keeps each concern independently editable — the same
// reasoning that already justifies requests/suggestions having their
// own modals (#suggestionModal) rather than being shoehorned into
// #editModal.
//
// WHY THIS SECTION HAS NO "Generate Static Page" ACTION (unlike
// listings' 🔨 button / generateListingPage()): events are rendered
// live by functions/events/[[slug]].js on every request — see that
// file's own header comment for why. There is no static .html file to
// generate or commit for an event, so admin-events.js intentionally has
// no GitHub-commit code path at all. Saving a row via events:insert /
// events:update through admin-proxy IS the entire publish step; the
// very next visitor to /events/<slug> sees it, once the edge cache
// window (also handled inside that same function) lapses.

(function () {
    'use strict';

    let allEvents = [];
    let eventsLoaded = false;

    // -------------------------------------------------------------------
    // View switching hook
    // -------------------------------------------------------------------
    // switchAdminView() in js/admin.js gets a real, direct edit (see the
    // changes .md) adding a proper `else if (view === 'events')` branch
    // alongside its existing 'requests' / 'suggestions' / default-listings
    // branches — NOT a JS-level wrapper around the function. A wrapper
    // was the first approach tried here, but switchAdminView()'s
    // structure makes that actively wrong: unrecognized view values fall
    // through to the `else` block, which is the LISTINGS default (see
    // that function's own comment: "default: listings"). A wrapper that
    // calls the original function first and then tries to layer events
    // behavior on top would still show the Listings section for a
    // heartbeat (or in perpetuity, if something scoped inside that `else`
    // branch cleanly, e.g. renderTable() populating listingsSection) before
    // this file's code could hide it again — a real flash-of-wrong-content
    // bug, not just an inefficiency. A direct branch inside the function
    // is the only version of this that is correct on the first render.
    //
    // This file's job is therefore narrower than originally structured:
    // it defines loadEventsAdmin() (called by that new branch in
    // admin.js) and everything else events-specific — modal, table,
    // save/delete, autocomplete — but does not touch switchAdminView's
    // control flow at all.
    document.addEventListener('DOMContentLoaded', () => {
        document.getElementById('eventsViewBtn')?.addEventListener('click', () => window.switchAdminView('events'));
        document.getElementById('newEventBtn')?.addEventListener('click', () => openEventModal(null));
        document.getElementById('adminSearch')?.addEventListener('input', () => {
            if (window.currentAdminView === 'events') renderEventsTable();
        });

        bindEventModalControls();
    });

    // Called by the new `else if (view === 'events')` branch inside
    // switchAdminView() in js/admin.js — exposed on window for that
    // reason, the same way loadRequests()/loadSuggestions() are already
    // plain global functions called the same way from inside that
    // function for their own tabs.
    window.loadEventsAdmin = loadEventsAdmin;

    // -------------------------------------------------------------------
    // Load + render events table
    // -------------------------------------------------------------------

    async function loadEventsAdmin() {
        const tbody = document.getElementById('eventsTableBody');
        if (tbody && !eventsLoaded) {
            tbody.innerHTML = `<tr><td colspan="8" class="py-10 px-4 text-center text-gray-500">Loading events…</td></tr>`;
        }
        try {
            // adminProxy() already unwraps to json.data (see its own
            // definition in js/admin.js) — events:list mirrors
            // listings:list exactly (a plain .select() with no .single()),
            // so this is already a plain array, the same way
            // loadListings() consumes listings:list's result directly
            // with no further unwrapping.
            allEvents = await window.adminProxy('events:list', {});
            if (!Array.isArray(allEvents)) allEvents = [];
            eventsLoaded = true;
            renderEventsTable();
        } catch (err) {
            console.error('Failed to load events:', err);
            if (tbody) tbody.innerHTML = `<tr><td colspan="8" class="py-10 px-4 text-center text-red-500">Failed to load events. ${escapeHtml(err.message || '')}</td></tr>`;
        }
    }

    function renderEventsTable() {
        const tbody = document.getElementById('eventsTableBody');
        if (!tbody) return;

        const searchTerm = document.getElementById('adminSearch')?.value.toLowerCase() || '';
        const filtered = searchTerm
            ? allEvents.filter((e) =>
                (e.title || '').toLowerCase().includes(searchTerm) ||
                (e.category || '').toLowerCase().includes(searchTerm) ||
                (e.city || '').toLowerCase().includes(searchTerm) ||
                String(e.id || '').includes(searchTerm))
            : allEvents;

        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" class="py-10 px-4 text-center text-gray-500">No events found.</td></tr>`;
            return;
        }

        // Soonest-first, same convention as the public feed.
        const sorted = [...filtered].sort((a, b) => new Date(a.start_at) - new Date(b.start_at));

        const tierColors = { FREE: 'bg-gray-100 text-gray-700', FEATURED: 'bg-yellow-100 text-yellow-700', PREMIUM: 'bg-purple-100 text-purple-700' };
        const statusColors = { scheduled: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700', postponed: 'bg-orange-100 text-orange-700', sold_out: 'bg-gray-200 text-gray-700' };

        tbody.innerHTML = sorted.map((e) => {
            const tier = e.tier || 'FREE';
            const status = e.status || 'scheduled';
            const eventUrl = `/events/${e.slug || ''}`;
            const startLabel = e.start_at ? new Date(e.start_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '\u2014';

            return `
            <tr class="border-b hover:bg-gray-50">
                <td class="py-4 px-4 text-sm font-mono text-gray-600">${escapeHtml(e.id)}</td>
                <td class="py-4 px-4">
                    <label class="inline-flex items-center cursor-pointer">
                        <input type="checkbox" ${e.visible ? 'checked' : ''} onchange="window.toggleEventVisibility('${e.id}')" class="w-4 h-4">
                        <span class="ml-2 text-sm">${e.visible ? '\ud83d\udc41\ufe0f Visible' : '\ud83d\udeab Hidden'}</span>
                    </label>
                </td>
                <td class="py-4 px-4">
                    <span class="px-2 py-1 rounded text-xs font-medium ${tierColors[tier] || tierColors.FREE}">${escapeHtml(tier)}</span>
                    <span class="ml-1 px-2 py-1 rounded text-xs font-medium ${statusColors[status] || statusColors.scheduled}">${escapeHtml(status)}</span>
                </td>
                <td class="py-4 px-4 font-medium">${escapeHtml(e.title || '')}</td>
                <td class="py-4 px-4 text-gray-600">${escapeHtml(e.category || '')}</td>
                <td class="py-4 px-4 text-sm text-gray-600">${startLabel}</td>
                <td class="py-4 px-4 text-sm text-gray-600">${escapeHtml(e.city || '')}${e.state ? ', ' + escapeHtml(e.state) : ''}</td>
                <td class="py-4 px-4">
                    <div class="flex justify-end gap-2 flex-wrap">
                        <button onclick="window.openEventModal('${e.id}')" class="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200">Edit</button>
                        <a href="${eventUrl}" target="_blank" class="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">View</a>
                        <button onclick="window.deleteEventAdmin('${e.id}')" class="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200">Delete</button>
                    </div>
                </td>
            </tr>`;
        }).join('');
    }

    window.toggleEventVisibility = async function (id) {
        try {
            const event = allEvents.find((e) => e.id === id);
            if (!event) return;
            const newVisible = !event.visible;
            await window.adminProxy('events:update', { id, visible: newVisible });
            event.visible = newVisible;
            renderEventsTable();
        } catch (err) {
            console.error('Error toggling event visibility:', err);
            alert('Failed to update visibility');
        }
    };

    window.deleteEventAdmin = async function (id) {
        const event = allEvents.find((e) => e.id === id);
        if (!confirm(`Delete "${event?.title || 'this event'}"? This cannot be undone.`)) return;
        try {
            await window.adminProxy('events:delete', { id });
            allEvents = allEvents.filter((e) => e.id !== id);
            renderEventsTable();
        } catch (err) {
            console.error('Error deleting event:', err);
            alert('Failed to delete event.');
        }
    };

    // -------------------------------------------------------------------
    // Modal: create / edit
    // -------------------------------------------------------------------

    function bindEventModalControls() {
        document.getElementById('closeEventModal')?.addEventListener('click', closeEventModalWithConfirm);
        document.getElementById('cancelEventEdit')?.addEventListener('click', closeEventModalWithConfirm);
        document.getElementById('saveEventEdit')?.addEventListener('click', saveEvent);

        // Host listing / venue listing autocomplete — searches allListings
        // (already loaded globally by js/admin.js for the Listings tab) so
        // this never needs its own separate listings fetch.
        document.getElementById('eventHostListingSearch')?.addEventListener('input', (e) => renderListingAutocomplete(e.target, 'eventHostListingResults', 'eventHostListingId'));
        document.getElementById('eventVenueListingSearch')?.addEventListener('input', (e) => renderListingAutocomplete(e.target, 'eventVenueListingResults', 'eventVenueListingId'));

        document.getElementById('eventCustomVenueToggle')?.addEventListener('change', (e) => {
            document.getElementById('eventCustomVenueFields')?.classList.toggle('hidden', !e.target.checked);
            document.getElementById('eventVenueListingField')?.classList.toggle('hidden', e.target.checked);
        });
    }

    function closeEventModalWithConfirm() {
        if (confirm('Discard changes?')) {
            document.getElementById('eventEditModal')?.classList.add('hidden');
        }
    }

    window.openEventModal = function (id) {
        const event = id ? allEvents.find((e) => e.id === id) : null;
        const modal = document.getElementById('eventEditModal');
        if (!modal) return;

        modal.dataset.eventId = id || '';
        document.getElementById('eventModalTitle').textContent = event ? 'Edit Event' : 'New Event';
        document.getElementById('eventEditFormContent').innerHTML = buildEventFormHtml(event);

        // Re-bind controls that live inside the freshly-injected form HTML.
        document.getElementById('eventCustomVenueToggle')?.addEventListener('change', (e) => {
            document.getElementById('eventCustomVenueFields')?.classList.toggle('hidden', !e.target.checked);
            document.getElementById('eventVenueListingField')?.classList.toggle('hidden', e.target.checked);
        });
        document.getElementById('eventHostListingSearch')?.addEventListener('input', (e) => renderListingAutocomplete(e.target, 'eventHostListingResults', 'eventHostListingId'));
        document.getElementById('eventVenueListingSearch')?.addEventListener('input', (e) => renderListingAutocomplete(e.target, 'eventVenueListingResults', 'eventVenueListingId'));

        modal.classList.remove('hidden');
    };

    function buildEventFormHtml(event) {
        event = event || {};
        const recurrence = event.recurrence && typeof event.recurrence === 'object' ? event.recurrence : {};
        const additionalInfo = Array.isArray(event.additional_info) ? event.additional_info : [];
        const hasCustomVenue = !event.venue_listing_id && (event.custom_venue_name || event.custom_venue_address);

        // Field grouping intentionally mirrors listing-form section order
        // (identity -> relationships -> when/where -> media -> tickets ->
        // contact -> flexible extras) so an admin who already knows the
        // Listings form finds the Events form immediately familiar.
        return `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input type="text" id="ev_title" value="${escapeAttr(event.title)}" class="w-full px-3 py-2 border border-gray-300 rounded-lg" required>
            </div>
            <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-1">Slug * <span class="text-gray-400 font-normal">(used in /events/&lt;slug&gt;)</span></label>
                <input type="text" id="ev_slug" value="${escapeAttr(event.slug)}" class="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm" required>
            </div>
            <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-1">Tagline</label>
                <input type="text" id="ev_tagline" value="${escapeAttr(event.tagline)}" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
            </div>
            <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea id="ev_description" rows="5" class="w-full px-3 py-2 border border-gray-300 rounded-lg">${escapeHtml(event.description)}</textarea>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <input type="text" id="ev_category" value="${escapeAttr(event.category)}" placeholder="e.g. Festival, Church Event" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Tier</label>
                <select id="ev_tier" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option value="FREE" ${event.tier === 'FREE' || !event.tier ? 'selected' : ''}>Free</option>
                    <option value="FEATURED" ${event.tier === 'FEATURED' ? 'selected' : ''}>Featured</option>
                    <option value="PREMIUM" ${event.tier === 'PREMIUM' ? 'selected' : ''}>Premium</option>
                </select>
            </div>

            <div class="md:col-span-2 border-t pt-4 mt-2">
                <h3 class="font-semibold text-gray-900 mb-2">Host &amp; Venue</h3>
            </div>
            <div class="md:col-span-2 relative">
                <label class="block text-sm font-medium text-gray-700 mb-1">Hosted By (Listing)</label>
                <input type="text" id="eventHostListingSearch" placeholder="Search listings by business name..." value="${escapeAttr(findListingNameById(event.host_listing_id))}" class="w-full px-3 py-2 border border-gray-300 rounded-lg" autocomplete="off">
                <input type="hidden" id="eventHostListingId" value="${escapeAttr(event.host_listing_id)}">
                <div id="eventHostListingResults" class="location-search-results"></div>
            </div>
            <div class="md:col-span-2">
                <label class="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" id="eventCustomVenueToggle" class="w-4 h-4" ${hasCustomVenue ? 'checked' : ''}>
                    <span class="text-sm font-medium text-gray-700">Venue is not a directory listing (custom venue)</span>
                </label>
            </div>
            <div id="eventVenueListingField" class="md:col-span-2 relative ${hasCustomVenue ? 'hidden' : ''}">
                <label class="block text-sm font-medium text-gray-700 mb-1">Venue (Listing)</label>
                <input type="text" id="eventVenueListingSearch" placeholder="Search listings by business name..." value="${escapeAttr(findListingNameById(event.venue_listing_id))}" class="w-full px-3 py-2 border border-gray-300 rounded-lg" autocomplete="off">
                <input type="hidden" id="eventVenueListingId" value="${escapeAttr(event.venue_listing_id)}">
                <div id="eventVenueListingResults" class="location-search-results"></div>
            </div>
            <div id="eventCustomVenueFields" class="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 ${hasCustomVenue ? '' : 'hidden'}">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Venue Name</label>
                    <input type="text" id="ev_custom_venue_name" value="${escapeAttr(event.custom_venue_name)}" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Venue Address</label>
                    <input type="text" id="ev_custom_venue_address" value="${escapeAttr(event.custom_venue_address)}" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                </div>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">City <span class="text-gray-400 font-normal">(used for /events/chicago-style filtering — enter proper case, e.g. "Oak Park")</span></label>
                <input type="text" id="ev_city" value="${escapeAttr(event.city)}" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">State</label>
                <input type="text" id="ev_state" value="${escapeAttr(event.state || 'IL')}" maxlength="2" class="w-full px-3 py-2 border border-gray-300 rounded-lg uppercase">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                <input type="text" id="ev_lat" value="${escapeAttr(event.coordinates?.lat)}" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                <input type="text" id="ev_lng" value="${escapeAttr(event.coordinates?.lng)}" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
            </div>

            <div class="md:col-span-2 border-t pt-4 mt-2">
                <h3 class="font-semibold text-gray-900 mb-2">Date &amp; Time</h3>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Starts *</label>
                <input type="datetime-local" id="ev_start_at" value="${toDatetimeLocalValue(event.start_at)}" class="w-full px-3 py-2 border border-gray-300 rounded-lg" required>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Ends</label>
                <input type="datetime-local" id="ev_end_at" value="${toDatetimeLocalValue(event.end_at)}" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                <input type="text" id="ev_timezone" value="${escapeAttr(event.timezone || 'America/Chicago')}" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
            </div>
            <div class="flex items-end pb-2">
                <label class="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" id="ev_all_day" class="w-4 h-4" ${event.all_day ? 'checked' : ''}>
                    <span class="text-sm font-medium text-gray-700">All-day event</span>
                </label>
            </div>
            <div class="md:col-span-2">
                <label class="flex items-center gap-2 cursor-pointer mb-2">
                    <input type="checkbox" id="ev_is_recurring" class="w-4 h-4" ${recurrence.freq ? 'checked' : ''}>
                    <span class="text-sm font-medium text-gray-700">Recurring event</span>
                </label>
                <div id="ev_recurrence_fields" class="grid grid-cols-1 md:grid-cols-3 gap-3 ${recurrence.freq ? '' : 'hidden'}">
                    <select id="ev_recurrence_freq" class="px-3 py-2 border border-gray-300 rounded-lg">
                        <option value="daily" ${recurrence.freq === 'daily' ? 'selected' : ''}>Daily</option>
                        <option value="weekly" ${!recurrence.freq || recurrence.freq === 'weekly' ? 'selected' : ''}>Weekly</option>
                        <option value="monthly" ${recurrence.freq === 'monthly' ? 'selected' : ''}>Monthly</option>
                    </select>
                    <input type="number" id="ev_recurrence_interval" min="1" value="${recurrence.interval || 1}" placeholder="Every N" class="px-3 py-2 border border-gray-300 rounded-lg">
                    <input type="date" id="ev_recurrence_until" value="${recurrence.until ? recurrence.until.split('T')[0] : ''}" class="px-3 py-2 border border-gray-300 rounded-lg">
                </div>
            </div>
            <script>
                document.getElementById('ev_is_recurring')?.addEventListener('change', function(e) {
                    document.getElementById('ev_recurrence_fields')?.classList.toggle('hidden', !e.target.checked);
                });
            </script>

            <div class="md:col-span-2 border-t pt-4 mt-2">
                <h3 class="font-semibold text-gray-900 mb-2">Poster &amp; Media</h3>
                <p class="text-xs text-gray-500 mb-2">Events use a poster/flyer image rather than a banner photo. Upload happens the same way as listing photos — via Cloudflare Images.</p>
            </div>
            <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-1">Poster Image URL</label>
                <input type="text" id="ev_poster_image" value="${escapeAttr(event.poster_image)}" class="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="https://images.thegreekdirectory.org/...">
                <input type="file" id="ev_poster_upload" accept="image/*" class="mt-2 text-sm">
            </div>

            <div class="md:col-span-2 border-t pt-4 mt-2">
                <h3 class="font-semibold text-gray-900 mb-2">Tickets &amp; RSVP</h3>
            </div>
            <div class="flex items-end pb-2">
                <label class="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" id="ev_is_free" class="w-4 h-4" ${event.is_free !== false ? 'checked' : ''}>
                    <span class="text-sm font-medium text-gray-700">Free event</span>
                </label>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Price Range</label>
                <input type="text" id="ev_price_range" value="${escapeAttr(event.price_range)}" placeholder="$15\u2013$25" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Ticket URL</label>
                <input type="text" id="ev_ticket_url" value="${escapeAttr(event.ticket_url)}" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">RSVP URL</label>
                <input type="text" id="ev_rsvp_url" value="${escapeAttr(event.rsvp_url)}" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
            </div>
            <div class="flex items-end pb-2">
                <label class="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" id="ev_rsvp_required" class="w-4 h-4" ${event.rsvp_required ? 'checked' : ''}>
                    <span class="text-sm font-medium text-gray-700">RSVP required</span>
                </label>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                <input type="number" id="ev_capacity" value="${escapeAttr(event.capacity)}" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Registered Count</label>
                <input type="number" id="ev_registered_count" value="${event.registered_count || 0}" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
            </div>

            <div class="md:col-span-2 border-t pt-4 mt-2">
                <h3 class="font-semibold text-gray-900 mb-2">Status &amp; Visibility</h3>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select id="ev_status" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option value="scheduled" ${!event.status || event.status === 'scheduled' ? 'selected' : ''}>Scheduled</option>
                    <option value="postponed" ${event.status === 'postponed' ? 'selected' : ''}>Postponed</option>
                    <option value="cancelled" ${event.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                    <option value="sold_out" ${event.status === 'sold_out' ? 'selected' : ''}>Sold Out</option>
                </select>
            </div>
            <div class="flex items-end pb-2">
                <label class="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" id="ev_visible" class="w-4 h-4" ${event.visible !== false ? 'checked' : ''}>
                    <span class="text-sm font-medium text-gray-700">Visible (published)</span>
                </label>
            </div>

            <div class="md:col-span-2 border-t pt-4 mt-2">
                <h3 class="font-semibold text-gray-900 mb-2">Contact</h3>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input type="text" id="ev_contact_phone" value="${escapeAttr(event.contact_phone)}" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="text" id="ev_contact_email" value="${escapeAttr(event.contact_email)}" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
            </div>
            <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-1">Website</label>
                <input type="text" id="ev_website" value="${escapeAttr(event.website)}" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
            </div>
            <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-1">Meta Description <span class="text-gray-400 font-normal">(SEO)</span></label>
                <input type="text" id="ev_meta_description" value="${escapeAttr(event.meta_description)}" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
            </div>
        </div>`;
    }

    // -------------------------------------------------------------------
    // Save
    // -------------------------------------------------------------------

    async function saveEvent() {
        const modal = document.getElementById('eventEditModal');
        const id = modal?.dataset.eventId || null;
        const saveBtn = document.getElementById('saveEventEdit');

        const title = document.getElementById('ev_title')?.value.trim();
        const slug = document.getElementById('ev_slug')?.value.trim();
        const startAt = document.getElementById('ev_start_at')?.value;

        if (!title || !slug || !startAt) {
            alert('Title, Slug, and Start date/time are required.');
            return;
        }

        const isCustomVenue = document.getElementById('eventCustomVenueToggle')?.checked;
        const lat = parseFloat(document.getElementById('ev_lat')?.value);
        const lng = parseFloat(document.getElementById('ev_lng')?.value);

        const isRecurring = document.getElementById('ev_is_recurring')?.checked;
        const recurrence = isRecurring
            ? {
                freq: document.getElementById('ev_recurrence_freq')?.value || 'weekly',
                interval: parseInt(document.getElementById('ev_recurrence_interval')?.value, 10) || 1,
                until: document.getElementById('ev_recurrence_until')?.value || undefined,
            }
            : {};

        const payload = {
            title,
            slug,
            tagline: document.getElementById('ev_tagline')?.value.trim() || null,
            description: document.getElementById('ev_description')?.value || null,
            category: document.getElementById('ev_category')?.value.trim() || null,
            tier: document.getElementById('ev_tier')?.value || 'FREE',

            host_listing_id: document.getElementById('eventHostListingId')?.value || null,
            venue_listing_id: isCustomVenue ? null : (document.getElementById('eventVenueListingId')?.value || null),
            custom_venue_name: isCustomVenue ? (document.getElementById('ev_custom_venue_name')?.value.trim() || null) : null,
            custom_venue_address: isCustomVenue ? (document.getElementById('ev_custom_venue_address')?.value.trim() || null) : null,

            city: document.getElementById('ev_city')?.value.trim() || null,
            state: document.getElementById('ev_state')?.value.trim().toUpperCase() || null,
            coordinates: (!Number.isNaN(lat) && !Number.isNaN(lng)) ? { lat, lng } : null,

            start_at: new Date(startAt).toISOString(),
            end_at: document.getElementById('ev_end_at')?.value ? new Date(document.getElementById('ev_end_at').value).toISOString() : null,
            timezone: document.getElementById('ev_timezone')?.value.trim() || 'America/Chicago',
            all_day: !!document.getElementById('ev_all_day')?.checked,
            recurrence,

            poster_image: document.getElementById('ev_poster_image')?.value.trim() || null,

            is_free: !!document.getElementById('ev_is_free')?.checked,
            price_range: document.getElementById('ev_price_range')?.value.trim() || null,
            ticket_url: document.getElementById('ev_ticket_url')?.value.trim() || null,
            rsvp_url: document.getElementById('ev_rsvp_url')?.value.trim() || null,
            rsvp_required: !!document.getElementById('ev_rsvp_required')?.checked,
            capacity: document.getElementById('ev_capacity')?.value ? parseInt(document.getElementById('ev_capacity').value, 10) : null,
            registered_count: parseInt(document.getElementById('ev_registered_count')?.value, 10) || 0,

            status: document.getElementById('ev_status')?.value || 'scheduled',
            visible: !!document.getElementById('ev_visible')?.checked,

            contact_phone: document.getElementById('ev_contact_phone')?.value.trim() || null,
            contact_email: document.getElementById('ev_contact_email')?.value.trim() || null,
            website: document.getElementById('ev_website')?.value.trim() || null,
            meta_description: document.getElementById('ev_meta_description')?.value.trim() || null,
        };

        // Poster upload — reuses the exact same Cloudflare Images upload
        // flow already wired for listing photos in js/admin.js:
        // uploadToCloudflareImages(file, assetType). That function is NOT
        // currently exposed on window (it's a plain top-level function in
        // admin.js, only called from within that file) — the changes .md
        // adds a one-line `window.uploadToCloudflareImages =
        // uploadToCloudflareImages;` export alongside admin.js's other
        // window.* exports so this file can call it.
        //
        // IMPORTANT DIVERGENCE FROM THE LISTING PHOTO FLOW: that function
        // internally reads `editingListing?.id` to tag the uploaded asset
        // with a listing ID — a global that is listing-editing-specific
        // and is NOT set while this events modal is open (or may be stale
        // from a previous Listings-tab session). Passing 'event-poster' as
        // the assetType is what the upload endpoint uses to bucket/tag the
        // asset type itself; the listingId tag will come through empty or
        // stale for event posters, which is a real but low-stakes gap — it
        // only affects asset-organization metadata on Cloudflare's side,
        // not which URL comes back or whether the poster displays
        // correctly. Flagged plainly rather than silently accepted: if
        // listingId-based asset organization matters here, the fix is
        // widening uploadToCloudflareImages's signature to accept an
        // optional explicit ownerId param instead of reading the global,
        // which is a small change but touches a function the listings
        // flow already depends on, so it's called out here rather than
        // made unilaterally.
        const posterFile = document.getElementById('ev_poster_upload')?.files?.[0];
        if (posterFile && typeof window.uploadToCloudflareImages === 'function') {
            try {
                saveBtn.disabled = true;
                saveBtn.textContent = 'Uploading poster\u2026';
                payload.poster_image = await window.uploadToCloudflareImages(posterFile, 'event-poster');
            } catch (err) {
                console.error('Poster upload failed:', err);
                alert('Poster upload failed. Saving without a new poster image.');
            }
        }

        try {
            saveBtn.disabled = true;
            saveBtn.textContent = 'Saving\u2026';

            if (id) {
                await window.adminProxy('events:update', { id, ...payload });
                const idx = allEvents.findIndex((e) => e.id === id);
                if (idx !== -1) allEvents[idx] = { ...allEvents[idx], ...payload };
            } else {
                // events:insert mirrors listings:insert's .single() pattern
                // (see the changes .md's admin-proxy snippet) — the result
                // is a plain row object, not an array, matching how
                // adminProxy('listings:insert', ...) is consumed elsewhere
                // in js/admin.js.
                const newRow = await window.adminProxy('events:insert', payload);
                if (newRow && newRow.id) allEvents.unshift(newRow);
            }

            document.getElementById('eventEditModal')?.classList.add('hidden');
            renderEventsTable();
        } catch (err) {
            console.error('Error saving event:', err);
            alert(`Failed to save event: ${err.message || 'Unknown error'}`);
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = 'Save Event';
        }
    }

    // -------------------------------------------------------------------
    // Listing autocomplete (host / venue) — reads window.allListings,
    // already populated by js/admin.js's loadListings() for the Listings
    // tab. Falls back to an empty result set gracefully if that hasn't
    // loaded yet, rather than throwing.
    // -------------------------------------------------------------------

    function findListingNameById(id) {
        if (!id || !Array.isArray(window.allListings)) return '';
        const match = window.allListings.find((l) => l.id === id);
        return match ? match.business_name : '';
    }

    function renderListingAutocomplete(inputEl, resultsId, hiddenFieldId) {
        const resultsEl = document.getElementById(resultsId);
        const hiddenEl = document.getElementById(hiddenFieldId);
        if (!resultsEl || !hiddenEl) return;

        const query = inputEl.value.trim().toLowerCase();
        if (!query || !Array.isArray(window.allListings)) {
            resultsEl.innerHTML = '';
            resultsEl.classList.remove('active');
            return;
        }

        const matches = window.allListings
            .filter((l) => (l.business_name || '').toLowerCase().includes(query))
            .slice(0, 8);

        if (matches.length === 0) {
            resultsEl.innerHTML = '';
            resultsEl.classList.remove('active');
            return;
        }

        // .location-search-result is the real, already-styled class used
        // by js/listings.js's own city/state/zip autocomplete (see
        // css/listings.css) — reused here rather than inventing a
        // parallel class, so this dropdown looks and behaves identically
        // to every other autocomplete already on the site.
        resultsEl.innerHTML = matches.map((l) => `
            <div class="location-search-result" data-id="${escapeAttr(l.id)}" data-name="${escapeAttr(l.business_name)}">
                ${escapeHtml(l.business_name)} <span class="text-gray-400 text-xs">${escapeHtml(l.city || '')}${l.state ? ', ' + escapeHtml(l.state) : ''}</span>
            </div>`).join('');
        resultsEl.classList.add('active');

        resultsEl.querySelectorAll('.location-search-result').forEach((item) => {
            item.addEventListener('click', () => {
                inputEl.value = item.dataset.name;
                hiddenEl.value = item.dataset.id;
                resultsEl.innerHTML = '';
                resultsEl.classList.remove('active');
            });
        });
    }

    // -------------------------------------------------------------------
    // Utilities
    // -------------------------------------------------------------------

    function toDatetimeLocalValue(isoString) {
        if (!isoString) return '';
        const d = new Date(isoString);
        if (Number.isNaN(d.getTime())) return '';
        const pad = (n) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
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
