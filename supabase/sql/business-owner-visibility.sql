alter table if exists business_owners
  add column if not exists name_title_visible boolean not null default true,
  add column if not exists email_visible boolean not null default true,
  add column if not exists phone_visible boolean not null default false;
