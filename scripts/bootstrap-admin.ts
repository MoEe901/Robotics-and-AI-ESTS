import { createRequire } from "module";
const require = createRequire(import.meta.url);
const serviceAccount = require("../serviceAccountKey.json");

import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

initializeApp({
  credential: cert(serviceAccount),
});

async function grantAdminClaim(email: string) {
  try {
    const user = await getAuth().getUserByEmail(email);
    await getAuth().setCustomUserClaims(user.uid, { adminRole: "admin" });
    console.log(`Granted adminRole claim to ${email} (uid: ${user.uid})`);
  } catch (err: unknown) {
    console.error(`Failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

async function main() {
  await grantAdminClaim("m.talbani0481@uca.ac.ma");
  process.exit(0);
}

main().catch((err) => { console.error(err); process.exit(1); });
