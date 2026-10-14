import { seedDemoListings } from "./demo-listings.mts";
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

// Approved students keep their card photo on the account.
await sql`update id_documents set delete_after = null where user_id in (select id from users where verification_status = 'approved')`;

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
// A ready-made, approved student account for demos, so the marketplace can be
// shown without a real card. SEED_DEMO=0 locks it (its password stops working).
const DEMO_STUDENT = "sinhvien@pass2u.demo";
if (process.env.SEED_DEMO !== "0") {
  await seedDemoListings(sql);
  const hash = await bcrypt.hash(process.env.DEMO_PASSWORD || "pass2u-demo", 10);
  await sql`
    insert into users (email, password_hash, display_name, campus, phone, residence, email_verified_at, verification_status, verified_at)
    values (${DEMO_STUDENT}, ${hash}, 'Sinh viên Demo', 'Hà Nội', '0900000000', 'KTX FPT Hà Nội', now(), 'approved', now())
    on conflict (email) do update set password_hash = excluded.password_hash
  `;
  console.log(`[migrate] demo student ready: ${DEMO_STUDENT}`);
} else {
  await sql`update users set password_hash = '!' where email = ${DEMO_STUDENT}`;
}
await sql.end();
