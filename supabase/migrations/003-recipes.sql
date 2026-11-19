-- Saved recipes, locked to their owner in this same file.

-- Lets a recipe point at a method AND the same owner in one rule.
alter table methods add constraint methods_id_owner unique (id, user_id);

create table recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  method_id uuid not null,
  name text not null check (char_length(name) between 1 and 60),
  ratio numeric(3,1) not null check (ratio between 1 and 30),
  dose_grams numeric(4,1) not null check (dose_grams between 1 and 100),
  grinder text check (char_length(grinder) <= 60),
  grind_size text check (char_length(grind_size) <= 30),
  temperature integer check (temperature between 40 and 212),
  bloom_seconds integer check (bloom_seconds between 1 and 600),
  total_seconds integer check (total_seconds between 1 and 3600),
  steps jsonb not null default '[]'::jsonb
    check (jsonb_typeof(steps) = 'array' and jsonb_array_length(steps) <= 20),
  notes text check (char_length(notes) <= 2000),
  created_at timestamptz not null default now(),
  -- "no action": a method with recipes can't be removed.
  foreign key (method_id, user_id) references methods (id, user_id) on delete no action
);
create unique index recipes_name_once on recipes (user_id, method_id, lower(name));
create index recipes_by_method on recipes (method_id, user_id);
alter table recipes enable row level security;
create policy "own recipes only" on recipes
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

grant select, insert, update, delete on recipes to authenticated;
