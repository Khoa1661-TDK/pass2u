// Demo listings so the market isn't empty before real students post.
// Owned by a demo account that can't sign in. Runs once: skipped if the
// demo account already exists. Delete that user to remove them all.
import type postgres from "postgres";

const img = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=900&h=1125&q=75`;

const ITEMS = [
  ["Giáo trình Toán rời rạc (demo)", "textbooks", "good", "sell", 60000, "1512820790803-83ca734da794"],
  ["Bộ sách tiếng Anh Summit 1 (demo)", "textbooks", "like_new", "sell", 120000, "1495446815901-a7297e633e8d"],
  ["Laptop stand, aluminium (demo)", "electronics", "like_new", "sell", 150000, "1496181133206-80ce9b88a853"],
  ["Casio fx-580VN X calculator (demo)", "electronics", "good", "sell", 250000, "1564939558297-fc396f18e5c7"],
  ["Desk lamp for dorm (demo)", "dorm", "good", "free", null, "1507473885765-e6ed057f782c"],
  ["Bedding set, single (demo)", "dorm", "good", "sell", 90000, "1505693416388-ac5ce068fe85"],
  ["Áo đồng phục FPT size M (demo)", "clothing", "like_new", "exchange", null, "1523381210434-271e8be1f52b"],
  ["Notebooks and pens bundle (demo)", "stationery", "new", "sell", 40000, "1456735190827-d1262f71b8a3"],
] as const;

export async function seedDemoListings(sql: postgres.Sql) {
  const [exists] = await sql`select id from users where email = 'demo@pass2u.local'`;
  if (exists) return;
  const [u] = await sql`
    insert into users (email, password_hash, display_name, campus, role, email_verified_at, verification_status, verified_at)
    values ('demo@pass2u.local', '!', 'PASS2U Demo', 'Hà Nội', 'student', now(), 'approved', now())
    returning id`;
  for (const [title, category, condition, type, price, photo] of ITEMS) {
    const [l] = await sql`
      insert into listings (seller_id, title, description, category, condition, type, price, exchange_for, campus)
      values (${u.id}, ${title}, ${"Demo listing to show how PASS2U works. This item is not really for sale."},
        ${category}, ${condition}, ${type}, ${price}, ${type === "exchange" ? "Any size L uniform" : null}, 'Hà Nội')
      returning id`;
    await sql`insert into listing_images (listing_id, url, position) values (${l.id}, ${img(photo)}, 0)`;
  }
  console.log(`[migrate] added ${ITEMS.length} demo listings`);
}
