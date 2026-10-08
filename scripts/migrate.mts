// Runs on every Vercel build: applies pending migrations in ./drizzle,
// then creates/updates the admin account if ADMIN_EMAIL and ADMIN_PASSWORD are set.
import postgres from "postgres";
import bcrypt from "bcryptjs";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";

const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!url) {
  console.log("[migrate] DATABASE_URL not set, skipping.");
  process.exit(0);
}
const sql = postgres(url, { prepare: false, max: 1, onnotice: () => {} });
await migrate(drizzle(sql), { migrationsFolder: "./drizzle" });
console.log("[migrate] schema up to date");

// Sports and vehicle categories were dropped; fold their listings into Other.
await sql`update listings set category = 'other' where category in ('sports', 'vehicles')`;

const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
if (ADMIN_EMAIL && ADMIN_PASSWORD) {
  const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  await sql`
    insert into users (email, password_hash, display_name, role, email_verified_at, verification_status)
    values (${ADMIN_EMAIL.toLowerCase()}, ${hash}, 'PASS2U Admin', 'admin', now(), 'approved')
    on conflict (email) do update set role = 'admin', password_hash = excluded.password_hash
  `;
  console.log(`[migrate] admin ready: ${ADMIN_EMAIL}`);
}
await sql.end();
