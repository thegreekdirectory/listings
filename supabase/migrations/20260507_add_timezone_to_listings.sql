ALTER TABLE public.listings
ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'America/Chicago';

COMMENT ON COLUMN public.listings.timezone IS 'IANA timezone name used for server-authoritative hours and open/closed status calculations (example: America/Chicago).';

UPDATE public.listings
SET timezone = 'America/Chicago'
WHERE timezone IS NULL OR btrim(timezone) = '';

ALTER TABLE public.listings
ADD CONSTRAINT listings_timezone_format_check
CHECK (timezone ~ '^[A-Za-z_]+(?:/[A-Za-z0-9_+\-]+)+$');
