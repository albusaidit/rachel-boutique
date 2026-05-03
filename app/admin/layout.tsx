import type { Metadata } from "next";
import { Inter, Noto_Naskh_Arabic } from "next/font/google";
import { AdminLocaleProvider } from "./_lib/i18n-admin";
import "./admin.css";

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700"],
});

const arabic = Noto_Naskh_Arabic({
  subsets: ["arabic"],
  variable: "--font-arabic",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "RACHÉL — Admin",
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminLocaleProvider className={`${sans.variable} ${arabic.variable} admin-root`}>
      {children}
    </AdminLocaleProvider>
  );
}
