import type { Metadata } from "next";
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
        {children}
      </body>
    </html>
  );
}
