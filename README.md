# PASS2U

Secondhand marketplace for verified FPT University students: sell, swap, or give away items, chat with sellers, and reserve items to hand over in person.

**Stack:** Next.js 15 (App Router, server actions) · Postgres via Drizzle (Neon in production) · Vercel Blob for listing photos · Tailwind CSS 4.

## How access works

1. Sign up with any email and password (FPT email not required).
2. Present the student ID during sign-up: student code, campus, and a photo of the physical card (camera scan or upload).
3. Confirm the email through the link we send (Resend; without a key the link is printed to the server log).
4. An admin approves or rejects it at `/admin`. Only approved students (and admins) can use the marketplace. Rejected students re-submit the card at `/verify`.

ID photos are stored in Postgres, never in public storage, and are only served to admins through `/api/admin/id/[userId]`. They are deleted 30 days after review by a daily Vercel cron (`/api/cron/purge-ids`) and whenever an admin opens the queue.

Authorization is enforced on the server in every page and server action (`src/lib/session.ts`): `requireApproved`, `requireAdmin`, plus ownership checks on listings and conversations.

## Deploy on Vercel

1. Import this repo in Vercel.
2. In the project's **Storage** tab, add **Neon** (sets `DATABASE_URL`) and **Blob** (sets `BLOB_READ_WRITE_TOKEN`).
3. Add environment variables: `SESSION_SECRET` (`openssl rand -base64 32`), `APP_URL` (your site URL), `CRON_SECRET` (random string), `ADMIN_EMAIL` + `ADMIN_PASSWORD` (the admin login), and optionally `RESEND_API_KEY` + `EMAIL_FROM`.
4. Deploy. Every build runs `scripts/migrate.mts`, which applies migrations in `./drizzle` and creates or updates the admin account.

After changing `src/lib/schema.ts`, run `npx drizzle-kit generate` and commit the new migration.

## Local development

```bash
cp .env.example .env.local   # point DATABASE_URL at a local Postgres
npm install
npx drizzle-kit push
npm run db:seed
npm run dev
```

Without `BLOB_READ_WRITE_TOKEN`, photos are saved to `./.uploads`.

## Tests

End-to-end tests cover sign-up, email confirmation, ID upload, admin approval, posting, search, chat, reservation, completion, and reporting:

```bash
npm run build && npm start > next.log &
NEXT_LOG=next.log npm run test:e2e
```
