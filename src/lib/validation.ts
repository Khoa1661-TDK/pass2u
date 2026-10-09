import { z } from "zod";
import { CAMPUSES } from "@/lib/constants";

// Shared by sign-up and re-verification so both validate the student ID the same way.
export const studentFieldsSchema = z.object({
  studentCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{2}\d{5,7}$/, "Mã sinh viên có dạng SE190123: hai chữ cái, sau đó là chữ số."),
  campus: z.enum(CAMPUSES, { message: "Chọn cơ sở của bạn." }),
});
