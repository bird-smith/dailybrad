-- Dose totals per bag in use, in tenths of a gram, for "cups left".
-- Runs as the caller, so the "own rows only" locks on brews and beans apply.
create function bean_supply()
returns table (
  bean_id uuid,
  used_tenths integer,
  last_dose_tenths integer
)
language sql stable security invoker
set search_path = ''
as $$
  select b.bean_id,
         (sum(b.dose_grams) * 10)::integer,
         ((array_agg(b.dose_grams order by b.brewed_at desc))[1] * 10)::integer
  from public.brews b
  join public.beans n on n.id = b.bean_id and n.user_id = b.user_id
  where b.user_id = auth.uid()
    and not n.finished
  group by b.bean_id;
$$;

-- New functions can be run by everyone unless told otherwise.
revoke execute on function bean_supply() from public, anon;
grant execute on function bean_supply() to authenticated;
