"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { useLocale, type Locale } from "../_lib/i18n";
import { categoryTree } from "../_lib/products";
import { useStorefrontUI } from "../_lib/storefront-ui";
import { useToast } from "./Toast";
import { BrandMark } from "./BrandMark";
import { SizeGuide } from "./SizeGuide";
import { InfoModal, type InfoBlock } from "./InfoModal";

const WA = "https://api.whatsapp.com/send?phone=212700718587";

const TRACK_TEXT: Record<Locale, string> = {
  ar: "مرحباً RACHÉL، أودّ تتبّع طلبي رقم: ",
  en: "Hi RACHÉL, I'd like to track my order #: ",
  fr: "Bonjour RACHÉL, je souhaite suivre ma commande n° : ",
};

const FAQ: Record<Locale, InfoBlock[]> = {
  ar: [
    { heading: "كم يستغرق التوصيل؟", body: "عادةً من ٢ إلى ٥ أيام عمل داخل المغرب حسب مدينتك." },
    { heading: "كيف أدفع؟", body: "الدفع عند الاستلام متاح، ونؤكّد طلبك وتفاصيل التوصيل عبر واتساب خلال ساعة." },
    { heading: "هل يمكنني الإرجاع أو الاستبدال؟", body: "نعم، خلال ١٤ يومًا من الاستلام، شرط أن تكون القطعة بحالتها الأصلية مع ملصقاتها." },
    { heading: "كيف أختار مقاسي؟", body: "افتحي «دليل المقاسات» في أسفل الصفحة، وعند التردّد بين مقاسين اختاري الأكبر." },
  ],
  en: [
    { heading: "How long does delivery take?", body: "Usually 2–5 business days within Morocco, depending on your city." },
    { heading: "How do I pay?", body: "Cash on delivery is available; we confirm your order and delivery details on WhatsApp within the hour." },
    { heading: "Can I return or exchange?", body: "Yes, within 14 days of delivery, as long as the item is in its original condition with tags." },
    { heading: "How do I choose my size?", body: "Open the “Size guide” at the bottom of the page; if you're between sizes, size up." },
  ],
  fr: [
    { heading: "Combien de temps pour la livraison ?", body: "En général 2 à 5 jours ouvrables au Maroc, selon votre ville." },
    { heading: "Comment payer ?", body: "Le paiement à la livraison est disponible ; nous confirmons votre commande via WhatsApp sous une heure." },
    { heading: "Puis-je retourner ou échanger ?", body: "Oui, sous 14 jours après réception, si l'article est dans son état d'origine avec ses étiquettes." },
    { heading: "Comment choisir ma taille ?", body: "Ouvrez le « Guide des tailles » en bas de page ; en cas de doute, prenez la taille au-dessus." },
  ],
};

const SHIPPING: Record<Locale, InfoBlock[]> = {
  ar: [
    { heading: "الشحن", body: "شحن مجاني للطلبات فوق ٥٠٠ د.م. الطلبات الأقل تُحتسب رسوم رمزية تُؤكَّد عبر واتساب. التوصيل خلال ٢–٥ أيام عمل." },
    { heading: "الإرجاع والاستبدال", body: "يمكنك الإرجاع أو الاستبدال خلال ١٤ يومًا من الاستلام، مع الاحتفاظ بالقطعة بحالتها الأصلية وملصقاتها." },
    { heading: "كيف أبدأ الإرجاع؟", body: "راسلينا على واتساب مع رقم طلبك وسنرتّب لكِ العملية بسهولة." },
  ],
  en: [
    { heading: "Shipping", body: "Free shipping on orders over MAD 500. Smaller orders carry a small fee confirmed on WhatsApp. Delivery in 2–5 business days." },
    { heading: "Returns & exchanges", body: "Return or exchange within 14 days of delivery, with the item in its original condition and tags." },
    { heading: "How to start a return", body: "Message us on WhatsApp with your order number and we'll arrange it for you." },
  ],
  fr: [
    { heading: "Livraison", body: "Livraison offerte dès 500 MAD. Les commandes inférieures ont des frais réduits confirmés via WhatsApp. Livraison en 2 à 5 jours ouvrables." },
    { heading: "Retours & échanges", body: "Retour ou échange sous 14 jours après réception, article dans son état d'origine avec ses étiquettes." },
    { heading: "Comment effectuer un retour", body: "Écrivez-nous sur WhatsApp avec votre numéro de commande et nous nous en occupons." },
  ],
};

type FLink = { label: string; onClick?: () => void; href?: string };

export function Footer() {
  const { d, locale } = useLocale();
  const { openBrowse } = useStorefrontUI();
  const [email, setEmail] = useState("");
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState(false);
  const [shippingOpen, setShippingOpen] = useState(false);
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

  const sl = d.footer.service_links;
  const trackHref = `${WA}&text=${encodeURIComponent(TRACK_TEXT[locale] ?? TRACK_TEXT.en)}`;

  // Shop column = real catalogue categories + New/Sale, each opening the browse overlay.
  const shopLinks: FLink[] = [
    { label: d.sections.new_title, onClick: () => openBrowse({ type: "tag", key: "new" }) },
    ...categoryTree.map((c) => ({
      label: c[locale] || c.en,
      onClick: () => openBrowse({ type: "category", key: c.key }),
    })),
    { label: d.product_grid.filter_sale, onClick: () => openBrowse({ type: "tag", key: "sale" }) },
  ];

  // Service column: contact/track → WhatsApp, size-guide/shipping/FAQ → modals.
  const serviceLinks: FLink[] = [
    { label: sl[0], href: WA },
    { label: sl[1], onClick: () => setSizeGuideOpen(true) },
    { label: sl[2], onClick: () => setShippingOpen(true) },
    { label: sl[3], onClick: () => setFaqOpen(true) },
    { label: sl[4], href: trackHref },
  ];

  const columns = [
    { title: d.footer.shop_title, links: shopLinks },
    { title: d.footer.service_title, links: serviceLinks },
  ];

  const linkClass =
    "text-sm text-[var(--ink-muted)] hover:text-[var(--brand)] transition-colors text-start";
  const renderLink = (l: FLink) =>
    l.onClick ? (
      <button type="button" onClick={l.onClick} className={linkClass}>
        {l.label}
      </button>
    ) : (
      <a
        href={l.href || "#"}
        {...(l.href?.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}
        className={linkClass}
      >
        {l.label}
      </a>
    );

  return (
    <footer className="bg-white border-t border-[var(--line)] mt-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6 }}
        className="max-w-[1500px] mx-auto px-5 md:px-8 py-16 md:py-20 grid grid-cols-1 md:grid-cols-[1.4fr_repeat(2,1fr)] gap-10 md:gap-8 border-b border-[var(--line)]"
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
            <a href={WA} target="_blank" rel="noreferrer" aria-label={d.footer.wa} className="hover:text-[var(--brand)] transition-colors">
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
              {col.links.map((l) => (
                <li key={l.label}>{renderLink(l)}</li>
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

      <SizeGuide open={sizeGuideOpen} onClose={() => setSizeGuideOpen(false)} />
      <InfoModal open={faqOpen} onClose={() => setFaqOpen(false)} title={sl[3]} blocks={FAQ[locale] ?? FAQ.en} />
      <InfoModal open={shippingOpen} onClose={() => setShippingOpen(false)} title={sl[2]} blocks={SHIPPING[locale] ?? SHIPPING.en} />
    </footer>
  );
}
