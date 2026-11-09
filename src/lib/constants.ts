export const CATEGORIES = [
  { value: "textbooks", label: "Sách giáo khoa & tài liệu" },
  { value: "electronics", label: "Đồ điện tử" },
  { value: "dorm", label: "Đồ ký túc xá & sinh hoạt" },
  { value: "clothing", label: "Quần áo & đồng phục" },
  { value: "stationery", label: "Văn phòng phẩm" },
  { value: "other", label: "Khác" },
] as const;

export const CONDITIONS = [
  { value: "new", label: "Mới" },
  { value: "like_new", label: "Như mới" },
  { value: "good", label: "Còn tốt" },
  { value: "fair", label: "Tạm được" },
] as const;

export const TYPES = [
  { value: "sell", label: "Cần bán" },
  { value: "exchange", label: "Trao đổi" },
  { value: "free", label: "Miễn phí" },
] as const;

export const CAMPUSES = ["Hà Nội", "Hồ Chí Minh", "Đà Nẵng", "Cần Thơ", "Quy Nhơn"] as const;

// FPT enrolment cohorts ("K" + last two digits of intake year) and the main
// faculties. Optional at sign-up; they help admins place a student inside the
// school. Generated from the current year so new intakes appear automatically
// (K16–K27 in 2026, K17–K28 in 2027…): ten cohorts back, plus the next intake.
export const COHORTS = Array.from(
  { length: 12 },
  (_, i) => `K${new Date().getFullYear() - 2010 + i}`,
);

export const MAJORS = [
  "Công nghệ thông tin",
  "Quản trị kinh doanh",
  "Quản trị khách sạn – lữ hành",
  "Ngôn ngữ Anh",
  "Kiến trúc – Mỹ thuật",
  "Kỹ thuật điện – điện tử",
] as const;

// ID photos are deleted this many days after an admin approves or rejects them.
export const ID_RETENTION_DAYS = 30;

export const label = (list: readonly { value: string; label: string }[], v: string) =>
  list.find((x) => x.value === v)?.label ?? v;

export const formatPrice = (type: string, price: number | null) =>
  type === "free" ? "Miễn phí" : type === "exchange" && !price ? "Trao đổi" : `${(price ?? 0).toLocaleString("vi-VN")} ₫`;
