"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Props = { active: boolean; onClose: () => void };
type Particle = { x: number; y: number; tx: number; ty: number; vx: number; vy: number; size: number; pink: boolean };
type HeartPoint = { x: number; y: number; z: number; pink: boolean };

export default function ImmersiveLoveSequence({ active, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const soundRef = useRef(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [phaseName, setPhaseName] = useState("INITIALISING HEART.SYS");
  const [flash, setFlash] = useState(false);
  const audioRef = useRef<AudioContext | null>(null);

  useEffect(() => { soundRef.current = soundEnabled; }, [soundEnabled]);

  const playTone = useCallback((kind: "key" | "access" | "countdown" | "word" | "heartbeat" | "error") => {
    if (!soundRef.current || typeof window === "undefined") return;
    try {
      const AudioCtor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtor) return;
      if (!audioRef.current) audioRef.current = new AudioCtor();
      const audio = audioRef.current;
      if (audio.state === "suspended") void audio.resume();
      const now = audio.currentTime;
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      const filter = audio.createBiquadFilter();
      const settings = {
        key: { type: "square" as OscillatorType, from: 650, to: 730, duration: 0.04, volume: 0.025 },
        access: { type: "sawtooth" as OscillatorType, from: 140, to: 880, duration: 0.48, volume: 0.12 },
        countdown: { type: "sawtooth" as OscillatorType, from: 200, to: 54, duration: 0.55, volume: 0.09 },
        word: { type: "triangle" as OscillatorType, from: 340, to: 690, duration: 0.16, volume: 0.07 },
        heartbeat: { type: "sine" as OscillatorType, from: 72, to: 30, duration: 0.14, volume: 0.14 },
        error: { type: "triangle" as OscillatorType, from: 340, to: 160, duration: 0.35, volume: 0.055 },
      }[kind];
      oscillator.type = settings.type;
      oscillator.frequency.setValueAtTime(settings.from + (kind === "key" ? Math.random() * 90 : 0), now);
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(settings.to, 1), now + settings.duration);
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(kind === "countdown" ? 430 : 2400, now);
      gain.gain.setValueAtTime(settings.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + settings.duration);
      oscillator.connect(filter);
      filter.connect(gain);
      gain.connect(audio.destination);
      oscillator.start(now);
      oscillator.stop(now + settings.duration + 0.01);
      if (kind === "heartbeat") {
        const second = audio.createOscillator();
        const secondGain = audio.createGain();
        second.type = "sine";
        second.frequency.setValueAtTime(50, now + 0.15);
        second.frequency.exponentialRampToValueAtTime(28, now + 0.27);
        secondGain.gain.setValueAtTime(settings.volume * 0.75, now + 0.15);
        secondGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
        second.connect(secondGain);
        secondGain.connect(audio.destination);
        second.start(now + 0.15);
        second.stop(now + 0.29);
      }
    } catch { /* Audio is a progressive enhancement; the animation still works muted. */ }
  }, []);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d", { alpha: false });
    if (!canvas || !ctx) return;

    let w = 1;
    let h = 1;
    let dpr = 1;
    let raf = 0;
    let frame = 0;
    let currentMode: "matrix" | "text" | "heart" | "3dheart" = "matrix";
    let disposed = false;
    let particles: Particle[] = [];
    let heartPoints: HeartPoint[] = [];
    let matrixDrops: number[] = [];
    let angle = 0;
    let pulse = 1;
    let pull = 0.12;
    const textCanvas = document.createElement("canvas");
    const textCtx = textCanvas.getContext("2d", { willReadFrequently: true });
    const matrixChars = "i love you ♥ 01 ∞";
    let timeoutIds: number[] = [];

    const wait = (ms: number) => new Promise<void>((resolve) => {
      const id = window.setTimeout(() => {
        timeoutIds = timeoutIds.filter((timer) => timer !== id);
        resolve();
      }, ms);
      timeoutIds.push(id);
    });

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = Math.max(1, rect.width);
      h = Math.max(1, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(1500, Math.max(650, Math.round((w * h) / (w < 600 ? 850 : 640))));
      particles = Array.from({ length: count }, () => {
        const x = Math.random() * w;
        const y = Math.random() * h;
        return { x, y, tx: x, ty: y, vx: 0, vy: 0, size: Math.random() * 1.8 + 0.5, pink: Math.random() > 0.31 };
      });
      matrixDrops = Array.from({ length: Math.floor(w / 17) }, () => Math.floor(Math.random() * -55));
      heartPoints = Array.from({ length: Math.min(900, count) }, () => {
        const t = Math.random() * Math.PI * 2;
        return {
          x: 16 * Math.pow(Math.sin(t), 3) * Math.min(w, h) * 0.016,
          y: -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * Math.min(w, h) * 0.016,
          z: (Math.random() - 0.5) * 150,
          pink: Math.random() > 0.3,
        };
      });
    };

    const moveToText = (text: string, sizeFactor = 0.12) => {
      if (!textCtx) return;
      textCanvas.width = Math.round(w);
      textCanvas.height = Math.round(h);
      textCtx.clearRect(0, 0, w, h);
      textCtx.fillStyle = "#fff";
      textCtx.textAlign = "center";
      textCtx.textBaseline = "middle";
      let size = Math.min(w * sizeFactor, h * 0.22, text === "I LOVE YOU SEVGILIM" ? 70 : 180);
      size = Math.max(24, size);
      textCtx.font = `800 ${size}px Arial, sans-serif`;
      while (textCtx.measureText(text).width > w * 0.88 && size > 18) {
        size -= 3;
        textCtx.font = `800 ${size}px Arial, sans-serif`;
      }
      textCtx.fillText(text, w / 2, h / 2);
      const pixels = textCtx.getImageData(0, 0, Math.round(w), Math.round(h)).data;
      const targets: Array<{ x: number; y: number }> = [];
      const stride = w < 600 ? 6 : 5;
      for (let y = 0; y < h; y += stride) {
        for (let x = 0; x < w; x += stride) {
          if (pixels[(Math.floor(y) * Math.round(w) + Math.floor(x)) * 4 + 3] > 120) targets.push({ x, y });
        }
      }
      for (let i = targets.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [targets[i], targets[j]] = [targets[j], targets[i]];
      }
      for (let i = 0; i < particles.length; i++) {
        const target = targets[i % Math.max(1, targets.length)];
        if (target && i < targets.length) {
          particles[i].tx = target.x;
          particles[i].ty = target.y;
        } else {
          particles[i].tx = w / 2 + (Math.random() - 0.5) * w * 0.8;
          particles[i].ty = h / 2 + (Math.random() - 0.5) * h * 0.8;
        }
      }
      currentMode = "text";
    };

    const moveToHeart = () => {
      particles.forEach((particle, index) => {
        const t = (index / particles.length) * Math.PI * 2;
        const scale = Math.min(w, h) * 0.019;
        particle.tx = w / 2 + 16 * Math.pow(Math.sin(t), 3) * scale;
        particle.ty = h / 2 - (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * scale;
      });
      pull = 0.12;
      currentMode = "heart";
    };

    const drawMatrix = () => {
      ctx.font = "12px monospace";
      for (let i = 0; i < matrixDrops.length; i++) {
        const x = i * 17;
        const y = matrixDrops[i] * 16;
        const char = matrixChars[Math.floor(Math.random() * matrixChars.length)];
        ctx.fillStyle = char === "♥" ? "rgba(255, 70, 139, .76)" : "rgba(151, 175, 255, .21)";
        ctx.fillText(char, x, y);
        if (y > h && Math.random() > 0.98) matrixDrops[i] = 0;
        matrixDrops[i] += 0.85;
      }
    };

    const draw = () => {
      frame += 1;
      ctx.fillStyle = "rgba(4, 5, 13, .28)";
      ctx.fillRect(0, 0, w, h);
      const centerGlow = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.6);
      centerGlow.addColorStop(0, "rgba(73, 59, 139, .12)");
      centerGlow.addColorStop(1, "rgba(4, 5, 13, 0)");
      ctx.fillStyle = centerGlow;
      ctx.fillRect(0, 0, w, h);
      if (frame % 2 === 0) drawMatrix();

      if (currentMode === "3dheart") {
        angle += 0.018;
        pulse = 1 + Math.sin(frame * 0.045) * 0.055;
        for (const point of heartPoints) {
          const cos = Math.cos(angle);
          const sin = Math.sin(angle);
          const x = (point.x * cos - point.z * sin) * pulse;
          const z = (point.x * sin + point.z * cos) * pulse;
          const perspective = 430 / (430 + z);
          const y = point.y * pulse;
          ctx.fillStyle = point.pink ? `rgba(255, 63, 137, ${Math.max(.25, Math.min(1, (z + 160) / 320))})` : "rgba(246, 245, 255, .87)";
          ctx.fillRect(w / 2 + x * perspective, h / 2 + y * perspective, 2.5 * perspective, 2.5 * perspective);
        }
      } else if (currentMode !== "matrix") {
        for (const particle of particles) {
          const dx = particle.tx - particle.x;
          const dy = particle.ty - particle.y;
          particle.vx = (particle.vx + dx * pull) * 0.82;
          particle.vy = (particle.vy + dy * pull) * 0.82;
          particle.x += particle.vx;
          particle.y += particle.vy;
          ctx.fillStyle = particle.pink ? `rgba(255, 69, 143, ${Math.min(1, .57 + Math.abs(particle.vx) * .04)})` : "rgba(255, 248, 255, .83)";
          ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
        }
      } else {
        for (let i = 0; i < 70; i++) {
          const x = (i * 113 + frame * (i % 4 + 1)) % Math.max(1, w);
          const y = (i * 79) % Math.max(1, h);
          ctx.fillStyle = `rgba(190, 193, 255, ${.12 + Math.sin(frame * .02 + i) * .08})`;
          ctx.fillRect(x, y, 1.1, 1.1);
        }
      }
      raf = window.requestAnimationFrame(draw);
    };

    const run = async () => {
      while (!disposed) {
        for (const numeral of ["3", "2", "1"]) {
          if (disposed) return;
          setPhaseName("AUTHENTICATION SEQUENCE");
          setFlash(true);
          window.setTimeout(() => setFlash(false), 135);
          playTone("countdown");
          moveToText(numeral, 0.56);
          await wait(850);
        }
        for (const word of ["ROOT ACCESS", "AUTHENTICATED", "LENSTEDREAL"]) {
          if (disposed) return;
          setPhaseName("PRIVILEGES ESCALATED");
          setFlash(true);
          window.setTimeout(() => setFlash(false), 170);
          playTone("word");
          moveToText(word, 0.12);
          await wait(1050);
        }
        if (disposed) return;
        setPhaseName("HEART CORE ONLINE");
        setFlash(true);
        window.setTimeout(() => setFlash(false), 260);
        playTone("heartbeat");
        moveToHeart();
        await wait(2250);
        currentMode = "3dheart";
        angle = 0;
        setPhaseName("HEARTBEAT DETECTED · ∞");
        for (let i = 0; i < 4; i++) {
          playTone("heartbeat");
          await wait(900);
          if (disposed) return;
        }
        if (disposed) return;
        setPhaseName("A MESSAGE FROM THE CORE");
        setFlash(true);
        window.setTimeout(() => setFlash(false), 220);
        playTone("access");
        moveToText("I LOVE YOU SEVGILIM", 0.11);
        await wait(4700);
        particles.forEach((particle) => {
          particle.x = Math.random() * w;
          particle.y = Math.random() * h;
          particle.vx = (Math.random() - .5) * 4;
          particle.vy = (Math.random() - .5) * 4;
        });
        currentMode = "matrix";
        await wait(550);
      }
    };

    resize();
    draw();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    void run();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      disposed = true;
      window.cancelAnimationFrame(raf);
      timeoutIds.forEach(window.clearTimeout);
      observer.disconnect();
      window.removeEventListener("keydown", onKeyDown);
      audioRef.current?.close().catch(() => {});
      audioRef.current = null;
    };
  }, [active, onClose, playTone]);

  if (!active) return null;

  return (
    <div className="sequence-overlay" role="dialog" aria-modal="true" aria-label="Love Matrix kalp animasyonu">
      <canvas className="sequence-canvas" ref={canvasRef} aria-label="Parçacıklardan oluşan kalp ve romantik mesaj animasyonu" />
      <div className={`sequence-flash${flash ? " is-on" : ""}`} />
      <header className="sequence-toolbar">
        <div className="sequence-brand"><span className="sequence-brand__dot" /><div><strong>LOVE MATRIX</strong><small>IMMERSIVE CORE / 001</small></div></div>
        <div className="sequence-actions">
          <button className="sequence-tool" onClick={() => setSoundEnabled((value) => !value)} aria-label={soundEnabled ? "Sesi kapat" : "Sesi aç"} title={soundEnabled ? "Sesi kapat" : "Sesi aç"}>
            {soundEnabled ? "♫" : "♪̸"}<span>{soundEnabled ? "SOUND ON" : "SOUND OFF"}</span>
          </button>
          <button className="sequence-close" onClick={onClose}><span>×</span> EXIT EXPERIENCE</button>
        </div>
      </header>
      <div className="sequence-center-note"><span className="status-dot" /> {phaseName}</div>
      <footer className="sequence-footer"><span>ONE HEARTBEAT / ONE UNIVERSE</span><span>PRESS ESC TO RETURN</span><span>07.∞.001</span></footer>
    </div>
  );
}
