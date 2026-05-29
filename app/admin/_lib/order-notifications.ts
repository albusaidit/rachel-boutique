import type { OrderRow } from "@/app/_lib/db/orders-repo";

export type Stage = "received" | "confirmed" | "shipped";
type Lang = "ar" | "en" | "fr";

function localeOf(o: OrderRow): Lang {
  if (o.locale === "ar" || o.locale === "fr") return o.locale;
  return "en";
}

function itemsLine(o: OrderRow, lang: Lang): string {
  return o.items
    .map(
      (it, i) =>
        `${i + 1}. ${it.name} — ${it.size} / ${it.color} — ×${it.qty} — ${(
          it.unitPrice * it.qty
        ).toLocaleString(lang === "ar" ? "ar-SA" : lang === "fr" ? "fr-FR" : "en-US")} ${o.currency}`,
    )
    .join("\n");
}

export function notifySubject(stage: Stage, o: OrderRow): string {
  const lang = localeOf(o);
  if (stage === "received") {
    if (lang === "ar") return `RACHÉL · استلمنا طلبك #${o.id}`;
    if (lang === "fr") return `RACHÉL · Commande #${o.id} reçue`;
    return `RACHÉL · Order #${o.id} received`;
  }
  if (stage === "confirmed") {
    if (lang === "ar") return `RACHÉL · تأكيد طلبك #${o.id}`;
    if (lang === "fr") return `RACHÉL · Commande #${o.id} confirmée`;
    return `RACHÉL · Order #${o.id} confirmed`;
  }
  if (lang === "ar") return `RACHÉL · شحن طلبك #${o.id}`;
  if (lang === "fr") return `RACHÉL · Commande #${o.id} expédiée`;
  return `RACHÉL · Order #${o.id} shipped`;
}

export function notifyBody(stage: Stage, o: OrderRow): string {
  const lang = localeOf(o);
  const total = `${o.currency} ${o.subtotal.toLocaleString(
    lang === "ar" ? "ar-SA" : lang === "fr" ? "fr-FR" : "en-US",
  )}`;
  const items = itemsLine(o, lang);
  const trackPieces = [
    o.carrier && `${lang === "ar" ? "الناقل" : lang === "fr" ? "Transporteur" : "Carrier"}: ${o.carrier}`,
    o.trackingNumber && `${lang === "ar" ? "رقم التتبع" : lang === "fr" ? "Suivi" : "Tracking"}: ${o.trackingNumber}`,
    o.shippingNotes && (lang === "ar" ? `ملاحظة: ${o.shippingNotes}` : lang === "fr" ? `Note : ${o.shippingNotes}` : `Note: ${o.shippingNotes}`),
  ].filter(Boolean);

  if (stage === "received") {
    if (lang === "ar")
      return `مرحباً ${o.customerName} ✦
شكراً لطلبك من RACHÉL. هذا تأكيد بأننا استلمنا الطلب التالي وسنراجعه ونعود إليك خلال ساعة لتأكيده.

${items}

الإجمالي: ${total}
رقم الطلب: #${o.id}
المدينة: ${o.city}

سنبقيك على اطلاع في كل مرحلة. — RACHÉL`;
    if (lang === "fr")
      return `Bonjour ${o.customerName} ✦
Merci pour votre commande chez RACHÉL. Nous avons bien reçu votre commande et la confirmerons dans l'heure.

${items}

Total : ${total}
Commande : #${o.id}
Ville : ${o.city}

Nous vous tiendrons informée à chaque étape. — RACHÉL`;
    return `Hello ${o.customerName} ✦
Thank you for ordering from RACHÉL. We've received your order and will confirm it within the hour.

${items}

Total: ${total}
Order: #${o.id}
City: ${o.city}

We'll keep you posted at every stage. — RACHÉL`;
  }

  if (stage === "confirmed") {
    if (lang === "ar")
      return `مرحباً ${o.customerName} ✦
تم تأكيد طلبك #${o.id} وبدأنا تجهيزه الآن. سنرسل تفاصيل الشحن فور إرسالها.

${items}

الإجمالي: ${total}

شكراً لاختيارك RACHÉL. — RACHÉL`;
    if (lang === "fr")
      return `Bonjour ${o.customerName} ✦
Votre commande #${o.id} est confirmée et en préparation. Nous vous enverrons les détails d'expédition dès l'envoi.

${items}

Total : ${total}

Merci d'avoir choisi RACHÉL. — RACHÉL`;
    return `Hello ${o.customerName} ✦
Your order #${o.id} is confirmed and now being prepared. We'll send you tracking details as soon as it ships.

${items}

Total: ${total}

Thank you for choosing RACHÉL. — RACHÉL`;
  }

  // shipped
  const tracking = trackPieces.length > 0 ? `\n\n${trackPieces.join("\n")}` : "";
  if (lang === "ar")
    return `مرحباً ${o.customerName} ✦
تم شحن طلبك #${o.id} وهو في طريقه إليك.${tracking}

سنُعلمك حين تصل الشحنة. — RACHÉL`;
  if (lang === "fr")
    return `Bonjour ${o.customerName} ✦
Votre commande #${o.id} a été expédiée et arrive vers vous.${tracking}

Nous vous préviendrons à la livraison. — RACHÉL`;
  return `Hello ${o.customerName} ✦
Your order #${o.id} has shipped and is on its way.${tracking}

We'll let you know when it arrives. — RACHÉL`;
}

export function whatsappLink(phone: string, body: string): string {
  return `https://api.whatsapp.com/send?phone=${phone.replace(/[^0-9]/g, "")}&text=${encodeURIComponent(body)}`;
}

export function mailtoLink(email: string, subject: string, body: string): string {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
