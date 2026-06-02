-- Adds an optional custom heading for the listing page chain/related listings section.
-- Blank or NULL values should be treated by the application as "More Locations".
ALTER TABLE public.listings
ADD COLUMN IF NOT EXISTS more_listings_title_custom text;

COMMENT ON COLUMN public.listings.more_listings_title_custom IS 'Custom title for the More Listings section on listing pages; defaults to More Locations when blank or NULL';
