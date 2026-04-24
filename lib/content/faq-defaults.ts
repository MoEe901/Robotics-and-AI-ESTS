import type { FaqConfig } from "@/lib/firebase/types";

export const DEFAULT_FAQ_CONFIG: FaqConfig = {
  eyebrow: "Got Questions?",
  titleLine: "Common ",
  titleAccent: "Questions",
  subtitle:
    "Everything you need to know before joining. Can't find the answer? Reach out directly.",
  categories: [
    { id: "membership", label: "Membership" },
    { id: "activities", label: "Activities" },
    { id: "requirements", label: "Requirements" },
  ],
  items: [
    {
      categoryId: "membership",
      question: "Is joining the club free?",
      answer:
        "Yes — joining the Robotics & AI Club is completely free. There are no subscription fees or hidden costs. Some special workshops or competition kits may have optional material costs, but membership itself is open to all students at no charge.",
      color: "blue",
      iconKey: "circle-dollar-sign",
    },
    {
      categoryId: "activities",
      question: "What activities does the club run?",
      answer:
        "We run a wide range of activities including hands-on project sessions, technical workshops, AI and robotics training, inter-club events, national competitions, and social gatherings. Each of our 6 cellules also organizes its own initiatives throughout the year.",
      color: "violet",
      iconKey: "calendar",
    },
    {
      categoryId: "membership",
      question: "Is the club only for robotics and AI students?",
      answer:
        "Not at all. Students from any field — engineering, design, business, communication — are welcome. Our cellules cover a broad range of roles, so whatever your background, there's a place where your skills add real value to the team.",
      color: "pink",
      iconKey: "lightbulb",
    },
    {
      categoryId: "membership",
      question: "What will I gain from joining?",
      answer:
        "You'll build real technical and soft skills, expand your professional network, gain hands-on project experience, compete in national robotics and AI challenges, and grow as a leader — all while being part of a driven, ambitious community.",
      color: "amber",
      iconKey: "trending-up",
    },
    {
      categoryId: "requirements",
      question: "Who can join the club?",
      answer:
        "Any enrolled university student can join, regardless of year or major. All you need is curiosity, motivation, and a willingness to contribute. We welcome complete beginners as warmly as we welcome experienced builders.",
      color: "green",
      iconKey: "users",
    },
    {
      categoryId: "requirements",
      question: "Do I need prior experience in robotics or AI?",
      answer:
        "Zero experience required. We have dedicated onboarding, beginner-friendly workshops, and mentorship from more experienced members. Many of our best contributors started with no technical background at all — the drive to learn matters more than your starting point.",
      color: "blue",
      iconKey: "code",
    },
    {
      categoryId: "activities",
      question: "Are there competitions or projects?",
      answer:
        "Absolutely. We compete in local, regional, and national robotics and AI challenges throughout the year. Beyond competitions, members work on real club projects — from autonomous systems to AI-driven applications — that go beyond theory and into the real world.",
      color: "violet",
      iconKey: "award",
    },
    {
      categoryId: "activities",
      question: "How often does the club meet?",
      answer:
        "General meetings happen weekly, and each cellule sets its own rhythm based on projects and upcoming events. During competition season, some teams meet more frequently. The schedule is flexible — we understand you have other commitments and we work around them.",
      color: "pink",
      iconKey: "clock",
    },
  ],
  ctaTitle: "Still have questions?",
  ctaSubtitle: "Our team is happy to help — reach out any time.",
  ctaButtonLabel: "Contact us",
  ctaButtonHref: "/#apply",
};
