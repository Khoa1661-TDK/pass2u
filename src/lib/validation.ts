import { z } from "zod";
import { CAMPUSES, COHORTS, MAJORS } from "@/lib/constants";

// Shared by sign-up and re-verification so both validate the student ID the same way.
export const studentFieldsSchema = z.object({
  studentCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{2}\d{5,7}$/, "Mã sinh viên có dạng SE190123: hai chữ cái, sau đó là chữ số."),
  campus: z.enum(CAMPUSES, { message: "Chọn cơ sở của bạn." }),
});

// Identity details collected at sign-up so admins can locate a student if a
// transaction goes wrong. Phone, national ID, birth date and residence are
// required; cohort and major are optional helpers.
export const identityFieldsSchema = z.object({
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s.-]/g, ""))
    .transform((v) => (v.startsWith("+84") ? `0${v.slice(3)}` : v.startsWith("84") ? `0${v.slice(2)}` : v))
    .refine((v) => /^0\d{9}$/.test(v), "Số điện thoại phải có 10 chữ số, ví dụ 0912345678."),
  cccd: z
    .string()
    .trim()
    .transform((v) => v.replace(/\s/g, ""))
    .refine((v) => /^\d{12}$/.test(v), "Số căn cước công dân phải có 12 chữ số."),
  birthDate: z
    .string()
    .trim()
    .refine((v) => /^\d{4}-\d{2}-\d{2}$/.test(v), "Ngày sinh phải có dạng YYYY-MM-DD.")
    .refine((v) => {
      const d = new Date(`${v}T00:00:00Z`);
      if (Number.isNaN(d.getTime())) return false;
      const age = (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
      return age >= 15 && age <= 60;
    }, "Ngày sinh không hợp lệ."),
  residence: z
    .string()
    .trim()
    .min(5, "Nhập nơi bạn đang ở (KTX, lớp, hoặc địa chỉ).")
    .max(120),
  cohort: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : null))
    .refine((v) => v === null || (COHORTS as readonly string[]).includes(v), "Khóa không hợp lệ."),
  major: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : null))
    .refine((v) => v === null || (MAJORS as readonly string[]).includes(v), "Ngành học không hợp lệ."),
});
