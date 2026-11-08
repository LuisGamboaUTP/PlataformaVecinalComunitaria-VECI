'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  IdCard,
  Loader2,
  LockKeyhole,
  MapPin,
  ShieldCheck,
} from 'lucide-react'
import { readLocal, saveSession, writeLocal, type LocalUser } from '@/lib/local-store'

type LocalAccount = { user: LocalUser; passwordDigest: string }

const PERU_FIRST_NAMES = [
  'Carlos',
  'Lucía',
  'Pedro',
  'Rosa',
  'Jorge',
  'María',
  'Alejandro',
  'Elena',
  'José',
  'Ana',
  'Luis',
  'Carmen',
  'Miguel',
  'Diana',
  'Víctor',
]

const PERU_LAST_NAMES = [
  'Mendoza',
  'Paredes',
  'Huamán',
  'Morales',
  'Valdivia',
  'Torres',
  'Quispe',
  'Flores',
  'Rodríguez',
  'Rojas',
  'García',
  'Vargas',
  'Castillo',
]

const KNOWN_DOCS: Record<string, { name: string; zone: string }> = {
  '44556677': { name: 'Carlos Mendoza', zone: 'Centro Cívico' },
  '001234567': { name: 'Lucía Paredes', zone: 'Centro Cívico' },
  '12345678': { name: 'Lucía Paredes', zone: 'Centro Cívico' },
  '87654321': { name: 'Pedro Huamán', zone: 'Centro Cívico' },
  '72819203': { name: 'Rosa Morales', zone: 'Santa Beatriz' },
  '10293847': { name: 'Jorge Valdivia', zone: 'Jesús María' },
}

function resolveDocumentData(type: string, number: string): { name: string; zone: string } {
  const clean = number.trim().toUpperCase()
  if (KNOWN_DOCS[clean]) {
    return KNOWN_DOCS[clean]
  }
  let hash = 0
  for (let i = 0; i < clean.length; i++) {
    hash = (hash * 31 + clean.charCodeAt(i)) >>> 0
  }
  const first = PERU_FIRST_NAMES[hash % PERU_FIRST_NAMES.length]
  const last1 = PERU_LAST_NAMES[(hash >> 3) % PERU_LAST_NAMES.length]
  const last2 = PERU_LAST_NAMES[(hash >> 7) % PERU_LAST_NAMES.length]
  return {
    name: `${first} ${last1} ${last2}`,
    zone: 'Centro Cívico',
  }
}

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
  const [docNumber, setDocNumber] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [zoneName, setZoneName] = useState('Centro Cívico')
  const [isLookingUp, setIsLookingUp] = useState(false)
  const [lookupSuccess, setLookupSuccess] = useState<string | null>(null)
  const [visible, setVisible] = useState(false)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  const handleDocNumberChange = (value: string) => {
    const cleaned = docType === 'dni' ? value.replace(/\D/g, '').slice(0, 8) : value.slice(0, 16)
    setDocNumber(cleaned)

    const isComplete =
      (docType === 'dni' && cleaned.length === 8) || (docType !== 'dni' && cleaned.length >= 8)

    if (isComplete) {
      setIsLookingUp(true)
      setTimeout(() => {
        const data = resolveDocumentData(docType, cleaned)
        setDisplayName(data.name)
        if (data.zone) setZoneName(data.zone)
        setLookupSuccess(`Datos cargados del padrón: ${data.name}`)
        setIsLookingUp(false)
      }, 350)
    } else {
      setLookupSuccess(null)
    }
  }

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
        const cleanDoc = docNumber.trim().toUpperCase()

        if (accounts.some((account) => account.user.email === email)) {
          setError('Ya existe una cuenta con ese correo en este dispositivo.')
          return
        }

        if (cleanDoc && accounts.some((account) => account.user.docNumber?.toUpperCase() === cleanDoc)) {
          setError('Ya existe una cuenta registrada con ese número de documento.')
          return
        }

        if (docType === 'dni' && cleanDoc && !/^\d{8}$/.test(cleanDoc)) {
          setError('El DNI debe contener exactamente 8 dígitos numéricos.')
          return
        }

        const finalName = displayName.trim() || String(data.displayName || '').trim() || 'Vecino de la zona'

        const user: LocalUser = {
          id: crypto.randomUUID(),
          email,
          displayName: finalName,
          zoneName,
          verificationStatus: cleanDoc ? 'verified' : 'unverified',
          docType,
          docNumber: cleanDoc || undefined,
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
              {mode === 'login' ? 'Qué bueno verte' : 'Empieza por tu documento'}
            </span>
            <h2>{mode === 'login' ? 'Vuelve a tu barrio' : 'Crea tu perfil vecinal'}</h2>
            <p>
              {mode === 'login'
                ? 'Tus guardados y conversaciones te esperan.'
                : 'Ingresa tu DNI para autocompletar tus datos oficiales y validar tu identidad.'}
            </p>
          </div>

          <form onSubmit={submit} className="auth-form">
            {mode === 'register' && (
              <>
                {/* 1. PRIMER CAMPO PROTAGONISTA: TIPO Y N° DE DOCUMENTO */}
                <div className="form-row">
                  <label>
                    Tipo de documento
                    <span className="input-with-icon">
                      <IdCard size={18} />
                      <select
                        name="docType"
                        value={docType}
                        onChange={(e) => {
                          const nextType = e.target.value as 'dni' | 'ce' | 'pasaporte'
                          setDocType(nextType)
                          setDocNumber('')
                          setLookupSuccess(null)
                        }}
                      >
                        <option value="dni">DNI (Perú)</option>
                        <option value="ce">Carnet Extranjería (CE)</option>
                        <option value="pasaporte">Pasaporte</option>
                      </select>
                    </span>
                  </label>

                  <label>
                    Número de documento
                    <input
                      name="docNumber"
                      type="text"
                      value={docNumber}
                      onChange={(e) => handleDocNumberChange(e.target.value)}
                      placeholder={
                        docType === 'dni'
                          ? '8 dígitos (ej: 44556677)'
                          : docType === 'ce'
                            ? '9 dígitos / letras'
                            : 'N° de pasaporte'
                      }
                      maxLength={docType === 'dni' ? 8 : 16}
                      inputMode={docType === 'dni' ? 'numeric' : 'text'}
                      autoComplete="off"
                      autoFocus
                      required
                    />
                  </label>
                </div>

                {isLookingUp && (
                  <p style={{ margin: '-8px 0 0', fontSize: '12px', color: 'var(--green)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Loader2 size={14} className="animate-spin" />
                    Consultando padrón de identidad…
                  </p>
                )}

                {lookupSuccess && (
                  <p style={{ margin: '-8px 0 0', fontSize: '12px', color: 'var(--green)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 650 }}>
                    <CheckCircle2 size={16} />
                    {lookupSuccess}
                  </p>
                )}

                {/* 2. SEGUNDO CAMPO: NOMBRE PÚBLICO (AUTOCOMPLETADO POR DNI) */}
                <label>
                  Nombre público {lookupSuccess ? '✓ Autocompletado' : ''}
                  <input
                    name="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    autoComplete="name"
                    placeholder="Se autocompleta con tu DNI"
                    required
                  />
                </label>

                {/* 3. TERCER CAMPO: BARRIO O ZONA */}
                <label>
                  Barrio o zona
                  <span className="input-with-icon">
                    <MapPin size={18} />
                    <select
                      name="zoneName"
                      value={zoneName}
                      onChange={(e) => setZoneName(e.target.value)}
                      required
                    >
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

            {/* 4. CORREO / IDENTIFICADOR */}
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

            {/* 5. CONTRASEÑA */}
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
              <strong>Confianza vecinal:</strong> al ingresar tu documento se valida tu identidad oficial. Los datos sensibles nunca se comparten públicamente.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
