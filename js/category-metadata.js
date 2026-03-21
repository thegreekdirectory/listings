(function (global) {
    const MAIN_CATEGORIES = [
        { name: 'Automotive & Transportation', icon: '🚗', slug: 'automotive-transportation' },
        { name: 'Beauty & Health', icon: '💅', slug: 'beauty-health' },
        { name: 'Church & Religious Organization', icon: '⛪', slug: 'church-religious-organization' },
        { name: 'Cultural/Fraternal Organization', icon: '🎭', slug: 'cultural-fraternal-organization' },
        { name: 'Education & Community', icon: '📚', slug: 'education-community' },
        { name: 'Entertainment, Arts & Recreation', icon: '🎨', slug: 'entertainment-arts-recreation' },
        { name: 'Food & Hospitality', icon: '🍽️', slug: 'food-hospitality' },
        { name: 'Grocery & Imports', icon: '🛒', slug: 'grocery-imports' },
        { name: 'Home & Construction', icon: '🏠', slug: 'home-construction' },
        { name: 'Industrial & Manufacturing', icon: '🏭', slug: 'industrial-manufacturing' },
        { name: 'Pets & Veterinary', icon: '🐾', slug: 'pets-veterinary' },
        { name: 'Professional & Business Services', icon: '💼', slug: 'professional-business-services' },
        { name: 'Real Estate & Development', icon: '🏢', slug: 'real-estate-development' },
        { name: 'Retail & Shopping', icon: '🛍️', slug: 'retail-shopping' }
    ];

    const MAIN_CATEGORY_NAMES = MAIN_CATEGORIES.map((category) => category.name);
    const CATEGORY_ICON_MAP = Object.fromEntries(MAIN_CATEGORIES.map((category) => [category.name, category.icon]));
    const CATEGORY_SLUG_MAP = Object.fromEntries(MAIN_CATEGORIES.map((category) => [category.name, category.slug]));
    const SUPABASE_URL = 'https://luetekzqrrgdxtopzvqw.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1ZXRla3pxcnJnZHh0b3B6dnF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNDc2NDcsImV4cCI6MjA4MzkyMzY0N30.TIrNG8VGumEJc_9JvNHW-Q-UWfUGpPxR0v8POjWZJYg';

    let metadataPromise = null;

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function createEmptySubcategoryMap() {
        return Object.fromEntries(MAIN_CATEGORY_NAMES.map((category) => [category, []]));
    }

    function createEmptySchemaTypeMap() {
        return Object.fromEntries(MAIN_CATEGORY_NAMES.map((category) => [category, {}]));
    }

    function getSupabaseClient(preferredClient) {
        if (preferredClient) return preferredClient;
        if (global.TGDAuth && global.TGDAuth.supabaseClient) return global.TGDAuth.supabaseClient;
        if (global.supabase && typeof global.supabase.createClient === 'function') {
            return global.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        }
        return null;
    }

    function normalizeSchemaTypeMap(raw) {
        if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
        const normalized = {};
        Object.entries(raw).forEach(([subcategory, schemaTypes]) => {
            if (!subcategory) return;
            if (Array.isArray(schemaTypes)) {
                normalized[subcategory] = schemaTypes.filter((type) => typeof type === 'string' && type.trim());
            } else if (typeof schemaTypes === 'string' && schemaTypes.trim()) {
                normalized[subcategory] = [schemaTypes.trim()];
            }
        });
        return normalized;
    }

    function normalizeCategoryRows(rows) {
        const subcategoryMap = createEmptySubcategoryMap();
        const schemaTypeMap = createEmptySchemaTypeMap();

        if (Array.isArray(rows)) {
            rows.forEach((row) => {
                const category = String(row.category || '').trim();
                if (!MAIN_CATEGORY_NAMES.includes(category)) return;

                const subcategories = Array.isArray(row.subcategories)
                    ? [...new Set(row.subcategories.map((value) => String(value || '').trim()).filter(Boolean))]
                    : [];
                const normalizedSchemaMap = normalizeSchemaTypeMap(row.schema_type_map);

                subcategoryMap[category] = subcategories;
                schemaTypeMap[category] = normalizedSchemaMap;
            });
        }

        const categories = MAIN_CATEGORIES.map((category) => ({
            ...category,
            subcategories: subcategoryMap[category.name] || [],
            schemaTypeMap: schemaTypeMap[category.name] || {}
        }));

        return {
            rows: Array.isArray(rows) ? rows : [],
            categories,
            subcategoryMap,
            schemaTypeMap
        };
    }

    async function fetchCategoryMetadata(options = {}) {
        const client = getSupabaseClient(options.client);
        if (!client) {
            throw new Error('Supabase client is unavailable for category metadata loading.');
        }

        const { data, error } = await client
            .from('category_subcategories')
            .select('category, subcategories, schema_type_map');

        if (error) throw error;
        return normalizeCategoryRows(data || []);
    }

    async function loadPublicCategoryMetadata(options = {}) {
        if (options.forceRefresh || !metadataPromise) {
            metadataPromise = fetchCategoryMetadata(options).catch((error) => {
                metadataPromise = null;
                throw error;
            });
        }

        const metadata = await metadataPromise;
        return clone(metadata);
    }

    global.TGDCategoryMetadata = {
        MAIN_CATEGORIES,
        MAIN_CATEGORY_NAMES,
        CATEGORY_ICON_MAP,
        CATEGORY_SLUG_MAP,
        SUPABASE_URL,
        SUPABASE_ANON_KEY,
        createEmptySubcategoryMap,
        createEmptySchemaTypeMap,
        normalizeCategoryRows,
        loadPublicCategoryMetadata
    };
})(window);
