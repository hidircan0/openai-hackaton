import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sarsıntı · Oda Güvenliği",
  description: "Oda risklerini ve deprem senaryosunu görselleştirin.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="tr"><body>{children}</body></html>;
}
