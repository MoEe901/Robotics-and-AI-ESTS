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
};

function coverSrc(imageUrl: string | null | undefined): string {
  if (imageUrl && imageUrl.trim()) return imageUrl.trim();
  return FALLBACK;
}

export function EventsCarousel({ items }: EventsCarouselProps) {
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
    return (
      <p className="rounded-2xl border border-white/10 bg-black/20 px-6 py-10 text-center text-sm text-white/55">
        No events scheduled yet.
      </p>
    );
  }

  const showControls = items.length > 1;

  return (
    <div className="relative w-full">
      <div
        ref={scrollerRef}
        className="scrollbar-none flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 pt-3 sm:gap-4 sm:px-5 md:pt-4 md:gap-3 lg:gap-3 lg:px-[max(1rem,calc((100vw-min(85vw,96rem))/2))] xl:gap-[12px] 2xl:gap-3"
      >
        {items.map((item, index) => {
          const href = `/events/${encodeURIComponent(item.linkSlug)}#documentary`;
          return (
            <Link
              key={item.id}
              href={href}
              scroll={false}
              className="group flex w-[min(88vw,26rem)] shrink-0 snap-center flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/80 text-left shadow-[0_24px_80px_-24px_rgba(27,110,200,0.35)] ring-1 ring-white/[0.06] transition-shadow duration-[400ms] ease-in-out outline-offset-4 hover:shadow-[0_28px_90px_-20px_rgba(27,110,200,0.45)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/40 sm:w-[min(86vw,28rem)] md:w-[min(90vw,40rem)] lg:w-[min(85vw,96rem)] lg:rounded-3xl xl:rounded-[1.35rem]"
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
                whileHover={{ scale: 1.012 }}
                className="flex min-h-0 flex-1 flex-col"
              >
                <div className="relative aspect-[4/5] min-h-[220px] w-full shrink-0 overflow-hidden sm:aspect-video sm:min-h-[240px] md:min-h-[260px] lg:aspect-[21/9] lg:min-h-[min(42vw,380px)] xl:min-h-[min(40vw,480px)] 2xl:min-h-[min(38vw,560px)]">
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
        <div className="grid w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 px-4 pb-8 pt-4 sm:px-6 md:px-8">
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
                    scrollToIndex(i);
                  }}
                  className="group inline-flex h-10 min-w-9 touch-manipulation items-center justify-center rounded-full p-1 text-white transition-colors hover:bg-white/[0.06]"
                >
                  <span
                    className={
                      isActive
                        ? "block h-2 w-8 rounded-full bg-white shadow-sm transition-all duration-300 ease-out"
                        : dist === 1
                          ? "block h-1.5 w-1.5 rounded-full bg-white/50 transition-all duration-300 ease-out group-hover:bg-white/70"
                          : "block h-1 w-1 rounded-full bg-white/35 transition-all duration-300 ease-out group-hover:bg-white/55"
                    }
                  />
                </button>
              );
            })}
          </div>
          <div className="flex min-w-0 justify-end">
            <button
              type="button"
              aria-pressed={autoplay}
              aria-label={autoplay ? "Pause automatic slideshow" : "Play automatic slideshow"}
              disabled={reduceMotion}
              title={
                reduceMotion ? "Autoplay is disabled when reduced motion is on" : undefined
              }
              onClick={() => setAutoplay((v) => !v)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/12 bg-white/[0.08] text-white/90 transition hover:border-white/22 hover:bg-white/[0.12] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {autoplay ? (
                <Pause className="size-4" strokeWidth={2} />
              ) : (
                <Play className="size-4 translate-x-px" strokeWidth={2} />
              )}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
