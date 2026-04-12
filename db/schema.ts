import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, uuid, jsonb, integer } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name"),
  email: text("email").unique().notNull(),
  password: text("password").notNull(), // Hashed with Bcrypt
role: text("role").$type<"user" | "admin">().default("user"),
image: text("image"),
credits: integer("credits").default(5), // Initial free credits
lastMerchantTransactionId: text("last_merchant_transaction_id"),
  plan: text("plan").$type<"free" | "builder" | "agency">().default("free"),
  phonepeCustomerId: text("phonepe_customer_id"), // Useful for linking payments
  phone: text("phone"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const inquiries = pgTable("inquiries", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  inquiryId: uuid("inquiry_id").references(() => inquiries.id, { onDelete: "cascade" }), 
  versionName: text("version_name").notNull(),
  // Storing the 7 steps: { objective, procedures[], prompt }
  steps: jsonb("steps").notNull(), 
  version: integer("version").default(1),
  emergentContent: text("emergent_content"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const transactions = pgTable("transactions", {
 id: uuid("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: uuid("user_id").references(() => users.id),
  amount: integer("amount").notNull(), // Amount in Paise
  creditsAdded: integer("credits_added").notNull(),
  status: text("status").$type<"PENDING" | "COMPLETED" | "FAILED">().default("PENDING"),
  createdAt: timestamp("created_at").defaultNow(),
});




export const inquiriesRelations = relations(inquiries, ({ one, many }) => ({
  user: one(users, {
    fields: [inquiries.userId],
    references: [users.id],
  }),
  tasks: many(tasks),
}));

// 2. Define Relations for Tasks (Milestones)
export const tasksRelations = relations(tasks, ({ one }) => ({
  inquiry: one(inquiries, {
    fields: [tasks.inquiryId],
    references: [inquiries.id],
  }),
}));

// 3. Define Relations for Users
export const usersRelations = relations(users, ({ many }) => ({
  inquiries: many(inquiries),
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
}));