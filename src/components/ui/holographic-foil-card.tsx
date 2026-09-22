"use client";

import React, { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

export interface HolographicFoilCardProps {
  name?: string;
  set?: string;
  number?: string;
  className?: string;
  tag?: string;
  content?: string;
  date?: string;
  children?: React.ReactNode;
}

export function HolographicFoilCard({
  name = "VIP MEMO",
  set = "HOLO EDITION",
  number = "001 / POST-IT",
  className = "",
  tag = "PRIORITY",
  content,
  date,
  children,
}: HolographicFoilCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const spring = { stiffness: 180, damping: 18, mass: 0.6 };
  const sx = useSpring(mx, spring);
  const sy = useSpring(my, spring);
  const rotateY = useTransform(sx, [-0.5, 0.5], [-18, 18]);
  const rotateX = useTransform(sy, [-0.5, 0.5], [16, -16]);
  const glareX = useTransform(sx, [-0.5, 0.5], ["0%", "100%"]);
  const glareY = useTransform(sy, [-0.5, 0.5], ["0%", "100%"]);
  const foil = useTransform([sx, sy], ([x, y]) => {
    const px = ((Number(x) + 0.5) * 100).toFixed(1);
    const py = ((Number(y) + 0.5) * 100).toFixed(1);
    return `linear-gradient(${Number(x) * 80 + 120}deg, rgba(255,80,180,0.0) 20%, rgba(80,220,255,0.45) 45%, rgba(255,220,80,0.4) 58%, rgba(180,80,255,0.35) 72%, transparent 88%), radial-gradient(circle at ${px}% ${py}%, rgba(255,255,255,0.55), transparent 42%)`;
  });

  const onMove = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onLeave = () => {
    mx.set(0);
    my.set(0);
  };

  return (
    <div
      className={`relative flex items-center justify-center ${className}`}
      style={{ perspective: 1200 }}
    >
      <motion.div
        ref={ref}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="relative h-[380px] w-[280px] sm:h-[420px] sm:w-[300px] cursor-grab active:cursor-grabbing select-none"
      >
        <div className="absolute inset-0 rounded-[22px] bg-gradient-to-br from-amber-200 via-purple-300 to-cyan-400 p-[2px] shadow-[0_20px_40px_rgba(0,0,0,0.35)]">
          <div className="relative h-full w-full overflow-hidden rounded-[20px] bg-[#111118]">
            <motion.div
              className="absolute inset-0 mix-blend-color-dodge opacity-80 pointer-events-none"
              style={{ backgroundImage: foil }}
            />
            <div
              className="absolute inset-0 opacity-30 mix-blend-overlay pointer-events-none"
              style={{
                backgroundImage:
                  "repeating-conic-gradient(from 0deg, transparent 0deg 8deg, rgba(255,255,255,0.15) 8deg 9deg)",
              }}
            />
            <motion.div
              className="pointer-events-none absolute h-40 w-40 rounded-full bg-white/30 blur-2xl"
              style={{ left: glareX, top: glareY, x: "-50%", y: "-50%" }}
            />
            <div className="relative z-10 flex h-full flex-col justify-between p-5 text-white">
              <div className="flex items-start justify-between font-mono text-[10px] tracking-[0.2em] text-white/70">
                <span className="bg-white/10 px-2 py-0.5 rounded backdrop-blur-sm">{set}</span>
                <span>{number}</span>
              </div>

              {children ? (
                children
              ) : (
                <div className="flex flex-col flex-1 my-3 justify-center">
                  <div className="mb-3 p-3 rounded-xl border border-white/15 bg-white/5 backdrop-blur-sm">
                    <span className="text-[10px] font-mono tracking-widest text-amber-300 uppercase block mb-1">
                      ✦ {tag} ✦
                    </span>
                    <p className="text-sm font-handwriting text-zinc-100 text-lg leading-snug line-clamp-4">
                      {content || "Never forget this critical mission! Holographic post-it card with premium dynamic foil lighting."}
                    </p>
                  </div>
                  <h2 className="font-mono text-xl sm:text-2xl font-black tracking-tight text-white line-clamp-1">{name}</h2>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.25em] text-cyan-200/90">
                    Holographic Rare Post-it
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between font-mono text-[10px] text-white/60 pt-2 border-t border-white/10">
                <span>{date || "2026 ACTIVE"}</span>
                <span className="px-1.5 py-0.5 rounded bg-cyan-400/20 text-cyan-300 text-[9px] font-semibold tracking-wider">FOIL ✦ ULTRA</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default HolographicFoilCard;
