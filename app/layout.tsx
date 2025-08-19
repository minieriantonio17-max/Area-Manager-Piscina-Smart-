import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "CRM AM • Pro+",
  description: "Dashboard • Mappa • Agenda • Clienti • Report • PDF • Alert intelligenti"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>
        <header className="bg-gradient-to-r from-brand-500 to-brand-700 text-white">
          <div className="container py-6 flex items-center justify-between">
            <h1 className="text-xl md:text-2xl font-semibold tracking-tight">CRM AM • Pro+</h1>
            <nav className="flex gap-4 md:gap-6 text-sm md:text-base">
              <Link href="/">Dashboard</Link>
              <Link href="/map">Mappa</Link>
              <Link href="/agenda">Visite & Agenda</Link>
              <Link href="/clients">Clienti</Link>
              <Link href="/reports">Report</Link>
            </nav>
          </div>
        </header>
        <main className="container py-6 md:py-10">{children}</main>
        <footer className="container py-10 text-sm text-gray-500">Pro • Tailwind + Recharts • PDF export • Google Maps (optional)</footer>
      </body>
    </html>
  );
}