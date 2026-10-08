import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  pgEnum,
  customType,
  uniqueIndex,
  index,
  boolean,
} from "drizzle-orm/pg-core";

const bytea = customType<{ data: Buffer }>({ dataType: () => "bytea" });

export const roleEnum = pgEnum("role", ["student", "admin"]);
export const verificationEnum = pgEnum("verification_status", ["none", "pending", "approved", "rejected"]);
export const listingTypeEnum = pgEnum("listing_type", ["sell", "exchange", "free"]);
export const conditionEnum = pgEnum("item_condition", ["new", "like_new", "good", "fair"]);
export const listingStatusEnum = pgEnum("listing_status", ["available", "reserved", "completed", "removed"]);
export const reservationStatusEnum = pgEnum("reservation_status", ["requested", "accepted", "completed", "cancelled", "declined"]);
export const reportStatusEnum = pgEnum("report_status", ["open", "resolved", "dismissed"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name").notNull(),
  studentCode: text("student_code"),
  campus: text("campus"),
  bio: text("bio"),
  role: roleEnum("role").notNull().default("student"),
  emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
  verificationStatus: verificationEnum("verification_status").notNull().default("none"),
  rejectionReason: text("rejection_reason"),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  bannedAt: timestamp("banned_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const emailTokens = pgTable("email_tokens", {
  tokenHash: text("token_hash").primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

// Student ID card photos. Kept out of public storage on purpose: only
// readable through the admin-only route, and purged after review.
export const idDocuments = pgTable("id_documents", {
  userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  image: bytea("image").notNull(),
  mime: text("mime").notNull(),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow(),
  deleteAfter: timestamp("delete_after", { withTimezone: true }),
  // Server-side read of the card, shown to admins as checks. Null = unreadable.
  ocrCode: text("ocr_code"),
  ocrNameMatch: boolean("ocr_name_match"),
  ocrLooksFpt: boolean("ocr_looks_fpt"),
  ocrText: text("ocr_text"),
});

export const listings = pgTable(
  "listings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sellerId: uuid("seller_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull(),
    category: text("category").notNull(),
    condition: conditionEnum("condition").notNull(),
    type: listingTypeEnum("type").notNull(),
    price: integer("price"),
    exchangeFor: text("exchange_for"),
    campus: text("campus"),
    status: listingStatusEnum("status").notNull().default("available"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("listings_status_created_idx").on(t.status, t.createdAt), index("listings_seller_idx").on(t.sellerId)],
);

export const listingImages = pgTable("listing_images", {
  id: uuid("id").primaryKey().defaultRandom(),
  listingId: uuid("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  position: integer("position").notNull().default(0),
});

export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    listingId: uuid("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
    buyerId: uuid("buyer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    sellerId: uuid("seller_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true }).notNull().defaultNow(),
    buyerReadAt: timestamp("buyer_read_at", { withTimezone: true }),
    sellerReadAt: timestamp("seller_read_at", { withTimezone: true }),
  },
  (t) => [uniqueIndex("conversations_listing_buyer_idx").on(t.listingId, t.buyerId)],
);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
    senderId: uuid("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    // "event" rows are reservation updates, shown as a centered status line.
    kind: text("kind").notNull().default("text"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("messages_conversation_idx").on(t.conversationId, t.createdAt)],
);

export const reservations = pgTable("reservations", {
  id: uuid("id").primaryKey().defaultRandom(),
  listingId: uuid("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  buyerId: uuid("buyer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sellerId: uuid("seller_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: reservationStatusEnum("status").notNull().default("requested"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const reports = pgTable("reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  listingId: uuid("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  reporterId: uuid("reporter_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  reason: text("reason").notNull(),
  status: reportStatusEnum("status").notNull().default("open"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type Listing = typeof listings.$inferSelect;
