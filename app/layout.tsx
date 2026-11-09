import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Love Matrix — A Universe for One",
  description: "Bazı kapılar anahtarla değil, doğru hisle açılır. Sadece bir kalbe ayrılmış küçük bir evren.",
  applicationName: "Love Matrix",
  keywords: ["Love Matrix", "seni seviyorum", "100 dil", "heart terminal"],
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#07040a",
  colorScheme: "dark",
};

/* Telefonda masaüstü düzeni: sayfa 980 px çizilir, ölçek ekran genişliğine göre ayarlanır (tam sığar). */
const FIT_DESKTOP = `(function(){var W=980;function f(){var l=window.matchMedia&&matchMedia("(orientation: landscape)").matches;var s=l?Math.max(screen.width,screen.height):Math.min(screen.width,screen.height);if(!s||s>=W)return;var m=document.querySelector('meta[name="viewport"]');if(!m){m=document.createElement("meta");m.name="viewport";document.head.appendChild(m)}var c="width="+W+", initial-scale="+(s/W).toFixed(4)+", viewport-fit=cover";if(m.getAttribute("content")!==c)m.setAttribute("content",c)}f();document.addEventListener("DOMContentLoaded",f);window.addEventListener("orientationchange",function(){setTimeout(f,150)})})();`;

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="tr">
      <head>
        <script dangerouslySetInnerHTML={{ __html: FIT_DESKTOP }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,500;1,6..96,400;1,6..96,500&family=JetBrains+Mono:wght@400;600;700&family=Manrope:wght@400;500;600;700;800&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
