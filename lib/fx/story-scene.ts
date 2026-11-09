/**
 * Instagram hikâyesindeki sahne motoru — repodaki orijinal sürümden (8524b64 + love2-8-10.html) birebir:
 * 3400 kare parçacık (pembe + açık pembe), "lighter" karışım, rgba(0,0,0,.16) iz, "LOVEU♥01" yağmuru,
 * momentumlu morph (çekim 0.16, sönüm 0.82), artan parçacıklar merkezde toplanıp beyaz çekirdeği oluşturur,
 * 3B dönen nokta kalp (Kali sürümü), emoji'li alt yazı.
 * Tek fark: ekran yoğunluğuna (DPR) göre çizildiği için telefonda bulanık değil, keskin görünür.
 */
export type MorphMode = "countdown" | "big" | "text" | "heart" | "caption";

export type StoryScene = {
  morph(text: string, mode: MorphMode): void;
  explode(strength?: number): void;
  reset(): void;
  setPull(v: number): void;
  setMatrixSpeed(v: number): void;
  glow(v: number): void;
  setHeart3d(on: boolean): void;
  resize(): void;
  destroy(): void;
};

type P = { x: number; y: number; tx: number; ty: number; vx: number; vy: number; size: number; a: boolean };
type H3 = { x: number; y: number; z: number; pink: boolean };
type Slot = { char: string; x: number; y: number; size: number };

const PARTICLE_COUNT = 3400;
const MATRIX_CHARS = "LOVEU♥01";
const FONT_SIZE = 16;
const EMOJI = /[\u{1F000}-\u{1FFFF}\u{2190}-\u{2BFF}\u{2600}-\u{27BF}]/u;

export function mountStoryScene(canvas: HTMLCanvasElement): StoryScene | null {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const buf = document.createElement("canvas");
  const bctx = buf.getContext("2d", { willReadFrequently: true });
  if (!bctx) return null;

  let w = 1, h = 1, dpr = 1;
  let columns = 0;
  let drops: number[] = [];
  let matrixSpeed = 1;
  let pull = 0.16;
  let glowBoost = 0;
  let heart3d = false;
  let angle = 0, beatT = 0;
  let slots: Slot[] = [];
  let emojiAlpha = 0;
  const particles: P[] = [];
  let heartPts: H3[] = [];

  const resetP = (p: P) => {
    p.x = Math.random() * w;
    p.y = Math.random() * h;
    p.tx = p.x;
    p.ty = p.y;
    p.vx = 0;
    p.vy = 0;
    p.size = Math.random() * 0.9 + 1.1;
    p.a = Math.random() > 0.5;
  };

  const resize = () => {
    const r = canvas.getBoundingClientRect();
    w = Math.max(1, Math.round(r.width));
    h = Math.max(1, Math.round(r.height));
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, w, h);
    columns = Math.floor(w / FONT_SIZE);
    drops = Array.from({ length: columns }, () => Math.floor(Math.random() * -50));
    // Kali sürümündeki 3B kalp: 900 nokta
    heartPts = [];
    const scale = Math.min(w, h) * 0.016;
    for (let i = 0; i < 900; i++) {
      const t = Math.PI * 2 * Math.random();
      heartPts.push({
        x: 16 * Math.pow(Math.sin(t), 3) * scale,
        y: -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * scale,
        z: (Math.random() - 0.5) * 2 * 90,
        pink: Math.random() > 0.3,
      });
    }
  };

  resize();
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const p = { x: 0, y: 0, tx: 0, ty: 0, vx: 0, vy: 0, size: 1, a: true };
    resetP(p);
    particles.push(p);
  }

  const heartPath = (cx: number, cy: number, scale: number) => {
    bctx.beginPath();
    let first = true;
    for (let t = 0; t < Math.PI * 2; t += 0.02) {
      const x = 16 * Math.pow(Math.sin(t), 3) * scale;
      const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * scale;
      if (first) {
        bctx.moveTo(cx + x, cy + y);
        first = false;
      } else bctx.lineTo(cx + x, cy + y);
    }
    bctx.closePath();
    bctx.fill();
  };

  const morph = (text: string, mode: MorphMode) => {
    heart3d = false;
    buf.width = w;
    buf.height = h;
    bctx.clearRect(0, 0, w, h);
    bctx.fillStyle = "#fff";
    bctx.textAlign = "center";
    bctx.textBaseline = "middle";
    slots = [];

    if (mode === "heart") {
      heartPath(w / 2, h / 2 - h * 0.03, Math.min(w, h) * 0.024);
    } else if (mode === "countdown") {
      const fs = Math.min(w, h) * 0.55;
      bctx.font = `900 ${fs}px Arial, sans-serif`;
      bctx.fillText(text, w / 2, h / 2);
    } else if (mode === "big") {
      let fs = Math.min(w * 0.3, h * 0.3);
      bctx.font = `900 ${fs}px Arial, sans-serif`;
      while (bctx.measureText(text).width > w * 0.92 && fs > 20) {
        fs -= 4;
        bctx.font = `900 ${fs}px Arial, sans-serif`;
      }
      bctx.fillText(text, w / 2, h / 2);
    } else if (mode === "text") {
      // Kali sürümündeki ROOT ACCESS / AUTHENTICATED / LENSTEDREAL
      let fs = Math.min(w * 0.12, 64);
      const f = (s: number) => `800 ${s}px "JetBrains Mono", ui-monospace, monospace`;
      bctx.font = f(fs);
      while (bctx.measureText(text).width > w * 0.88 && fs > 16) {
        fs -= 4;
        bctx.font = f(fs);
      }
      bctx.fillText(text, w / 2, h / 2);
    } else {
      // alt yazı: metin parçacık, emoji gerçek emoji
      const seg = typeof Intl !== "undefined" && "Segmenter" in Intl ? new Intl.Segmenter("en", { granularity: "grapheme" }) : null;
      const graphemes = seg ? Array.from(seg.segment(text), (s) => s.segment) : Array.from(text);
      const parts: { type: "t" | "e"; v: string }[] = [];
      graphemes.forEach((g) => {
        const last = parts[parts.length - 1];
        if (EMOJI.test(g)) parts.push({ type: "e", v: g });
        else if (last && last.type === "t") last.v += g;
        else parts.push({ type: "t", v: g });
      });
      let fs = Math.min(w * 0.085, 56);
      const ratio = 1.15;
      const total = (size: number) => {
        bctx.font = `bold ${size}px Arial, sans-serif`;
        let t = 0;
        parts.forEach((p, i) => {
          t += p.type === "t" ? bctx.measureText(p.v).width : size * ratio;
          const next = parts[i + 1];
          if (next && (p.type === "e" || next.type === "e")) t += size * 0.55;
        });
        return t;
      };
      while (total(fs) > w * 0.9 && fs > 14) fs -= 2;
      const full = total(fs);
      bctx.font = `bold ${fs}px Arial, sans-serif`;
      let x = w / 2 - full / 2;
      const cy = h / 2;
      bctx.textAlign = "left";
      parts.forEach((p, i) => {
        if (p.type === "t") {
          bctx.fillText(p.v, x, cy);
          x += bctx.measureText(p.v).width;
        } else {
          const sw = fs * ratio;
          slots.push({ char: p.v, x: x + sw / 2, y: cy, size: fs * 1.3 });
          x += sw;
        }
        const next = parts[i + 1];
        if (next && (p.type === "e" || next.type === "e")) x += fs * 0.55;
      });
    }

    const data = bctx.getImageData(0, 0, w, h).data;
    const targets: number[] = [];
    for (let y = 0; y < h; y += 4) {
      for (let x = 0; x < w; x += 4) {
        if (data[(y * w + x) * 4 + 3] > 128) targets.push(x, y);
      }
    }
    // hedefleri karıştır (yoksa şekil üstten dolar, eksik görünür)
    for (let i = targets.length / 2 - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const ax = targets[i * 2], ay = targets[i * 2 + 1];
      targets[i * 2] = targets[j * 2];
      targets[i * 2 + 1] = targets[j * 2 + 1];
      targets[j * 2] = ax;
      targets[j * 2 + 1] = ay;
    }
    const n = Math.min(targets.length / 2, particles.length);
    for (let k = 0; k < n; k++) {
      particles[k].tx = targets[k * 2];
      particles[k].ty = targets[k * 2 + 1];
    }
    // artan parçacıklar merkezde → beyaz çekirdek parıltısı
    for (let k = n; k < particles.length; k++) {
      particles[k].tx = w / 2 + (Math.random() - 0.5) * 4;
      particles[k].ty = h / 2 + (Math.random() - 0.5) * 4;
    }
  };

  const explode = (strength = 1) => {
    for (const p of particles) {
      const a = Math.atan2(p.y - h / 2, p.x - w / 2) || Math.random() * Math.PI * 2;
      const f = (Math.random() * 6 + 3) * strength;
      p.vx += Math.cos(a) * f;
      p.vy += Math.sin(a) * f;
    }
  };

  let raf = 0, destroyed = false, last = performance.now(), acc = 0;
  const STEP = 1000 / 60;

  const step = () => {
    // orijinal 60 fps sabit adımlı fizik
    ctx.globalCompositeOperation = "source-over";
    // iz: hikâyede 0.16; Kali sürümünün 3B kalbinde 0.25 (daha kısa iz, net kalp)
    ctx.fillStyle = heart3d ? "rgba(0,0,0,0.25)" : "rgba(0,0,0,0.16)";
    ctx.fillRect(0, 0, w, h);
    // yağmur
    ctx.font = `${FONT_SIZE}px monospace`;
    for (let i = 0; i < columns; i++) {
      const ch = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
      const x = i * FONT_SIZE, y = drops[i] * FONT_SIZE;
      ctx.fillStyle = ch === "♥" ? "rgba(255,45,117,0.55)" : "rgba(255,130,170,0.4)";
      ctx.fillText(ch, x, y);
      if (y > h && Math.random() > 0.975) drops[i] = 0;
      drops[i] += matrixSpeed;
    }
    ctx.globalCompositeOperation = "lighter";
    if (heart3d) {
      angle = (angle + 0.02) % (Math.PI * 2);
      beatT += 0.05;
      const pulse = 1 + Math.sin(beatT * 4) * 0.08;
      const cx = w / 2, cy = h / 2;
      const c = Math.cos(angle), s = Math.sin(angle);
      for (const pt of heartPts) {
        const xr = (pt.x * c - pt.z * s) * pulse;
        const zr = (pt.x * s + pt.z * c) * pulse;
        const yr = pt.y * pulse;
        const sc = 400 / (400 + zr);
        const al = Math.min(1, Math.max(0.4, (zr + 180) / 360));
        ctx.fillStyle = pt.pink ? `rgba(255,45,117,${al})` : `rgba(255,255,255,${al})`;
        ctx.fillRect(cx + xr * sc, cy + yr * sc, 2.6 * sc, 2.6 * sc);
      }
    } else {
      for (const p of particles) {
        p.vx += (p.tx - p.x) * pull;
        p.vy += (p.ty - p.y) * pull;
        p.vx *= 0.82;
        p.vy *= 0.82;
        p.x += p.vx;
        p.y += p.vy;
        ctx.fillStyle = p.a ? "rgba(255,45,117,0.95)" : "rgba(255,190,210,0.9)";
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }
    }
    ctx.globalCompositeOperation = "source-over";
    if (slots.length) {
      if (emojiAlpha < 1) emojiAlpha = Math.min(1, emojiAlpha + 0.05);
      ctx.save();
      ctx.globalAlpha = emojiAlpha;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (const e of slots) {
        ctx.font = `${e.size}px "Noto Color Emoji","Apple Color Emoji","Segoe UI Emoji",sans-serif`;
        ctx.fillText(e.char, e.x, e.y);
      }
      ctx.restore();
    } else if (emojiAlpha > 0) emojiAlpha = Math.max(0, emojiAlpha - 0.08);
    if (glowBoost > 1) canvas.style.filter = `brightness(${1 + glowBoost / 40}) saturate(1.3)`;
    else if (glowBoost > 0.05) canvas.style.filter = `brightness(${1 + glowBoost / 40})`;
    else canvas.style.filter = "none";
    if (glowBoost > 0) glowBoost *= 0.9;
  };

  const frame = (now: number) => {
    if (destroyed) return;
    raf = requestAnimationFrame(frame);
    if (document.hidden) {
      last = now;
      return;
    }
    acc += Math.min(100, now - last);
    last = now;
    // 120 Hz ekranlarda da orijinal hızda kalsın
    let n = 0;
    while (acc >= STEP && n < 3) {
      step();
      acc -= STEP;
      n++;
    }
    if (n === 3) acc = 0;
  };
  raf = requestAnimationFrame((t) => {
    last = t;
    frame(t);
  });

  const onResize = () => resize();
  window.addEventListener("resize", onResize);

  return {
    morph,
    explode,
    reset() {
      heart3d = false;
      slots = [];
      particles.forEach(resetP);
    },
    setPull(v) {
      pull = v;
    },
    setMatrixSpeed(v) {
      matrixSpeed = v;
    },
    glow(v) {
      glowBoost = v;
    },
    setHeart3d(on) {
      heart3d = on;
      angle = 0;
      beatT = 0;
      if (on) slots = [];
    },
    resize,
    destroy() {
      destroyed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    },
  };
}
