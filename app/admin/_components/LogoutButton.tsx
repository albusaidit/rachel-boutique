"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAdminLocale } from "../_lib/i18n-admin";

export function LogoutButton() {
  const router = useRouter();
  const { d } = useAdminLocale();
  const [busy, setBusy] = useState(false);
  return (
    <button
      onClick={async () => {
        setBusy(true);
        await fetch("/api/admin/logout", { method: "POST" });
        router.replace("/admin/login");
        router.refresh();
      }}
      disabled={busy}
      className="w-full text-start px-3 py-2 rounded text-xs text-[var(--a-ink-muted)] hover:bg-[var(--a-line-soft)] hover:text-[var(--a-danger)] transition-colors disabled:opacity-50"
    >
      {busy ? d.nav.signing_out : d.nav.sign_out}
    </button>
  );
}
