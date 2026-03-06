-- Add custom fields and owner metadata to listings
ALTER TABLE listings
    ADD COLUMN IF NOT EXISTS additional_info jsonb DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS cta_buttons jsonb DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS custom_ctas jsonb DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS owner_name text,
    ADD COLUMN IF NOT EXISTS owner_title text,
    ADD COLUMN IF NOT EXISTS from_greece text,
    ADD COLUMN IF NOT EXISTS owner_email text,
    ADD COLUMN IF NOT EXISTS owner_phone text,
    ADD COLUMN IF NOT EXISTS owner_name_title_visible boolean NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS owner_email_visible boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS owner_phone_visible boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS owner_contacts jsonb DEFAULT '[]'::jsonb;

-- Optional: ensure existing rows have arrays instead of null
UPDATE listings
SET additional_info = COALESCE(additional_info, '[]'::jsonb),
    cta_buttons = COALESCE(cta_buttons, '[]'::jsonb),
    custom_ctas = COALESCE(custom_ctas, '[]'::jsonb)
WHERE additional_info IS NULL
   OR cta_buttons IS NULL
   OR custom_ctas IS NULL;
