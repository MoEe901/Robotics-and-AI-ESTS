"use client";

import { Bebas_Neue, DM_Sans } from "next/font/google";
import {
  ArrowLeft,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Lightbulb,
  MapPin,
  Share2,
  Sparkles,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";

import { subscribeToPublishedEventBySlugOrId } from "@/lib/firebase/realtime";
import type { EventItem } from "@/lib/firebase/types";
import {
  accentFromHex,
  inferAccentPreset,
  presetAccent,
  splitHeroTitle,
} from "@/lib/events/event-page-accent";
import { eventLocationHref, formatEventDate, youtubeEmbedSrc } from "@/lib/events/public";
import { parseWebsiteCtaHex } from "@/lib/events/website-cta-color";
import { useLanguage, translateCms } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

const FALLBACK = "/fallback.jpg";

const fontDisplay = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const fontSans = DM_Sans({
  weight: ["300", "400", "500"],
  subsets: ["latin"],
  display: "swap",
});

type Props = {
  pathSegment: string;
};

type GalleryItem = NonNullable<EventItem["gallery"]>[number];

function coverSrc(imageUrl: string | null | undefined): string {
  if (imageUrl && imageUrl.trim()) return imageUrl.trim();
  return FALLBACK;
}

function formatDateLabel(date?: string): string {
  return formatEventDate(date, {
    formatOptions: { month: "long", day: "numeric", year: "numeric" },
  });
}

function formatTimeLabel(date?: string): string | null {
  if (!date?.trim()) return null;
  const raw = date.trim();
  if (raw.length <= 10 && !raw.includes("T")) return null;
  const t = Date.parse(raw);
  if (Number.isNaN(t)) return null;
  const d = new Date(t);
  if (d.getHours() === 0 && d.getMinutes() === 0 && d.getSeconds() === 0) {
    if (!raw.includes("T")) return null;
  }
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function firstParagraph(text: string): { lead: string; rest: string } {
  const t = text.trim();
  if (!t) return { lead: "", rest: "" };
  const parts = t.split(/\n\n+/);
  if (parts.length > 1) return { lead: parts[0]!.trim(), rest: parts.slice(1).join("\n\n").trim() };
  if (t.length <= 360) return { lead: t, rest: "" };
  const cut = t.slice(0, 320).lastIndexOf(" ");
  const idx = cut > 120 ? cut : 320;
  return { lead: t.slice(0, idx).trim() + "…", rest: t.slice(idx).trim() };
}

export function EventDocumentaryPageClient({ pathSegment }: Props) {
  const { t, locale } = useLanguage();
  const isFr = locale !== "en";
  const [event, setEvent] = useState<EventItem | null | undefined>(undefined);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());

  /* Lifted to top-level so the keyboard navigation effect and the openMedia
     helper can both index into the same filtered list the lightbox renders. */
  const gallery = useMemo<GalleryItem[]>(
    () =>
      (event?.gallery ?? []).filter(
        (g) => (g.visible === undefined || g.visible === true) && g.url.trim(),
      ),
    [event?.gallery],
  );

  const openMediaAt = useCallback(
    (item: GalleryItem | null | undefined) => {
      if (!item) return;
      const idx = gallery.findIndex((g) => g.url === item.url && g.kind === item.kind);
      if (idx >= 0) setSelectedIndex(idx);
    },
    [gallery],
  );

  const stepMedia = useCallback(
    (delta: number) => {
      setSelectedIndex((prev) => {
        if (prev == null || gallery.length === 0) return prev;
        const next = (prev + delta + gallery.length) % gallery.length;
        return next;
      });
    },
    [gallery.length],
  );

  useEffect(() => {
    const unsub = subscribeToPublishedEventBySlugOrId(
      pathSegment,
      (row) => setEvent(row),
      () => {},
    );
    return () => unsub();
  }, [pathSegment]);

  // Update browser tab title with locale-aware text
  // Use setTimeout to override Next.js server metadata after React reconciliation
  useEffect(() => {
    if (event === undefined || event === null) return;
    const suffix = isFr ? "Club Robotique & IA" : "Robotics & AI Club";
    const title = `${event.title} | ${suffix}`;
    document.title = title;
    const t = setTimeout(() => { document.title = title; }, 100);
    return () => clearTimeout(t);
  }, [event, isFr]);

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useLayoutEffect(() => {
    if (event === undefined || event === null) return;
    if (typeof window === "undefined" || window.location.hash !== "#documentary") return;
    const el = document.getElementById("documentary");
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    });
  }, [event]);

  useEffect(() => {
    if (selectedIndex == null) return;
    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") setSelectedIndex(null);
      else if (ev.key === "ArrowRight") stepMedia(1);
      else if (ev.key === "ArrowLeft") stepMedia(-1);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedIndex, stepMedia]);

  useEffect(() => {
    const preloadGallery =
      event?.gallery?.filter((g) => (g.visible === undefined || g.visible === true) && g.url.trim()) ?? [];
    if (!preloadGallery.length) return;
    const priorityGallery = preloadGallery.slice(0, 2);
    const links: HTMLLinkElement[] = [];
    const images: HTMLImageElement[] = [];

    for (const item of priorityGallery) {
      if (item.kind === "image") {
        const img = new window.Image();
        img.decoding = "async";
        img.loading = "eager";
        img.src = item.url;
        images.push(img);
        continue;
      }

      const embed = youtubeEmbedSrc(item.url);
      if (embed) continue;

      const preload = document.createElement("link");
      preload.rel = "preload";
      preload.as = "video";
      preload.href = item.url;
      document.head.appendChild(preload);
      links.push(preload);
    }

    return () => {
      for (const l of links) l.remove();
      images.length = 0;
    };
  }, [event?.gallery]);

  const sharePage = useCallback(async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) {
        await navigator.share({ title: event?.title ?? "Event", url });
        return;
      }
    } catch {
      /* ignore */
    }
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      /* ignore */
    }
  }, [event]);

  const targetDate = useMemo(() => {
    if (event === undefined || event === null) return null;
    if (!event.date?.trim()) return null;
    const d = new Date(event.date);
    return Number.isNaN(d.getTime()) ? null : d;
  }, [event]);

  const countdown = useMemo(() => {
    if (!targetDate) return { days: 0, hours: 0, mins: 0, secs: 0, past: true };
    const end = targetDate.getTime();
    if (end <= nowMs) return { days: 0, hours: 0, mins: 0, secs: 0, past: true };
    const diff = end - nowMs;
    return {
      days: Math.floor(diff / 86400000),
      hours: Math.floor((diff % 86400000) / 3600000),
      mins: Math.floor((diff % 3600000) / 60000),
      secs: Math.floor((diff % 60000) / 1000),
      past: false,
    };
  }, [targetDate, nowMs]);

  if (event === undefined) {
    return (
      <p
        className={cn(
          "mx-auto w-[min(94%,720px)] px-4 pb-24 pt-28 text-sm text-[#6b6a80]",
          fontSans.className,
        )}
      >
        {t.eventPage.loading}
      </p>
    );
  }

  if (event === null) {
    return (
      <div className={cn("mx-auto w-[min(94%,720px)] px-4 pb-24 pt-28", fontSans.className)}>
        <p className="text-sm text-[#6b6a80]">{t.eventPage.notFound}</p>
        <Link
          href="/#events"
          className="mt-6 inline-block text-sm text-sky-400 hover:text-sky-300"
        >
          {t.eventPage.backToEvents}
        </Link>
      </div>
    );
  }

  const slug = event.slug?.current ?? event._id;
  const narrative = isFr
    ? (event.documentaryFr?.trim() || event.descriptionFr?.trim() ||
       event.documentary?.trim() || event.description?.trim() || "")
    : (event.documentary?.trim() || event.description?.trim() || "");
  const { lead: leadParagraph, rest: restNarrative } = firstParagraph(narrative);
  const teaserFallback = isFr
    ? "Rejoignez le Club Robotique & IA pour une expérience conçue pour les curieux — détails, médias et liens disponibles sur cette page."
    : "Join the Robotics & AI Club for an experience built for curious builders — details, media, and links live on this page.";
  const teaser = leadParagraph || teaserFallback;

  const mapsHref = eventLocationHref(event.location, event.locationMapsUrl);
  const attachments =
    event.attachments?.filter(
      (a) => (a.visible === undefined || a.visible === true) && a.label.trim() && a.url.trim(),
    ) ?? [];
  /* gallery is computed via useMemo at component top-level; reuse it here. */
  const websiteUrl = event.eventWebsiteUrl?.trim() ?? "";
  const showWebsiteCta = Boolean(websiteUrl) && event.showEventWebsite !== false;
  const customHex = parseWebsiteCtaHex(event.eventWebsiteButtonColor);
  const preset = inferAccentPreset(event.title, slug);
  const accent = customHex ? accentFromHex(customHex) : presetAccent(preset);

  const heroStyle = {
    "--ev-accent": accent.hex,
    "--ev-accent-dim": accent.dim,
    "--ev-accent-border": accent.border,
  } as React.CSSProperties;

  const { line1, line2 } = splitHeroTitle(event.title);
  const timePill = formatTimeLabel(event.date);
  const imageGallery = gallery.filter((g) => g.kind === "image");
  /* The 3-up grid only renders images; videos and other kinds are listed
     separately below. So the "+N more" badge must reflect images we hid,
     not the total gallery length, otherwise the count is misleading. */
  const moreGalleryCount = Math.max(0, imageGallery.length - 3);
  const selectedItem = selectedIndex != null ? gallery[selectedIndex] ?? null : null;

  const heroCoverUrl = coverSrc(event.imageUrl);
  const heroBgPosX = event.imageFocusX ?? 50;
  /** Default slightly toward the top so portraits do not look "cut off" under the header. */
  const heroBgPosY = event.imageFocusY ?? 18;

  const countdownCells = [
    { v: countdown.days, l: t.eventPage.days },
    { v: countdown.hours, l: t.eventPage.hours },
    { v: countdown.mins, l: t.eventPage.minutes },
    { v: countdown.secs, l: t.eventPage.seconds },
  ];

  return (
    <div
      className={cn(
        "event-theme-root min-h-screen bg-[#09090f] text-[#f0eff5]",
        showWebsiteCta && "pb-24 md:pb-0",
        fontSans.className,
      )}
      style={heroStyle}
    >
      <style>{`
        .event-theme-root {
          --border: rgba(255,255,255,0.07);
          --border2: rgba(255,255,255,0.13);
          --muted: #6b6a80;
        }
        @keyframes ev-fade-up {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes ev-fade-down {
          from { opacity: 0; transform: translateY(-12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes ev-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .event-hero-bg {
          background: #0e0e18;
        }
        .event-hero-bg::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            radial-gradient(circle at 70% 50%, var(--ev-accent-dim) 0%, transparent 55%),
            radial-gradient(circle at 20% 80%, rgba(255,255,255,0.02) 0%, transparent 40%);
        }
        .event-hero-bg::after {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(var(--border) 1px, transparent 1px),
            linear-gradient(90deg, var(--border) 1px, transparent 1px);
          background-size: 64px 64px;
          mask-image: radial-gradient(ellipse at 70% 40%, black 0%, transparent 65%);
          opacity: 0.5;
        }
      `}</style>

      {/* Hero: pt clears fixed Navbar; bg layers fill full hero including that inset so art reaches the viewport top. */}
      <div className="event-hero-wrapper relative grid min-h-[min(92vh,920px)] grid-rows-[auto_1fr_auto] pt-24 md:pt-28">
        <div className="event-hero-bg pointer-events-none absolute inset-0" aria-hidden />
        <div
          className="pointer-events-none absolute inset-0 z-[1] bg-cover bg-no-repeat opacity-[0.14] blur-[2px] [background-attachment:scroll] md:[background-attachment:fixed]"
          style={{
            backgroundImage: `url(${JSON.stringify(heroCoverUrl)})`,
            backgroundPosition: `${heroBgPosX}% ${heroBgPosY}%`,
          }}
          aria-hidden
        />

        <nav
          className="relative z-10 flex items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-4 sm:gap-4 sm:px-8 md:px-12 lg:px-14"
          style={{ animation: "ev-fade-down 0.6s ease both" }}
        >
          <Link
            href="/#events"
            className="inline-flex min-w-0 flex-1 items-center gap-2 text-xs text-[var(--muted)] transition hover:text-[#f0eff5]"
          >
            <ArrowLeft className="size-3.5 shrink-0" strokeWidth={2} />
            <span className="truncate">{t.eventPage.allEvents}</span>
          </Link>
          <div className="flex shrink-0 flex-nowrap items-center gap-2">
            <button
              type="button"
              onClick={() => void sharePage()}
              className="inline-flex items-center gap-1.5 rounded-[10px] border border-[var(--border2)] bg-white/[0.04] px-3 py-2 text-xs text-[#f0eff5] transition hover:bg-white/[0.08] sm:px-4"
            >
              <Share2 className="size-3.5 shrink-0" strokeWidth={2} />
              {t.eventPage.share}
            </button>
            {showWebsiteCta ? (
              <a
                href={websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-[10px] border border-transparent px-3 py-2 text-xs font-medium text-white transition hover:opacity-90 sm:px-4"
                style={{ backgroundColor: "var(--ev-accent)" }}
              >
                <Sparkles className="size-3.5 shrink-0" strokeWidth={2} />
                {t.eventPage.register}
              </a>
            ) : (
              <a
                href="#register"
                className="inline-flex items-center gap-1.5 rounded-[10px] border border-transparent px-3 py-2 text-xs font-medium text-white transition hover:opacity-90 sm:px-4"
                style={{ backgroundColor: "var(--ev-accent)" }}
              >
                <ChevronDown className="size-3.5 shrink-0" strokeWidth={2} />
                {t.eventPage.details}
              </a>
            )}
          </div>
        </nav>

        <div className="relative z-[2] flex max-w-[760px] flex-col justify-center px-5 pb-4 pt-8 sm:px-8 md:px-12 lg:px-14 lg:pt-4">
          <div
            className="mb-6 inline-flex flex-wrap items-center gap-2"
            style={{ animation: "ev-fade-up 0.6s ease both 0.1s" }}
          >
            <span
              className="rounded-full border px-3.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em]"
              style={{
                background: "var(--ev-accent-dim)",
                borderColor: "var(--ev-accent-border)",
                color: "var(--ev-accent)",
              }}
            >
              {event.isFeatured ? t.eventPage.featuredEvent : t.eventPage.event}
            </span>
            <span className="flex items-center gap-1.5 text-[11px] text-[var(--muted)]">
              <span
                className="size-1.5 rounded-full"
                style={{ background: "var(--ev-accent)", animation: "ev-blink 2s ease-in-out infinite" }}
              />
              {showWebsiteCta ? t.eventPage.registrationOnExternalSite : t.eventPage.clubEvent}
            </span>
          </div>

          <h1
            className={cn(
              "mb-6 text-[clamp(3.5rem,9vw,6.75rem)] leading-[0.92] tracking-[0.01em] text-[#f0eff5]",
              fontDisplay.className,
            )}
            style={{ animation: "ev-fade-up 0.7s ease both 0.18s" }}
          >
            {line1}
            {line2 ? (
              <>
                <br />
                <span style={{ color: "var(--ev-accent)" }}>{line2}</span>
              </>
            ) : null}
          </h1>

          <p
            className="mb-10 max-w-[540px] text-base font-light leading-[1.75] text-[#f0eff5]/65"
            style={{ animation: "ev-fade-up 0.7s ease both 0.26s" }}
          >
            {teaser}
          </p>

          <div
            className="mb-10 flex flex-wrap gap-2.5"
            style={{ animation: "ev-fade-up 0.7s ease both 0.32s" }}
          >
            <div className="inline-flex items-center gap-2 rounded-[10px] border border-[var(--border2)] bg-white/[0.04] px-4 py-2.5 text-[12.5px] text-[#f0eff5]">
              <Calendar className="size-3.5 shrink-0" strokeWidth={2} style={{ color: "var(--ev-accent)" }} />
              {formatDateLabel(event.date)}
            </div>
            {timePill ? (
              <div className="inline-flex items-center gap-2 rounded-[10px] border border-[var(--border2)] bg-white/[0.04] px-4 py-2.5 text-[12.5px] text-[#f0eff5]">
                <Clock className="size-3.5 shrink-0" strokeWidth={2} style={{ color: "var(--ev-accent)" }} />
                {timePill}
              </div>
            ) : null}
            {event.location?.trim() ? (
              <div className="inline-flex items-center gap-2 rounded-[10px] border border-[var(--border2)] bg-white/[0.04] px-4 py-2.5 text-[12.5px] text-[#f0eff5]">
                <MapPin className="size-3.5 shrink-0" strokeWidth={2} style={{ color: "var(--ev-accent)" }} />
                {mapsHref ? (
                  <a
                    href={mapsHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline decoration-white/20 underline-offset-2 hover:text-white"
                  >
                    {event.location.trim()}
                  </a>
                ) : (
                  event.location.trim()
                )}
              </div>
            ) : null}
          </div>

          <div
            className="flex flex-wrap gap-3"
            style={{ animation: "ev-fade-up 0.7s ease both 0.38s" }}
          >
            {showWebsiteCta ? (
              <a
                href={websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 rounded-xl border-0 px-7 py-3.5 text-sm font-medium text-white shadow-[0_6px_28px_rgba(0,0,0,0.3)] transition hover:-translate-y-0.5 hover:opacity-90"
                style={{ background: "var(--ev-accent)" }}
              >
                <Sparkles className="size-4" strokeWidth={2} />
                {t.eventPage.reserveYourSpot}
              </a>
            ) : null}
            <a
              href="#documentary"
              className="inline-flex items-center gap-2.5 rounded-xl border border-[var(--border2)] bg-white/[0.05] px-7 py-3.5 text-sm text-[#f0eff5] transition hover:border-white/20 hover:bg-white/[0.09]"
            >
              <ChevronDown className="size-4" strokeWidth={2} />
              {t.eventPage.readTheStory}
            </a>
          </div>
        </div>

        <div
          className="relative z-[2] grid grid-cols-2 border-t border-[var(--border)] sm:grid-cols-4"
          style={{ animation: "ev-fade-up 0.7s ease both 0.44s" }}
        >
          {countdown.past || !targetDate ? (
            <div className="col-span-full py-7 text-center text-sm text-[var(--muted)]">
              {!targetDate ? t.eventPage.dateTba : t.eventPage.eventPassed}
            </div>
          ) : (
            <>
              {countdownCells.map((cell) => (
                <div
                  key={cell.l}
                  className="flex flex-col items-center gap-1 border-[var(--border)] py-5 sm:border-r sm:py-6 sm:last:border-r-0"
                >
                  <span
                    className={cn("text-5xl leading-none tracking-[0.04em] sm:text-[48px]", fontDisplay.className)}
                    style={{ color: "var(--ev-accent)" }}
                  >
                    {String(cell.v).padStart(2, "0")}
                  </span>
                  <span className="text-[10px] font-light uppercase tracking-[0.14em] text-[var(--muted)]">
                    {cell.l}
                  </span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      <div className="overflow-x-hidden">
        {/* Body */}
        <div className="relative z-[1] mx-auto grid max-w-[1140px] items-start gap-10 px-5 py-12 sm:px-8 md:grid-cols-[1fr_280px] md:gap-12 md:px-12 lg:px-14 lg:py-[4.5rem]">
        <div className="flex min-w-0 flex-col gap-14 md:gap-16">
          {/* About */}
          <section id="documentary" className="scroll-mt-24">
            <p className="mb-6 flex items-center gap-3 text-[9px] font-semibold uppercase tracking-[0.26em] text-[var(--muted)]">
              <span className="h-px w-5 shrink-0" style={{ background: "var(--ev-accent)" }} />
              {t.eventPage.aboutTheEvent}
              <span className="h-px min-w-[2rem] flex-1 bg-[var(--border)]" />
            </p>
            {narrative ? (
              <div className="space-y-4 text-[15px] font-light leading-[1.85] text-[#f0eff5]/[0.72]">
                <p className="whitespace-pre-wrap">{leadParagraph}</p>
                <div
                  className="flex items-start gap-4 rounded-[14px] border p-5 md:p-6"
                  style={{
                    background: "var(--ev-accent-dim)",
                    borderColor: "var(--ev-accent-border)",
                  }}
                >
                  <div
                    className="flex size-9 shrink-0 items-center justify-center rounded-[10px]"
                    style={{
                      background: "var(--ev-accent-border)",
                      color: "var(--ev-accent)",
                    }}
                  >
                    <Lightbulb className="size-[17px]" strokeWidth={1.8} />
                  </div>
                  <p className="m-0 text-sm font-light leading-relaxed text-[#f0eff5]">
                    {t.eventPage.exploreFullStory}
                  </p>
                </div>
                {restNarrative ? (
                  <p className="whitespace-pre-wrap">{restNarrative}</p>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-[var(--muted)]">
                {t.eventPage.noStoryYet}
              </p>
            )}
          </section>

          {/* Program / resources */}
          {attachments.length > 0 ? (
            <section id="schedule">
              <p className="mb-6 flex items-center gap-3 text-[9px] font-semibold uppercase tracking-[0.26em] text-[var(--muted)]">
                <span className="h-px w-5 shrink-0" style={{ background: "var(--ev-accent)" }} />
                {t.eventPage.programAndResources}
                <span className="h-px min-w-[2rem] flex-1 bg-[var(--border)]" />
              </p>
              <div className="flex flex-col">
                {attachments.map((a, idx) => (
                  <div
                    key={`${a.label}-${a.url}`}
                    className="relative grid grid-cols-[72px_1fr] gap-0 sm:grid-cols-[80px_1fr]"
                  >
                    {idx < attachments.length - 1 ? (
                      <div
                        className="pointer-events-none absolute left-[39px] top-9 hidden h-[calc(100%-4px)] w-px bg-[var(--border)] sm:block"
                        aria-hidden
                      />
                    ) : null}
                    <div className="py-6 pr-4 pt-7 text-right text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--muted)] sm:pr-6">
                      {String(idx + 1).padStart(2, "0")}
                    </div>
                    <div className="relative border-l border-[var(--border)] py-5 pl-6 sm:pl-7">
                      <div
                        className="absolute -left-[5px] top-[30px] size-[9px] rounded-full border-2 border-[var(--border2)] bg-[#121220]"
                        aria-hidden
                      />
                      <p
                        className="mb-1.5 text-[9px] font-semibold uppercase tracking-[0.16em]"
                        style={{ color: "var(--ev-accent)" }}
                      >
                        {t.eventPage.resource}
                      </p>
                      <a
                        href={a.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[15px] font-medium text-[#f0eff5] underline decoration-white/15 underline-offset-4 hover:decoration-[var(--ev-accent)]"
                      >
                        {a.label}
                      </a>
                      <p className="mt-1 text-[13px] font-light leading-relaxed text-[var(--muted)]">
                        {t.eventPage.opensInNewTab}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {/* Gallery */}
          {gallery.length > 0 ? (
            <section>
              <p className="mb-6 flex items-center gap-3 text-[9px] font-semibold uppercase tracking-[0.26em] text-[var(--muted)]">
                <span className="h-px w-5 shrink-0" style={{ background: "var(--ev-accent)" }} />
                {t.eventPage.gallery}
                <span className="h-px min-w-[2rem] flex-1 bg-[var(--border)]" />
              </p>

              {imageGallery.length > 0 ? (
                imageGallery.length === 1 ? (
                  <button
                    type="button"
                    className="group relative h-[min(420px,52vh)] w-full overflow-hidden rounded-[14px] border border-[var(--border)] bg-[#121220] text-left"
                    onClick={() => openMediaAt(imageGallery[0])}
                  >
                    <img
                      src={imageGallery[0]!.url}
                      alt={imageGallery[0]!.caption || ""}
                      className="size-full object-cover brightness-[0.8] saturate-[0.85] transition duration-500 group-hover:scale-[1.04] group-hover:brightness-100"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#09090f]/60 to-transparent opacity-0 transition group-hover:opacity-100" />
                  </button>
                ) : imageGallery.length === 2 ? (
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {imageGallery.map((item, imgIdx) => (
                      <button
                        key={`event-gallery-image-${imgIdx}`}
                        type="button"
                        className="group relative h-[220px] overflow-hidden rounded-[14px] border border-[var(--border)] bg-[#121220] sm:h-[260px]"
                        onClick={() => openMediaAt(item)}
                      >
                        <img
                          src={item.url}
                          alt={item.caption || ""}
                          className="size-full object-cover brightness-[0.8] saturate-[0.85] transition duration-500 group-hover:scale-[1.05] group-hover:brightness-100"
                          loading="lazy"
                          decoding="async"
                        />
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#09090f]/50 to-transparent opacity-0 transition group-hover:opacity-100" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-[2fr_1fr] sm:grid-rows-[220px_220px]">
                    {imageGallery[0] ? (
                      <button
                        type="button"
                        className="group relative overflow-hidden rounded-[14px] border border-[var(--border)] bg-[#121220] text-left sm:row-span-2"
                        onClick={() => openMediaAt(imageGallery[0])}
                      >
                        <img
                          src={imageGallery[0]!.url}
                          alt={imageGallery[0]!.caption || ""}
                          className="size-full object-cover brightness-[0.8] saturate-[0.85] transition duration-500 group-hover:scale-[1.07] group-hover:brightness-100 group-hover:saturate-100"
                          loading="lazy"
                          decoding="async"
                        />
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#09090f]/60 to-transparent opacity-0 transition group-hover:opacity-100" />
                        <span className="pointer-events-none absolute bottom-4 left-4 text-xs font-medium text-[#f0eff5] opacity-0 transition group-hover:opacity-100">
                          {imageGallery[0]!.caption?.trim() || t.eventPage.openVideo}
                        </span>
                      </button>
                    ) : null}
                    {imageGallery.slice(1, 3).map((item, sliceIdx) => (
                      <button
                        key={`event-gallery-image-${sliceIdx + 1}`}
                        type="button"
                        className="group relative h-[200px] overflow-hidden rounded-[14px] border border-[var(--border)] bg-[#121220] sm:h-auto"
                        onClick={() => openMediaAt(item)}
                      >
                        <img
                          src={item.url}
                          alt={item.caption || ""}
                          className="size-full object-cover brightness-[0.8] saturate-[0.85] transition duration-500 group-hover:scale-[1.07] group-hover:brightness-100"
                          loading="lazy"
                          decoding="async"
                        />
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#09090f]/60 to-transparent opacity-0 transition group-hover:opacity-100" />
                      </button>
                    ))}
                    {moreGalleryCount > 0 ? (
                      <button
                        type="button"
                        className="flex h-[200px] flex-col items-center justify-center gap-2 rounded-[14px] border border-[var(--border)] bg-[#121220] transition hover:bg-[#0e0e18] sm:h-auto"
                        aria-label={`${t.eventPage.gallery} — ${moreGalleryCount} ${t.eventPage.moreMedia}`}
                        onClick={() => openMediaAt(imageGallery[3])}
                      >
                        <span
                          className={cn("text-4xl leading-none", fontDisplay.className)}
                          style={{ color: "var(--ev-accent)" }}
                        >
                          +{moreGalleryCount}
                        </span>
                        <span className="text-[11px] uppercase tracking-[0.1em] text-[var(--muted)]">
                          {t.eventPage.moreMedia}
                        </span>
                      </button>
                    ) : null}
                  </div>
                )
              ) : null}

              {gallery.some((g) => g.kind !== "image") ? (
                <div className="mt-6 space-y-3">
                  {gallery
                    .filter((g) => g.kind !== "image")
                    .map((item, idx) => (
                      <button
                        key={`${item.url}-${idx}`}
                        type="button"
                        className="w-full overflow-hidden rounded-[14px] border border-[var(--border)] bg-black/40 text-left"
                        onClick={() => openMediaAt(item)}
                      >
                        {youtubeEmbedSrc(item.url) ? (
                          <div className="aspect-video w-full bg-black">
                            <iframe
                              title={item.caption || "Video"}
                              src={youtubeEmbedSrc(item.url) ?? ""}
                              className="size-full border-0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          </div>
                        ) : (
                          <div className="aspect-video bg-black/60">
                            <video
                              controls
                              playsInline
                              preload="metadata"
                              className="size-full object-contain"
                              src={item.url}
                            >
                              <a href={item.url} target="_blank" rel="noopener noreferrer">
                                {t.eventPage.openVideo}
                              </a>
                            </video>
                          </div>
                        )}
                        {item.caption?.trim() ? (
                          <p className="px-3 py-2 text-xs text-[var(--muted)]">{item.caption.trim()}</p>
                        ) : null}
                      </button>
                    ))}
                </div>
              ) : null}
            </section>
          ) : null}
        </div>

        {/* Sidebar */}
        <aside className="flex min-w-0 flex-col gap-4 md:sticky md:top-6">
          <div
            className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[#0e0e18]"
            id="register"
          >
            <div className="flex items-center gap-2 border-b border-[var(--border)] px-5 py-3.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
              <span className="size-1.5 rounded-full" style={{ background: "var(--ev-accent)" }} />
              {t.eventPage.registration}
            </div>
            <div className="p-5">
              <div
                className="rounded-2xl border p-6 text-center"
                style={{
                  background: "var(--ev-accent-dim)",
                  borderColor: "var(--ev-accent-border)",
                }}
              >
                <strong className="mb-2 block text-[15px] font-medium text-[#f0eff5]">
                  {showWebsiteCta ? t.eventPage.joinViaOfficialPage : t.eventPage.onCampusEvent}
                </strong>
                <p className="mb-4 text-[13px] font-light leading-relaxed text-[var(--muted)]">
                  {showWebsiteCta ? t.eventPage.externalRegDesc : t.eventPage.onCampusDesc}
                </p>
                {showWebsiteCta ? (
                  <a
                    href={websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full rounded-[10px] border-0 py-3.5 text-[13.5px] font-medium text-white transition hover:opacity-90"
                    style={{ background: "var(--ev-accent)" }}
                  >
                    {t.eventPage.registerInfo}
                  </a>
                ) : (
                  <a
                    href="#documentary"
                    className="block w-full rounded-[10px] border border-[var(--border2)] bg-white/[0.06] py-3.5 text-[13.5px] font-medium text-[#f0eff5] transition hover:bg-white/[0.1]"
                  >
                    {t.eventPage.readTheStory}
                  </a>
                )}
                <div
                  className="mt-3 flex items-center justify-center gap-1.5 text-[11px]"
                  style={{ color: "var(--ev-accent)" }}
                >
                  <span
                    className="size-1 rounded-full"
                    style={{ background: "var(--ev-accent)", animation: "ev-blink 1.5s ease-in-out infinite" }}
                  />
                  {t.eventPage.estSafiStudentClub}
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[#0e0e18]">
            <div className="flex items-center gap-2 border-b border-[var(--border)] px-5 py-3.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
              <span className="size-1.5 rounded-full" style={{ background: "var(--ev-accent)" }} />
              {t.eventPage.eventDetails}
            </div>
            <div className="flex flex-col gap-3.5 p-5">
              <div className="flex gap-3 border-b border-[var(--border)] pb-3.5 last:border-0 last:pb-0">
                <div
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg border"
                  style={{
                    background: "var(--ev-accent-dim)",
                    borderColor: "var(--ev-accent-border)",
                    color: "var(--ev-accent)",
                  }}
                >
                  <Calendar className="size-3.5" strokeWidth={1.8} />
                </div>
                <div>
                  <p className="mb-0.5 text-[10px] tracking-wide text-[var(--muted)]">{t.eventPage.dateLabel}</p>
                  <p className="text-[13px] leading-snug text-[#f0eff5]">{formatDateLabel(event.date)}</p>
                </div>
              </div>
              {timePill ? (
                <div className="flex gap-3 border-b border-[var(--border)] pb-3.5 last:border-0 last:pb-0">
                  <div
                    className="flex size-8 shrink-0 items-center justify-center rounded-lg border"
                    style={{
                      background: "var(--ev-accent-dim)",
                      borderColor: "var(--ev-accent-border)",
                      color: "var(--ev-accent)",
                    }}
                  >
                    <Clock className="size-3.5" strokeWidth={1.8} />
                  </div>
                  <div>
                    <p className="mb-0.5 text-[10px] tracking-wide text-[var(--muted)]">{t.eventPage.timeLabel}</p>
                    <p className="text-[13px] leading-snug text-[#f0eff5]">{timePill}</p>
                  </div>
                </div>
              ) : null}
              <div className="flex gap-3 border-b border-[var(--border)] pb-3.5 last:border-0 last:pb-0">
                <div
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg border"
                  style={{
                    background: "var(--ev-accent-dim)",
                    borderColor: "var(--ev-accent-border)",
                    color: "var(--ev-accent)",
                  }}
                >
                  <MapPin className="size-3.5" strokeWidth={1.8} />
                </div>
                <div>
                  <p className="mb-0.5 text-[10px] tracking-wide text-[var(--muted)]">{t.eventPage.venueLabel}</p>
                  <p className="text-[13px] leading-snug text-[#f0eff5]">
                    {event.location?.trim() ? (
                      mapsHref ? (
                        <a
                          href={mapsHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline decoration-white/20 underline-offset-2 hover:text-white"
                        >
                          {event.location.trim()}
                        </a>
                      ) : (
                        event.location.trim()
                      )
                    ) : (
                      t.eventPage.tba
                    )}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg border"
                  style={{
                    background: "var(--ev-accent-dim)",
                    borderColor: "var(--ev-accent-border)",
                    color: "var(--ev-accent)",
                  }}
                >
                  <User className="size-3.5" strokeWidth={1.8} />
                </div>
                <div>
                  <p className="mb-0.5 text-[10px] tracking-wide text-[var(--muted)]">{t.eventPage.organizerLabel}</p>
                  <p className="text-[13px] leading-snug text-[#f0eff5]">
                    Robotics &amp; AI Club
                    <br />
                    EST Safi
                  </p>
                </div>
              </div>
            </div>
          </div>

          {event?.topics && event.topics.length > 0 ? (
            <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[#0e0e18]">
              <div className="flex items-center gap-2 border-b border-[var(--border)] px-5 py-3.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                <span className="size-1.5 rounded-full" style={{ background: "var(--ev-accent)" }} />
                {t.eventPage.topics}
              </div>
              <div className="flex flex-wrap gap-2 p-5">
                {event.topics.map((tag, ti) => (
                  <span
                    key={`${ti}-${tag}`}
                    className="cursor-default rounded-full border border-[var(--border)] bg-white/[0.03] px-3 py-1 text-[11px] text-[var(--muted)] transition hover:border-[var(--ev-accent-border)] hover:text-[var(--ev-accent)]"
                  >
                    {translateCms(t, "topics", tag)}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </aside>
        </div>
      </div>

      {/* Lightbox — navigable carousel over the full visible gallery */}
      {selectedItem ? (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center bg-[#09090f]/96 p-8 backdrop-blur-xl"
          role="dialog"
          aria-modal="true"
          aria-label={t.eventPage.mediaPreview}
          onClick={() => setSelectedIndex(null)}
        >
          <button
            type="button"
            className="absolute right-6 top-6 z-10 flex size-11 items-center justify-center rounded-full border border-[var(--border2)] bg-white/[0.07] text-[#f0eff5] transition hover:bg-white/[0.14]"
            onClick={() => setSelectedIndex(null)}
            aria-label={t.eventPage.close}
          >
            <X className="size-[18px]" strokeWidth={2} />
          </button>
          {gallery.length > 1 ? (
            <>
              <button
                type="button"
                className="absolute left-4 top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--border2)] bg-white/[0.07] text-[#f0eff5] transition hover:bg-white/[0.14] sm:left-6"
                onClick={(e) => {
                  e.stopPropagation();
                  stepMedia(-1);
                }}
                aria-label={t.eventPage.previousMedia}
              >
                <ChevronLeft className="size-[20px]" strokeWidth={2} />
              </button>
              <button
                type="button"
                className="absolute right-4 top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--border2)] bg-white/[0.07] text-[#f0eff5] transition hover:bg-white/[0.14] sm:right-6"
                onClick={(e) => {
                  e.stopPropagation();
                  stepMedia(1);
                }}
                aria-label={t.eventPage.nextMedia}
              >
                <ChevronRight className="size-[20px]" strokeWidth={2} />
              </button>
              <span
                className="pointer-events-none absolute bottom-6 left-1/2 z-10 -translate-x-1/2 rounded-full border border-[var(--border2)] bg-black/50 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[#f0eff5]/85 backdrop-blur"
                aria-live="polite"
              >
                {(selectedIndex ?? 0) + 1} / {gallery.length}
              </span>
            </>
          ) : null}
          <div
            className="max-h-[84vh] max-w-[88vw] overflow-hidden rounded-2xl border border-[var(--border2)] shadow-[0_40px_100px_rgba(0,0,0,0.9)]"
            onClick={(e) => e.stopPropagation()}
          >
            {selectedItem.kind === "image" ? (
              <img
                src={selectedItem.url}
                alt={selectedItem.caption || event.title}
                className="max-h-[84vh] w-auto object-contain"
              />
            ) : youtubeEmbedSrc(selectedItem.url) ? (
              <div className="aspect-video w-[min(100vw-2rem,960px)] bg-black">
                <iframe
                  title={selectedItem.caption || event.title}
                  src={youtubeEmbedSrc(selectedItem.url) ?? ""}
                  className="size-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <video
                controls
                autoPlay
                playsInline
                className="max-h-[84vh] w-full object-contain"
                src={selectedItem.url}
              />
            )}
          </div>
        </div>
      ) : null}

      {/* Mobile sticky CTA */}
      {showWebsiteCta ? (
        <div className="fixed bottom-0 left-0 right-0 z-[90] border-t border-[var(--border)] bg-[#09090f]/95 p-3 backdrop-blur-md pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
          <a
            href={websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-medium text-white"
            style={{ background: "var(--ev-accent)" }}
          >
            <Check className="size-4" strokeWidth={2} />
            {t.eventPage.openRegistration}
          </a>
        </div>
      ) : null}
    </div>
  );
}
