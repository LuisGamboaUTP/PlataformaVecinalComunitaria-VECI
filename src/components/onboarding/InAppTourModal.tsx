'use client'

import { useEffect, useState } from 'react'
import {
  CheckCircle2,
  HandHeart,
  HelpCircle,
  Layers,
  MapPin,
  PlusCircle,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Volume2,
  X,
  Wrench,
  BookOpen,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react'

interface TourStep {
  badge: string
  title: string
  summary: string
  detail: string
  icon: typeof MapPin
  color: string
  bgLight: string
  accentBorder: string
  actionLabel?: string
}

const TOUR_STEPS: TourStep[] = [
  {
    badge: 'Paso 1 de 5 · ¿Qué es VECI?',
    title: 'Tu barrio solidario a menos de 10 cuadras',
    summary: 'Encuentra oficios recomendados, pide herramientas prestadas y apoya a tus vecinos sin gastar de más.',
    detail:
      'VECI conecta a las personas que viven cerca de ti para resolver necesidades cotidianas con costos mínimos y sin transporte largo.',
    icon: MapPin,
    color: '#0f766e',
    bgLight: '#f0fdfa',
    accentBorder: '#99f6e4',
  },
  {
    badge: 'Paso 2 de 5 · El Mapa y los Colores',
    title: 'Cada color representa un tipo de apoyo vecinal',
    summary: 'Aprende a reconocer rápidamente qué ofrece cada gota en tu mapa:',
    detail: 'Guía rápida de colores para que encuentres lo que buscas al instante:',
    icon: Layers,
    color: '#2563eb',
    bgLight: '#eff6ff',
    accentBorder: '#bfdbfe',
  },
  {
    badge: 'Paso 3 de 5 · Confianza y Visto Bueno',
    title: 'Toca cualquier pin para conocer al vecino',
    summary: 'Al tocar un pin verás la foto, precio exacto (ej. S/ 30 o Sin costo) y la recomendación vecinal.',
    detail:
      'El sello verde "Visto Bueno Vecinal" te indica que otros vecinos de la misma junta o calle ya verificaron y avalaron a esa persona.',
    icon: ShieldCheck,
    color: '#059669',
    bgLight: '#ecfdf5',
    accentBorder: '#a7f3d0',
  },
  {
    badge: 'Paso 4 de 5 · Publicar en 3 clics',
    title: '¿Tienes una herramienta o un oficio? Publica fácil',
    summary: 'El botón "+ Publicar" te permite ofrecer un servicio, prestar algo o pedir ayuda en solo 3 toques.',
    detail:
      'No hay formularios complicados. Elige qué modalidad es, escribe el título y tu publicación aparecerá de inmediato en el mapa de tus vecinos.',
    icon: PlusCircle,
    color: '#7c3aed',
    bgLight: '#f5f3ff',
    accentBorder: '#ddd6fe',
  },
  {
    badge: 'Paso 5 de 5 · Modo de Emergencia',
    title: 'Botón SOS para sismos o cortes de servicios',
    summary: 'El botón rojo superior activa el Tablero de Emergencia y las llamadas directas sin gastar megas.',
    detail:
      'Encuentra brigadas vecinales de primeros auxilios, electricistas de guardia para corte de llaves, y los números de Bomberos 116, Policía 105 y SAMU 106 listos para marcar.',
    icon: ShieldAlert,
    color: '#dc2626',
    bgLight: '#fef2f2',
    accentBorder: '#fecaca',
  },
]

const COLOR_GUIDE = [
  {
    name: 'Oficios y Servicios',
    color: '#2563eb',
    bg: '#dbeafe',
    example: 'Gasfiteros, electricistas, costura',
  },
  {
    name: 'Préstamo de Herramientas',
    color: '#7c3aed',
    bg: '#ede9fe',
    example: 'Taladros, escaleras sin costo (S/ 0)',
  },
  {
    name: 'Banco de Tiempo',
    color: '#059669',
    bg: '#d1fae5',
    example: 'Clases, asesorías (1 h por 1 h)',
  },
  {
    name: 'Trueque Solidario',
    color: '#ea580c',
    bg: '#ffedd5',
    example: 'Intercambio de artículos del hogar',
  },
  {
    name: 'Donaciones y Regalos',
    color: '#d97706',
    bg: '#fef3c7',
    example: 'Libros, ropa infantil gratis',
  },
  {
    name: 'Apoyo y Necesidad',
    color: '#e11d48',
    bg: '#ffe4e6',
    example: 'Compras de mercado a adulto mayor',
  },
]

export function InAppTourModal({
  isOpen,
  onClose,
  initialStep = 0,
}: {
  isOpen: boolean
  onClose: () => void
  initialStep?: number
}) {
  const [currentStep, setCurrentStep] = useState(initialStep)
  const [isSpeaking, setIsSpeaking] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(initialStep)
      window.speechSynthesis?.cancel()
      setIsSpeaking(false)
    }
  }, [isOpen, initialStep])

  if (!isOpen) return null

  const step = TOUR_STEPS[currentStep] || TOUR_STEPS[0]
  const Icon = step.icon

  const handleSpeak = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return

    if (isSpeaking) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
      return
    }

    window.speechSynthesis.cancel()
    let textToSpeak = `${step.title}. ${step.summary}. ${step.detail}`
    if (currentStep === 1) {
      textToSpeak += ' Los colores son: Azul para oficios, Morado para préstamos gratuitos, Verde para banco de tiempo, Naranja para trueques, y Rojo para ayuda solidaria.'
    }
    const utterance = new SpeechSynthesisUtterance(textToSpeak)
    utterance.lang = 'es-PE'
    utterance.rate = 0.95 // Slightly slower for clear neighborhood comprehension
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)
    setIsSpeaking(true)
    window.speechSynthesis.speak(utterance)
  }

  const handleClose = () => {
    window.speechSynthesis?.cancel()
    setIsSpeaking(false)
    try {
      localStorage.setItem('nexobarrio-tour-completed', '1')
      localStorage.removeItem('nexobarrio-show-tour')
    } catch {
      // ignore
    }
    onClose()
  }

  const handleNext = () => {
    window.speechSynthesis?.cancel()
    setIsSpeaking(false)
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1)
    } else {
      handleClose()
    }
  }

  const handlePrev = () => {
    window.speechSynthesis?.cancel()
    setIsSpeaking(false)
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  return (
    <div
      className="tour-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-modal-title"
    >
      <div className="tour-modal-card">
        {/* ENCABEZADO SUPERIOR */}
        <div className="tour-header" style={{ borderBottomColor: step.accentBorder }}>
          <div className="tour-badge-pill" style={{ color: step.color, background: step.bgLight }}>
            <span className="tour-badge-dot" style={{ background: step.color }} />
            {step.badge}
          </div>
          <div className="tour-header-actions">
            <button
              type="button"
              className={`tour-audio-btn ${isSpeaking ? 'is-active' : ''}`}
              onClick={handleSpeak}
              title={isSpeaking ? 'Detener voz' : 'Escuchar en voz alta'}
              aria-label={isSpeaking ? 'Detener narración de voz' : 'Escuchar narración de voz'}
            >
              <Volume2 size={16} />
              <span>{isSpeaking ? 'Pausar' : 'Escuchar'}</span>
            </button>
            <button
              type="button"
              className="tour-close-btn"
              onClick={handleClose}
              aria-label="Cerrar guía y empezar a explorar"
              title="Cerrar guía"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* CONTENIDO PRINCIPAL */}
        <div className="tour-body">
          <div
            className="tour-icon-bubble"
            style={{ color: step.color, background: step.bgLight, borderColor: step.accentBorder }}
          >
            <Icon size={34} strokeWidth={2.2} />
          </div>

          <h2 id="tour-modal-title" className="tour-title">
            {step.title}
          </h2>

          <p className="tour-summary">{step.summary}</p>

          {/* CONTENIDO ESPECIAL PARA EL PASO 2: GUÍA DE COLORES */}
          {currentStep === 1 ? (
            <div className="tour-color-grid" aria-label="Significado de los colores">
              {COLOR_GUIDE.map((c) => (
                <div key={c.name} className="tour-color-item" style={{ background: c.bg }}>
                  <span className="tour-color-swatch" style={{ background: c.color }} />
                  <div className="tour-color-info">
                    <strong style={{ color: c.color }}>{c.name}</strong>
                    <small>{c.example}</small>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="tour-detail-box" style={{ background: step.bgLight, borderColor: step.accentBorder }}>
              <p>{step.detail}</p>
            </div>
          )}

          {/* PASO 3: DEMOSTRACIÓN DE VISTO BUENO */}
          {currentStep === 2 && (
            <div className="tour-trust-demo">
              <div className="trust-pill-preview">
                <ShieldCheck size={16} color="#059669" />
                <span>
                  <strong>Visto Bueno Vecinal:</strong> Avalado por Carmen Ríos (Centro Cívico)
                </span>
              </div>
            </div>
          )}
        </div>

        {/* PIE CON PUNTOS DE PROGRESO Y BOTONES */}
        <div className="tour-footer">
          <div className="tour-dots" aria-label="Progreso del tour">
            {TOUR_STEPS.map((_, idx) => (
              <button
                key={idx}
                type="button"
                className={`tour-dot ${idx === currentStep ? 'is-active' : ''}`}
                onClick={() => {
                  window.speechSynthesis?.cancel()
                  setIsSpeaking(false)
                  setCurrentStep(idx)
                }}
                aria-label={`Ir al paso ${idx + 1}`}
                style={idx === currentStep ? { background: step.color } : {}}
              />
            ))}
          </div>

          <div className="tour-nav-buttons">
            {currentStep > 0 && (
              <button
                type="button"
                className="secondary-button tour-btn-prev"
                onClick={handlePrev}
              >
                <ArrowLeft size={16} />
                <span>Anterior</span>
              </button>
            )}

            <button
              type="button"
              className="primary-button tour-btn-next"
              onClick={handleNext}
              style={{ background: step.color }}
            >
              <span>{currentStep === TOUR_STEPS.length - 1 ? '¡Listo, explorar mi barrio!' : 'Siguiente'}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

