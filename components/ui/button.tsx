"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { useRef, type ButtonHTMLAttributes, type PointerEvent } from "react";

const buttonVariants = cva(
  [
    "relative inline-flex items-center justify-center overflow-hidden",
    "rounded-full px-6 py-3 text-sm font-semibold",
    "outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-violet-400",
    "select-none",
    // Motion tokens via CSS vars (set in globals.css)
    "transition-[transform,box-shadow,background-color,opacity]",
    "duration-[var(--motion-dur-normal)] ease-[var(--motion-ease-lux)]",
    "hover:-translate-y-px active:translate-y-0 active:scale-[0.975]",
  ],
  {
    variants: {
      variant: {
        primary: [
          "bg-blue-500 text-white",
          "shadow-[0_0_30px_rgba(27,110,200,0.45)]",
          "hover:bg-blue-400 hover:shadow-[0_0_44px_rgba(27,110,200,0.62)]",
        ],
        ghost: [
          "border border-white/35 bg-white/10 text-white backdrop-blur-md",
          "hover:bg-white/18 hover:border-white/50",
        ],
        cta: [
          "btn-shine bg-gradient-to-br from-violet-600 to-cyan-500 text-white",
          "shadow-[0_0_22px_rgba(124,58,237,0.38)]",
          "hover:shadow-[0_0_38px_rgba(124,58,237,0.58)]",
        ],
        outline: [
          "border border-violet-500/30 bg-transparent text-violet-300",
          "hover:border-violet-500/60 hover:bg-violet-500/[0.07]",
        ],
      },
    },
    defaultVariants: { variant: "primary" },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export function Button({ className, variant, onPointerDown, ...props }: ButtonProps) {
  const btnRef = useRef<HTMLButtonElement>(null);

  function handleRipple(e: PointerEvent<HTMLButtonElement>) {
    const btn = btnRef.current;
    if (!btn) return;
    // Remove existing ripples
    btn.querySelectorAll(".btn-ripple").forEach((el) => el.remove());

    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top  - size / 2;

    const span = document.createElement("span");
    span.className = "btn-ripple";
    span.style.cssText = [
      `width:${size}px`,
      `height:${size}px`,
      `left:${x}px`,
      `top:${y}px`,
    ].join(";");
    btn.appendChild(span);

    span.addEventListener("animationend", () => span.remove(), { once: true });
    onPointerDown?.(e);
  }

  return (
    <button
      ref={btnRef}
      className={cn(buttonVariants({ variant }), className)}
      onPointerDown={handleRipple}
      {...props}
    />
  );
}
