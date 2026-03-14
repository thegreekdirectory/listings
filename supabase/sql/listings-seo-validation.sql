-- SEO data validation hardening for listings table
alter table if exists public.listings
  add constraint listings_phone_e164_chk
  check (phone is null or phone ~ '^\+[1-9][0-9]{7,14}$');

alter table if exists public.listings
  add constraint listings_tagline_length_chk
  check (char_length(coalesce(tagline, '')) <= 60);

alter table if exists public.listings
  add constraint listings_logo_cdn_chk
  check (logo is null or logo like 'https://images.thegreekdirectory.org/%');

alter table if exists public.listings
  add constraint listings_hours_iso_chk
  check (
    hours is null
    or (
      (hours->>'monday' is null or hours->>'monday' = 'Closed' or hours->>'monday' ~ '^([01][0-9]|2[0-3]):[0-5][0-9]-([01][0-9]|2[0-3]):[0-5][0-9]$') and
      (hours->>'tuesday' is null or hours->>'tuesday' = 'Closed' or hours->>'tuesday' ~ '^([01][0-9]|2[0-3]):[0-5][0-9]-([01][0-9]|2[0-3]):[0-5][0-9]$') and
      (hours->>'wednesday' is null or hours->>'wednesday' = 'Closed' or hours->>'wednesday' ~ '^([01][0-9]|2[0-3]):[0-5][0-9]-([01][0-9]|2[0-3]):[0-5][0-9]$') and
      (hours->>'thursday' is null or hours->>'thursday' = 'Closed' or hours->>'thursday' ~ '^([01][0-9]|2[0-3]):[0-5][0-9]-([01][0-9]|2[0-3]):[0-5][0-9]$') and
      (hours->>'friday' is null or hours->>'friday' = 'Closed' or hours->>'friday' ~ '^([01][0-9]|2[0-3]):[0-5][0-9]-([01][0-9]|2[0-3]):[0-5][0-9]$') and
      (hours->>'saturday' is null or hours->>'saturday' = 'Closed' or hours->>'saturday' ~ '^([01][0-9]|2[0-3]):[0-5][0-9]-([01][0-9]|2[0-3]):[0-5][0-9]$') and
      (hours->>'sunday' is null or hours->>'sunday' = 'Closed' or hours->>'sunday' ~ '^([01][0-9]|2[0-3]):[0-5][0-9]-([01][0-9]|2[0-3]):[0-5][0-9]$')
    )
  );
