// generate-sitemap.js
/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
This source code is proprietary and no part may not be used, reproduced, or distributed 
without written permission from The Greek Directory. Unauthorized use, copying, modification, 
or distribution of this code will result in legal action to the fullest extent permitted by law.
*/

// This script generates sitemap.xml
// Run with: node generate-sitemap.js

const fs = require('fs');

// Read the database
const database = JSON.parse(fs.readFileSync('listings-database.json', 'utf8'));
const listings = database.listings;

const baseUrl = 'https://thegreekdirectory.org';
const now = new Date().toISOString().split('T')[0];

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
*/

// Start XML
let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

// Homepage - highest priority
xml += `  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
`;

// Collect unique places (cities)
const places = new Set();
const usStates = new Set();

listings.forEach(listing => {
    if (listing.visible !== false) {
        if (listing.city && listing.state && (listing.country || 'USA') === 'USA') {
            const citySlug = listing.city.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            const stateSlug = listing.state.toLowerCase();
            places.add(`${stateSlug}/${citySlug}`);
            usStates.add(stateSlug);
        }
    }
});

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
*/

// Add state pages
usStates.forEach(state => {
    xml += `  <url>
    <loc>${baseUrl}/places/usa/${state}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
`;
});

// Add place pages
places.forEach(place => {
    xml += `  <url>
    <loc>${baseUrl}/places/usa/${place}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
});

// Collect unique categories
const categories = new Set();
listings.forEach(listing => {
    if (listing.visible !== false && listing.category) {
        categories.add(listing.category);
    }
});

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
*/

// Add category pages
categories.forEach(category => {
    const categorySlug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    xml += `  <url>
    <loc>${baseUrl}/listings/${categorySlug}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;
});

// Add individual listings
listings.forEach(listing => {
    if (listing.visible !== false) {
        const categorySlug = listing.category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const listingSlug = listing.slug;
        const lastMod = listing.metadata?.updatedAt ? 
            listing.metadata.updatedAt.split('T')[0] : now;
        
        xml += `  <url>
    <loc>${baseUrl}/listings/${categorySlug}/${listingSlug}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
`;
    }
});

xml += `</urlset>`;

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
*/

fs.writeFileSync('sitemap.xml', xml);
console.log('✅ sitemap.xml generated successfully!');
console.log(`   - Homepage: 1`);
console.log(`   - States: ${usStates.size}`);
console.log(`   - Places: ${places.size}`);
console.log(`   - Categories: ${categories.size}`);
console.log(`   - Listings: ${listings.filter(l => l.visible !== false).length}`);
console.log(`   - Total URLs: ${1 + usStates.size + places.size + categories.size + listings.filter(l => l.visible !== false).length}`);

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
This source code is proprietary and no part may not be used, reproduced, or distributed 
without written permission from The Greek Directory. Unauthorized use, copying, modification, 
or distribution of this code will result in legal action to the fullest extent permitted by law.
*/
