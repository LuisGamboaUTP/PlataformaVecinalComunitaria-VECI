'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { ArrowLeft, Eye, EyeOff, LockKeyhole, MapPin, ShieldCheck } from 'lucide-react'

export function AuthForm() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [visible, setVisible] = useState(false)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPending(true)
    setError('')
    const formData = new FormData(event.currentTarget)
    const data = Object.fromEntries(formData.entries())
    try {
      const response = await fetch('/api/app/session', {
        method: mode === 'login' ? 'POST' : 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await response.json()
      if (!response.ok) {
        setError(result.error?.message || 'No pudimos completar la operación.')
        return
      }
      window.location.assign('/')
    } catch {
      setError('Sin conexión. Intenta nuevamente cuando recuperes internet.')
    } finally {
      setPending(false)
    }
  }

  const loginDemo = async (provider = false) => {
    setPending(true)
    setError('')
    try {
      const response = await fetch('/api/app/session', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: provider ? 'proveedor.demo@nexobarrio.test' : 'demo@nexobarrio.test',
          password: provider ? 'ProveedorNexo!2026' : 'DemoNexo!2026',
        }),
      })
      if (!response.ok) {
        setError('La cuenta demo no está disponible.')
        return
      }
      window.location.assign('/')
    } catch {
      setError('Sin conexión. No se pudo abrir la demostración.')
    } finally {
      setPending(false)
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-story" aria-label="Bienvenida">
        <Link href="/" className="round-control" aria-label="Volver al mapa">
          <ArrowLeft size={20} />
        </Link>
        <div className="brand-lockup brand-lockup--light">
          <span className="brand-mark">N</span>
          <span>NexoBarrio</span>
        </div>
        <div className="auth-story__copy">
          <span className="eyebrow eyebrow--light">Tu barrio, más cerca</span>
          <h1>Resolver juntos cambia la distancia.</h1>
          <p>Encuentra oficios, comparte recursos y coordina ayuda con personas de tu zona.</p>
        </div>
        <div className="auth-trust">
          <ShieldCheck size={20} />
          <span>Tu dirección exacta nunca se publica.</span>
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-panel__inner">
          <div className="segmented" role="tablist" aria-label="Acceso">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={mode === 'login' ? 'is-active' : ''}
            >
              Ingresar
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={mode === 'register' ? 'is-active' : ''}
            >
              Crear cuenta
            </button>
          </div>

          <div className="auth-heading">
            <span className="eyebrow">
              {mode === 'login' ? 'Qué bueno verte' : 'Empieza por tu zona'}
            </span>
            <h2>{mode === 'login' ? 'Vuelve a tu barrio' : 'Crea tu perfil vecinal'}</h2>
            <p>
              {mode === 'login'
                ? 'Tus guardados y conversaciones te esperan.'
                : 'Correo confirmado no equivale a residencia verificada.'}
            </p>
          </div>

          <form onSubmit={submit} className="auth-form">
            {mode === 'register' && (
              <>
                <label>
                  Nombre público
                  <input
                    name="displayName"
                    autoComplete="name"
                    placeholder="Como te verán tus vecinos"
                    required
                  />
                </label>
                <label>
                  Barrio o zona
                  <span className="input-with-icon">
                    <MapPin size={18} />
                    <select name="zoneName" defaultValue="Centro Cívico" required>
                      <option>Centro Cívico</option>
                      <option>Santa Beatriz</option>
                      <option>Jesús María</option>
                      <option>Lince</option>
                    </select>
                  </span>
                </label>
              </>
            )}
            <label>
              Correo
              <input
                name="email"
                type="email"
                autoComplete="email"
                placeholder="tu@correo.com"
                required
              />
            </label>
            <label>
              Contraseña
              <span className="input-with-icon">
                <LockKeyhole size={18} />
                <input
                  name="password"
                  type={visible ? 'text' : 'password'}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  onClick={() => setVisible(!visible)}
                  aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {visible ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
            </label>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <button className="primary-button primary-button--wide" disabled={pending}>
              {pending ? 'Procesando…' : mode === 'login' ? 'Ingresar al barrio' : 'Crear cuenta'}
            </button>
          </form>

          <div className="demo-login">
            <div>
              <strong>Recorrido de demostración</strong>
              <p>Cuentas compartidas y rotuladas. No ingreses información personal.</p>
            </div>
            <span>
              <button type="button" onClick={() => loginDemo(false)} disabled={pending}>
                Entrar como solicitante
              </button>
              <button type="button" onClick={() => loginDemo(true)} disabled={pending}>
                Entrar como proveedor
              </button>
            </span>
          </div>

          <div className="prototype-note">
            <ShieldCheck size={18} />
            <p>
              <strong>Verificación documental:</strong> prototipo no habilitado. No pedimos DNI ni
              carnet hasta integrar un proveedor seguro.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
