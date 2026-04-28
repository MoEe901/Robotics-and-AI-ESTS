"use client";

import {
  Award,
  Calendar,
  CircleDollarSign,
  Clock,
  Code,
  HelpCircle,
  Lightbulb,
  MessageCircle,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import type { FaqConfig, FaqItemColor } from "@/lib/firebase/types";
import { DEFAULT_FAQ_CONFIG } from "@/lib/content/faq-defaults";
import { useLanguage } from "@/lib/i18n/context";

const faqIcons: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  "circle-dollar-sign": CircleDollarSign,
  calendar: Calendar,
  lightbulb: Lightbulb,
  "trending-up": TrendingUp,
  users: Users,
  code: Code,
  award: Award,
  clock: Clock,
  "help-circle": HelpCircle,
  "message-circle": MessageCircle,
  sparkles: Sparkles,
  target: Target,
};

const COLOR_STYLES: Record<
  FaqItemColor,
  { icon: string; openBorder: string; toggleOpen: string }
> = {
  blue: {
    icon: "bg-sky-500/10 text-sky-400",
    openBorder: "border-sky-400/25",
    toggleOpen: "border-sky-400/30 bg-sky-500/10 text-sky-400",
  },
  violet: {
    icon: "bg-violet-500/10 text-violet-300",
    openBorder: "border-violet-400/25",
    toggleOpen: "border-violet-400/30 bg-violet-500/10 text-violet-300",
  },
  pink: {
    icon: "bg-fuchsia-500/10 text-fuchsia-300",
    openBorder: "border-fuchsia-400/25",
    toggleOpen: "border-fuchsia-400/30 bg-fuchsia-500/10 text-fuchsia-300",
  },
  amber: {
    icon: "bg-amber-500/10 text-amber-300",
    openBorder: "border-amber-400/25",
    toggleOpen: "border-amber-400/30 bg-amber-500/10 text-amber-300",
  },
  green: {
    icon: "bg-emerald-500/10 text-emerald-300",
    openBorder: "border-emerald-400/25",
    toggleOpen: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
  },
};

function resolveIcon(key: string) {
  const k = key.trim().toLowerCase();
  return faqIcons[k] ?? HelpCircle;
}

type FaqSectionProps = {
  config: FaqConfig | null;
};

export function FaqSection({ config }: FaqSectionProps) {
  const { t, locale } = useLanguage();
  const isFr = locale !== "en";
  const data = isFr ? (t.faqSection as unknown as FaqConfig) : (config ?? DEFAULT_FAQ_CONFIG);
  const categories = data.categories.length ? data.categories : DEFAULT_FAQ_CONFIG.categories;
  const items = data.items.length ? data.items : DEFAULT_FAQ_CONFIG.items;

  const [activeCat, setActiveCat] = useState<string>("all");
  const [openKey, setOpenKey] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (activeCat === "all") return items.map((it, i) => ({ it, i }));
    return items
      .map((it, i) => ({ it, i }))
      .filter(({ it }) => it.categoryId === activeCat);
  }, [items, activeCat]);

  const counts = useMemo(() => {
    const m: Record<string, number> = { all: items.length };
    for (const c of categories) {
      m[c.id] = items.filter((x) => x.categoryId === c.id).length;
    }
    return m;
  }, [categories, items]);

  function toggleItem(key: string) {
    setOpenKey((prev) => (prev === key ? null : key));
  }

  return (
    <section id="faq" className="mx-auto w-[min(94%,860px)] scroll-mt-28 py-2">
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-5 py-10 md:px-10 md:py-14">
        <header className="mx-auto mb-12 max-w-2xl text-center md:mb-16">
          <p className="mb-4 inline-flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.22em] text-white/50">
            <span className="size-1.5 rounded-full bg-sky-400 motion-safe:animate-pulse" />
            {data.eyebrow}
          </p>
          <h2 className="font-semibold tracking-tight text-white text-[clamp(2.25rem,6vw,4.5rem)] leading-[0.98]">
            {data.titleLine}
            <span className="bg-gradient-to-br from-sky-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              {data.titleAccent}
            </span>
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm font-light leading-relaxed text-white/55">
            {data.subtitle}
          </p>
        </header>

        <div className="grid gap-10 md:grid-cols-[minmax(0,200px)_1fr] md:gap-12 md:items-start">
          <aside className="md:sticky md:top-28">
            <p className="mb-2 hidden px-3 text-[9px] font-semibold uppercase tracking-[0.2em] text-white/45 md:block">
              {t.sections.faqFilterByTopic}
            </p>
            <div className="flex flex-row flex-wrap gap-1 md:flex-col">
              <button
                type="button"
                onClick={() => {
                  setActiveCat("all");
                  setOpenKey(null);
                }}
                className={`flex w-full min-w-0 items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-left text-[13px] transition md:max-w-none ${
                  activeCat === "all"
                    ? "bg-sky-500/[0.1] text-white"
                    : "text-white/50 hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                <span
                  className={`size-1.5 shrink-0 rounded-full transition ${
                    activeCat === "all" ? "bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.7)]" : "bg-white/15"
                  }`}
                />
                <span className="min-w-0 flex-1 truncate">{t.sections.faqAllQuestions}</span>
                <span className="shrink-0 rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-white/50">
                  {counts.all ?? 0}
                </span>
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setActiveCat(c.id);
                    setOpenKey(null);
                  }}
                  className={`flex w-full min-w-0 items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-left text-[13px] transition md:max-w-none ${
                    activeCat === c.id
                      ? "bg-sky-500/[0.1] text-white"
                      : "text-white/50 hover:bg-white/[0.04] hover:text-white"
                  }`}
                >
                  <span
                    className={`size-1.5 shrink-0 rounded-full transition ${
                      activeCat === c.id ? "bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.7)]" : "bg-white/15"
                    }`}
                  />
                  <span className="min-w-0 flex-1 truncate">{c.label}</span>
                  <span className="shrink-0 rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-white/50">
                    {counts[c.id] ?? 0}
                  </span>
                </button>
              ))}
            </div>
          </aside>

          <div>
            <div className="flex flex-col gap-0.5">
              {filtered.map(({ it, i }, idx) => {
                const key = `${it.question}-${i}`;
                const open = openKey === key;
                const styles = COLOR_STYLES[it.color] ?? COLOR_STYLES.blue;
                const Icon = resolveIcon(it.iconKey);
                return (
                  <div
                    key={key}
                    className={`overflow-hidden rounded-[14px] border border-white/10 bg-[#0e0e14]/95 transition-colors duration-200 ${
                      open ? styles.openBorder : ""
                    }`}
                    style={{ animationDelay: `${idx * 60}ms` }}
                  >
                    <button
                      type="button"
                      onClick={() => toggleItem(key)}
                      className="flex w-full items-center gap-3.5 px-5 py-5 text-left transition hover:bg-white/[0.02] md:gap-3.5 md:px-5 md:py-5"
                    >
                      <div
                        className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${styles.icon} ${
                          open ? "brightness-110" : ""
                        }`}
                      >
                        <Icon className="size-[15px]" strokeWidth={1.8} aria-hidden />
                      </div>
                      <span className="min-w-0 flex-1 text-[14.5px] font-normal leading-snug text-white">
                        {it.question}
                      </span>
                      <div
                        className={`flex size-7 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-white/50 transition duration-300 ${
                          open ? `rotate-45 ${styles.toggleOpen}` : ""
                        }`}
                      >
                        <svg
                          className="size-3.5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2.5}
                          viewBox="0 0 24 24"
                          aria-hidden
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                    </button>
                    <div
                      className={`grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                        open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                      }`}
                    >
                      <div className="min-h-0 overflow-hidden">
                        <div className="px-5 pb-5 pl-[4.25rem] text-[13.5px] font-light leading-relaxed text-white/60 md:pl-[4.5rem]">
                          {it.answer}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-10 flex flex-col gap-4 rounded-2xl border border-white/10 bg-[#0e0e14]/90 p-6 sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:py-6">
              <div>
                <p className="text-[15px] font-medium text-white">{data.ctaTitle}</p>
                <p className="mt-1 text-[13px] font-light text-white/55">{data.ctaSubtitle}</p>
              </div>
              {data.ctaButtonHref.startsWith("/") ? (
                <Link
                  href={data.ctaButtonHref}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-[10px] border border-sky-400/30 bg-sky-500/10 px-5 py-2.5 text-[13px] font-medium text-sky-300 transition hover:border-sky-400/50 hover:bg-sky-500/15"
                >
                  <MessageCircle className="size-3.5" strokeWidth={2} aria-hidden />
                  {data.ctaButtonLabel}
                </Link>
              ) : (
                <a
                  href={data.ctaButtonHref}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-[10px] border border-sky-400/30 bg-sky-500/10 px-5 py-2.5 text-[13px] font-medium text-sky-300 transition hover:border-sky-400/50 hover:bg-sky-500/15"
                  {...(data.ctaButtonHref.startsWith("http")
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                >
                  <MessageCircle className="size-3.5" strokeWidth={2} aria-hidden />
                  {data.ctaButtonLabel}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
