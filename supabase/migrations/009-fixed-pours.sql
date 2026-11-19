-- Pours become "pour to" amounts (2026-11-19, Brad's feedback): a fixed weight in grams,
-- or a percentage (of the dose on the first pour, of the water after). The last pour has
-- `to` null and fills to the water. Before, each pour was a share of the water
-- ({"kind":"pour","percent":10}), so changing the dose moved every pour.
--
-- This turns each saved recipe's old shares into the fixed weights they showed at the
-- recipe's own dose, rounded like the site did (water to 2 decimals, then whole grams).
-- Brews keep their old shares: the site still reads them, and past brews stay as brewed.
-- No table changes, so nothing else to lock.

with items as (
  select
    r.id,
    e.n,
    e.item,
    round(r.dose_grams * r.ratio, 2) as water,
    sum(case when e.item->>'kind' = 'pour' then (e.item->>'percent')::numeric else 0 end)
      over (partition by r.id order by e.n) as share_so_far,
    count(*) filter (where e.item->>'kind' = 'pour') over (partition by r.id order by e.n) as pour_no,
    count(*) filter (where e.item->>'kind' = 'pour') over (partition by r.id) as pours
  from recipes r
  cross join lateral jsonb_array_elements(r.steps) with ordinality as e(item, n)
  where exists (select 1 from jsonb_array_elements(r.steps) x where x ? 'percent')
),
converted as (
  select
    id,
    jsonb_agg(
      case when item->>'kind' = 'pour' then jsonb_build_object(
        'kind', 'pour',
        'to', case when pour_no = pours then null else round(round(water * share_so_far / 100, 2)) end,
        'unit', 'g',
        'at', item->'at'
      ) else item end
      order by n
    ) as steps
  from items
  group by id
)
update recipes r set steps = c.steps from converted c where r.id = c.id;
