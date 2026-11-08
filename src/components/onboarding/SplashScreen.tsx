'use client'

import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ArrowUpRight } from 'lucide-react'
import { veciLogo } from './veci-logo-paths'
import styles from './SplashScreen.module.css'

gsap.registerPlugin(useGSAP)

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const root = useRef<HTMLElement>(null)

  useGSAP(() => {
    const screen = root.current
    if (!screen) return
    const media = gsap.matchMedia()
    media.add({ motion: '(prefers-reduced-motion: no-preference)', reduced: '(prefers-reduced-motion: reduce)' }, (context) => {
      const select = gsap.utils.selector(screen)
      gsap.set(select('[data-composition], [data-caption]'), { visibility: 'visible' })
      if (context.conditions?.reduced) {
        gsap.to(screen, { opacity: 0, delay: 0.35, duration: 0.15, onComplete })
        return
      }

      const roof = screen.querySelector<SVGPathElement>('[data-roof]')!
      const roofLength = roof.getTotalLength()
      const timeline = gsap.timeline({ defaults: { ease: 'power3.out' }, onComplete })
      timeline
        .fromTo(select('[data-atmosphere]'), { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 1.8 }, 0)
        .fromTo(select('[data-ring]'), { scale: 0.7, opacity: 0 }, { scale: 1.2, opacity: 0.65, duration: 2.5, stagger: 0.12 }, 0.1)
        .fromTo(select('[data-emblem-body]'), { opacity: 0, y: 90, scale: 0.76, rotation: -7, transformOrigin: '50% 70%' }, { opacity: 1, y: 0, scale: 1, rotation: 0, duration: 1.05, ease: 'expo.out' }, 0.12)
        .fromTo(roof, { fillOpacity: 0, strokeDasharray: roofLength, strokeDashoffset: roofLength }, { strokeDashoffset: 0, duration: 0.75, ease: 'power2.inOut' }, 0.25)
        .to(roof, { fillOpacity: 1, strokeOpacity: 0, duration: 0.35 }, 0.8)
        .fromTo(select('[data-window]'), { opacity: 0, scale: 0, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, duration: 0.45, stagger: 0.07, ease: 'back.out(1.9)' }, 0.7)
        .fromTo(select('[data-ray]'), { opacity: 0, y: 18, scale: 0.4, transformOrigin: '50% 100%' }, { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.09, ease: 'back.out(2)' }, 0.85)
        .fromTo(select('[data-letter]'), { opacity: 0, y: 90, rotation: 6, transformOrigin: '50% 100%' }, { opacity: 1, y: 0, rotation: 0, duration: 0.65, stagger: 0.085, ease: 'back.out(1.5)' }, 0.95)
        .fromTo(select('[data-word]'), { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.6, stagger: 0.08 }, 1.3)
        .fromTo(select('[data-caption]'), { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.6 }, 1.65)
        .fromTo(select('[data-progress]'), { scaleX: 0 }, { scaleX: 1, duration: 2.5, ease: 'power1.inOut', transformOrigin: 'left center' }, 0.15)
        .to(select('[data-composition]'), { y: -10, scale: 1.025, duration: 0.55, ease: 'power2.inOut' }, 2.65)
        .to(screen, { opacity: 0, duration: 0.4, ease: 'power2.inOut' }, 2.95)

      const parallax = screen.querySelector('[data-parallax]')
      const moveX = gsap.quickTo(parallax, 'x', { duration: 0.7, ease: 'power2.out' })
      const moveY = gsap.quickTo(parallax, 'y', { duration: 0.7, ease: 'power2.out' })
      const move = (event: PointerEvent) => {
        if (event.pointerType !== 'mouse') return
        moveX((event.clientX / window.innerWidth - 0.5) * 18)
        moveY((event.clientY / window.innerHeight - 0.5) * 14)
      }
      const reset = () => { moveX(0); moveY(0) }
      screen.addEventListener('pointermove', move)
      screen.addEventListener('pointerleave', reset)
      return () => {
        timeline.kill()
        screen.removeEventListener('pointermove', move)
        screen.removeEventListener('pointerleave', reset)
      }
    })
    return () => media.revert()
  }, { scope: root, dependencies: [onComplete], revertOnUpdate: true })

  return (
    <main ref={root} className={`${styles.screen} relative isolate grid min-h-svh place-items-center overflow-hidden px-6 text-white`} aria-label="Bienvenido a VECI">
      <div className={styles.atmosphere} data-atmosphere aria-hidden="true" />
      <div className={styles.grid} aria-hidden="true" />
      <div className={styles.rings} aria-hidden="true"><span data-ring /><span data-ring /></div>
      <div className="absolute inset-x-0 top-[max(28px,env(safe-area-inset-top))] flex items-center justify-between gap-5 px-7 sm:px-12">
        <span className="text-[9px] font-medium tracking-[0.24em] text-emerald-100/65 sm:text-[10px]">HECHO DE BUENAS CONEXIONES</span>
        <button type="button" onClick={onComplete} className={`${styles.skip} flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 text-xs text-emerald-50/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-200`}>
          Entrar <ArrowUpRight size={14} aria-hidden="true" />
        </button>
      </div>
      <div data-parallax>
        <div data-composition className="relative z-10 flex flex-col items-center pb-2 text-center">
          <h1 className="sr-only">VECI. Tu barrio, tu gente.</h1>
          <svg className={styles.emblem} viewBox="235 100 780 835" fill="none" aria-hidden="true">
            <path data-emblem-body d={veciLogo.body} fill="white" />
            <path data-roof d={veciLogo.roof} fill="white" stroke="white" strokeWidth="2" />
            <g fill="#80ffb8">
              {veciLogo.windows.map((path, index) => <path key={index} data-window d={path} />)}
              {veciLogo.rays.map((path, index) => <path key={index} data-ray d={path} />)}
            </g>
          </svg>
          <svg className={styles.wordmark} viewBox="300 940 660 210" fill="white" aria-hidden="true">
            {veciLogo.letters.map((path, index) => <path key={index} data-letter d={path} />)}
          </svg>
          <p aria-hidden="true" className="mt-7 flex flex-wrap justify-center gap-x-2 overflow-hidden text-[clamp(16px,2.8vw,21px)] font-normal tracking-[-0.025em] text-emerald-50/85 sm:mt-8">
            <span data-word className="inline-block">Tu barrio.</span>
            <span data-word className="inline-block text-[#80ffb8]">Tu gente.</span>
          </p>
        </div>
      </div>
      <div data-caption className={`${styles.footer} absolute inset-x-6 flex flex-col items-center gap-5 text-center`}>
        <div className="h-px w-24 overflow-hidden bg-white/10" aria-hidden="true"><div data-progress className="h-full w-full bg-[#80ffb8]" /></div>
        <p className="text-[9px] font-medium uppercase tracking-[0.28em] text-emerald-100/65">Lo cercano nos conecta</p>
      </div>
    </main>
  )
}
