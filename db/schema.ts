import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, uuid, jsonb, integer } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name"),
  email: text("email").unique().notNull(),
  password: text("password").notNull(), // Hashed with Bcrypt
role: text("role").$type<"user" | "admin">().default("user"),
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
  inquiryId: uuid("inquiry_id").references(() => inquiries.id),
  versionName: text("version_name").notNull(),
  // Storing the 7 steps: { objective, procedures[], prompt }
  steps: jsonb("steps").notNull(), 
  version: integer("version").default(1),
  emergentContent: text("emergent_content"),
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
}));