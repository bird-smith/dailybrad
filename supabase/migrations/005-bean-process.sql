-- Beans: add "process" (washed, natural, honey...), free text like region and varietal.
-- beans is already locked to its owner (002), and the lock covers new columns.
alter table beans add column process text check (char_length(process) <= 100);
