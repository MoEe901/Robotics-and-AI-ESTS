"use client";

import { Bebas_Neue, DM_Sans } from "next/font/google";
import { ArrowRight, Check, Clock, Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";

import type {
  ApplyContactRow,
  ApplySectionConfig,
  ApplySocialPlatform,
} from "@/lib/firebase/types";
import { DEFAULT_APPLY_CONFIG } from "@/lib/content/apply-defaults";

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
  const inner = href.startsWith("/") ? (
    <Link href={href} className="text-sky-400 no-underline hover:underline">
      {linkText}
    </Link>
  ) : (
    <a
      href={href}
      className="text-sky-400 no-underline hover:underline"
      {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {linkText}
    </a>
  );
  return (
    <p className="text-[11.5px] font-light text-[#6b6a80]">
      {prefix.trim()} {inner}
    </p>
  );
}

export function ApplySection({ config }: ApplySectionProps) {
  const c = config ?? DEFAULT_APPLY_CONFIG;
  const years = c.yearOptions.length ? c.yearOptions : DEFAULT_APPLY_CONFIG.yearOptions;
  const depts =
    c.departmentOptions.length ? c.departmentOptions : DEFAULT_APPLY_CONFIG.departmentOptions;

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

  const socialWithUrl = c.socialLinks.filter((s) => s.url.trim().length > 0);

  return (
    <section
      id="apply"
      className={`apply-home-scope relative isolate min-h-[720px] overflow-hidden bg-[#09090f] py-16 text-[#f0eff5] md:py-20 ${fontSans.className}`}
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
          className="apply-orb absolute -left-[150px] -top-[200px] size-[600px] rounded-full bg-[#4f8ef7] opacity-[0.18] blur-[100px]"
          aria-hidden
        />
        <div
          className="apply-orb apply-orb-2 absolute -right-[200px] top-[100px] size-[500px] rounded-full bg-[#a78bfa] opacity-[0.18] blur-[100px]"
          aria-hidden
        />
        <div
          className="apply-orb apply-orb-3 absolute bottom-[-100px] left-[30%] size-[400px] rounded-full bg-[#f056a0] opacity-[0.18] blur-[100px]"
          aria-hidden
        />
        <div
          className="absolute bottom-0 left-1/2 h-[60vh] w-[200vw] origin-bottom [mask-image:linear-gradient(to_top,rgba(0,0,0,0.6)_0%,transparent_80%)] [transform:translateX(-50%)_perspective(600px)_rotateX(65deg)] bg-[length:60px_60px] [background-image:linear-gradient(rgba(79,142,247,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(79,142,247,0.08)_1px,transparent_1px)]"
          aria-hidden
        />
      </div>
      <div
        className="pointer-events-none fixed inset-0 z-[1] opacity-[0.04] mix-blend-soft-light [background-image:repeating-linear-gradient(0deg,rgba(255,255,255,0.03)_0_1px,transparent_1px_3px),repeating-linear-gradient(90deg,rgba(255,255,255,0.02)_0_1px,transparent_1px_4px)]"
        aria-hidden
      />

      <div className="relative z-[2] mx-auto flex min-h-0 w-full max-w-[1100px] flex-col items-center px-5 md:px-6">
        <p className="apply-fade-1 mb-5 inline-flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.22em] text-[#6b6a80]">
          <span className="apply-dot-blink size-1.5 rounded-full bg-[#4f8ef7]" />
          {c.topLabel}
        </p>

        <h2
          className={`apply-fade-2 mb-5 text-center ${fontDisplay.className} text-[clamp(3.75rem,10vw,7.5rem)] leading-[0.9] tracking-[0.02em]`}
        >
          <span className="block text-[#f0eff5]">{c.heroLine1}</span>
          <span className="block bg-gradient-to-br from-[#4f8ef7] via-[#a78bfa] to-[#f056a0] bg-clip-text text-transparent">
            {c.heroLine2}
          </span>
        </h2>

        <p className="apply-fade-3 mb-14 max-w-[480px] text-center text-[15px] font-light leading-[1.7] text-[#6b6a80]">
          {c.heroSub}
        </p>

        <div className="apply-fade-4 grid w-full max-w-[980px] overflow-hidden rounded-[28px] border border-white/[0.07] bg-[rgba(13,13,24,0.8)] shadow-[0_40px_120px_rgba(0,0,0,0.5),inset_0_0_0_1px_rgba(255,255,255,0.04)] backdrop-blur-[24px] md:grid-cols-[minmax(0,340px)_1fr]">
          <div className="relative flex min-h-0 flex-col border-b border-white/[0.07] bg-white/[0.02] px-8 py-10 md:border-b-0 md:border-r md:px-10 md:py-12">
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#4f8ef7] via-[#a78bfa] to-[#f056a0]"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -bottom-20 -left-20 size-[280px] rounded-full bg-[radial-gradient(circle,rgba(79,142,247,0.12)_0%,transparent_70%)]"
              aria-hidden
            />

            <span className="relative z-[1] mb-5 inline-flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-[#4f8ef7]">
              <span className="apply-badge-dot size-1.5 rounded-full bg-[#4f8ef7]" />
              {c.infoBadge}
            </span>
            <h3
              className={`relative z-[1] mb-4 text-[38px] leading-none tracking-[0.02em] text-[#f0eff5] ${fontDisplay.className}`}
            >
              {c.infoTitle}
            </h3>
            <p className="relative z-[1] mb-10 text-[13px] font-light leading-[1.7] text-[#6b6a80]">
              {c.infoDesc}
            </p>

            <div className="relative z-[1] flex flex-col gap-4">
              {c.contactRows.map((row) => {
                const Icon = CONTACT_ICONS[row.iconKey] ?? MapPin;
                return (
                  <div
                    key={`${row.label}-${row.value.slice(0, 24)}`}
                    className="flex gap-3.5 rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3.5 transition-colors hover:border-white/[0.12] hover:bg-white/[0.04]"
                  >
                    <div
                      className={`flex size-9 shrink-0 items-center justify-center rounded-[10px] ${TONE_ICON[row.tone]}`}
                    >
                      <Icon className="size-4" strokeWidth={1.8} />
                    </div>
                    <div className="min-w-0">
                      <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6b6a80]">
                        {row.label}
                      </p>
                      <p className="text-[13px] font-normal leading-snug text-[#f0eff5]">
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
                    className="flex size-[38px] items-center justify-center rounded-[10px] border border-white/[0.07] bg-white/[0.03] text-[#6b6a80] transition hover:-translate-y-0.5 hover:border-sky-400/30 hover:bg-sky-500/10 hover:text-sky-400"
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
                  <h3
                    className={`mb-1.5 text-[28px] tracking-[0.04em] text-[#f0eff5] ${fontDisplay.className}`}
                  >
                    {c.formTitle}
                  </h3>
                  <p className="text-[12.5px] font-light text-[#6b6a80]">{c.formSubtitle}</p>
                </div>

                <div className="mb-8 h-0.5 overflow-hidden rounded-full bg-white/[0.07]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#4f8ef7] to-[#a78bfa] transition-[width] duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)]"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>

                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6b6a80]">
                      {c.firstNameLabel} <span className="text-[#f056a0]">*</span>
                    </span>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder={c.placeholders.firstName}
                      autoComplete="given-name"
                      className="w-full rounded-[10px] border border-white/[0.07] bg-white/[0.04] px-3.5 py-2.5 text-[13.5px] text-[#f0eff5] outline-none transition placeholder:text-[#6b6a80]/60 focus:border-sky-400/50 focus:bg-sky-500/[0.05] focus:shadow-[0_0_0_3px_rgba(79,142,247,0.08)]"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6b6a80]">
                      {c.lastNameLabel} <span className="text-[#f056a0]">*</span>
                    </span>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder={c.placeholders.lastName}
                      autoComplete="family-name"
                      className="w-full rounded-[10px] border border-white/[0.07] bg-white/[0.04] px-3.5 py-2.5 text-[13.5px] text-[#f0eff5] outline-none transition placeholder:text-[#6b6a80]/60 focus:border-sky-400/50 focus:bg-sky-500/[0.05] focus:shadow-[0_0_0_3px_rgba(79,142,247,0.08)]"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6b6a80]">
                      {c.yearLabel} <span className="text-[#f056a0]">*</span>
                    </span>
                    <select
                      value={educationYear}
                      onChange={(e) => setEducationYear(e.target.value)}
                      className="w-full rounded-[10px] border border-white/[0.07] bg-white/[0.04] px-3.5 py-2.5 text-[13.5px] text-[#f0eff5] outline-none transition focus:border-sky-400/50 focus:bg-sky-500/[0.05] focus:shadow-[0_0_0_3px_rgba(79,142,247,0.08)]"
                    >
                      <option value="" disabled>
                        Select your year
                      </option>
                      {years.map((y) => (
                        <option key={y} value={y} className="bg-[#111119]">
                          {y}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6b6a80]">
                      {c.departmentLabel} <span className="text-[#f056a0]">*</span>
                    </span>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full rounded-[10px] border border-white/[0.07] bg-white/[0.04] px-3.5 py-2.5 text-[13.5px] text-[#f0eff5] outline-none transition focus:border-sky-400/50 focus:bg-sky-500/[0.05] focus:shadow-[0_0_0_3px_rgba(79,142,247,0.08)]"
                    >
                      <option value="" disabled>
                        Select your department
                      </option>
                      {depts.map((d) => (
                        <option key={d} value={d} className="bg-[#111119]">
                          {d}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6b6a80]">
                      {c.emailLabel} <span className="text-[#f056a0]">*</span>
                    </span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={c.placeholders.email}
                      autoComplete="email"
                      className="w-full rounded-[10px] border border-white/[0.07] bg-white/[0.04] px-3.5 py-2.5 text-[13.5px] text-[#f0eff5] outline-none transition placeholder:text-[#6b6a80]/60 focus:border-sky-400/50 focus:bg-sky-500/[0.05] focus:shadow-[0_0_0_3px_rgba(79,142,247,0.08)]"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6b6a80]">
                      {c.phoneLabel} <span className="text-[#f056a0]">*</span>
                    </span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={c.placeholders.phone}
                      autoComplete="tel"
                      className="w-full rounded-[10px] border border-white/[0.07] bg-white/[0.04] px-3.5 py-2.5 text-[13.5px] text-[#f0eff5] outline-none transition placeholder:text-[#6b6a80]/60 focus:border-sky-400/50 focus:bg-sky-500/[0.05] focus:shadow-[0_0_0_3px_rgba(79,142,247,0.08)]"
                    />
                  </label>
                  <label className="col-span-1 flex flex-col gap-1.5 sm:col-span-2">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6b6a80]">
                      {c.messageLabel}{" "}
                      <span className="font-light normal-case tracking-normal text-[#6b6a80]">
                        (Optional)
                      </span>
                    </span>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={c.placeholders.message}
                      rows={4}
                      className="min-h-[90px] w-full resize-none rounded-[10px] border border-white/[0.07] bg-white/[0.04] px-3.5 py-2.5 text-[13.5px] leading-relaxed text-[#f0eff5] outline-none transition placeholder:text-[#6b6a80]/60 focus:border-sky-400/50 focus:bg-sky-500/[0.05] focus:shadow-[0_0_0_3px_rgba(79,142,247,0.08)]"
                    />
                  </label>
                </div>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <CharterLink
                    prefix={c.submitNotePrefix}
                    linkText={c.charterLinkText}
                    href={c.charterLinkHref}
                  />
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => void handleSubmit()}
                    className="inline-flex shrink-0 items-center justify-center gap-2.5 rounded-xl border-0 bg-gradient-to-br from-[#4f8ef7] to-[#a78bfa] px-7 py-3.5 text-sm font-medium text-white shadow-[0_4px_24px_rgba(79,142,247,0.25)] transition hover:-translate-y-0.5 hover:opacity-90 hover:shadow-[0_8px_32px_rgba(79,142,247,0.35)] disabled:pointer-events-none disabled:opacity-50"
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
                <p className={`text-[32px] tracking-[0.04em] text-[#f0eff5] ${fontDisplay.className}`}>
                  {c.successTitle}
                </p>
                <p className="max-w-[300px] text-sm font-light leading-relaxed text-[#6b6a80]">
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
