export const CATEGORIES = [
  { value: "textbooks", label: "Textbooks & notes" },
  { value: "electronics", label: "Electronics" },
  { value: "dorm", label: "Dorm & household" },
  { value: "clothing", label: "Clothing & uniforms" },
  { value: "stationery", label: "Stationery" },
  { value: "sports", label: "Sports & hobbies" },
  { value: "vehicles", label: "Bikes & scooters" },
  { value: "other", label: "Other" },
] as const;

export const CONDITIONS = [
  { value: "new", label: "New" },
  { value: "like_new", label: "Like new" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
] as const;

export const TYPES = [
  { value: "sell", label: "For sale" },
  { value: "exchange", label: "Exchange" },
  { value: "free", label: "Free" },
] as const;

export const CAMPUSES = ["Hà Nội", "Hồ Chí Minh", "Đà Nẵng", "Cần Thơ", "Quy Nhơn"] as const;

// ID photos are deleted this many days after an admin approves or rejects them.
export const ID_RETENTION_DAYS = 30;

export const label = (list: readonly { value: string; label: string }[], v: string) =>
  list.find((x) => x.value === v)?.label ?? v;

export const formatPrice = (type: string, price: number | null) =>
  type === "free" ? "Free" : type === "exchange" && !price ? "Swap" : `${(price ?? 0).toLocaleString("vi-VN")} ₫`;
