import { sqliteTable, text } from "drizzle-orm/sqlite-core";
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
