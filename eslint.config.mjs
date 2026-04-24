import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["lib/hooks/use-client-mounted.ts"],
    rules: {
      // Canonical “mounted” gate for SSR/hydration; deferred setState is intentional.
      "react-hooks/set-state-in-effect": "off",
    },
  },
  {
    files: [
      "components/events/events-carousel.tsx",
      "components/events/event-documentary-page-client.tsx",
      "components/team/member-profile.tsx",
      "components/team/team-member-card.tsx",
    ],
    rules: {
      // Covers arbitrary HTTPS URLs from Firestore / CMS (not limited to configured hosts).
      "@next/next/no-img-element": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
