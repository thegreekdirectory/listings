/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
*/

(function initAttribution(windowRef) {
    const STORAGE_KEY = 'tgd_attribution_v1';
    const KNOWN_SOURCES = new Set([
        'google', 'facebook', 'instagram', 'linkedin', 'x', 'twitter', 'youtube',
        'bing', 'yahoo', 'tiktok', 'email', 'sms', 'direct', 'newsletter'
    ]);

    const UTM_KEYS = [
        'utm_source',
        'utm_medium',
        'utm_campaign',
        'utm_term',
        'utm_content',
        'utm_id',
        'utm_source_platform',
        'utm_creative_format',
        'utm_marketing_tactic'
    ];

    const CLICK_ID_KEYS = [
        'gclid', 'fbclid', 'msclkid', 'ttclid', 'twclid', 'li_fat_id',
        'dclid', 'yclid', 'gbraid', 'wbraid'
    ];

    function normalizeSource(rawSource) {
        const value = (rawSource || '').trim().toLowerCase();
        if (!value) return { source: 'other', raw_source: null };
        if (KNOWN_SOURCES.has(value)) return { source: value, raw_source: null };
        return { source: 'other', raw_source: rawSource };
    }

    function parseFromUrl(search = windowRef.location.search) {
        const params = new URLSearchParams(search || '');
        const utm = {};
        const click_ids = {};

        UTM_KEYS.forEach(key => {
            const value = params.get(key);
            if (value) utm[key] = value;
        });

        CLICK_ID_KEYS.forEach(key => {
            const value = params.get(key);
            if (value) click_ids[key] = value;
        });

        const normalized = normalizeSource(utm.utm_source);
        utm.utm_source = normalized.source;

        return {
            utm,
            click_ids,
            raw_utm_source: normalized.raw_source,
            landing_url: windowRef.location.href,
            referrer: document.referrer || null,
            captured_at: new Date().toISOString()
        };
    }

    function store(attribution) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(attribution));
        } catch (error) {
            console.warn('Unable to store attribution data.', error);
        }
        return attribution;
    }

    function read() {
        try {
            const value = localStorage.getItem(STORAGE_KEY);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            console.warn('Unable to parse attribution data.', error);
            return null;
        }
    }

    function captureAndStore() {
        const next = parseFromUrl(windowRef.location.search);
        const hasParams = Object.keys(next.utm).length || Object.keys(next.click_ids).length;
        if (hasParams) return store(next);
        return read();
    }

    windowRef.AnalyticsAttribution = {
        parseFromUrl,
        store,
        read,
        captureAndStore
    };
})(window);
