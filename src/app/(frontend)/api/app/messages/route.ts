import config from '@payload-config'
import { getPayload } from 'payload'

import { appAuth } from '@/lib/app-auth'
import { createInternalNotification } from '@/lib/create-notification'

const relationId = (value: unknown): string | null => {
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (value && typeof value === 'object' && 'id' in value) return String(value.id)
  return null
}

const toMessage = (doc: any, userId: string) => ({
  id: String(doc.id),
  body: String(doc.body ?? ''),
  sentByMe: relationId(doc.sender) === userId,
  deliveryState: String(doc.deliveryState ?? 'sent'),
  createdAt: doc.createdAt,
})

export async function GET(request: Request) {
  const user = await appAuth.currentUser()
  if (!user) return Response.json({ messages: [] }, { status: 401 })
  const interactionId = new URL(request.url).searchParams.get('interactionId')?.slice(0, 100)
  if (!interactionId) {
    return Response.json(
      { error: { message: 'Falta el contexto de la conversación.' } },
      { status: 422 },
    )
  }

  const payload = await getPayload({ config })
  const result = await payload.find({
    collection: 'messages' as never,
    where: { interaction: { equals: interactionId } },
    sort: 'createdAt',
    limit: 100,
    user,
    overrideAccess: false,
  })
  return Response.json({
    messages: result.docs.map((doc) => toMessage(doc, String(user.id))),
  })
}

export async function POST(request: Request) {
  const user = await appAuth.currentUser()
  if (!user) {
    return Response.json(
      { error: { code: 'AUTH_REQUIRED', message: 'Inicia sesión para enviar mensajes.' } },
      { status: 401 },
    )
  }
  let input: Record<string, unknown>
  try {
    input = await request.json()
  } catch {
    return Response.json({ error: { message: 'No pudimos leer el mensaje.' } }, { status: 400 })
  }
  const interactionId =
    typeof input.interactionId === 'string' ? input.interactionId.slice(0, 100) : ''
  const body = typeof input.body === 'string' ? input.body.trim().slice(0, 1500) : ''
  if (!interactionId || !body) {
    return Response.json({ error: { message: 'Escribe un mensaje.' } }, { status: 422 })
  }

  const payload = await getPayload({ config })
  let interaction: any
  try {
    interaction = await payload.findByID({
      collection: 'interactions' as never,
      id: interactionId,
      depth: 0,
      user,
      overrideAccess: false,
    })
  } catch {
    return Response.json(
      { error: { message: 'No tienes acceso a esta conversación.' } },
      { status: 403 },
    )
  }
  const participants = [relationId(interaction.owner), relationId(interaction.counterparty)].filter(
    (id): id is string => Boolean(id),
  )
  if (participants.length !== 2 || !participants.includes(String(user.id))) {
    return Response.json(
      { error: { message: 'La conversación requiere dos participantes confirmados.' } },
      { status: 409 },
    )
  }

  const doc = await payload.create({
    collection: 'messages' as never,
    data: { interaction: interactionId, body } as never,
    context: { participantIds: participants },
    user,
    overrideAccess: false,
  })
  const recipientId = participants.find((id) => id !== String(user.id)) || null
  await createInternalNotification({
    payload,
    user,
    ownerId: recipientId,
    title: 'Nuevo mensaje',
    body: body.length > 90 ? `${body.slice(0, 87)}…` : body,
    kind: 'message',
    contextPath: `/activity/${interactionId}`,
  })
  return Response.json({ message: toMessage(doc, String(user.id)) }, { status: 201 })
}
