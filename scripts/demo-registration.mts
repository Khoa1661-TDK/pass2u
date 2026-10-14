// A sample sign-up waiting in the admin "Duyệt" queue, so approving a student
// can be shown without a real card. Each build puts it back to pending.
// The account has no usable password, so nobody can sign in as it.
import { readFile } from "node:fs/promises";
import path from "node:path";
import type postgres from "postgres";

const EMAIL = "demo.dangky@pass2u.local";
const CODE = "SE199999";

export async function seedDemoRegistration(sql: postgres.Sql) {
  const image = await readFile(path.join(process.cwd(), "scripts/demo-card.png"));
  const [u] = await sql`
    insert into users (email, password_hash, display_name, student_code, campus, phone, birth_date, residence, cohort, major,
                       email_verified_at, verification_status)
    values (${EMAIL}, '!', 'Nguyễn Văn Demo', ${CODE}, 'Hà Nội', '0900000000', '2005-01-01', 'KTX FPT Hà Nội', 'K21', null,
            now(), 'pending')
    on conflict (email) do update set verification_status = 'pending', verified_at = null, rejection_reason = null, banned_at = null
    returning id`;
  await sql`
    insert into id_documents (user_id, image, mime, ocr_code, ocr_name_match, ocr_looks_fpt, ocr_text)
    values (${u.id}, ${image}, 'image/png', ${CODE}, true, true, 'FPT UNIVERSITY STUDENT ID CARD NGUYEN VAN DEMO MSSV: SE199999')
    on conflict (user_id) do update set image = excluded.image, uploaded_at = now(), delete_after = null`;
  console.log(`[migrate] demo registration waiting for approval: ${EMAIL}`);
}
