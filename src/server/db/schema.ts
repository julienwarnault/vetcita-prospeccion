import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
export const visits = sqliteTable("visits", {
  id: text("id").primaryKey(),
  data: text("data").notNull(),
  updatedAt: text("updated_at").notNull(),
  author: text("author").notNull(),
});
export const customClinics = sqliteTable("custom_clinics", {
  id: text("id").primaryKey(),
  data: text("data").notNull(),
  createdAt: text("created_at").notNull(),
  author: text("author").notNull(),
});

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  states: text("states"),
});
export const sessions = sqliteTable("sessions", {
  tokenHash: text("token_hash").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: text("expires_at").notNull(),
});
export const loginAttempts = sqliteTable("login_attempts", {
  key: text("key").primaryKey(),
  count: integer("count").notNull(),
  expiresAt: text("expires_at").notNull(),
});
