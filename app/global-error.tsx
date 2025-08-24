"use client";

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  return (
    <html>
      <body style={{ padding: 16, fontFamily: "system-ui" }}>
        <h1>Er ging iets mis</h1>
        <pre style={{ whiteSpace: "pre-wrap" }}>{String(error?.message || error)}</pre>
        {error?.digest && <p>Digest: {error.digest}</p>}
        <a href="/" style={{ display: "inline-block", marginTop: 12 }}>Terug naar home</a>
      </body>
    </html>
  );
}
