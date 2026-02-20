/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
*/

(function initAnalyticsEngine(global) {
    const KNOWN_UTM_KEYS = [
        'utm_id', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
        'utm_source_platform', 'utm_creative_format', 'utm_marketing_tactic'
    ];
    const CLICK_ID_KEYS = ['gclid', 'fbclid', 'msclkid', 'ttclid', 'wbraid', 'gbraid'];

    function safeUrl(input) {
        try { return new URL(input, global.location.origin); } catch (_) { return null; }
    }

    function getDeviceType(ua) {
        const value = (ua || '').toLowerCase();
        if (/tablet|ipad/.test(value)) return 'tablet';
        if (/mobi|android/.test(value)) return 'mobile';
        return 'desktop';
    }

    function getBrowser(ua) {
        const value = (ua || '').toLowerCase();
        if (value.includes('edg/')) return 'edge';
        if (value.includes('chrome/')) return 'chrome';
        if (value.includes('safari/') && !value.includes('chrome/')) return 'safari';
        if (value.includes('firefox/')) return 'firefox';
        return 'other';
    }

    function getOs(ua) {
        const value = (ua || '').toLowerCase();
        if (value.includes('windows')) return 'windows';
        if (value.includes('mac os')) return 'macos';
        if (value.includes('android')) return 'android';
        if (value.includes('iphone') || value.includes('ipad') || value.includes('ios')) return 'ios';
        if (value.includes('linux')) return 'linux';
        return 'other';
    }

    function getOrCreateSessionId() {
        const key = 'tgd_analytics_session_id';
        const existing = localStorage.getItem(key);
        if (existing) return existing;
        const generated = (global.crypto && global.crypto.randomUUID) ? global.crypto.randomUUID() : `sid_${Date.now()}_${Math.random().toString(16).slice(2)}`;
        localStorage.setItem(key, generated);
        return generated;
    }

    function extractAttribution(urlObj, referrer) {
        const params = urlObj?.searchParams || new URLSearchParams();
        const attribution = {};

        KNOWN_UTM_KEYS.forEach((key) => { attribution[key] = params.get(key) || null; });
        CLICK_ID_KEYS.forEach((key) => { attribution[key] = params.get(key) || null; });

        attribution.utm_full = {};
        params.forEach((value, key) => {
            if (key.toLowerCase().startsWith('utm_')) attribution.utm_full[key] = value;
        });

        attribution.referrer = referrer || null;
        attribution.referrer_host = safeUrl(referrer)?.hostname || null;

        attribution.campaign_id = params.get('campaign_id') || params.get('cid') || null;
        attribution.adgroup_id = params.get('adgroup_id') || params.get('agid') || null;
        attribution.keyword_id = params.get('keyword_id') || params.get('kid') || null;
        attribution.placement_id = params.get('placement_id') || params.get('pid') || null;

        return attribution;
    }

    function summarizeEvents(events) {
        const summary = {
            totals: { views: 0, call_clicks: 0, website_clicks: 0, direction_clicks: 0, share_clicks: 0, custom_cta_clicks: 0, video_plays: 0 },
            sharePlatforms: {},
            bySource: {},
            byMedium: {},
            byCampaign: {},
            byReferrer: {},
            byAction: {},
            timelineByDay: {}
        };

        (events || []).forEach((event) => {
            const action = event.action || 'unknown';
            summary.byAction[action] = (summary.byAction[action] || 0) + 1;

            if (action === 'view') summary.totals.views += 1;
            if (action === 'call') summary.totals.call_clicks += 1;
            if (action === 'website') summary.totals.website_clicks += 1;
            if (action === 'directions') summary.totals.direction_clicks += 1;
            if (action === 'share') summary.totals.share_clicks += 1;
            if (action === 'custom_cta') summary.totals.custom_cta_clicks += 1;
            if (action === 'video') summary.totals.video_plays += 1;

            if (event.platform) summary.sharePlatforms[event.platform] = (summary.sharePlatforms[event.platform] || 0) + 1;
            if (event.utm_source) summary.bySource[event.utm_source] = (summary.bySource[event.utm_source] || 0) + 1;
            if (event.utm_medium) summary.byMedium[event.utm_medium] = (summary.byMedium[event.utm_medium] || 0) + 1;
            if (event.utm_campaign) summary.byCampaign[event.utm_campaign] = (summary.byCampaign[event.utm_campaign] || 0) + 1;
            if (event.referrer_host) summary.byReferrer[event.referrer_host] = (summary.byReferrer[event.referrer_host] || 0) + 1;

            const day = (event.timestamp || '').slice(0, 10);
            if (day) summary.timelineByDay[day] = (summary.timelineByDay[day] || 0) + 1;
        });

        return summary;
    }

    function createTracker({ supabaseClient, listingId, listingUrl, websiteDomain }) {
        const sessionId = getOrCreateSessionId();
        const pageUrl = global.location.href;
        const page = safeUrl(pageUrl);
        const attribution = extractAttribution(page, global.document.referrer);
        const ua = global.navigator.userAgent || '';
        const queue = [];
        let flushTimer = null;

        async function flush() {
            if (!queue.length || !supabaseClient || !listingId) return;
            const payload = queue.splice(0, queue.length);
            const { error } = await supabaseClient.from('listing_analytics').insert(payload);
            if (error) {
                console.log('Analytics flush error:', error.message);
            }
        }

        function queueFlush() {
            if (flushTimer) return;
            flushTimer = global.setTimeout(async () => {
                flushTimer = null;
                await flush();
            }, 1500);
        }

        function track(action, details = {}) {
            if (!action || !listingId) return;
            const now = new Date().toISOString();
            queue.push({
                event_id: (global.crypto && global.crypto.randomUUID) ? global.crypto.randomUUID() : `evt_${Date.now()}_${Math.random().toString(16).slice(2)}`,
                listing_id: listingId,
                session_id: sessionId,
                action,
                platform: details.platform || null,
                timestamp: now,
                user_agent: ua,
                page_url: pageUrl,
                page_path: global.location.pathname,
                referrer: attribution.referrer,
                referrer_host: attribution.referrer_host,
                utm_source: attribution.utm_source,
                utm_medium: attribution.utm_medium,
                utm_campaign: attribution.utm_campaign,
                utm_term: attribution.utm_term,
                utm_content: attribution.utm_content,
                utm_id: attribution.utm_id,
                utm_source_platform: attribution.utm_source_platform,
                utm_creative_format: attribution.utm_creative_format,
                utm_marketing_tactic: attribution.utm_marketing_tactic,
                gclid: attribution.gclid,
                fbclid: attribution.fbclid,
                msclkid: attribution.msclkid,
                ttclid: attribution.ttclid,
                wbraid: attribution.wbraid,
                gbraid: attribution.gbraid,
                campaign_id: attribution.campaign_id,
                adgroup_id: attribution.adgroup_id,
                keyword_id: attribution.keyword_id,
                placement_id: attribution.placement_id,
                device_type: getDeviceType(ua),
                browser: getBrowser(ua),
                os: getOs(ua),
                language: global.navigator.language || null,
                metadata: {
                    listing_url: listingUrl || null,
                    target_url: details.targetUrl || null,
                    utm_full: attribution.utm_full,
                    ...details.metadata
                }
            });
            queueFlush();
        }

        function bindAutoTracking() {
            global.document.addEventListener('click', (event) => {
                const link = event.target.closest('a,button');
                if (!link) return;

                const href = link.getAttribute('href') || '';
                if (href.startsWith('tel:')) return track('call', { targetUrl: href });
                if (href.startsWith('mailto:')) return track('email', { targetUrl: href });
                if (href.includes('maps.google') || href.includes('/maps') || href.includes('apple.com/maps')) return track('directions', { targetUrl: href });
                if (link.dataset.ctaName) return track('custom_cta', { platform: link.dataset.ctaName, targetUrl: href });
                if (href && websiteDomain && href.includes(websiteDomain)) return track('website', { targetUrl: href });
            }, { passive: true });

            global.document.addEventListener('visibilitychange', () => {
                if (global.document.visibilityState === 'hidden') flush();
            });
            global.addEventListener('beforeunload', () => flush());
        }

        return { track, flush, bindAutoTracking };
    }

    global.TGDAnalytics = {
        createTracker,
        summarizeEvents
    };
})(window);
