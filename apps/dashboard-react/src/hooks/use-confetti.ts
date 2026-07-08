"use client";

import { useCallback, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  w: number;
  h: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
};

const COLORS = [
  "#00C969",
  "#1D1D1D",
  "#FFD02B",
  "#1F6FEB",
  "#F97316",
  "#878787",
  "#DDF1E4",
];

function createParticles(count: number, width: number, height: number) {
  const particles: Particle[] = [];
  const originX = width / 2;
  const originY = height * 0.35;

  for (let i = 0; i < count; i++) {
    const angle = (Math.random() * Math.PI * 2);
    const speed = 4 + Math.random() * 10;
    particles.push({
      x: originX + (Math.random() - 0.5) * 80,
      y: originY + (Math.random() - 0.5) * 40,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 6,
      color: COLORS[Math.floor(Math.random() * COLORS.length)]!,
      w: 6 + Math.random() * 6,
      h: 3 + Math.random() * 4,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.3,
      opacity: 1,
    });
  }

  return particles;
}

export function useConfetti() {
  const rafRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const stop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (canvasRef.current?.parentElement) {
      canvasRef.current.parentElement.removeChild(canvasRef.current);
    }
    canvasRef.current = null;
  }, []);

  const fire = useCallback(
    (durationMs = 2800) => {
      stop();

      const canvas = document.createElement("canvas");
      canvas.style.cssText =
        "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:60";
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      document.body.appendChild(canvas);
      canvasRef.current = canvas;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      let particles = createParticles(120, canvas.width, canvas.height);
      const gravity = 0.22;
      const startedAt = performance.now();

      const tick = (now: number) => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (const p of particles) {
          p.vy += gravity;
          p.x += p.vx;
          p.y += p.vy;
          p.vx *= 0.99;
          p.rotation += p.rotationSpeed;

          const elapsed = now - startedAt;
          if (elapsed > durationMs * 0.6) {
            p.opacity = Math.max(0, 1 - (elapsed - durationMs * 0.6) / (durationMs * 0.4));
          }

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.globalAlpha = p.opacity;
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
          ctx.restore();
        }

        particles = particles.filter((p) => p.opacity > 0.02 && p.y < canvas.height + 40);

        if (now - startedAt < durationMs && particles.length > 0) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          stop();
        }
      };

      rafRef.current = requestAnimationFrame(tick);
    },
    [stop],
  );

  return { fire, stop };
}