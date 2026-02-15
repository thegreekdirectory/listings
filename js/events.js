import { buildCalendarLinks } from '/js/utils/calendar-links.js';

const supabase = window.supabaseClient;

export async function fetchPublishedEvents(filters = {}) {
  let query = supabase
    .from('events')
    .select('*')
    .eq('status', 'published')
    .order('start_datetime', { ascending: true });

  if (filters.listingId) query = query.eq('listing_id', filters.listingId);
  if (filters.search) query = query.or(`title.ilike.%${filters.search}%,venue_name.ilike.%${filters.search}%,venue_address.ilike.%${filters.search}%,organizer_name.ilike.%${filters.search}%`);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export function renderEventCards(events = [], container) {
  container.innerHTML = events.map((event) => {
    const links = buildCalendarLinks(event);
    return `
      <article class="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <img loading="lazy" src="${event.image_url || 'https://placehold.co/640x360'}" alt="${event.title}" class="w-full h-40 object-cover rounded-lg mb-3" />
        <h3 class="text-lg font-semibold text-gray-900">${event.title}</h3>
        <p class="text-sm text-gray-600 mt-1">${new Date(event.start_datetime).toLocaleString()}</p>
        <p class="text-sm text-gray-600">${event.venue_name || ''} ${event.venue_address || ''}</p>
        <div class="mt-3 flex gap-2 flex-wrap">
          <a class="text-sm px-3 py-1.5 bg-blue-700 text-white rounded-lg" href="/event/${event.slug}">View</a>
          <details class="relative">
            <summary class="text-sm px-3 py-1.5 bg-gray-100 rounded-lg cursor-pointer">Add to calendar</summary>
            <div class="absolute z-30 bg-white border rounded-lg mt-2 p-2 text-sm shadow-lg">
              <a class="block py-1" href="${links.google}" target="_blank" rel="noopener">Google Calendar</a>
              <a class="block py-1" href="${links.apple}" download="${event.slug || 'event'}.ics">Apple Calendar</a>
              <a class="block py-1" href="${links.outlook365}" target="_blank" rel="noopener">Outlook 365</a>
              <a class="block py-1" href="${links.outlookLive}" target="_blank" rel="noopener">Outlook Live</a>
            </div>
          </details>
        </div>
      </article>`;
  }).join('');
}
