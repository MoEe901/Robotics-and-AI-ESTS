"use client";

import Link from "next/link";
import { useState } from "react";
import { Camera, Code2, Link2, Mail, MessageCircle, Phone, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

import type { TeamContact, TeamMemberProfile } from "@/lib/team/types";
import {
  extraSocialContacts,
  getVisibleContacts,
  partitionContacts,
  SOCIAL_PLATFORMS,
  type SocialPlatform,
} from "@/lib/team/contacts";
import { formatRoleTitles } from "@/lib/team/format-roles";
import { teamListingHref } from "@/lib/team/academic-year";
import { formatBirthdayDisplay } from "@/lib/team/birthday";
import { memberImageSrc } from "@/lib/team/image-url";
import { taxonomyDisplay } from "@/lib/team/taxonomy";

const FALLBACK_MEMBER_IMAGE = "/fallback.jpg";

function ProfilePhotos({ alt, heroSrc }: { alt: string; heroSrc: string }) {
  const [useFallback, setUseFallback] = useState(false);
  const src = useFallback ? FALLBACK_MEMBER_IMAGE : heroSrc;

  const handleError = () => setUseFallback(true);

  return (
    <div className="relative mt-10 aspect-[4/5] w-full overflow-hidden rounded-[2rem] border border-white/10 shadow-[0_40px_120px_-40px_rgba(27,110,200,0.45)] md:aspect-[16/10]">
      <img
        src={src}
        alt={alt}
        className="h-full w-full object-cover object-center"
        decoding="async"
        onError={handleError}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0c0a09] via-transparent to-transparent" />
    </div>
  );
}

function ContactIcon({ type }: { type: string }) {
  const common = "h-5 w-5 shrink-0";
  switch (type) {
    case "LinkedIn":
    case "GitHub":
      return <Code2 className={common} />;
    case "Email":
      return <Mail className={common} />;
    case "Phone":
    case "WhatsApp":
      return <Phone className={common} />;
    case "Instagram":
      return <Camera className={common} />;
    case "Snapchat":
      return <Sparkles className={common} />;
    case "Discord":
      return <MessageCircle className={common} />;
    default:
      return <Link2 className={common} />;
  }
}

function contactHref(type: string, value: string) {
  const v = value.trim();
  if (type === "Email") return `mailto:${v}`;
  if (type === "Phone") return `tel:${v.replace(/\s/g, "")}`;
  if (type === "WhatsApp") {
    const digits = v.replace(/\D/g, "");
    return digits ? `https://wa.me/${digits}` : v;
  }
  if (v.startsWith("http")) return v;
  return `https://${v}`;
}

function ContactPill({ contact }: { contact: TeamContact }) {
  const t = contact.type ?? "Other";
  const v = contact.value ?? "";
  const external = t !== "Email" && t !== "Phone";
  return (
    <a
      href={contactHref(t, v)}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="group/pill flex items-center gap-2.5 rounded-2xl border border-white/12 bg-white/[0.06] px-4 py-3 text-sm text-white/90 shadow-sm backdrop-blur-md transition duration-[400ms] ease-in-out hover:border-white/25 hover:bg-white/[0.1] hover:shadow-[0_12px_40px_-16px_rgba(27,110,200,0.35)]"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition duration-[400ms] ease-in-out group-hover/pill:bg-white/15">
        <ContactIcon type={t} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-semibold uppercase tracking-wider text-white/50">{t}</span>
        <span className="block truncate text-sm font-medium text-white">{v}</span>
      </span>
    </a>
  );
}

function ContactGroup({ title, items }: { title: string; items: TeamContact[] }) {
  if (!items.length) return null;
  return (
    <div className="space-y-4">
      <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">{title}</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((c) => (
          <ContactPill key={c._key ?? `${c.type}-${c.value}`} contact={c} />
        ))}
      </div>
    </div>
  );
}

function SocialPlaceholder({ platform }: { platform: SocialPlatform }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-dashed border-white/18 bg-white/[0.03] px-4 py-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/55">
        <ContactIcon type={platform} />
      </span>
      <div className="min-w-0">
        <span className="block text-[11px] font-semibold uppercase tracking-wider text-white/40">{platform}</span>
        <span className="block text-sm text-white/45">Not shared publicly</span>
      </div>
    </div>
  );
}

type MemberProfileProps = {
  member: TeamMemberProfile;
};

export function MemberProfile({ member }: MemberProfileProps) {
  const heroSrc = memberImageSrc(member);
  const visibleContacts = getVisibleContacts(member);
  const { direct, social } = partitionContacts(visibleContacts);
  const otherSocial = extraSocialContacts(social);
  const roleLine = formatRoleTitles(member.roles);
  const directoryHref = member.academicYear
    ? teamListingHref({ year: member.academicYear })
    : "/team";
  const departmentLabel = taxonomyDisplay(member.department ?? "");
  const schoolStatusLabel = taxonomyDisplay(member.schoolStatus ?? "");
  const showBirthday = member.visibility?.showBirthday && member.birthday;
  const showFullDescription = member.visibility?.showFullDescription !== false && member.fullDescription;

  const bioText = member.bio?.trim();
  const shortBioText = member.shortBio?.trim();
  const sameIntro = Boolean(
    bioText && shortBioText && bioText === shortBioText,
  );
  /** One-line summary under the name when both fields exist and differ */
  const tagline =
    shortBioText && bioText && shortBioText !== bioText ? shortBioText : null;
  /** Main bio paragraph(s); avoids duplicating the tagline when identical */
  const mainBio =
    bioText && shortBioText && bioText !== shortBioText
      ? bioText
      : bioText && (!shortBioText || sameIntro)
        ? bioText
        : null;

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="mx-auto w-[min(94%,720px)] px-4 pb-24 pt-28 md:pt-32"
    >
      <Link
        href={directoryHref}
        className="text-sm font-medium text-blue-300 transition duration-[400ms] ease-in-out hover:text-blue-200"
      >
        ← Team directory
      </Link>

      <ProfilePhotos key={heroSrc} heroSrc={heroSrc} alt={member.name} />

      <header className="mt-10 text-center">
        <div className="flex flex-wrap items-center justify-center gap-2">
          {member.roleType ? (
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white/85">
              {member.roleType}
            </span>
          ) : null}
          <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[11px] font-medium text-white/70">
            {schoolStatusLabel}
          </span>
          <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[11px] font-medium text-white/70">
            {departmentLabel}
          </span>
        </div>
        <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white md:text-5xl">{member.name}</h1>
        <p className="mt-2 text-lg text-blue-200/90">{roleLine}</p>
        {tagline ? (
          <p className="mx-auto mt-4 max-w-lg text-base font-medium leading-snug text-white/85">{tagline}</p>
        ) : null}
        {member.academicYear ? (
          <p className="mt-2 font-mono text-xs text-white/50">{member.academicYear}</p>
        ) : null}
        {showBirthday ? (
          <p className="mt-3 text-sm text-white/60">
            Birthday: {formatBirthdayDisplay(member.birthday!)}
          </p>
        ) : null}
      </header>

      {mainBio ? (
        <section className="mx-auto mt-10 max-w-xl text-left">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">Bio</h2>
          <p className="mt-4 text-base leading-relaxed text-white/80">{mainBio}</p>
        </section>
      ) : null}

      {showFullDescription ? (
        <section className="mx-auto mt-10 max-w-xl text-left">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">About</h2>
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-sm leading-relaxed text-white/75 backdrop-blur-md">
            <p className="whitespace-pre-wrap">{member.fullDescription}</p>
          </div>
        </section>
      ) : null}

      <div className="mx-auto mt-14 max-w-2xl space-y-10">
        <ContactGroup title="Direct" items={direct} />

        <div className="space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">Social</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {SOCIAL_PLATFORMS.map((platform) => {
              const hit = visibleContacts.find((c) => c.type === platform);
              return hit ? (
                <ContactPill key={platform} contact={hit} />
              ) : (
                <SocialPlaceholder key={platform} platform={platform} />
              );
            })}
          </div>
          {otherSocial.length > 0 ? (
            <div className="space-y-4 pt-2">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/35">
                Other links
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {otherSocial.map((c) => (
                  <ContactPill key={c._key ?? `${c.type}-${c.value}`} contact={c} />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </motion.article>
  );
}
