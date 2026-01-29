<!-- INTEGRATION_GUIDE.md -->
<!-- Copyright (C) The Greek Directory, 2025-present. All rights reserved. This source code is proprietary and no part may not be used, reproduced, or distributed without written permission from The Greek Directory. For more information, visit https://thegreekdirectory.org/legal. -->

# PWA Integration Guide - The Greek Directory

## File Order for Pasting

### 1. Root Directory Files
1. **manifest.json** - Place in root directory
2. **service-worker.js** - Place in root directory
3. **offline.html** - Place in root directory

### 2. CSS Files
4. **css/pwa.css** - New file, add to css/ directory

### 3. JavaScript Files (in order)
5. **js/pwa/storage.js** - New file, create js/pwa/ directory
6. **js/pwa/app.js** - New file in js/pwa/
7. **js/pwa/dock.js** - New file in js/pwa/
8. **js/pwa/starred.js** - New file in js/pwa/
9. **js/pwa/settings.js** - New file in js/pwa/

### 4. New HTML Files
10. **starred.html** - New file in root
11. **settings.html** - New file in root

### 5. Update Existing Files

#### index.html
- Add viewport-fit meta tag
- Add apple-mobile-web-app meta tags
- Add manifest link
- Add inline splash screen CSS in <head>
- Add PWA CSS link
- Add PWA JS scripts before </body>

#### listings.html
- Add viewport-fit meta tag
- Add apple-mobile-web-app meta tags
- Add manifest link
- Add inline splash screen CSS in <head>
- Add PWA CSS link
- Add PWA JS scripts before </body>
- Add currentListingData script

#### listing-template.html
- Add viewport-fit meta tag
- Add apple-mobile-web-app meta tags
- Add manifest link
- Add inline splash screen CSS
- Add PWA CSS link
- Add PWA JS scripts
- Add currentListingData script with template variables

#### js/listings.js
- Update toggleStar() function to use PWA storage
- Update loadStarredListings() function to check PWA storage first

## Required Assets

You need to create these app icons:
- icon-192.png (192x192)
- icon-512.png (512x512)
- icon-maskable-192.png (192x192 with safe zone)
- icon-maskable-512.png (512x512 with safe zone)

Place them in: https://static.thegreekdirectory.org/img/logo/

## Testing Checklist

### Standalone Mode Testing
- [ ] App opens in standalone mode (no browser UI)
- [ ] Splash screen appears on first launch
- [ ] Splash screen doesn't show on subsequent opens
- [ ] Dock is visible at bottom
- [ ] Header and footer are hidden

### Dock Functionality
- [ ] All 4 tabs navigate correctly
- [ ] Active tab is highlighted in #045093
- [ ] Long press on active tab reloads page
- [ ] Long press on inactive tabs does nothing
- [ ] Safe areas respected on iPhone X+

### Starred Listings
- [ ] Can star/unstar from listings page
- [ ] Can star/unstar from individual listing page
- [ ] Starred page shows all starred listings
- [ ] Starred listings persist offline
- [ ] Images cached for offline viewing

### Settings
- [ ] Theme switching works (System/Light/Dark)
- [ ] Language switching works (EN/EL)
- [ ] External links open in system browser
- [ ] Share button works
- [ ] Reset app clears all data

### Offline Functionality
- [ ] Service worker registers successfully
- [ ] Core pages load offline
- [ ] Starred listings viewable offline
- [ ] Images cached properly
- [ ] Offline page shows when no connection

### External Links
- [ ] Support link opens in browser
- [ ] Contact link opens in browser
- [ ] Legal link opens in browser
- [ ] Open Site link opens in browser

## Browser Compatibility

### Supported
- ✅ Chrome/Edge (Android)
- ✅ Safari (iOS 11.3+)
- ✅ Firefox (Android)
- ✅ Samsung Internet

### Known Issues
- iOS < 11.3: Limited PWA support
- Desktop: Full functionality but no "Add to Home Screen"

## Debugging

### Check Service Worker
```javascript
navigator.serviceWorker.getRegistrations().then(registrations => {
    console.log('Active service workers:', registrations.length);
});
```

### Check IndexedDB
```javascript
indexedDB.databases().then(databases => {
    console.log('Databases:', databases);
});
```

### Check Standalone Mode
```javascript
console.log('Standalone:', window.matchMedia('(display-mode: standalone)').matches);
console.log('iOS Standalone:', window.navigator.standalone);
```

## Deployment Notes

1. Ensure manifest.json is served with correct MIME type (application/manifest+json)
2. Service worker must be served from root or same scope as app
3. HTTPS required for PWA features (except localhost)
4. Test on actual devices, not just emulators

<!-- Copyright (C) The Greek Directory, 2025-present. All rights reserved. This source code is proprietary and no part may not be used, reproduced, or distributed without written permission from The Greek Directory. For more information, visit https://thegreekdirectory.org/legal. -->
