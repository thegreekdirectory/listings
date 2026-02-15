import { formatRelativeDate } from '/js/utils/relative-date.js';

const supabase = window.supabaseClient;

export async function fetchPublishedNews(filters = {}) {
  let query = supabase
    .from('news_articles')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  if (filters.listingId) query = query.eq('listing_id', filters.listingId);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

function firstWords(text = '', count = 15) {
  return text.split(/\s+/).slice(0, count).join(' ') + '…';
}

export function renderNewsGrid(items = [], container) {
  container.innerHTML = items.map((item) => `
    <article class="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      ${item.image_url ? `<img loading="lazy" src="${item.image_url}" alt="${item.title}" class="w-full h-40 object-cover" />` : ''}
      <div class="p-4">
        <h3 class="text-lg font-semibold text-gray-900"><a href="/news/${item.slug}">${item.title}</a></h3>
        <p class="text-sm text-gray-600 mt-2">${firstWords(item.excerpt || item.content || '')}</p>
        <p class="text-xs text-gray-500 mt-4 text-right">${formatRelativeDate(item.created_at)}</p>
      </div>
    </article>
  `).join('');
}
