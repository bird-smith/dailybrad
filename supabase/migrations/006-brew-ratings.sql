-- Plan 1.7: a 1-to-5 rating, taste words and a short note on each brew.
-- No new table, so no new lock: 004's "own brews only" policy covers these columns.
alter table brews
  add column rating smallint check (rating between 1 and 5),
  add column taste_words text[] not null default '{}'
    check (taste_words <@ array['sour','bitter','weak','strong','balanced']::text[]
           and cardinality(taste_words) <= 5),
  add column rating_note text check (char_length(rating_note) between 1 and 300),
  -- Words and a note only on a rated brew (decision 3).
  add constraint brews_rating_first
    check (rating is not null or (taste_words = '{}' and rating_note is null));
