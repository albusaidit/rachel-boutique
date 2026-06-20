"use client";

import { useEffect, useState } from "react";

export default function AdminRootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    console.error("[admin] error:", error);
  }, [error]);

  const retry = () => {
    setRetrying(true);
    reset();
    // If the boundary doesn't recover (server still erroring), force a reload.
    setTimeout(() => {
      window.location.reload();
    }, 1200);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        <h1 className="text-lg font-semibold text-gray-900">
          قاعدة البيانات غير متاحة مؤقتًا
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">
          تعذّر الاتصال بقاعدة البيانات (قد تكون حصّة Neon قد نفدت أو الخطة قيد
          التفعيل). لا يمكن فتح لوحة التحكم حتى تعود قاعدة البيانات.
          <br />
          <span className="text-gray-400">
            The database is temporarily unavailable (Neon compute quota /
            plan activation). The admin can&apos;t load until it recovers.
          </span>
        </p>
        <button
          type="button"
          onClick={retry}
          disabled={retrying}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-700 disabled:opacity-60"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
          {retrying ? "جارٍ المحاولة…" : "إعادة المحاولة / Retry"}
        </button>
      </div>
    </div>
  );
}
