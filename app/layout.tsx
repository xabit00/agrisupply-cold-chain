import type { Metadata } from "next";
import { QueryProvider } from "@/providers/query-provider";
import { AuthProvider } from "@/providers/auth-provider";
import { ToastViewport } from "@/components/ui/toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "AgriSupply & Cold-Chain Logistics Platform",
  description: "Enterprise Smart Cold-Chain and Produce Tracking System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <a href="#main-content" className="sr-only z-[70] rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:shadow-lg">Skip to main content</a>
        <QueryProvider>
          <AuthProvider>
            {children}
            <ToastViewport />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}

