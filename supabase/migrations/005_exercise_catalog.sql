create table if not exists exercise_catalog (
  id text primary key,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  name text not null,
  detail text not null,
  muscle_group text not null,
  primary_muscle text,
  youtube_url text,
  is_active boolean not null default true,
  sort_order integer not null default 0
);

create index if not exists idx_exercise_catalog_muscle_group
  on exercise_catalog (muscle_group, sort_order, name);

create or replace function update_exercise_catalog_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_exercise_catalog_updated_at on exercise_catalog;
create trigger trg_exercise_catalog_updated_at
before update on exercise_catalog
for each row execute function update_exercise_catalog_updated_at();

insert into exercise_catalog (
  id,
  name,
  detail,
  muscle_group,
  primary_muscle,
  youtube_url,
  is_active,
  sort_order
)
values
  ('supino-reto-barra', 'Supino Reto (Barra)', 'Peito completo', 'chest', 'pecs', null, true, 10),
  ('supino-inclinado-halteres', 'Supino Inclinado (Halteres)', 'Peito superior', 'chest', 'upper-pecs', null, true, 20),
  ('desenvolvimento-militar', 'Desenvolvimento Militar', 'Deltoide global', 'shoulders', 'front-delts', null, true, 30),
  ('elevacao-lateral', 'Elevação Lateral', 'Deltoide lateral', 'shoulders', 'side-delts', null, true, 40),
  ('triceps-corda', 'Tríceps Corda', 'Tríceps', 'triceps', 'triceps-lateral-head', null, true, 50),
  ('triceps-paralelas', 'Tríceps Paralelas', 'Tríceps', 'triceps', 'triceps-long-head', null, true, 60),
  ('barra-fixa', 'Barra Fixa', 'Dorsal', 'back', 'lats', null, true, 70),
  ('remada-curvada', 'Remada Curvada', 'Espessura de costas', 'back', 'mid-back', null, true, 80),
  ('remada-sentada', 'Remada Sentada', 'Costas', 'back', 'mid-back', null, true, 90),
  ('puxada-frontal', 'Puxada Frontal', 'Largura de dorsal', 'back', 'lats', null, true, 100),
  ('facepull', 'Facepull', 'Deltoide posterior', 'shoulders', 'rear-delts', null, true, 110),
  ('rosca-direta', 'Rosca Direta', 'Bíceps', 'biceps', 'biceps-long-head', null, true, 120),
  ('agachamento-livre', 'Agachamento Livre', 'Pernas completo', 'quads', 'quads-vastus', null, true, 130),
  ('agachamento-frontal', 'Agachamento Frontal', 'Quadríceps', 'quads', 'quads-rectus-femoris', null, true, 140),
  ('levantamento-terra-romeno', 'Levantamento Terra Romeno', 'Posterior de coxa', 'hamstrings', 'hamstrings-biceps-femoris', null, true, 150),
  ('stiff-com-halteres', 'Stiff com Halteres', 'Posterior', 'hamstrings', 'hamstrings-semitendinosus', null, true, 160),
  ('leg-press', 'Leg Press', 'Quadríceps', 'quads', 'quads-vastus', null, true, 170),
  ('cadeira-extensora', 'Cadeira Extensora', 'Quadríceps', 'quads', 'quads-rectus-femoris', null, true, 180),
  ('mesa-flexora', 'Mesa Flexora', 'Posterior', 'hamstrings', 'hamstrings-biceps-femoris', null, true, 190),
  ('afundo-caminhando', 'Afundo Caminhando', 'Glúteos e quads', 'glutes', 'glutes-maximus', null, true, 200),
  ('panturrilha-em-pe', 'Panturrilha em Pé', 'Panturrilha', 'calves', 'calves-gastrocnemius', null, true, 210)
on conflict (id) do update
  set
    name = excluded.name,
    detail = excluded.detail,
    muscle_group = excluded.muscle_group,
    primary_muscle = excluded.primary_muscle,
    youtube_url = excluded.youtube_url,
    is_active = excluded.is_active,
    sort_order = excluded.sort_order,
    updated_at = timezone('utc', now());

alter table exercise_catalog enable row level security;

drop policy if exists "Authenticated users can read exercise catalog" on exercise_catalog;
create policy "Authenticated users can read exercise catalog"
  on exercise_catalog
  for select
  using (auth.uid() is not null);
