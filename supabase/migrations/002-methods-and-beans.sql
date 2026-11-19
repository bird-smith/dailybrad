-- Brewing methods and bags of beans. Each table is locked to its owner in this same file.

create table methods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  created_at timestamptz not null default now()
);
create unique index methods_name_once on methods (user_id, lower(name));
alter table methods enable row level security;
create policy "own methods only" on methods
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create table beans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  roaster text check (char_length(roaster) <= 100),
  roast_date date,
  bag_grams integer check (bag_grams between 1 and 5000),
  cost_cents integer check (cost_cents between 0 and 100000),
  region text check (char_length(region) <= 100),
  varietal text check (char_length(varietal) <= 100),
  notes text check (char_length(notes) <= 2000),
  finished boolean not null default false,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  check (not (finished and is_active))
);
create unique index beans_one_active on beans (user_id) where is_active;
alter table beans enable row level security;
create policy "own beans only" on beans
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

grant select, insert, update, delete on methods, beans to authenticated;

-- Switch the active bag in one go, so there is never a moment with two.
create function set_active_bean(bean_id uuid) returns void
language sql security invoker set search_path = ''
as $$
  update public.beans set is_active = false where is_active and id <> bean_id;
  update public.beans set is_active = true where id = bean_id and not finished;
$$;
revoke execute on function set_active_bean(uuid) from public, anon;
grant execute on function set_active_bean(uuid) to authenticated;
