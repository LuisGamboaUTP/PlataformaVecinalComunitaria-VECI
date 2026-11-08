import {
  readLocal,
  saveSession,
  writeLocal,
  type LocalUser,
} from './local-store'
import type { InteractionView, ListingView } from '@/app/(frontend)/NeighborhoodApp'

export interface SessionResponse {
  user: LocalUser | null
}

export interface ListingsResponse {
  listings: ListingView[]
}

export interface InteractionsResponse {
  interactions: InteractionView[]
}

export interface MessageItem {
  id: string
  body: string
  sentByMe: boolean
  deliveryState: string
  createdAt?: string
}

export interface CommunityPostItem {
  id: string
  circleName?: string
  authorName?: string
  authorInitials?: string
  body: string
  comments?: string[]
  hasSharedListing?: boolean
  createdAt?: string
}

export interface EmergencyBoardItem {
  id: string
  kind: 'need' | 'resource'
  title: string
  zoneName?: string
  source?: string
  createdAt?: string
}

export interface NotificationItem {
  id: string
  title: string
  body: string
  kind: string
  read: boolean
  deliveryState: string
  createdAt?: string
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T | null> {
  try {
    const session = readLocal<LocalUser | null>('nexobarrio-session', null)
    const res = await fetch(path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(session?.id ? { 'X-User-Id': session.id } : {}),
        ...options.headers,
      },
      credentials: 'include',
    })

    if (!res.ok) {
      return null
    }

    return (await res.json()) as T
  } catch {
    return null
  }
}

export const api = {
  // ==================== AUTH & SESIÓN ====================
  async getSession(): Promise<LocalUser | null> {
    const data = await request<SessionResponse>('/api/app/session', { method: 'GET' })
    if (data?.user) {
      saveSession(data.user)
      return data.user
    }
    return readLocal<LocalUser | null>('nexobarrio-session', null)
  },

  async login(identifier: string, password: string): Promise<LocalUser> {
    const res = await fetch('/api/app/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: identifier, password }),
      credentials: 'include',
    })

    if (!res.ok) {
      const err = await res.json().catch(() => null)
      throw new Error(err?.error?.message || 'Correo, documento o contraseña incorrectos.')
    }

    const data = (await res.json()) as SessionResponse
    if (!data.user) throw new Error('No se pudo iniciar sesión.')
    saveSession(data.user)
    return data.user
  },

  async register(payload: {
    displayName: string
    email: string
    password: string
    zoneName: string
    docType?: string
    docNumber?: string
  }): Promise<LocalUser> {
    const res = await fetch('/api/app/session', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'include',
    })

    if (!res.ok) {
      const err = await res.json().catch(() => null)
      throw new Error(err?.error?.message || 'No se pudo crear la cuenta.')
    }

    const data = (await res.json()) as SessionResponse
    if (!data.user) throw new Error('No se pudo registrar.')
    saveSession(data.user)
    return data.user
  },

  async logout(): Promise<void> {
    try {
      await fetch('/api/app/session', { method: 'DELETE', credentials: 'include' })
    } catch {
      /* ignore */
    }
    saveSession(null)
  },

  // ==================== PUBLICACIONES ====================
  async getListings(): Promise<ListingView[]> {
    const data = await request<ListingsResponse>('/api/app/listings', { method: 'GET' })
    if (data?.listings && Array.isArray(data.listings) && data.listings.length > 0) {
      return data.listings
    }
    return readLocal<ListingView[]>('nexobarrio-listings', [])
  },

  async createListing(payload: {
    title: string
    description: string
    kind: string
    category: string
    priceLabel?: string
    zoneName: string
    acceptsBarter?: boolean
    x?: number
    y?: number
  }): Promise<ListingView | null> {
    const data = await request<{ listing: ListingView }>('/api/app/listings', {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    if (data?.listing) {
      const current = readLocal<ListingView[]>('nexobarrio-listings', [])
      writeLocal('nexobarrio-listings', [data.listing, ...current])
      return data.listing
    }
    return null
  },

  // ==================== INTERACCIONES ====================
  async getInteractions(): Promise<InteractionView[]> {
    const data = await request<InteractionsResponse>('/api/app/interactions', { method: 'GET' })
    if (data?.interactions && Array.isArray(data.interactions)) {
      return data.interactions
    }
    return readLocal<InteractionView[]>('nexobarrio-interactions', [])
  },

  async createInteraction(payload: {
    listingId: string
    listingTitle: string
    type: string
    summary: string
    dueDays?: number
  }): Promise<InteractionView | null> {
    const data = await request<{ interaction: InteractionView }>('/api/app/interactions', {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    if (data?.interaction) {
      const current = readLocal<InteractionView[]>('nexobarrio-interactions', [])
      writeLocal('nexobarrio-interactions', [data.interaction, ...current])
      return data.interaction
    }
    return null
  },

  async updateInteraction(id: string, action: string): Promise<InteractionView | null> {
    const data = await request<{ interaction: InteractionView }>(`/api/app/interactions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ action }),
    })

    if (data?.interaction) {
      const current = readLocal<InteractionView[]>('nexobarrio-interactions', [])
      const updated = current.map((i) => (i.id === id ? data.interaction : i))
      writeLocal('nexobarrio-interactions', updated)
      return data.interaction
    }
    return null
  },

  // ==================== MENSAJES (CHAT CONTEXTUAL) ====================
  async getMessages(interactionId: string): Promise<MessageItem[]> {
    const data = await request<{ messages: MessageItem[] }>(
      `/api/app/messages?interactionId=${encodeURIComponent(interactionId)}`,
      { method: 'GET' },
    )
    if (data?.messages && Array.isArray(data.messages)) {
      writeLocal(`nexobarrio-messages-${interactionId}`, data.messages)
      return data.messages
    }
    return readLocal<MessageItem[]>(`nexobarrio-messages-${interactionId}`, [])
  },

  async createMessage(interactionId: string, body: string): Promise<MessageItem | null> {
    const data = await request<{ message: MessageItem }>('/api/app/messages', {
      method: 'POST',
      body: JSON.stringify({ interactionId, body }),
    })
    if (data?.message) {
      return data.message
    }
    return null
  },

  // ==================== RESEÑAS VERIFICADAS ====================
  async createReview(payload: {
    interactionId: string
    stars: number
    comment: string
  }): Promise<boolean> {
    const data = await request<{ review: unknown }>('/api/app/reviews', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    return Boolean(data?.review)
  },

  // ==================== COMUNIDAD Y MURO VECINAL ====================
  async getCommunityPosts(): Promise<CommunityPostItem[]> {
    const data = await request<{ posts: CommunityPostItem[] }>('/api/app/community', {
      method: 'GET',
    })
    if (data?.posts && Array.isArray(data.posts)) {
      return data.posts
    }
    return []
  },

  async createCommunityPost(payload: {
    circleName: string
    authorName: string
    authorInitials: string
    body: string
    hasSharedListing?: boolean
  }): Promise<CommunityPostItem | null> {
    const data = await request<{ post: CommunityPostItem }>('/api/app/community', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    return data?.post || null
  },

  // ==================== TABLERO DE EMERGENCIAS ====================
  async getEmergencyItems(): Promise<EmergencyBoardItem[]> {
    const data = await request<{ items: EmergencyBoardItem[] }>('/api/app/emergency', {
      method: 'GET',
    })
    if (data?.items && Array.isArray(data.items)) {
      return data.items
    }
    return []
  },

  async createEmergencyItem(payload: {
    kind: 'need' | 'resource'
    title: string
    zoneName: string
    source?: string
  }): Promise<EmergencyBoardItem | null> {
    const data = await request<{ item: EmergencyBoardItem }>('/api/app/emergency', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    return data?.item || null
  },

  // ==================== NOTIFICACIONES ====================
  async getNotifications(): Promise<{ notifications: NotificationItem[]; unread: number } | null> {
    return await request<{ notifications: NotificationItem[]; unread: number }>(
      '/api/app/notifications',
      { method: 'GET' },
    )
  },

  async markNotificationsRead(): Promise<boolean> {
    const res = await request<{ success: boolean }>('/api/app/notifications', {
      method: 'PATCH',
    })
    return Boolean(res?.success)
  },
}
