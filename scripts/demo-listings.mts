// Demo listings so the market isn't empty before real students post.
// Owned by a demo account that can't sign in. Self-healing: each item is
// inserted when its title is missing, its cover photo is re-pointed when the
// mapping changes, and demo rows whose title was renamed are removed.
// Delete the demo user to remove them all.
import type postgres from "postgres";

const img = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=900&h=1125&q=75`;

const DESC_VI = "Tin đăng mẫu để minh họa cách PASS2U hoạt động. Món này không thực sự được bán.";

// Every photo was visually verified to show the item the title names.
// title, category, condition, type, price, unsplash photo, campus
const ITEMS: readonly (readonly [string, string, string, string, number | null, string, string])[] = [
  // Newest first — the landing "Vừa đăng" strip shows the eight most recent.
  ["Tai nghe Sony WH-1000XM4 (demo)", "electronics", "like_new", "sell", 3_500_000, "1583394838336-acd977736f90", "Hà Nội"],
  ["Giày thể thao size 42 (demo)", "clothing", "good", "sell", 300_000, "1575176648002-f2021e56b375", "Hà Nội"],
  ["Bộ bút marker Tombow (demo)", "stationery", "new", "sell", 150_000, "1588014328249-1453571ccb27", "Hà Nội"],
  ["Giáo trình Giải tích 1 (demo)", "textbooks", "like_new", "sell", 55_000, "1495446815901-a7297e633e8d", "Hà Nội"],
  ["Đèn ngủ kê giường (demo)", "dorm", "good", "sell", 120_000, "1517862774645-dd398fbfaffa", "Hồ Chí Minh"],
  ["Áo khoác gió đồng phục FPT (demo)", "clothing", "like_new", "exchange", null, "1543076447-215ad9ba6923", "Hà Nội"],
  ["Bàn phím cơ Keychron (demo)", "electronics", "good", "sell", 450_000, "1598428452014-264f8ff1b174", "Hồ Chí Minh"],
  ["Kệ sách 3 tầng (demo)", "other", "good", "sell", 800_000, "1593173945705-d6451ed5909a", "Hà Nội"],
  ["Quạt đứng KDK (demo)", "dorm", "good", "free", null, "1601084195907-44baaa49dabd", "Hà Nội"],
  ["Vở kẻ ngang bìa cứng, 10 cuốn (demo)", "stationery", "new", "sell", 35_000, "1717078279011-b0e9ae2a3a71", "Đà Nẵng"],
  ["Sách Lập trình Python nhập môn (demo)", "textbooks", "like_new", "sell", 130_000, "1694180846894-38a13c8ec9db", "Hà Nội"],
  ["Sạc dự phòng 20.000 mAh (demo)", "electronics", "new", "sell", 180_000, "1564286026321-4e3ad4d6022d", "Cần Thơ"],
  ["Tủ vải 3 ngăn (demo)", "dorm", "good", "sell", 120_000, "1753369232904-a8a888319d28", "Hồ Chí Minh"],
  ["Đồng phục thể dục size L (demo)", "clothing", "like_new", "free", null, "1602810320073-1230c46d89d4", "Đà Nẵng"],
  ["Bộ bút chì màu 48 ô (demo)", "stationery", "good", "sell", 90_000, "1557154683-264bf969e849", "Hà Nội"],
  ["Thảm yoga TPE (demo)", "other", "like_new", "sell", 150_000, "1646239646963-b0b9be56d6b5", "Hà Nội"],
  ["Balo chống nước 30L (demo)", "other", "new", "sell", 250_000, "1707903074794-e35472388c44", "Hà Nội"],
  ["Đèn LED dây phòng trọ (demo)", "other", "new", "sell", 60_000, "1616243850909-f010afe8de3a", "Hồ Chí Minh"],
  ["Ấm đun nước 1,8L (demo)", "dorm", "good", "sell", 80_000, "1630617867674-3905ea203152", "Hà Nội"],
  ["Nồi cơm điện mini 1,2 L (demo)", "dorm", "good", "sell", 250_000, "1599182345361-9542815e73f6", "Hồ Chí Minh"],
  ["iPad Gen 9 64GB (demo)", "electronics", "like_new", "sell", 5_500_000, "1588593371666-e86e342fde78", "Hà Nội"],
  // Original eight.
  ["Giáo trình Toán rời rạc (demo)", "textbooks", "good", "sell", 60_000, "1512820790803-83ca734da794", "Hà Nội"],
  ["Bộ sách tiếng Anh Summit 1 (demo)", "textbooks", "like_new", "sell", 120_000, "1585521607120-182732851afe", "Hà Nội"],
  ["Giá đỡ laptop gỗ (demo)", "electronics", "like_new", "sell", 150_000, "1637580686082-317328e724d1", "Hà Nội"],
  ["Máy tính cầm tay Casio fx-580VN X (demo)", "electronics", "good", "sell", 250_000, "1637239990694-ba96d4b80acc", "Hà Nội"],
  ["Đèn bàn ký túc xá (demo)", "dorm", "good", "free", null, "1507473885765-e6ed057f782c", "Hà Nội"],
  ["Bộ chăn ga gối đơn (demo)", "dorm", "good", "sell", 90_000, "1505693416388-ac5ce068fe85", "Hà Nội"],
  ["Áo đồng phục FPT size M (demo)", "clothing", "like_new", "exchange", null, "1633008004535-b255bab275cc", "Hà Nội"],
  ["Bộ vở và bút (demo)", "stationery", "new", "sell", 40_000, "1717079556888-c23cb91b450f", "Hà Nội"],
];

export async function seedDemoListings(sql: postgres.Sql) {
  let [u] = await sql`select id from users where email = 'demo@pass2u.local'`;
  if (!u)
    [u] = await sql`
      insert into users (email, password_hash, display_name, campus, role, email_verified_at, verification_status, verified_at)
      values ('demo@pass2u.local', '!', 'PASS2U Demo', 'Hà Nội', 'student', now(), 'approved', now())
      returning id`;
  // Titles were renamed across versions; drop demo rows no longer in the list.
  const titles = ITEMS.map(([t]) => t);
  await sql`delete from listings where seller_id = ${u.id} and title <> all(${sql.array(titles)})`;
  let added = 0;
  for (let i = 0; i < ITEMS.length; i++) {
    const [title, category, condition, type, price, photo, campus] = ITEMS[i];
    const [l] = await sql`select id from listings where seller_id = ${u.id} and title = ${title}`;
    if (l) {
      // Keep covers in sync with the verified photo mapping.
      await sql`update listing_images set url = ${img(photo)} where listing_id = ${l.id} and position = 0`;
      continue;
    }
    // Stagger creation times so "Vừa đăng" reads like a live feed.
    const [n] = await sql`
      insert into listings (seller_id, title, description, category, condition, type, price, exchange_for, campus, created_at)
      values (${u.id}, ${title}, ${DESC_VI},
        ${category}, ${condition}, ${type}, ${price}, ${type === "exchange" ? "Đồng phục size L bất kỳ" : null},
        ${campus}, now() - (${i} * interval '1 hour'))
      returning id`;
    await sql`insert into listing_images (listing_id, url, position) values (${n.id}, ${img(photo)}, 0)`;
    added++;
  }
  if (added) console.log(`[migrate] added ${added} demo listings`);
}
