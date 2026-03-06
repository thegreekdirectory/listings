/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
*/

(function initAnalyticsTracker(windowRef) {
    const DEFAULTS = {
        endpoint: '/api/analytics/ingest',
        flushIntervalMs: 3000,
        maxBatchSize: 20,
        maxQueueSize: 200,
        maxRetries: 3,
        retryBaseDelayMs: 1000,
        dualWriteFlag: false,
        sendBeaconPath: '/api/analytics/ingest'
    };

    class AnalyticsTracker {
        constructor(options = {}) {
            this.config = { ...DEFAULTS, ...options };
            this.queue = [];
            this.timer = null;
            this.flushing = false;
            this.started = false;
        }

        setConfig(next = {}) {
            this.config = { ...this.config, ...next };
        }

        start() {
            if (this.started) return;
            this.started = true;
            this.schedule();
            windowRef.addEventListener('beforeunload', () => this.flush({ useBeacon: true }));
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'hidden') {
                    this.flush({ useBeacon: true });
                }
            });
        }

        schedule() {
            if (this.timer) return;
            this.timer = setTimeout(() => {
                this.timer = null;
                this.flush();
            }, this.config.flushIntervalMs);
        }

        enqueue(payload) {
            if (!payload) return;
            if (this.queue.length >= this.config.maxQueueSize) {
                this.queue.shift();
            }
            this.queue.push({
                payload,
                attempts: 0,
                nextAttemptAt: Date.now()
            });

            if (this.queue.length >= this.config.maxBatchSize) {
                this.flush();
                return;
            }
            this.schedule();
        }

        async flush({ useBeacon = false } = {}) {
            if (this.flushing) return;
            const now = Date.now();
            const ready = this.queue.filter(item => item.nextAttemptAt <= now).slice(0, this.config.maxBatchSize);
            if (!ready.length) {
                this.schedule();
                return;
            }

            this.flushing = true;
            const events = ready.map(i => i.payload);
            const success = await this.send(events, useBeacon);

            if (success) {
                const sentSet = new Set(ready);
                this.queue = this.queue.filter(item => !sentSet.has(item));
            } else {
                ready.forEach(item => {
                    item.attempts += 1;
                    if (item.attempts > this.config.maxRetries) {
                        const idx = this.queue.indexOf(item);
                        if (idx > -1) this.queue.splice(idx, 1);
                        return;
                    }
                    const delay = this.config.retryBaseDelayMs * Math.pow(2, item.attempts - 1);
                    item.nextAttemptAt = Date.now() + delay;
                });
            }

            this.flushing = false;
            if (this.queue.length) this.schedule();
        }

        async send(events, useBeacon = false) {
            const body = JSON.stringify({ events, sent_at: new Date().toISOString() });

            if (useBeacon && navigator.sendBeacon) {
                try {
                    const blob = new Blob([body], { type: 'application/json' });
                    return navigator.sendBeacon(this.config.sendBeaconPath || this.config.endpoint, blob);
                } catch (error) {
                    console.warn('sendBeacon failed; falling back to fetch keepalive.', error);
                }
            }

            try {
                const response = await fetch(this.config.endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body,
                    keepalive: true,
                    credentials: 'same-origin'
                });
                return response.ok;
            } catch (error) {
                console.warn('Analytics fetch failed.', error);
                return false;
            }
        }

        track(event) {
            this.enqueue({
                ...event,
                client_timestamp: new Date().toISOString()
            });
        }
    }

    windowRef.AnalyticsTracker = AnalyticsTracker;
})(window);
