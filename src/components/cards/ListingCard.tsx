'use client'

import Image from 'next/image'
import { Bookmark, MapPin, ShieldCheck, Star } from 'lucide-react'
import { formatPriceLabel, resolveListingMedia } from '@/lib/listing-art'
import type { ListingView } from '@/app/(frontend)/NeighborhoodApp'

const labels: Record<string, string> = {
  product: 'Producto',
  service: 'Servicio',
  skill: 'Habilidad',
  barter: 'Trueque',
  gift: 'Regalo',
  loan: 'Préstamo',
  need: 'Necesidad',
  help: 'Ayuda',
}

export function ListingCard({
  item,
  saved,
  onSave,
  onOpen,
}: {
  item: ListingView
  saved: boolean
  onSave: () => void
  onOpen: () => void
}) {
  const formattedPrice = formatPriceLabel(item.priceLabel, item.kind)

  return (
    <article className={`listing-card listing-card--${item.kind}`}>
      <button className="listing-card__media" onClick={onOpen} aria-label={`Abrir ${item.title}`}>
        <Image
          src={resolveListingMedia(item.title, item.kind, item.image)}
          alt={item.title}
          fill
          sizes="(max-width: 640px) 78vw, 300px"
        />
        <span className={`kind-tag kind-tag--${item.kind}`}>{labels[item.kind] || item.kind}</span>
        {item.isDemo && <span className="demo-tag">Publicación de ejemplo</span>}
      </button>
      <div className="listing-card__body">
        <div className="listing-card__meta">
          <span>
            <MapPin size={14} /> {item.distanceKm?.toFixed(1) ?? '0.5'} km
          </span>
          {item.availability === 'now' ? (
            <b>⚡ Disponible ahora</b>
          ) : item.approvalAuthor ? (
            <b className="meta-verified">
              <ShieldCheck size={13} /> Visto Bueno
            </b>
          ) : null}
        </div>
        <button className="card-title" onClick={onOpen}>
          {item.title}
        </button>
        {item.description && (
          <p className="card-description" onClick={onOpen}>
            {item.description}
          </p>
        )}
        <div className="provider-line">
          <span className={`mini-avatar mini-avatar--${item.kind}`}>{item.initials || 'NB'}</span>
          <span>{item.providerName || 'Vecino de la zona'}</span>
          {item.rating && (
            <b>
              <Star size={13} fill="currentColor" /> {item.rating.toFixed(1)}
            </b>
          )}
        </div>
        <div className="card-footer">
          <strong className={`price-badge price-badge--${item.kind}`}>{formattedPrice}</strong>
          <button
            className={saved ? 'is-saved' : ''}
            onClick={onSave}
            aria-label={saved ? 'Quitar de favoritos' : 'Guardar favorito'}
          >
            <Bookmark size={19} fill={saved ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>
    </article>
  )
}
