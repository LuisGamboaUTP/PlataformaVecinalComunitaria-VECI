'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Check,
  CreditCard,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  MapPin,
  ShieldCheck,
  UserCheck,
} from 'lucide-react'

export function AuthForm() {
  const [mode, setMode] = useState<'login' | 'register' | 'recover'>('login')
  const [visible, setVisible] = useState(false)
  const [docType, setDocType] = useState<'DNI' | 'CE'>('DNI')
  const [docNumber, setDocNumber] = useState('')
  const [error, setError] = useState('')
  const [recoveryNotice, setRecoveryNotice] = useState('')
  const [pending, setPending] = useState(false)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPending(true)
    setError('')
    setRecoveryNotice('')
    const formData = new FormData(event.currentTarget)
    const data = Object.fromEntries(formData.entries())

    if (mode === 'recover') {
      window.setTimeout(() => {
        setPending(false)
        setRecoveryNotice(
          `Si el correo ${String(data.email || '')} está registrado, recibirás instrucciones para restablecer tu contraseña.`,
        )
      }, 450)
      return
    }

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
          <p>
            Encuentra oficios con «Visto Bueno Vecinal», comparte herramientas sin dinero y coordina
            apoyo comunitario seguro.
          </p>
        </div>
        <div className="auth-trust">
          <ShieldCheck size={20} />
          <span>
            Tu dirección exacta nunca se publica. Cuidamos tu privacidad mostrando solo referencias
            aproximadas en tu barrio.
          </span>
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-panel__inner">
          <div className="segmented" role="tablist" aria-label="Acceso">
            <button
              type="button"
              onClick={() => {
                setMode('login')
                setError('')
                setRecoveryNotice('')
              }}
              className={mode === 'login' ? 'is-active' : ''}
            >
              Ingresar
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register')
                setError('')
                setRecoveryNotice('')
              }}
              className={mode === 'register' ? 'is-active' : ''}
            >
              Crear cuenta
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('recover')
                setError('')
                setRecoveryNotice('')
              }}
              className={mode === 'recover' ? 'is-active' : ''}
            >
              Recuperar
            </button>
          </div>

          <div className="auth-heading">
            <span className="eyebrow">
              {mode === 'login'
                ? 'Qué bueno verte'
                : mode === 'register'
                  ? 'Cuenta multifunción vecinal'
                  : 'Restablecer acceso'}
            </span>
            <h2>
              {mode === 'login'
                ? 'Vuelve a tu barrio'
                : mode === 'register'
                  ? 'Crea tu perfil y valida tu identidad'
                  : 'Recupera tu contraseña'}
            </h2>
            <p>
              {mode === 'login'
                ? 'Tus guardados, trueques y conversaciones te esperan.'
                : mode === 'register'
                  ? 'Puedes verificar tu DNI o Carnet de Extranjería para obtener el distintivo de identidad verificada.'
                  : 'Ingresa tu correo para enviarte un enlace seguro de recuperación.'}
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
                    placeholder="Como te verán tus vecinos (ej. Ana Quispe)"
                    required
                  />
                </label>
                <label>
                  Barrio o zona declarada
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
                <div className="doc-verify-box">
                  <div className="doc-verify-header">
                    <CreditCard size={18} />
                    <div>
                      <strong>Verificación de Identidad (DNI / Carnet de Extranjería)</strong>
                      <small>Opcional ahora · otorga insignia de Identidad Verificada</small>
                    </div>
                  </div>
                  <div className="form-row">
                    <label>
                      Tipo de documento
                      <select
                        name="docType"
                        value={docType}
                        onChange={(e) => setDocType(e.target.value as 'DNI' | 'CE')}
                      >
                        <option value="DNI">DNI (Perú · 8 dígitos)</option>
                        <option value="CE">Carnet de Extranjería (CE)</option>
                      </select>
                    </label>
                    <label>
                      Número de {docType}
                      <input
                        name="docNumber"
                        value={docNumber}
                        onChange={(e) => setDocNumber(e.target.value.trim())}
                        placeholder={docType === 'DNI' ? 'Ej. 74829103' : 'Ej. 001849201'}
                        maxLength={docType === 'DNI' ? 8 : 12}
                      />
                    </label>
                  </div>
                  {docNumber && (
                    <small className="doc-valid-hint">
                      {(docType === 'DNI' && /^\d{8}$/.test(docNumber)) ||
                      (docType === 'CE' && /^[A-Z0-9]{9,12}$/i.test(docNumber)) ? (
                        <span className="is-valid">
                          <Check size={14} /> Formato de {docType} válido para verificación
                        </span>
                      ) : (
                        <span>
                          {docType === 'DNI'
                            ? 'El DNI debe tener exactamente 8 dígitos numéricos.'
                            : 'El Carnet de Extranjería debe tener entre 9 y 12 caracteres.'}
                        </span>
                      )}
                    </small>
                  )}
                </div>
              </>
            )}

            <label>
              Correo electrónico
              <span className="input-with-icon">
                <Mail size={18} />
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="tu@correo.com"
                  required
                />
              </span>
            </label>

            {mode !== 'recover' && (
              <label>
                Contraseña
                <span className="input-with-icon">
                  <LockKeyhole size={18} />
                  <input
                    name="password"
                    type={visible ? 'text' : 'password'}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    minLength={8}
                    placeholder="Mínimo 8 caracteres"
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
            )}

            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            {recoveryNotice && (
              <p className="form-feedback" role="status">
                {recoveryNotice}
              </p>
            )}

            <button className="primary-button primary-button--wide" disabled={pending}>
              {pending
                ? 'Procesando…'
                : mode === 'login'
                  ? 'Ingresar al barrio'
                  : mode === 'register'
                    ? 'Crear cuenta vecinal'
                    : 'Enviar enlace de recuperación'}
            </button>
          </form>

          <div className="demo-login">
            <div>
              <strong>
                <UserCheck size={16} /> Acceso rápido de prueba
              </strong>
              <p>
                Ingresa con un clic para explorar la experiencia como vecina o como técnico del
                barrio:
              </p>
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
              <strong>Confianza vecinal:</strong> validamos tu identidad con DNI o Carnet de
              Extranjería y destacamos las recomendaciones reales de vecinos de tu misma zona.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
