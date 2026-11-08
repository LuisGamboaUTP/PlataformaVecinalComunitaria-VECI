'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { ArrowLeft, Eye, EyeOff, LockKeyhole, MapPin, ShieldCheck } from 'lucide-react'
import { readLocal, saveSession, writeLocal, type LocalUser } from '@/lib/local-store'

type LocalAccount = { user: LocalUser; passwordDigest: string }
async function digest(value: string) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function AuthForm({
  initialMode = 'login',
  switchable = true,
}: {
  initialMode?: 'login' | 'register'
  switchable?: boolean
}) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode)
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
      const email = String(data.email || '').trim().toLowerCase()
      const passwordDigest = await digest(String(data.password || ''))
      const accounts = readLocal<LocalAccount[]>('nexobarrio-accounts', [])
      if (mode === 'register') {
        if (accounts.some((account) => account.user.email === email)) {
          setError('Ya existe una cuenta local con ese correo.')
          return
        }
        const user: LocalUser = { id: crypto.randomUUID(), email, displayName: String(data.displayName || '').trim(), zoneName: String(data.zoneName || 'Centro Cívico'), verificationStatus: 'unverified' }
        writeLocal('nexobarrio-accounts', [...accounts, { user, passwordDigest }])
        saveSession(user)
      } else {
        const account = accounts.find((entry) => entry.user.email === email && entry.passwordDigest === passwordDigest)
        if (!account) {
          setError('Correo o contraseña incorrectos en este dispositivo.')
          return
        }
        saveSession(account.user)
      }
      window.location.assign('/')
    } catch {
      setError('No se pudo guardar el perfil local.')
    } finally {
      setPending(false)
    }
  }

  const loginDemo = async (provider = false) => {
    setPending(true)
    setError('')
    saveSession({ id: provider ? 'demo-carlos' : 'demo-lucia', displayName: provider ? 'Carlos Mendoza' : 'Lucía', zoneName: 'Centro Cívico', email: provider ? 'proveedor.demo@nexobarrio.test' : 'demo@nexobarrio.test', verificationStatus: 'unverified' })
    window.location.assign('/')
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
          <div className="auth-mobile-header">
            <Link href="/" className="round-control" aria-label="Volver al mapa">
              <ArrowLeft size={18} />
            </Link>
            <div className="brand-lockup">
              <span className="brand-mark">N</span>
              <span>NexoBarrio</span>
            </div>
          </div>
          {switchable && (
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
          )}

          <div className="auth-heading">
            <span className="eyebrow">
              {mode === 'login' ? 'Qué bueno verte' : 'Empieza por tu zona'}
            </span>
            <h2>{mode === 'login' ? 'Vuelve a tu barrio' : 'Crea tu perfil vecinal'}</h2>
            <p>
              {mode === 'login'
                ? 'Tus guardados y conversaciones te esperan.'
                : 'Tu perfil se guardará solo en este navegador.'}
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
                      <option>Breña</option>
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
          {mode === 'login' ? (
            <p className="auth-links">
              <Link href="/registro">Crear cuenta</Link> ·{' '}
              <Link href="/recuperar">Recuperar contraseña</Link>
            </p>
          ) : (
            <p className="auth-links">
              <Link href="/login">Ya tengo cuenta</Link>
            </p>
          )}

          <div className="demo-login">
            <div>
              <strong>Recorrido de demostración</strong>
              <p>Perfiles de ejemplo guardados en este navegador.</p>
            </div>
            <span>
              <button type="button" onClick={() => loginDemo(false)} disabled={pending}>
                Entrar como Vecina (Lucía)
              </button>
              <button type="button" onClick={() => loginDemo(true)} disabled={pending}>
                Entrar como Técnico (Carlos)
              </button>
            </span>
          </div>

          <div className="prototype-note">
            <ShieldCheck size={18} />
            <p>
              <strong>Versión frontend:</strong> los datos no se comparten con otras personas. Evita ingresar información sensible.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
