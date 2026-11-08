'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  Activity,
  Clock3,
  HandHeart,
  PackageOpen,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  Wrench,
} from 'lucide-react'
import { readLocal, writeLocal } from '@/lib/local-store'
import { api } from '@/lib/api-client'
import type { InteractionView } from '@/app/(frontend)/NeighborhoodApp'

export function ActivityTab({
  interactions,
  signedIn,
  onUpdated,
}: {
  interactions: InteractionView[]
  signedIn: boolean
  onUpdated: (interaction: InteractionView) => void
}) {
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState('')
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [activeReviewId, setActiveReviewId] = useState<string | null>(null)
  const [activityFilter, setActivityFilter] = useState<
    'all' | 'service' | 'barter' | 'help' | 'messages'
  >('all')
  const visibleInteractions = interactions.filter(
    (item) =>
      activityFilter === 'all' || activityFilter === 'messages' || item.type === activityFilter,
  )
  const statusLabel: Record<string, string> = {
    requested: 'Solicitada',
    proposed: 'Propuesta',
    negotiating: 'Negociando',
    accepted: 'Aceptada',
    coordinating: 'Coordinando',
    'in-progress': 'En curso',
    'return-pending': 'Pendiente de devolución',
    completed: 'Completada',
    rejected: 'Rechazada',
    cancelled: 'Cancelada',
  }

  const updateInteraction = async (id: string, action: string) => {
    setPendingId(id)
    setActionMessage('')
    const current = interactions.find((item) => item.id === id)
    if (!current) return
    const statuses: Record<string, string> = {
      accept: 'accepted',
      reject: 'rejected',
      cancel: 'cancelled',
      start: 'in-progress',
      'mark-delivered': 'return-pending',
      'confirm-complete': 'completed',
      'close-return': 'completed',
      'confirm-return': 'return-pending',
    }

    try {
      const remote = await api.updateInteraction(id, action)
      if (remote) {
        onUpdated(remote)
      } else {
        onUpdated({
          ...current,
          status: statuses[action] || current.status,
          updatedAt: new Date().toISOString(),
          returnFlow:
            action === 'confirm-return'
              ? { ...current.returnFlow, borrowerConfirmed: true }
              : current.returnFlow,
        })
      }
      setActionMessage('Estado actualizado y sincronizado con tu vecino.')
    } catch {
      onUpdated({
        ...current,
        status: statuses[action] || current.status,
        updatedAt: new Date().toISOString(),
        returnFlow:
          action === 'confirm-return'
            ? { ...current.returnFlow, borrowerConfirmed: true }
            : current.returnFlow,
      })
      setActionMessage('Estado actualizado en este dispositivo.')
    } finally {
      setPendingId(null)
    }
  }

  return (
    <section className="content-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Actividad</span>
          <h1>Todo lo que está en movimiento</h1>
          <p>Solicitudes, intercambios, ayudas y conversaciones en un solo lugar.</p>
        </div>
      </div>
      <div className="activity-tabs">
        {(
          [
            ['all', 'Todo'],
            ['service', 'Servicios'],
            ['barter', 'Trueques'],
            ['help', 'Ayudas'],
            ['messages', 'Mensajes'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            className={activityFilter === id ? 'is-active' : ''}
            onClick={() => setActivityFilter(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="activity-list">
        {!signedIn ? (
          <div className="empty-state">
            <span>
              <Activity size={28} />
            </span>
            <h2>Tu actividad está protegida</h2>
            <p>Ingresa para consultar solicitudes y propuestas confirmadas.</p>
            <Link href="/auth" className="primary-button">
              Ingresar
            </Link>
          </div>
        ) : visibleInteractions.length ? (
          visibleInteractions.map((interaction) => {
            const Icon =
              interaction.type === 'barter'
                ? Sparkles
                : interaction.type === 'help'
                  ? HandHeart
                  : interaction.type === 'loan'
                    ? PackageOpen
                    : Wrench
            return (
              <div className="activity-item" key={interaction.id}>
                <span
                  className={`activity-icon ${
                    interaction.type === 'barter'
                      ? 'activity-icon--orange'
                      : interaction.type === 'help'
                        ? 'activity-icon--green'
                        : 'activity-icon--blue'
                  }`}
                >
                  <Icon size={20} />
                </span>
                <div>
                  <strong>{interaction.summary}</strong>
                  <p>{interaction.listingTitle}</p>
                  <small>
                    <Clock3 size={14} /> Guardado en este dispositivo
                  </small>
                </div>
                <span className="status-pill">
                  {statusLabel[interaction.status] || interaction.status}
                </span>
                <div className="activity-actions">
                  <button
                    onClick={() =>
                      setActiveChatId((current) =>
                        current === interaction.id ? null : interaction.id,
                      )
                    }
                  >
                    Conversar
                  </button>
                  {interaction.role === 'provider' &&
                    ['requested', 'proposed', 'negotiating'].includes(interaction.status) && (
                      <>
                        <button
                          onClick={() => updateInteraction(interaction.id, 'accept')}
                          disabled={pendingId === interaction.id}
                        >
                          Aceptar
                        </button>
                        <button
                          onClick={() => updateInteraction(interaction.id, 'reject')}
                          disabled={pendingId === interaction.id}
                        >
                          Rechazar
                        </button>
                      </>
                    )}
                  {interaction.role === 'provider' && interaction.status === 'accepted' && (
                    <button
                      onClick={() =>
                        updateInteraction(
                          interaction.id,
                          interaction.type === 'loan' ? 'mark-delivered' : 'start',
                        )
                      }
                      disabled={pendingId === interaction.id}
                    >
                      {interaction.type === 'loan' ? 'Marcar entregado' : 'Iniciar'}
                    </button>
                  )}
                  {interaction.role === 'provider' &&
                    interaction.type === 'loan' &&
                    interaction.status === 'in-progress' && (
                      <button
                        onClick={() => updateInteraction(interaction.id, 'mark-delivered')}
                        disabled={pendingId === interaction.id}
                      >
                        Marcar entregado
                      </button>
                    )}
                  {interaction.role === 'requester' &&
                    ['requested', 'proposed', 'negotiating'].includes(interaction.status) && (
                      <button
                        onClick={() => updateInteraction(interaction.id, 'cancel')}
                        disabled={pendingId === interaction.id}
                      >
                        Cancelar
                      </button>
                    )}
                  {interaction.type !== 'loan' &&
                    ['accepted', 'coordinating', 'in-progress'].includes(interaction.status) && (
                      <button
                        onClick={() => updateInteraction(interaction.id, 'confirm-complete')}
                        disabled={pendingId === interaction.id}
                      >
                        Confirmar cierre
                      </button>
                    )}
                  {interaction.type === 'loan' &&
                    interaction.role === 'requester' &&
                    interaction.status === 'return-pending' &&
                    !interaction.returnFlow?.borrowerConfirmed && (
                      <button
                        onClick={() => updateInteraction(interaction.id, 'confirm-return')}
                        disabled={pendingId === interaction.id}
                      >
                        Confirmar que devolví
                      </button>
                    )}
                  {interaction.type === 'loan' &&
                    interaction.role === 'provider' &&
                    interaction.status === 'return-pending' && (
                      <button
                        onClick={() => updateInteraction(interaction.id, 'close-return')}
                        disabled={
                          pendingId === interaction.id || !interaction.returnFlow?.borrowerConfirmed
                        }
                      >
                        Confirmar devolución
                      </button>
                    )}
                  {interaction.status === 'completed' && (
                    <button
                      onClick={() =>
                        setActiveReviewId((current) =>
                          current === interaction.id ? null : interaction.id,
                        )
                      }
                    >
                      Evaluar
                    </button>
                  )}
                </div>
                {interaction.status === 'return-pending' && interaction.returnFlow?.dueAt && (
                  <p className="loan-due">
                    <Clock3 size={14} /> Devolución prevista:{' '}
                    {new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium' }).format(
                      new Date(interaction.returnFlow.dueAt),
                    )}
                    {interaction.returnFlow.borrowerConfirmed &&
                      ' · prestatario confirmó la entrega'}
                  </p>
                )}
                {activeChatId === interaction.id && <ChatPanel interactionId={interaction.id} />}
                {activeReviewId === interaction.id && (
                  <ReviewPanel interactionId={interaction.id} />
                )}
              </div>
            )
          })
        ) : (
          <div className="empty-state">
            <span>
              <Activity size={28} />
            </span>
            <h2>Aún no tienes actividad</h2>
            <p>Solicita un servicio, préstamo, trueque o ayuda desde una ficha.</p>
          </div>
        )}
      </div>
      {actionMessage && (
        <p className="form-feedback activity-feedback" role="status">
          {actionMessage}
        </p>
      )}
      <div className="offline-banner">
        <span>
          <ShieldCheck size={22} />
        </span>
        <div>
          <strong>Estados transparentes</strong>
          <p>Esta versión guarda la actividad localmente en tu navegador.</p>
        </div>
      </div>
    </section>
  )
}

type MessageView = {
  id: string
  body: string
  sentByMe: boolean
  deliveryState: string
  createdAt?: string
}

function ChatPanel({ interactionId }: { interactionId: string }) {
  const [messages, setMessages] = useState<MessageView[]>([])
  const [body, setBody] = useState('')
  const [status, setStatus] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    setMessages(readLocal<MessageView[]>(`nexobarrio-messages-${interactionId}`, []))
  }, [interactionId])

  const sendMessage = async () => {
    const text = body.trim()
    if (!text) return
    setSending(true)
    setStatus('')
    const message: MessageView = { id: crypto.randomUUID(), body: text, sentByMe: true, deliveryState: 'local', createdAt: new Date().toISOString() }
    const next = [...messages, message]
    writeLocal(`nexobarrio-messages-${interactionId}`, next)
    setMessages(next)
    setBody('')
    setStatus('Mensaje guardado en este dispositivo.')
    setSending(false)
  }

  return (
    <div className="chat-panel">
      <div className="chat-messages" aria-live="polite">
        {messages.length ? (
          messages.map((message) => (
            <p key={message.id} className={message.sentByMe ? 'is-mine' : ''}>
              {message.body}
              <small>Local</small>
            </p>
          ))
        ) : (
          <span>Aún no hay mensajes. Mantén la coordinación dentro de la app.</span>
        )}
      </div>
      <div className="chat-compose">
        <input
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Escribe un mensaje"
          aria-label="Mensaje"
        />
        <button onClick={sendMessage} disabled={sending || !body.trim()}>
          <Send size={17} />
          <span>{sending ? 'Enviando' : 'Enviar'}</span>
        </button>
      </div>
      {status && (
        <small className="chat-status" role="status">
          {status}
        </small>
      )}
    </div>
  )
}

function ReviewPanel({ interactionId }: { interactionId: string }) {
  const [stars, setStars] = useState(5)
  const [comment, setComment] = useState('')
  const [status, setStatus] = useState('')
  const [sent, setSent] = useState(false)

  const submitReview = async () => {
    setStatus('')
    writeLocal(`nexobarrio-review-${interactionId}`, { stars, comment, createdAt: new Date().toISOString() })
    setSent(true)
    setStatus('Reseña guardada en este dispositivo.')
  }

  return (
    <div className="review-panel">
      <strong>Evalúa esta interacción confirmada</strong>
      <div className="star-picker" aria-label={`${stars} estrellas`}>
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            onClick={() => setStars(value)}
            aria-label={`${value} estrellas`}
            disabled={sent}
          >
            <Star size={20} fill={value <= stars ? 'currentColor' : 'none'} />
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        placeholder="Cuenta brevemente cómo fue la experiencia"
        rows={3}
        disabled={sent}
      />
      <button
        className="primary-button"
        onClick={submitReview}
        disabled={sent || comment.trim().length < 5}
      >
        Publicar reseña
      </button>
      {status && <small role="status">{status}</small>}
    </div>
  )
}
