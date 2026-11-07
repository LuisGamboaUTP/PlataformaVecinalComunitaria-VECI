export type QueuedInteraction = {
  userId: string
  idempotencyKey: string
  listingId: string
  listingTitle: string
  type: string
  details: string
  createdAt: string
  state: 'pending' | 'failed'
  error?: string
}

const STORAGE_KEY = 'nexobarrio-interaction-queue'

const writeQueue = (items: QueuedInteraction[]) => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export const readInteractionQueue = (): QueuedInteraction[] => {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]')
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (item): item is QueuedInteraction =>
        item &&
        typeof item === 'object' &&
        typeof item.userId === 'string' &&
        typeof item.idempotencyKey === 'string' &&
        typeof item.listingId === 'string' &&
        typeof item.details === 'string' &&
        (item.state === 'pending' || item.state === 'failed'),
    )
  } catch {
    window.localStorage.removeItem(STORAGE_KEY)
    return []
  }
}

export const enqueueInteraction = (item: QueuedInteraction) => {
  const current = readInteractionQueue()
  if (current.some((entry) => entry.idempotencyKey === item.idempotencyKey)) return
  writeQueue([...current, item])
}

export const removeQueuedInteraction = (idempotencyKey: string) => {
  writeQueue(readInteractionQueue().filter((item) => item.idempotencyKey !== idempotencyKey))
}

export const updateQueuedInteraction = (
  idempotencyKey: string,
  update: Partial<Pick<QueuedInteraction, 'state' | 'error'>>,
) => {
  writeQueue(
    readInteractionQueue().map((item) =>
      item.idempotencyKey === idempotencyKey ? { ...item, ...update } : item,
    ),
  )
}

export const createIdempotencyKey = () => window.crypto.randomUUID()
