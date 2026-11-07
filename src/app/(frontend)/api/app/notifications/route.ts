import config from '@payload-config'
import { getPayload } from 'payload'

import { appAuth } from '@/lib/app-auth'

const toNotification = (doc: any) => ({
  id: String(doc.id),
  title: String(doc.title ?? ''),
  body: String(doc.body ?? ''),
  kind: String(doc.kind ?? 'system'),
  read: Boolean(doc.read),
  deliveryState: String(doc.deliveryState ?? 'internal'),
  contextPath: doc.contextPath || undefined,
  createdAt: doc.createdAt,
})

export async function GET() {
  const user = await appAuth.currentUser()
  if (!user) return Response.json({ notifications: [], unread: 0 }, { status: 401 })

  const payload = await getPayload({ config })
  const result = await payload.find({
    collection: 'notifications' as never,
    sort: '-createdAt',
    limit: 50,
    user,
    overrideAccess: false,
  })
  return Response.json({
    notifications: result.docs.map(toNotification),
    unread: result.docs.filter((doc: any) => !doc.read).length,
  })
}

export async function PATCH() {
  const user = await appAuth.currentUser()
  if (!user) {
    return Response.json({ error: { message: 'Inicia sesión para continuar.' } }, { status: 401 })
  }
  const payload = await getPayload({ config })
  await payload.update({
    collection: 'notifications' as never,
    where: { read: { equals: false } },
    data: { read: true } as never,
    user,
    overrideAccess: false,
  })
  return Response.json({ success: true })
}
