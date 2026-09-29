import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n";
import { ToastProvider } from "@/components/ui";

export const metadata: Metadata = {
  title: "K-SETU — Collect • Connect • Recycle",
  description: "Vernacular, offline-tolerant platform connecting informal e-waste collectors with authorized recyclers. SIH 2026 prototype.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-paper text-ink antialiased">
        <LanguageProvider>
          <ToastProvider>{children}</ToastProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
