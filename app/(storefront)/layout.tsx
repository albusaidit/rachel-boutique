import type { Metadata } from "next";
import { Bodoni_Moda, Inter, Noto_Naskh_Arabic, Noto_Kufi_Arabic } from "next/font/google";
import { CartProvider } from "./_lib/cart";
import { LocaleProvider } from "./_lib/i18n";
import { StorefrontUIProvider } from "./_lib/storefront-ui";
import { ToastProvider } from "./_components/Toast";
import "./boutique.css";

const display = Bodoni_Moda({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600"],
});

const arabic = Noto_Naskh_Arabic({
  subsets: ["arabic"],
  variable: "--font-arabic",
  weight: ["400", "500", "600", "700"],
});

const arabicDisplay = Noto_Kufi_Arabic({
  subsets: ["arabic"],
  variable: "--font-arabic-display",
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "RACHÉL — Quiet Luxury for the Modern Woman",
  description: "RACHÉL — fashion, footwear, fragrance & beauty in quiet-luxury style.",
  openGraph: {
    title: "RACHÉL",
    description: "Quiet luxury — fashion, fragrance, beauty.",
  },
};

export default function BoutiqueLayout({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider
      className={`${display.variable} ${sans.variable} ${arabic.variable} ${arabicDisplay.variable} boutique-root`}
    >
      <CartProvider>
        <ToastProvider>
          <StorefrontUIProvider>{children}</StorefrontUIProvider>
        </ToastProvider>
      </CartProvider>
    </LocaleProvider>
  );
}
