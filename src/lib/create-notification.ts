import type { Payload } from 'payload'

export async function createInternalNotification({
  payload,
  user,
  ownerId,
  title,
  body,
  kind,
  contextPath,
}: {
  payload: Payload
  user: any
  ownerId: string | number | null
  title: string
  body: string
  kind: 'message' | 'request' | 'match' | 'help' | 'reminder' | 'system'
  contextPath?: string
}) {
  if (ownerId === null || String(ownerId) === String(user?.id)) return false
  try {
    await payload.create({
      collection: 'notifications' as never,
      data: { title, body, kind, contextPath } as never,
      context: { appWorkflowMutation: true, notificationOwnerId: ownerId },
      user,
      overrideAccess: false,
    })
    return true
  } catch {
    return false
  }
}
