"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { useLocale, type Locale } from "../_lib/i18n";
import { useScrollLock } from "../_lib/scroll-lock";

const T: Record<Locale, {
  clothing: string; shoes: string; size: string; bust: string; waist: string;
  hips: string; eu: string; foot: string; note: string;
}> = {
  ar: { clothing: "الملابس", shoes: "الأحذية", size: "المقاس", bust: "الصدر", waist: "الخصر", hips: "الورك", eu: "المقاس (EU)", foot: "طول القدم (سم)", note: "كل القياسات بالسنتيمتر. عند التردّد بين مقاسين اختاري الأكبر." },
  en: { clothing: "Clothing", shoes: "Shoes", size: "Size", bust: "Bust", waist: "Waist", hips: "Hips", eu: "Size (EU)", foot: "Foot length (cm)", note: "All measurements in cm. If between two sizes, size up." },
  fr: { clothing: "Vêtements", shoes: "Chaussures", size: "Taille", bust: "Poitrine", waist: "Tour de taille", hips: "Hanches", eu: "Taille (EU)", foot: "Longueur du pied (cm)", note: "Mesures en cm. En cas de doute, prenez la taille au-dessus." },
};

const CLOTHING: string[][] = [
  ["XS", "80–84", "60–64", "86–90"],
  ["S", "84–88", "64–68", "90–94"],
  ["M", "88–94", "68–74", "94–100"],
  ["L", "94–100", "74–80", "100–106"],
  ["XL", "100–106", "80–86", "106–112"],
];

const SHOES: string[][] = [
  ["36", "23.0"], ["37", "23.5"], ["38", "24.5"],
  ["39", "25.0"], ["40", "25.5"], ["41", "26.5"],
];

export function SizeGuide({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { locale, d } = useLocale();
  const t = T[locale] ?? T.en;
  useScrollLock(open);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const cell = "px-3 py-2.5 text-sm num text-center";
  const head = "px-3 py-2.5 text-[11px] tracking-[0.15em] uppercase text-[var(--ink-muted)] font-medium text-center";

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[300]"
          />
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-0 bottom-0 md:inset-0 md:flex md:items-center md:justify-center z-[301] md:p-6 pointer-events-none"
          >
            <div className="pointer-events-auto bg-white w-full md:max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--line)] sticky top-0 bg-white">
                <h2 className="font-serif text-2xl tracking-tight">{d.quick_view.size_guide}</h2>
                <button onClick={onClose} aria-label={d.cart.close} className="p-2 hover:text-[var(--brand)] transition-colors">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              <div className="px-6 py-5 space-y-7">
                <section>
                  <h3 className="text-xs tracking-[0.25em] uppercase text-[var(--ink)] font-semibold mb-3">{t.clothing}</h3>
                  <div className="border border-[var(--line)] overflow-hidden rounded-sm">
                    <table className="w-full border-collapse">
                      <thead className="bg-[var(--cream)]">
                        <tr>
                          <th className={head}>{t.size}</th>
                          <th className={head}>{t.bust}</th>
                          <th className={head}>{t.waist}</th>
                          <th className={head}>{t.hips}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {CLOTHING.map((row) => (
                          <tr key={row[0]} className="border-t border-[var(--line)]">
                            <td className={`${cell} font-semibold`}>{row[0]}</td>
                            <td className={cell}>{row[1]}</td>
                            <td className={cell}>{row[2]}</td>
                            <td className={cell}>{row[3]}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section>
                  <h3 className="text-xs tracking-[0.25em] uppercase text-[var(--ink)] font-semibold mb-3">{t.shoes}</h3>
                  <div className="border border-[var(--line)] overflow-hidden rounded-sm">
                    <table className="w-full border-collapse">
                      <thead className="bg-[var(--cream)]">
                        <tr>
                          <th className={head}>{t.eu}</th>
                          <th className={head}>{t.foot}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {SHOES.map((row) => (
                          <tr key={row[0]} className="border-t border-[var(--line)]">
                            <td className={`${cell} font-semibold`}>{row[0]}</td>
                            <td className={cell}>{row[1]}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                <p className="text-xs text-[var(--ink-muted)] leading-relaxed">{t.note}</p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
