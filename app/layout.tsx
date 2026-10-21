import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Love Matrix — A Universe for One",
  description:
    "Bazı kapılar anahtarla değil, doğru hisle açılır. Sadece bir kalbe ayrılmış küçük bir evren.",
  applicationName: "Love Matrix",
  keywords: ["Love Matrix", "digital love letter", "heart terminal", "cosmic experience"],
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#070810",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
