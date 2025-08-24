// app/sign-in/page.tsx
export const dynamic = "force-dynamic";

export default function SignInPage() {
  return (
    <main className="p-6 max-w-sm mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Inloggen</h1>

      <form action="/api/auth/login" method="POST" className="space-y-3">
        <div>
          <label className="block text-sm mb-1">E-mail</label>
          <input
            type="email"
            name="email"
            required
            className="w-full border rounded px-3 py-2"
            placeholder="jij@voorbeeld.nl"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Wachtwoord</label>
          <input
            type="password"
            name="password"
            required
            className="w-full border rounded px-3 py-2"
            placeholder="••••••••"
          />
        </div>

        <button className="w-full border rounded px-3 py-2 font-medium">
          Inloggen
        </button>
      </form>

      <p className="text-sm">
        Nog geen account? <a className="underline" href="/sign-up">Registreren</a>
      </p>
    </main>
  );
}
