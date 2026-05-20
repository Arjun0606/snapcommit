import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Snapcommit — Memory for your AI tools",
  description:
    "The local-first memory layer for Claude Code, Cursor, VS Code, and 27 more MCP clients. Your storage, your sync, our compute.",
  metadataBase: new URL("https://snapcommit.com"),
  openGraph: {
    title: "Snapcommit — Memory for your AI tools",
    description: "Your AI never forgets. Genuinely local-first. $9–$129/mo.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
