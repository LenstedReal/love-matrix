/**
 * Sesli okuma: cümle HER ZAMAN kendi dilinde okunur, yanlış dilin sesiyle asla okunmaz.
 *  1) Cihazda o dilin sesi varsa → Web Speech API
 *  2) Yoksa → Google Translate ses servisi (çevrimiçi)
 *  3) O da yoksa / çalışmazsa → okunmaz, "bu dil için ses yok" bildirilir
 */
import { duck } from "@/lib/audio";
import type { Phrase } from "@/lib/phrases";

// Google ses servisinin desteklediği diller (bu sitedeki anahtarlarla)
const CLOUD: Record<string, string> = {
  af: "af", am: "am", ar: "ar", bg: "bg", bn: "bn", bs: "bs", ca: "ca", cs: "cs", cy: "cy", da: "da", de: "de", el: "el",
  en: "en", es: "es", et: "et", eu: "eu", fi: "fi", fr: "fr", gl: "gl", gu: "gu", hi: "hi", hr: "hr", hu: "hu", id: "id",
  is: "is", it: "it", he: "iw", ja: "ja", jv: "jw", km: "km", kn: "kn", ko: "ko", la: "la", lt: "lt", lv: "lv", ml: "ml",
  mr: "mr", ms: "ms", my: "my", ne: "ne", nl: "nl", no: "no", pa: "pa", pl: "pl", pt: "pt-PT", ro: "ro", ru: "ru", si: "si",
  sk: "sk", sq: "sq", sr: "sr", su: "su", sv: "sv", sw: "sw", ta: "ta", te: "te", th: "th", tl: "tl", tr: "tr", uk: "uk",
  ur: "ur", vi: "vi", zh: "zh-CN",
};

// cihaz seslerinde farklı yazılan dil kodları
const ALIAS: Record<string, string[]> = {
  no: ["nb", "no", "nn"],
  he: ["he", "iw"],
  tl: ["fil", "tl"],
  jv: ["jv", "jw"],
  id: ["id", "in"],
  yi: ["yi", "ji"],
  zh: ["zh", "cmn"],
};

let voices: SpeechSynthesisVoice[] = [];
let inited = false;
let cloudBroken = false;
let current: HTMLAudioElement | null = null;

function refresh() {
  try {
    voices = window.speechSynthesis.getVoices() || [];
  } catch {
    voices = [];
  }
}

export function initSpeech() {
  if (inited || typeof window === "undefined" || !("speechSynthesis" in window)) return;
  inited = true;
  refresh();
  try {
    window.speechSynthesis.addEventListener("voiceschanged", refresh);
  } catch {
    /* eski tarayıcı */
  }
}

const norm = (s: string) => s.toLowerCase().replace(/_/g, "-");

function findVoice(key: string, bcp: string): SpeechSynthesisVoice | null {
  if (!voices.length) refresh();
  if (!voices.length) return null;
  const want = norm(bcp);
  const exact = voices.find((v) => norm(v.lang) === want);
  if (exact) return exact;
  const prefixes = ALIAS[key] ?? [want.split("-")[0]];
  const matches = voices.filter((v) => prefixes.includes(norm(v.lang).split("-")[0]));
  if (!matches.length) return null;
  // aynı dilde birden çok ses varsa yerel (çevrimdışı) olmayan Google sesleri genelde daha doğal
  return matches.find((v) => /google|natural|neural|premium|enhanced/i.test(v.name)) ?? matches[0];
}

export function stopSpeech() {
  try {
    window.speechSynthesis?.cancel();
  } catch {
    /* yok */
  }
  if (current) {
    current.pause();
    current = null;
  }
  duck(false);
}

export type SpeakOutcome = "device" | "cloud" | "none";

/**
 * Cümleyi okur. Tıklama olayının içinde çağrılmalı (mobil tarayıcı kuralı).
 * onNoVoice: ses bulunamazsa (veya çevrimiçi ses başarısız olursa) çağrılır.
 */
export function speak(key: string, p: Phrase, onNoVoice?: () => void): SpeakOutcome {
  if (typeof window === "undefined") return "none";
  initSpeech();
  stopSpeech();
  let lower = p.text;
  try {
    lower = p.text.toLocaleLowerCase(p.v);
  } catch {
    lower = p.text.toLowerCase();
  }

  const voice = "speechSynthesis" in window ? findVoice(key, p.v) : null;
  if (voice) {
    try {
      const u = new SpeechSynthesisUtterance(lower);
      u.voice = voice;
      u.lang = voice.lang;
      u.rate = 0.95;
      u.onstart = () => duck(true);
      u.onend = () => duck(false);
      u.onerror = () => duck(false);
      window.speechSynthesis.speak(u);
      return "device";
    } catch {
      /* buluta düş */
    }
  }

  const tl = CLOUD[key];
  if (tl && !cloudBroken && navigator.onLine !== false) {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${encodeURIComponent(tl)}&q=${encodeURIComponent(lower)}`;
    const a = new Audio();
    a.preload = "auto";
    a.src = url;
    current = a;
    duck(true);
    const done = () => {
      if (current === a) current = null;
      duck(false);
    };
    a.addEventListener("ended", done);
    a.addEventListener("error", () => {
      done();
      cloudBroken = true;
      onNoVoice?.();
    });
    a.play().catch(() => {
      done();
      onNoVoice?.();
    });
    return "cloud";
  }

  onNoVoice?.();
  return "none";
}
