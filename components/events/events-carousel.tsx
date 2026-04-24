"use client";

import { motion } from "framer-motion";
import { Pause, Play } from "lucide-react";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

const FALLBACK = "/fallback.jpg";
const AUTOPLAY_MS = 6000;
const MANUAL_COOLDOWN_MS = 9000;

export type EventCarouselItem = {
  id: string;
  title: string;
  dateLabel: string;
  imageUrl: string | null;
  imageFocusX?: number;
  imageFocusY?: number;
  imageZoom?: number;
  /** Document id or `slug` — used in `/events/[slug]#documentary`. */
  linkSlug: string;
};

type EventsCarouselProps = {
  items: EventCarouselItem[];
  emptyTitle?: string;
  emptyMessage?: string;
};

function coverSrc(imageUrl: string | null | undefined): string {
  if (imageUrl && imageUrl.trim()) return imageUrl.trim();
  return FALLBACK;
}

export function EventsCarousel({ items, emptyTitle, emptyMessage }: EventsCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [autoplay, setAutoplay] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const isProgrammaticScroll = useRef(false);
  const manualCooldownUntil = useRef(0);
  const activeIndexRef = useRef(0);

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      const next = mq.matches;
      setReduceMotion(next);
      if (next) setAutoplay(false);
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const preload = items.slice(0, 3).map((item) => {
      const src = coverSrc(item.imageUrl);
      const img = new window.Image();
      img.decoding = "async";
      img.src = src;
      return img;
    });
    return () => {
      preload.length = 0;
    };
  }, [items]);

  const updateActiveFromScroll = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller || scroller.children.length === 0) return;
    const center = scroller.scrollLeft + scroller.clientWidth / 2;
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < scroller.children.length; i++) {
      const el = scroller.children[i] as HTMLElement;
      const mid = el.offsetLeft + el.offsetWidth / 2;
      const d = Math.abs(mid - center);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    }
    setActiveIndex((prev) => (prev !== best ? best : prev));
    if (!isProgrammaticScroll.current) {
      manualCooldownUntil.current = Date.now() + MANUAL_COOLDOWN_MS;
    }
  }, []);

  const scrollToIndex = useCallback(
    (index: number) => {
      const scroller = scrollerRef.current;
      if (!scroller) return;
      const target = scroller.children[index] as HTMLElement | undefined;
      if (!target) return;
      const left =
        target.offsetLeft - (scroller.clientWidth - target.offsetWidth) / 2;
      const max = Math.max(0, scroller.scrollWidth - scroller.clientWidth);
      const smooth = !reduceMotion;
      isProgrammaticScroll.current = true;
      scroller.scrollTo({
        left: Math.max(0, Math.min(max, left)),
        behavior: smooth ? "smooth" : "auto",
      });
      window.setTimeout(
        () => {
          isProgrammaticScroll.current = false;
        },
        smooth ? 650 : 0,
      );
    },
    [reduceMotion],
  );

  useLayoutEffect(() => {
    updateActiveFromScroll();
  }, [items, updateActiveFromScroll]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const onScroll = () => updateActiveFromScroll();
    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => scroller.removeEventListener("scroll", onScroll);
  }, [items, updateActiveFromScroll]);

  useEffect(() => {
    if (!autoplay || items.length <= 1 || reduceMotion) return;
    const id = window.setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      if (Date.now() < manualCooldownUntil.current) return;
      const next = (activeIndexRef.current + 1) % items.length;
      scrollToIndex(next);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [autoplay, items.length, reduceMotion, scrollToIndex]);

  if (!items.length) {
    const title = emptyTitle?.trim() || "No events scheduled yet.";
    const msg = emptyMessage?.trim();
    return (
      <div className="rounded-2xl border border-white/10 bg-black/20 px-6 py-10 text-center">
        <p className="text-sm font-medium text-white/75">{title}</p>
        {msg ? (
          <p className="mt-2 text-xs text-white/45">{msg}</p>
        ) : (
          <div className="mx-auto mt-4 h-2 max-w-[220px] rounded-full bg-white/[0.06] animate-pulse" aria-hidden />
        )}
      </div>
    );
  }

  const showControls = items.length > 1;

  return (
    <div className="relative isolate z-0 w-full">
      <div
        ref={scrollerRef}
        className="scrollbar-none relative z-0 flex snap-x snap-mandatory gap-3 overflow-x-auto overflow-y-clip px-4 pb-2 pt-3 sm:gap-4 sm:px-5 md:gap-3 md:pt-4 lg:gap-3 lg:px-6 xl:gap-[12px] 2xl:gap-3"
      >
        {items.map((item, index) => {
          const href = `/events/${encodeURIComponent(item.linkSlug)}#documentary`;
          return (
            <Link
              key={item.id}
              href={href}
              scroll={false}
              className="group flex w-[min(80vw,22rem)] shrink-0 snap-center flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/80 text-left shadow-[0_24px_80px_-24px_rgba(27,110,200,0.35)] ring-1 ring-white/[0.06] transition-shadow duration-[400ms] ease-in-out outline-offset-4 hover:shadow-[0_28px_90px_-20px_rgba(27,110,200,0.45)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/40 sm:w-[min(78vw,24rem)] md:w-[calc((100%-0.75rem)/2)] lg:w-[calc((100%-0.75rem)/2)] lg:rounded-3xl xl:rounded-[1.35rem]"
              aria-label={`${item.title} — open event story`}
            >
              <motion.article
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.55,
                  ease: [0.22, 1, 0.36, 1],
                  delay: index * 0.07,
                }}
                className="flex min-h-0 flex-1 flex-col"
              >
                <div className="relative aspect-[4/5] min-h-[190px] w-full shrink-0 overflow-hidden sm:aspect-video sm:min-h-[208px] md:min-h-[224px] lg:aspect-[21/9] lg:min-h-[min(30vw,260px)] xl:min-h-[min(28vw,320px)] 2xl:min-h-[min(26vw,380px)]">
                  <img
                    src={coverSrc(item.imageUrl)}
                    alt=""
                    className="h-full w-full object-cover transition duration-[400ms] ease-in-out group-hover:scale-[1.03]"
                    style={{
                      objectPosition: `${item.imageFocusX ?? 50}% ${item.imageFocusY ?? 50}%`,
                      transform: `scale(${item.imageZoom ?? 1})`,
                    }}
                    loading={index < 3 ? "eager" : "lazy"}
                    fetchPriority={index < 3 ? "high" : "auto"}
                    decoding="async"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/20" />
                  <div className="pointer-events-none absolute inset-0 opacity-0 shadow-[inset_0_0_100px_rgba(81,65,180,0.25)] transition duration-[400ms] ease-in-out group-hover:opacity-100" />
                  <div className="absolute inset-x-0 bottom-0 z-10 p-5 md:p-6 lg:p-8 lg:pb-7">
                    <p className="text-[11px] font-medium uppercase tracking-[0.2em] [color:rgba(255,255,255,0.82)] lg:text-xs">
                      {item.dateLabel}
                    </p>
                    <h3 className="mt-1 text-xl font-semibold leading-tight tracking-tight [color:#fff] sm:text-2xl lg:text-3xl lg:leading-[1.15] xl:text-4xl xl:tracking-tight">
                      {item.title}
                    </h3>
                    <p className="mt-3 text-xs font-medium [color:rgba(255,255,255,0.78)] lg:text-sm">
                      View event story →
                    </p>
                  </div>
                </div>
              </motion.article>
            </Link>
          );
        })}
      </div>

      {showControls ? (
        <div className="events-carousel-controls pointer-events-auto relative z-20 grid w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 px-4 pb-8 pt-4 sm:px-6 md:px-8">
          <span aria-hidden className="min-w-0" />
          <div
            className="flex max-w-[min(100%,22rem)] flex-wrap items-center justify-center gap-1.5 sm:gap-2"
            role="tablist"
            aria-label="Events carousel"
          >
            {items.map((item, i) => {
              const dist = Math.abs(i - activeIndex);
              const isActive = i === activeIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-label={`${item.title}, slide ${i + 1} of ${items.length}`}
                  onClick={() => {
                    manualCooldownUntil.current = Date.now() + MANUAL_COOLDOWN_MS;
                    setActiveIndex(i);
                    scrollToIndex(i);
                  }}
                  className="events-carousel-dot group inline-flex h-10 min-w-9 touch-manipulation items-center justify-center rounded-full p-1 text-white transition-colors hover:bg-white/[0.08]"
                >
                  <span
                    className={
                      isActive
                        ? "block h-2 w-8 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.55)] transition-all duration-300 ease-out"
                        : dist === 1
                          ? "block h-1.5 w-1.5 rounded-full bg-white/70 transition-all duration-300 ease-out group-hover:bg-white/90"
                          : "block h-1 w-1 rounded-full bg-white/55 transition-all duration-300 ease-out group-hover:bg-white/80"
                    }
                  />
                </button>
              );
            })}
          </div>
          <div className="relative z-30 flex min-w-[3.5rem] shrink-0 justify-end pl-2">
            <button
              type="button"
              aria-pressed={autoplay}
              aria-label={autoplay ? "Pause automatic slideshow" : "Play automatic slideshow"}
              title={
                reduceMotion
                  ? "Slideshow timing is off while reduced motion is enabled; use dots to change slides."
                  : undefined
              }
              onClick={() => setAutoplay((v) => !v)}
              className="events-carousel-play-hit group relative z-10 grid size-14 shrink-0 cursor-pointer place-items-center rounded-full border-0 bg-transparent p-0 text-white outline-offset-2"
            >
              <span className="events-carousel-play-visual pointer-events-none grid size-10 place-items-center rounded-full border border-white/20 bg-white/[0.12] shadow-none transition-[background-color,box-shadow,border-color,transform] duration-200 ease-out group-hover:border-white/35 group-hover:bg-white/[0.2] group-hover:shadow-[0_0_0_6px_rgba(255,255,255,0.07)] motion-reduce:transition-[background-color,box-shadow,border-color] motion-reduce:group-hover:scale-100 group-hover:scale-105 group-active:scale-100">
                {autoplay ? (
                  <Pause className="size-4" strokeWidth={2} />
                ) : (
                  <Play className="size-4 translate-x-px" strokeWidth={2} />
                )}
              </span>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
