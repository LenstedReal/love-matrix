"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type RefObject } from "react";
import { mountRubyHeart, type HeartController, type HeartMode } from "@/lib/gl/ruby-heart";

export type RubyHeartHandle = {
  pulse(strong?: boolean): void;
  nextMode(): HeartMode | null;
  drag(dx: number): void;
  setDragging(on: boolean): void;
};

type Props = {
  className?: string;
  /** Kalbin oturacağı öğe; verilmezse canvas'ın kendisi. */
  slotRef?: RefObject<HTMLElement | null>;
  ambient?: boolean;
  fill?: number;
  bg?: [number, number, number];
  label?: string;
  /** Dokunma (sürükleme değil). Verilirse kalp klavyeyle de tetiklenebilir. */
  onTap?: () => void;
};

/** WebGL yakut kalp; görünmezken durur, WebGL yoksa CSS kalbe düşer. */
const RubyHeartCanvas = forwardRef<RubyHeartHandle, Props>(function RubyHeartCanvas(
  { className, slotRef, ambient = false, fill = 0.8, bg = [0.027, 0.016, 0.039], label, onTap },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctl = useRef<HeartController | null>(null);
  const [failed, setFailed] = useState(false);

  useImperativeHandle(ref, () => ({
    pulse: (strong?: boolean) => ctl.current?.pulse(strong),
    nextMode: () => ctl.current?.nextMode() ?? null,
    drag: (dx: number) => ctl.current?.drag(dx),
    setDragging: (on: boolean) => ctl.current?.setDragging(on),
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const c = mountRubyHeart(canvas, {
      slot: () => (slotRef?.current ?? canvas).getBoundingClientRect(),
      ambient,
      bg,
      fill,
    });
    if (!c) {
      // WebGL yok: CSS yedeğe geç (bir sonraki karede, efekt içinde senkron setState olmasın)
      const id = window.setTimeout(() => setFailed(true), 0);
      return () => window.clearTimeout(id);
    }
    ctl.current = c;
    const io = new IntersectionObserver(([e]) => c.setActive(e.isIntersecting), { threshold: 0.01 });
    io.observe(canvas);
    const ro = new ResizeObserver(() => c.resize());
    ro.observe(canvas);
    return () => {
      io.disconnect();
      ro.disconnect();
      c.destroy();
      ctl.current = null;
    };
    // bg dizisi her render'da yeni olabilir; yalnızca ilk değer kullanılır
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ambient, fill, slotRef]);

  const tapRef = useRef(onTap);
  useEffect(() => {
    tapRef.current = onTap;
  }, [onTap]);

  // sürükleyerek döndürme, dokununca onTap
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let id: number | null = null;
    let lx = 0, x0 = 0, y0 = 0, moved = 0;
    const down = (e: PointerEvent) => {
      id = e.pointerId;
      lx = x0 = e.clientX;
      y0 = e.clientY;
      moved = 0;
      ctl.current?.setDragging(true);
    };
    const move = (e: PointerEvent) => {
      if (e.pointerId !== id) return;
      moved = Math.max(moved, Math.hypot(e.clientX - x0, e.clientY - y0));
      ctl.current?.drag((e.clientX - lx) * 0.01);
      lx = e.clientX;
    };
    const up = (e: PointerEvent) => {
      if (e.pointerId !== id) return;
      id = null;
      ctl.current?.setDragging(false);
      if (moved < 8 && e.type === "pointerup") tapRef.current?.();
    };
    canvas.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      canvas.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, []);

  return (
    <div
      className={`ruby-heart ${className ?? ""}${failed ? " is-fallback" : ""}${onTap ? " is-tappable" : ""}`}
      role={onTap ? "button" : undefined}
      tabIndex={onTap ? 0 : undefined}
      aria-label={onTap ? label : undefined}
      onKeyDown={(e) => {
        if (onTap && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onTap();
        }
      }}
    >
      <canvas ref={canvasRef} aria-hidden="true" />
      {failed && <span className="ruby-heart__fallback" aria-hidden="true">❤</span>}
    </div>
  );
});

export default RubyHeartCanvas;
