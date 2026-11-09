"use client";

import { useEffect, useState } from "react";
import KaliMark from "@/components/kali-mark";

// Oturumda daha önce gösterildi mi? Modül düzeyinde bir kez okunur (StrictMode çift efektinden etkilenmez).
let seenThisSession: boolean | null = null;

const MESSAGES = ["Loading kernel modules...", "Mounting /dev/kalp...", "Starting kali-linux services...", "Almost there..."];

/** Kali açılışı — eski sürümdeki boot ekranı. Oturum başına bir kez. */
export default function BootOverlay() {
  const [state, setState] = useState<"on" | "leaving" | "off">("on");
  const [msg, setMsg] = useState(0);
  const [fill, setFill] = useState(false);

  useEffect(() => {
    if (seenThisSession === null) {
      try {
        seenThisSession = sessionStorage.getItem("lm-boot") === "1";
        sessionStorage.setItem("lm-boot", "1");
      } catch {
        seenThisSession = false;
      }
    }
    const seen = seenThisSession;
    const t: number[] = [];
    if (seen) {
      t.push(window.setTimeout(() => setState("off"), 0));
    } else {
      t.push(window.setTimeout(() => setFill(true), 80));
      MESSAGES.forEach((_, i) => t.push(window.setTimeout(() => setMsg(i), 80 + i * 500)));
      t.push(window.setTimeout(() => setState("leaving"), 2230));
      t.push(window.setTimeout(() => setState("off"), 2880));
    }
    return () => t.forEach((id) => window.clearTimeout(id));
  }, []);

  if (state === "off") return null;
  return (
    <div className={`boot${state === "leaving" ? " is-leaving" : ""}`} role="status" aria-live="polite">
      <div className="boot-logo">
        <KaliMark className="boot-mark" color="#ffffff" />
        <span>kali</span>
      </div>
      <div className="boot-track"><span className={fill ? "is-full" : ""} /></div>
      <p className="boot-cap">{MESSAGES[msg]}</p>
      <button type="button" className="boot-skip" onClick={() => setState("off")}>GEÇ ↗</button>
    </div>
  );
}
