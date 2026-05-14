import type { Metadata } from "next";
import { Suspense } from "react";
import NavLinks from "@/components/NavLinks";
import "./globals.css";

export const metadata: Metadata = {
  title: "brix — Service Scheduler",
  description: "Schedule and manage HVAC technician jobs",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-surface-muted">
        <header className="bg-surface border-b border-border sticky top-0 z-10">
          <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
            <span className="text-brand-primary font-bold text-2xl tracking-tight">
              brix
            </span>
            <NavLinks />
          </div>
        </header>
        <main className="flex-1">
          <Suspense>
            {children}
          </Suspense>
        </main>
      </body>
    </html>
  );
}
