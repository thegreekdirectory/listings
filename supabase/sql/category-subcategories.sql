create table if not exists public.category_subcategories (
  category text primary key,
  subcategories text[] not null default '{}'
);

alter table public.category_subcategories enable row level security;

drop policy if exists "Allow public read category subcategories" on public.category_subcategories;
drop policy if exists "Allow admin write category subcategories" on public.category_subcategories;

create policy tgd_subcategories_public_select
  on public.category_subcategories
  for select
  to anon, authenticated
  using (true);

create policy tgd_subcategories_admin_all
  on public.category_subcategories
  for all
  to authenticated
  using (
    coalesce((select auth.jwt()) ->> 'role', '') in ('admin', 'service_role')
    or coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') in ('admin', 'super_admin')
  )
  with check (
    coalesce((select auth.jwt()) ->> 'role', '') in ('admin', 'service_role')
    or coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') in ('admin', 'super_admin')
  );
