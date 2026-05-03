"use client";

import { useAdminLocale } from "../_lib/i18n-admin";
import { DemoBanner, PageHeader } from "./PageHeader";

export function OrdersEmpty() {
  const { d } = useAdminLocale();
  return (
    <>
      <PageHeader title={d.orders.title} subtitle={d.orders.subtitle} />
      <div className="px-8 py-6 space-y-5">
        <DemoBanner>{d.orders.empty_body}</DemoBanner>

        <div className="bg-[var(--a-surface)] border border-[var(--a-line)] py-20 text-center">
          <div className="text-4xl text-[var(--a-ink-faint)] mb-4" aria-hidden>
            ▥
          </div>
          <h2 className="text-base font-semibold mb-2">{d.orders.empty_title}</h2>
          <p className="text-sm text-[var(--a-ink-muted)] max-w-sm mx-auto">
            {d.orders.empty_body}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: d.orders.step1_title, body: d.orders.step1_body },
            { title: d.orders.step2_title, body: d.orders.step2_body },
            { title: d.orders.step3_title, body: d.orders.step3_body },
          ].map((step) => (
            <div key={step.title} className="bg-[var(--a-surface)] border border-[var(--a-line)] p-5">
              <div className="text-xs tracking-[0.25em] uppercase font-medium mb-2">
                {step.title}
              </div>
              <div className="text-sm text-[var(--a-ink-soft)] leading-relaxed">{step.body}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
