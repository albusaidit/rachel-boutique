import {
  pgTable,
  text,
  integer,
  timestamp,
  jsonb,
  serial,
  boolean,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const products = pgTable(
  "products",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    nameAr: text("name_ar").notNull(),
    nameEn: text("name_en").notNull(),
    nameFr: text("name_fr"),
    descAr: text("desc_ar").notNull(),
    descEn: text("desc_en").notNull(),
    descFr: text("desc_fr"),
    price: integer("price").notNull(),
    compareAt: integer("compare_at"),
    currency: text("currency").notNull().default("MAD"),
    sizes: jsonb("sizes").$type<string[]>().notNull(),
    colors: jsonb("colors").$type<{ name: string; hex: string }[]>().notNull(),
    images: jsonb("images").$type<string[]>().notNull(),
    category: text("category").notNull(),
    subcategory: text("subcategory").notNull(),
    tags: jsonb("tags").$type<string[]>().notNull(),
    stock: integer("stock").notNull().default(0),
    displayOrder: integer("display_order").notNull().default(0),
    archivedAt: timestamp("archived_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    slugIdx: uniqueIndex("products_slug_idx").on(t.slug),
  }),
);

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  status: text("status").notNull().default("pending"),
  customerName: text("customer_name").notNull(),
  phone: text("phone").notNull(),
  city: text("city").notNull(),
  locale: text("locale").notNull().default("ar"),
  items: jsonb("items")
    .$type<
      Array<{
        productId: string;
        name: string;
        size: string;
        color: string;
        qty: number;
        unitPrice: number;
      }>
    >()
    .notNull(),
  subtotal: integer("subtotal").notNull(),
  currency: text("currency").notNull().default("MAD"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Setting = typeof settings.$inferSelect;

export const adminUsers = pgTable(
  "admin_users",
  {
    id: serial("id").primaryKey(),
    username: text("username").notNull(),
    name: text("name"),
    email: text("email"),
    passwordHash: text("password_hash").notNull(),
    role: text("role").notNull().default("admin"),
    active: boolean("active").notNull().default(true),
    lastLoginAt: timestamp("last_login_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    usernameIdx: uniqueIndex("admin_users_username_idx").on(t.username),
  }),
);

export type AdminUser = typeof adminUsers.$inferSelect;
export type NewAdminUser = typeof adminUsers.$inferInsert;
