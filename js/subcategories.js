/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
*/

(function initSubcategoryStore(global) {
  const CACHE_MS = 24 * 60 * 60 * 1000;
  const SUPABASE_URL = 'https://luetekzqrrgdxtopzvqw.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1ZXRla3pxcnJnZHh0b3B6dnF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNDc2NDcsImV4cCI6MjA4MzkyMzY0N30.TIrNG8VGumEJc_9JvNHW-Q-UWfUGpPxR0v8POjWZJYg';

  let cachedMap = null;
  let cachedAt = 0;
  let inFlight = null;

  function getClient() {
    if (global.TGDAuth?.supabaseClient) return global.TGDAuth.supabaseClient;
    if (global.supabaseClient) return global.supabaseClient;
    if (global.supabase?.createClient) {
      return global.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
    throw new Error('Supabase client unavailable');
  }

  async function fetchAll(force = false) {
    if (!force && cachedMap && Date.now() - cachedAt < CACHE_MS) return cachedMap;
    if (inFlight) return inFlight;

    inFlight = (async () => {
      const client = getClient();
      const { data, error } = await client
        .from('category_subcategories')
        .select('category, subcategories')
        .order('category');
      if (error) throw error;

      const map = {};
      (data || []).forEach((row) => {
        if (row?.category && Array.isArray(row.subcategories)) {
          map[row.category] = row.subcategories;
        }
      });
      cachedMap = map;
      cachedAt = Date.now();
      return map;
    })();

    try {
      return await inFlight;
    } finally {
      inFlight = null;
    }
  }

  async function fetchByCategory(categoryName, force = false) {
    const all = await fetchAll(force);
    return all[categoryName] || [];
  }

  global.TGDSubcategories = {
    fetchAll,
    fetchByCategory,
    clearCache: () => {
      cachedMap = null;
      cachedAt = 0;
    }
  };
})(window);
