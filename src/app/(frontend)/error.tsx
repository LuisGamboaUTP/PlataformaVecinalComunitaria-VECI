'use client'

export default function FrontendError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="empty-state" style={{ minHeight: '100vh', border: 0, borderRadius: 0 }}>
      <span>!</span>
      <h1>No pudimos cargar VECI</h1>
      <p>
        Revisa tu conexión o intenta nuevamente. Ninguna operación pendiente se marcó como enviada.
      </p>
      <button className="primary-button" onClick={reset}>
        Reintentar
      </button>
    </main>
  )
}
