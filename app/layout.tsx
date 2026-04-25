import type { Metadata, Viewport } from "next";
import { AuthProvider } from "@/components/providers/auth-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "デジタル栞",
  description: "紙の本の読書進捗を記録するデジタル本棚アプリ",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "デジタル栞",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F0ECE2" },
    { media: "(prefers-color-scheme: dark)",  color: "#141210" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-bg antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
