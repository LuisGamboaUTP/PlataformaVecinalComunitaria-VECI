'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, Navigation, Volume2 } from 'lucide-react'

type Notice = { id: string; type: 'need' | 'resource'; body: string }
const key = 'nexobarrio-emergency-notices-v1'
const contacts = [
  { number: '116', name: 'Bomberos del Perú' },
  { number: '105', name: 'Policía Nacional' },
  { number: '106', name: 'SAMU' },
  { number: '115', name: 'Defensa Civil / INDECI' },
]

export function EmergencyModal() {
  const [section, setSection] = useState<'contacts' | 'board'>('contacts')
  const [notices, setNotices] = useState<Notice[]>([])
  const [type, setType] = useState<'need' | 'resource'>('resource')
  const [body, setBody] = useState('')
  const [ready, setReady] = useState(false)
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(key) || '[]')
      if (Array.isArray(saved)) setNotices(saved)
    } catch {
      /* Keep the emergency directory available. */
    }
    setReady(true)
  }, [])
  useEffect(() => {
    if (ready) localStorage.setItem(key, JSON.stringify(notices))
  }, [notices, ready])

  const speak = () => {
    window.speechSynthesis?.cancel()
    const text = contacts
      .map(({ number, name }) => `${name}: ${number.split('').join(' ')}`)
      .join('. ')
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'es-PE'
    window.speechSynthesis?.speak(utterance)
  }
  const addNotice = () => {
    if (body.trim().length < 5) return
    setNotices([{ id: crypto.randomUUID(), type, body: body.trim() }, ...notices])
    setBody('')
  }
  return (
    <div className="emergency-view">
      <div className="emergency-header">
        <span>
          <AlertTriangle size={25} />
        </span>
        <div>
          <small>Atención responsable</small>
          <h1>Emergencia y apoyo</h1>
        </div>
      </div>
      <div className="warning-box">
        <strong>Ante peligro inmediato, llama a un servicio oficial.</strong>
        <p>
          Los avisos vecinales de esta pantalla se guardan solo en este dispositivo; no alertan
          automáticamente a brigadas.
        </p>
      </div>
      <div className="segmented">
        <button
          className={section === 'contacts' ? 'is-active' : ''}
          onClick={() => setSection('contacts')}
        >
          Líneas de emergencia
        </button>
        <button
          className={section === 'board' ? 'is-active' : ''}
          onClick={() => setSection('board')}
        >
          Apoyo Vecinal Activo
        </button>
      </div>
      {section === 'contacts' ? (
        <>
          <button className="secondary-button" onClick={speak}>
            <Volume2 size={18} /> Escuchar
          </button>
          <div className="emergency-list">
            {contacts.map(({ number, name }) => (
              <a key={number} href={`tel:${number}`}>
                <span>{number}</span>
                <div>
                  <strong>{name}</strong>
                  <small>Llamada directa</small>
                </div>
                <Navigation size={18} />
              </a>
            ))}
          </div>
        </>
      ) : (
        <div className="active-community">
          <div className="board-summary">
            <span>
              <strong>{notices.filter((notice) => notice.type === 'need').length}</strong>
              <small>Necesidades abiertas</small>
            </span>
            <span>
              <strong>{notices.filter((notice) => notice.type === 'resource').length}</strong>
              <small>Recursos vecinales</small>
            </span>
            <span>
              <strong>0</strong>
              <small>Brigadas activas confirmadas</small>
            </span>
          </div>
          <div className="emergency-compose">
            <label>
              Tipo de aviso
              <select
                value={type}
                onChange={(event) => setType(event.target.value as 'need' | 'resource')}
              >
                <option value="resource">Ofrezco un recurso</option>
                <option value="need">Necesito ayuda urgente</option>
              </select>
            </label>
            <label>
              Describe lo que necesitas u ofreces
              <textarea
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder="Agua potable, botiquín, linternas…"
                rows={3}
              />
            </label>
            <button
              className="primary-button"
              onClick={addNotice}
              disabled={body.trim().length < 5}
            >
              Guardar aviso local
            </button>
          </div>
          {notices.map((notice) => (
            <article key={notice.id}>
              <span className={`kind-tag kind-tag--${notice.type === 'need' ? 'help' : 'gift'}`}>
                {notice.type === 'need' ? 'Necesidad' : 'Recurso'}
              </span>
              <h3>{notice.body}</h3>
              <small>Guardado en este dispositivo · pendiente de coordinación</small>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
