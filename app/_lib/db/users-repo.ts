import "server-only";
import { eq, asc, desc } from "drizzle-orm";
import { getDb, isDbConfigured, schema } from "./client";
import { hashPassword, verifyPassword } from "./password";

export type AdminUser = {
  id: number;
  username: string;
  name: string | null;
  email: string | null;
  role: "owner" | "admin" | "viewer";
  active: boolean;
  lastLoginAt: string | null;
  createdAt: string;
};

function rowToUser(r: typeof schema.adminUsers.$inferSelect): AdminUser {
  return {
    id: r.id,
    username: r.username,
    name: r.name,
    email: r.email,
    role: r.role as AdminUser["role"],
    active: r.active,
    lastLoginAt: r.lastLoginAt ? r.lastLoginAt.toISOString() : null,
    createdAt: r.createdAt.toISOString(),
  };
}

export async function listAdminUsers(): Promise<AdminUser[]> {
  if (!isDbConfigured()) return [];
  try {
    const rows = await getDb()
      .select()
      .from(schema.adminUsers)
      .orderBy(asc(schema.adminUsers.createdAt));
    return rows.map(rowToUser);
  } catch {
    return [];
  }
}

export async function findAdminUserByUsername(
  username: string,
): Promise<typeof schema.adminUsers.$inferSelect | null> {
  if (!isDbConfigured()) return null;
  const rows = await getDb()
    .select()
    .from(schema.adminUsers)
    .where(eq(schema.adminUsers.username, username))
    .limit(1);
  return rows[0] ?? null;
}

export async function findAdminUserById(
  id: number,
): Promise<AdminUser | null> {
  if (!isDbConfigured()) return null;
  const rows = await getDb()
    .select()
    .from(schema.adminUsers)
    .where(eq(schema.adminUsers.id, id))
    .limit(1);
  if (rows[0] && rows[0].active) return rowToUser(rows[0]);
  return null;
}

export async function countAdminUsers(): Promise<number> {
  if (!isDbConfigured()) return 0;
  try {
    const rows = await getDb()
      .select({ id: schema.adminUsers.id })
      .from(schema.adminUsers);
    return rows.length;
  } catch {
    return 0;
  }
}

export async function authenticate(
  username: string,
  password: string,
): Promise<AdminUser | null> {
  if (!isDbConfigured()) return null;
  const user = await findAdminUserByUsername(username);
  if (!user || !user.active) return null;
  if (!verifyPassword(password, user.passwordHash)) return null;
  // touch last_login_at
  await getDb()
    .update(schema.adminUsers)
    .set({ lastLoginAt: new Date() })
    .where(eq(schema.adminUsers.id, user.id));
  return rowToUser(user);
}

export async function createAdminUser(input: {
  username: string;
  password: string;
  name?: string;
  email?: string;
  role?: AdminUser["role"];
}): Promise<AdminUser> {
  if (!isDbConfigured()) throw new Error("Database not configured");
  const username = input.username.trim().toLowerCase();
  if (!/^[a-z0-9._-]{3,32}$/.test(username)) {
    throw new Error("Username must be 3–32 chars (a–z, 0–9, . _ -)");
  }
  const existing = await findAdminUserByUsername(username);
  if (existing) throw new Error("Username is already taken");
  const passwordHash = hashPassword(input.password);
  const [row] = await getDb()
    .insert(schema.adminUsers)
    .values({
      username,
      name: input.name?.trim() || null,
      email: input.email?.trim() || null,
      role: input.role ?? "admin",
      passwordHash,
      active: true,
    })
    .returning();
  return rowToUser(row);
}

export async function updateAdminUserPassword(
  userId: number,
  newPassword: string,
): Promise<void> {
  if (!isDbConfigured()) throw new Error("Database not configured");
  const passwordHash = hashPassword(newPassword);
  await getDb()
    .update(schema.adminUsers)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(schema.adminUsers.id, userId));
}

export async function setAdminUserActive(
  userId: number,
  active: boolean,
): Promise<void> {
  if (!isDbConfigured()) throw new Error("Database not configured");
  await getDb()
    .update(schema.adminUsers)
    .set({ active, updatedAt: new Date() })
    .where(eq(schema.adminUsers.id, userId));
}

export async function setAdminUserRole(
  userId: number,
  role: AdminUser["role"],
): Promise<void> {
  if (!isDbConfigured()) throw new Error("Database not configured");
  await getDb()
    .update(schema.adminUsers)
    .set({ role, updatedAt: new Date() })
    .where(eq(schema.adminUsers.id, userId));
}

export async function deleteAdminUser(userId: number): Promise<void> {
  if (!isDbConfigured()) throw new Error("Database not configured");
  await getDb()
    .delete(schema.adminUsers)
    .where(eq(schema.adminUsers.id, userId));
}

export async function ensureBootstrapUser(
  username: string,
  password: string,
): Promise<AdminUser | null> {
  if (!isDbConfigured()) return null;
  const count = await countAdminUsers();
  if (count > 0) return null;
  return createAdminUser({
    username,
    password,
    role: "owner",
    name: "Owner",
  });
}

export async function listLatestAdminUsers(limit = 5): Promise<AdminUser[]> {
  if (!isDbConfigured()) return [];
  try {
    const rows = await getDb()
      .select()
      .from(schema.adminUsers)
      .orderBy(desc(schema.adminUsers.createdAt))
      .limit(limit);
    return rows.map(rowToUser);
  } catch {
    return [];
  }
}
