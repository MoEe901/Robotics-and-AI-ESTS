/** One-shot: ensure faq/config/questions docs all have explicit isVisible=true when missing. */
import { getAdminFirestore } from "../lib/server/firebase-admin";

async function main() {
  const db = getAdminFirestore();
  const col = db.collection("faq").doc("config").collection("questions");
  const snap = await col.get();
  let updated = 0;
  let batch = db.batch();
  let ops = 0;
  for (const d of snap.docs) {
    const data = d.data();
    if (data.isVisible === true || data.isVisible === false) continue;
    batch.update(d.ref, { isVisible: true });
    updated += 1;
    ops += 1;
    if (ops >= 400) {
      await batch.commit();
      batch = db.batch();
      ops = 0;
    }
  }
  if (ops) await batch.commit();
  console.log(`faq visibility backfill complete. updated=${updated}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
