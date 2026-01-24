/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
This source code is proprietary and no part may not be used, reproduced, or distributed 
without written permission from The Greek Directory. Unauthorized use, copying, modification, 
or distribution of this code will result in legal action to the fullest extent permitted by law.
*/

// ============================================
// CATEGORY PAGE GENERATOR
// Run once: node generate-category-pages.js
// Creates /category/{category-slug}/index.html pages
// ============================================

const fs = require('fs');
const path = require('path');

const CATEGORIES = [
    'Automotive & Transportation',
    'Beauty & Health',
    'Church & Religious Organization',
    'Cultural/Fraternal Organization',
    'Education & Community',
    'Entertainment, Arts & Recreation',
    'Food & Hospitality',
    'Grocery & Imports',
    'Home & Construction',
    'Industrial & Manufacturing',
    'Pets & Veterinary',
    'Professional & Business Services',
    'Real Estate & Development',
    'Retail & Shopping'
];

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
*/

console.log('🏗️ Starting category page generation...\n');

// Read the base listings.html template
const listingsTemplate = fs.readFileSync('listings.html', 'utf8');

// Create category directory if it doesn't exist
if (!fs.existsSync('category')) {
    fs.mkdirSync('category');
    console.log('✅ Created /category directory\n');
}

CATEGORIES.forEach(category => {
    const categorySlug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    // Create category-specific HTML
    let categoryHTML = listingsTemplate;
    
    // Update title
    categoryHTML = categoryHTML.replace(
        /<title>.*?<\/title>/,
        `<title>${category} - The Greek Directory</title>`
    );
    
    // Update meta description
    categoryHTML = categoryHTML.replace(
        /<meta name="description" content=".*?">/,
        `<meta name="description" content="Discover Greek-owned ${category} businesses across America. Browse listings, read reviews, and connect with local Greek businesses.">`
    );
    
    /*
    Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    */
    
    // Add category-specific script
    const categoryScript = `
    <script>
    /*
    Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    */
    
    // Category page initialization
    const CATEGORY_PAGE_NAME = '${category}';
    const CATEGORY_PAGE_SLUG = '${categorySlug}';
    
    document.addEventListener('DOMContentLoaded', () => {
        console.log('📁 Category page loaded:', CATEGORY_PAGE_NAME);
        
        // Hide category and subcategory filter sections
        const categoryContainer = document.getElementById('categoryFilters');
        const categoryContainer2 = document.getElementById('categoryFilters2');
        const subcategoryContainer = document.getElementById('subcategoryContainer');
        const subcategoryContainer2 = document.getElementById('subcategoryContainer2');
        const categorySearches = document.querySelectorAll('#categorySearch, #categorySearch2');
        
        // Hide all category-related filters
        if (categoryContainer) {
            const parent = categoryContainer.closest('div').parentElement;
            if (parent) parent.style.display = 'none';
        }
        if (categoryContainer2) {
            const parent = categoryContainer2.closest('div').parentElement;
            if (parent) parent.style.display = 'none';
        }
        if (subcategoryContainer) subcategoryContainer.style.display = 'none';
        if (subcategoryContainer2) subcategoryContainer2.style.display = 'none';
        categorySearches.forEach(el => {
            if (el) {
                const parent = el.closest('div');
                if (parent) parent.style.display = 'none';
            }
        });
        
        // Auto-select this category
        if (typeof selectedCategory !== 'undefined') {
            selectedCategory = CATEGORY_PAGE_NAME;
        }
        
        /*
        Copyright (C) The Greek Directory, 2025-present. All rights reserved.
        */
        
        // Override toggleStarredView to filter by category
        const originalToggleStarredView = window.toggleStarredView;
        if (originalToggleStarredView) {
            window.toggleStarredView = function() {
                viewingStarredOnly = !viewingStarredOnly;
                if (viewingStarredOnly) {
                    if (starredListings.length === 0) {
                        alert('You haven\\'t starred any listings yet!');
                        viewingStarredOnly = false;
                        return;
                    }
                    // Filter starred listings to only show this category
                    filteredListings = allListings.filter(l => 
                        starredListings.includes(l.id) && l.category === CATEGORY_PAGE_NAME
                    );
                    displayedListingsCount = filteredListings.length;
                    document.getElementById('resultsCount').textContent = 
                        \`\${filteredListings.length} starred \${filteredListings.length === 1 ? 'listing' : 'listings'} in \${CATEGORY_PAGE_NAME}\`;
                    document.getElementById('starredBtn').style.backgroundColor = '#fbbf24';
                    document.getElementById('starredBtn').style.color = '#78350f';
                } else {
                    displayedListingsCount = 25;
                    applyFilters();
                    document.getElementById('starredBtn').style.backgroundColor = '';
                    document.getElementById('starredBtn').style.color = '';
                }
                renderListings();
                updateResultsCount();
            };
        }
        
        // Update page subtitle
        const subtitle = document.getElementById('locationSubtitle');
        if (subtitle) {
            subtitle.textContent = \`\${CATEGORY_PAGE_NAME} Listings\`;
        }
        
        // Apply filters to show only this category
        setTimeout(() => {
            if (typeof applyFilters === 'function') {
                console.log('✅ Applying category filter:', CATEGORY_PAGE_NAME);
                applyFilters();
            }
        }, 200);
    });
    
    /*
    Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    */
    </script>
    `;
    
    /*
    Copyright (C) The Greek Directory, 2025-present. All rights reserved.
    */
    
    // Insert the script before closing body tag
    categoryHTML = categoryHTML.replace('</body>', `${categoryScript}\n</body>`);
    
    // Create category-specific directory
    const categoryDir = path.join('category', categorySlug);
    if (!fs.existsSync(categoryDir)) {
        fs.mkdirSync(categoryDir, { recursive: true });
    }
    
    // Write the category page
    fs.writeFileSync(path.join(categoryDir, 'index.html'), categoryHTML);
    
    console.log(`✅ Created: /category/${categorySlug}/index.html`);
});

console.log(`\n🎉 SUCCESS! All ${CATEGORIES.length} category pages created!`);
console.log('📂 Pages created at: /category/{category-slug}/index.html');
console.log('\nCategory pages will:');
console.log('  • Auto-filter to their specific category');
console.log('  • Hide category/subcategory filters');
console.log('  • Filter starred items by category');
console.log('  • Show category name in page title and subtitle');

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
This source code is proprietary and no part may not be used, reproduced, or distributed 
without written permission from The Greek Directory. Unauthorized use, copying, modification, 
or distribution of this code will result in legal action to the fullest extent permitted by law.
*/
