"use client";

import { Bebas_Neue, DM_Sans } from "next/font/google";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Camera,
  ChevronRight,
  Code2,
  ExternalLink,
  FileText,
  Gamepad2,
  Globe,
  Hash,
  Headphones,
  Heart,
  Link2,
  Mail,
  MapPin,
  MessageCircle,
  MessageSquare,
  Monitor,
  Music,
  Newspaper,
  Palette,
  PenTool,
  Phone,
  Play,
  Podcast,
  Radio,
  Rss,
  Send,
  Share2,
  ShoppingBag,
  Sparkles,
  Star,
  Trophy,
  Tv,
  User,
  Video,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import type { RoleSummary, TeamContact, TeamMemberProfile } from "@/lib/team/types";
import {
  extraSocialContacts,
  getVisibleContacts,
  partitionContacts,
  SOCIAL_PLATFORMS,
} from "@/lib/team/contacts";
import { formatRoleTitles } from "@/lib/team/format-roles";
import { teamListingHref } from "@/lib/team/academic-year";
import { formatBirthdayDisplay } from "@/lib/team/birthday";
import { memberImageSrc } from "@/lib/team/image-url";
import { taxonomyDisplay } from "@/lib/team/taxonomy";
import { useLanguage, translateCms } from "@/lib/i18n/context";

const FALLBACK_MEMBER_IMAGE = "/fallback.jpg";

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

function contactHref(type: string, value: string) {
  const v = value.trim();
  if (type === "Email") return `mailto:${v}`;
  if (type === "Phone" || type === "Viber") return `tel:${v.replace(/\s/g, "")}`;
  if (type === "WhatsApp") {
    const digits = v.replace(/\D/g, "");
    return digits ? `https://wa.me/${digits}` : v;
  }
  if (type === "Telegram") {
    if (v.startsWith("http")) return v;
    const username = v.replace(/^@/, "");
    return `https://t.me/${username}`;
  }
  if (type === "Discord") {
    if (v.startsWith("http")) return v;
    return `https://discord.gg/${v}`;
  }
  if (v.startsWith("http")) return v;
  return `https://${v}`;
}

function ContactRowIcon({ type }: { type: string }) {
  const cn = "size-3.5";
  const sw = 1.8;
  switch (type) {
    // --- Direct ---
    case "Email":
      return <Mail className={cn} strokeWidth={sw} />;
    case "Phone":
      return <Phone className={cn} strokeWidth={sw} />;
    // --- Messaging ---
    case "WhatsApp":
      return <MessageCircle className={cn} strokeWidth={sw} />;
    case "Telegram":
      return <Send className={cn} strokeWidth={sw} />;
    case "Signal":
      return <Radio className={cn} strokeWidth={sw} />;
    case "Messenger":
      return <MessageSquare className={cn} strokeWidth={sw} />;
    case "Viber":
      return <Phone className={cn} strokeWidth={sw} />;
    case "WeChat":
      return <MessageCircle className={cn} strokeWidth={sw} />;
    case "Line":
      return <MessageSquare className={cn} strokeWidth={sw} />;
    case "iMessage":
      return <MessageCircle className={cn} strokeWidth={sw} />;
    // --- Social ---
    case "Instagram":
      return <Camera className={cn} strokeWidth={sw} />;
    case "Snapchat":
      return <Sparkles className={cn} strokeWidth={sw} />;
    case "Facebook":
      return <User className={cn} strokeWidth={sw} />;
    case "Twitter":
    case "X":
      return <Hash className={cn} strokeWidth={sw} />;
    case "TikTok":
      return <Music className={cn} strokeWidth={sw} />;
    case "Reddit":
      return <MessageCircle className={cn} strokeWidth={sw} />;
    case "Threads":
      return <Hash className={cn} strokeWidth={sw} />;
    case "Mastodon":
      return <Globe className={cn} strokeWidth={sw} />;
    case "Bluesky":
      return <Globe className={cn} strokeWidth={sw} />;
    case "Pinterest":
      return <Heart className={cn} strokeWidth={sw} />;
    case "Tumblr":
      return <PenTool className={cn} strokeWidth={sw} />;
    // --- Professional ---
    case "LinkedIn":
      return <User className={cn} strokeWidth={sw} />;
    case "GitHub":
      return <Code2 className={cn} strokeWidth={sw} />;
    case "GitLab":
      return <Code2 className={cn} strokeWidth={sw} />;
    case "Bitbucket":
      return <Code2 className={cn} strokeWidth={sw} />;
    case "Stack Overflow":
      return <Zap className={cn} strokeWidth={sw} />;
    case "Codepen":
      return <PenTool className={cn} strokeWidth={sw} />;
    case "Dev.to":
      return <FileText className={cn} strokeWidth={sw} />;
    case "Hashnode":
      return <Hash className={cn} strokeWidth={sw} />;
    case "HackerRank":
      return <Trophy className={cn} strokeWidth={sw} />;
    case "LeetCode":
      return <Code2 className={cn} strokeWidth={sw} />;
    case "Kaggle":
      return <Monitor className={cn} strokeWidth={sw} />;
    case "Hugging Face":
      return <Sparkles className={cn} strokeWidth={sw} />;
    case "Behance":
      return <Palette className={cn} strokeWidth={sw} />;
    case "Dribbble":
      return <Palette className={cn} strokeWidth={sw} />;
    case "Figma":
      return <PenTool className={cn} strokeWidth={sw} />;
    case "Notion":
      return <FileText className={cn} strokeWidth={sw} />;
    case "Medium":
      return <BookOpen className={cn} strokeWidth={sw} />;
    case "Substack":
      return <Newspaper className={cn} strokeWidth={sw} />;
    // --- Media & Content ---
    case "YouTube":
      return <Play className={cn} strokeWidth={sw} />;
    case "Twitch":
      return <Tv className={cn} strokeWidth={sw} />;
    case "Spotify":
      return <Music className={cn} strokeWidth={sw} />;
    case "SoundCloud":
      return <Headphones className={cn} strokeWidth={sw} />;
    case "Apple Music":
      return <Music className={cn} strokeWidth={sw} />;
    case "Podcast":
      return <Podcast className={cn} strokeWidth={sw} />;
    case "Vimeo":
      return <Video className={cn} strokeWidth={sw} />;
    // --- Gaming ---
    case "Discord":
      return <Gamepad2 className={cn} strokeWidth={sw} />;
    case "Steam":
      return <Gamepad2 className={cn} strokeWidth={sw} />;
    case "Xbox":
      return <Gamepad2 className={cn} strokeWidth={sw} />;
    case "PlayStation":
      return <Gamepad2 className={cn} strokeWidth={sw} />;
    case "Epic Games":
      return <Gamepad2 className={cn} strokeWidth={sw} />;
    // --- Academic ---
    case "Google Scholar":
      return <BookOpen className={cn} strokeWidth={sw} />;
    case "ResearchGate":
      return <FileText className={cn} strokeWidth={sw} />;
    case "ORCID":
      return <User className={cn} strokeWidth={sw} />;
    case "Academia.edu":
      return <BookOpen className={cn} strokeWidth={sw} />;
    // --- Other ---
    case "Website":
    case "Portfolio":
    case "Blog":
      return <Globe className={cn} strokeWidth={sw} />;
    case "RSS":
      return <Rss className={cn} strokeWidth={sw} />;
    case "Calendly":
      return <Calendar className={cn} strokeWidth={sw} />;
    case "PayPal":
    case "Venmo":
    case "Ko-fi":
    case "Buy Me a Coffee":
    case "Patreon":
      return <Star className={cn} strokeWidth={sw} />;
    case "App Store":
    case "Play Store":
      return <ShoppingBag className={cn} strokeWidth={sw} />;
    case "Linktree":
      return <ExternalLink className={cn} strokeWidth={sw} />;
    default:
      return <Link2 className={cn} strokeWidth={sw} />;
  }
}

function socialIconWrapClass(type: string): string {
  switch (type) {
    // Direct
    case "Email":
      return "bg-sky-500/10 text-sky-400";
    case "Phone":
      return "bg-violet-500/10 text-violet-300";
    // Messaging
    case "WhatsApp":
      return "bg-emerald-500/10 text-emerald-300";
    case "Telegram":
      return "bg-sky-500/10 text-sky-400";
    case "Signal":
      return "bg-blue-500/10 text-blue-400";
    case "Messenger":
      return "bg-blue-500/10 text-blue-400";
    case "Viber":
      return "bg-purple-500/10 text-purple-400";
    case "WeChat":
      return "bg-green-500/10 text-green-400";
    case "Line":
      return "bg-green-500/10 text-green-400";
    case "iMessage":
      return "bg-blue-500/10 text-blue-400";
    // Social
    case "Instagram":
      return "bg-fuchsia-500/10 text-fuchsia-300";
    case "Snapchat":
      return "bg-yellow-500/10 text-yellow-300";
    case "Facebook":
      return "bg-blue-500/10 text-blue-400";
    case "Twitter":
    case "X":
      return "bg-slate-500/10 text-slate-300";
    case "TikTok":
      return "bg-pink-500/10 text-pink-300";
    case "Reddit":
      return "bg-orange-500/10 text-orange-400";
    case "Threads":
      return "bg-slate-500/10 text-slate-300";
    case "Mastodon":
      return "bg-indigo-500/10 text-indigo-400";
    case "Bluesky":
      return "bg-sky-500/10 text-sky-400";
    case "Pinterest":
      return "bg-red-500/10 text-red-400";
    case "Tumblr":
      return "bg-indigo-500/10 text-indigo-300";
    // Professional
    case "LinkedIn":
      return "bg-sky-500/10 text-sky-400";
    case "GitHub":
      return "bg-slate-500/10 text-slate-300";
    case "GitLab":
      return "bg-orange-500/10 text-orange-400";
    case "Bitbucket":
      return "bg-blue-500/10 text-blue-400";
    case "Stack Overflow":
      return "bg-orange-500/10 text-orange-400";
    case "Codepen":
      return "bg-slate-500/10 text-slate-300";
    case "Dev.to":
      return "bg-slate-500/10 text-slate-300";
    case "Hashnode":
      return "bg-blue-500/10 text-blue-400";
    case "HackerRank":
      return "bg-green-500/10 text-green-400";
    case "LeetCode":
      return "bg-amber-500/10 text-amber-400";
    case "Kaggle":
      return "bg-cyan-500/10 text-cyan-400";
    case "Hugging Face":
      return "bg-yellow-500/10 text-yellow-300";
    case "Behance":
      return "bg-blue-500/10 text-blue-400";
    case "Dribbble":
      return "bg-pink-500/10 text-pink-400";
    case "Figma":
      return "bg-violet-500/10 text-violet-400";
    case "Notion":
      return "bg-slate-500/10 text-slate-300";
    case "Medium":
      return "bg-slate-500/10 text-slate-300";
    case "Substack":
      return "bg-orange-500/10 text-orange-400";
    // Media & Content
    case "YouTube":
      return "bg-red-500/10 text-red-400";
    case "Twitch":
      return "bg-purple-500/10 text-purple-400";
    case "Spotify":
      return "bg-green-500/10 text-green-400";
    case "SoundCloud":
      return "bg-orange-500/10 text-orange-400";
    case "Apple Music":
      return "bg-pink-500/10 text-pink-400";
    case "Podcast":
      return "bg-violet-500/10 text-violet-400";
    case "Vimeo":
      return "bg-cyan-500/10 text-cyan-400";
    // Gaming
    case "Discord":
      return "bg-indigo-500/10 text-indigo-400";
    case "Steam":
      return "bg-slate-500/10 text-slate-300";
    case "Xbox":
      return "bg-green-500/10 text-green-400";
    case "PlayStation":
      return "bg-blue-500/10 text-blue-400";
    case "Epic Games":
      return "bg-slate-500/10 text-slate-300";
    // Academic
    case "Google Scholar":
      return "bg-blue-500/10 text-blue-400";
    case "ResearchGate":
      return "bg-teal-500/10 text-teal-400";
    case "ORCID":
      return "bg-green-500/10 text-green-400";
    case "Academia.edu":
      return "bg-blue-500/10 text-blue-400";
    // Other
    case "Website":
    case "Portfolio":
    case "Blog":
      return "bg-cyan-500/10 text-cyan-400";
    case "RSS":
      return "bg-orange-500/10 text-orange-400";
    case "Calendly":
      return "bg-blue-500/10 text-blue-400";
    case "PayPal":
    case "Venmo":
    case "Ko-fi":
    case "Buy Me a Coffee":
    case "Patreon":
      return "bg-amber-500/10 text-amber-400";
    case "App Store":
    case "Play Store":
      return "bg-blue-500/10 text-blue-400";
    case "Linktree":
      return "bg-green-500/10 text-green-400";
    default:
      return "bg-violet-500/10 text-violet-300";
  }
}

function skillWidthPct(seed: string, index: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h + seed.charCodeAt(i) * (i + 1)) % 997;
  return 58 + ((h + index * 17) % 38);
}

type MemberProfileProps = {
  member: TeamMemberProfile;
};

export function MemberProfile({ member }: MemberProfileProps) {
  const { t, locale } = useLanguage();
  const isFr = locale !== "en";
  const [heroFallback, setHeroFallback] = useState(false);
  const [avatarFallback, setAvatarFallback] = useState(false);

  const heroSrc = heroFallback ? FALLBACK_MEMBER_IMAGE : memberImageSrc(member);
  const avatarSrc = avatarFallback ? FALLBACK_MEMBER_IMAGE : memberImageSrc(member);

  const visibleContacts = getVisibleContacts(member);
  const { direct, social } = partitionContacts(visibleContacts);
  const otherSocial = extraSocialContacts(social);
  const roleLine = formatRoleTitles(member.roles);
  const directoryHref = member.academicYear
    ? teamListingHref({ year: member.academicYear })
    : "/team";
  const departmentLabel = taxonomyDisplay(member.department ?? "", "");
  const schoolStatusLabel = taxonomyDisplay(member.schoolStatus ?? "", "");
  const showBirthday = member.visibility?.showBirthday && member.birthday;
  const localizedFullDesc = isFr
    ? (member.fullDescriptionFr?.trim() || member.fullDescription?.trim() || "")
    : (member.fullDescription?.trim() || "");
  const showFullDescription = member.visibility?.showFullDescription !== false && localizedFullDesc;

  const bioText = (isFr ? (member.bioFr?.trim() || member.bio?.trim()) : member.bio?.trim()) ?? undefined;
  const shortBioText = (isFr ? (member.shortBioFr?.trim() || member.shortBio?.trim()) : member.shortBio?.trim()) ?? undefined;
  const sameIntro = Boolean(bioText && shortBioText && bioText === shortBioText);
  const tagline =
    shortBioText && bioText && shortBioText !== bioText ? shortBioText : null;
  const mainBio =
    bioText && shortBioText && bioText !== shortBioText
      ? bioText
      : bioText && (!shortBioText || sameIntro)
        ? bioText
        : null;

  let bioLead = "";
  let bioQuote: string | null = null;
  if (mainBio) {
    const chunks = mainBio.split(/\n\n+/).map((s) => s.trim()).filter(Boolean);
    if (chunks.length >= 2) {
      bioLead = chunks[0]!;
      bioQuote = chunks.slice(1).join("\n\n");
    } else {
      const sentences = mainBio.split(/(?<=[.!?])\s+/);
      if (sentences.length >= 2) {
        bioLead = sentences[0]!;
        bioQuote = sentences.slice(1).join(" ");
      } else {
        bioLead = mainBio;
        bioQuote = null;
      }
    }
  }

  const r = member.roles;
  const roleTitles: string[] = (() => {
    if (!r?.length) return [];
    const first = r[0];
    if (typeof first === "string") return (r as unknown as string[]).filter(Boolean);
    return (r as RoleSummary[])
      .map((x) => x.title)
      .filter((t): t is string => Boolean(t));
  })();

  const adminExpertise = (member.expertise ?? [])
    .map((e) => ({
      title: isFr && typeof e?.titleFr === "string" && e.titleFr.trim()
        ? e.titleFr.trim()
        : typeof e?.title === "string" ? e.title.trim() : "",
      pct: Math.max(0, Math.min(100, Math.round(Number(e?.level) || 0))),
    }))
    .filter((e) => e.title.length > 0)
    .slice(0, 12);

  const skills =
    adminExpertise.length > 0
      ? adminExpertise
      : roleTitles.length > 0
        ? roleTitles.slice(0, 8).map((title, i) => ({
            title,
            pct: skillWidthPct(title, i),
          }))
        : [{ title: t.memberProfilePage.clubMemberFallback, pct: 72 }];

  const interestTags = [
    ...new Set(
      [
        member.roleType ? translateCms(t, "roleType", member.roleType) : "",
        schoolStatusLabel ? translateCms(t, "roleType", schoolStatusLabel) : "",
        departmentLabel,
        member.academicYear,
        ...roleTitles.map((rt) => translateCms(t, "roleType", rt)),
      ]
        .map((s) => (typeof s === "string" ? s.trim() : ""))
        .filter(Boolean),
    ),
  ].slice(0, 14);

  const primaryEmail = direct.find((c) => c.type === "Email")?.value?.trim();
  const primaryWhatsApp = direct.find((c) => c.type === "WhatsApp");

  async function shareProfile() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) {
        await navigator.share({ title: member.name, url });
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
  }

  const socialSlots: TeamContact[] = [];
  for (const p of SOCIAL_PLATFORMS) {
    const hit = visibleContacts.find((c) => c.type === p);
    if (hit) socialSlots.push(hit);
  }
  for (const c of otherSocial) socialSlots.push(c);

  const sidebarContacts = [...direct, ...socialSlots];

  const startedYearDisplay = member.startedYear?.trim()
    ? member.startedYear.trim()
    : "—";

  const stats = [
    { n: String(roleTitles.length || 0), l: t.memberProfilePage.rolesLabel },
    { n: startedYearDisplay, l: t.memberProfilePage.startedLabel },
    {
      n: typeof member.order === "number" && Number.isFinite(member.order) ? String(member.order) : "—",
      l: t.memberProfilePage.orderLabel,
    },
    { n: String(visibleContacts.length), l: t.memberProfilePage.linksLabel },
  ];

  const statColors = ["text-sky-400", "text-violet-300", "text-emerald-400", "text-amber-400"];

  const messageHref = primaryEmail
    ? `mailto:${primaryEmail}`
    : primaryWhatsApp
      ? contactHref("WhatsApp", primaryWhatsApp.value ?? "")
      : null;

  return (
    <article className={`member-profile-shell relative min-h-screen bg-[#08080e] text-[#f0eff5] ${fontSans.className}`}>
      <style>{`
        @keyframes profile-fade-down {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes profile-fade-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes profile-fill-bar {
          from { width: 0; }
        }
        @keyframes profile-badge-pulse {
          0%, 100% { box-shadow: 0 0 8px rgba(62,207,142,0.45); }
          50% { box-shadow: 0 0 14px rgba(62,207,142,0.75); }
        }
      `}</style>

      {/* Hero shell: pt clears fixed Navbar; bg layers fill full box (edge-to-edge at top). */}
      <div className="relative pt-24 md:pt-28">
        <img
          src={heroSrc}
          alt=""
          className="pointer-events-none absolute left-0 top-0 h-px w-px opacity-0"
          onError={() => setHeroFallback(true)}
          decoding="async"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 z-0 bg-cover bg-top brightness-[0.55] saturate-[80%] [background-attachment:scroll] md:[background-attachment:fixed]"
          style={{
            backgroundImage: `url(${JSON.stringify(heroSrc)})`,
            backgroundPosition: "center top",
          }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 z-[1] [background:repeating-linear-gradient(0deg,transparent,transparent_3px,rgba(0,0,0,0.025)_3px,rgba(0,0,0,0.025)_4px)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-t from-[#08080e] via-[#08080e]/40 to-transparent"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-r from-[#08080e]/50 to-transparent"
          aria-hidden
        />

        {/* Reserve height for the fixed bar so hero + identity layout matches the old flow. */}
        <div className="relative z-[5] h-[52px] shrink-0 sm:h-14" aria-hidden />

        {/* Local top bar: fixed under global Navbar — does not scroll with the page. */}
        <nav
          className="member-profile-nav-bar fixed left-0 right-0 top-[5.5rem] z-40 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-4 sm:top-24 sm:px-6 md:px-10 lg:px-12 [&_a]:[text-shadow:0_1px_3px_rgba(0,0,0,0.92),0_0_18px_rgba(0,0,0,0.5)] [&_span]:[text-shadow:0_1px_3px_rgba(0,0,0,0.92),0_0_18px_rgba(0,0,0,0.5)] [&_svg]:[filter:drop-shadow(0_1px_2px_rgba(0,0,0,0.85))]"
          style={{ animation: "profile-fade-down 0.5s ease both" }}
        >
          <Link
            href={directoryHref}
            className="inline-flex min-w-0 flex-1 items-center gap-2 text-xs text-[#f0eff5]/85 transition hover:gap-3 hover:text-white"
          >
            <ArrowLeft className="size-3.5 shrink-0 text-[#f0eff5]/90" strokeWidth={2} />
            <span className="truncate">{t.memberProfilePage.teamDirectory}</span>
          </Link>
          <div className="hidden min-w-0 items-center gap-2 text-xs text-[#f0eff5]/80 sm:flex">
            <span>{t.sections.teamTitle}</span>
            <ChevronRight className="size-3 shrink-0 text-[#f0eff5]/55" strokeWidth={2} />
            <span className="max-w-[140px] truncate">{member.roleType ? translateCms(t, "roleType", member.roleType) : (member.academicYear || t.memberProfilePage.clubMemberFallback)}</span>
            <ChevronRight className="size-3 shrink-0 text-[#f0eff5]/55" strokeWidth={2} />
            <span className="max-w-[180px] truncate font-medium text-white">{member.name}</span>
          </div>
        </nav>

        {/* Hero strip height (pattern + portrait live in bg layer above) */}
        <div
          className="relative z-[3] h-[min(55vh,340px)] sm:h-[480px]"
          aria-hidden
        />
      </div>

      {/* Identity — must not sit inside overflow-x-hidden: that forces overflow-y:auto and clips the upward overlap into the hero. */}
      <div
        className="relative z-[4] mx-auto grid max-w-[1100px] grid-cols-1 gap-6 px-4 text-center max-sm:items-center sm:-mt-28 sm:grid-cols-[120px_1fr] sm:gap-7 sm:px-6 sm:text-left md:-mt-[140px] md:grid-cols-[160px_1fr_auto] md:gap-8 md:px-10 lg:px-12"
        style={{ animation: "profile-fade-up 0.6s ease both 0.15s" }}
      >
        <div className="relative mx-auto shrink-0 sm:mx-0">
          <div className="relative">
            <img
              src={avatarSrc}
              alt={member.name}
              className="block size-[120px] rounded-[18px] border-2 border-white/[0.13] object-cover object-top shadow-[0_20px_60px_rgba(0,0,0,0.7)] sm:size-[160px] sm:rounded-[20px]"
              onError={() => setAvatarFallback(true)}
              decoding="async"
            />
            <span
              className="absolute bottom-2.5 right-2.5 size-3.5 rounded-full border-2 border-[#08080e] bg-emerald-400"
              style={{ animation: "profile-badge-pulse 2.5s ease-in-out infinite" }}
              aria-hidden
            />
          </div>
        </div>

        <div className="min-w-0 pb-2 text-center sm:text-left">
          <div className="mb-3 flex flex-wrap justify-center gap-2 sm:justify-start">
            {member.roleType ? (
              <span className="rounded-full border border-sky-400/30 bg-sky-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-400">
                {translateCms(t, "roleType", member.roleType)}
              </span>
            ) : null}
            {roleTitles[0] ? (
              <span className="rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-300">
                {translateCms(t, "roleType", roleTitles[0])}
              </span>
            ) : null}
            {schoolStatusLabel ? (
              <span className="rounded-full border border-white/[0.13] bg-white/[0.05] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6b6a80]">
                {translateCms(t, "roleType", schoolStatusLabel)}
              </span>
            ) : null}
          </div>
          <h1
            className={`member-profile-hero-title mb-2 text-[clamp(2.25rem,5vw,3.5rem)] leading-[0.95] tracking-[0.02em] text-[#f0eff5] ${fontDisplay.className}`}
          >
            {member.name}
          </h1>
          <p className="member-profile-hero-subtitle flex items-center justify-center gap-2 text-sm font-light text-[#6b6a80] sm:justify-start">
            <span className="h-px w-4 bg-sky-400" aria-hidden />
            {roleLine.split(" · ").map(s => translateCms(t, "roleType", s)).join(" · ")}
          </p>
          {tagline ? (
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-[#f0eff5]/70 sm:mx-0">{tagline}</p>
          ) : null}
        </div>

        <div className="hidden flex-col gap-2 pb-2 md:flex">
          {messageHref ? (
            <a
              href={messageHref}
              className="inline-flex items-center justify-center gap-2 rounded-[10px] bg-sky-500 px-5 py-2.5 text-[12.5px] font-medium text-white shadow-[0_4px_20px_rgba(79,142,247,0.25)] transition hover:-translate-y-px hover:opacity-90"
            >
              <Mail className="size-3.5" strokeWidth={2} />
              {t.memberProfilePage.sendMessage}
            </a>
          ) : null}
          <button
            type="button"
            onClick={() => {
              void shareProfile();
            }}
            className="inline-flex items-center justify-center gap-2 rounded-[10px] border border-white/[0.13] bg-white/[0.05] px-5 py-2.5 text-[12.5px] font-medium text-[#f0eff5] transition hover:bg-white/[0.09]"
          >
            <Share2 className="size-3.5" strokeWidth={2} />
            {t.memberProfilePage.shareProfile}
          </button>
        </div>
      </div>

      {/* Mobile actions */}
      <div className="mx-auto mt-6 flex max-w-[1100px] flex-wrap justify-center gap-2 px-4 sm:hidden">
        {messageHref ? (
          <a
            href={messageHref}
            className="inline-flex items-center gap-2 rounded-[10px] bg-sky-500 px-4 py-2.5 text-xs font-medium text-white"
          >
            <Mail className="size-3.5" strokeWidth={2} />
            {t.memberProfilePage.message}
          </a>
        ) : null}
        <button
          type="button"
          onClick={() => {
            void shareProfile();
          }}
          className="inline-flex items-center gap-2 rounded-[10px] border border-white/[0.13] bg-white/[0.05] px-4 py-2.5 text-xs font-medium"
        >
          <Share2 className="size-3.5" strokeWidth={2} />
          {t.memberProfilePage.share}
        </button>
      </div>

      <div className="mx-auto mt-8 max-w-[1100px] border-t border-white/[0.07] px-4 sm:px-6 md:px-10 lg:px-12" />

      {/* Body: horizontal clip only — avoids clipping the identity overlap above. */}
      <div className="overflow-x-hidden">
      <div
        className="relative z-[1] mx-auto grid max-w-[1100px] items-start gap-10 px-4 py-10 sm:gap-12 sm:px-6 md:grid-cols-[1fr_280px] md:px-10 md:py-12 lg:px-12 lg:pb-24"
        style={{ animation: "profile-fade-up 0.7s ease both 0.25s" }}
      >
        <div className="min-w-0 space-y-12 md:space-y-14">
          {mainBio ? (
            <section>
              <p className="mb-5 flex items-center gap-3 text-[9px] font-semibold uppercase tracking-[0.26em] text-[#6b6a80]">
                <span className="h-px w-[18px] shrink-0 bg-sky-400" />
                {t.memberProfilePage.bio}
                <span className="h-px min-w-[2rem] flex-1 bg-white/[0.07]" />
              </p>
              <div className="space-y-4 text-[15px] font-light leading-[1.85] text-[#f0eff5]/[0.72]">
                {bioLead ? <p>{bioLead}</p> : null}
                {bioQuote ? (
                  <blockquote className="border-l-[3px] border-sky-500 bg-sky-500/[0.05] py-4 pl-5 pr-5 text-[17px] italic leading-relaxed text-[#f0eff5] sm:rounded-r-xl sm:pr-6">
                    {bioQuote}
                  </blockquote>
                ) : null}
              </div>
            </section>
          ) : null}

          {showFullDescription && localizedFullDesc ? (
            <section>
              <p className="mb-5 flex items-center gap-3 text-[9px] font-semibold uppercase tracking-[0.26em] text-[#6b6a80]">
                <span className="h-px w-[18px] shrink-0 bg-sky-400" />
                {t.memberProfilePage.about}
                <span className="h-px min-w-[2rem] flex-1 bg-white/[0.07]" />
              </p>
              <div className="space-y-3.5 text-[14.5px] font-light leading-[1.85] text-[#f0eff5]/[0.68]">
                <p className="whitespace-pre-wrap">{localizedFullDesc}</p>
              </div>
            </section>
          ) : null}

          <section>
            <p className="mb-5 flex items-center gap-3 text-[9px] font-semibold uppercase tracking-[0.26em] text-[#6b6a80]">
              <span className="h-px w-[18px] shrink-0 bg-sky-400" />
              {t.memberProfilePage.expertise}
              <span className="h-px min-w-[2rem] flex-1 bg-white/[0.07]" />
            </p>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {skills.map((s, i) => (
                <div
                  key={`${s.title}-${i}`}
                  className="flex flex-col gap-2.5 rounded-xl border border-white/[0.07] bg-[#0d0d18] px-4 py-4 transition hover:border-white/[0.13] hover:bg-[#111120]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-medium text-[#f0eff5]">{s.title}</span>
                    <span className="text-[11px] text-[#6b6a80]">{s.pct}%</span>
                  </div>
                  <div className="h-0.5 overflow-hidden rounded-full bg-white/[0.07]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-500 to-violet-400"
                      style={{
                        width: `${s.pct}%`,
                        animation: "profile-fill-bar 1.2s cubic-bezier(0.22,1,0.36,1) both",
                        animationDelay: `${0.05 * i}s`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {interestTags.length ? (
            <section>
              <p className="mb-5 flex items-center gap-3 text-[9px] font-semibold uppercase tracking-[0.26em] text-[#6b6a80]">
                <span className="h-px w-[18px] shrink-0 bg-sky-400" />
                {t.memberProfilePage.interestsAndAreas}
                <span className="h-px min-w-[2rem] flex-1 bg-white/[0.07]" />
              </p>
              <div className="flex flex-wrap gap-2">
                {interestTags.map((tag) => (
                  <span
                    key={tag}
                    className="cursor-default rounded-full border border-white/[0.07] bg-white/[0.03] px-3 py-1 text-[11px] text-[#6b6a80] transition hover:border-sky-400/30 hover:text-sky-400"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <aside className="flex min-w-0 flex-col gap-4 md:sticky md:top-[7.5rem]">
          <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0d0d18]">
            <div className="flex items-center gap-2 border-b border-white/[0.07] px-5 py-3 text-[9px] font-semibold uppercase tracking-[0.2em] text-[#6b6a80]">
              <span className="size-1.5 shrink-0 rounded-full bg-sky-400" />
              {t.memberProfilePage.impact}
            </div>
            <div className="grid grid-cols-2 gap-px bg-white/[0.07]">
              {stats.map((s, i) => (
                <div
                  key={`stat-${i}-${s.l}`}
                  className="flex flex-col items-center gap-1 bg-[#111120] px-4 py-4 text-center transition hover:bg-[#0d0d18]"
                >
                  <span className={`text-[32px] leading-none tracking-[0.04em] ${fontDisplay.className} ${statColors[i % statColors.length]}`}>
                    {s.n}
                  </span>
                  <span className="text-[10px] font-light uppercase tracking-[0.06em] text-[#6b6a80]">
                    {s.l}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0d0d18]">
            <div className="flex items-center gap-2 border-b border-white/[0.07] px-5 py-3 text-[9px] font-semibold uppercase tracking-[0.2em] text-[#6b6a80]">
              <span className="size-1.5 shrink-0 rounded-full bg-sky-400" />
              {t.memberProfilePage.details}
            </div>
            <div className="flex flex-col gap-3.5 p-5">
              <div className="flex gap-3 border-b border-white/[0.07] pb-3.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-sky-500/15 bg-sky-500/10 text-sky-400">
                  <BookOpen className="size-3.5" strokeWidth={1.8} />
                </div>
                <div className="min-w-0">
                  <p className="mb-0.5 text-[10px] text-[#6b6a80]">{t.memberProfilePage.department}</p>
                  <p className="text-[13px] leading-snug text-[#f0eff5]">
                    {departmentLabel || "—"}
                  </p>
                </div>
              </div>
              <div className="flex gap-3 border-b border-white/[0.07] pb-3.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-sky-500/15 bg-sky-500/10 text-sky-400">
                  <MapPin className="size-3.5" strokeWidth={1.8} />
                </div>
                <div className="min-w-0">
                  <p className="mb-0.5 text-[10px] text-[#6b6a80]">{t.memberProfilePage.school}</p>
                  <p className="text-[13px] leading-snug text-[#f0eff5]">
                    {schoolStatusLabel ? translateCms(t, "roleType", schoolStatusLabel) : t.memberProfilePage.schoolFallback}
                  </p>
                </div>
              </div>
              <div className="flex gap-3 border-b border-white/[0.07] pb-3.5 last:border-0 last:pb-0">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-sky-500/15 bg-sky-500/10 text-sky-400">
                  <Calendar className="size-3.5" strokeWidth={1.8} />
                </div>
                <div className="min-w-0">
                  <p className="mb-0.5 text-[10px] text-[#6b6a80]">{t.memberProfilePage.academicYear}</p>
                  <p className="text-[13px] leading-snug text-[#f0eff5]">
                    {member.academicYear?.trim() || "—"}
                  </p>
                </div>
              </div>
              {showBirthday ? (
                <div className="flex gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-sky-500/15 bg-sky-500/10 text-sky-400">
                    <User className="size-3.5" strokeWidth={1.8} />
                  </div>
                  <div className="min-w-0">
                    <p className="mb-0.5 text-[10px] text-[#6b6a80]">{t.memberProfilePage.birthday}</p>
                    <p className="text-[13px] leading-snug text-[#f0eff5]">
                      {formatBirthdayDisplay(member.birthday!)}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {sidebarContacts.length ? (
            <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0d0d18]">
              <div className="flex items-center gap-2 border-b border-white/[0.07] px-5 py-3 text-[9px] font-semibold uppercase tracking-[0.2em] text-[#6b6a80]">
                <span className="size-1.5 shrink-0 rounded-full bg-sky-400" />
                {t.memberProfilePage.socialAndContact}
              </div>
              <div className="flex flex-col gap-2 p-4">
                {sidebarContacts.map((c, idx) => {
                  const cType = c.type ?? "Link";
                  const v = c.value ?? "";
                  const external = cType !== "Email" && cType !== "Phone";
                  return (
                    <a
                      key={`${cType}-${idx}-${v.slice(0, 24)}`}
                      href={contactHref(cType, v)}
                      target={external ? "_blank" : undefined}
                      rel={external ? "noopener noreferrer" : undefined}
                      className="flex items-center gap-3 rounded-[10px] border border-white/[0.07] bg-white/[0.02] px-3.5 py-3 transition hover:translate-x-0.5 hover:border-white/[0.13] hover:bg-white/[0.05]"
                    >
                      <div
                        className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${socialIconWrapClass(cType)}`}
                      >
                        <ContactRowIcon type={cType} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[12.5px] font-medium text-[#f0eff5]">{cType}</p>
                        <p className="truncate text-[11px] text-[#6b6a80]">{v}</p>
                      </div>
                      <ChevronRight className="size-3.5 shrink-0 text-[#6b6a80]" strokeWidth={2} />
                    </a>
                  );
                })}
              </div>
            </div>
          ) : null}

        </aside>
      </div>
      </div>
    </article>
  );
}
