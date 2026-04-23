import { NextResponse } from "next/server";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { z } from "zod";

import { db, isFirebaseConfigured } from "@/lib/firebase";

const applySchema = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  educationYear: z.string().trim().min(1),
  department: z.string().trim().min(1),
  email: z.string().trim().email(),
  phone: z.string().trim().min(4),
  message: z.string().trim().max(4000).optional(),
});

export async function POST(request: Request) {
  if (!isFirebaseConfigured()) {
    return NextResponse.json(
      { error: "Firebase is not configured. Set NEXT_PUBLIC_FIREBASE_* variables." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = applySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid application payload.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const message =
    parsed.data.message && parsed.data.message.length > 0 ? parsed.data.message : undefined;

  try {
    const ref = await addDoc(collection(db(), "applySubmissions"), {
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      educationYear: parsed.data.educationYear,
      department: parsed.data.department,
      email: parsed.data.email,
      phone: parsed.data.phone,
      ...(message ? { message } : {}),
      createdAt: serverTimestamp(),
    });
    return NextResponse.json({ success: true, id: ref.id }, { status: 201 });
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : "Application write failed";
    return NextResponse.json({ error: errMsg }, { status: 400 });
  }
}
