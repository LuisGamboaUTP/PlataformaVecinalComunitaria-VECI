'use client'

import { useEffect, useState } from 'react'
import { ArrowRightLeft, Check } from 'lucide-react'

export function TriangularBarterPanel() {
  const [confirmed, setConfirmed] = useState(false)
  useEffect(() => {
    setConfirmed(localStorage.getItem('nexobarrio-triangular-confirmed') === '1')
  }, [])
  const confirm = () => {
    localStorage.setItem('nexobarrio-triangular-confirmed', '1')
    setConfirmed(true)
  }
  return (
    <section className="barter-panel" aria-label="Trueque entre tres vecinos">
      <div>
        <span className="eyebrow">Intercambios sin dinero</span>
        <h2>Trueque Inteligente entre 3 vecinos</h2>
        <p>Una cadena entre vecinos de Centro Cívico.</p>
      </div>
      <div className="barter-chain">
        <span>
          <strong>Alejandro</strong>
          <small>Bicicleta Aro 26 → Taladro Bosch</small>
        </span>
        <ArrowRightLeft size={20} />
        <span>
          <strong>María Elena</strong>
          <small>Taladro Bosch → 3 sesiones de Inglés</small>
        </span>
        <ArrowRightLeft size={20} />
        <span>
          <strong>Sofía</strong>
          <small>3 sesiones de Inglés → Bicicleta Aro 26</small>
        </span>
      </div>
      <button
        className={confirmed ? 'secondary-button' : 'primary-button'}
        onClick={confirm}
        disabled={confirmed}
      >
        {confirmed ? (
          <>
            <Check size={18} /> 3 de 3 confirmados · Listo para coordinar
          </>
        ) : (
          'Confirmar mi participación (3/3)'
        )}
      </button>
      <small>Confirmación local de este recorrido; coordina los detalles por chat.</small>
    </section>
  )
}
