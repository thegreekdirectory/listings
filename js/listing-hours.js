(function () {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

  function parseHoursToMinutes(hoursText) {
    if (!hoursText || typeof hoursText !== 'string') return null;
    const value = hoursText.trim();
    if (!value || value.toLowerCase() === 'closed') return null;
    if (/24\s*hours|open\s*24/i.test(value) || value === '00:00-23:59') {
      return { startMinutes: 0, endMinutes: 1439, overnight: false, is24Hours: true };
    }
    const h24 = value.match(/^(\d{2}):(\d{2})\s*-\s*(\d{2}):(\d{2})$/);
    if (h24) {
      const startMinutes = Number(h24[1]) * 60 + Number(h24[2]);
      const endMinutes = Number(h24[3]) * 60 + Number(h24[4]);
      return { startMinutes, endMinutes, overnight: endMinutes < startMinutes, is24Hours: false };
    }
    const h12 = value.match(/(\d{1,2}):(\d{2})\s*(AM|PM)\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!h12) return null;
    let [, sh, sm, sp, eh, em, ep] = h12;
    let start = Number(sh); let end = Number(eh);
    if (sp.toUpperCase() === 'PM' && start !== 12) start += 12;
    if (sp.toUpperCase() === 'AM' && start === 12) start = 0;
    if (ep.toUpperCase() === 'PM' && end !== 12) end += 12;
    if (ep.toUpperCase() === 'AM' && end === 12) end = 0;
    const startMinutes = start * 60 + Number(sm);
    const endMinutes = end * 60 + Number(em);
    return { startMinutes, endMinutes, overnight: endMinutes < startMinutes, is24Hours: false };
  }

  async function getServerNow(endpoint) {
    const resp = await fetch(endpoint, { method: 'GET', headers: { 'Accept': 'application/json' }, cache: 'no-store' });
    if (!resp.ok) throw new Error('Failed to fetch authoritative server time.');
    const payload = await resp.json();
    if (!payload?.nowUtc) throw new Error('Server time payload missing nowUtc.');
    return new Date(payload.nowUtc);
  }

  function getListingLocalParts(serverNow, tz) {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    const parts = formatter.formatToParts(serverNow);
    const weekday = (parts.find(p => p.type === 'weekday')?.value || '').toLowerCase();
    const hour = Number(parts.find(p => p.type === 'hour')?.value || 0);
    const minute = Number(parts.find(p => p.type === 'minute')?.value || 0);
    return { weekday, hour, minute, currentMinutes: hour * 60 + minute };
  }

  function applyStatus(status) {
    const badge = document.getElementById('openClosedBadge');
    const statusText = document.getElementById('openStatusText');
    if (!badge || !statusText) return;
    const map = {
      OPEN: ['OPEN', 'badge badge-open', 'Open Now', 'open-now'],
      CLOSED: ['CLOSED', 'badge badge-closed', 'Closed Now', 'closed-now'],
      OPENING_SOON: ['OPENING SOON', 'badge badge-opening-soon', 'Opening Soon', 'open-now'],
      CLOSING_SOON: ['CLOSING SOON', 'badge badge-closing-soon', 'Closing Soon', 'open-now'],
      OPEN_24: ['OPEN', 'badge badge-open', 'Open 24 Hours', 'open-now']
    };
    const m = map[status] || map.CLOSED;
    badge.textContent = m[0]; badge.className = m[1];
    statusText.textContent = m[2]; statusText.className = m[3];
  }

  async function updateOpenClosedBadge({ hoursData, businessTimezone, hoursServerTimeEndpoint }) {
    const hasHours = hoursData && Object.values(hoursData).some(v => typeof v === 'string' && v.trim());
    if (!hasHours) return;
    const serverNow = await getServerNow(hoursServerTimeEndpoint);
    const local = getListingLocalParts(serverNow, businessTimezone || 'America/Chicago');
    const today = local.weekday;
    const todayIndex = days.indexOf(today);
    const yesterday = days[(todayIndex + 6) % 7];

    document.querySelectorAll('[data-hours-day]').forEach((row) => {
      row.querySelector('.hours-day-label')?.classList.remove('font-bold');
      row.querySelector('.hours-day-value')?.classList.remove('font-bold');
    });
    const todayRow = document.querySelector(`[data-hours-day="${today}"]`);
    todayRow?.querySelector('.hours-day-label')?.classList.add('font-bold');
    todayRow?.querySelector('.hours-day-value')?.classList.add('font-bold');

    const todayRange = parseHoursToMinutes(hoursData[today]);
    const yesterdayRange = parseHoursToMinutes(hoursData[yesterday]);

    if (todayRange?.is24Hours) return applyStatus('OPEN_24');
    const inYesterdayOvernight = Boolean(yesterdayRange?.overnight && local.currentMinutes <= yesterdayRange.endMinutes);
    if (inYesterdayOvernight) {
      const remaining = yesterdayRange.endMinutes - local.currentMinutes;
      return applyStatus(remaining > 0 && remaining <= 60 ? 'CLOSING_SOON' : 'OPEN');
    }

    if (!todayRange) return applyStatus('CLOSED');
    const isOpen = todayRange.overnight
      ? (local.currentMinutes >= todayRange.startMinutes || local.currentMinutes <= todayRange.endMinutes)
      : (local.currentMinutes >= todayRange.startMinutes && local.currentMinutes <= todayRange.endMinutes);

    if (!isOpen) {
      const minsToOpen = todayRange.startMinutes - local.currentMinutes;
      return applyStatus(minsToOpen > 0 && minsToOpen <= 60 ? 'OPENING_SOON' : 'CLOSED');
    }

    const minsToClose = todayRange.overnight
      ? (local.currentMinutes <= todayRange.endMinutes ? todayRange.endMinutes - local.currentMinutes : (1440 - local.currentMinutes) + todayRange.endMinutes)
      : todayRange.endMinutes - local.currentMinutes;
    return applyStatus(minsToClose > 0 && minsToClose <= 60 ? 'CLOSING_SOON' : 'OPEN');
  }

  window.TGDListingHours = { updateOpenClosedBadge, parseHoursToMinutes, getListingLocalParts };
})();
