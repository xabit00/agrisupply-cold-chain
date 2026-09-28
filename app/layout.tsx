import type { Metadata } from "next";
import { QueryProvider } from "@/providers/query-provider";
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
        <QueryProvider>
          {children}
          <ToastViewport />
        </QueryProvider>
      </body>
    </html>
  );
}

