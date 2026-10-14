// Demo listings so the market isn't empty before real students post.
// Owned by a demo account that can't sign in. Self-healing: each item is
// inserted when its title is missing, its cover photo is re-pointed when the
// mapping changes, and demo rows whose title was renamed are removed.
// Delete the demo user to remove them all.
import type postgres from "postgres";

// Every cover is drawn by scripts/draw-demo-items.mjs into public/demo, so it
// always shows the item the title names.
const img = (key: string) => `/demo/${key}.webp`;

const NOTE = "\n\nĐây là tin đăng mẫu để minh họa PASS2U, món này không thực sự được bán.";

type Item = {
  title: string; category: string; condition: string; type: "sell" | "exchange" | "free";
  price: number | null; photo: string; campus: string; desc: string; exchangeFor?: string;
};

// Newest first: the landing "Vừa đăng" strip shows the eight most recent.
const ITEMS: readonly Item[] = [
  { title: "Áo polo đồng phục FPT size M (demo)", category: "clothing", condition: "like_new", type: "sell", price: 90_000, photo: "fpt-polo", campus: "Hà Nội",
    desc: "Mua ở phòng dịch vụ sinh viên hồi kỳ 1, mặc khoảng chục buổi. Không phai màu, không xù vải. Mình lên size L nên pass lại." },
  { title: "Võ phục Vovinam size M kèm đai (demo)", category: "clothing", condition: "good", type: "sell", price: 150_000, photo: "vovinam", campus: "Hồ Chí Minh",
    desc: "Bộ võ phục xanh mặc học môn Vovinam (VOV114) kỳ trước, kèm đai xanh. Đã giặt sạch, đường may chắc. Hợp người cao 1m65 đến 1m72." },
  { title: "Giáo trình PRF192 Lập trình C (demo)", category: "textbooks", condition: "good", type: "sell", price: 40_000, photo: "book-prf192", campus: "Hà Nội",
    desc: "Giáo trình môn PRF192, có highlight vài chương con trỏ và mảng. Kèm mấy tờ note đề PE cũ mình tự chép." },
  { title: "Máy tính Casio fx-580VN X (demo)", category: "electronics", condition: "like_new", type: "sell", price: 380_000, photo: "casio", campus: "Đà Nẵng",
    desc: "Dùng cho MAE101 và MAS291, còn nguyên nắp trượt, phím bấm êm. Được mang vào phòng thi." },
  { title: "Bàn phím cơ Keychron K8 switch nâu (demo)", category: "electronics", condition: "good", type: "sell", price: 950_000, photo: "keyboard", campus: "Hồ Chí Minh",
    desc: "TKL, kết nối Bluetooth và dây, switch Gateron nâu gõ êm, không ồn phòng ký túc. Pin còn tốt, có kèm dây Type-C." },
  { title: "Áo khoác gió đồng phục FPT (demo)", category: "clothing", condition: "like_new", type: "exchange", price: null, photo: "fpt-jacket", campus: "Hà Nội",
    desc: "Áo khoác gió size L, mặc vài lần mùa đông năm nhất. Chống gió tốt, khóa kéo còn trơn.", exchangeFor: "Áo khoác đồng phục FPT size M" },
  { title: "Tai nghe Sony WH-1000XM4 (demo)", category: "electronics", condition: "good", type: "sell", price: 3_200_000, photo: "headphones", campus: "Hà Nội",
    desc: "Chống ồn tốt, học thư viện rất ổn. Pin khoảng 25 tiếng, đệm tai đã thay mới. Kèm hộp và dây sạc." },
  { title: "Nồi cơm điện mini 1,2 L (demo)", category: "dorm", condition: "good", type: "sell", price: 180_000, photo: "rice-cooker", campus: "Hồ Chí Minh",
    desc: "Đủ cho 2 người ăn, lòng nồi chống dính chưa tróc. Mình ra trường nên dọn đồ phòng trọ." },
  { title: "Đồng phục thể dục FPT size L (demo)", category: "clothing", condition: "good", type: "free", price: null, photo: "fpt-pe", campus: "Đà Nẵng",
    desc: "Bộ áo quần thể dục đã học xong môn, cho lại bạn nào cần. Qua campus lấy trực tiếp." },
  { title: "Màn hình Dell 24 inch Full HD (demo)", category: "electronics", condition: "good", type: "sell", price: 1_600_000, photo: "monitor", campus: "Hà Nội",
    desc: "Dell P2419H, tấm nền IPS, có HDMI và DisplayPort. Không điểm chết, chân xoay được dọc. Code đồ án đỡ mỏi mắt hơn hẳn." },
  { title: "Giáo trình tiếng Nhật JPD113 (demo)", category: "textbooks", condition: "like_new", type: "sell", price: 60_000, photo: "book-nihongo", campus: "Hồ Chí Minh",
    desc: "Giáo trình môn JPD113, gần như mới, chưa viết vào. Kèm file nghe mình chia sẻ qua Drive." },
  { title: "Bộ kit Arduino Uno R3 cho môn IOT102 (demo)", category: "electronics", condition: "good", type: "sell", price: 320_000, photo: "arduino", campus: "Đà Nẵng",
    desc: "Đủ bo Uno R3, breadboard, dây cắm, LED, cảm biến nhiệt độ và siêu âm. Đã test chạy được. Đủ làm lab và project IOT102." },
  { title: "Giá đỡ laptop nhôm gấp gọn (demo)", category: "electronics", condition: "like_new", type: "sell", price: 150_000, photo: "laptop-stand", campus: "Cần Thơ",
    desc: "Nhôm nguyên khối, chỉnh được 6 nấc, gấp lại bỏ vừa balo. Chịu được laptop 17 inch." },
  { title: "Quạt đứng KDK (demo)", category: "dorm", condition: "good", type: "free", price: null, photo: "fan", campus: "Hà Nội",
    desc: "Quạt chạy êm, 3 tốc độ, có hẹn giờ. Mình chuyển phòng có điều hòa nên cho lại." },
  { title: "Giáo trình MAE101 Toán cho kỹ thuật (demo)", category: "textbooks", condition: "good", type: "sell", price: 45_000, photo: "book-mae101", campus: "Quy Nhơn",
    desc: "Sách môn MAE101, có ghi chú bút chì ở phần ma trận và tích phân, tẩy được. Bìa hơi cong góc." },
  { title: "Balo laptop 15,6 inch chống nước (demo)", category: "other", condition: "like_new", type: "sell", price: 220_000, photo: "backpack", campus: "Hồ Chí Minh",
    desc: "Ngăn laptop có đệm, vừa máy 15,6 inch. Vải chống nước, đi mưa không thấm. Dùng một học kỳ." },
  { title: "Đèn bàn LED chống cận (demo)", category: "dorm", condition: "like_new", type: "sell", price: 120_000, photo: "lamp", campus: "Hà Nội",
    desc: "3 chế độ màu ánh sáng, chỉnh độ sáng cảm ứng, cắm USB. Học đêm không chói mắt." },
  { title: "Sách Clean Code bản tiếng Anh (demo)", category: "textbooks", condition: "good", type: "exchange", price: null, photo: "book-cleancode", campus: "Hà Nội",
    desc: "Clean Code của Robert C. Martin, bản tiếng Anh. Đọc xong rồi, muốn đổi sang sách khác để đọc tiếp.", exchangeFor: "The Pragmatic Programmer hoặc sách về system design" },
  { title: "Ấm siêu tốc 1,8 L (demo)", category: "dorm", condition: "good", type: "sell", price: 70_000, photo: "kettle", campus: "Đà Nẵng",
    desc: "Inox, tự ngắt khi sôi. Pha mì, pha cà phê phòng ký túc. Đã tẩy cặn sạch." },
  { title: "Mũ bảo hiểm 3/4 size L (demo)", category: "other", condition: "good", type: "sell", price: 120_000, photo: "helmet", campus: "Cần Thơ",
    desc: "Mũ 3/4 có kính, quai chắc, lót trong tháo giặt được. Mình đổi sang mũ fullface." },
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
