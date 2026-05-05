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
import { Modal } from "./Modal";

type Role = AdminUser["role"];
const ROLES: Role[] = ["owner", "admin", "viewer"];

type ActiveModal =
  | { kind: "none" }
  | { kind: "create" }
  | { kind: "password"; user: AdminUser }
  | { kind: "delete"; user: AdminUser };

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
  const [modal, setModal] = useState<ActiveModal>({ kind: "none" });
  const [pwInput, setPwInput] = useState("");

  const closeModal = () => {
    setModal({ kind: "none" });
    setPwInput("");
  };

  const roleLabel = (r: Role) =>
    r === "owner" ? d.team.role_owner : r === "admin" ? d.team.role_admin : d.team.role_viewer;

  const onCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!dbReady) return;
    const formData = new FormData(e.currentTarget);
    const formEl = e.currentTarget;
    start(async () => {
      try {
        await createAdminUserAction(formData);
        push(d.team.created_ok, "success");
        formEl.reset();
        closeModal();
      } catch (err) {
        push(err instanceof Error ? err.message : "Failed", "error");
      }
    });
  };

  const onConfirmDelete = (u: AdminUser) => {
    if (currentUserId === u.id) {
      push(d.team.cannot_delete_self, "error");
      return;
    }
    start(async () => {
      try {
        await deleteAdminUserAction(u.id);
        push(d.team.deleted_ok, "success");
        closeModal();
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

  const onSubmitPassword = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (modal.kind !== "password") return;
    const target = modal.user;
    if (!pwInput || pwInput.length < 6) {
      push("Password must be at least 6 characters", "error");
      return;
    }
    start(async () => {
      try {
        await updateAdminUserPasswordAction(target.id, pwInput);
        push(d.team.password_changed, "success");
        closeModal();
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
            onClick={() => setModal({ kind: "create" })}
            className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 text-base font-semibold rounded-md shadow hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span>{d.team.add_user}</span>
          </button>
        }
      />
      <div className="px-8 py-6 space-y-5">
        {!dbReady && <DemoBanner>{d.common.demo_banner}</DemoBanner>}

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
                            onClick={() => setModal({ kind: "password", user: u })}
                            disabled={pending}
                            className="px-3 py-1.5 text-xs font-medium border border-[var(--a-line)] text-[var(--a-ink-soft)] hover:text-[var(--a-ink)] hover:bg-[var(--a-line-soft)] rounded-sm transition-colors"
                          >
                            {d.team.change_password}
                          </button>
                          <button
                            type="button"
                            onClick={() => onToggleActive(u)}
                            disabled={pending}
                            className="px-3 py-1.5 text-xs font-medium border border-[var(--a-line)] text-[var(--a-ink-soft)] hover:text-[var(--a-ink)] hover:bg-[var(--a-line-soft)] rounded-sm transition-colors"
                          >
                            {u.active ? d.team.deactivate : d.team.activate}
                          </button>
                          <button
                            type="button"
                            onClick={() => setModal({ kind: "delete", user: u })}
                            disabled={pending || isSelf}
                            className="px-3 py-1.5 text-xs font-medium border border-[var(--a-danger-line)] text-[var(--a-danger)] hover:bg-[var(--a-danger-bg)] disabled:opacity-30 rounded-sm transition-colors"
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

      <Modal
        open={modal.kind === "create"}
        onClose={closeModal}
        title={d.team.add_user}
      >
        <form onSubmit={onCreate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field name="username" label={d.team.username} required autoFocus />
            <Field name="password" label={d.team.password} type="password" required />
            <Field name="name" label={d.team.name} />
            <Field name="email" label={d.team.email} type="email" />
            <label className="block md:col-span-2">
              <span className="text-[11px] tracking-[0.2em] uppercase text-[var(--a-ink-muted)] font-medium">
                {d.team.role}
              </span>
              <select
                name="role"
                defaultValue="admin"
                className="mt-1.5 w-full border border-[var(--a-line)] px-3 py-2 text-sm bg-[var(--a-surface)] focus:border-[var(--a-ink)] outline-none rounded-sm"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {roleLabel(r)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-[var(--a-line)]">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 text-sm font-medium border border-[var(--a-line)] text-[var(--a-ink-soft)] rounded-sm hover:bg-[var(--a-line-soft)]"
            >
              {d.common.cancel}
            </button>
            <button
              type="submit"
              disabled={pending}
              className="bg-emerald-600 text-white px-5 py-2 text-sm font-semibold rounded-sm hover:bg-emerald-700 disabled:opacity-40"
            >
              {pending ? "…" : d.team.add_user}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={modal.kind === "password"}
        onClose={closeModal}
        title={d.team.change_password}
        size="sm"
      >
        <form onSubmit={onSubmitPassword} className="space-y-4">
          {modal.kind === "password" && (
            <p className="text-sm text-[var(--a-ink-soft)]">
              {modal.user.username}
            </p>
          )}
          <label className="block">
            <span className="text-[11px] tracking-[0.2em] uppercase text-[var(--a-ink-muted)] font-medium">
              {d.team.new_password}
            </span>
            <input
              type="password"
              autoFocus
              value={pwInput}
              onChange={(e) => setPwInput(e.target.value)}
              className="mt-1.5 w-full border border-[var(--a-line)] px-3 py-2 text-sm bg-[var(--a-surface)] focus:border-[var(--a-ink)] outline-none rounded-sm"
            />
          </label>
          <div className="flex justify-end gap-2 pt-2 border-t border-[var(--a-line)]">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 text-sm font-medium border border-[var(--a-line)] text-[var(--a-ink-soft)] rounded-sm hover:bg-[var(--a-line-soft)]"
            >
              {d.common.cancel}
            </button>
            <button
              type="submit"
              disabled={pending}
              className="bg-emerald-600 text-white px-5 py-2 text-sm font-semibold rounded-sm hover:bg-emerald-700 disabled:opacity-40"
            >
              {pending ? "…" : d.common.confirm}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={modal.kind === "delete"}
        onClose={closeModal}
        title={d.team.delete}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--a-ink)]">
            {d.team.delete_confirm}
          </p>
          {modal.kind === "delete" && (
            <p className="text-sm text-[var(--a-ink-muted)] font-mono bg-[var(--a-line-soft)] px-3 py-2 rounded-sm">
              {modal.user.username}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-2 border-t border-[var(--a-line)]">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 text-sm font-medium border border-[var(--a-line)] text-[var(--a-ink-soft)] rounded-sm hover:bg-[var(--a-line-soft)]"
            >
              {d.common.cancel}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => modal.kind === "delete" && onConfirmDelete(modal.user)}
              className="bg-red-600 text-white px-5 py-2 text-sm font-semibold rounded-sm hover:bg-red-700 disabled:opacity-40"
            >
              {pending ? "…" : d.team.delete}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

function Field({
  name,
  label,
  type = "text",
  required = false,
  autoFocus = false,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  autoFocus?: boolean;
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
        autoFocus={autoFocus}
        autoComplete="off"
        className="mt-1.5 w-full border border-[var(--a-line)] px-3 py-2 text-sm bg-[var(--a-surface)] focus:border-[var(--a-ink)] outline-none rounded-sm"
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
