-- Rating sums per recipe for one method: overall, and for one bag.
-- Runs as the caller, so the "own brews only" lock on brews applies.
create function recipe_ratings(p_method_id uuid, p_bean_id uuid)
returns table (
  recipe_id uuid,
  rated_brews integer,
  rating_total integer,
  bean_rated_brews integer,
  bean_rating_total integer
)
language sql stable security invoker
set search_path = ''
as $$
  select b.recipe_id,
         count(*)::integer,
         sum(b.rating)::integer,
         (count(*) filter (where b.bean_id = p_bean_id))::integer,
         coalesce(sum(b.rating) filter (where b.bean_id = p_bean_id), 0)::integer
  from public.brews b
  where b.user_id = auth.uid()
    and b.method_id = p_method_id
    and b.recipe_id is not null
    and b.rating is not null
  group by b.recipe_id;
$$;

-- New functions can be run by everyone unless told otherwise.
revoke execute on function recipe_ratings(uuid, uuid) from public, anon;
grant execute on function recipe_ratings(uuid, uuid) to authenticated;
