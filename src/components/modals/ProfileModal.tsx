'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ShieldCheck } from 'lucide-react'
type SessionUser = {
  id: string
  displayName?: string
  zoneName?: string
  verificationStatus?: string
}

export function ProfileModal({
  user,
  savedCount,
  onLogout,
  onOpenImpact,
  onOpenWelcome,
}: {
  user: SessionUser | null
  savedCount: number
  onLogout: () => Promise<void>
  onOpenImpact: () => void
  onOpenWelcome?: () => void
}) {
  const [fontScale, setFontScale] = useState('normal')
  const [highContrast, setHighContrast] = useState(false)
  const [simpleView, setSimpleView] = useState(false)
  const [profileTab, setProfileTab] = useState<
    'identity' | 'reading' | 'saved' | 'welcome' | 'privacy'
  >('identity')
  useEffect(() => {
    try {
      const preferences = JSON.parse(localStorage.getItem('nexobarrio-accessibility') || '{}')
      setFontScale(preferences.fontScale || 'normal')
      setHighContrast(Boolean(preferences.highContrast))
      setSimpleView(Boolean(preferences.simpleView))
    } catch {
      /* Use defaults. */
    }
  }, [])
  const savePreferences = (next: {
    fontScale: string
    highContrast: boolean
    simpleView: boolean
  }) => {
    localStorage.setItem('nexobarrio-accessibility', JSON.stringify(next))
    document.documentElement.dataset.fontScale = next.fontScale
    document.documentElement.dataset.highContrast = String(next.highContrast)
    document.documentElement.dataset.simpleView = String(next.simpleView)
    setFontScale(next.fontScale)
    setHighContrast(next.highContrast)
    setSimpleView(next.simpleView)
  }
  const name = user?.displayName
  return (
    <div className="profile-view">
      <div className="profile-cover">
        <div className="provider-avatar provider-avatar--large">
          {name?.slice(0, 2).toUpperCase() || 'DE'}
        </div>
      </div>
      <h1>{name || 'Perfil vecinal'}</h1>
      <p>{user?.zoneName || 'Centro Cívico'} · zona declarada</p>
      <span className="verification-chip">
        <ShieldCheck size={16} />{' '}
        {user?.verificationStatus === 'verified'
          ? 'Identidad verificada por proceso real'
          : 'Identidad no verificada'}
      </span>
      <div className="profile-metrics">
        <span>
          <strong>0</strong>
          <small>Servicios</small>
        </span>
        <span>
          <strong>0</strong>
          <small>Ayudas</small>
        </span>
        <span>
          <strong>{savedCount}</strong>
          <small>Guardados</small>
        </span>
      </div>
      <div className="profile-tabs" role="tablist" aria-label="Opciones del perfil">
        {[
          ['identity', 'Perfil local'],
          ['reading', 'Lectura y Voz'],
          ['saved', 'Guardados'],
          ['welcome', 'Bienvenida'],
          ['privacy', 'Privacidad'],
        ].map(([id, label]) => (
          <button
            key={id}
            className={profileTab === id ? 'is-active' : ''}
            onClick={() => setProfileTab(id as typeof profileTab)}
          >
            {label}
          </button>
        ))}
      </div>
      {profileTab === 'identity' && (
        <p>
          Este perfil se guarda solo en tu navegador. La identidad no se verifica automáticamente.
        </p>
      )}
      {profileTab === 'reading' && (
        <section className="profile-accessibility">
          <h2>Lectura y Voz</h2>
          <label>
            Tamaño de letra
            <select
              value={fontScale}
              onChange={(event) =>
                savePreferences({ fontScale: event.target.value, highContrast, simpleView })
              }
            >
              <option value="normal">Normal 100%</option>
              <option value="large">Grande 112%</option>
              <option value="extra">Extra grande 124%</option>
            </select>
          </label>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={highContrast}
              onChange={(event) =>
                savePreferences({ fontScale, highContrast: event.target.checked, simpleView })
              }
            />{' '}
            Alto contraste
          </label>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={simpleView}
              onChange={(event) =>
                savePreferences({ fontScale, highContrast, simpleView: event.target.checked })
              }
            />{' '}
            Vista simplificada
          </label>
        </section>
      )}
      {profileTab === 'saved' && (
        <p>
          Tienes {savedCount} publicación{savedCount === 1 ? '' : 'es'} guardada
          {savedCount === 1 ? '' : 's'} en este dispositivo.
        </p>
      )}
      {profileTab === 'welcome' && (
        <div className="profile-welcome-box">
          <p>
            Vuelve a consultar la guía interactiva de 3 pasos con las recomendaciones del barrio,
            trueques y números de emergencia.
          </p>
          <button
            type="button"
            className="primary-button primary-button--wide"
            onClick={() => {
              if (onOpenWelcome) {
                onOpenWelcome()
              } else {
                window.location.assign('/onboarding')
              }
            }}
          >
            Abrir guía de bienvenida
          </button>
        </div>
      )}
      {profileTab === 'privacy' && (
        <p>
          Tu dirección exacta no aparece en las fichas. Acuerda los detalles por chat y evita
          publicar datos personales en el muro.
        </p>
      )}
      <button className="secondary-button primary-button--wide" onClick={onOpenImpact}>
        Ver impacto del barrio
      </button>
      {user ? (
        <button className="secondary-button primary-button--wide" onClick={onLogout}>
          Cerrar sesión
        </button>
      ) : (
        <Link href="/auth" className="primary-button primary-button--wide">
          Ingresar o crear cuenta
        </Link>
      )}
      <p className="prototype-caption">
        Esta versión no recopila documentos de identidad ni comparte datos con otros dispositivos.
      </p>
    </div>
  )
}
