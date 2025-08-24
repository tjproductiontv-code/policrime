'use client';
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html>
      <body style={{fontFamily:'system-ui', padding:24}}>
        <h1>Er ging iets mis aan de client-kant</h1>
        <p style={{color:'#555'}}>Details (voor debug):</p>
        <pre style={{whiteSpace:'pre-wrap', background:'#f6f6f6', padding:12, borderRadius:8, border:'1px solid #eee'}}>
{String(error?.message || error)}
        </pre>
        <button onClick={() => reset()} style={{marginTop:16, padding:'8px 12px'}}>Probeer opnieuw</button>
        <p style={{marginTop:24}}><a href="/ok">Health check (/ok)</a></p>
      </body>
    </html>
  );
}
