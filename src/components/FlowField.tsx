"use client";

import { useEffect, useRef } from "react";

export default function FlowField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let W: number = window.innerWidth;
    let H: number = window.innerHeight;
    const particles: {
      x: number;
      y: number;
      px: number;
      py: number;
      life: number;
    }[] = [];
    const mouse = { x: -9999, y: -9999 };
    const N = 320;

    function resize() {
      W = canvas!.width = window.innerWidth;
      H = canvas!.height = window.innerHeight;
      ctx!.fillStyle = "#FAFAF7";
      ctx!.fillRect(0, 0, W, H);
    }

    window.addEventListener("resize", resize);
    resize();

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    const handleMouseLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length) {
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("touchmove", handleTouchMove, { passive: true });

    function spawn(p: (typeof particles)[0]) {
      p.x = Math.random() * W;
      p.y = Math.random() * H;
      p.px = p.x;
      p.py = p.y;
      p.life = 60 + Math.random() * 180;
      return p;
    }

    for (let i = 0; i < N; i++)
      particles.push(spawn({ x: 0, y: 0, px: 0, py: 0, life: 0 }));

    let t = 0;
    let animId: number;

    function angleAt(x: number, y: number, t: number) {
      const s = 0.0016;
      return (
        Math.sin(x * s + t * 0.0006) * 1.6 +
        Math.cos(y * s * 1.3 - t * 0.0004) * 1.4 +
        Math.sin((x + y) * s * 0.6 + t * 0.0003) * 1.2
      );
    }

    function frame() {
      t++;
      ctx!.fillStyle = "rgba(250,250,247,0.045)";
      ctx!.fillRect(0, 0, W, H);
      ctx!.lineWidth = 1;

      for (const p of particles) {
        const a = angleAt(p.x, p.y, t);
        let vx = Math.cos(a) * 1.15;
        let vy = Math.sin(a) * 1.15;

        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 32400) {
          const d = Math.sqrt(d2) || 1;
          const f = (1 - d / 180) * 2.6;
          vx += (dx / d) * f;
          vy += (dy / d) * f;
        }

        p.px = p.x;
        p.py = p.y;
        p.x += vx;
        p.y += vy;
        p.life--;

        if (
          p.life <= 0 ||
          p.x < -10 ||
          p.x > W + 10 ||
          p.y < -10 ||
          p.y > H + 10
        ) {
          spawn(p);
          continue;
        }

        const near = d2 < 48000;
        ctx!.strokeStyle = near
          ? "rgba(39,67,208,0.20)"
          : "rgba(39,67,208,0.075)";
        ctx!.beginPath();
        ctx!.moveTo(p.px, p.py);
        ctx!.lineTo(p.x, p.y);
        ctx!.stroke();
      }

      animId = requestAnimationFrame(frame);
    }

    if (reduced) {
      ctx.fillStyle = "#FAFAF7";
      ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 900; i++) {
        const x = Math.random() * W;
        const y = Math.random() * H;
        const a = angleAt(x, y, 0);
        ctx.strokeStyle = "rgba(39,67,208,0.05)";
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(a) * 22, y + Math.sin(a) * 22);
        ctx.stroke();
      }
    } else {
      frame();
    }

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("touchmove", handleTouchMove);
      if (animId) cancelAnimationFrame(animId);
    };
  }, []);

  return <canvas id="flow" ref={canvasRef} aria-hidden="true" />;
}
