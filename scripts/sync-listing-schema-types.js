#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://luetekzqrrgdxtopzvqw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1ZXRla3pxcnJnZHh0b3B6dnF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNDc2NDcsImV4cCI6MjA4MzkyMzY0N30.TIrNG8VGumEJc_9JvNHW-Q-UWfUGpPxR0v8POjWZJYg';

function decodeHtml(value = '') {
    return String(value)
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');
}

function isValidSchemaOrgType(type) {
    return typeof type === 'string' && /^[A-Z][A-Za-z0-9]*$/.test(type);
}

async function fetchSchemaTypeMap() {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/category_subcategories?select=category,schema_type_map`, {
        headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch category schema metadata: ${response.status} ${response.statusText}`);
    }

    const rows = await response.json();
    const result = {};
    for (const row of rows) {
        const category = String(row.category || '').trim();
        if (!category) continue;
        const normalized = {};
        const schemaTypeMap = row.schema_type_map && typeof row.schema_type_map === 'object'
            ? row.schema_type_map
            : {};
        for (const [subcategory, schemaTypes] of Object.entries(schemaTypeMap)) {
            if (!subcategory) continue;
            const values = Array.isArray(schemaTypes)
                ? schemaTypes.filter(isValidSchemaOrgType)
                : isValidSchemaOrgType(schemaTypes)
                    ? [schemaTypes]
                    : [];
            if (values.length > 0) normalized[subcategory] = [...new Set(values)];
        }
        result[category] = normalized;
    }
    return result;
}

function getPrimarySubcategory(html) {
    const matches = [...html.matchAll(/<span class="subcategory-tag">([\s\S]*?)<\/span>/g)];
    if (matches.length === 0) return null;
    return decodeHtml(matches[0][1].replace(/<[^>]+>/g, '').trim());
}

function getCategoryName(jsonLd) {
    const graph = Array.isArray(jsonLd['@graph']) ? jsonLd['@graph'] : [];
    const breadcrumb = graph.find((item) => item && item['@type'] === 'BreadcrumbList');
    const items = Array.isArray(breadcrumb?.itemListElement) ? breadcrumb.itemListElement : [];
    const categoryItem = items.find((item) => Number(item?.position) === 2);
    return decodeHtml(String(categoryItem?.name || '').trim()) || null;
}

function updateListingFile(filePath, schemaTypeMap) {
    const original = fs.readFileSync(filePath, 'utf8');
    const scriptMatch = original.match(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/);
    if (!scriptMatch) return false;

    const jsonLd = JSON.parse(scriptMatch[1]);
    const graph = Array.isArray(jsonLd['@graph']) ? jsonLd['@graph'] : [];
    if (!graph[0] || typeof graph[0] !== 'object') return false;

    const category = getCategoryName(jsonLd);
    const primarySubcategory = getPrimarySubcategory(original);
    const schemaTypes = schemaTypeMap[category]?.[primarySubcategory] || ['LocalBusiness'];

    graph[0]['@type'] = schemaTypes;
    jsonLd['@graph'] = graph;

    const updatedScript = `<script type="application/ld+json">\n${JSON.stringify(jsonLd, null, 4)}\n    </script>`;
    const updated = original.replace(scriptMatch[0], updatedScript);

    if (updated !== original) {
        fs.writeFileSync(filePath, updated);
        return true;
    }
    return false;
}

async function main() {
    const schemaTypeMap = await fetchSchemaTypeMap();
    const listingDir = path.join(process.cwd(), 'listing');
    const files = fs.readdirSync(listingDir)
        .filter((name) => name.endsWith('.html'))
        .map((name) => path.join(listingDir, name));

    let updatedCount = 0;
    for (const file of files) {
        if (updateListingFile(file, schemaTypeMap)) {
            updatedCount += 1;
        }
    }

    console.log(`Updated ${updatedCount} listing HTML files.`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
