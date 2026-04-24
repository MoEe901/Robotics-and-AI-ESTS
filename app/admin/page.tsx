"use client";

import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { auth } from "@/lib/firebase";

export default function AdminIndexPage() {
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth(), (user) => {
      router.replace(user ? "/admin/dashboard" : "/admin/login");
    });
    return () => unsub();
  }, [router]);

  return (
    <p className="px-6 py-16 text-sm text-white/60">Opening admin…</p>
  );
}
