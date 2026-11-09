import type { Metadata } from "next";
import LoveLanguages from "@/components/love-languages";

export const metadata: Metadata = {
  title: "Seni Seviyorum · 100 Dil — Love Matrix",
  description: "Aynı cümle, yüz dilde: her biri kendi sesiyle okunur.",
};

export default function HundredLanguagesPage() {
  return <LoveLanguages />;
}
