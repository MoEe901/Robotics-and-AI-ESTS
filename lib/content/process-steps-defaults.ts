import type { ProcessStepsConfig } from "@/lib/firebase/types";

export const DEFAULT_PROCESS_STEPS_CONFIG: ProcessStepsConfig = {
  eyebrow: "Your Path Forward",
  titleLine: "Step-by-Step ",
  titleAccent: "Process",
  steps: [
    {
      badge: "Integration",
      title: "Start Your Journey in the Robotics Family",
      description:
        "Join our Robotics & AI Club and begin your integration into university life — connecting with motivated members, discovering ongoing projects, and finding your place in the team.",
      iconKey: "users",
    },
    {
      badge: "Development",
      title: "Build Your Technical and Soft Skills",
      description:
        "Take part in trainings and workshops to sharpen your technical expertise in robotics and AI, while developing the teamwork and communication skills that prepare you for real challenges.",
      iconKey: "lightbulb",
    },
    {
      badge: "Engagement",
      title: "Participate in Events and Formations",
      description:
        "Step up in our events, workshops, and club activities. Share your knowledge, collaborate with peers across cellules, and actively contribute to the club's growth and momentum.",
      iconKey: "calendar",
    },
    {
      badge: "Competition",
      title: "Compete and Innovate with Excellence",
      description:
        "Join our competition teams, represent the club with pride, and push your limits to achieve innovation and excellence in robotics and AI challenges — locally and nationally.",
      iconKey: "award",
    },
  ],
};
