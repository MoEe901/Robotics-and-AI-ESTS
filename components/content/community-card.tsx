"use client";

import type { CSSProperties } from "react";
import { Link as LinkIcon, Mail as MailIcon } from "lucide-react";

import type {
  ApplyCommunityAction,
  ApplyCommunityColor,
  ApplyCommunityConfig,
  ApplyCommunityPlatform,
} from "@/lib/firebase/types";

type GlyphProps = { className?: string };

function DiscordGlyph({ className = "size-5" }: GlyphProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.37-.444.853-.608 1.23a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.23A.077.077 0 0 0 8.562 2.85 19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.098 13.098 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.292a.074.074 0 0 1 .077-.01c3.927 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.099.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.673-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418Z" />
    </svg>
  );
}

function WhatsAppGlyph({ className = "size-5" }: GlyphProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.247-.694.247-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.002-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0 0 20.464 3.488" />
    </svg>
  );
}

function TelegramGlyph({ className = "size-5" }: GlyphProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248-1.97 9.269c-.146.658-.537.818-1.084.51l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.243-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.458c.538-.196 1.006.128.832.95z" />
    </svg>
  );
}

function SlackGlyph({ className = "size-5" }: GlyphProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zm10.122 2.521a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zm-1.268 0a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zm-2.523 10.122a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zm0-1.268a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
    </svg>
  );
}

function SignalGlyph({ className = "size-5" }: GlyphProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M9.8 1.2 10.3 3A9.5 9.5 0 0 0 5 4.4l-.7-.7A9.3 9.3 0 0 0 2.6 5.9l-.7-.7A9.5 9.5 0 0 0 1.1 8l1.8.6A9.8 9.8 0 0 0 3 11H1v2h2c0 .8.1 1.5.3 2.2L1.5 16a9.5 9.5 0 0 0 1 2.8l.8-.7a9.3 9.3 0 0 0 1.5 1.6l-.7.7a9.5 9.5 0 0 0 2.8 1.2l.3-1.8a10 10 0 0 0 2.4.3v2h2v-2a10 10 0 0 0 2.4-.3l.6 1.9a9.5 9.5 0 0 0 2.8-1.2l-.7-.8a9.3 9.3 0 0 0 1.6-1.5l.7.7a9.5 9.5 0 0 0 1.2-2.8l-1.8-.6a9.8 9.8 0 0 0 .3-2.2h2v-2h-2a10 10 0 0 0-.3-2.2l1.8-.5a9.5 9.5 0 0 0-1.2-2.8l-.7.7a9.3 9.3 0 0 0-1.6-1.6l.7-.7a9.5 9.5 0 0 0-2.8-1.2l-.5 1.8A10 10 0 0 0 13 3V1h-2v2a10 10 0 0 0-2.4.3L8.2 1.5A9.5 9.5 0 0 0 5.4 2.8l.7.7A9.3 9.3 0 0 0 4.5 5l-.8-.8A9.5 9.5 0 0 0 9.8 1.2z" />
    </svg>
  );
}

function MessengerGlyph({ className = "size-5" }: GlyphProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 0C5.373 0 0 4.975 0 11.111c0 3.497 1.744 6.616 4.472 8.652V24l4.086-2.242c1.09.301 2.246.464 3.442.464 6.627 0 12-4.974 12-11.111C24 4.975 18.627 0 12 0zm1.191 14.963-3.055-3.26-5.963 3.26L10.732 8l3.131 3.26L19.752 8l-6.561 6.963z" />
    </svg>
  );
}

function InstagramGlyph({ className = "size-5" }: GlyphProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function LinkedInGlyph({ className = "size-5" }: GlyphProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

function TwitterGlyph({ className = "size-5" }: GlyphProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function PlatformIcon({ platform, className }: { platform: ApplyCommunityPlatform; className?: string }) {
  switch (platform) {
    case "discord":
      return <DiscordGlyph className={className} />;
    case "whatsapp":
      return <WhatsAppGlyph className={className} />;
    case "telegram":
      return <TelegramGlyph className={className} />;
    case "slack":
      return <SlackGlyph className={className} />;
    case "signal":
      return <SignalGlyph className={className} />;
    case "messenger":
      return <MessengerGlyph className={className} />;
    case "instagram":
      return <InstagramGlyph className={className} />;
    case "linkedin":
      return <LinkedInGlyph className={className} />;
    case "twitter":
      return <TwitterGlyph className={className} />;
    case "email":
      return <MailIcon className={className} />;
    case "generic":
    default:
      return <LinkIcon className={className} />;
  }
}

const BUTTON_STYLES: Record<Exclude<ApplyCommunityColor, "custom">, string> = {
  indigo:
    "bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_10px_30px_-12px_rgba(99,102,241,0.6)]",
  emerald:
    "bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_10px_30px_-12px_rgba(16,185,129,0.6)]",
  sky:
    "bg-sky-600 hover:bg-sky-500 text-white shadow-[0_10px_30px_-12px_rgba(14,165,233,0.6)]",
  violet:
    "bg-violet-600 hover:bg-violet-500 text-white shadow-[0_10px_30px_-12px_rgba(139,92,246,0.6)]",
  cyan:
    "bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_10px_30px_-12px_rgba(6,182,212,0.6)]",
  rose:
    "bg-rose-600 hover:bg-rose-500 text-white shadow-[0_10px_30px_-12px_rgba(244,63,94,0.6)]",
  amber:
    "bg-amber-500 hover:bg-amber-400 text-black shadow-[0_10px_30px_-12px_rgba(245,158,11,0.6)]",
  white:
    "bg-white hover:bg-slate-100 text-black shadow-[0_10px_30px_-12px_rgba(255,255,255,0.3)]",
  blue:
    "bg-blue-600 hover:bg-blue-500 text-white shadow-[0_10px_30px_-12px_rgba(37,99,235,0.6)]",
  teal:
    "bg-teal-600 hover:bg-teal-500 text-white shadow-[0_10px_30px_-12px_rgba(13,148,136,0.6)]",
  green:
    "bg-green-600 hover:bg-green-500 text-white shadow-[0_10px_30px_-12px_rgba(22,163,74,0.6)]",
  lime:
    "bg-lime-500 hover:bg-lime-400 text-black shadow-[0_10px_30px_-12px_rgba(132,204,22,0.6)]",
  orange:
    "bg-orange-500 hover:bg-orange-400 text-black shadow-[0_10px_30px_-12px_rgba(249,115,22,0.6)]",
  red:
    "bg-red-600 hover:bg-red-500 text-white shadow-[0_10px_30px_-12px_rgba(220,38,38,0.6)]",
  pink:
    "bg-pink-600 hover:bg-pink-500 text-white shadow-[0_10px_30px_-12px_rgba(219,39,119,0.6)]",
  fuchsia:
    "bg-fuchsia-600 hover:bg-fuchsia-500 text-white shadow-[0_10px_30px_-12px_rgba(192,38,211,0.6)]",
  purple:
    "bg-purple-600 hover:bg-purple-500 text-white shadow-[0_10px_30px_-12px_rgba(147,51,234,0.6)]",
  slate:
    "bg-slate-700 hover:bg-slate-600 text-white shadow-[0_10px_30px_-12px_rgba(51,65,85,0.6)]",
  black:
    "bg-black hover:bg-neutral-900 text-white shadow-[0_10px_30px_-12px_rgba(0,0,0,0.8)]",
};

/**
 * Real brand colors for the top icon strip. The button color stays
 * admin-configurable, but the icon row is always brand-accurate so it
 * reads as "logos of the communities we're on".
 */
const PLATFORM_BRAND_COLOR: Record<ApplyCommunityPlatform, string> = {
  discord: "#5865F2",
  whatsapp: "#25D366",
  telegram: "#29B6F6",
  slack: "#36C5F0",
  signal: "#3A76F0",
  messenger: "#0084FF",
  instagram: "#E4405F",
  linkedin: "#0A66C2",
  twitter: "#ffffff",
  email: "#94A3B8",
  generic: "#CBD5E1",
};

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

function normalizeHex(hex: string): string | null {
  if (!hex || !HEX_RE.test(hex)) return null;
  if (hex.length === 4) {
    const [, r, g, b] = hex;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return hex.toLowerCase();
}

function textColorForHex(hex: string): "#ffffff" | "#000000" {
  const c = hex.replace("#", "");
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.62 ? "#000000" : "#ffffff";
}

function hexWithAlpha(hex: string, alpha: number): string {
  const c = hex.replace("#", "");
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function resolveButtonStyle(action: ApplyCommunityAction): {
  className: string;
  style?: CSSProperties;
} {
  if (action.color === "custom") {
    const hex = normalizeHex(action.customHex ?? "");
    if (hex) {
      return {
        className:
          "text-[var(--cb-fg)] [background:var(--cb-bg)] hover:[background:var(--cb-bg-hover)] transition-colors",
        style: {
          ["--cb-bg" as string]: hex,
          ["--cb-bg-hover" as string]: hexWithAlpha(hex, 0.88),
          ["--cb-fg" as string]: textColorForHex(hex),
          boxShadow: `0 10px 30px -12px ${hexWithAlpha(hex, 0.6)}`,
        } as CSSProperties,
      };
    }
    return { className: BUTTON_STYLES.violet };
  }
  return { className: BUTTON_STYLES[action.color] };
}


export function CommunityCard({ config }: { config: ApplyCommunityConfig }) {
  if (!config.isVisible) return null;

  const actions = (config.actions ?? [])
    .filter((a) => a.isVisible && a.label.trim().length > 0)
    .sort((a, b) => a.order - b.order);

  if (actions.length === 0) return null;

  return (
    <div className="apply-fade-4 mt-10 w-full max-w-[720px]">
      <div className="relative overflow-hidden rounded-3xl border border-violet-500/15 bg-[#0d0f1a] px-6 py-10 text-center shadow-[0_40px_100px_rgba(124,58,237,0.12)] md:px-10 md:py-12">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-400"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -top-24 left-1/2 size-[280px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.14)_0%,transparent_70%)]"
          aria-hidden
        />

        <IconStrip actions={actions} />

        {config.eyebrow.trim() ? (
          <p className="font-jetbrains mb-3 text-[10px] font-medium uppercase tracking-[0.22em] text-cyan-400/80">
            {config.eyebrow}
          </p>
        ) : null}

        <h3 className="font-syne text-[clamp(1.75rem,5vw,2.5rem)] font-extrabold leading-[1.05] tracking-tight text-white">
          <span className="block">{config.titleLine}</span>
          <span className="hero-title-grad block">{config.titleAccent}</span>
        </h3>

        {config.description.trim() ? (
          <p className="mx-auto mt-5 max-w-[520px] text-[14px] font-light leading-[1.75] text-slate-400">
            {config.description}
          </p>
        ) : null}

        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          {actions.map((action) => (
            <CommunityButton key={action.id} action={action} />
          ))}
        </div>
      </div>
    </div>
  );
}

function IconStrip({ actions }: { actions: ApplyCommunityAction[] }) {
  if (actions.length === 0) return null;
  return (
    <div className="mb-8 flex items-center justify-center gap-5 md:gap-7">
      {actions.map((a, i) => {
        const brandColor = PLATFORM_BRAND_COLOR[a.platform] ?? "#CBD5E1";
        return (
          <span key={a.id} className="flex items-center gap-5 md:gap-7">
            {i > 0 ? <span className="h-14 w-px bg-white/20 md:h-16" aria-hidden /> : null}
            <span
              className="inline-flex items-center"
              style={{
                color: brandColor,
                filter: `drop-shadow(0 6px 22px ${hexWithAlpha(brandColor, 0.35)})`,
              }}
              aria-hidden
            >
              <PlatformIcon
                platform={a.platform}
                className="size-14 md:size-16"
              />
            </span>
          </span>
        );
      })}
    </div>
  );
}

function CommunityButton({ action }: { action: ApplyCommunityAction }) {
  const style = resolveButtonStyle(action);
  const cls = `inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-transform duration-300 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${style.className}`;
  const content = (
    <>
      <PlatformIcon platform={action.platform} className="size-4" />
      <span>{action.label}</span>
    </>
  );

  const safeUrl = action.url.trim();
  if (!safeUrl) {
    return (
      <button
        type="button"
        className={`${cls} cursor-not-allowed opacity-60`}
        style={style.style}
        disabled
        aria-disabled
      >
        {content}
      </button>
    );
  }

  const isExternal = /^https?:\/\//i.test(safeUrl);
  const isMail = safeUrl.toLowerCase().startsWith("mailto:");
  return (
    <a
      href={safeUrl}
      className={cls}
      style={style.style}
      {...(isExternal && !isMail ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {content}
    </a>
  );
}

export { PlatformIcon as CommunityPlatformIcon };
