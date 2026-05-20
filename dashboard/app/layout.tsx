import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Snapcommit",
  description: "Local-first memory for your AI tools",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
