// Shared subcategory data loader with lightweight module cache.
(function initTGDSubcategories(global) {
  const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
  let cacheByCategory = null;
  let cacheFetchedAt = 0;
  let inflightPromise = null;

  function hasFreshCache() {
    return !!cacheByCategory && (Date.now() - cacheFetchedAt) < CACHE_TTL_MS;
  }

  function sortAndDedupe(rows) {
    const next = {};
    (rows || []).forEach((row) => {
      if (!row || !row.category || !Array.isArray(row.subcategories)) return;
      next[row.category] = [...new Set(row.subcategories.filter(Boolean))].sort((a, b) => a.localeCompare(b));
    });
    return next;
  }

  async function fetchAll(supabaseClient) {
    if (!supabaseClient) throw new Error('Supabase client is required to fetch subcategories.');
    if (hasFreshCache()) return cacheByCategory;
    if (inflightPromise) return inflightPromise;

    inflightPromise = supabaseClient
      .from('category_subcategories')
      .select('category, subcategories')
      .order('category')
      .then(({ data, error }) => {
        if (error) throw error;
        cacheByCategory = sortAndDedupe(data);
        cacheFetchedAt = Date.now();
        return cacheByCategory;
      })
      .finally(() => {
        inflightPromise = null;
      });

    return inflightPromise;
  }

  async function fetchForCategory(supabaseClient, categoryName) {
    const all = await fetchAll(supabaseClient);
    return all[categoryName] || [];
  }

  function clearCache() {
    cacheByCategory = null;
    cacheFetchedAt = 0;
    inflightPromise = null;
  }

  global.TGDSubcategories = {
    fetchAll,
    fetchForCategory,
    clearCache
  };
})(window);
