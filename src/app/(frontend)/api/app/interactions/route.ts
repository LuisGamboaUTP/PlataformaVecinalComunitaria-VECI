import config from '@payload-config'
import { getPayload } from 'payload'

import { appAuth } from '@/lib/app-auth'
import { createInternalNotification } from '@/lib/create-notification'

const interactionTypes = new Set(['service', 'barter', 'loan', 'gift', 'help'])

const cleanText = (value: unknown, max: number) =>
  typeof value === 'string' ? value.trim().slice(0, max) : ''

function relationId(value: unknown) {
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (value && typeof value === 'object' && 'id' in value) return String(value.id)
  return null
}

function toInteraction(doc: any, userId?: string) {
  const listing = typeof doc.listing === 'object' ? doc.listing : null
  return {
    id: String(doc.id),
    summary: String(doc.summary ?? ''),
    type: String(doc.type ?? ''),
    status: String(doc.status ?? ''),
    syncState: String(doc.syncState ?? 'confirmed'),
    listingTitle: listing?.title || 'Publicación',
    updatedAt: doc.updatedAt,
    role: userId && relationId(doc.counterparty) === userId ? 'provider' : 'requester',
    returnFlow: doc.returnFlow || undefined,
  }
}

export async function GET() {
  const user = await appAuth.currentUser()
  if (!user) return Response.json({ interactions: [] }, { status: 401 })

  const payload = await getPayload({ config })
  const result = await payload.find({
    collection: 'interactions' as never,
    depth: 1,
    limit: 30,
    sort: '-updatedAt',
    user,
    overrideAccess: false,
  })
  return Response.json({
    interactions: result.docs.map((doc) => toInteraction(doc, String(user.id))),
  })
}

export async function POST(request: Request) {
  const user = await appAuth.currentUser()
  if (!user) {
    return Response.json(
      { error: { code: 'AUTH_REQUIRED', message: 'Inicia sesión para continuar.' } },
      { status: 401 },
    )
  }

  let input: Record<string, unknown>
  try {
    input = await request.json()
  } catch {
    return Response.json(
      { error: { code: 'INVALID_JSON', message: 'No pudimos leer la solicitud.' } },
      { status: 400 },
    )
  }

  const listingId = cleanText(input.listingId, 100)
  const type = cleanText(input.type, 30)
  const details = cleanText(input.details, 1000)
  const idempotencyKey = cleanText(input.idempotencyKey, 80)
  if (
    !listingId ||
    !interactionTypes.has(type) ||
    details.length < 8 ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(idempotencyKey)
  ) {
    return Response.json(
      {
        error: {
          code: 'VALIDATION',
          message: 'Describe brevemente lo que necesitas e intenta nuevamente.',
        },
      },
      { status: 422 },
    )
  }

  const payload = await getPayload({ config })
  const existing = await payload.find({
    collection: 'interactions' as never,
    where: {
      and: [{ idempotencyKey: { equals: idempotencyKey } }, { owner: { equals: user.id } }],
    },
    depth: 1,
    limit: 1,
    user,
    overrideAccess: false,
  })
  if (existing.docs[0]) {
    return Response.json({
      interaction: toInteraction(existing.docs[0], String(user.id)),
      replayed: true,
    })
  }

  const listing: any = await payload.findByID({
    collection: 'listings' as never,
    id: listingId,
    depth: 0,
    user,
    overrideAccess: false,
  })
  if (!listing || listing.status !== 'published') {
    return Response.json(
      { error: { code: 'NOT_AVAILABLE', message: 'La publicación ya no está disponible.' } },
      { status: 409 },
    )
  }

  const counterparty =
    typeof listing.owner === 'string' || typeof listing.owner === 'number'
      ? listing.owner
      : listing.owner?.id
  if (!counterparty) {
    return Response.json(
      {
        error: {
          code: 'NO_PROVIDER',
          message: 'Esta publicación no tiene una contraparte disponible.',
        },
      },
      { status: 409 },
    )
  }
  if (String(counterparty) === String(user.id)) {
    return Response.json(
      {
        error: {
          code: 'SELF_INTERACTION',
          message: 'No puedes solicitar tu propia publicación.',
        },
      },
      { status: 409 },
    )
  }

  const expectedType =
    listing.kind === 'barter'
      ? 'barter'
      : listing.kind === 'loan'
        ? 'loan'
        : listing.kind === 'gift'
          ? 'gift'
          : listing.kind === 'help' || listing.kind === 'need'
            ? 'help'
            : 'service'
  const allowsBarter = Array.isArray(listing.modes) && listing.modes.includes('barter')
  if (type !== expectedType && !(type === 'barter' && allowsBarter)) {
    return Response.json(
      {
        error: {
          code: 'TYPE_MISMATCH',
          message: 'La modalidad solicitada no corresponde a esta publicación.',
        },
      },
      { status: 409 },
    )
  }

  try {
    const doc: any = await payload.create({
      collection: 'interactions' as never,
      data: {
        summary: `${type === 'barter' ? 'Propuesta' : 'Solicitud'}: ${listing.title}`,
        type,
        listing: listingId,
        counterparty: counterparty || undefined,
        details,
        idempotencyKey,
        status: type === 'barter' ? 'proposed' : 'requested',
        syncState: 'confirmed',
      } as never,
      user,
      overrideAccess: false,
      depth: 1,
      context: { appWorkflowMutation: true },
    })
    await createInternalNotification({
      payload,
      user,
      ownerId: counterparty || null,
      title: type === 'barter' ? 'Nueva propuesta de trueque' : 'Nueva solicitud',
      body: `${'displayName' in user ? user.displayName : 'Un vecino'} se interesó en ${listing.title}.`,
      kind: type === 'help' ? 'help' : 'request',
      contextPath: `/activity/${String(doc.id)}`,
    })
    return Response.json({ interaction: toInteraction(doc, String(user.id)) }, { status: 201 })
  } catch {
    const replay = await payload.find({
      collection: 'interactions' as never,
      where: {
        and: [{ idempotencyKey: { equals: idempotencyKey } }, { owner: { equals: user.id } }],
      },
      depth: 1,
      limit: 1,
      user,
      overrideAccess: false,
    })
    if (replay.docs[0]) {
      return Response.json({
        interaction: toInteraction(replay.docs[0], String(user.id)),
        replayed: true,
      })
    }
    return Response.json(
      {
        error: {
          code: 'CREATE_FAILED',
          message: 'No se confirmó la solicitud. Intenta nuevamente.',
        },
      },
      { status: 500 },
    )
  }
}
