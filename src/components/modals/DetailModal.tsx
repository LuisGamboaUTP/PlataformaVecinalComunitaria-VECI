'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  Check,
  Heart,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Star,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { formatPriceLabel, resolveListingMedia } from '@/lib/listing-art'
import { ProviderProfileModal } from '@/components/modals/ProviderProfileModal'
import { api } from '@/lib/api-client'
import type { ListingView, InteractionView } from '@/app/(frontend)/NeighborhoodApp'

const kindLabel: Record<string, string> = {
  product: 'Producto',
  service: 'Servicio',
  skill: 'Habilidad',
  barter: 'Trueque',
  gift: 'Regalo',
  loan: 'Préstamo',
  need: 'Necesidad',
  help: 'Ayuda',
}

export function DetailModal({
  item,
  saved,
  onSave,
  onCreated,
  userId,
}: {
  item: ListingView
  saved: boolean
  onSave: () => void
  onCreated: (interaction: InteractionView) => void
  userId?: string
}) {
  const [requestState, setRequestState] = useState<'idle' | 'sending' | 'confirmed' | 'error'>('idle')
  const [requestMessage, setRequestMessage] = useState('')
  const [loanDays, setLoanDays] = useState(1)
  const [providerOpen, setProviderOpen] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [details, setDetails] = useState(
    item.kind === 'barter'
      ? 'Quiero proponer un intercambio y coordinar las condiciones.'
      : 'Me interesa esta publicación y quisiera coordinar los detalles.',
  )

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  const toggleSpeech = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return

    if (isSpeaking) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
      return
    }

    window.speechSynthesis.cancel()
    const textToRead = [
      item.title,
      item.description,
      item.priceLabel ? `Costo: ${item.priceLabel}` : 'Disponible sin costo.',
      item.approvalNote ? `Recomendación vecinal: ${item.approvalNote}` : '',
      `Ubicación aproximada: ${item.locationLabel}`,
    ]
      .filter(Boolean)
      .join('. ')

    const utterance = new SpeechSynthesisUtterance(textToRead)
    utterance.lang = 'es-PE'
    utterance.rate = 0.95

    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    setIsSpeaking(true)
    window.speechSynthesis.speak(utterance)
  }

  const createInteraction = async () => {
    setRequestState('sending')
    setRequestMessage('')
    const type =
      item.kind === 'barter'
        ? 'barter'
        : item.kind === 'loan'
          ? 'loan'
          : item.kind === 'gift'
            ? 'gift'
            : item.kind === 'help' || item.kind === 'need'
              ? 'help'
              : 'service'

    if (!userId) {
      setRequestState('error')
      setRequestMessage('Inicia sesión para continuar.')
      return
    }

    try {
      const summaryText =
        item.kind === 'loan'
          ? `${details} Plazo solicitado: ${loanDays} día${loanDays === 1 ? '' : 's'}.`
          : details

      const remote = await api.createInteraction({
        listingId: item.id,
        listingTitle: item.title,
        type,
        summary: summaryText,
        dueDays: item.kind === 'loan' ? loanDays : undefined,
      })

      const interaction: InteractionView = remote || {
        id: crypto.randomUUID(),
        listingTitle: item.title,
        type,
        summary: summaryText,
        updatedAt: new Date().toISOString(),
        status: type === 'barter' ? 'proposed' : 'requested',
        syncState: 'local',
        role: 'requester',
        ...(type === 'loan'
          ? { returnFlow: { dueAt: new Date(Date.now() + loanDays * 86400000).toISOString() } }
          : {}),
      }

      onCreated(interaction)
      setRequestState('confirmed')
      setRequestMessage('Solicitud guardada y sincronizada. Ya aparece en Actividad.')
    } catch {
      setRequestState('error')
      setRequestMessage('No se pudo enviar la solicitud.')
    }
  }

  return (
    <div className="detail-view">
      <div className="detail-media">
        <Image
          src={resolveListingMedia(item.title, item.kind, item.image)}
          alt={`Imagen de ${item.title}`}
          fill
          sizes="720px"
        />
        {item.isDemo && <span className="demo-tag">Publicación de ejemplo</span>}
      </div>

      <div className="detail-content">
        <div className="detail-topline">
          <span className={`kind-tag kind-tag--${item.kind}`}>{kindLabel[item.kind]}</span>
          <button onClick={onSave} className={saved ? 'is-saved' : ''}>
            <Heart size={20} fill={saved ? 'currentColor' : 'none'} />{' '}
            {saved ? 'Guardado' : 'Guardar'}
          </button>
        </div>

        <h1>{item.title}</h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '6px 0 12px' }}>
          <button
            type="button"
            className="secondary-button"
            onClick={toggleSpeech}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              minHeight: '40px',
              padding: '6px 14px',
              borderRadius: '999px',
              fontWeight: 650,
              fontSize: '13px',
              borderColor: isSpeaking ? '#b91c1c' : undefined,
              color: isSpeaking ? '#b91c1c' : undefined,
            }}
            aria-label={isSpeaking ? 'Detener lectura en voz alta' : 'Escuchar descripción de la publicación'}
          >
            {isSpeaking ? (
              <>
                <VolumeX size={17} /> Detener lectura
              </>
            ) : (
              <>
                <Volume2 size={17} /> Escuchar ficha (Voz)
              </>
            )}
          </button>
        </div>

        <p className="detail-lead">{item.description}</p>

        <div className="detail-stats">
          <span>
            <strong>{formatPriceLabel(item.priceLabel, item.kind)}</strong>
            <small>Costo orientativo</small>
          </span>
          <span>
            <strong>{item.distanceKm?.toFixed(1)} km</strong>
            <small>Distancia aprox.</small>
          </span>
          <span>
            <strong>{item.availability === 'now' ? 'Ahora' : 'Coordinar'}</strong>
            <small>Disponibilidad</small>
          </span>
        </div>

        <div className="provider-card">
          <span className="provider-avatar">{item.initials || 'NB'}</span>
          <div>
            <small>Ofrece</small>
            <strong>{item.providerName || 'Vecino de la zona'}</strong>
            <span>
              <Star size={14} fill="currentColor" /> {item.rating?.toFixed(1) || 'Sin reseñas'} ·{' '}
              {item.reviewCount || 0} reseñas
            </span>
          </div>
          <button onClick={() => setProviderOpen(true)}>Ver perfil</button>
        </div>

        {item.approvalAuthor && (
          <div className="approval-card">
            <ShieldCheck size={23} />
            <div>
              <strong>Visto Bueno Vecinal</strong>
              <p>“{item.approvalNote}”</p>
              <small>
                {item.approvalAuthor} · {item.approvalZone} (zona declarada)
              </small>
            </div>
          </div>
        )}

        <div className="privacy-row">
          <MapPin size={18} />
          <span>
            <strong>{item.locationLabel}</strong>
            <small>La dirección exacta nunca es pública; se acuerda por chat.</small>
          </span>
        </div>

        {item.kind === 'loan' && (
          <label className="loan-term">
            Plazo del préstamo
            <select value={loanDays} onChange={(event) => setLoanDays(Number(event.target.value))}>
              <option value={1}>1 día</option>
              <option value={2}>2 días</option>
              <option value={3}>3 días</option>
            </select>
            <small>Ambas personas confirmarán la devolución en Actividad.</small>
          </label>
        )}

        {requestState === 'confirmed' ? (
          <div className="request-confirmed">
            <Check size={20} />
            <span>
              <strong>Solicitud guardada</strong>
              <small>{requestMessage}</small>
            </span>
          </div>
        ) : (
          <div className="request-box">
            <label>
              Mensaje para coordinar
              <textarea
                value={details}
                onChange={(event) => setDetails(event.target.value)}
                rows={3}
              />
            </label>
            {requestMessage && (
              <p className="form-feedback" role="alert">
                {requestMessage}{' '}
                {requestMessage.includes('sesión') && <Link href="/login">Ingresar</Link>}
              </p>
            )}
            <button
              className="primary-button primary-button--wide"
              onClick={createInteraction}
              disabled={requestState === 'sending' || details.trim().length < 8}
            >
              {requestState === 'sending'
                ? 'Confirmando…'
                : item.kind === 'barter'
                  ? 'Proponer trueque'
                  : item.kind === 'loan'
                    ? 'Solicitar préstamo'
                    : item.kind === 'help'
                      ? 'Ofrecer ayuda'
                      : 'Solicitar ahora'}{' '}
              <MessageCircle size={18} />
            </button>
          </div>
        )}
      </div>

      {providerOpen && <ProviderProfileModal item={item} onClose={() => setProviderOpen(false)} />}
    </div>
  )
}
