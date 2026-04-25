"use client";

import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { resolveAdminSession } from "@/lib/admin-access-client";
import { parseAdminEmails } from "@/lib/admin-allowlist";
import { auth } from "@/lib/firebase";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const allowPasswordConfigured = parseAdminEmails().size > 0;

  async function afterFirebaseSignIn() {
    const u = auth().currentUser;
    const session = await resolveAdminSession(u);
    if (!session.ok) {
      await signOut(auth());
      if (session.reason === "not_provisioned") {
        setError(
          "This account is not in NEXT_PUBLIC_ADMIN_EMAILS or is not provisioned for admin access.",
        );
      } else {
        setError("Sign-in required.");
      }
      return false;
    }
    router.replace("/admin/dashboard");
    router.refresh();
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await signInWithEmailAndPassword(auth(), email.trim(), password);
      await afterFirebaseSignIn();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Sign-in failed.";
      setError(msg);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight text-white">Admin sign-in</h1>
      <p className="mt-3 text-sm text-white/55">
        Email/password sign-in requires{" "}
        <span className="font-mono text-white/75">NEXT_PUBLIC_ADMIN_EMAILS</span> to be configured and the account
        to exist in Firebase Authentication.
      </p>

      {!allowPasswordConfigured ? (
        <p className="rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-sm text-amber-100/90">
          Email/password sign-in is disabled until you set{" "}
          <span className="font-mono">NEXT_PUBLIC_ADMIN_EMAILS</span> in <span className="font-mono">.env.local</span>.
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/45">
            Email
          </label>
          <input
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white outline-none ring-blue-500/40 focus:border-blue-500/50 focus:ring-2"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/45">
            Password
          </label>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white outline-none ring-blue-500/40 focus:border-blue-500/50 focus:ring-2"
          />
        </div>
        {error ? (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-100/90">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={pending || !allowPasswordConfigured}
          className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-10 text-center text-xs text-white/45">
        <Link href="/" className="text-blue-300 hover:text-blue-200">
          ← Back to site
        </Link>
      </p>
    </div>
  );
}
