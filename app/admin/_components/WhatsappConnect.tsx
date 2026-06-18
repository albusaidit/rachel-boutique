"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  saveWhatsappConfigAction,
  sendWhatsappTestAction,
  type WhatsappStatus,
} from "@/app/_lib/db/whatsapp-actions";
import { useAdminToast } from "./AdminToast";

export function WhatsappConnect({
  status,
  dbReady,
}: {
  status: WhatsappStatus;
  dbReady: boolean;
}) {
  const { push } = useAdminToast();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [testing, setTesting] = useState(false);

  const [token, setToken] = useState("");
  const [phoneId, setPhoneId] = useState(status.phoneNumberId);
  const [verify, setVerify] = useState(status.verifyToken);
  const [secret, setSecret] = useState("");
  const [testPhone, setTestPhone] = useState("");

  // Meta calls this from the internet, so it must be the production URL.
  const webhookUrl = "https://rachele.store/api/whatsapp/webhook";

  const save = () => {
    if (!dbReady) return;
    start(async () => {
      const res = await saveWhatsappConfigAction({
        token,
        phoneNumberId: phoneId,
        verifyToken: verify,
        appSecret: secret,
      });
      if (res.ok) {
        push(res.saved > 0 ? "WhatsApp settings saved" : "Nothing to save", "success");
        setToken("");
        setSecret("");
        router.refresh();
      } else {
        push(res.error, "error");
      }
    });
  };

  const sendTest = async () => {
    setTesting(true);
    try {
      const res = await sendWhatsappTestAction(testPhone);
      if (res.ok) push("Test message sent — check WhatsApp", "success");
      else push(`Test failed: ${res.error}`, "error");
    } finally {
      setTesting(false);
    }
  };

  const copy = (text: string) => {
    navigator.clipboard?.writeText(text).then(
      () => push("Copied", "success"),
      () => push("Copy failed", "error"),
    );
  };

  return (
    <section className="bg-[var(--a-surface)] border border-[var(--a-line)]">
      <div className="px-5 py-3 border-b border-[var(--a-line)] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 32 32" fill="#25D366" aria-hidden>
            <path d="M16 2C8.3 2 2 8.3 2 16c0 2.5.7 4.9 1.9 7L2 30l7.2-1.9c2 1.1 4.4 1.8 6.8 1.8 7.7 0 14-6.3 14-14S23.7 2 16 2z" />
          </svg>
          <h2 className="text-sm font-semibold tracking-wide">WhatsApp connection</h2>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase font-medium px-2.5 py-1 rounded-sm ${
            status.configured
              ? "bg-[var(--a-success-bg)] text-[var(--a-success)]"
              : "bg-[var(--a-warning-bg)] text-[var(--a-warning)]"
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${status.configured ? "bg-[var(--a-success)]" : "bg-[var(--a-warning)]"}`} />
          {status.configured ? "Connected" : "Not configured"}
        </span>
      </div>

      <div className="p-5 space-y-5">
        <p className="text-xs text-[var(--a-ink-muted)] leading-relaxed">
          Get these from{" "}
          <a href="https://developers.facebook.com/apps/" target="_blank" rel="noreferrer" className="text-[var(--a-accent)] hover:underline">
            Meta for Developers
          </a>{" "}
          → your app → WhatsApp → API Setup. Order notifications and replies use this connection.
        </p>

        {/* Credentials */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CredField
            label="Access token"
            type="password"
            value={token}
            onChange={setToken}
            placeholder={status.hasToken ? "•••••••• saved — leave blank to keep" : "Paste token"}
            editable={dbReady}
            mono
          />
          <CredField
            label="Phone number ID"
            value={phoneId}
            onChange={setPhoneId}
            placeholder="e.g. 123456789012345"
            editable={dbReady}
            mono
          />
          <CredField
            label="Verify token (you choose this)"
            value={verify}
            onChange={setVerify}
            placeholder="any secret string"
            editable={dbReady}
            mono
          />
          <CredField
            label="App secret"
            type="password"
            value={secret}
            onChange={setSecret}
            placeholder={status.hasAppSecret ? "•••••••• saved — leave blank to keep" : "Paste app secret"}
            editable={dbReady}
            mono
          />
        </div>
        <button
          type="button"
          onClick={save}
          disabled={!dbReady || pending}
          className="bg-[var(--a-accent)] text-[var(--a-accent-fg)] px-5 py-2 text-xs tracking-[0.2em] uppercase font-medium rounded-sm disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {pending ? "Saving…" : "Save credentials"}
        </button>

        {/* Webhook setup */}
        <div className="border-t border-[var(--a-line)] pt-5 space-y-3">
          <div className="text-[11px] tracking-[0.2em] uppercase text-[var(--a-ink-muted)] font-medium">
            Webhook (paste into Meta → WhatsApp → Configuration)
          </div>
          <CopyRow label="Callback URL" value={webhookUrl} onCopy={copy} />
          <CopyRow
            label="Verify token"
            value={verify || status.verifyToken || "— set it above first —"}
            onCopy={copy}
          />
          <p className="text-[11px] text-[var(--a-ink-muted)]">
            After saving, set these in Meta and subscribe to the <span className="font-mono">messages</span> field.
          </p>
        </div>

        {/* Test */}
        <div className="border-t border-[var(--a-line)] pt-5">
          <div className="text-[11px] tracking-[0.2em] uppercase text-[var(--a-ink-muted)] font-medium mb-2">
            Send a test message
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              placeholder="Your WhatsApp number, e.g. 2126…"
              dir="ltr"
              inputMode="tel"
              disabled={!dbReady}
              className="flex-1 min-w-[200px] border border-[var(--a-line)] px-3 py-2 text-sm bg-[var(--a-surface)] focus:border-[var(--a-ink)] outline-none rounded-sm font-mono"
            />
            <button
              type="button"
              onClick={sendTest}
              disabled={!dbReady || testing || !status.configured}
              title={!status.configured ? "Save credentials first" : undefined}
              className="px-4 py-2 text-xs tracking-[0.2em] uppercase font-medium border border-[var(--a-line)] rounded-sm hover:bg-[var(--a-line-soft)] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {testing ? "Sending…" : "Send test"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function CredField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  editable,
  mono,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: "text" | "password";
  editable: boolean;
  mono?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[11px] tracking-[0.2em] uppercase text-[var(--a-ink-muted)] font-medium">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={!editable}
        autoComplete="off"
        dir="ltr"
        className={`mt-1.5 w-full border border-[var(--a-line)] px-3 py-2 text-sm bg-[var(--a-surface)] focus:border-[var(--a-ink)] outline-none rounded-sm disabled:bg-[var(--a-line-soft)]/40 ${mono ? "font-mono" : ""}`}
      />
    </label>
  );
}

function CopyRow({
  label,
  value,
  onCopy,
}: {
  label: string;
  value: string;
  onCopy: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 min-w-0">
        <div className="text-[10px] tracking-[0.2em] uppercase text-[var(--a-ink-faint)]">{label}</div>
        <div className="font-mono text-xs text-[var(--a-ink)] truncate" dir="ltr">{value}</div>
      </div>
      <button
        type="button"
        onClick={() => onCopy(value)}
        className="shrink-0 px-3 py-1.5 text-xs border border-[var(--a-line)] rounded-sm text-[var(--a-ink-soft)] hover:bg-[var(--a-line-soft)]"
      >
        Copy
      </button>
    </div>
  );
}
