"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { useLocale } from "../_lib/i18n";
import { useToast } from "./Toast";
import { BrandMark } from "./BrandMark";

export function Footer() {
  const { d } = useLocale();
  const [email, setEmail] = useState("");
  const { push } = useToast();

  const subscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) {
      push(d.footer.invalid_email, "error");
      return;
    }
    push(d.footer.welcome_msg);
    setEmail("");
  };

  const columns = [
    { title: d.footer.shop_title, links: d.footer.shop_links },
    { title: d.footer.service_title, links: d.footer.service_links },
    { title: d.footer.brand_title, links: d.footer.brand_links },
  ];

  return (
    <footer className="bg-white border-t border-[var(--line)] mt-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6 }}
        className="max-w-[1500px] mx-auto px-5 md:px-8 py-16 md:py-20 grid grid-cols-1 md:grid-cols-[1.4fr_repeat(3,1fr)] gap-10 md:gap-8 border-b border-[var(--line)]"
      >
        <div>
          <div className="mb-5">
            <BrandMark size="md" />
          </div>
          <p className="text-sm text-[var(--ink-muted)] leading-relaxed mb-6 max-w-sm">
            {d.footer.tagline}
          </p>
          <form onSubmit={subscribe} className="flex border border-[var(--line)] bg-white focus-within:border-[var(--ink)] transition-colors">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={d.footer.newsletter_placeholder}
              className="flex-1 px-4 py-3 text-sm outline-none bg-transparent"
            />
            <button
              type="submit"
              className="px-5 text-xs tracking-[0.2em] uppercase hover:bg-[var(--ink)] hover:text-white transition-colors"
            >
              {d.footer.subscribe}
            </button>
          </form>
          <div className="flex gap-4 mt-6 text-[var(--ink-muted)]">
            <a href="#" aria-label={d.footer.ig} className="hover:text-[var(--brand)] transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" />
              </svg>
            </a>
            <a href="#" aria-label={d.footer.tt} className="hover:text-[var(--brand)] transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.6 6.3a4.85 4.85 0 0 1-3-1.1V15a5.9 5.9 0 1 1-5.9-5.9c.4 0 .8 0 1.2.1v3c-.4-.1-.8-.2-1.2-.2a3 3 0 1 0 3 3V2h2.9a4.85 4.85 0 0 0 3 4.3z"/>
              </svg>
            </a>
            <a href="#" aria-label={d.footer.wa} className="hover:text-[var(--brand)] transition-colors">
              <svg width="18" height="18" viewBox="0 0 32 32" fill="currentColor">
                <path d="M16 2C8.3 2 2 8.3 2 16c0 2.5.7 4.9 1.9 7L2 30l7.2-1.9c2 1.1 4.4 1.8 6.8 1.8 7.7 0 14-6.3 14-14S23.7 2 16 2zm0 25.5c-2.2 0-4.3-.6-6.1-1.7l-.4-.3-4.3 1.1 1.1-4.2-.3-.4c-1.2-1.9-1.9-4.1-1.9-6.4 0-6.5 5.3-11.9 11.9-11.9S27.9 9.5 27.9 16 22.5 27.5 16 27.5z"/>
              </svg>
            </a>
          </div>
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <h4 className="text-xs tracking-[0.3em] uppercase font-semibold mb-5">{col.title}</h4>
            <ul className="space-y-3">
              {col.links.map((link) => (
                <li key={link}>
                  <a
                    href="#"
                    className="text-sm text-[var(--ink-muted)] hover:text-[var(--brand)] transition-colors"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </motion.div>

      <div className="max-w-[1500px] mx-auto px-5 md:px-8 py-6 flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-[var(--ink-muted)]">
        <div>{d.footer.copyright}</div>
        <div className="flex gap-6">
          <a href="#" className="hover:text-[var(--ink)] transition-colors">{d.footer.privacy}</a>
          <a href="#" className="hover:text-[var(--ink)] transition-colors">{d.footer.terms}</a>
          <a href="#" className="hover:text-[var(--ink)] transition-colors">{d.footer.legal}</a>
        </div>
      </div>
    </footer>
  );
}
