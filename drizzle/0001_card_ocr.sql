ALTER TABLE "id_documents" ADD COLUMN "ocr_code" text;--> statement-breakpoint
ALTER TABLE "id_documents" ADD COLUMN "ocr_name_match" boolean;--> statement-breakpoint
ALTER TABLE "id_documents" ADD COLUMN "ocr_looks_fpt" boolean;--> statement-breakpoint
ALTER TABLE "id_documents" ADD COLUMN "ocr_text" text;