-- Add additional info and custom CTA fields for listings.
ALTER TABLE listings
    ADD COLUMN IF NOT EXISTS additional_info JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS custom_ctas JSONB DEFAULT '[]'::jsonb;

-- Ensure analytics can record custom CTA events (action/platform already used elsewhere).
ALTER TABLE listing_analytics
    ADD COLUMN IF NOT EXISTS action TEXT,
    ADD COLUMN IF NOT EXISTS platform TEXT;
