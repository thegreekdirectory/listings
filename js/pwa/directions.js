// js/pwa/directions.js
// Centralized directions URL builder used across listings/map/listing pages.
(function () {
    function isPwaMode() {
        return (window.PWAApp && window.PWAApp.isStandalone) ||
            window.matchMedia('(display-mode: standalone)').matches ||
            window.navigator.standalone === true;
    }

    function getFullAddress(listing) {
        if (!listing) return '';
        if (listing.city && listing.state) {
            if (listing.address) {
                return `${listing.address}, ${listing.city}, ${listing.state} ${listing.zip_code || ''}`.trim();
            }
            return `${listing.city}, ${listing.state}`.trim();
        }
        return listing.address || '';
    }

    function getDirectionsUrl(listing) {
        const fullAddr = getFullAddress(listing);
        const encoded = encodeURIComponent(fullAddr);
        const preferred = localStorage.getItem('tgd_default_map_app') || '';

        if (isPwaMode() && preferred) {
            if (preferred === 'apple') {
                return `https://maps.apple.com/?daddr=${encoded}`;
            }
            if (preferred === 'waze') {
                if (listing && listing.coordinates) {
                    return `https://waze.com/ul?ll=${listing.coordinates.lat},${listing.coordinates.lng}&navigate=yes`;
                }
                return `https://waze.com/ul?q=${encoded}&navigate=yes`;
            }
            return `https://www.google.com/maps/dir/?api=1&destination=${encoded}`;
        }

        return `https://www.google.com/maps/dir/?api=1&destination=${encoded}`;
    }

    window.TGDDirections = {
        isPwaMode,
        getFullAddress,
        getDirectionsUrl
    };
})();
