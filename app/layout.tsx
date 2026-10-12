import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sarsıntı | Oda Güvenlik Analizi",
  description:
    "Oda fotoğrafından deprem ve temel iş güvenliği risklerini inceleyin."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
