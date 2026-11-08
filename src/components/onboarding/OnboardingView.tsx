'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { HandHeart, MapPin, Search, Sparkles, Volume2 } from 'lucide-react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(useGSAP)

const steps = [
  {
    icon: Search,
    title: 'Descubre cerca de ti',
    text: 'Encuentra oficios y productos a pocas cuadras. Conoce las recomendaciones de vecinos con Visto Bueno Vecinal.',
  },
  {
    icon: Sparkles,
    title: 'Intercambia sin dinero',
    text: 'Propón trueques, comparte herramientas en la Biblioteca de Herramientas y ofrece tu tiempo en el Banco de Tiempo.',
  },
  {
    icon: HandHeart,
    title: 'Ayuda y prepárate',
    text: 'Coordina ayuda comunitaria y ten a mano los números de emergencia: Bomberos 116, Policía 105 y SAMU 106.',
  },
]

export function OnboardingView({
  onComplete,
}: {
  onComplete?: (destination?: string) => void
} = {}) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [zone, setZone] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem('nexobarrio-zone') || 'Centro Cívico'
      } catch {
        return 'Centro Cívico'
      }
    }
    return 'Centro Cívico'
  })
  const root = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      gsap.from('.onboarding__visual, .onboarding__copy > *', {
        opacity: 0,
        y: 16,
        duration: 0.38,
        stagger: 0.05,
        ease: 'power2.out',
      })
    },
    { scope: root, dependencies: [step] },
  )

  const finish = (destination: string) => {
    try {
      localStorage.setItem('nexobarrio-onboarded', '1')
      localStorage.setItem('nexobarrio-zone', zone)
    } catch {
      /* ignore */
    }
    window.speechSynthesis?.cancel()
    if (onComplete) {
      onComplete(destination)
    } else {
      router.push(destination)
    }
  }

  const speak = () => {
    window.speechSynthesis?.cancel()
    const utterance = new SpeechSynthesisUtterance(`${steps[step].title}. ${steps[step].text}`)
    utterance.lang = 'es-PE'
    window.speechSynthesis?.speak(utterance)
  }

  const Icon = steps[step].icon
  return (
    <main ref={root} className="onboarding">
      <div className="onboarding__visual" aria-hidden="true">
        <div className="street-grid" />
        <div className="onboard-node onboard-node--one">
          <Search size={22} />
        </div>
        <div className="onboard-node onboard-node--two">
          <Sparkles size={22} />
        </div>
        <div className="onboard-node onboard-node--three">
          <HandHeart size={22} />
        </div>
        <div className="onboard-person">
          <Icon size={28} />
        </div>
      </div>
      <section className="onboarding__copy">
        <div className="brand-lockup">
          <span className="brand-mark">N</span>
          <span>NexoBarrio</span>
        </div>
        <span className="eyebrow">Paso {step + 1} de 3</span>
        <h1>{steps[step].title}</h1>
        <p>{steps[step].text}</p>
        <div className="onboard-steps" aria-label="Progreso">
          {steps.map((item, index) => (
            <button
              key={item.title}
              className={index === step ? 'is-active' : ''}
              onClick={() => setStep(index)}
              aria-label={`Ir al paso ${index + 1}`}
              aria-current={index === step ? 'step' : undefined}
            >
              {index + 1}
            </button>
          ))}
        </div>
        <button className="secondary-button" type="button" onClick={speak}>
          <Volume2 size={18} /> Escuchar
        </button>
        <label className="zone-choice">
          <MapPin size={20} />
          <span>
            <small>Tu barrio</small>
            <strong>{zone}</strong>
          </span>
          <select
            aria-label="Elegir barrio"
            value={zone}
            onChange={(event) => setZone(event.target.value)}
          >
            {['Centro Cívico', 'Santa Beatriz', 'Jesús María', 'Lince', 'Breña'].map((name) => (
              <option key={name}>{name}</option>
            ))}
          </select>
        </label>
        {step < 2 ? (
          <button className="primary-button primary-button--wide" onClick={() => setStep(step + 1)}>
            Continuar
          </button>
        ) : (
          <div className="onboard-exits">
            <button
              className="primary-button primary-button--wide"
              onClick={() => finish('/login')}
            >
              Iniciar sesión
            </button>
            <button
              className="secondary-button primary-button--wide"
              onClick={() => finish('/registro')}
            >
              Crear cuenta vecinal
            </button>
            <button className="text-button" onClick={() => finish('/')}>
              Explorar el mapa ahora
            </button>
          </div>
        )}
      </section>
    </main>
  )
}
