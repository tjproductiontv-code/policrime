// app/sign-up/page.tsx
export const dynamic = "force-dynamic";

export default function SignUpPage() {
  return (
    <main className="p-6 max-w-sm mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Registreren</h1>

      <form action="/api/auth/register" method="POST" className="space-y-3">
        <div>
          <label className="block text-sm mb-1">Naam (optioneel)</label>
          <input
            type="text"
            name="name"
            className="w-full border rounded px-3 py-2"
            placeholder="Jouw naam"
          />
        </div>
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
            placeholder="Minimaal 8 tekens"
          />
        </div>

        <button className="w-full border rounded px-3 py-2 font-medium">
          Registreren
        </button>
      </form>

      <p className="text-sm">
        Al een account? <a className="underline" href="/sign-in">Inloggen</a>
      </p>
    </main>
  );
}
