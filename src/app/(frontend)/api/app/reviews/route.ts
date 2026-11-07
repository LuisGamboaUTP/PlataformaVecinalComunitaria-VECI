import config from '@payload-config'
import { getPayload } from 'payload'

import { appAuth } from '@/lib/app-auth'

const relationId = (value: unknown): string | null => {
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (value && typeof value === 'object' && 'id' in value) return String(value.id)
  return null
}

export async function POST(request: Request) {
  const user = await appAuth.currentUser()
  if (!user) {
    return Response.json(
      { error: { code: 'AUTH_REQUIRED', message: 'Inicia sesión para evaluar.' } },
      { status: 401 },
    )
  }
  let input: Record<string, unknown>
  try {
    input = await request.json()
  } catch {
    return Response.json({ error: { message: 'No pudimos leer la reseña.' } }, { status: 400 })
  }
  const interactionId =
    typeof input.interactionId === 'string' ? input.interactionId.slice(0, 100) : ''
  const stars = typeof input.stars === 'number' ? Math.round(input.stars) : 0
  const comment = typeof input.comment === 'string' ? input.comment.trim().slice(0, 600) : ''
  if (!interactionId || stars < 1 || stars > 5 || comment.length < 5) {
    return Response.json(
      { error: { message: 'Elige de 1 a 5 estrellas y escribe un comentario breve.' } },
      { status: 422 },
    )
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
      { error: { message: 'No tienes acceso a esta interacción.' } },
      { status: 403 },
    )
  }
  if (interaction.status !== 'completed') {
    return Response.json(
      {
        error: {
          code: 'NOT_COMPLETED',
          message: 'La reseña se habilita después de la confirmación bilateral.',
        },
      },
      { status: 409 },
    )
  }

  const userId = String(user.id)
  const ownerId = relationId(interaction.owner)
  const counterpartyId = relationId(interaction.counterparty)
  const subjectId = ownerId === userId ? counterpartyId : ownerId
  if (!subjectId || ![ownerId, counterpartyId].includes(userId) || subjectId === userId) {
    return Response.json({ error: { message: 'No existe otra parte evaluable.' } }, { status: 409 })
  }

  try {
    const doc: any = await payload.create({
      collection: 'reviews' as never,
      data: { interaction: interactionId, stars, comment } as never,
      context: { reviewSubjectId: subjectId },
      user,
      overrideAccess: false,
    })
    return Response.json(
      {
        review: {
          id: String(doc.id),
          stars: doc.stars,
          comment: doc.comment,
          createdAt: doc.createdAt,
        },
      },
      { status: 201 },
    )
  } catch {
    return Response.json(
      {
        error: {
          code: 'DUPLICATE_OR_INVALID',
          message: 'Ya existe una reseña tuya para esta interacción.',
        },
      },
      { status: 409 },
    )
  }
}
