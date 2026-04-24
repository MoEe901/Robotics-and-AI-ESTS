/**
 * One-time backfill: set explicit `isVisible: true` where missing so public queries
 * using `where("isVisible", "==", true)` match deployed security rules.
 *
 * Run from `web/`: `npx tsx scripts/backfill-visibility-flags.ts`
 * Requires the same Admin credentials as `seed:firestore`.
 */

import { getAdminFirestore } from "../lib/server/firebase-admin";

async function main() {
  const db = getAdminFirestore();
  let teamUpdated = 0;
  let faqUpdated = 0;

  const teamSnap = await db.collection("teamMembers").get();
  let teamBatch = db.batch();
  let teamOps = 0;
  const flushTeam = async () => {
    if (!teamOps) return;
    await teamBatch.commit();
    teamBatch = db.batch();
    teamOps = 0;
  };
  for (const d of teamSnap.docs) {
    const data = d.data();
    if (data.isVisible !== true && data.isVisible !== false) {
      teamBatch.update(d.ref, { isVisible: true });
      teamUpdated += 1;
      teamOps += 1;
      if (teamOps >= 400) await flushTeam();
    }
  }
  await flushTeam();

  const qSnap = await db.collection("faq").doc("config").collection("questions").get();
  let faqBatch = db.batch();
  let faqOps = 0;
  const flushFaq = async () => {
    if (!faqOps) return;
    await faqBatch.commit();
    faqBatch = db.batch();
    faqOps = 0;
  };
  for (const d of qSnap.docs) {
    const data = d.data();
    if (data.isVisible !== true && data.isVisible !== false) {
      faqBatch.update(d.ref, { isVisible: true });
      faqUpdated += 1;
      faqOps += 1;
      if (faqOps >= 400) await flushFaq();
    }
  }
  await flushFaq();

  console.log(`Backfill complete. teamMembers updated: ${teamUpdated}, faq questions updated: ${faqUpdated}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
