"use client";

import { Send } from "lucide-react";
import Link from "next/link";
import { useEffect, useLayoutEffect, useState } from "react";

import { subscribeToPublishedEventBySlugOrId } from "@/lib/firebase/realtime";
import type { EventItem } from "@/lib/firebase/types";
import { parseWebsiteCtaHex } from "@/lib/events/website-cta-color";
import { eventLocationHref, youtubeEmbedSrc } from "@/lib/events/public";
import { cn } from "@/lib/utils";

const FALLBACK = "/fallback.jpg";

type Props = {
  pathSegment: string;
};

function formatDateLabel(date?: string): string {
  if (!date?.trim()) return "Date TBA";
  const t = Date.parse(date);
  if (Number.isNaN(t)) return date.trim();
  return new Date(t).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function coverSrc(imageUrl: string | null | undefined): string {
  if (imageUrl && imageUrl.trim()) return imageUrl.trim();
  return FALLBACK;
}

export function EventDocumentaryPageClient({ pathSegment }: Props) {
  const [event, setEvent] = useState<EventItem | null | undefined>(undefined);

  useEffect(() => {
    const unsub = subscribeToPublishedEventBySlugOrId(
      pathSegment,
      (row) => setEvent(row),
      () => {},
    );
    return () => unsub();
  }, [pathSegment]);

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

  if (event === undefined) {
    return (
      <p className="mx-auto w-[min(94%,720px)] px-4 pb-24 pt-28 text-sm text-white/70">
        Loading event...
      </p>
    );
  }

  if (event === null) {
    return (
      <div className="mx-auto w-[min(94%,720px)] px-4 pb-24 pt-28">
        <p className="text-sm text-white/70">This event could not be found or is no longer public.</p>
        <Link href="/#events" className="mt-6 inline-block text-sm text-blue-300 hover:text-blue-200">
          &larr; Back to events
        </Link>
      </div>
    );
  }

  const narrative =
    (event.documentary && event.documentary.trim()) ||
    (event.description && event.description.trim()) ||
    "";

  const mapsHref = eventLocationHref(event.location, event.locationMapsUrl);
  const attachments = event.attachments?.filter((a) => (a.visible === undefined || a.visible === true) && a.label.trim() && a.url.trim()) ?? [];
  const gallery = event.gallery?.filter((g) => (g.visible === undefined || g.visible === true) && g.url.trim()) ?? [];
  const websiteUrl = event.eventWebsiteUrl?.trim() ?? "";
  const showWebsiteCta = Boolean(websiteUrl) && event.showEventWebsite !== false;
  const ctaHex = parseWebsiteCtaHex(event.eventWebsiteButtonColor);

  return (
    <div className="min-h-screen pb-32 [background:var(--background)] [color:var(--foreground)]">
      <header className="relative w-full overflow-hidden border-b border-white/10">
        <div className="relative aspect-[21/9] min-h-[220px] w-full sm:min-h-[280px] lg:min-h-[min(42vw,420px)]">
          <img
            src={coverSrc(event.imageUrl)}
            alt={event.title}
            className="absolute inset-0 size-full object-cover"
            style={{
              objectPosition: `${event.imageFocusX ?? 50}% ${event.imageFocusY ?? 50}%`,
              transform: `scale(${event.imageZoom ?? 1})`,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/45 to-black/20" />
          <div className="absolute inset-x-0 bottom-0 z-10 mx-auto max-w-4xl px-4 pb-10 pt-20 sm:px-6 md:pb-14">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] [color:rgba(255,255,255,0.84)]">
              {formatDateLabel(event.date)}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight [color:#fff] sm:text-4xl md:text-5xl md:leading-[1.1]">
              {event.title}
            </h1>
            {event.location?.trim() ? (
              <p className="mt-3 max-w-xl text-sm">
                {mapsHref ? (
                  <a
                    href={mapsHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Open in Google Maps"
                    className="text-sky-300 underline decoration-sky-500/50 underline-offset-4 transition hover:text-sky-200"
                  >
                    {event.location.trim()}
                  </a>
                ) : (
                  <span className="text-white/70">{event.location.trim()}</span>
                )}
              </p>
            ) : null}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14 md:py-16">
        <Link
          href="/#events"
          className="text-xs font-medium text-white/50 transition hover:text-white/80"
        >
          &larr; All events
        </Link>

        <section
          id="documentary"
          className="scroll-mt-24 border-t border-white/10 pt-12 sm:scroll-mt-28 sm:pt-14"
          aria-labelledby="documentary-heading"
        >
          <h2 id="documentary-heading" className="text-lg font-semibold tracking-tight text-white">
            Event story
          </h2>
          {narrative ? (
            <p className="mt-6 whitespace-pre-wrap text-base leading-relaxed text-white/80">{narrative}</p>
          ) : (
            <p className="mt-6 text-sm text-white/50">
              There is no story for this event yet. Admins can add one under{" "}
              <span className="text-white/70">Documentary</span> or <span className="text-white/70">Description</span>{" "}
              in the event editor.
            </p>
          )}
        </section>

        {attachments.length > 0 ? (
          <section className="mt-14 border-t border-white/10 pt-12" aria-labelledby="downloads-heading">
            <h2 id="downloads-heading" className="text-lg font-semibold tracking-tight text-white">
              Downloads
            </h2>
            <ul className="mt-5 space-y-2">
              {attachments.map((a) => (
                <li key={`${a.label}-${a.url}`}>
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm text-sky-300 transition hover:border-white/20 hover:text-sky-200"
                  >
                    {a.label}
                    <span className="text-xs text-white/40">&rarr;</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {gallery.length > 0 ? (
          <section className="mt-14 border-t border-white/10 pt-12" aria-labelledby="gallery-heading">
            <h2 id="gallery-heading" className="text-lg font-semibold tracking-tight text-white">
              Gallery
            </h2>
            <div className="mx-auto mt-6 grid max-w-5xl gap-5 md:grid-cols-2">
              {gallery.map((item, idx) => {
                const embed = item.kind === "video" ? youtubeEmbedSrc(item.url) : null;
                return (
                  <figure key={`${item.url}-${idx}`} className="overflow-hidden rounded-2xl border border-white/10 bg-black/30 shadow-[0_18px_50px_-30px_rgba(0,0,0,0.8)]">
                    {item.kind === "image" ? (
                      <img
                        src={item.url}
                        alt={item.caption || event.title}
                        className="h-[220px] w-full object-cover sm:h-[250px] lg:h-[280px]"
                      />
                    ) : embed ? (
                      <div className="h-[220px] w-full sm:h-[250px] lg:h-[280px]">
                        <iframe
                          title={item.caption || "Video"}
                          src={embed}
                          className="size-full border-0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    ) : (
                      <video
                        controls
                        playsInline
                        className="h-[220px] w-full bg-black object-cover sm:h-[250px] lg:h-[280px]"
                        src={item.url}
                      >
                        <a href={item.url} target="_blank" rel="noopener noreferrer">
                          Open video
                        </a>
                      </video>
                    )}
                    {item.caption?.trim() ? (
                      <figcaption className="px-3 py-2 text-xs text-white/60">{item.caption.trim()}</figcaption>
                    ) : null}
                  </figure>
                );
              })}
            </div>
          </section>
        ) : null}
      </div>

      {showWebsiteCta ? (
        <div className="fixed bottom-0 left-0 right-0 z-30 flex justify-center border-t border-white/10 bg-black/70 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] backdrop-blur-md">
          <a
            href={websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Visit event website"
            title="Visit event website"
            style={
              ctaHex
                ? {
                    backgroundColor: ctaHex,
                    boxShadow: `0 8px 30px -6px ${ctaHex}99`,
                  }
                : undefined
            }
            className={cn(
              "group inline-flex h-14 min-h-14 min-w-14 max-w-[3.5rem] items-center justify-center overflow-hidden rounded-full text-white transition-[max-width,background-color,padding,justify-content] duration-300 ease-out hover:max-w-[min(22rem,calc(100vw-2rem))] hover:justify-start hover:pl-4 hover:pr-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-200 focus-visible:max-w-[min(22rem,calc(100vw-2rem))] focus-visible:justify-start focus-visible:pl-4 focus-visible:pr-1",
              ctaHex
                ? "ring-1 ring-white/20 hover:brightness-110 focus-visible:brightness-110"
                : "bg-sky-600 shadow-[0_8px_30px_-6px_rgba(14,165,233,0.55)] ring-1 ring-sky-400/25 hover:bg-sky-500",
            )}
          >
            <span className="max-w-0 shrink overflow-hidden whitespace-nowrap text-sm font-semibold uppercase tracking-wide opacity-0 transition-[max-width,opacity] duration-300 ease-out group-hover:max-w-[16rem] group-hover:opacity-100 group-hover:delay-75 group-focus-visible:max-w-[16rem] group-focus-visible:opacity-100 group-focus-visible:delay-75">
              Visit event website
            </span>
            <span className="flex size-14 shrink-0 items-center justify-center" aria-hidden>
              <Send className="size-5 text-white" strokeWidth={2.1} />
            </span>
          </a>
        </div>
      ) : null}
    </div>
  );
}





