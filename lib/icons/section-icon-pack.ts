/**
 * Shared 50-icon pack used by Process Steps, Cellules, and any future
 * admin-driven section that needs a consistent icon picker. Both the
 * dropdown options (`SECTION_ICON_OPTIONS`) and the rendering map
 * (`sectionIcons`) are derived from the same source of truth so they
 * cannot drift apart.
 *
 * Aliasing notes:
 *  - lucide-react renamed CheckCircle → CircleCheck and PlayCircle →
 *    CirclePlay in v1.x. We import the new names but expose the legacy
 *    keys in our key set so saved Firestore docs keep working.
 *  - "file" is preserved as a backwards-compat alias for legacy cellule
 *    docs that wrote `iconKey: "file"` before the canonical `file-text`
 *    key existed. It does NOT appear in the dropdown — only in the
 *    rendering map.
 */
import {
  Atom,
  Award,
  Badge,
  Blocks,
  Bot,
  Brain,
  Brush,
  Calendar,
  Camera,
  CircleCheck as CheckCircle,
  CirclePlay as PlayCircle,
  CircuitBoard,
  Clipboard,
  Code,
  Cpu,
  Database,
  Dna,
  FileText,
  Flag,
  FlaskConical,
  Folder,
  GitBranch,
  GraduationCap,
  Image as ImageIcon,
  Layers,
  Lightbulb,
  type LucideIcon,
  Mail,
  Megaphone,
  Mic,
  Microscope,
  Palette,
  PenTool,
  Rocket,
  Send,
  Server,
  Settings,
  Sparkles,
  Star,
  Target,
  Terminal,
  Trophy,
  User,
  UserCheck,
  UserPlus,
  Users,
  Video,
  Wallet,
  Wifi,
  Wrench,
  Zap,
} from "lucide-react";

export type SectionIconOption = {
  key: string;
  label: string;
  group: "People" | "Actions" | "Tech" | "Creativity" | "Organisation" | "Science";
  icon: LucideIcon;
};

export const SECTION_ICON_OPTIONS: readonly SectionIconOption[] = [
  // People
  { key: "users",          label: "Users",          group: "People",      icon: Users          },
  { key: "user",           label: "User",           group: "People",      icon: User           },
  { key: "user-plus",      label: "User Plus",      group: "People",      icon: UserPlus       },
  { key: "user-check",     label: "User Check",     group: "People",      icon: UserCheck      },
  { key: "graduation-cap", label: "Graduation Cap", group: "People",      icon: GraduationCap  },
  { key: "badge",          label: "Badge",          group: "People",      icon: Badge          },
  // Actions / Progress
  { key: "rocket",         label: "Rocket",         group: "Actions",     icon: Rocket         },
  { key: "target",         label: "Target",         group: "Actions",     icon: Target         },
  { key: "award",          label: "Award",          group: "Actions",     icon: Award          },
  { key: "trophy",         label: "Trophy",         group: "Actions",     icon: Trophy         },
  { key: "star",           label: "Star",           group: "Actions",     icon: Star           },
  { key: "zap",            label: "Zap",            group: "Actions",     icon: Zap            },
  { key: "flag",           label: "Flag",           group: "Actions",     icon: Flag           },
  { key: "send",           label: "Send",           group: "Actions",     icon: Send           },
  { key: "check-circle",   label: "Check Circle",   group: "Actions",     icon: CheckCircle    },
  { key: "play-circle",    label: "Play Circle",    group: "Actions",     icon: PlayCircle     },
  // Tech / Build
  { key: "lightbulb",      label: "Lightbulb",      group: "Tech",        icon: Lightbulb      },
  { key: "sparkles",       label: "Sparkles",       group: "Tech",        icon: Sparkles       },
  { key: "cpu",            label: "CPU",            group: "Tech",        icon: Cpu            },
  { key: "circuit-board",  label: "Circuit Board",  group: "Tech",        icon: CircuitBoard   },
  { key: "bot",            label: "Bot",            group: "Tech",        icon: Bot            },
  { key: "code",           label: "Code",           group: "Tech",        icon: Code           },
  { key: "terminal",       label: "Terminal",       group: "Tech",        icon: Terminal       },
  { key: "git-branch",     label: "Git Branch",     group: "Tech",        icon: GitBranch      },
  { key: "database",       label: "Database",       group: "Tech",        icon: Database       },
  { key: "server",         label: "Server",         group: "Tech",        icon: Server         },
  { key: "wifi",           label: "Wifi",           group: "Tech",        icon: Wifi           },
  { key: "layers",         label: "Layers",         group: "Tech",        icon: Layers         },
  { key: "blocks",         label: "Blocks",         group: "Tech",        icon: Blocks         },
  // Creativity / Design
  { key: "palette",        label: "Palette",        group: "Creativity",  icon: Palette        },
  { key: "pen-tool",       label: "Pen Tool",       group: "Creativity",  icon: PenTool        },
  { key: "brush",          label: "Brush",          group: "Creativity",  icon: Brush          },
  { key: "image",          label: "Image",          group: "Creativity",  icon: ImageIcon      },
  { key: "video",          label: "Video",          group: "Creativity",  icon: Video          },
  { key: "camera",         label: "Camera",         group: "Creativity",  icon: Camera         },
  { key: "mic",            label: "Mic",            group: "Creativity",  icon: Mic            },
  // Organisation / Admin
  { key: "calendar",       label: "Calendar",       group: "Organisation", icon: Calendar      },
  { key: "file-text",      label: "File Text",      group: "Organisation", icon: FileText      },
  { key: "clipboard",      label: "Clipboard",      group: "Organisation", icon: Clipboard     },
  { key: "folder",         label: "Folder",         group: "Organisation", icon: Folder        },
  { key: "wallet",         label: "Wallet",         group: "Organisation", icon: Wallet        },
  { key: "megaphone",      label: "Megaphone",      group: "Organisation", icon: Megaphone     },
  { key: "mail",           label: "Mail",           group: "Organisation", icon: Mail          },
  // Science / Innovation
  { key: "flask-conical",  label: "Flask",          group: "Science",     icon: FlaskConical   },
  { key: "microscope",     label: "Microscope",     group: "Science",     icon: Microscope     },
  { key: "atom",           label: "Atom",           group: "Science",     icon: Atom           },
  { key: "brain",          label: "Brain",          group: "Science",     icon: Brain          },
  { key: "dna",            label: "DNA",            group: "Science",     icon: Dna            },
  { key: "wrench",         label: "Wrench",         group: "Science",     icon: Wrench         },
  { key: "settings",       label: "Settings",       group: "Science",     icon: Settings       },
] as const;

export const SECTION_ICON_KEYS: ReadonlySet<string> = new Set(
  SECTION_ICON_OPTIONS.map((o) => o.key),
);

const baseMap = Object.fromEntries(
  SECTION_ICON_OPTIONS.map((o) => [o.key, o.icon] as const),
) as Record<string, LucideIcon>;

/**
 * Render-time map. Includes legacy aliases so older Firestore docs that
 * stored deprecated keys keep rendering an icon instead of falling back
 * to the default.
 */
export const sectionIcons: Readonly<Record<string, LucideIcon>> = {
  ...baseMap,
  // Legacy alias: pre-icon-pack cellule docs used "file"; map to FileText.
  file: FileText,
};

/** Resolve an icon by key. Returns the default if unknown or empty. */
export function resolveSectionIcon(
  key: string | undefined | null,
  fallback: LucideIcon = Users,
): LucideIcon {
  if (!key) return fallback;
  return sectionIcons[key.trim().toLowerCase()] ?? fallback;
}
