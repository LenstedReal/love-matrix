"use client";

import { useEffect, useState } from "react";

export default function BootOverlay() {
  const [visible, setVisible] = useState(true);
  const [caption, setCaption] = useState("Connecting to the heart...");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const captions = ["Loading private universe", "Mounting /dev/kalp", "Ready when you are"];
    const captionTimers = captions.map((text, index) => window.setTimeout(() => setCaption(text), 220 + index * 280));
    const progressTimer = window.setTimeout(() => setProgress(100), 140);
    const closeTimer = window.setTimeout(() => setVisible(false), 1320);
    return () => {
      captionTimers.forEach(window.clearTimeout);
      window.clearTimeout(progressTimer);
      window.clearTimeout(closeTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="boot-overlay" role="status" aria-live="polite">
      <div className="boot-orb"><span /><span /><span /></div>
      <div className="boot-wordmark">LOVE <em>MATRIX</em></div>
      <p className="boot-caption">{caption}</p>
      <div className="boot-progress"><span style={{ width: `${progress}%` }} /></div>
      <button className="boot-skip" onClick={() => setVisible(false)}>SKIP INTRO <span>↗</span></button>
    </div>
  );
}
