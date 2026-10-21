"use client";

import { useEffect, useRef } from "react";

export default function AmbientCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let width = 0;
    let height = 0;
    let frame = 0;
    let raf = 0;
    const pointer = { x: 0.5, y: 0.42 };
    const stars: Array<{ x: number; y: number; r: number; alpha: number; phase: number; speed: number }> = [];

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(155, Math.round((width * height) / 7800));
      stars.length = 0;
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          r: Math.random() * 1.4 + 0.25,
          alpha: Math.random() * 0.54 + 0.14,
          phase: Math.random() * Math.PI * 2,
          speed: Math.random() * 0.018 + 0.004,
        });
      }
    };

    const onPointer = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = (event.clientX - rect.left) / Math.max(1, rect.width);
      pointer.y = (event.clientY - rect.top) / Math.max(1, rect.height);
    };

    const draw = () => {
      frame += 1;
      ctx.clearRect(0, 0, width, height);
      const glow = ctx.createRadialGradient(
        width * (0.62 + (pointer.x - 0.5) * 0.08),
        height * (0.43 + (pointer.y - 0.5) * 0.08),
        0,
        width * 0.58,
        height * 0.42,
        Math.max(width, height) * 0.73,
      );
      glow.addColorStop(0, "rgba(106, 94, 187, .13)");
      glow.addColorStop(0.48, "rgba(67, 103, 171, .045)");
      glow.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);

      for (const star of stars) {
        const twinkle = 0.62 + Math.sin(frame * star.speed + star.phase) * 0.38;
        ctx.beginPath();
        ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha * twinkle})`;
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = window.requestAnimationFrame(draw);
    };

    resize();
    draw();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    canvas.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("resize", resize);

    return () => {
      window.cancelAnimationFrame(raf);
      observer.disconnect();
      canvas.removeEventListener("pointermove", onPointer);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas aria-hidden="true" className="ambient-canvas" ref={canvasRef} />;
}
