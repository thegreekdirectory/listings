function formatDateUTC(date) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

export function buildCalendarLinks(event) {
  const start = new Date(event.start_datetime);
  const end = new Date(event.end_datetime || new Date(start.getTime() + 60 * 60 * 1000));
  const title = encodeURIComponent(event.title || 'Event');
  const details = encodeURIComponent(event.description || '');
  const location = encodeURIComponent(event.venue_address || event.venue_name || '');
  const startUtc = formatDateUTC(start);
  const endUtc = formatDateUTC(end);

  const google = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startUtc}/${endUtc}&details=${details}&location=${location}`;
  const outlookLive = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${title}&startdt=${encodeURIComponent(start.toISOString())}&enddt=${encodeURIComponent(end.toISOString())}&body=${details}&location=${location}`;
  const outlook365 = `https://outlook.office.com/calendar/0/deeplink/compose?subject=${title}&startdt=${encodeURIComponent(start.toISOString())}&enddt=${encodeURIComponent(end.toISOString())}&body=${details}&location=${location}`;

  const icsBody = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//The Greek Directory//Events//EN',
    'BEGIN:VEVENT',
    `DTSTART:${startUtc}`,
    `DTEND:${endUtc}`,
    `SUMMARY:${(event.title || 'Event').replace(/,/g, '\\,')}`,
    `DESCRIPTION:${(event.description || '').replace(/\n/g, '\\n')}`,
    `LOCATION:${(event.venue_address || '').replace(/,/g, '\\,')}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const apple = `data:text/calendar;charset=utf-8,${encodeURIComponent(icsBody)}`;

  return { google, apple, outlook365, outlookLive };
}
