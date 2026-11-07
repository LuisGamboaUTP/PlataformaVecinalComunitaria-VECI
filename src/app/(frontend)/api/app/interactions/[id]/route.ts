import config from '@payload-config'
import { getPayload } from 'payload'

import { appAuth } from '@/lib/app-auth'
import { createInternalNotification } from '@/lib/create-notification'

const allowedActions = new Set([
  'accept',
  'reject',
  'cancel',
  'start',
  'confirm-complete',
  'mark-delivered',
  'confirm-return',
  'close-return',
])

const relationshipId = (value: unknown): string | null => {
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (value && typeof value === 'object' && 'id' in value) {
    const id = (value as { id?: unknown }).id
    if (typeof id === 'string' || typeof id === 'number') return String(id)
  }
  return null
}

export async function PATCH(request: Request, context: RouteContext<'/api/app/interactions/[id]'>) {
  const user = await appAuth.currentUser()
  if (!user) {
    return Response.json(
      { error: { code: 'AUTH_REQUIRED', message: 'Inicia sesión para continuar.' } },
      { status: 401 },
    )
  }

  const { id } = await context.params
  let input: Record<string, unknown>
  try {
    input = await request.json()
  } catch {
    return Response.json({ error: { message: 'No pudimos leer la acción.' } }, { status: 400 })
  }
  const action = typeof input.action === 'string' ? input.action : ''
  if (!allowedActions.has(action)) {
    return Response.json({ error: { message: 'Acción no permitida.' } }, { status: 422 })
  }

  const payload = await getPayload({ config })
  let interaction: any
  try {
    interaction = await payload.findByID({
      collection: 'interactions' as never,
      id,
      depth: 0,
      user,
      overrideAccess: false,
    })
  } catch {
    return Response.json(
      { error: { message: 'No tienes acceso a esta operación.' } },
      { status: 403 },
    )
  }

  const userId = String(user.id)
  const isRequester = relationshipId(interaction.owner) === userId
  const isProvider = relationshipId(interaction.counterparty) === userId
  const current = String(interaction.status)
  const interactionType = String(interaction.type)

  let data: Record<string, unknown> | null = null
  if (
    action === 'cancel' &&
    isRequester &&
    ['requested', 'proposed', 'negotiating'].includes(current)
  ) {
    data = { status: 'cancelled' }
  } else if (
    action === 'accept' &&
    isProvider &&
    ['requested', 'proposed', 'negotiating'].includes(current)
  ) {
    data = {
      status: 'accepted',
      acceptance: {
        ownerAccepted: Boolean(interaction.acceptance?.ownerAccepted),
        counterpartyAccepted: true,
      },
    }
  } else if (
    action === 'reject' &&
    isProvider &&
    ['requested', 'proposed', 'negotiating'].includes(current)
  ) {
    data = { status: 'rejected' }
  } else if (action === 'start' && isProvider && ['accepted', 'coordinating'].includes(current)) {
    data = { status: 'in-progress' }
  } else if (
    action === 'mark-delivered' &&
    isProvider &&
    interactionType === 'loan' &&
    ['accepted', 'in-progress'].includes(current)
  ) {
    data = {
      status: 'return-pending',
      returnFlow: {
        dueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        borrowerConfirmed: false,
        lenderConfirmed: false,
      },
    }
  } else if (
    action === 'confirm-return' &&
    isRequester &&
    interactionType === 'loan' &&
    current === 'return-pending'
  ) {
    data = {
      status: 'return-pending',
      returnFlow: {
        dueAt: interaction.returnFlow?.dueAt,
        borrowerConfirmed: true,
        lenderConfirmed: Boolean(interaction.returnFlow?.lenderConfirmed),
      },
    }
  } else if (
    action === 'close-return' &&
    isProvider &&
    interactionType === 'loan' &&
    current === 'return-pending' &&
    interaction.returnFlow?.borrowerConfirmed === true
  ) {
    data = {
      status: 'completed',
      returnFlow: {
        dueAt: interaction.returnFlow?.dueAt,
        borrowerConfirmed: true,
        lenderConfirmed: true,
      },
    }
  } else if (
    action === 'confirm-complete' &&
    (isRequester || isProvider) &&
    ['accepted', 'coordinating', 'in-progress'].includes(current)
  ) {
    const ownerAccepted = Boolean(interaction.acceptance?.ownerAccepted) || isRequester
    const counterpartyAccepted = Boolean(interaction.acceptance?.counterpartyAccepted) || isProvider
    data = {
      acceptance: { ownerAccepted, counterpartyAccepted },
      status: ownerAccepted && counterpartyAccepted ? 'completed' : current,
    }
  }

  if (!data) {
    return Response.json(
      {
        error: {
          code: 'INVALID_TRANSITION',
          message: 'Ese cambio no corresponde al estado actual.',
        },
      },
      { status: 409 },
    )
  }

  let updated: any
  const exclusiveTypes = new Set(['barter', 'loan', 'gift'])
  if (action === 'accept' && exclusiveTypes.has(String(interaction.type))) {
    const listingId = relationshipId(interaction.listing)
    if (!listingId) {
      return Response.json(
        { error: { code: 'INVALID_LISTING', message: 'La publicación asociada no existe.' } },
        { status: 409 },
      )
    }
    let reservation: any
    try {
      reservation = await payload.create({
        collection: 'reservations' as never,
        data: { listingKey: listingId, listing: listingId, interaction: id } as never,
        user,
        overrideAccess: false,
        context: { appWorkflowMutation: true },
      })
    } catch {
      return Response.json(
        {
          error: {
            code: 'ALREADY_RESERVED',
            message: 'Otra propuesta reservó este recurso primero.',
          },
        },
        { status: 409 },
      )
    }
    try {
      await payload.update({
        collection: 'listings' as never,
        id: listingId,
        data: { status: 'reserved' } as never,
        user,
        overrideAccess: false,
        context: { appWorkflowMutation: true },
      })
      updated = await payload.update({
        collection: 'interactions' as never,
        id,
        data: data as never,
        user,
        overrideAccess: false,
        depth: 1,
        context: { appWorkflowMutation: true },
      })
    } catch {
      try {
        await payload.delete({
          collection: 'reservations' as never,
          id: reservation.id,
          user,
          overrideAccess: false,
          context: { appWorkflowMutation: true },
        })
        await payload.update({
          collection: 'listings' as never,
          id: listingId,
          data: { status: 'published' } as never,
          user,
          overrideAccess: false,
          context: { appWorkflowMutation: true },
        })
      } catch {
        // Keep the resource unavailable if compensation cannot be confirmed.
      }
      return Response.json(
        {
          error: {
            code: 'RESERVATION_FAILED',
            message: 'La aceptación no se confirmó; el recurso permanece protegido.',
          },
        },
        { status: 409 },
      )
    }
  } else {
    updated = await payload.update({
      collection: 'interactions' as never,
      id,
      data: data as never,
      user,
      overrideAccess: false,
      depth: 1,
      context: { appWorkflowMutation: true },
    })
  }

  const shouldFinalizeExclusive =
    updated.status === 'completed' &&
    ((interactionType === 'loan' && action === 'close-return') ||
      (['barter', 'gift'].includes(interactionType) && action === 'confirm-complete'))
  if (shouldFinalizeExclusive) {
    const listingId = relationshipId(interaction.listing)
    if (!listingId) {
      return Response.json(
        { error: { code: 'INVALID_LISTING', message: 'No se pudo liberar el recurso.' } },
        { status: 409 },
      )
    }
    try {
      const reservations: any = await payload.find({
        collection: 'reservations' as never,
        where: { listingKey: { equals: listingId } },
        limit: 1,
        user,
        overrideAccess: false,
        context: { appWorkflowMutation: true },
      })
      const reservation = reservations.docs?.[0]
      if (reservation) {
        await payload.delete({
          collection: 'reservations' as never,
          id: reservation.id,
          user,
          overrideAccess: false,
          context: { appWorkflowMutation: true },
        })
      }
      await payload.update({
        collection: 'listings' as never,
        id: listingId,
        data: { status: interactionType === 'loan' ? 'published' : 'completed' } as never,
        user,
        overrideAccess: false,
        context: { appWorkflowMutation: true },
      })
    } catch {
      return Response.json(
        {
          error: {
            code: 'RELEASE_FAILED',
            message:
              'El cierre quedó confirmado, pero el recurso requiere revisión de disponibilidad.',
          },
        },
        { status: 409 },
      )
    }
  }

  const recipientId = isProvider
    ? relationshipId(interaction.owner)
    : relationshipId(interaction.counterparty)
  const actionCopy: Record<string, string> = {
    accept: 'La solicitud fue aceptada.',
    reject: 'La solicitud fue rechazada.',
    cancel: 'La solicitud fue cancelada.',
    start: 'La interacción está en curso.',
    'confirm-complete': 'Una parte confirmó el cierre.',
    'mark-delivered': 'El préstamo fue marcado como entregado.',
    'confirm-return': 'El prestatario confirmó la devolución.',
    'close-return': 'La devolución fue confirmada y el recurso volvió a estar disponible.',
  }
  await createInternalNotification({
    payload,
    user,
    ownerId: recipientId,
    title: 'Actualización de estado',
    body: actionCopy[action] || 'La interacción cambió de estado.',
    kind: action.includes('return') || action === 'mark-delivered' ? 'reminder' : 'request',
    contextPath: `/activity/${id}`,
  })

  return Response.json({
    interaction: {
      id: String(updated.id),
      summary: String(updated.summary ?? ''),
      type: String(updated.type ?? ''),
      status: String(updated.status ?? ''),
      syncState: String(updated.syncState ?? 'confirmed'),
      listingTitle:
        typeof updated.listing === 'object'
          ? updated.listing?.title || 'Publicación'
          : 'Publicación',
      updatedAt: updated.updatedAt,
      role: isProvider ? 'provider' : 'requester',
      returnFlow: updated.returnFlow || undefined,
    },
  })
}
