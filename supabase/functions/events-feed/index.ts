import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const url = Deno.env.get('SUPABASE_URL')!;
const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(url, serviceRole);

function toIcsDate(input: string): string {
  return new Date(input).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

serve(async () => {
  const { data, error } = await supabase
    .from('events')
    .select('id,slug,title,description,start_datetime,end_datetime,venue_name,venue_address,updated_at')
    .eq('status', 'published')
    .gte('start_datetime', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .order('start_datetime', { ascending: true });

  if (error) {
    return new Response('Unable to generate feed', { status: 500 });
  }

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//The Greek Directory//Events Feed//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ];

  for (const event of data ?? []) {
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${event.id}@thegreekdirectory.org`);
    lines.push(`DTSTAMP:${toIcsDate(event.updated_at || event.start_datetime)}`);
    lines.push(`DTSTART:${toIcsDate(event.start_datetime)}`);
    lines.push(`DTEND:${toIcsDate(event.end_datetime || event.start_datetime)}`);
    lines.push(`SUMMARY:${(event.title ?? '').replace(/,/g, '\\,')}`);
    lines.push(`DESCRIPTION:${(event.description ?? '').replace(/\n/g, '\\n')}`);
    lines.push(`LOCATION:${(`${event.venue_name ?? ''} ${event.venue_address ?? ''}`).trim().replace(/,/g, '\\,')}`);
    lines.push(`URL:https://thegreekdirectory.org/event/${event.slug}`);
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');

  return new Response(lines.join('\r\n'), {
    headers: {
      'content-type': 'text/calendar; charset=utf-8',
      'cache-control': 'public, max-age=300'
    }
  });
});
