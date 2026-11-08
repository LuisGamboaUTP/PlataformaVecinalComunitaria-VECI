'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function RecoveryPage() {
  const [message, setMessage] = useState('')
  return (
    <main className="recovery-page">
      <div className="auth-panel__inner">
        <Link href="/login">← Volver a iniciar sesión</Link>
        <span className="eyebrow">Acceso a tu cuenta</span>
        <h1>Recupera tu contraseña</h1>
        <p>
          Esta versión guarda las cuentas solo en este navegador y no puede enviar correos de recuperación.
        </p>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            setMessage('La recuperación por correo no está disponible en esta versión local. Puedes usar un perfil de demostración.')
          }}
        >
          <label>
            Correo
            <input
              type="email"
              name="email"
              autoComplete="email"
              required
              placeholder="tu@correo.com"
            />
          </label>
          <button className="primary-button primary-button--wide" type="submit">
            Solicitar ayuda
          </button>
          {message && <p role="status">{message}</p>}
        </form>
      </div>
    </main>
  )
}
