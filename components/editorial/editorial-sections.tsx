"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { formatEventDate } from "@/lib/events/public";
import type {
  CellulesConfig,
  EventItem,
  FaqConfig,
  KnowUsConfig,
  PartnersConfig,
  ProcessStepsConfig,
  WhyJoinConfig,
  ApplySectionConfig,
} from "@/lib/firebase/types";
import type { TeamMemberListItem } from "@/lib/team/types";
import type { SectionLayout } from "@/store/homeContentStore";

/* ── Scroll reveal hook ──────────────────────────────────────── */
function useEdReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            el.classList.add("in");
            io.unobserve(el);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

/* ── Default data ────────────────────────────────────────────── */
const defaultKnowUs = [
  { title: "Our mission", desc: "A hands-on learning community where students design, test, and launch real robotics and AI projects together.", glyph: "↗" },
  { title: "How we work", desc: "Weekly workshops, team challenges, project showcases. Emphasis on practical skills, peer mentorship, and shipping.", glyph: "⌗" },
  { title: "Who can join", desc: "Open to every motivated EST Safi student, from absolute beginners to advanced builders. No prerequisites.", glyph: "◎" },
];

const defaultWhyCards = [
  { num: "01", t: "Real projects", d: "Build systems from scratch — robotics rigs, AI tools, ship them, break them, ship again." },
  { num: "02", t: "Skill stacking", d: "Structured tracks and peer review. Walk in with curiosity, walk out with portfolio." },
  { num: "03", t: "A real network", d: "Mentors, alumni, professionals — connected through shared work, not LinkedIn requests." },
  { num: "04", t: "Competitions", d: "National and regional contests. Compete, win, occasionally lose, learn either way." },
];

const defaultCellules = [
  { n: "01", t: "Organization", d: "Plans events, aligns teams, keeps the whole club moving in sync." },
  { n: "02", t: "Design", d: "From posters to the club's full identity. Where ideas become objects." },
  { n: "03", t: "Media", d: "Every moment, documented. Photo, video, narrative, dispatch." },
  { n: "04", t: "Secretary", d: "Meeting minutes, archives, every document — organized, accessible, never lost." },
  { n: "05", t: "Treasury", d: "Budget, transactions, allocations. Smart with every dirham we get." },
  { n: "06", t: "Communication", d: "Social, partnerships, outreach. The club's voice to the outside world." },
];

const defaultProcess = [
  { n: "01", t: "Integration", d: "Join the club. Meet members. Discover ongoing projects. Find your team.", meta: "Week 1 — 4" },
  { n: "02", t: "Development", d: "Trainings, workshops, sharpen the technical edge. Soft skills sneak in too.", meta: "Month 2 — 5" },
  { n: "03", t: "Engagement", d: "Step up. Share knowledge, collaborate across cellules, drive the club forward.", meta: "Month 5 — 9" },
  { n: "04", t: "Competition", d: "Represent the club. Local, then national. Push limits, ship excellence.", meta: "Year-round" },
];

/* ── Props ────────────────────────────────────────────────────── */
type Props = {
  events: EventItem[];
  teamMembers: TeamMemberListItem[];
  knowUsConfig: KnowUsConfig | null;
  partnersConfig: PartnersConfig | null;
  whyJoinConfig: WhyJoinConfig | null;
  cellulesConfig: CellulesConfig | null;
  processStepsConfig: ProcessStepsConfig | null;
  faqConfig: FaqConfig | null;
  applyConfig: ApplySectionConfig | null;
  sectionLayout: SectionLayout | null;
};

export function EditorialSections({
  events,
  teamMembers,
  knowUsConfig,
  partnersConfig,
  whyJoinConfig,
  cellulesConfig,
  processStepsConfig,
  faqConfig,
  applyConfig,
  sectionLayout,
}: Props) {
  const layout = sectionLayout ?? {
    order: ["hero", "events", "knowUs", "whyJoin", "cellules", "processSteps", "team", "faq", "apply", "footer"],
    visibility: {} as Record<string, boolean>,
  };
  const isVisible = (id: string) => layout.visibility[id] !== false;
  const sectionOrder = (id: string) => {
    const idx = layout.order.indexOf(id);
    return idx >= 0 ? idx : 999;
  };

  return (
    <div className="flex flex-col">
      {isVisible("events") && (
        <div style={{ order: sectionOrder("events") }}>
          <EventsSection events={events} />
        </div>
      )}
      {isVisible("knowUs") && (
        <div style={{ order: sectionOrder("knowUs") }}>
          <KnowUsSection config={knowUsConfig} />
        </div>
      )}
      {partnersConfig?.logos?.length ? (
        <div style={{ order: sectionOrder("knowUs") + 0.5 }}>
          <PartnersSection config={partnersConfig} />
        </div>
      ) : null}
      {isVisible("whyJoin") && (
        <div style={{ order: sectionOrder("whyJoin") }}>
          <WhyJoinSection config={whyJoinConfig} />
        </div>
      )}
      {isVisible("cellules") && (
        <div style={{ order: sectionOrder("cellules") }}>
          <CellulesSection config={cellulesConfig} />
        </div>
      )}
      {isVisible("processSteps") && (
        <div style={{ order: sectionOrder("processSteps") }}>
          <ProcessSection config={processStepsConfig} />
        </div>
      )}
      {isVisible("team") && (
        <div style={{ order: sectionOrder("team") }}>
          <TeamSection members={teamMembers} />
        </div>
      )}
      {isVisible("faq") && (
        <div style={{ order: sectionOrder("faq") }}>
          <FAQSection config={faqConfig} />
        </div>
      )}
      {isVisible("apply") && (
        <div style={{ order: sectionOrder("apply") }}>
          <ApplySection config={applyConfig} />
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Individual sections
   ══════════════════════════════════════════════════════════════════ */

function EventsSection({ events }: { events: EventItem[] }) {
  const ref = useEdReveal();
  const cardClasses = ["ed-event-card-feature", "ed-event-card-1", "ed-event-card-2", "ed-event-card-3", "ed-event-card-4"];

  return (
    <section id="events" className="ed-section">
      <div className="ed-wrap">
        <div className="ed-section-head">
          <span className="ed-section-num">§ 01 / Events</span>
          <h2 className="ed-section-title">
            The <em>calendar</em> is the club.
          </h2>
        </div>
        <div className="ed-events-grid ed-reveal" ref={ref}>
          {events.length === 0 && (
            <div style={{ gridColumn: "span 12", textAlign: "center", padding: 80 }}>
              <p style={{ fontFamily: "var(--ed-f-mono)", fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--ed-ink-3)" }}>
                No events yet — check back soon.
              </p>
            </div>
          )}
          {events.slice(0, 5).map((event, i) => (
            <Link
              key={event._id}
              className={`ed-event-card ${cardClasses[i] ?? "ed-event-card-4"}`}
              href={`/events/${event.slug?.current ?? event._id}`}
            >
              <div className="ed-event-img">
                {event.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={event.imageUrl} alt={event.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div className="ed-event-img-placeholder">Event photo</div>
                )}
                <div style={{ position: "absolute", top: 16, left: 16, display: "flex", gap: 8 }}>
                  <span className="ed-event-tag">EVENT</span>
                </div>
              </div>
              <div className="ed-event-body">
                <div className="ed-event-date">
                  {formatEventDate(event.date, { dateTba: event.dateTba ?? false })}
                </div>
                <h3 className="ed-event-title">{event.title}</h3>
                {event.description && (
                  <p className="ed-event-desc">
                    {typeof event.description === "string"
                      ? event.description.slice(0, 120)
                      : ""}
                  </p>
                )}
                <div className="ed-event-meta">
                  <span>EST Safi</span>
                  <span className="ed-event-meta-arrow">
                    Open event <span>→</span>
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function KnowUsSection({ config }: { config: KnowUsConfig | null }) {
  const ref = useEdReveal();
  const cards = config?.cards?.length
    ? config.cards.map((c, i) => ({
        title: c.title,
        desc: c.description,
        glyph: defaultKnowUs[i % defaultKnowUs.length]!.glyph,
      }))
    : defaultKnowUs;

  return (
    <section id="know-us" className="ed-section">
      <div className="ed-wrap">
        <div className="ed-section-head">
          <span className="ed-section-num">§ 02 / Know us</span>
          <h2 className="ed-section-title">
            A community of <em>builders</em>, drawn in three views.
          </h2>
        </div>
        <div className="ed-knowus-grid ed-reveal-children" ref={ref}>
          {cards.map((c, i) => (
            <div className="ed-knowus-cell" key={i}>
              <span className="ed-knowus-num">§ 02.0{i + 1}</span>
              <h3 className="ed-knowus-title">
                <em>{c.title}</em>
              </h3>
              <p className="ed-knowus-body">{c.desc}</p>
              <span className="ed-knowus-glyph">{c.glyph}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PartnersSection({ config }: { config: PartnersConfig | null }) {
  const logos = config?.logos ?? [];
  const doubled = [...logos, ...logos];

  return (
    <section className="ed-partners">
      <div className="ed-partners-header">
        <span>// Partners &amp; collaborators</span>
        <span>{logos.length} organizations · 2025/26</span>
      </div>
      <div className="ed-partners-track">
        {doubled.map((logo, i) => (
          <span className="ed-partner-logo" key={i}>
            {typeof logo === "string" ? logo : logo.alt ?? "Partner"}
            <span style={{ color: "var(--ed-terracotta)" }}>.</span>
          </span>
        ))}
      </div>
    </section>
  );
}

function WhyJoinSection({ config }: { config: WhyJoinConfig | null }) {
  const ref = useEdReveal();
  const cards = config?.cards?.length
    ? config.cards.map((c, i) => ({
        num: String(i + 1).padStart(2, "0"),
        t: c.title,
        d: c.description,
      }))
    : defaultWhyCards;

  const title = config?.title ?? "Why Join the Robotics & AI Club";

  return (
    <section id="why" className="ed-section">
      <div className="ed-wrap">
        <div className="ed-section-head">
          <span className="ed-section-num">§ 03 / Why join</span>
          <h2 className="ed-section-title">
            Shaping the future, <em>one shipped thing</em> at a time.
          </h2>
        </div>
        <div className="ed-why-grid ed-reveal" ref={ref}>
          <div>
            <p className="ed-why-lead">
              Join a community of students <em>building real robotics and AI</em> — not reading
              slides about it.
            </p>
            <p className="ed-why-body">
              {config?.description ??
                "Through hands-on projects, mentorship, and the kind of collaboration that only happens at 11pm in a workshop, you'll gain practical skills and turn ideas into things that actually move, decide, or compute."}
            </p>
          </div>
          <div className="ed-benefit-grid">
            {cards.map((b) => (
              <article className="ed-benefit-card" key={b.num} data-num={b.num}>
                <h3 className="ed-benefit-title">{b.t}</h3>
                <p className="ed-benefit-desc">{b.d}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CellulesSection({ config }: { config: CellulesConfig | null }) {
  const ref = useEdReveal();
  const cells = config?.cards?.length
    ? config.cards.map((c, i) => ({
        n: String(i + 1).padStart(2, "0"),
        t: c.title,
        d: c.description,
      }))
    : defaultCellules;

  return (
    <section id="cellules" className="ed-section">
      <div className="ed-wrap">
        <div className="ed-section-head">
          <span className="ed-section-num">§ 04 / Cellules</span>
          <h2 className="ed-section-title">
            Six teams. <em>One mission.</em>
          </h2>
        </div>
        <div className="ed-reveal" ref={ref}>
          {cells.map((c) => (
            <div className="ed-cellule-row" key={c.n}>
              <span className="ed-cellule-num">§ {c.n}</span>
              <h3 className="ed-cellule-title">{c.t}</h3>
              <p className="ed-cellule-desc">{c.d}</p>
              <span className="ed-cellule-arrow">→</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProcessSection({ config }: { config: ProcessStepsConfig | null }) {
  const ref = useEdReveal();
  const steps = config?.steps?.length
    ? config.steps.map((s, i) => ({
        n: String(i + 1).padStart(2, "0"),
        t: s.title,
        d: s.description,
        meta: s.badge ?? "",
      }))
    : defaultProcess;

  return (
    <section id="process" className="ed-section">
      <div className="ed-wrap">
        <div className="ed-section-head">
          <span className="ed-section-num">§ 05 / Process</span>
          <h2 className="ed-section-title">
            From <em>day one</em> to the podium — in four steps.
          </h2>
        </div>
        <div className="ed-process ed-reveal-children" ref={ref}>
          {steps.map((s) => (
            <div className="ed-process-step" key={s.n}>
              <span className="ed-p-step-num">Step {s.n}</span>
              <h3 className="ed-p-step-title">
                {s.t}
              </h3>
              <p className="ed-p-step-desc">{s.d}</p>
              {s.meta && <span className="ed-p-step-meta">{s.meta}</span>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TeamSection({ members }: { members: TeamMemberListItem[] }) {
  const ref = useEdReveal();

  return (
    <section id="team" className="ed-section">
      <div className="ed-wrap">
        <div className="ed-section-head">
          <span className="ed-section-num">§ 06 / Team</span>
          <h2 className="ed-section-title">
            Leadership for <em>this academic year</em>.
          </h2>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 24, marginBottom: 48 }}>
          <p style={{ maxWidth: "46ch", color: "var(--ed-ink-2)", fontSize: 15, margin: 0 }}>
            The humans keeping the lights on, the bots powered, and the calendar full.
          </p>
          <Link href="/team" className="ed-btn ed-btn-ghost">
            <span>Full directory</span>
            <span className="ed-btn-arrow">→</span>
          </Link>
        </div>
        <div className="ed-team-grid ed-reveal-children" ref={ref}>
          {members.map((m) => (
            <Link
              className="ed-team-card"
              key={m._id}
              href={`/team/${m.slug?.current ?? m._id}`}
            >
              <div className="ed-team-portrait">
                {m.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.imageUrl} alt={m.name} />
                ) : (
                  <span className="ed-team-portrait-init">
                    {m.name?.charAt(0) ?? "?"}
                  </span>
                )}
              </div>
              <div>
                <h3 className="ed-team-name">{m.name}</h3>
                <p className="ed-team-role">{m.roles?.map(r => r.title).join(", ") ?? ""}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQSection({ config }: { config: FaqConfig | null }) {
  const ref = useEdReveal();
  const [open, setOpen] = useState(0);

  const items = config?.items?.length
    ? config.items.map((item) => ({ q: item.question, a: item.answer }))
    : [
        { q: "Is joining free?", a: "Yes. Completely. No fees, no hidden costs." },
        { q: "Do I need prior experience?", a: "No. We have learning tracks for absolute beginners." },
        { q: "How often does the club meet?", a: "Weekly working sessions, plus event nights and workshops." },
      ];

  return (
    <section id="faq" className="ed-section">
      <div className="ed-wrap">
        <div className="ed-section-head">
          <span className="ed-section-num">§ 07 / FAQ</span>
          <h2 className="ed-section-title">
            The <em>questions</em> that come up most.
          </h2>
        </div>
        <div className="ed-faq ed-reveal" ref={ref}>
          <aside className="ed-faq-aside">
            <p>
              Direct answers, no spin. If something else is on your mind,{" "}
              <em>just write us.</em>
            </p>
            <a className="ed-btn ed-btn-ghost" href="mailto:roboticsai.club.ests@gmail.com">
              <span>Write the club</span>
              <span className="ed-btn-arrow">→</span>
            </a>
          </aside>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {items.map((it, i) => (
              <div className={`ed-faq-item ${open === i ? "open" : ""}`} key={i}>
                <button
                  className="ed-faq-q"
                  onClick={() => setOpen(open === i ? -1 : i)}
                  type="button"
                >
                  <span>{it.q}</span>
                  <span className="ed-faq-toggle" aria-hidden="true" />
                </button>
                <div className="ed-faq-a-grid">
                  <div className="ed-faq-a">
                    <p style={{ margin: 0 }}>{it.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ApplySection({ config }: { config: ApplySectionConfig | null }) {
  const ref = useEdReveal();
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    first: "", last: "", year: "", dept: "", email: "", phone: "", msg: "",
  });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <section id="apply" className="ed-apply ed-section">
      <div className="ed-wrap" style={{ position: "relative", zIndex: 2 }}>
        <div className="ed-section-head">
          <span className="ed-section-num">§ 08 / Apply</span>
          <h2 className="ed-section-title">
            Pull up a chair. <em>Bring an idea.</em>
          </h2>
        </div>
        <div className="ed-apply-grid ed-reveal" ref={ref}>
          {submitted ? (
            <div style={{ padding: 40, background: "var(--ed-terracotta)", color: "var(--ed-cream)", textAlign: "center", display: "flex", flexDirection: "column", gap: 16, alignItems: "center" }}>
              <span style={{ fontFamily: "var(--ed-f-mono)", fontSize: 11, letterSpacing: "0.2em", opacity: 0.8 }}>
                // SUBMISSION RECEIVED
              </span>
              <h3 style={{ fontFamily: "var(--ed-f-serif)", fontSize: "clamp(28px, 3vw, 44px)", margin: 0, lineHeight: 1 }}>
                You&apos;re <em style={{ fontStyle: "italic" }}>in.</em>
              </h3>
              <p style={{ margin: 0, maxWidth: "36ch", lineHeight: 1.5 }}>
                Welcome to the Robotics &amp; AI Club family. We&apos;ll be in touch within 72 hours.
              </p>
              <button
                className="ed-btn ed-btn-ghost"
                style={{ boxShadow: "inset 0 0 0 1px var(--ed-cream)", color: "var(--ed-cream)", marginTop: 8 }}
                onClick={() => setSubmitted(false)}
                type="button"
              >
                <span>Submit another</span>
                <span className="ed-btn-arrow">↺</span>
              </button>
            </div>
          ) : (
            <form style={{ display: "flex", flexDirection: "column", gap: 18 }} onSubmit={onSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label className="ed-field-label">
                    First name <span className="ed-req">*</span>
                  </label>
                  <input required value={form.first} onChange={set("first")} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label className="ed-field-label">
                    Last name <span className="ed-req">*</span>
                  </label>
                  <input required value={form.last} onChange={set("last")} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label className="ed-field-label">
                    Year <span className="ed-req">*</span>
                  </label>
                  <select required value={form.year} onChange={set("year")}>
                    <option value="">Select —</option>
                    <option>1st year</option>
                    <option>2nd year</option>
                    <option>3rd year</option>
                    <option>Graduate</option>
                  </select>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label className="ed-field-label">
                    Department <span className="ed-req">*</span>
                  </label>
                  <select required value={form.dept} onChange={set("dept")}>
                    <option value="">Select —</option>
                    <option>Computer Science</option>
                    <option>Electrical Eng.</option>
                    <option>Mechanical Eng.</option>
                    <option>Industrial Eng.</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label className="ed-field-label">
                    Email <span className="ed-req">*</span>
                  </label>
                  <input required type="email" value={form.email} onChange={set("email")} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label className="ed-field-label">Phone</label>
                  <input value={form.phone} onChange={set("phone")} />
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label className="ed-field-label">
                  Why do you want to join? <span style={{ opacity: 0.5 }}>(optional)</span>
                </label>
                <textarea value={form.msg} onChange={set("msg")} rows={3} placeholder="A project you want to build, a skill you want to learn, anything." />
              </div>
              <button type="submit" className="ed-btn ed-btn-primary" style={{ alignSelf: "flex-start", marginTop: 12, background: "var(--ed-terracotta)" }}>
                <span>Send application</span>
                <span className="ed-btn-arrow">→</span>
              </button>
            </form>
          )}

          <aside style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            <div className="ed-apply-info-block">
              <div className="ed-apply-info-label">Address</div>
              <div className="ed-apply-info-value">
                EST Safi · Route Dar Si Aissa<br />
                B.P. 89, <em>46000</em> — Safi, Morocco
              </div>
            </div>
            <div className="ed-apply-info-block">
              <div className="ed-apply-info-label">Email</div>
              <div className="ed-apply-info-value">
                roboticsai.club.ests<em>@gmail.com</em>
              </div>
            </div>
            <div className="ed-apply-info-block">
              <div className="ed-apply-info-label">Office hours</div>
              <div className="ed-apply-info-value">
                Wed &amp; Fri · 18:00 — 22:00<br />
                Lab 03, <em>ground floor</em>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

