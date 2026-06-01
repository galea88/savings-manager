import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Savings Manager",
  description: "Track your savings across banks and brokers in two currencies",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen bg-slate-900">{children}</body>
    </html>
  );
}
