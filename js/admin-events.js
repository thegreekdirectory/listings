/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
This source code is proprietary and no part may not be used, reproduced, or distributed
without written permission from The Greek Directory. Unauthorized use, copying, modification,
or distribution of this code can result in legal action to the fullest extent permitted by law.
*/

// js/admin-events.js
//
// Events section of the Admin Portal. Depends on js/admin.js having
// already run (window.adminProxy, window.allListings, and several
// previously-listings-only globals this file calls directly:
// generateSlugFromName, isValidCustomShortlink,
// createPhoneInput/getPhoneValue/normalizePhoneE164, userCountry,
// uploadToCloudflareImages, window.RichTextEditor).
//
// Incorporates fixes found after real use on the live site:
//   - loadEventCategories() is called from loadEventsAdmin() (which only
//     ever runs post-login), NOT from an unconditional DOMContentLoaded
//     listener — the earlier version fired before authentication,
//     producing "Invalid GitHub token".
//   - uploadToCloudflareImages' assetType is 'photo' (validated
//     server-side against a fixed enum: logo/photo/video) — an earlier
//     version used invented values ('event-poster'/'event-gallery')
//     that the server rejected with a 400.
//   - Organizer/Venue search fields show the selected listing's UUID in
//     the visible input (not the business name) after selection — the
//     status line below still shows the business name for confirmation.
//   - Custom shortlink field's domain prefix is tgd.gr, not the main
//     domain — shortlinks live there, confirmed directly rather than
//     assumed.
//   - Poster and gallery both have visible URL inputs as an alternative
//     to uploading.

(function () {
    'use strict';

    let allEvents = [];
    let eventsLoaded = false;
    let eventCategoriesLoaded = false;

    let eventCategories = [];
    let eventSubcategoriesByCategory = {};
    let selectedEventSubcategories = [];
    let currentGalleryItems = [];

    let organizerSearchTimer = null;
    let venueSearchTimer = null;
    let customShortlinkCheckTimer = null;

    let adminEventDescriptionEditor = null;

    document.addEventListener('DOMContentLoaded', () => {
        document.getElementById('eventsViewBtn')?.addEventListener('click', () => window.switchAdminView('events'));
        document.getElementById('newEventBtn')?.addEventListener('click', () => openEventModal(null));
        document.getElementById('manageEventCategoriesBtn')?.addEventListener('click', manageEventCategories);
        document.getElementById('adminSearch')?.addEventListener('input', () => {
            if (window.currentAdminView === 'events') renderEventsTable();
        });

        bindEventModalControls();
        // loadEventCategories() is intentionally NOT called here — see
        // loadEventsAdmin() below for why.
    });

    window.loadEventsAdmin = loadEventsAdmin;

    // -------------------------------------------------------------------
    // Category/subcategory loading + management
    // -------------------------------------------------------------------

    async function loadEventCategories() {
        try {
            const data = await window.adminProxy('event_subcategories:list', {});
            if (Array.isArray(data)) {
                eventCategories = data.map((row) => row.category).filter(Boolean).sort();
                eventSubcategoriesByCategory = {};
                data.forEach((row) => {
                    if (row.category && Array.isArray(row.subcategories)) {
                        eventSubcategoriesByCategory[row.category] = row.subcategories;
                    }
                });
            }
        } catch (err) {
            console.warn('Could not load event categories:', err);
        }
    }

    window.manageEventCategories = async function manageEventCategories() {
        const existingList = eventCategories.length ? eventCategories.join('\n') : '(none yet)';
        const category = prompt('Enter a category to add or edit (existing categories below).\nTyping a new name creates it:\n\n' + existingList);
        if (!category || !category.trim()) return;
        const trimmed = category.trim();
        const current = (eventSubcategoriesByCategory[trimmed] || []).join(', ');
        const updated = prompt(`Enter comma-separated subcategories for "${trimmed}":`, current);
        if (updated === null) return;
        const list = updated.split(',').map((v) => v.trim()).filter(Boolean);
        try {
            await window.adminProxy('event_subcategories:insert', { category: trimmed, subcategories: list });
            eventSubcategoriesByCategory[trimmed] = list;
            if (!eventCategories.includes(trimmed)) {
                eventCategories.push(trimmed);
                eventCategories.sort();
            }
            const categorySelect = document.getElementById('ev_category');
            if (categorySelect) {
                const previousValue = categorySelect.value;
                categorySelect.innerHTML = buildCategoryOptionsHtml(previousValue);
                updateEventSubcategoryCheckboxes();
            }
            alert('Event categories updated.');
        } catch (err) {
            alert('Failed to save event categories: ' + (err.message || 'Unknown error'));
        }
    };

    function buildCategoryOptionsHtml(selectedValue) {
        const options = ['<option value="">Select a category…</option>']
            .concat(eventCategories.map((cat) => `<option value="${escapeAttr(cat)}" ${cat === selectedValue ? 'selected' : ''}>${escapeHtml(cat)}</option>`));
        return options.join('');
    }

    function updateEventSubcategoryCheckboxes() {
        const category = document.getElementById('ev_category')?.value;
        const container = document.getElementById('eventSubcategoriesContainer');
        const checkboxDiv = document.getElementById('eventSubcategoryCheckboxes');
        if (!container || !checkboxDiv) return;

        const subs = category ? (eventSubcategoriesByCategory[category] || []) : [];
        if (!subs.length) {
            container.classList.add('hidden');
            checkboxDiv.innerHTML = '';
            return;
        }

        container.classList.remove('hidden');
        checkboxDiv.innerHTML = subs.map((sub) => {
            const isChecked = selectedEventSubcategories.includes(sub);
            const safeId = `ev-subcat-${sub.replace(/[^a-zA-Z0-9]+/g, '-')}`;
            return `
                <label for="${safeId}" class="flex items-center gap-2 p-2 border rounded cursor-pointer">
                    <input type="checkbox" id="${safeId}" value="${escapeAttr(sub)}" ${isChecked ? 'checked' : ''} class="rounded text-blue-600 focus:ring-blue-500">
                    <span class="text-sm select-none flex-1 text-gray-700">${escapeHtml(sub)}</span>
                </label>`;
        }).join('');

        checkboxDiv.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
            cb.addEventListener('change', () => {
                if (cb.checked) {
                    if (!selectedEventSubcategories.includes(cb.value)) selectedEventSubcategories.push(cb.value);
                } else {
                    selectedEventSubcategories = selectedEventSubcategories.filter((s) => s !== cb.value);
                }
            });
        });
    }

    // -------------------------------------------------------------------
    // Load + render events table
    // -------------------------------------------------------------------

    async function loadEventsAdmin() {
        // Categories load here (once per session), not at page load —
        // this function only ever runs after a successful login and
        // switching to the Events tab, both of which guarantee
        // adminProxy() already has a valid token.
        if (!eventCategoriesLoaded) {
            await loadEventCategories();
            eventCategoriesLoaded = true;
        }

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

    window.openEventModal = async function (id) {
        const event = id ? allEvents.find((e) => e.id === id) : null;
        const modal = document.getElementById('eventEditModal');
        if (!modal) return;

        modal.dataset.eventId = id || '';
        modal.dataset.hasCustomShortlink = '';
        document.getElementById('eventModalTitle').textContent = event ? 'Edit Event' : 'New Event';

        currentGalleryItems = Array.isArray(event?.gallery) ? event.gallery.map((item) => ({ ...item })) : [];
        selectedEventSubcategories = Array.isArray(event?.subcategories) ? [...event.subcategories] : [];
        adminEventDescriptionEditor = null;

        document.getElementById('eventEditFormContent').innerHTML = buildEventFormHtml(event);
        bindFormControls(event);
        renderGalleryItems();

        if (event?.id) {
            try {
                const existingShortlinks = await window.adminProxy('shortlinks:get_event', { event_id: event.id });
                const customRow = Array.isArray(existingShortlinks) ? existingShortlinks.find((s) => s.event_custom === true) : null;
                const shortlinkInput = document.getElementById('ev_custom_shortlink');
                if (shortlinkInput && customRow) {
                    shortlinkInput.value = customRow.path.replace(/^\//, '');
                    modal.dataset.hasCustomShortlink = 'true';
                    setShortlinkStatus('Current custom shortlink.', 'text-gray-500');
                }
            } catch (err) {
                console.warn('Could not load existing shortlink:', err);
            }
        }

        modal.classList.remove('hidden');
    };

    function bindFormControls(event) {
        document.getElementById('eventCustomVenueToggle')?.addEventListener('change', (e) => {
            document.getElementById('eventCustomVenueFields')?.classList.toggle('hidden', !e.target.checked);
            document.getElementById('eventVenueListingField')?.classList.toggle('hidden', e.target.checked);
        });

        document.getElementById('ev_is_recurring')?.addEventListener('change', (e) => {
            document.getElementById('ev_recurrence_fields')?.classList.toggle('hidden', !e.target.checked);
        });

        document.getElementById('ev_category')?.addEventListener('change', updateEventSubcategoryCheckboxes);
        updateEventSubcategoryCheckboxes();

        bindListingSearchField('eventOrganizerSearch', 'eventOrganizerId', 'eventOrganizerStatus', 'organizer', selectOrganizerListing);
        bindListingSearchField('eventVenueSearch', 'eventVenueId', 'eventVenueStatus', 'venue', selectVenueListing);
        document.getElementById('eventOrganizerCheckBtn')?.addEventListener('click', () => checkListingUUID('eventOrganizerId', 'eventOrganizerStatus', selectOrganizerListing));
        document.getElementById('eventVenueCheckBtn')?.addEventListener('click', () => checkListingUUID('eventVenueId', 'eventVenueStatus', selectVenueListing));

        document.getElementById('eventSlugCheckBtn')?.addEventListener('click', checkEventSlugAvailability);

        document.getElementById('ev_custom_shortlink')?.addEventListener('input', (e) => {
            clearTimeout(customShortlinkCheckTimer);
            const raw = e.target.value.trim();
            if (!raw) { setShortlinkStatus('', ''); return; }
            customShortlinkCheckTimer = setTimeout(() => checkCustomShortlink(raw), 400);
        });

        if (window.RichTextEditor && typeof window.RichTextEditor.mount === 'function') {
            adminEventDescriptionEditor = window.RichTextEditor.mount({ inputId: 'ev_description' });
        }

        const phoneContainer = document.getElementById('eventPhoneContainer');
        if (phoneContainer && typeof window.createPhoneInput === 'function') {
            phoneContainer.innerHTML = window.createPhoneInput(event?.contact_phone || '', window.userCountry || 'USA');
        } else if (phoneContainer) {
            phoneContainer.innerHTML = `<input type="tel" id="ev_contact_phone_fallback" value="${escapeAttr(event?.contact_phone)}" placeholder="Phone" class="w-full px-3 py-2 border border-gray-300 rounded-lg">`;
        }

        document.getElementById('ev_poster_upload')?.addEventListener('change', handlePosterUpload);
        document.getElementById('ev_gallery_upload')?.addEventListener('change', handleGalleryUpload);
        document.getElementById('ev_poster_image')?.addEventListener('input', (e) => {
            const url = e.target.value.trim();
            const previewWrap = document.getElementById('eventPosterPreviewWrap');
            const preview = document.getElementById('eventPosterPreview');
            if (preview) preview.src = url;
            if (previewWrap) previewWrap.classList.toggle('hidden', !url);
        });
        document.getElementById('ev_gallery_url_add_btn')?.addEventListener('click', () => {
            const input = document.getElementById('ev_gallery_url_input');
            const url = input?.value.trim();
            if (!url) return;
            currentGalleryItems.push({ url, label: '' });
            renderGalleryItems();
            if (input) input.value = '';
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
                <label class="block text-sm font-medium text-gray-700 mb-1">Slug <span class="text-gray-400 font-normal">(leave blank to auto-generate as city-state/event-name, or online/event-name with no address)</span></label>
                <div class="flex gap-2">
                    <input type="text" id="ev_slug" value="${escapeAttr(event.slug)}" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm" placeholder="chicago-il/greek-fest-2026">
                    <button type="button" id="eventSlugCheckBtn" class="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 whitespace-nowrap">Check</button>
                </div>
                <p id="eventSlugStatus" class="text-xs mt-1"></p>
            </div>

            <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-1">Custom Shortlink <span class="text-gray-400 font-normal">(optional — a system shortlink is always created automatically on save)</span></label>
                <div class="flex items-center gap-2">
                    <span class="text-gray-500 text-sm">tgd.gr/</span>
                    <input type="text" id="ev_custom_shortlink" placeholder="your-custom-path" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm">
                </div>
                <p id="eventShortlinkStatus" class="text-xs mt-1"></p>
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
                <select id="ev_category" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    ${buildCategoryOptionsHtml(event.category)}
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Tier <span class="text-gray-400 font-normal">(auto-fills from Organizer's tier; defaults to Free otherwise)</span></label>
                <select id="ev_tier" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option value="FREE" ${event.tier === 'FREE' || !event.tier ? 'selected' : ''}>Free</option>
                    <option value="FEATURED" ${event.tier === 'FEATURED' ? 'selected' : ''}>Featured</option>
                    <option value="PREMIUM" ${event.tier === 'PREMIUM' ? 'selected' : ''}>Premium</option>
                </select>
            </div>
            <div id="eventSubcategoriesContainer" class="md:col-span-2 hidden">
                <label class="block text-sm font-medium text-gray-700 mb-2">Subcategories</label>
                <div id="eventSubcategoryCheckboxes" class="grid grid-cols-2 gap-2"></div>
            </div>

            <div class="md:col-span-2 border-t pt-4 mt-2">
                <h3 class="font-semibold text-gray-900 mb-2">Organizer &amp; Venue</h3>
            </div>
            <div class="md:col-span-2 relative">
                <label class="block text-sm font-medium text-gray-700 mb-1">Organizer <span class="text-gray-400 font-normal">— search by business name or paste a listing UUID</span></label>
                <div class="flex gap-2">
                    <input type="text" id="eventOrganizerSearch" placeholder="Search by name or paste UUID…" value="${escapeAttr(event.organizer_listing_id || '')}" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg" autocomplete="off">
                    <button type="button" id="eventOrganizerCheckBtn" class="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 whitespace-nowrap">Check</button>
                </div>
                <input type="hidden" id="eventOrganizerId" value="${escapeAttr(event.organizer_listing_id)}">
                <p id="eventOrganizerStatus" class="text-xs mt-1">${renderInitialListingStatus(event.organizer_listing_id)}</p>
            </div>
            <div class="md:col-span-2">
                <label class="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" id="eventCustomVenueToggle" class="w-4 h-4" ${hasCustomVenue ? 'checked' : ''}>
                    <span class="text-sm font-medium text-gray-700">Venue is not a directory listing (custom venue)</span>
                </label>
            </div>
            <div id="eventVenueListingField" class="md:col-span-2 relative ${hasCustomVenue ? 'hidden' : ''}">
                <label class="block text-sm font-medium text-gray-700 mb-1">Venue <span class="text-gray-400 font-normal">— search by business name or paste a listing UUID</span></label>
                <div class="flex gap-2">
                    <input type="text" id="eventVenueSearch" placeholder="Search by name or paste UUID…" value="${escapeAttr(event.venue_listing_id || '')}" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg" autocomplete="off">
                    <button type="button" id="eventVenueCheckBtn" class="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 whitespace-nowrap">Check</button>
                </div>
                <input type="hidden" id="eventVenueId" value="${escapeAttr(event.venue_listing_id)}">
                <p id="eventVenueStatus" class="text-xs mt-1">${renderInitialListingStatus(event.venue_listing_id)} Selecting a venue fills in the address/city/state/coordinates below. Edit them afterward to override.</p>
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
                <label class="block text-sm font-medium text-gray-700 mb-1">City <span class="text-gray-400 font-normal">(proper case, e.g. "Oak Park")</span></label>
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
                <h3 class="font-semibold text-gray-900 mb-2">Poster</h3>
                <p class="text-xs text-gray-500 mb-2">A single poster/flyer image — this is the event's primary image, like a listing's logo.</p>
            </div>
            <div class="md:col-span-2">
                ${buildDropzoneHtml('ev_poster_upload', 'Click to upload poster', false)}
                <label class="block text-xs font-medium text-gray-600 mt-3 mb-1">Or paste an image URL directly</label>
                <input type="text" id="ev_poster_image" value="${escapeAttr(event.poster_image)}" placeholder="https://images.thegreekdirectory.org/..." class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <div id="eventPosterPreviewWrap" class="mt-2 ${event.poster_image ? '' : 'hidden'}">
                    <img id="eventPosterPreview" src="${escapeAttr(event.poster_image)}" class="w-24 h-24 object-cover rounded-lg border" alt="Poster preview">
                </div>
                <p id="eventPosterUploadStatus" class="text-xs mt-1"></p>
            </div>

            <div class="md:col-span-2 border-t pt-4 mt-2">
                <h3 class="font-semibold text-gray-900 mb-2">Event Gallery</h3>
                <p class="text-xs text-gray-500 mb-2">Additional photos, each with a label (used as alt text). Shown at the bottom of the event page.</p>
            </div>
            <div class="md:col-span-2">
                ${buildDropzoneHtml('ev_gallery_upload', 'Click to upload gallery images', true)}
                <p id="eventGalleryUploadStatus" class="text-xs mt-1 mb-2"></p>
                <div class="flex gap-2 mb-3">
                    <input type="text" id="ev_gallery_url_input" placeholder="Or paste an image URL directly…" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    <button type="button" id="ev_gallery_url_add_btn" class="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 whitespace-nowrap">Add</button>
                </div>
                <div id="eventGalleryItems" class="space-y-2"></div>
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
            <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <div id="eventPhoneContainer"></div>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="text" id="ev_contact_email" value="${escapeAttr(event.contact_email)}" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Website</label>
                <input type="text" id="ev_website" value="${escapeAttr(event.website)}" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
            </div>
            <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-1">Meta Description <span class="text-gray-400 font-normal">(SEO)</span></label>
                <input type="text" id="ev_meta_description" value="${escapeAttr(event.meta_description)}" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
            </div>

            <div class="md:col-span-2 border-t pt-4 mt-2">
                <h3 class="font-semibold text-gray-900 mb-2">Custom Schema Properties <span class="text-gray-400 font-normal text-sm">(advanced)</span></h3>
                <p class="text-xs text-gray-500 mb-2">Additional schema.org JSON-LD properties, inserted exactly as typed.</p>
                <textarea id="ev_custom_schema_properties" rows="4" class="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm" placeholder='"performer": "Local Band Name",&#10;"inLanguage": "el"'>${escapeHtml(event.custom_schema_properties)}</textarea>
            </div>
        </div>`;
    }

    function renderInitialListingStatus(listingId) {
        const listing = findListingById(listingId);
        return listing ? `<span class="text-green-600">\u2713 ${escapeHtml(listing.business_name)}</span>` : '';
    }

    function buildDropzoneHtml(inputId, label, multiple) {
        return `
            <label for="${inputId}" class="flex flex-col items-center justify-center gap-1 w-full border-2 border-dashed border-gray-300 rounded-lg py-6 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                <span class="text-sm font-medium text-gray-600">${escapeHtml(label)}</span>
                <span class="text-xs text-gray-400">or drag and drop</span>
                <input type="file" id="${inputId}" accept="image/*" class="hidden" ${multiple ? 'multiple' : ''}>
            </label>`;
    }

    // -------------------------------------------------------------------
    // Organizer / Venue search — search by name (live dropdown) or paste
    // a UUID directly (validated via Check). The visible field shows the
    // UUID itself after selection, not the business name — the status
    // line below shows the business name for human confirmation.
    // -------------------------------------------------------------------

    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    function bindListingSearchField(searchInputId, hiddenFieldId, statusId, kind, onSelect) {
        const input = document.getElementById(searchInputId);
        if (!input) return;

        input.addEventListener('input', () => {
            const value = input.value.trim();
            if (kind === 'organizer') clearTimeout(organizerSearchTimer);
            else clearTimeout(venueSearchTimer);

            if (!value) {
                document.getElementById(hiddenFieldId).value = '';
                setStatusText(statusId, '', '');
                removeSearchDropdown(searchInputId);
                return;
            }

            if (UUID_RE.test(value)) {
                removeSearchDropdown(searchInputId);
                return;
            }

            const run = () => searchListingsByName(searchInputId, hiddenFieldId, statusId, value, onSelect);
            if (kind === 'organizer') organizerSearchTimer = setTimeout(run, 300);
            else venueSearchTimer = setTimeout(run, 300);
        });

        input.addEventListener('blur', () => {
            setTimeout(() => removeSearchDropdown(searchInputId), 150);
        });
    }

    async function searchListingsByName(searchInputId, hiddenFieldId, statusId, query, onSelect) {
        try {
            const listings = await window.adminProxy('listings:list', {});
            const matches = (Array.isArray(listings) ? listings : [])
                .filter((l) => (l.business_name || '').toLowerCase().includes(query.toLowerCase()))
                .slice(0, 8);
            renderSearchDropdown(searchInputId, hiddenFieldId, statusId, matches, onSelect);
        } catch (err) {
            console.error('Listing search failed:', err);
        }
    }

    function renderSearchDropdown(searchInputId, hiddenFieldId, statusId, matches, onSelect) {
        removeSearchDropdown(searchInputId);
        const input = document.getElementById(searchInputId);
        if (!input || !matches.length) return;

        const dropdown = document.createElement('div');
        dropdown.className = 'location-search-results active';
        dropdown.id = `${searchInputId}Dropdown`;
        dropdown.innerHTML = matches.map((l) => `
            <div class="location-search-result" data-id="${escapeAttr(l.id)}" data-name="${escapeAttr(l.business_name)}">
                ${escapeHtml(l.business_name)} <span class="text-gray-400 text-xs">${escapeHtml(l.city || '')}${l.state ? ', ' + escapeHtml(l.state) : ''}</span>
            </div>`).join('');

        input.insertAdjacentElement('afterend', dropdown);

        dropdown.querySelectorAll('.location-search-result').forEach((row, idx) => {
            row.addEventListener('mousedown', (e) => {
                e.preventDefault();
                // Visible field shows the UUID (not the business name)
                // after selection — the status line below shows the
                // matched business name for human confirmation.
                input.value = matches[idx].id;
                document.getElementById(hiddenFieldId).value = matches[idx].id;
                setStatusText(statusId, `\u2713 ${matches[idx].business_name}`, 'text-green-600');
                removeSearchDropdown(searchInputId);
                if (typeof onSelect === 'function') onSelect(matches[idx]);
            });
        });
    }

    function removeSearchDropdown(searchInputId) {
        document.getElementById(`${searchInputId}Dropdown`)?.remove();
    }

    async function checkListingUUID(hiddenFieldId, statusId, onSelect) {
        const searchInputId = hiddenFieldId === 'eventOrganizerId' ? 'eventOrganizerSearch' : 'eventVenueSearch';
        const input = document.getElementById(searchInputId);
        const raw = input?.value.trim() || '';
        if (!raw) { setStatusText(statusId, '', ''); return; }

        if (!UUID_RE.test(raw)) {
            setStatusText(statusId, '\u26a0\ufe0f Not a valid UUID — type a business name to search instead.', 'text-orange-600');
            return;
        }

        try {
            const listings = await window.adminProxy('listings:list', {});
            const match = (Array.isArray(listings) ? listings : []).find((l) => l.id === raw);
            if (match) {
                document.getElementById(hiddenFieldId).value = match.id;
                // input already holds the UUID just typed/pasted — left
                // as-is rather than overwritten with the business name.
                setStatusText(statusId, `\u2713 ${match.business_name}`, 'text-green-600');
                if (typeof onSelect === 'function') onSelect(match);
            } else {
                setStatusText(statusId, '\u274c No listing found with that UUID.', 'text-red-600');
            }
        } catch (err) {
            setStatusText(statusId, 'Could not verify UUID: ' + (err.message || 'Unknown error'), 'text-red-600');
        }
    }

    function setStatusText(elementId, text, colorClass) {
        const el = document.getElementById(elementId);
        if (!el) return;
        el.textContent = text;
        el.className = `text-xs mt-1 ${colorClass || ''}`;
    }

    function findListingById(id) {
        if (!id || !Array.isArray(window.allListings)) return null;
        return window.allListings.find((l) => l.id === id) || null;
    }

    function selectOrganizerListing(listing) {
        const tierSelect = document.getElementById('ev_tier');
        if (!tierSelect) return;
        const listingTier = listing?.tier;
        // events.tier's CHECK constraint only allows FREE/FEATURED/PREMIUM
        // — VERIFIED (listing-only) maps to FREE.
        const mappedTier = (listingTier === 'FEATURED' || listingTier === 'PREMIUM') ? listingTier : 'FREE';
        tierSelect.value = mappedTier;
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

    // -------------------------------------------------------------------
    // Slug availability check
    // -------------------------------------------------------------------

    async function checkEventSlugAvailability() {
        const slugInput = document.getElementById('ev_slug');
        const modal = document.getElementById('eventEditModal');
        const currentEventId = modal?.dataset.eventId || null;
        const slug = slugInput?.value.trim();

        if (!slug) {
            setStatusText('eventSlugStatus', 'Leave blank to auto-generate on save.', 'text-gray-500');
            return;
        }

        try {
            const events = await window.adminProxy('events:list', {});
            const conflict = (Array.isArray(events) ? events : []).find((e) => e.slug === slug && e.id !== currentEventId);
            if (conflict) {
                setStatusText('eventSlugStatus', `\u274c Already used by "${conflict.title}".`, 'text-red-600');
            } else {
                setStatusText('eventSlugStatus', '\u2713 Available.', 'text-green-600');
            }
        } catch (err) {
            setStatusText('eventSlugStatus', 'Could not check: ' + (err.message || 'Unknown error'), 'text-red-600');
        }
    }

    function setShortlinkStatus(text, colorClass) {
        setStatusText('eventShortlinkStatus', text, colorClass);
    }

    async function checkCustomShortlink(rawValue) {
        const path = '/' + rawValue.replace(/^\/+/, '');
        if (typeof window.isValidCustomShortlink === 'function' && !window.isValidCustomShortlink(path)) {
            setShortlinkStatus('\u26a0\ufe0f Use letters, numbers, hyphens, underscores, and slashes only.', 'text-orange-600');
            return;
        }
        try {
            const exists = await window.adminProxy('shortlinks:check', { path });
            setShortlinkStatus(exists ? '\u274c Already taken.' : '\u2713 Available.', exists ? 'text-red-600' : 'text-green-600');
        } catch (err) {
            setShortlinkStatus('Could not check: ' + (err.message || 'Unknown error'), 'text-red-600');
        }
    }

    // -------------------------------------------------------------------
    // Poster / gallery uploads — assetType is 'photo' (validated
    // server-side against a fixed enum: logo/photo/video). Invented
    // values like 'event-poster'/'event-gallery' were rejected with a
    // 400; 'photo' is the correct fit and that function's own default.
    // -------------------------------------------------------------------

    async function handlePosterUpload(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        const statusEl = document.getElementById('eventPosterUploadStatus');
        if (statusEl) statusEl.textContent = '\u23f3 Uploading poster\u2026';
        try {
            const url = await window.uploadToCloudflareImages(file, 'photo');
            const urlInput = document.getElementById('ev_poster_image');
            if (urlInput) urlInput.value = url;
            const previewWrap = document.getElementById('eventPosterPreviewWrap');
            const preview = document.getElementById('eventPosterPreview');
            if (preview) preview.src = url;
            if (previewWrap) previewWrap.classList.remove('hidden');
            if (statusEl) statusEl.textContent = '\u2705 Poster uploaded.';
        } catch (err) {
            console.error('Poster upload failed:', err);
            if (statusEl) statusEl.textContent = '\u274c Upload failed: ' + (err.message || 'Unknown error');
        }
    }

    async function handleGalleryUpload(e) {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;
        const statusEl = document.getElementById('eventGalleryUploadStatus');

        for (let i = 0; i < files.length; i += 1) {
            if (statusEl) statusEl.textContent = `\u23f3 Uploading image ${i + 1} of ${files.length}\u2026`;
            try {
                const url = await window.uploadToCloudflareImages(files[i], 'photo');
                currentGalleryItems.push({ url, label: '' });
            } catch (err) {
                console.error('Gallery image upload failed:', err);
                if (statusEl) statusEl.textContent = `\u274c Image ${i + 1} failed to upload: ${err.message || 'Unknown error'}`;
            }
        }
        if (statusEl) statusEl.textContent = `\u2705 ${files.length} image${files.length === 1 ? '' : 's'} uploaded.`;
        renderGalleryItems();
        e.target.value = '';
    }

    function renderGalleryItems() {
        const container = document.getElementById('eventGalleryItems');
        if (!container) return;
        if (!currentGalleryItems.length) {
            container.innerHTML = '';
            return;
        }
        container.innerHTML = currentGalleryItems.map((item, idx) => `
            <div class="flex items-center gap-2 border rounded-lg p-2" data-gallery-idx="${idx}">
                <img src="${escapeAttr(item.url)}" class="w-12 h-12 object-cover rounded flex-shrink-0 bg-gray-100" alt="">
                <input type="text" class="flex-1 px-2 py-1 border rounded text-sm gallery-label-input" data-gallery-idx="${idx}" placeholder="Label / alt text" value="${escapeAttr(item.label)}">
                <button type="button" class="text-red-600 text-sm px-2 gallery-remove-btn" data-gallery-idx="${idx}">Remove</button>
            </div>`).join('');

        container.querySelectorAll('.gallery-label-input').forEach((input) => {
            input.addEventListener('input', () => {
                const idx = parseInt(input.dataset.galleryIdx, 10);
                if (currentGalleryItems[idx]) currentGalleryItems[idx].label = input.value;
            });
        });
        container.querySelectorAll('.gallery-remove-btn').forEach((btn) => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.galleryIdx, 10);
                currentGalleryItems.splice(idx, 1);
                renderGalleryItems();
            });
        });
    }

    // -------------------------------------------------------------------
    // Save
    // -------------------------------------------------------------------

    async function saveEvent() {
        const modal = document.getElementById('eventEditModal');
        const id = modal?.dataset.eventId || null;
        const saveBtn = document.getElementById('saveEventEdit');

        const title = document.getElementById('ev_title')?.value.trim();
        const startAt = document.getElementById('ev_start_at')?.value;

        if (!title || !startAt) {
            alert('Title and Start date/time are required.');
            return;
        }

        const isCustomVenue = document.getElementById('eventCustomVenueToggle')?.checked;
        const address = document.getElementById('ev_address')?.value.trim() || null;
        const city = document.getElementById('ev_city')?.value.trim() || null;
        const state = document.getElementById('ev_state')?.value.trim().toUpperCase() || null;
        const zipCode = document.getElementById('ev_zip_code')?.value.trim() || null;

        let slug = document.getElementById('ev_slug')?.value.trim();
        if (!slug) {
            if (typeof window.generateSlugFromName === 'function') {
                slug = window.generateSlugFromName(title, address, city, state);
            } else {
                alert('Could not auto-generate a slug (generateSlugFromName is not available). Please enter one manually.');
                return;
            }
        }

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

        const descriptionRaw = adminEventDescriptionEditor
            ? adminEventDescriptionEditor.getHtml()
            : (document.getElementById('ev_description')?.value.trim() || '');
        const description = window.RichTextEditor && typeof window.RichTextEditor.sanitizeRichTextHtml === 'function'
            ? window.RichTextEditor.sanitizeRichTextHtml(descriptionRaw)
            : descriptionRaw;

        const phoneContainer = document.getElementById('eventPhoneContainer');
        const phone = (phoneContainer && typeof window.getPhoneValue === 'function')
            ? window.getPhoneValue(phoneContainer)
            : (document.getElementById('ev_contact_phone_fallback')?.value.trim() || null);

        const payload = {
            title,
            slug,
            tagline: document.getElementById('ev_tagline')?.value.trim() || null,
            description: description || null,
            category: document.getElementById('ev_category')?.value || null,
            subcategories: selectedEventSubcategories,
            tier: document.getElementById('ev_tier')?.value || 'FREE',

            organizer_listing_id: document.getElementById('eventOrganizerId')?.value || null,
            venue_listing_id: isCustomVenue ? null : (document.getElementById('eventVenueId')?.value || null),
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
            gallery: currentGalleryItems,

            is_free: !!document.getElementById('ev_is_free')?.checked,
            price_range: document.getElementById('ev_price_range')?.value.trim() || null,
            ticket_url: document.getElementById('ev_ticket_url')?.value.trim() || null,
            rsvp_url: document.getElementById('ev_rsvp_url')?.value.trim() || null,
            rsvp_required: !!document.getElementById('ev_rsvp_required')?.checked,
            capacity: document.getElementById('ev_capacity')?.value ? parseInt(document.getElementById('ev_capacity').value, 10) : null,
            registered_count: parseInt(document.getElementById('ev_registered_count')?.value, 10) || 0,

            status: document.getElementById('ev_status')?.value || 'scheduled',
            visible: !!document.getElementById('ev_visible')?.checked,

            contact_phone: phone,
            contact_email: document.getElementById('ev_contact_email')?.value.trim() || null,
            website: document.getElementById('ev_website')?.value.trim() || null,
            meta_description: document.getElementById('ev_meta_description')?.value.trim() || null,
            custom_schema_properties: document.getElementById('ev_custom_schema_properties')?.value || null,
        };

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
                    console.error('Event saved, but system shortlink creation failed:', shortlinkErr);
                    alert('Event saved, but the shortlink could not be created. You can add one manually later.');
                }
            }

            const customShortlinkRaw = document.getElementById('ev_custom_shortlink')?.value.trim();
            const alreadyHasCustom = modal?.dataset.hasCustomShortlink === 'true';
            if (customShortlinkRaw && !alreadyHasCustom && savedEvent && savedEvent.id) {
                const customPath = '/' + customShortlinkRaw.replace(/^\/+/, '');
                if (typeof window.isValidCustomShortlink !== 'function' || window.isValidCustomShortlink(customPath)) {
                    try {
                        await window.adminProxy('shortlinks:insert_event', {
                            title: `EVENT (custom): ${payload.title}`,
                            path: customPath,
                            redirect_to: `https://thegreekdirectory.org/event/${savedEvent.slug}`,
                            event_refer_id: savedEvent.id,
                            event_custom: true,
                        });
                    } catch (customErr) {
                        console.error('Custom shortlink creation failed:', customErr);
                        alert('Event saved, but the custom shortlink could not be created: ' + (customErr.message || 'it may already be taken.'));
                    }
                } else {
                    alert('Event saved, but the custom shortlink was not created — invalid format.');
                }
            } else if (customShortlinkRaw && alreadyHasCustom) {
                console.log('Custom shortlink field left unchanged (editing an existing custom shortlink through this UI is not supported). Change it directly in Supabase if needed.');
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
    // Geocoding
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
    // System shortlink creation
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
                    event_custom: false,
                });
                return candidate;
            } catch (err) {
                if (err?.message && err.message.includes('path_conflict')) continue;
                throw err;
            }
        }
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
