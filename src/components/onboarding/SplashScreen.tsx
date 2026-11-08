'use client'

import { useRef } from 'react'
import Image from 'next/image'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(useGSAP)

export function SplashScreen() {
  const root = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

      gsap.from('.brand-logo-img--splash', {
        opacity: 0,
        scale: 0.72,
        rotation: -8,
        duration: 0.65,
        ease: 'back.out(1.7)',
      })
      gsap.from('.splash-screen h1, .splash-screen p', {
        opacity: 0,
        y: 16,
        duration: 0.5,
        stagger: 0.12,
        delay: 0.25,
        ease: 'power2.out',
      })
      gsap.to('.splash-orbit', { rotation: 360, duration: 12, ease: 'none', repeat: -1 })
    },
    { scope: root },
  )

  return (
    <main ref={root} className="splash-screen" aria-label="Cargando VECI">
      <div className="splash-orbit" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <Image
        src="/images/veci-logo.jpg"
        alt="VECI"
        width={84}
        height={84}
        className="brand-logo-img--splash"
        priority
      />
      <h1>VECI</h1>
      <p>Tu barrio, más cerca.</p>
    </main>
  )
}
