ALTER TABLE public.listings
    ADD COLUMN hours_label_custom text,
    ADD COLUMN hours_disclaimer_custom text,
    ADD COLUMN custom_schema_properties text;
