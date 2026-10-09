// Demo listings so the market isn't empty before real students post.
// Owned by a demo account that can't sign in. Idempotent: each item is
// inserted only if its title is missing, so re-runs just top up.
// Delete the demo user to remove them all.
import type postgres from "postgres";

const img = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=900&h=1125&q=75`;

const DESC_VI = "Tin đăng mẫu để minh họa cách PASS2U hoạt động. Món này không thực sự được bán.";

// title, category, condition, type, price, unsplash photo, campus
const ITEMS: readonly (readonly [string, string, string, string, number | null, string, string])[] = [
  // Newest first — the landing "Vừa đăng" strip shows the eight most recent.
  ["Tai nghe Sony WH-1000XM4 (demo)", "electronics", "like_new", "sell", 3_500_000, "1583394838336-acd977736f90", "Hà Nội"],
  ["Giày thể thao size 42 (demo)", "clothing", "good", "sell", 300_000, "1556905055-8f358a7a47b2", "Hà Nội"],
  ["Bộ bút marker Tombow (demo)", "stationery", "new", "sell", 150_000, "1456735190827-d1262f71b8a3", "Hà Nội"],
  ["Giáo trình Giải tích 1 (demo)", "textbooks", "like_new", "sell", 55_000, "1495446815901-a7297e633e8d", "Hà Nội"],
  ["Đèn ngủ kê giường (demo)", "dorm", "good", "sell", 120_000, "1505693416388-ac5ce068fe85", "Hồ Chí Minh"],
  ["Áo khoác gió đồng phục FPT (demo)", "clothing", "like_new", "exchange", null, "1523381210434-271e8be1f52b", "Hà Nội"],
  ["Bàn phím cơ Keychron (demo)", "electronics", "good", "sell", 450_000, "1496181133206-80ce9b88a853", "Hồ Chí Minh"],
  ["Kệ sách gỗ mini (demo)", "other", "good", "sell", 800_000, "1600585154340-be6161a56a0c", "Hà Nội"],
  ["Quạt đứng KDK (demo)", "dorm", "good", "free", null, "1507473885765-e6ed057f782c", "Hà Nội"],
  ["Vở kẻ ngang bìa cứng, 10 cuốn (demo)", "stationery", "new", "sell", 35_000, "1456735190827-d1262f71b8a3", "Đà Nẵng"],
  ["Sách Lập trình Python nhập môn (demo)", "textbooks", "like_new", "sell", 130_000, "1512820790803-83ca734da794", "Hà Nội"],
  ["Sạc dự phòng 20.000 mAh (demo)", "electronics", "new", "sell", 180_000, "1496181133206-80ce9b88a853", "Cần Thơ"],
  ["Tủ vải 3 ngăn (demo)", "dorm", "good", "sell", 120_000, "1505693416388-ac5ce068fe85", "Hồ Chí Minh"],
  ["Đồng phục thể dục size L (demo)", "clothing", "like_new", "free", null, "1523381210434-271e8be1f52b", "Đà Nẵng"],
  ["Bộ dụng cụ vẽ kỹ thuật (demo)", "stationery", "good", "sell", 90_000, "1456735190827-d1262f71b8a3", "Hà Nội"],
  ["Thảm yoga TPE (demo)", "other", "like_new", "sell", 150_000, "1600585154340-be6161a56a0c", "Hà Nội"],
  ["Balo chống nước 30L (demo)", "other", "new", "sell", 250_000, "1584917865442-de89df76afd3", "Hà Nội"],
  ["Đèn LED dây phòng trọ (demo)", "other", "new", "sell", 60_000, "1507473885765-e6ed057f782c", "Hồ Chí Minh"],
  ["Ấm đun nước inox 1,8L (demo)", "dorm", "good", "sell", 80_000, "1600585154340-be6161a56a0c", "Hà Nội"],
  // Original eight.
  ["Giáo trình Toán rời rạc (demo)", "textbooks", "good", "sell", 60_000, "1512820790803-83ca734da794", "Hà Nội"],
  ["Bộ sách tiếng Anh Summit 1 (demo)", "textbooks", "like_new", "sell", 120_000, "1495446815901-a7297e633e8d", "Hà Nội"],
  ["Giá đỡ laptop nhôm (demo)", "electronics", "like_new", "sell", 150_000, "1496181133206-80ce9b88a853", "Hà Nội"],
  ["Máy tính cầm tay Casio fx-580VN X (demo)", "electronics", "good", "sell", 250_000, "1564939558297-fc396f18e5c7", "Hà Nội"],
  ["Đèn bàn ký túc xá (demo)", "dorm", "good", "free", null, "1507473885765-e6ed057f782c", "Hà Nội"],
  ["Bộ chăn ga gối đơn (demo)", "dorm", "good", "sell", 90_000, "1505693416388-ac5ce068fe85", "Hà Nội"],
  ["Áo đồng phục FPT size M (demo)", "clothing", "like_new", "exchange", null, "1523381210434-271e8be1f52b", "Hà Nội"],
  ["Bộ vở và bút (demo)", "stationery", "new", "sell", 40_000, "1456735190827-d1262f71b8a3", "Hà Nội"],
];

export async function seedDemoListings(sql: postgres.Sql) {
  let [u] = await sql`select id from users where email = 'demo@pass2u.local'`;
  if (!u)
    [u] = await sql`
      insert into users (email, password_hash, display_name, campus, role, email_verified_at, verification_status, verified_at)
      values ('demo@pass2u.local', '!', 'PASS2U Demo', 'Hà Nội', 'student', now(), 'approved', now())
      returning id`;
  let added = 0;
  for (let i = 0; i < ITEMS.length; i++) {
    const [title, category, condition, type, price, photo, campus] = ITEMS[i];
    const [has] = await sql`select 1 from listings where seller_id = ${u.id} and title = ${title}`;
    if (has) continue;
    // Stagger creation times so "Vừa đăng" reads like a live feed.
    const [l] = await sql`
      insert into listings (seller_id, title, description, category, condition, type, price, exchange_for, campus, created_at)
      values (${u.id}, ${title}, ${DESC_VI},
        ${category}, ${condition}, ${type}, ${price}, ${type === "exchange" ? "Đồng phục size L bất kỳ" : null},
        ${campus}, now() - (${i} * interval '1 hour'))
      returning id`;
    await sql`insert into listing_images (listing_id, url, position) values (${l.id}, ${img(photo)}, 0)`;
    added++;
  }
  if (added) console.log(`[migrate] added ${added} demo listings`);
}
