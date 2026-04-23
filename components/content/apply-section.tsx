"use client";

import { ArrowRight, Check, Clock, Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";

import type {
  ApplyContactRow,
  ApplySectionConfig,
  ApplySocialPlatform,
} from "@/lib/firebase/types";
import { DEFAULT_APPLY_CONFIG } from "@/lib/content/apply-defaults";

const TONE_ICON: Record<ApplyContactRow["tone"], string> = {
  blue: "bg-sky-500/10 text-sky-400",
  violet: "bg-violet-500/10 text-violet-300",
  pink: "bg-fuchsia-500/10 text-fuchsia-300",
  green: "bg-emerald-500/10 text-emerald-300",
};

const CONTACT_ICONS = {
  map: MapPin,
  phone: Phone,
  mail: Mail,
  clock: Clock,
} as const;

function SocialGlyph({ platform, className }: { platform: ApplySocialPlatform; className?: string }) {
  const cn = className ?? "size-[15px]";
  const stroke = "currentColor";
  const sw = 1.8;
  switch (platform) {
    case "instagram":
      return (
        <svg className={cn} fill="none" stroke={stroke} strokeWidth={sw} viewBox="0 0 24 24" aria-hidden>
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
        </svg>
      );
    case "linkedin":
      return (
        <svg className={cn} fill="none" stroke={stroke} strokeWidth={sw} viewBox="0 0 24 24" aria-hidden>
          <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z" />
          <rect x="2" y="9" width="4" height="12" />
          <circle cx="4" cy="4" r="2" />
        </svg>
      );
    case "twitter":
      return (
        <svg className={cn} fill="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case "youtube":
      return (
        <svg className={cn} fill="none" stroke={stroke} strokeWidth={sw} viewBox="0 0 24 24" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 00-1.95 1.96A29 29 0 001 12a29 29 0 00.46 5.58 2.78 2.78 0 001.95 1.95C5.12 20 12 20 12 20s6.88 0 8.59-.47a2.78 2.78 0 001.95-1.95A29 29 0 0023 12a29 29 0 00-.46-5.58z"
          />
          <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="currentColor" stroke="none" />
        </svg>
      );
    default:
      return null;
  }
}

type ApplySectionProps = {
  config: ApplySectionConfig | null;
};

function renderMultiline(text: string) {
  const lines = text.split("\n");
  return lines.map((line, i) => (
    <span key={i}>
      {i > 0 ? <br /> : null}
      {line}
    </span>
  ));
}

function CharterLink({
  prefix,
  linkText,
  href,
}: {
  prefix: string;
  linkText: string;
  href: string;
}) {
  const safeHref = typeof href === "string" && href.trim().length > 0 ? href.trim() : "#";
  const safeLinkText = typeof linkText === "string" && linkText.trim().length > 0 ? linkText.trim() : "Club Charter";
  const inner = safeHref.startsWith("/") ? (
    <Link href={safeHref} className="text-cyan-400 no-underline hover:underline">
      {safeLinkText}
    </Link>
  ) : (
    <a
      href={safeHref}
      className="text-cyan-400 no-underline hover:underline"
      {...(safeHref.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {safeLinkText}
    </a>
  );
  return (
    <p className="text-[11.5px] font-light text-slate-500">
      {prefix.trim()} {inner}
    </p>
  );
}

export function ApplySection({ config }: ApplySectionProps) {
  const c = config ?? DEFAULT_APPLY_CONFIG;
  const years = Array.isArray(c.yearOptions) && c.yearOptions.length
    ? c.yearOptions
    : DEFAULT_APPLY_CONFIG.yearOptions;
  const depts = Array.isArray(c.departmentOptions) && c.departmentOptions.length
    ? c.departmentOptions
    : DEFAULT_APPLY_CONFIG.departmentOptions;
  const contactRows = Array.isArray(c.contactRows) && c.contactRows.length
    ? c.contactRows
    : DEFAULT_APPLY_CONFIG.contactRows;
  const charterLinkHref =
    typeof c.charterLinkHref === "string" && c.charterLinkHref.trim().length > 0
      ? c.charterLinkHref
      : DEFAULT_APPLY_CONFIG.charterLinkHref;
  const charterLinkText =
    typeof c.charterLinkText === "string" && c.charterLinkText.trim().length > 0
      ? c.charterLinkText
      : DEFAULT_APPLY_CONFIG.charterLinkText;

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [educationYear, setEducationYear] = useState("");
  const [department, setDepartment] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const filledRequired = useMemo(() => {
    let n = 0;
    if (firstName.trim()) n++;
    if (lastName.trim()) n++;
    if (educationYear) n++;
    if (department) n++;
    if (email.trim()) n++;
    if (phone.trim()) n++;
    return n;
  }, [firstName, lastName, educationYear, department, email, phone]);

  const progressPct = Math.min(100, Math.round((filledRequired / 6) * 100));

  const validate = useCallback(() => {
    if (!firstName.trim()) return "First name is required.";
    if (!lastName.trim()) return "Last name is required.";
    if (!educationYear) return "Education year is required.";
    if (!department) return "Department is required.";
    if (!email.trim()) return "Email is required.";
    if (!phone.trim()) return "Phone number is required.";
    return null;
  }, [firstName, lastName, educationYear, department, email, phone]);

  async function handleSubmit() {
    setSubmitError(null);
    const err = validate();
    if (err) {
      setSubmitError(err);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          educationYear,
          department,
          email: email.trim(),
          phone: phone.trim(),
          message: message.trim() || undefined,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setSubmitError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      setSuccess(true);
    } catch {
      setSubmitError("Network error. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const socialWithUrl = (Array.isArray(c.socialLinks) ? c.socialLinks : DEFAULT_APPLY_CONFIG.socialLinks)
    .filter((s) => typeof s?.url === "string" && s.url.trim().length > 0);

  return (
    <section
      id="apply"
      className="apply-home-scope relative isolate min-h-[720px] scroll-mt-28 overflow-hidden bg-[#07080f] py-16 text-[#e2e8f0] md:py-20"
    >
      <style>{`
        @keyframes apply-drift {
          0%, 100% { transform: translate(0,0) scale(1); }
          33% { transform: translate(30px,-20px) scale(1.05); }
          66% { transform: translate(-20px,15px) scale(0.97); }
        }
        @keyframes apply-fade-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes apply-pop-in {
          from { transform: scale(0.5); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes apply-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .apply-home-scope .apply-orb { animation: apply-drift 12s ease-in-out infinite; }
        .apply-home-scope .apply-orb-2 { animation-delay: -4s; }
        .apply-home-scope .apply-orb-3 { animation-delay: -8s; }
        .apply-home-scope .apply-fade-1 { animation: apply-fade-up 0.6s ease both; }
        .apply-home-scope .apply-fade-2 { animation: apply-fade-up 0.6s ease both 0.1s; }
        .apply-home-scope .apply-fade-3 { animation: apply-fade-up 0.6s ease both 0.18s; }
        .apply-home-scope .apply-fade-4 { animation: apply-fade-up 0.7s ease both 0.25s; }
        .apply-home-scope .apply-dot-blink { animation: apply-blink 2s ease-in-out infinite; }
        .apply-home-scope .apply-badge-dot { animation: apply-blink 1.5s ease-in-out infinite; }
      `}</style>

      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
        <div
          className="apply-orb absolute -left-[150px] -top-[200px] size-[600px] rounded-full bg-violet-600 opacity-[0.16] blur-[100px]"
          aria-hidden
        />
        <div
          className="apply-orb apply-orb-2 absolute -right-[200px] top-[100px] size-[500px] rounded-full bg-cyan-500 opacity-[0.12] blur-[100px]"
          aria-hidden
        />
        <div
          className="apply-orb apply-orb-3 absolute bottom-[-100px] left-[30%] size-[400px] rounded-full bg-fuchsia-500 opacity-[0.12] blur-[100px]"
          aria-hidden
        />
        <div
          className="absolute bottom-0 left-1/2 h-[60vh] w-[200vw] origin-bottom [mask-image:linear-gradient(to_top,rgba(0,0,0,0.6)_0%,transparent_80%)] [transform:translateX(-50%)_perspective(600px)_rotateX(65deg)] bg-[length:50px_50px] [background-image:linear-gradient(rgba(124,58,237,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(124,58,237,0.07)_1px,transparent_1px)]"
          aria-hidden
        />
      </div>
      <div
        className="pointer-events-none fixed inset-0 z-[1] opacity-[0.04] mix-blend-soft-light [background-image:repeating-linear-gradient(0deg,rgba(255,255,255,0.03)_0_1px,transparent_1px_3px),repeating-linear-gradient(90deg,rgba(255,255,255,0.02)_0_1px,transparent_1px_4px)]"
        aria-hidden
      />

      <div className="relative z-[2] mx-auto flex min-h-0 w-full max-w-[1100px] flex-col items-center px-5 md:px-6">
        <p className="apply-fade-1 font-jetbrains mb-5 inline-flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.22em] text-slate-500">
          <span className="apply-dot-blink size-1.5 rounded-full bg-cyan-400" />
          {c.topLabel}
        </p>

        <h2 className="apply-fade-2 font-syne mb-5 text-center text-[clamp(3rem,9vw,5.5rem)] font-extrabold leading-[0.92] tracking-[-0.02em]">
          <span className="block text-white">{c.heroLine1}</span>
          <span className="hero-title-grad block">{c.heroLine2}</span>
        </h2>

        <p className="apply-fade-3 mb-14 max-w-[480px] text-center text-[15px] font-light leading-[1.85] text-slate-400">
          {c.heroSub}
        </p>

        <div className="apply-fade-4 grid w-full max-w-[980px] overflow-hidden rounded-3xl border border-violet-500/15 bg-[#0d0f1a] shadow-[0_40px_100px_rgba(124,58,237,0.12)] backdrop-blur-[20px] md:grid-cols-[minmax(0,340px)_1fr]">
          <div className="relative flex min-h-0 flex-col border-b border-violet-500/[0.08] bg-[#0d0f1a] px-8 py-10 md:border-b-0 md:border-r md:px-10 md:py-12">
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-400"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -bottom-20 -left-20 size-[280px] rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.14)_0%,transparent_70%)]"
              aria-hidden
            />

            <span className="relative z-[1] font-jetbrains mb-5 inline-flex items-center gap-1.5 text-[9px] font-medium uppercase tracking-[0.25em] text-cyan-400">
              <span className="apply-badge-dot size-1.5 rounded-full bg-cyan-400" />
              {c.infoBadge}
            </span>
            <h3 className="relative z-[1] font-syne mb-4 text-[1.4rem] font-extrabold leading-tight tracking-tight text-white md:text-[1.55rem]">
              {c.infoTitle}
            </h3>
            <p className="relative z-[1] mb-10 text-[13px] font-light leading-[1.8] text-slate-500">
              {c.infoDesc}
            </p>

            <div className="relative z-[1] flex flex-col gap-4">
              {contactRows.map((row) => {
                const Icon = CONTACT_ICONS[row.iconKey] ?? MapPin;
                return (
                  <div
                    key={`${row.label}-${row.value.slice(0, 24)}`}
                    className="flex gap-3.5 rounded-xl border border-violet-500/10 bg-violet-500/[0.03] px-4 py-3.5 transition-colors hover:border-violet-500/25 hover:bg-violet-500/[0.06]"
                  >
                    <div
                      className={`flex size-9 shrink-0 items-center justify-center rounded-[10px] ${TONE_ICON[row.tone]}`}
                    >
                      <Icon className="size-4" strokeWidth={1.8} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-jetbrains mb-0.5 text-[10px] font-medium uppercase tracking-[0.1em] text-slate-500">
                        {row.label}
                      </p>
                      <p className="text-[13px] font-normal leading-snug text-slate-300">
                        {renderMultiline(row.value)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {socialWithUrl.length ? (
              <div className="relative z-[1] mt-8 flex flex-wrap gap-2 pt-8 md:mt-auto md:pt-0">
                {socialWithUrl.map((s) => (
                  <a
                    key={s.platform}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={s.platform}
                    className="flex size-[38px] items-center justify-center rounded-[10px] border border-violet-500/15 bg-white/[0.03] text-slate-500 transition hover:-translate-y-0.5 hover:border-cyan-400/35 hover:bg-cyan-400/10 hover:text-cyan-400"
                  >
                    <SocialGlyph platform={s.platform} className="size-[15px]" />
                  </a>
                ))}
              </div>
            ) : null}
          </div>

          <div className="relative flex flex-col px-8 py-10 md:px-11 md:py-12">
            {!success ? (
              <>
                <div className="mb-8">
                  <h3 className="font-syne mb-1.5 text-[1.35rem] font-extrabold tracking-tight text-white md:text-[1.5rem]">
                    {c.formTitle}
                  </h3>
                  <p className="text-[12.5px] font-light text-slate-500">{c.formSubtitle}</p>
                </div>

                <div className="mb-8 h-0.5 overflow-hidden rounded-full bg-violet-500/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-600 to-cyan-400 transition-[width] duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)]"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>

                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                  <label className="flex flex-col gap-1.5">
                    <span className="font-jetbrains text-[10px] font-medium uppercase tracking-[0.1em] text-slate-500">
                      {c.firstNameLabel} <span className="text-fuchsia-400">*</span>
                    </span>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder={c.placeholders.firstName}
                      autoComplete="given-name"
                      className="w-full rounded-[10px] border border-violet-500/15 bg-white/[0.03] px-3.5 py-2.5 text-[13.5px] text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-violet-400/50 focus:shadow-[0_0_0_3px_rgba(124,58,237,0.12)]"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="font-jetbrains text-[10px] font-medium uppercase tracking-[0.1em] text-slate-500">
                      {c.lastNameLabel} <span className="text-fuchsia-400">*</span>
                    </span>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder={c.placeholders.lastName}
                      autoComplete="family-name"
                      className="w-full rounded-[10px] border border-violet-500/15 bg-white/[0.03] px-3.5 py-2.5 text-[13.5px] text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-violet-400/50 focus:shadow-[0_0_0_3px_rgba(124,58,237,0.12)]"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="font-jetbrains text-[10px] font-medium uppercase tracking-[0.1em] text-slate-500">
                      {c.yearLabel} <span className="text-fuchsia-400">*</span>
                    </span>
                    <select
                      value={educationYear}
                      onChange={(e) => setEducationYear(e.target.value)}
                      className="w-full rounded-[10px] border border-violet-500/15 bg-white/[0.03] px-3.5 py-2.5 text-[13.5px] text-slate-200 outline-none transition focus:border-violet-400/50 focus:shadow-[0_0_0_3px_rgba(124,58,237,0.12)]"
                    >
                      <option value="" disabled>
                        Select your year
                      </option>
                      {years.map((y) => (
                        <option key={y} value={y} className="bg-[#0d0f1a]">
                          {y}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="font-jetbrains text-[10px] font-medium uppercase tracking-[0.1em] text-slate-500">
                      {c.departmentLabel} <span className="text-fuchsia-400">*</span>
                    </span>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full rounded-[10px] border border-violet-500/15 bg-white/[0.03] px-3.5 py-2.5 text-[13.5px] text-slate-200 outline-none transition focus:border-violet-400/50 focus:shadow-[0_0_0_3px_rgba(124,58,237,0.12)]"
                    >
                      <option value="" disabled>
                        Select your department
                      </option>
                      {depts.map((d) => (
                        <option key={d} value={d} className="bg-[#0d0f1a]">
                          {d}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="font-jetbrains text-[10px] font-medium uppercase tracking-[0.1em] text-slate-500">
                      {c.emailLabel} <span className="text-fuchsia-400">*</span>
                    </span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={c.placeholders.email}
                      autoComplete="email"
                      className="w-full rounded-[10px] border border-violet-500/15 bg-white/[0.03] px-3.5 py-2.5 text-[13.5px] text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-violet-400/50 focus:shadow-[0_0_0_3px_rgba(124,58,237,0.12)]"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="font-jetbrains text-[10px] font-medium uppercase tracking-[0.1em] text-slate-500">
                      {c.phoneLabel} <span className="text-fuchsia-400">*</span>
                    </span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={c.placeholders.phone}
                      autoComplete="tel"
                      className="w-full rounded-[10px] border border-violet-500/15 bg-white/[0.03] px-3.5 py-2.5 text-[13.5px] text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-violet-400/50 focus:shadow-[0_0_0_3px_rgba(124,58,237,0.12)]"
                    />
                  </label>
                  <label className="col-span-1 flex flex-col gap-1.5 sm:col-span-2">
                    <span className="font-jetbrains text-[10px] font-medium uppercase tracking-[0.1em] text-slate-500">
                      {c.messageLabel}{" "}
                      <span className="font-light normal-case tracking-normal text-slate-600">
                        (Optional)
                      </span>
                    </span>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={c.placeholders.message}
                      rows={4}
                      className="min-h-[90px] w-full resize-none rounded-[10px] border border-violet-500/15 bg-white/[0.03] px-3.5 py-2.5 text-[13.5px] leading-relaxed text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-violet-400/50 focus:shadow-[0_0_0_3px_rgba(124,58,237,0.12)]"
                    />
                  </label>
                </div>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <CharterLink
                    prefix={c.submitNotePrefix}
                    linkText={charterLinkText}
                    href={charterLinkHref}
                  />
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => void handleSubmit()}
                    className="font-jetbrains inline-flex shrink-0 items-center justify-center gap-2.5 rounded-full border-0 bg-gradient-to-br from-violet-600 to-cyan-500 px-8 py-3.5 text-[12px] font-medium uppercase tracking-[0.08em] text-white shadow-[0_0_25px_rgba(124,58,237,0.4)] transition hover:-translate-y-0.5 hover:shadow-[0_0_40px_rgba(124,58,237,0.55)] disabled:pointer-events-none disabled:opacity-50"
                  >
                    {submitting ? "Sending…" : c.submitButtonLabel}
                    <ArrowRight className="size-4" strokeWidth={2} />
                  </button>
                </div>
                {submitError ? (
                  <p className="mt-3 text-center text-sm text-rose-400 sm:text-left">{submitError}</p>
                ) : null}
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-2 py-10 text-center">
                <div
                  className="flex size-16 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-400/10 text-emerald-400"
                  style={{ animation: "apply-pop-in 0.4s cubic-bezier(0.22,1,0.36,1) both" }}
                >
                  <Check className="size-7" strokeWidth={2} />
                </div>
                <p className="font-syne text-[28px] font-extrabold tracking-tight text-white md:text-[32px]">
                  {c.successTitle}
                </p>
                <p className="max-w-[300px] text-sm font-light leading-relaxed text-slate-500">
                  {c.successMessage}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
