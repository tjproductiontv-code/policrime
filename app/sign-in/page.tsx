// app/sign-in/page.tsx
"use client";

import { useState, FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const sp = useSearchParams();
  const callbackUrl = sp.get("callbackUrl") || "/"; // ← 1) fallback

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false, // we redirecten zelf
      callbackUrl,     // ← 1) doorgeven
    });

    setLoading(false);

    if (res?.ok) {
      router.push(res.url ?? callbackUrl); // ← terug naar vorige pagina of home
    } else {
      setError(res?.error || "Onjuiste inloggegevens");
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 border p-6 rounded-xl bg-white shadow"
      >
        <h1 className="text-xl font-semibold">Inloggen</h1>

        <div className="space-y-1">
          <label className="block text-sm">Email</label>
          <input
            className="w-full border rounded-md p-2"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm">Wachtwoord</label>
          <input
            className="w-full border rounded-md p-2"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md p-2 border bg-gray-100 hover:bg-gray-200 disabled:opacity-60"
        >
          {loading ? "Bezig..." : "Log in"}
        </button>

        {/* 2) Link naar registreren */}
        <p className="text-sm text-center mt-2">
          Nog geen account?{" "}
          <Link href="/sign-up" className="text-emerald-700 underline">
            Registreer hier
          </Link>
        </p>
      </form>
    </div>
  );
}
