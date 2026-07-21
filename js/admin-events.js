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
// globally (window.adminProxy), so this file assumes js/admin.js has
// already run and exposed that function plus window.allListings by the
// time a person actually opens the Events tab.
//
// WHY A SEPARATE MODAL INSTEAD OF REUSING #editModal: see the original
// reasoning — #editModal's Save button is wired to saveListing(), a
// large function specific to the listings table shape. A dedicated
// #eventEditModal keeps each concern independently editable.
//
// WHY THIS SECTION HAS NO "Generate Static Page" ACTION: events are
// rendered live by functions/event/[slug].js on every request, not
// baked to a static committed file the way listing pages are. Saving a
// row via events:insert / events:update through admin-proxy IS the
// entire publish step.
//
// THIS VERSION adds three things the first pass was missing:
//   1. A unified `address` field (was: only a custom-venue-only address
//      field, with no address at all when a venue listing was linked).
//      Auto-filled from the selected venue listing's own address at
//      selection time, and freely editable afterward — editing before
//      save IS how an admin overrides it. See selectVenueListing().
//   2. Auto-geocoding for custom venues, mirroring js/admin.js's own
//      geocodeAddress()/saveListing() pattern exactly (Nominatim,
//      skipped when lat/lng are already filled). See geocodeEventAddress().
//   3. System shortlink creation (/e/XXXXXX) on new-event save, mirroring
//      js/admin.js's saveListing() system-shortlink block exactly, and
//      shortlink cleanup on delete, mirroring deleteListing(). See the
//      SHORTLINK section near the bottom.

(function () {
    'use strict';

    let allEvents = [];
    let eventsLoaded = false;

    document.addEventListener('DOMContentLoaded', () => {
        document.getElementById('eventsViewBtn')?.addEventListener('click', () => window.switchAdminView('events'));
        document.getElementById('newEventBtn')?.addEventListener('click', () => openEventModal(null));
        document.getElementById('adminSearch')?.addEventListener('input', () => {
            if (window.currentAdminView === 'events') renderEventsTable();
        });

        bindEventModalControls();
    });

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

        const sorted = [...filtered].sort((a, b) => new Date(a.start_at) - new Date(b.start_at));

        const tierColors = { FREE: 'bg-gray-100 text-gray-700', FEATURED: 'bg-yellow-100 text-yellow-700', PREMIUM: 'bg-purple-100 text-purple-700' };
        const statusColors = { scheduled: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700', postponed: 'bg-orange-100 text-orange-700', sold_out: 'bg-gray-200 text-gray-700' };

        tbody.innerHTML = sorted.map((e) => {
            const tier = e.tier || 'FREE';
            const status = e.status || 'scheduled';
            // /event/<slug> — singular, matching /listing/<slug>. NOT
            // /events/<slug> (plural is the homepage/directory namespace).
            const eventUrl = `/event/${e.slug || ''}`;
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
            try {
                await window.adminProxy('shortlinks:delete_event', { event_refer_id: id });
            } catch (shortlinkErr) {
                console.warn('Event deleted, but shortlink cleanup failed:', shortlinkErr);
            }
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
        bindFormControls();

        modal.classList.remove('hidden');
    };

    function bindFormControls() {
        document.getElementById('eventCustomVenueToggle')?.addEventListener('change', (e) => {
            document.getElementById('eventCustomVenueFields')?.classList.toggle('hidden', !e.target.checked);
            document.getElementById('eventVenueListingField')?.classList.toggle('hidden', e.target.checked);
        });
        document.getElementById('eventHostListingSearch')?.addEventListener('input', (e) =>
            renderListingAutocomplete(e.target, 'eventHostListingResults', 'eventHostListingId'));
        document.getElementById('eventVenueListingSearch')?.addEventListener('input', (e) =>
            renderListingAutocomplete(e.target, 'eventVenueListingResults', 'eventVenueListingId', selectVenueListing));
        document.getElementById('ev_is_recurring')?.addEventListener('change', (e) => {
            document.getElementById('ev_recurrence_fields')?.classList.toggle('hidden', !e.target.checked);
        });
    }

    function buildEventFormHtml(event) {
        event = event || {};
        const recurrence = event.recurrence && typeof event.recurrence === 'object' ? event.recurrence : {};
        const hasCustomVenue = !event.venue_listing_id && Boolean(event.custom_venue_name);

        return `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input type="text" id="ev_title" value="${escapeAttr(event.title)}" class="w-full px-3 py-2 border border-gray-300 rounded-lg" required>
            </div>
            <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-1">Slug * <span class="text-gray-400 font-normal">(used in /event/&lt;slug&gt;)</span></label>
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
                <p class="text-xs text-gray-500 mt-1">Selecting a venue fills in the address/city/state/coordinates below from that listing. Edit them afterward to override.</p>
            </div>
            <div id="eventCustomVenueFields" class="md:col-span-2 ${hasCustomVenue ? '' : 'hidden'}">
                <label class="block text-sm font-medium text-gray-700 mb-1">Venue Name</label>
                <input type="text" id="ev_custom_venue_name" value="${escapeAttr(event.custom_venue_name)}" class="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="e.g. Daley Plaza">
            </div>

            <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-1">Address <span class="text-gray-400 font-normal">— the venue address IS the event address, unless overridden here</span></label>
                <input type="text" id="ev_address" value="${escapeAttr(event.address)}" class="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="123 Main St">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">City <span class="text-gray-400 font-normal">(proper case, e.g. "Oak Park" — used for /events/chicago-style regional pages)</span></label>
                <input type="text" id="ev_city" value="${escapeAttr(event.city)}" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">State</label>
                <input type="text" id="ev_state" value="${escapeAttr(event.state || 'IL')}" maxlength="2" class="w-full px-3 py-2 border border-gray-300 rounded-lg uppercase">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Zip Code</label>
                <input type="text" id="ev_zip_code" value="${escapeAttr(event.zip_code)}" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Latitude <span class="text-gray-400 font-normal">(leave blank to auto-fill from venue or auto-geocode)</span></label>
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
        const address = document.getElementById('ev_address')?.value.trim() || null;
        const city = document.getElementById('ev_city')?.value.trim() || null;
        const state = document.getElementById('ev_state')?.value.trim().toUpperCase() || null;
        const zipCode = document.getElementById('ev_zip_code')?.value.trim() || null;

        // ── AUTO-GEOCODING ───────────────────────────────────────────
        // Mirrors js/admin.js's saveListing() exactly: manual lat/lng
        // wins if present (this also covers the "venue selected" case,
        // since selectVenueListing() already wrote the venue's own
        // coordinates into these fields at selection time — by the time
        // save runs, that counts as "manually filled" the same as if the
        // admin had typed it in directly). Only geocodes via Nominatim
        // when both are empty AND there's an address to geocode — which
        // in practice means: a custom venue where nobody selected a
        // listing and nobody typed coordinates by hand.
        let lat = parseFloat(document.getElementById('ev_lat')?.value);
        let lng = parseFloat(document.getElementById('ev_lng')?.value);
        if (Number.isNaN(lat) || Number.isNaN(lng)) {
            if (address && city && state) {
                console.log('\ud83c\udf0d Auto-geocoding event address...');
                const geocoded = await geocodeEventAddress(address, city, state, zipCode);
                if (geocoded) {
                    lat = geocoded.lat;
                    lng = geocoded.lng;
                    console.log('\u2705 Coordinates found:', geocoded);
                } else {
                    console.log('\u26a0\ufe0f Could not geocode event address');
                }
            }
        } else {
            console.log('\ud83d\udccd Coordinates already present (manual or venue-selected); skipping auto-geocoding.');
        }
        const coordinates = (!Number.isNaN(lat) && !Number.isNaN(lng)) ? { lat, lng } : null;

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

            address,
            city,
            state,
            zip_code: zipCode,
            coordinates,

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

            let savedEvent;
            const isExisting = Boolean(id);

            if (isExisting) {
                savedEvent = await window.adminProxy('events:update', { id, ...payload });
                const idx = allEvents.findIndex((e) => e.id === id);
                if (idx !== -1) allEvents[idx] = { ...allEvents[idx], ...payload };
            } else {
                savedEvent = await window.adminProxy('events:insert', payload);
                if (savedEvent && savedEvent.id) allEvents.unshift(savedEvent);
            }

            if (!isExisting && savedEvent && savedEvent.id && savedEvent.slug) {
                try {
                    await createEventShortlink(savedEvent.id, savedEvent.slug, payload.title);
                } catch (shortlinkErr) {
                    console.error('Event saved, but shortlink creation failed:', shortlinkErr);
                    alert('Event saved, but the shortlink could not be created. You can add one manually later.');
                }
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
    // Geocoding — mirrors js/admin.js's geocodeAddress(address, city,
    // state, zipCode) function signature and Nominatim call exactly.
    // -------------------------------------------------------------------

    async function geocodeEventAddress(address, city, state, zipCode) {
        try {
            const fullAddress = [address, city, state, zipCode].filter(Boolean).join(', ');
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}&limit=1`,
                { headers: { 'User-Agent': 'TheGreekDirectory/1.0' } }
            );
            const data = await response.json();
            if (data && data.length > 0) {
                return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
            }
            return null;
        } catch (error) {
            console.error('Geocoding error:', error);
            return null;
        }
    }

    // -------------------------------------------------------------------
    // System shortlink creation — mirrors js/admin.js's
    // SYSTEM_SHORTLINK_ALPHABET / isValidSystemShortlink /
    // generateSystemShortlinkCandidate / the retry loop in saveListing()
    // exactly, swapped to /e/ + event_refer_id, and to the full
    // /event/<slug> URL as the redirect target.
    // -------------------------------------------------------------------

    const EVENT_SHORTLINK_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

    function isValidEventShortlink(path) {
        return typeof path === 'string'
            && /^\/e\/[ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789]{6}$/.test(path)
            && !/[A-Za-z]{4}/.test(path);
    }

    function generateEventShortlinkCandidate() {
        let suffix = '';
        for (let i = 0; i < 6; i += 1) {
            suffix += EVENT_SHORTLINK_ALPHABET[Math.floor(Math.random() * EVENT_SHORTLINK_ALPHABET.length)];
        }
        return `/e/${suffix}`;
    }

    async function createEventShortlink(eventId, eventSlug, title) {
        for (;;) {
            const candidate = generateEventShortlinkCandidate();
            if (!isValidEventShortlink(candidate)) continue;
            const exists = await window.adminProxy('shortlinks:check', { path: candidate });
            if (exists) continue;
            try {
                await window.adminProxy('shortlinks:insert_event', {
                    title: `EVENT: ${title}`,
                    path: candidate,
                    redirect_to: `https://thegreekdirectory.org/event/${eventSlug}`,
                    event_refer_id: eventId,
                });
                return candidate;
            } catch (err) {
                if (err?.message && err.message.includes('path_conflict')) continue;
                throw err;
            }
        }
    }

    // -------------------------------------------------------------------
    // Listing autocomplete (host / venue)
    // -------------------------------------------------------------------

    function findListingNameById(id) {
        if (!id || !Array.isArray(window.allListings)) return '';
        const match = window.allListings.find((l) => l.id === id);
        return match ? match.business_name : '';
    }

    function selectVenueListing(listing) {
        const addressEl = document.getElementById('ev_address');
        const cityEl = document.getElementById('ev_city');
        const stateEl = document.getElementById('ev_state');
        const zipEl = document.getElementById('ev_zip_code');
        const latEl = document.getElementById('ev_lat');
        const lngEl = document.getElementById('ev_lng');

        if (addressEl && listing.address) addressEl.value = listing.address;
        if (cityEl && listing.city) cityEl.value = listing.city;
        if (stateEl && listing.state) stateEl.value = listing.state;
        if (zipEl && listing.zip_code) zipEl.value = listing.zip_code;
        if (listing.coordinates && typeof listing.coordinates === 'object') {
            if (latEl && listing.coordinates.lat != null) latEl.value = listing.coordinates.lat;
            if (lngEl && listing.coordinates.lng != null) lngEl.value = listing.coordinates.lng;
        }
    }

    function renderListingAutocomplete(inputEl, resultsId, hiddenFieldId, onSelect) {
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

        resultsEl.innerHTML = matches.map((l) => `
            <div class="location-search-result" data-id="${escapeAttr(l.id)}" data-name="${escapeAttr(l.business_name)}">
                ${escapeHtml(l.business_name)} <span class="text-gray-400 text-xs">${escapeHtml(l.city || '')}${l.state ? ', ' + escapeHtml(l.state) : ''}</span>
            </div>`).join('');
        resultsEl.classList.add('active');

        resultsEl.querySelectorAll('.location-search-result').forEach((item, idx) => {
            item.addEventListener('click', () => {
                inputEl.value = item.dataset.name;
                hiddenEl.value = item.dataset.id;
                resultsEl.innerHTML = '';
                resultsEl.classList.remove('active');
                if (typeof onSelect === 'function') onSelect(matches[idx]);
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
