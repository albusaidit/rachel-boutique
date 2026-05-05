"use server";

import { revalidatePath } from "next/cache";
import { isDbConfigured } from "./client";
import {
  createAdminUser,
  deleteAdminUser,
  setAdminUserActive,
  setAdminUserRole,
  updateAdminUserPassword,
  type AdminUser,
} from "./users-repo";
import { getCurrentUserId, isAuthed } from "@/app/admin/_lib/auth";

async function ensureAuth() {
  if (!(await isAuthed())) throw new Error("unauthorized");
  if (!isDbConfigured()) throw new Error("Database not configured");
}

function str(formData: FormData, key: string): string {
  return formData.get(key)?.toString().trim() ?? "";
}

function isRole(v: string): v is AdminUser["role"] {
  return v === "owner" || v === "admin" || v === "viewer";
}

export async function createAdminUserAction(formData: FormData) {
  await ensureAuth();
  const username = str(formData, "username");
  const password = str(formData, "password");
  const name = str(formData, "name");
  const email = str(formData, "email");
  const roleRaw = str(formData, "role") || "admin";
  const role = isRole(roleRaw) ? roleRaw : "admin";
  await createAdminUser({
    username,
    password,
    name: name || undefined,
    email: email || undefined,
    role,
  });
  revalidatePath("/admin/team");
  revalidatePath("/admin");
}

export async function deleteAdminUserAction(userId: number) {
  await ensureAuth();
  const currentId = await getCurrentUserId();
  if (currentId && Number(currentId) === userId) {
    throw new Error("cannot_delete_self");
  }
  await deleteAdminUser(userId);
  revalidatePath("/admin/team");
}

export async function setAdminUserActiveAction(userId: number, active: boolean) {
  await ensureAuth();
  const currentId = await getCurrentUserId();
  if (!active && currentId && Number(currentId) === userId) {
    throw new Error("cannot_deactivate_self");
  }
  await setAdminUserActive(userId, active);
  revalidatePath("/admin/team");
}

export async function setAdminUserRoleAction(userId: number, role: string) {
  await ensureAuth();
  if (!isRole(role)) throw new Error("invalid_role");
  await setAdminUserRole(userId, role);
  revalidatePath("/admin/team");
}

export async function updateAdminUserPasswordAction(
  userId: number,
  newPassword: string,
) {
  await ensureAuth();
  await updateAdminUserPassword(userId, newPassword);
  revalidatePath("/admin/team");
}
