import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, uuid, jsonb, integer, primaryKey, boolean, json, varchar } from "drizzle-orm/pg-core";

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
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
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

export const vibes = pgTable("vibes", {
  id: uuid("id").defaultRandom().primaryKey(),
  // CHANGED text to uuid
  creatorId: uuid("creator_id").references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  prompt: text("prompt").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  steps: json("steps"),
});

// 2. Comments Table
export const comments = pgTable("comments", {
  id: uuid("id").defaultRandom().primaryKey(),
  vibeId: uuid("vibe_id").references(() => vibes.id, { onDelete: "cascade" }),
  // CHANGED text to uuid
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// 3. Likes Table
export const likes = pgTable("likes", {
  // CHANGED text to uuid
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  vibeId: uuid("vibe_id").notNull().references(() => vibes.id, { onDelete: "cascade" }),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.vibeId] }),
}));

// 4. Subscriptions
export const subscriptions = pgTable("subscriptions", {
  // CHANGED text to uuid
  followerId: uuid("follower_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  followingId: uuid("following_id").notNull().references(() => users.id, { onDelete: "cascade" }),
}, (t) => ({
  pk: primaryKey({ columns: [t.followerId, t.followingId] }),
}));

export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(), // e.g., "Drizzle Schema", "Tailwind Config"
  content: text("content").notNull(), // The actual code or specs
  category: text("category").$type<"technical" | "branding" | "general">().default("technical"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const aiUsage = pgTable("ai_usage", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  provider: varchar("provider", { length: 50 }).notNull(), 
  model: varchar("model", { length: 100 }).notNull(),
  promptTokens: integer("prompt_tokens").default(0),
  completionTokens: integer("completion_tokens").default(0),
  totalTokens: integer("total_tokens").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const documentsRelations = relations(documents, ({ one }) => ({
  user: one(users, {
    fields: [documents.userId],
    references: [users.id],
  }),
}));


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


// 1. Update Users Relations (Add social connections)
export const usersRelations = relations(users, ({ many }) => ({
  inquiries: many(inquiries),
  transactions: many(transactions),
  vibes: many(vibes),
  comments: many(comments),
  likes: many(likes),
  followers: many(subscriptions, { relationName: "follower" }), 
  following: many(subscriptions, { relationName: "following" }),
  documents: many(documents),
  aiUsage: many(aiUsage),
}));

// 2. Vibes Relations
export const vibesRelations = relations(vibes, ({ one, many }) => ({
  author: one(users, {
    fields: [vibes.creatorId],
    references: [users.id],
  }),
  comments: many(comments),
  likes: many(likes),
}));

// 3. Comments Relations
export const commentsRelations = relations(comments, ({ one }) => ({
  vibe: one(vibes, {
    fields: [comments.vibeId],
    references: [vibes.id],
  }),
  author: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
}));

// 4. Likes Relations
export const likesRelations = relations(likes, ({ one }) => ({
  vibe: one(vibes, {
    fields: [likes.vibeId],
    references: [vibes.id],
  }),
  user: one(users, {
    fields: [likes.userId],
    references: [users.id],
  }),
}));

// 5. Subscriptions (Followers/Following) Relations
export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  follower: one(users, {
    fields: [subscriptions.followerId],
    references: [users.id],
    relationName: "follower",
  }),
  following: one(users, {
    fields: [subscriptions.followingId],
    references: [users.id],
    relationName: "following",
  }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
}));