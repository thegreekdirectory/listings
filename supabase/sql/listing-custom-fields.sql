-- Add custom CTA buttons and additional info fields to listings
ALTER TABLE listings
    ADD COLUMN IF NOT EXISTS additional_info jsonb DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS custom_ctas jsonb DEFAULT '[]'::jsonb;

-- Optional: ensure existing rows have arrays instead of null
UPDATE listings
SET additional_info = COALESCE(additional_info, '[]'::jsonb),
    custom_ctas = COALESCE(custom_ctas, '[]'::jsonb)
WHERE additional_info IS NULL
   OR custom_ctas IS NULL;
