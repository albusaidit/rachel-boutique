"use client";

import { useState, useTransition } from "react";
import type { AdminUser } from "@/app/_lib/db/users-repo";
import {
  createAdminUserAction,
  deleteAdminUserAction,
  setAdminUserActiveAction,
  setAdminUserRoleAction,
  updateAdminUserPasswordAction,
} from "@/app/_lib/db/users-actions";
import { useAdminLocale } from "../_lib/i18n-admin";
import { useAdminToast } from "./AdminToast";
import { DemoBanner, PageHeader } from "./PageHeader";

type Role = AdminUser["role"];
const ROLES: Role[] = ["owner", "admin", "viewer"];

export function TeamManager({
  users,
  dbReady,
  currentUserId,
}: {
  users: AdminUser[];
  dbReady: boolean;
  currentUserId: number | null;
}) {
  const { d } = useAdminLocale();
  const { push } = useAdminToast();
  const [pending, start] = useTransition();
  const [showCreate, setShowCreate] = useState(false);

  const roleLabel = (r: Role) =>
    r === "owner" ? d.team.role_owner : r === "admin" ? d.team.role_admin : d.team.role_viewer;

  const onCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!dbReady) return;
    const formData = new FormData(e.currentTarget);
    start(async () => {
      try {
        await createAdminUserAction(formData);
        push(d.team.created_ok, "success");
        (e.target as HTMLFormElement).reset();
        setShowCreate(false);
      } catch (err) {
        push(err instanceof Error ? err.message : "Failed", "error");
      }
    });
  };

  const onDelete = (u: AdminUser) => {
    if (currentUserId === u.id) {
      push(d.team.cannot_delete_self, "error");
      return;
    }
    if (!confirm(d.team.delete_confirm)) return;
    start(async () => {
      try {
        await deleteAdminUserAction(u.id);
        push(d.team.deleted_ok, "success");
      } catch (err) {
        push(err instanceof Error ? err.message : "Failed", "error");
      }
    });
  };

  const onToggleActive = (u: AdminUser) => {
    if (u.active && currentUserId === u.id) {
      push(d.team.cannot_deactivate_self, "error");
      return;
    }
    start(async () => {
      try {
        await setAdminUserActiveAction(u.id, !u.active);
        push(d.team.status_changed, "success");
      } catch (err) {
        push(err instanceof Error ? err.message : "Failed", "error");
      }
    });
  };

  const onChangeRole = (u: AdminUser, role: Role) => {
    if (role === u.role) return;
    start(async () => {
      try {
        await setAdminUserRoleAction(u.id, role);
        push(d.team.status_changed, "success");
      } catch (err) {
        push(err instanceof Error ? err.message : "Failed", "error");
      }
    });
  };

  const onChangePassword = (u: AdminUser) => {
    const next = window.prompt(d.team.new_password);
    if (!next) return;
    start(async () => {
      try {
        await updateAdminUserPasswordAction(u.id, next);
        push(d.team.password_changed, "success");
      } catch (err) {
        push(err instanceof Error ? err.message : "Failed", "error");
      }
    });
  };

  return (
    <>
      <PageHeader
        title={d.team.title}
        subtitle={d.team.subtitle}
        actions={
          <button
            type="button"
            disabled={!dbReady || pending}
            onClick={() => setShowCreate((s) => !s)}
            aria-expanded={showCreate}
            className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 text-base font-semibold rounded-md shadow hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              aria-hidden
            >
              {showCreate ? (
                <path d="M18 6 6 18M6 6l12 12" />
              ) : (
                <path d="M12 5v14M5 12h14" />
              )}
            </svg>
            <span>{showCreate ? d.common.cancel : d.team.add_user}</span>
          </button>
        }
      />
      <div className="px-8 py-6 space-y-5">
        {!dbReady && <DemoBanner>{d.common.demo_banner}</DemoBanner>}

        {showCreate && dbReady && (
          <form
            onSubmit={onCreate}
            className="bg-[var(--a-surface)] border border-[var(--a-line)] p-5 grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <Field name="username" label={d.team.username} required />
            <Field name="password" label={d.team.password} type="password" required />
            <Field name="name" label={d.team.name} />
            <Field name="email" label={d.team.email} type="email" />
            <label className="block">
              <span className="text-[11px] tracking-[0.2em] uppercase text-[var(--a-ink-muted)] font-medium">
                {d.team.role}
              </span>
              <select
                name="role"
                defaultValue="admin"
                className="mt-1.5 w-full border border-[var(--a-line)] px-3 py-2 text-sm bg-[var(--a-surface)] focus:border-[var(--a-ink)] outline-none"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {roleLabel(r)}
                  </option>
                ))}
              </select>
            </label>
            <div className="md:col-span-2 flex justify-end gap-2 pt-2 border-t border-[var(--a-line)]">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 text-xs tracking-[0.2em] uppercase border border-[var(--a-line)] text-[var(--a-ink-muted)]"
              >
                {d.common.cancel}
              </button>
              <button
                type="submit"
                disabled={pending}
                className="bg-[var(--a-accent)] text-[var(--a-accent-fg)] px-5 py-2 text-xs tracking-[0.2em] uppercase font-medium disabled:opacity-40"
              >
                {pending ? "…" : d.team.add_user}
              </button>
            </div>
          </form>
        )}

        <section className="bg-[var(--a-surface)] border border-[var(--a-line)] overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-[var(--a-line)]">
              <tr className="text-[10px] tracking-[0.2em] uppercase text-[var(--a-ink-muted)] font-medium">
                <th className="text-start px-5 py-3">{d.team.username}</th>
                <th className="text-start px-5 py-3">{d.team.name}</th>
                <th className="text-start px-5 py-3">{d.team.role}</th>
                <th className="text-start px-5 py-3">{d.team.status}</th>
                <th className="text-start px-5 py-3">{d.team.last_login}</th>
                <th className="text-start px-5 py-3">{d.team.created}</th>
                <th className="text-end px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-10 text-center text-[var(--a-ink-muted)] text-sm"
                  >
                    {d.team.empty}
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isSelf = currentUserId === u.id;
                  return (
                    <tr key={u.id} className="border-t border-[var(--a-line)]">
                      <td className="px-5 py-3 font-medium">
                        {u.username}
                        {isSelf && (
                          <span className="ms-2 text-[10px] tracking-[0.2em] uppercase text-[var(--a-ink-faint)]">
                            (you)
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-[var(--a-ink-soft)]">
                        {u.name || "—"}
                        {u.email && (
                          <div className="text-xs text-[var(--a-ink-faint)]">{u.email}</div>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <select
                          value={u.role}
                          disabled={pending}
                          onChange={(e) => onChangeRole(u, e.target.value as Role)}
                          className="border border-[var(--a-line)] px-2 py-1 text-xs bg-[var(--a-surface)]"
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>
                              {roleLabel(r)}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 text-[10px] tracking-[0.2em] uppercase ${
                            u.active
                              ? "bg-[var(--a-success-bg)] text-[var(--a-success)]"
                              : "bg-[var(--a-line-soft)] text-[var(--a-ink-muted)]"
                          }`}
                        >
                          {u.active ? d.team.active : d.team.inactive}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-[var(--a-ink-soft)] text-xs">
                        {u.lastLoginAt ? formatDate(u.lastLoginAt) : d.team.never}
                      </td>
                      <td className="px-5 py-3 text-[var(--a-ink-soft)] text-xs">
                        {formatDate(u.createdAt)}
                      </td>
                      <td className="px-5 py-3 text-end whitespace-nowrap">
                        <div className="inline-flex gap-1">
                          <button
                            type="button"
                            onClick={() => onChangePassword(u)}
                            disabled={pending}
                            className="px-2 py-1 text-[10px] tracking-[0.2em] uppercase border border-[var(--a-line)] text-[var(--a-ink-muted)] hover:text-[var(--a-ink)]"
                          >
                            {d.team.change_password}
                          </button>
                          <button
                            type="button"
                            onClick={() => onToggleActive(u)}
                            disabled={pending}
                            className="px-2 py-1 text-[10px] tracking-[0.2em] uppercase border border-[var(--a-line)] text-[var(--a-ink-muted)] hover:text-[var(--a-ink)]"
                          >
                            {u.active ? d.team.deactivate : d.team.activate}
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(u)}
                            disabled={pending || isSelf}
                            className="px-2 py-1 text-[10px] tracking-[0.2em] uppercase border border-[var(--a-danger-line)] text-[var(--a-danger)] hover:bg-[var(--a-danger-bg)] disabled:opacity-30"
                          >
                            {d.team.delete}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </section>
      </div>
    </>
  );
}

function Field({
  name,
  label,
  type = "text",
  required = false,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[11px] tracking-[0.2em] uppercase text-[var(--a-ink-muted)] font-medium">
        {label}
        {required && <span className="text-[var(--a-danger)] ms-1">*</span>}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        autoComplete="off"
        className="mt-1.5 w-full border border-[var(--a-line)] px-3 py-2 text-sm bg-[var(--a-surface)] focus:border-[var(--a-ink)] outline-none"
      />
    </label>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return "—";
  }
}
