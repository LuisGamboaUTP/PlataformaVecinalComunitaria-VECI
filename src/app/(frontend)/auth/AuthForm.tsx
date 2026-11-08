'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { ArrowLeft, Eye, EyeOff, IdCard, LockKeyhole, MapPin, ShieldCheck } from 'lucide-react'
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
  const [docType, setDocType] = useState<'dni' | 'ce' | 'pasaporte'>('dni')
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
      const passwordDigest = await digest(String(data.password || ''))
      const accounts = readLocal<LocalAccount[]>('nexobarrio-accounts', [])

      if (mode === 'register') {
        const email = String(data.email || '').trim().toLowerCase()
        const docNumber = String(data.docNumber || '').trim().toUpperCase()

        if (accounts.some((account) => account.user.email === email)) {
          setError('Ya existe una cuenta con ese correo en este dispositivo.')
          return
        }

        if (docNumber && accounts.some((account) => account.user.docNumber?.toUpperCase() === docNumber)) {
          setError('Ya existe una cuenta registrada con ese número de documento.')
          return
        }

        if (docType === 'dni' && docNumber && !/^\d{8}$/.test(docNumber)) {
          setError('El DNI debe contener exactamente 8 dígitos numéricos.')
          return
        }

        const user: LocalUser = {
          id: crypto.randomUUID(),
          email,
          displayName: String(data.displayName || '').trim(),
          zoneName: String(data.zoneName || 'Centro Cívico'),
          verificationStatus: docNumber ? 'verified' : 'unverified',
          docType,
          docNumber: docNumber || undefined,
        }

        writeLocal('nexobarrio-accounts', [...accounts, { user, passwordDigest }])
        saveSession(user)
      } else {
        const identifier = String(data.identifier || data.email || '').trim().toLowerCase()
        const account = accounts.find(
          (entry) =>
            (entry.user.email.toLowerCase() === identifier ||
              (entry.user.docNumber && entry.user.docNumber.toLowerCase() === identifier)) &&
            entry.passwordDigest === passwordDigest,
        )

        if (!account) {
          setError('Correo, documento o contraseña incorrectos en este dispositivo.')
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
    saveSession({
      id: provider ? 'demo-carlos' : 'demo-lucia',
      displayName: provider ? 'Carlos Mendoza' : 'Lucía',
      zoneName: 'Centro Cívico',
      email: provider ? 'proveedor.demo@nexobarrio.test' : 'demo@nexobarrio.test',
      verificationStatus: 'verified',
      docType: provider ? 'dni' : 'ce',
      docNumber: provider ? '44556677' : '001234567',
    })
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
                : 'Identidad protegida y validada para mayor confianza en el barrio.'}
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

                <div className="form-row">
                  <label>
                    Tipo de documento
                    <span className="input-with-icon">
                      <IdCard size={18} />
                      <select
                        name="docType"
                        value={docType}
                        onChange={(e) => setDocType(e.target.value as 'dni' | 'ce' | 'pasaporte')}
                      >
                        <option value="dni">DNI (Perú)</option>
                        <option value="ce">Carnet Extranjería (CE)</option>
                        <option value="pasaporte">Pasaporte</option>
                      </select>
                    </span>
                  </label>
                  <label>
                    N° de documento
                    <input
                      name="docNumber"
                      type="text"
                      placeholder={
                        docType === 'dni'
                          ? '8 dígitos (12345678)'
                          : docType === 'ce'
                            ? '9 dígitos / letras'
                            : 'N° de pasaporte'
                      }
                      maxLength={docType === 'dni' ? 8 : 16}
                      inputMode={docType === 'dni' ? 'numeric' : 'text'}
                      autoComplete="off"
                      required
                    />
                  </label>
                </div>
              </>
            )}

            <label>
              {mode === 'login' ? 'Correo o N° de documento (DNI / CE)' : 'Correo electrónico'}
              <input
                name={mode === 'login' ? 'identifier' : 'email'}
                type={mode === 'login' ? 'text' : 'email'}
                autoComplete={mode === 'login' ? 'username' : 'email'}
                placeholder={mode === 'login' ? 'tu@correo.com o tu DNI / CE' : 'tu@correo.com'}
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
                Entrar como Vecina (Lucía — CE)
              </button>
              <button type="button" onClick={() => loginDemo(true)} disabled={pending}>
                Entrar como Técnico (Carlos — DNI)
              </button>
            </span>
          </div>

          <div className="prototype-note">
            <ShieldCheck size={18} />
            <p>
              <strong>Confianza vecinal:</strong> tu documento solo se utiliza para validar identidad y proteger a la comunidad. Nunca se comparte públicamente.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
