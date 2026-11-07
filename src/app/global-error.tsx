'use client'

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="es">
      <body>
        <main
          style={{
            minHeight: '100vh',
            display: 'grid',
            placeContent: 'center',
            padding: 24,
            fontFamily: 'system-ui, sans-serif',
            textAlign: 'center',
            background: '#f8f6ef',
            color: '#18211d',
          }}
        >
          <h1 style={{ fontSize: 32, margin: 0 }}>No pudimos abrir esta vista</h1>
          <p style={{ color: '#66736d' }}>Tus datos siguen seguros. Intenta cargarla nuevamente.</p>
          <button
            onClick={reset}
            style={{
              minHeight: 48,
              marginTop: 16,
              border: 0,
              borderRadius: 14,
              padding: '0 18px',
              color: 'white',
              background: '#16735b',
              fontWeight: 800,
            }}
          >
            Reintentar
          </button>
        </main>
      </body>
    </html>
  )
}
