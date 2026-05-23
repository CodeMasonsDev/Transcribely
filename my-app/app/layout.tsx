import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Transcribely AI",
  description:
    "SaaS dashboard for turning transcripts into reviewed and synced ClickUp tickets.",
  icons: {
    icon: "/icon/transcribe_logo.png",
    shortcut: "/icon/transcribe_logo.png",
    apple: "/icon/transcribe_logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
