create table if not exists category_subcategories (
  category text primary key,
  subcategories text[] not null default '{}'
);

alter table category_subcategories enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='category_subcategories' and policyname='Allow public read category subcategories') then
    create policy "Allow public read category subcategories" on category_subcategories for select to anon, authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='category_subcategories' and policyname='Allow admin write category subcategories') then
    create policy "Allow admin write category subcategories" on category_subcategories for all to anon, authenticated using (true) with check (true);
  end if;
end $$;
