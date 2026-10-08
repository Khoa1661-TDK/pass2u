// Creates (or promotes) the admin account from ADMIN_EMAIL / ADMIN_PASSWORD.
// Usage: DATABASE_URL=... ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run db:seed
import postgres from "postgres";
import bcrypt from "bcryptjs";

const { DATABASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
if (!DATABASE_URL || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error("Set DATABASE_URL, ADMIN_EMAIL and ADMIN_PASSWORD.");
  process.exit(1);
}
const sql = postgres(DATABASE_URL, { prepare: false });
const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
await sql`
  insert into users (email, password_hash, display_name, role, email_verified_at, verification_status)
  values (${ADMIN_EMAIL.toLowerCase()}, ${hash}, 'PASS2U Admin', 'admin', now(), 'approved')
  on conflict (email) do update set role = 'admin', password_hash = excluded.password_hash, email_verified_at = coalesce(users.email_verified_at, now())
`;
console.log(`Admin ready: ${ADMIN_EMAIL}`);
await sql.end();
