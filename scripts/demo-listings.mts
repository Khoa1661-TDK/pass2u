// Demo listings so the market isn't empty before real students post.
// Owned by a demo account that can't sign in. Self-healing: each item is
// inserted when its title is missing, its cover photo is re-pointed when the
// mapping changes, and demo rows whose title was renamed are removed.
// Delete the demo user to remove them all.
import type postgres from "postgres";

// Unsplash photo id (free licence, hotlinked as Unsplash asks), or a key for a
// file in public/demo: Khoa's own photos, or drawings by
// scripts/draw-demo-items.mjs for FPT-specific items no free photo shows.
// Each Unsplash id was matched to its title from the photo page's own text.
const img = (key: string) =>
  key.startsWith("photo-") ? `https://images.unsplash.com/${key}?auto=format&fit=crop&w=900&h=1125&q=75` : `/demo/${key}.webp`;

const NOTE = "\n\nĐây là tin đăng mẫu để minh họa PASS2U, món này không thực sự được bán.";

type Item = {
  title: string; category: string; condition: string; type: "sell" | "exchange" | "free";
  price: number | null; photo: string; campus: string; desc: string; exchangeFor?: string;
};

// Newest first: the landing "Vừa đăng" strip shows the eight most recent.
const ITEMS: readonly Item[] = [
  { title: "Áo polo đồng phục FPT size M (demo)", category: "clothing", condition: "like_new", type: "sell", price: 90_000, photo: "fpt-polo", campus: "Hà Nội",
    desc: "Mua ở phòng dịch vụ sinh viên hồi kỳ 1, mặc khoảng chục buổi. Không phai màu, không xù vải. Mình lên size L nên pass lại." },
  { title: "Giáo trình PRF192 Lập trình C (demo)", category: "textbooks", condition: "good", type: "sell", price: 40_000, photo: "book-prf192", campus: "Hà Nội",
    desc: "Giáo trình môn PRF192, có highlight vài chương con trỏ và mảng. Kèm mấy tờ note đề PE cũ mình tự chép." },
  { title: "Máy tính khoa học Casio có nắp (demo)", category: "electronics", condition: "like_new", type: "sell", price: 380_000, photo: "photo-1757256137041-0aab889db199", campus: "Đà Nẵng",
    desc: "Casio có nắp trượt, phím bấm còn nhạy, màn hình rõ. Dùng tốt cho MAE101 và MAS291, được mang vào phòng thi." },
  { title: "Bàn phím cơ Keychron K2 switch đỏ (demo)", category: "electronics", condition: "good", type: "sell", price: 950_000, photo: "photo-1589578228447-e1a4e481c6c8", campus: "Hồ Chí Minh",
    desc: "Layout 75%, kết nối Bluetooth và dây, switch đỏ gõ nhẹ và êm, không ồn phòng ký túc. Pin còn tốt, kèm dây Type-C." },
  { title: "Áo khoác gió FPT màu cam có mũ (demo)", category: "clothing", condition: "like_new", type: "exchange", price: null, photo: "fpt-jacket-photo", campus: "Hà Nội",
    desc: "Áo khoác gió FPT màu cam, có mũ trùm tháo được, size L. Mặc vài lần mùa đông, chống gió tốt, khóa kéo còn trơn.", exchangeFor: "Áo khoác FPT size M" },
  { title: "Tai nghe Sony chụp tai màu đen (demo)", category: "electronics", condition: "good", type: "sell", price: 3_200_000, photo: "photo-1612858249816-5a91a9fb9886", campus: "Hà Nội",
    desc: "Tai nghe chụp tai Sony màu đen, bass chắc, đeo lâu không đau tai. Đệm tai còn êm, kèm dây sạc." },
  { title: "Nồi cơm điện (demo)", category: "dorm", condition: "good", type: "sell", price: 180_000, photo: "photo-1569641092045-f6ec23879aef", campus: "Hồ Chí Minh",
    desc: "Đủ cho 2 người ăn, lòng nồi chống dính chưa tróc. Mình ra trường nên dọn đồ phòng trọ." },
  { title: "Đồng phục thể dục FPT size L (demo)", category: "clothing", condition: "good", type: "free", price: null, photo: "fpt-pe", campus: "Đà Nẵng",
    desc: "Bộ áo quần thể dục đã học xong môn, cho lại bạn nào cần. Qua campus lấy trực tiếp." },
  { title: "Màn hình Dell 24 inch (demo)", category: "electronics", condition: "good", type: "sell", price: 1_600_000, photo: "photo-1614624532983-4ce03382d63d", campus: "Hà Nội",
    desc: "Màn hình Dell 24 inch, có HDMI và DisplayPort, không điểm chết. Code đồ án đỡ mỏi mắt hơn hẳn." },
  { title: "Giáo trình tiếng Nhật JPD113 (demo)", category: "textbooks", condition: "like_new", type: "sell", price: 60_000, photo: "book-nihongo", campus: "Hồ Chí Minh",
    desc: "Giáo trình môn JPD113, gần như mới, chưa viết vào. Kèm file nghe mình chia sẻ qua Drive." },
  { title: "Bo Arduino Uno R3 cho môn IOT102 (demo)", category: "electronics", condition: "good", type: "sell", price: 320_000, photo: "photo-1553406830-ef2513450d76", campus: "Đà Nẵng",
    desc: "Bo Uno R3 đã nạp code test chạy tốt, đủ làm lab IOT102. Chỉ có bo và dây USB, không kèm linh kiện." },
  { title: "Giá đỡ laptop (demo)", category: "electronics", condition: "like_new", type: "sell", price: 150_000, photo: "photo-1652198145075-b41c363792d3", campus: "Cần Thơ",
    desc: "Nâng màn hình laptop ngang tầm mắt, ngồi học lâu đỡ mỏi cổ. Chắc chắn, không rung khi gõ." },
  { title: "Quạt bàn màu trắng (demo)", category: "dorm", condition: "good", type: "free", price: null, photo: "photo-1565151443833-29bf2ba5dd8d", campus: "Hà Nội",
    desc: "Quạt bàn cũ nhưng vẫn chạy êm, 3 số gió. Mình chuyển phòng có điều hòa nên cho lại." },
  { title: "Giáo trình MAE101 Toán cho kỹ thuật (demo)", category: "textbooks", condition: "good", type: "sell", price: 45_000, photo: "book-mae101", campus: "Quy Nhơn",
    desc: "Sách môn MAE101, có ghi chú bút chì ở phần ma trận và tích phân, tẩy được. Bìa hơi cong góc." },
  { title: "Balo đen đựng laptop (demo)", category: "other", condition: "like_new", type: "sell", price: 220_000, photo: "photo-1594299447935-e5b840f54b9b", campus: "Hồ Chí Minh",
    desc: "Balo đen trơn, có ngăn chống sốc vừa laptop 15,6 inch. Dùng một học kỳ, khóa kéo còn trơn." },
  { title: "Đèn bàn kim loại màu bạc (demo)", category: "dorm", condition: "like_new", type: "sell", price: 120_000, photo: "photo-1582356630861-61bb9b41f541", campus: "Hà Nội",
    desc: "Đèn bàn thân kim loại, chỉnh được góc chiếu. Học đêm đủ sáng, kèm bóng." },
  { title: "Sách Clean Code bản tiếng Anh (demo)", category: "textbooks", condition: "good", type: "exchange", price: null, photo: "book-cleancode", campus: "Hà Nội",
    desc: "Clean Code của Robert C. Martin, bản tiếng Anh. Đọc xong rồi, muốn đổi sang sách khác để đọc tiếp.", exchangeFor: "The Pragmatic Programmer hoặc sách về system design" },
  { title: "Ấm siêu tốc Philips màu đen (demo)", category: "dorm", condition: "good", type: "sell", price: 70_000, photo: "photo-1748408082799-94daff13e792", campus: "Đà Nẵng",
    desc: "Ấm Philips tự ngắt khi sôi. Pha mì, pha cà phê phòng ký túc. Đã tẩy cặn sạch." },
  { title: "Mũ bảo hiểm nửa đầu màu đỏ (demo)", category: "other", condition: "good", type: "sell", price: 120_000, photo: "photo-1494365024268-64e9ba68f321", campus: "Cần Thơ",
    desc: "Mũ nửa đầu màu đỏ, quai chắc, lót trong còn sạch. Mình đổi sang mũ fullface nên pass." },
];

export async function seedDemoListings(sql: postgres.Sql) {
  let [u] = await sql`select id from users where email = 'demo@pass2u.local'`;
  if (!u)
    [u] = await sql`
      insert into users (email, password_hash, display_name, campus, role, email_verified_at, verification_status, verified_at)
      values ('demo@pass2u.local', '!', 'PASS2U Demo', 'Hà Nội', 'student', now(), 'approved', now())
      returning id`;
  // Titles were renamed across versions; drop demo rows no longer in the list.
  const titles = ITEMS.map((it) => it.title);
  await sql`delete from listings where seller_id = ${u.id} and title <> all(${sql.array(titles)})`;
  let added = 0;
  for (let i = 0; i < ITEMS.length; i++) {
    const { title, category, condition, type, price, photo, campus, desc, exchangeFor } = ITEMS[i];
    const [l] = await sql`select id from listings where seller_id = ${u.id} and title = ${title}`;
    if (l) {
      // Keep cover and text in sync with this file.
      await sql`update listing_images set url = ${img(photo)} where listing_id = ${l.id} and position = 0`;
      await sql`
        update listings set description = ${desc + NOTE}, category = ${category}, condition = ${condition},
          type = ${type}, price = ${price}, exchange_for = ${exchangeFor ?? null}, campus = ${campus}
        where id = ${l.id}`;
      continue;
    }
    // Stagger creation times so "Vừa đăng" reads like a live feed.
    const [n] = await sql`
      insert into listings (seller_id, title, description, category, condition, type, price, exchange_for, campus, created_at)
      values (${u.id}, ${title}, ${desc + NOTE},
        ${category}, ${condition}, ${type}, ${price}, ${exchangeFor ?? null},
        ${campus}, now() - (${i} * interval '1 hour'))
      returning id`;
    await sql`insert into listing_images (listing_id, url, position) values (${n.id}, ${img(photo)}, 0)`;
    added++;
  }
  if (added) console.log(`[migrate] added ${added} demo listings`);
}
