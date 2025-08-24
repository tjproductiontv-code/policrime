"use client";

import { useState, FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function SignUpPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const callbackUrl = sp.get("callbackUrl") || "/";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    // 1) Registreer
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setErr(
        d?.error === "EMAIL_TAKEN" ? "E-mail is al in gebruik."
        : d?.error === "MISSING_FIELDS" ? "Vul alle velden in."
        : "Registratie mislukt."
      );
      setLoading(false);
      return;
    }

    // 2) Automatisch inloggen
    const login = await signIn("credentials", {
      redirect: false,
      email,
      password,
      callbackUrl,
    });

    setLoading(false);
    if (login?.ok) router.push(login.url ?? callbackUrl);
    else router.push("/sign-in");
  };

  return (
    <main className="min-h-[60vh] flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 border p-6 rounded-xl bg-white shadow">
        <h1 className="text-2xl font-bold">Registreren</h1>

        <div className="space-y-1">
          <label className="block text-sm">Naam</label>
          <input
            className="w-full border rounded-md p-2"
            placeholder="Jouw naam"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm">E-mail</label>
          <input
            className="w-full border rounded-md p-2"
            type="email"
            placeholder="jij@voorbeeld.nl"
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
            placeholder="Min. 6 tekens"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
            autoComplete="new-password"
          />
        </div>

        {err && <p className="text-sm text-red-600">{err}</p>}

        <button
          className="w-full rounded-md p-2 bg-emerald-600 text-white hover:opacity-90 disabled:opacity-60"
          disabled={loading}
        >
          {loading ? "Bezig..." : "Account aanmaken"}
        </button>

        <p className="text-sm text-center">
          Al een account?{" "}
          <Link href="/sign-in" className="text-emerald-700 underline">
            Inloggen
          </Link>
        </p>
      </form>
    </main>
  );
}
