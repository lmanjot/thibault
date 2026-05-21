import type { Metadata } from "next";
import { Fredoka, Nunito } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const display = Fredoka({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const body = Nunito({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Contes — Histoires illustrées pour enfants",
  description:
    "Créez des histoires illustrées personnalisées pour vos enfants à partir d'une simple idée.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${display.variable} ${body.variable} antialiased`}>
        <div className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50/30 to-rose-50/40">
          <header className="border-b border-amber-200/60 bg-white/70 backdrop-blur-sm">
            <nav className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
              <Link
                href="/"
                className="font-display text-xl font-bold text-amber-600 hover:text-amber-700"
              >
                ✨ Contes
              </Link>
              <div className="flex gap-4 text-sm font-medium">
                <Link
                  href="/create"
                  className="text-amber-900/80 hover:text-amber-700"
                >
                  Nouvelle histoire
                </Link>
                <Link
                  href="/stories"
                  className="text-amber-900/80 hover:text-amber-700"
                >
                  Mes histoires
                </Link>
              </div>
            </nav>
          </header>
          <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
