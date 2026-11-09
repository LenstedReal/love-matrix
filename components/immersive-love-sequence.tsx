"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  SPB,
  isMusicPlaying,
  musicBeat,
  musicIntroBars,
  musicPreferred,
  onAudioChange,
  setMusicPreferred,
  sfx,
  startMusic,
  stopMusic,
} from "@/lib/audio";
import { mountStoryScene, type StoryScene } from "@/lib/fx/story-scene";

type Props = { active: boolean; onClose: () => void };

/** Sahne ölçüsü (vuruş). Müzik 140 BPM; hikâyedeki süreler vuruşa yuvarlandı. */
const LOOP = 56;
/** Drop'un geleceği vuruş (YU). Terminal müziği 6 ölçülük girişle başlatır. */
export const SEQUENCE_DROP_BEAT = 16;
export const TERMINAL_INTRO_BARS = 6;

/**
 * Akış — Instagram hikâyesi (8524b64) + Kali kesiti (love2-8-10.html), birebir:
 * toz → 3 · 2 · 1 → ROOT ACCESS · AUTHENTICATED · LENSTEDREAL → YU · ARE · MY · LOVE →
 * parçacık kalp + 5 nabız → dönen 3B kalp → I LOVE 🫦❤️‍🔥 YOU SEVGILIM → toz → baştan
 */
export default function ImmersiveLoveSequence({ active, onClose }: Props) {
  if (!active) return null;
  return <Stage onClose={onClose} />;
}

function Stage({ onClose }: { onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const ringsRef = useRef<HTMLDivElement>(null);
  const scene = useRef<StoryScene | null>(null);
  const [sound, setSound] = useState(isMusicPlaying());
  const [doneOnce, setDoneOnce] = useState(false);
  const [run, setRun] = useState(0);

  useEffect(() => onAudioChange(() => setSound(isMusicPlaying())), []);

  /** Orijinaldeki gibi: beyaz flaş, anında açılıp söner. */
  const flash = useCallback((strength: number, dur: number) => {
    const f = flashRef.current;
    if (!f) return;
    f.style.transition = "none";
    f.style.opacity = String(strength);
    requestAnimationFrame(() => {
      f.style.transition = `opacity ${dur}ms ease-out`;
      f.style.opacity = "0";
    });
  }, []);

  /** Orijinaldeki gibi: merkezden 95vmax'a açılan pembe halka. */
  const ring = useCallback(() => {
    const layer = ringsRef.current;
    if (!layer) return;
    const r = document.createElement("div");
    r.className = "story-ring";
    layer.appendChild(r);
    window.setTimeout(() => r.remove(), 950);
  }, []);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    scene.current = mountStoryScene(c);
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = prev;
      scene.current?.destroy();
      scene.current = null;
    };
  }, [onClose]);

  useEffect(() => {
    const S = () => scene.current;
    const timers: number[] = [];
    const later = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms));

    // saat: müzik varsa vuruşlara kilitli (drop = YU), yoksa 140 BPM performans saati
    const clock = { mode: "perf" as "perf" | "music", base: performance.now() + 120, last: -99 };
    const mb = musicBeat();
    if (mb !== null) {
      const intro = musicIntroBars();
      const dropAt = intro * 4; // müzikte drop'un vuruşu
      clock.mode = "music";
      clock.base = mb < dropAt - SEQUENCE_DROP_BEAT + 2 && intro * 4 >= SEQUENCE_DROP_BEAT ? dropAt - SEQUENCE_DROP_BEAT : Math.ceil((mb + 0.5) / 4) * 4;
    }
    const beatNow = () => {
      if (clock.mode === "music") {
        const b = musicBeat();
        if (b !== null) return (clock.last = b - clock.base);
        clock.mode = "perf";
        clock.base = performance.now() - clock.last * SPB * 1000;
      }
      return (clock.last = (performance.now() - clock.base) / 1000 / SPB);
    };

    const countdown = (n: string) => () => {
      sfx("count");
      S()?.morph(n, "countdown");
      S()?.explode(0.6);
      ring();
      flash(0.3, 200);
      S()?.setMatrixSpeed(1.6);
      S()?.glow(16);
    };
    const kaliWord = (wd: string) => () => {
      sfx("word");
      flash(0.4, 180);
      ring();
      S()?.explode(0.6);
      S()?.morph(wd, "text");
      S()?.glow(14);
    };
    const storyWord = (wd: string) => () => {
      sfx("word");
      S()?.explode(0.6);
      later(120, () => S()?.morph(wd, "big"));
    };
    const pulse = () => {
      sfx("beat");
      S()?.setPull(0.19);
      S()?.glow(14);
      later(SPB * 500, () => S()?.setPull(0.12));
    };

    const events: { b: number; run: () => void }[] = [
      { b: 0, run: () => { S()?.reset(); S()?.setPull(0.16); S()?.setMatrixSpeed(1); } },
      { b: 4, run: countdown("3") },
      { b: 6, run: countdown("2") },
      { b: 8, run: countdown("1") },
      { b: 10, run: () => { S()?.setMatrixSpeed(1); kaliWord("ROOT ACCESS")(); } },
      { b: 12, run: kaliWord("AUTHENTICATED") },
      { b: 14, run: kaliWord("LENSTEDREAL") },
      { b: 16, run: () => { flash(0.85, 350); storyWord("YU")(); } },
      { b: 18, run: storyWord("ARE") },
      { b: 20, run: storyWord("MY") },
      { b: 22, run: storyWord("LOVE") },
      { b: 24, run: () => { flash(0.95, 420); S()?.explode(0.8); ring(); later(150, () => { S()?.morph("", "heart"); S()?.setPull(0.13); }); } },
      { b: 29, run: pulse },
      { b: 30, run: pulse },
      { b: 31, run: pulse },
      { b: 32, run: pulse },
      { b: 33, run: pulse },
      { b: 34, run: () => { sfx("beat"); flash(0.6, 300); ring(); S()?.setHeart3d(true); S()?.glow(18); } },
      { b: 36, run: () => sfx("beat") },
      { b: 38, run: () => sfx("beat") },
      { b: 40, run: () => sfx("beat") },
      { b: 42, run: () => { sfx("gag"); flash(0.5, 250); ring(); S()?.explode(0.65); S()?.morph("I LOVE 🫦❤️‍🔥 YOU SEVGILIM", "caption"); S()?.setPull(0.18); S()?.glow(18); } },
      { b: 51, run: () => { flash(0.5, 300); S()?.reset(); } },
      { b: 54, run: () => setDoneOnce(true) },
    ];

    let raf = 0, idx = 0, loopBase = 0, cancelled = false;
    const tick = () => {
      if (cancelled) return;
      raf = requestAnimationFrame(tick);
      const b = beatNow() - loopBase;
      if (b >= LOOP) {
        loopBase += LOOP;
        idx = 0;
        return;
      }
      while (idx < events.length && b >= events[idx].b) {
        const ev = events[idx++];
        // sekme arka plandaysa kaçırılan olayları art arda patlatma
        if (idx < events.length && b >= events[idx].b + 1 && ev.b !== 0) continue;
        ev.run();
      }
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [run, flash, ring]);

  const toggleSound = () => {
    if (isMusicPlaying()) {
      stopMusic();
      setMusicPreferred(false);
    } else {
      startMusic(0);
      setMusicPreferred(true);
    }
  };

  const replay = () => {
    if (!isMusicPlaying() && musicPreferred()) startMusic(0);
    setDoneOnce(false);
    setRun((r) => r + 1);
  };

  return (
    <div className="story" role="dialog" aria-modal="true" aria-label="I love you sevgilim">
      <canvas className="story-canvas" ref={canvasRef} aria-hidden="true" />
      <div className="story-rings" ref={ringsRef} aria-hidden="true" />
      <div className="story-flash" ref={flashRef} aria-hidden="true" />
      <div className="story-tools">
        <button type="button" className={`story-tool${sound ? " is-on" : ""}`} onClick={toggleSound} aria-pressed={sound} aria-label={sound ? "Müziği kapat" : "Müziği aç"}>
          {sound ? "♫" : "♪"}
        </button>
        <button type="button" className="story-tool" onClick={onClose} aria-label="Çık">
          ✕
        </button>
      </div>
      {doneOnce && (
        <div className="story-next">
          <Link className="story-next__main" href="/100-dil">
            100 dilde dinle →
          </Link>
          <button type="button" className="story-next__ghost" onClick={replay}>
            ↺ baştan
          </button>
        </div>
      )}
    </div>
  );
}
