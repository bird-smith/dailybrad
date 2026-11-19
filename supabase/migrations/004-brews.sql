-- Brews: each cup logged with the settings it was made with, locked to its owner.

-- Lets a brew point at a bean or recipe AND the same owner in one rule.
alter table beans add constraint beans_id_owner unique (id, user_id);
alter table recipes add constraint recipes_id_owner unique (id, user_id);

create table brews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  brewed_at timestamptz not null default now(),
  bean_id uuid not null,
  method_id uuid not null,
  recipe_id uuid,
  recipe_name text not null check (char_length(recipe_name) between 1 and 60),
  dose_grams numeric(4,1) not null check (dose_grams between 1 and 100),
  ratio numeric(3,1) not null check (ratio between 1 and 30),
  grinder text check (char_length(grinder) <= 60),
  grind_size text check (char_length(grind_size) <= 30),
  temperature integer check (temperature between 40 and 212),
  bloom_seconds integer check (bloom_seconds between 1 and 600),
  brew_seconds integer check (brew_seconds between 1 and 3600),
  steps jsonb not null default '[]'::jsonb
    check (jsonb_typeof(steps) = 'array' and jsonb_array_length(steps) <= 20),
  -- "no action": a bean or method with brews can't be deleted (decision 1).
  foreign key (bean_id, user_id) references beans (id, user_id) on delete no action,
  foreign key (method_id, user_id) references methods (id, user_id) on delete no action,
  -- Deleting a recipe keeps its brews and forgets only the link (decision 2).
  foreign key (recipe_id, user_id) references recipes (id, user_id)
    on delete set null (recipe_id)
);
create index brews_newest on brews (user_id, brewed_at desc);
create index brews_by_bean on brews (bean_id, user_id);
create index brews_by_method on brews (method_id, user_id);
create index brews_by_recipe on brews (recipe_id, user_id);
alter table brews enable row level security;
create policy "own brews only" on brews
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

grant select, insert, update, delete on brews to authenticated;
