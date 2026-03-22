(function (global) {
    function isValidSchemaOrgType(type) {
        return typeof type === 'string' && /^[A-Z][A-Za-z0-9]*$/.test(type);
    }

    function getBusinessSchemaScript() {
        const scripts = document.querySelectorAll('script[type="application/ld+json"]');
        return scripts.length > 0 ? scripts[0] : null;
    }

    function getPrimarySubcategoryFromPage() {
        const tag = document.querySelector('.subcategory-tag');
        return String(tag?.textContent || '').trim() || null;
    }

    async function syncListingSchemaTypes() {
        const category = String(global.currentListingData?.category || '').trim();
        const primarySubcategory = getPrimarySubcategoryFromPage();
        const script = getBusinessSchemaScript();

        if (!category || !primarySubcategory || !script || !global.TGDCategoryMetadata) return;

        try {
            const client = global.supabase?.createClient
                ? global.supabase.createClient(
                    global.TGDCategoryMetadata.SUPABASE_URL,
                    global.TGDCategoryMetadata.SUPABASE_ANON_KEY
                )
                : null;
            const metadata = await global.TGDCategoryMetadata.loadPublicCategoryMetadata({ client });
            const mappedTypes = metadata.schemaTypeMap?.[category]?.[primarySubcategory];
            const schemaTypes = Array.isArray(mappedTypes)
                ? [...new Set(mappedTypes.filter(isValidSchemaOrgType))]
                : [];

            if (schemaTypes.length === 0) return;

            const jsonLd = JSON.parse(script.textContent);
            if (!Array.isArray(jsonLd['@graph']) || !jsonLd['@graph'][0] || typeof jsonLd['@graph'][0] !== 'object') return;

            jsonLd['@graph'][0]['@type'] = schemaTypes;
            script.textContent = JSON.stringify(jsonLd, null, 4);
        } catch (error) {
            console.warn('Could not sync listing schema types', error);
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        syncListingSchemaTypes();
    });

    global.TGDListingSchema = {
        syncListingSchemaTypes
    };
})(window);
