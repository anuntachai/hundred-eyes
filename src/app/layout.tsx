import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Thai } from "next/font/google";
import type { ReactNode } from "react";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { ToastProvider } from "@/components/Toast";
import { I18nProvider } from "@/lib/i18n";
import "./globals.css";

const plex = IBM_Plex_Sans_Thai({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin", "thai"],
  variable: "--font-plex",
});

export const metadata: Metadata = {
  title: "Hundred Eyes",
  description: "แอปรายงานสถานการณ์น้ำท่วมของหมู่บ้าน | Village flood situation reporting app",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Hundred Eyes" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0284c7",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="th">
      <body className={`${plex.variable} min-h-dvh bg-surface font-sans text-slate-900 antialiased`}>
        <I18nProvider>
          <ToastProvider>{children}</ToastProvider>
        </I18nProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
