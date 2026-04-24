"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

const COLORS = ["#4f8ef7", "#a78bfa", "#3ecf8e", "#f056a0", "#38bdf8", "#c084fc", "#22d3ee"];

type Particle = {
  x: number;
  y: number;
  size: number;
  speed: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  pulse: number;
  glow: boolean;
  reset: (rand: boolean) => void;
  update: (Wi: number, Hi: number) => void;
  draw: (ctx: CanvasRenderingContext2D) => void;
};

export function HeroParticleCanvas({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const mxRef = useRef(-9999);
  const myRef = useRef(-9999);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = 0;
    let H = 0;

    const createParticle = (): Particle => {
      const p: Particle = {
        x: 0,
        y: 0,
        size: 0,
        speed: 0,
        vx: 0,
        vy: 0,
        color: "",
        alpha: 0,
        pulse: 0,
        glow: false,
        reset(rand: boolean) {
          this.x = Math.random() * W;
          this.y = rand ? Math.random() * H : -10;
          this.glow = Math.random() < 0.1;
          this.size = this.glow ? Math.random() * 2 + 1.5 : Math.random() * 1.5 + 0.3;
          this.speed = Math.random() * 0.15 + 0.05;
          this.vx = (Math.random() - 0.5) * 0.12;
          this.vy = Math.random() * 0.3 + 0.05;
          this.color = COLORS[Math.floor(Math.random() * COLORS.length)]!;
          this.alpha = Math.random() * 0.5 + 0.15;
          this.pulse = Math.random() * Math.PI * 2;
        },
        update(Wi: number, Hi: number) {
          this.pulse += 0.012;
          this.x += this.vx;
          this.y += this.vy * this.speed * 0.8;
          this.alpha = (this.glow ? 0.22 : 0.15) + Math.sin(this.pulse) * 0.1;
          if (this.y > Hi + 10) this.reset(false);
          if (this.x < 0) this.x = Wi;
          if (this.x > Wi) this.x = 0;
        },
        draw(c: CanvasRenderingContext2D) {
          if (this.glow) {
            const gr = c.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 6);
            gr.addColorStop(0, this.color);
            gr.addColorStop(1, "transparent");
            c.globalAlpha = this.alpha * 0.55;
            c.fillStyle = gr;
            c.beginPath();
            c.arc(this.x, this.y, this.size * 6, 0, Math.PI * 2);
            c.fill();
          }
          c.globalAlpha = this.alpha;
          c.fillStyle = this.color;
          c.beginPath();
          c.arc(this.x, this.y, this.size, 0, Math.PI * 2);
          c.fill();
        },
      };
      return p;
    }

    const layout = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w < 2 || h < 2) return;

      W = w;
      H = h;
      const dpr = Math.min(window.devicePixelRatio ?? 1, 2);
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (!particlesRef.current.length) {
        particlesRef.current = Array.from({ length: 200 }, () => {
          const p = createParticle();
          p.reset(true);
          return p;
        });
      } else {
        particlesRef.current.forEach((p) => p.reset(true));
      }
    }

    const drawConnections = (parts: Particle[]) => {
      const DIST = 115;
      for (let i = 0; i < parts.length; i++) {
        for (let j = i + 1; j < parts.length; j++) {
          const dx = parts[i]!.x - parts[j]!.x;
          const dy = parts[i]!.y - parts[j]!.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < DIST) {
            const alpha = (1 - d / DIST) * 0.1;
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = parts[i]!.color;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(parts[i]!.x, parts[i]!.y);
            ctx.lineTo(parts[j]!.x, parts[j]!.y);
            ctx.stroke();
          }
        }
      }
    }

    const loop = () => {
      if (W < 2 || H < 2) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      ctx.clearRect(0, 0, W, H);

      ctx.globalAlpha = 0.025;
      ctx.strokeStyle = "#4f8ef7";
      ctx.lineWidth = 0.5;
      const gs = 80;
      for (let x = 0; x < W; x += gs) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let y = 0; y < H; y += gs) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }

      const parts = particlesRef.current;
      drawConnections(parts);

      const mx = mxRef.current;
      const my = myRef.current;
      const REPEL = 145;

      parts.forEach((p) => {
        p.update(W, H);

        // Mouse repulsion — particles gently flee the cursor
        if (mx >= 0 && mx <= W && my >= 0 && my <= H) {
          const dx = p.x - mx;
          const dy = p.y - my;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < REPEL && dist > 0.5) {
            const force = ((REPEL - dist) / REPEL) * 2.4;
            p.x += (dx / dist) * force;
            p.y += (dy / dist) * force;
          }
        }

        p.draw(ctx);
      });

      if (mx >= 0 && mx <= W && my >= 0 && my <= H) {
        const grad = ctx.createRadialGradient(mx, my, 0, mx, my, 160);
        grad.addColorStop(0, "rgba(124,58,237,0.07)");
        grad.addColorStop(0.5, "rgba(6,182,212,0.03)");
        grad.addColorStop(1, "transparent");
        ctx.globalAlpha = 1;
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(mx, my, 160, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      rafRef.current = requestAnimationFrame(loop);
    }

    const ro = new ResizeObserver(() => layout());
    ro.observe(container);
    layout();

    const onMove = (e: MouseEvent) => {
      const r = container.getBoundingClientRect();
      mxRef.current = e.clientX - r.left;
      myRef.current = e.clientY - r.top;
    };

    window.addEventListener("mousemove", onMove);
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      ro.disconnect();
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(rafRef.current);
      particlesRef.current = [];
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn("pointer-events-none absolute inset-0 z-[2]", className)}
      aria-hidden
    >
      <canvas ref={canvasRef} id="bgCanvas" className="block h-full w-full" />
    </div>
  );
}
