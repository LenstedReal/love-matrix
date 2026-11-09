"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import RubyHeartCanvas, { type RubyHeartHandle } from "@/components/ruby-heart-canvas";
import { isMusicPlaying, musicPreferred, onAudioChange, setMusicPreferred, sfx, startMusic, stopMusic } from "@/lib/audio";
import { PHRASES, PHRASE_KEYS, RTL_KEYS } from "@/lib/phrases";
import { initSpeech, speak, stopSpeech } from "@/lib/speech";

const SCRAMBLABLE = /^[\p{Script=Latin}\p{Script=Cyrillic}\p{Script=Greek}\p{Script=Armenian}\p{Script=Georgian}\p{M}\s'’ʻ.!-]+$/u;
const NOISE = Array.from("ABCDEFGHIJKLMNOPRSTUVYZ#%&*+<>/=0123456789");
const TOUR_MS = 4400;

type Ui = "tr" | "en";
const T = {
  tr: { music: "MÜZİK", auto: "OTOMATİK", all: "TÜM DİLLER", search: "Dil ara…", empty: "Bu adla bir dil yok", hint: "KALBE DOKUN · KAYDIR", noVoice: "Bu dil için ses bulunamadı", back: "LOVE MATRIX", prev: "Önceki dil", next: "Sonraki dil", close: "Kapat", heart: "Kalbe dokun" },
  en: { music: "MUSIC", auto: "AUTO", all: "ALL LANGUAGES", search: "Search languages…", empty: "No language by that name", hint: "TAP THE HEART · SWIPE", noVoice: "No voice available for this language", back: "LOVE MATRIX", prev: "Previous language", next: "Next language", close: "Close", heart: "Tap the heart" },
} as const;

export default function LoveLanguages() {
  const [idx, setIdx] = useState(0);
  const [ui, setUi] = useState<Ui>("tr");
  const [tour, setTour] = useState(true);
  const [touched, setTouched] = useState(false);
  const [music, setMusic] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [query, setQuery] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const heart = useRef<RubyHeartHandle>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const phraseRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const noteTimer = useRef<number | null>(null);
  const t = T[ui];
  const key = PHRASE_KEYS[idx];
  const p = PHRASES[key];

  useEffect(() => {
    initSpeech();
    setMusic(isMusicPlaying());
    try {
      if (localStorage.getItem("lm-ui") === "en") setUi("en");
    } catch {
      /* depolama kapalı */
    }
    return onAudioChange(() => setMusic(isMusicPlaying()));
  }, []);

  useEffect(() => () => stopSpeech(), []);

  /* cümle geçişi: bulanık çıkış → çözülen harfler */
  useEffect(() => {
    const el = phraseRef.current;
    if (!el) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    el.classList.remove("is-in");
    void el.offsetWidth;
    el.classList.add("is-in");
    const target = p.text;
    if (reduce || !SCRAMBLABLE.test(target)) {
      el.textContent = target;
      return;
    }
    const chars = Array.from(target);
    const pool = NOISE.concat(chars.filter((c) => c.trim()));
    const due = chars.map((_, i) => 0.1 + (i / chars.length) * 0.6 + Math.random() * 0.25);
    const t0 = performance.now();
    const tick = (now: number) => {
      const f = (now - t0) / 560;
      let s = "";
      for (let i = 0; i < chars.length; i++) s += f >= due[i] || chars[i] === " " ? chars[i] : pool[(Math.random() * pool.length) | 0];
      el.textContent = s;
      if (f < 1) raf = requestAnimationFrame(tick);
      else el.textContent = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [p.text]);

  /* raydaki etkin dili ortala */
  useEffect(() => {
    const rail = railRef.current;
    const el = rail?.children[idx] as HTMLElement | undefined;
    if (!rail || !el) return;
    rail.scrollTo({ left: el.offsetLeft - rail.clientWidth / 2 + el.offsetWidth / 2, behavior: "smooth" });
  }, [idx, ui]);

  const showNote = useCallback((msg: string) => {
    setNote(msg);
    if (noteTimer.current) window.clearTimeout(noteTimer.current);
    noteTimer.current = window.setTimeout(() => setNote(null), 2600);
  }, []);

  const touch = useCallback(() => {
    setTouched(true);
    if (musicPreferred() && !isMusicPlaying()) startMusic(2);
  }, []);

  /** Kullanıcı seçimi: kendi dilinde okunur. Tıklama içinde çağrılır. */
  const choose = useCallback(
    (i: number, fromUser: boolean) => {
      const n = (i + PHRASE_KEYS.length) % PHRASE_KEYS.length;
      setIdx(n);
      heart.current?.pulse(fromUser);
      if (fromUser) {
        touch();
        setTour(false);
        sfx("blip");
        const k = PHRASE_KEYS[n];
        speak(k, PHRASES[k], () => showNote(T[ui].noVoice));
      }
    },
    [touch, showNote, ui],
  );

  /* otomatik tur (sessiz; kullanıcı bir dile dokununca durur) */
  useEffect(() => {
    if (!tour) return;
    const id = window.setInterval(() => {
      if (document.hidden || sheet) return;
      setIdx((i) => (i + 1) % PHRASE_KEYS.length);
      heart.current?.pulse(false);
    }, TOUR_MS);
    return () => window.clearInterval(id);
  }, [tour, sheet]);

  /* klavye */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (sheet) {
        if (e.key === "Escape") setSheet(false);
        return;
      }
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        choose(idx + 1, true);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        choose(idx - 1, true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sheet, idx, choose]);

  useEffect(() => {
    if (sheet) window.setTimeout(() => searchRef.current?.focus(), 60);
  }, [sheet]);

  /* kalp: dokun = renk modu + oku, sürükle = döndür, hızlı kaydır = dil */
  useEffect(() => {
    const slot = slotRef.current;
    if (!slot) return;
    let id: number | null = null, x0 = 0, y0 = 0, lx = 0, t0 = 0, moved = 0;
    const down = (e: PointerEvent) => {
      id = e.pointerId;
      x0 = lx = e.clientX;
      y0 = e.clientY;
      t0 = performance.now();
      moved = 0;
      heart.current?.setDragging(true);
      try {
        slot.setPointerCapture(id);
      } catch {
        /* yok */
      }
    };
    const move = (e: PointerEvent) => {
      if (e.pointerId !== id) return;
      moved = Math.max(moved, Math.hypot(e.clientX - x0, e.clientY - y0));
      heart.current?.drag((e.clientX - lx) * 0.01);
      lx = e.clientX;
    };
    const up = (e: PointerEvent) => {
      if (e.pointerId !== id) return;
      id = null;
      heart.current?.setDragging(false);
      const dx = e.clientX - x0;
      if (moved < 8) {
        slot.dispatchEvent(new CustomEvent("heart-tap"));
        return;
      }
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(e.clientY - y0) && performance.now() - t0 < 700) {
        slot.dispatchEvent(new CustomEvent("heart-swipe", { detail: dx < 0 ? 1 : -1 }));
      }
    };
    const cancel = () => {
      id = null;
      heart.current?.setDragging(false);
    };
    slot.addEventListener("pointerdown", down);
    slot.addEventListener("pointermove", move);
    slot.addEventListener("pointerup", up);
    slot.addEventListener("pointercancel", cancel);
    return () => {
      slot.removeEventListener("pointerdown", down);
      slot.removeEventListener("pointermove", move);
      slot.removeEventListener("pointerup", up);
      slot.removeEventListener("pointercancel", cancel);
    };
  }, []);

  const tapHeart = useCallback(() => {
    touch();
    heart.current?.nextMode();
    sfx("heartbeat");
    speak(key, p, () => showNote(T[ui].noVoice));
  }, [touch, key, p, showNote, ui]);

  useEffect(() => {
    const slot = slotRef.current;
    if (!slot) return;
    const onTap = () => tapHeart();
    const onSwipe = (e: Event) => choose(idx + (e as CustomEvent<number>).detail, true);
    slot.addEventListener("heart-tap", onTap);
    slot.addEventListener("heart-swipe", onSwipe);
    return () => {
      slot.removeEventListener("heart-tap", onTap);
      slot.removeEventListener("heart-swipe", onSwipe);
    };
  }, [tapHeart, choose, idx]);

  const toggleMusic = () => {
    if (isMusicPlaying()) {
      stopMusic();
      setMusicPreferred(false);
    } else {
      startMusic(2);
      setMusicPreferred(true);
    }
  };

  const toggleUi = () => {
    const n: Ui = ui === "tr" ? "en" : "tr";
    setUi(n);
    try {
      localStorage.setItem("lm-ui", n);
    } catch {
      /* depolama kapalı */
    }
    sfx("blip");
  };

  const label = (k: string) => (ui === "tr" ? PHRASES[k].tr : PHRASES[k].en);
  const q = query.trim().toLocaleLowerCase("tr-TR");
  const filtered = PHRASE_KEYS.map((k, i) => ({ k, i })).filter(
    ({ k }) => !q || PHRASES[k].tr.toLocaleLowerCase("tr-TR").includes(q) || PHRASES[k].en.toLowerCase().includes(q) || PHRASES[k].text.toLocaleLowerCase("tr-TR").includes(q) || k === q,
  );

  return (
    <div className="ll">
      <RubyHeartCanvas ref={heart} className="ll-gl" slotRef={slotRef} ambient fill={0.82} bg={[0.016, 0.0, 0.024]} />

      <header className="ll-top">
        <Link className="ll-back" href="/">← {t.back}</Link>
        <span className="ll-count"><b>{String(idx + 1).padStart(3, "0")}</b> / {PHRASE_KEYS.length}</span>
        <span className="ll-tools">
          <button type="button" className={`chip${music ? " is-on" : ""}`} onClick={toggleMusic} aria-pressed={music}>
            <span className="eq" aria-hidden="true"><i /><i /><i /></span>
            {t.music}
          </button>
          <button type="button" className="chip" onClick={toggleUi} aria-label={ui === "tr" ? "Arayüz dili: Türkçe" : "Interface language: English"}>
            {ui.toUpperCase()}
          </button>
        </span>
      </header>

      <main className="ll-stage">
        <div className="ll-slot" ref={slotRef} role="button" tabIndex={0} aria-label={t.heart} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); tapHeart(); } }} />
        <div className="ll-caption">
          <div className="ll-lang">{label(key)}</div>
          <div className="ll-phrase" ref={phraseRef} lang={p.v} dir={RTL_KEYS.has(key) ? "rtl" : "ltr"}>{p.text}</div>
          <div className={`ll-hint${touched && !note ? " is-gone" : ""}${note ? " is-note" : ""}`} aria-live="polite">{note ?? t.hint}</div>
        </div>
      </main>

      <footer className="ll-bottom">
        <div className="ll-rail-row">
          <button type="button" className="ll-arrow" onClick={() => choose(idx - 1, true)} aria-label={t.prev}>‹</button>
          <div className="ll-rail" ref={railRef}>
            {PHRASE_KEYS.map((k, i) => (
              <button type="button" key={k} className={`ll-lang-btn${i === idx ? " is-on" : ""}`} onClick={() => choose(i, true)}>
                {label(k)}
              </button>
            ))}
          </div>
          <button type="button" className="ll-arrow" onClick={() => choose(idx + 1, true)} aria-label={t.next}>›</button>
        </div>
        <div className="ll-actions">
          <button type="button" className={`chip chip--lg${tour ? " is-on" : ""}`} onClick={() => { touch(); setTour((v) => !v); }} aria-pressed={tour}>
            {tour ? "❚❚" : "▶"} {t.auto}
          </button>
          <button type="button" className="chip chip--lg" onClick={() => { touch(); setQuery(""); setSheet(true); }}>
            {t.all} · {PHRASE_KEYS.length}
          </button>
        </div>
      </footer>

      {sheet && (
        <div className="ll-sheet" role="dialog" aria-modal="true" aria-label={t.all}>
          <div className="ll-sheet-head">
            <input ref={searchRef} className="ll-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t.search} aria-label={t.search} autoComplete="off" />
            <button type="button" className="ll-close" onClick={() => setSheet(false)} aria-label={t.close}>✕</button>
          </div>
          <div className="ll-grid">
            {filtered.length === 0 && <div className="ll-empty">{t.empty}</div>}
            {filtered.map(({ k, i }) => (
              <button
                type="button"
                key={k}
                className={`ll-cell${i === idx ? " is-on" : ""}`}
                onClick={() => {
                  setSheet(false);
                  choose(i, true);
                }}
              >
                <span className="ll-cell-n">{String(i + 1).padStart(3, "0")}</span>
                <span className="ll-cell-l">{label(k)}</span>
                <span className="ll-cell-p" lang={PHRASES[k].v} dir={RTL_KEYS.has(k) ? "rtl" : "ltr"}>{PHRASES[k].text}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
