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

// ID photos are deleted this many days after an admin approves or rejects them.
export const ID_RETENTION_DAYS = 30;

export const label = (list: readonly { value: string; label: string }[], v: string) =>
  list.find((x) => x.value === v)?.label ?? v;

export const formatPrice = (type: string, price: number | null) =>
  type === "free" ? "Miễn phí" : type === "exchange" && !price ? "Trao đổi" : `${(price ?? 0).toLocaleString("vi-VN")} ₫`;
