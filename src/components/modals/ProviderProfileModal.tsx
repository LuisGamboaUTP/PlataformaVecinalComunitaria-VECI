'use client'

import { Star, ShieldCheck, X } from 'lucide-react'
import type { ListingView } from '@/app/(frontend)/NeighborhoodApp'

export function ProviderProfileModal({
  item,
  onClose,
}: {
  item: ListingView
  onClose: () => void
}) {
  return (
    <div className="provider-profile-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="provider-profile-panel"
        role="dialog"
        aria-modal="true"
        aria-label={`Perfil de ${item.providerName || 'vecino'}`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose} aria-label="Cerrar perfil">
          <X size={20} />
        </button>
        <span className="provider-avatar provider-avatar--large">{item.initials || 'NB'}</span>
        <h1>{item.providerName || 'Vecino de la zona'}</h1>
        <p>{item.zoneName}</p>
        <div className="provider-profile-stats">
          <span>
            <Star size={19} />
            <strong>{item.rating?.toFixed(1) || 'Sin calificación'}</strong>
            <small>Calificación de oficios · {item.reviewCount || 0} reseñas</small>
          </span>
          <span>
            <ShieldCheck size={19} />
            <strong>{item.completedCount || 0}</strong>
            <small>Trabajos completados</small>
          </span>
        </div>
        <h2>Trabajo reciente en el barrio</h2>
        <article>
          <strong>{item.title}</strong>
          <p>{item.description}</p>
        </article>
        <h2>Medallas solidarias</h2>
        <p>
          Las ayudas solidarias se muestran por separado de la calificación de oficios cuando están
          confirmadas.
        </p>
      </section>
    </div>
  )
}
