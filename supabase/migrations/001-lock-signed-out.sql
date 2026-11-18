-- Signed-out visitors (Supabase's "anon" role) get no access to anything made later.
-- Each table still needs its own row level security policy in the file that creates it.
alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke all on sequences from anon;
alter default privileges in schema public revoke all on functions from anon;
