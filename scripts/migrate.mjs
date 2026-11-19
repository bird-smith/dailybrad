// Runs new files in supabase/migrations/ against the database, each once, in number order.
//
//   npm run migrate                 run files not run yet
//   npm run migrate -- --list       show what's run and what's waiting, change nothing
//   npm run migrate -- --record-only  mark every file as run without running it (setup only)
//   npm run migrate -- --allow-destructive  needed for files that drop tables or columns,
//                                           delete rows or truncate
//
// Needs SUPABASE_DB_URL in .env: a SECRET key with full control of the database.
// Never give it a VITE_ name: those are built into the public site.
import { readdirSync, readFileSync } from 'node:fs'
import pg from 'pg'

const DIR = new URL('../supabase/migrations/', import.meta.url)
const args = new Set(process.argv.slice(2))

// Read the address in pieces, so a password with # @ / ? in it still works.
function connectionFromEnv() {
  const url = process.env.SUPABASE_DB_URL
  const m = url?.match(/^postgres(?:ql)?:\/\/([^:]+):(.*)@([^@:/]+):(\d+)\/(\w+)$/)
  if (!m) {
    console.error('SUPABASE_DB_URL in .env is missing or not in the expected shape.')
    process.exit(1)
  }
  return { user: m[1], password: m[2], host: m[3], port: Number(m[4]), database: m[5], ssl: { rejectUnauthorized: false } }
}

const files = readdirSync(DIR)
  .filter((f) => /^\d{3}-.+\.sql$/.test(f))
  .sort()

const client = new pg.Client(connectionFromEnv())
await client.connect()
try {
  // The record of what's been run. "private" isn't reachable from the website.
  await client.query(`
    create schema if not exists private;
    revoke all on schema private from public, anon, authenticated;
    create table if not exists private.migrations_run (
      name text primary key,
      run_at timestamptz not null default now()
    );`)
  const done = new Set((await client.query('select name from private.migrations_run')).rows.map((r) => r.name))
  const waiting = files.filter((f) => !done.has(f))

  if (args.has('--list')) {
    for (const f of files) console.log(`${done.has(f) ? 'run    ' : 'waiting'}  ${f}`)
  } else if (args.has('--record-only')) {
    for (const f of waiting) {
      await client.query('insert into private.migrations_run (name) values ($1)', [f])
      console.log(`recorded ${f} (not run)`)
    }
  } else if (waiting.length === 0) {
    console.log('Nothing to run: the database is up to date.')
  } else {
    for (const f of waiting) {
      const sql = readFileSync(new URL(f, DIR), 'utf8')
      const code = sql.replace(/--.*$/gm, '')
      if (/\b(drop\s+(table|column|schema)|delete\s+from|truncate)\b/i.test(code) && !args.has('--allow-destructive')) {
        console.error(`${f} drops, deletes or truncates. Ask the owner first, then rerun with --allow-destructive.`)
        process.exit(1)
      }
      // All or nothing: if any line fails, nothing in the file is kept.
      await client.query('begin')
      try {
        await client.query(sql)
        await client.query('insert into private.migrations_run (name) values ($1)', [f])
        await client.query('commit')
        console.log(`ran ${f}`)
      } catch (error) {
        await client.query('rollback')
        console.error(`${f} failed, nothing from it was kept: ${error.message}`)
        process.exit(1)
      }
    }
  }
} finally {
  await client.end()
}
