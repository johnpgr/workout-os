drop policy if exists "Authenticated users can read exercise catalog" on exercise_catalog;
drop policy if exists "Public can read exercise catalog" on exercise_catalog;

create policy "Public can read exercise catalog"
  on exercise_catalog
  for select
  using (true);
