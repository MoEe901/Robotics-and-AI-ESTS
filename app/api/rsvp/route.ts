import { NextResponse } from "next/server";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { z } from "zod";

import { db, isFirebaseConfigured } from "@/lib/firebase";

const rsvpSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  eventId: z.string().min(1),
});

export async function POST(request: Request) {
  if (!isFirebaseConfigured()) {
    return NextResponse.json(
      { error: "Firebase is not configured. Set NEXT_PUBLIC_FIREBASE_* variables." },
      { status: 503 },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = rsvpSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid RSVP payload.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const ref = await addDoc(collection(db(), "rsvps"), {
      fullName: parsed.data.fullName,
      email: parsed.data.email,
      eventId: parsed.data.eventId,
      createdAt: serverTimestamp(),
    });
    return NextResponse.json({ success: true, id: ref.id }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "RSVP write failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
