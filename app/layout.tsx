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

/* Telefonda Chrome'un "Masaüstü sitesi" görünümü: sayfa 980 px çizilir, tarayıcı ekrana sığdırır.
   Next.js görünüm ayarını geri yazarsa anında yeniden uygulanır (geri dönme olmaz). */
const DESKTOP_VIEW = `(function(){var W=980,C="width="+W+", viewport-fit=cover";var s=Math.min(screen.width||W,screen.height||W);var touch=window.matchMedia&&matchMedia("(pointer: coarse)").matches;if(!touch||s>=W)return;function f(){var ms=document.querySelectorAll('meta[name="viewport"]');if(!ms.length){var m=document.createElement("meta");m.name="viewport";m.content=C;document.head.appendChild(m);return}for(var i=0;i<ms.length;i++){if(ms[i].getAttribute("content")!==C)ms[i].setAttribute("content",C)}}f();new MutationObserver(f).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:["content"]})})();`;

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="tr">
      <head>
        <script dangerouslySetInnerHTML={{ __html: DESKTOP_VIEW }} />
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
