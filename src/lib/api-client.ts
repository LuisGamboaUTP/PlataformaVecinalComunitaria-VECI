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

async function request<T>(path: string, options: RequestInit = {}): Promise<T | null> {
  try {
    const res = await fetch(path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
    })

    if (!res.ok) {
      const errBody = await res.json().catch(() => null)
      const message = errBody?.error?.message || errBody?.detail || `Error HTTP ${res.status}`
      throw new Error(message)
    }

    return (await res.json()) as T
  } catch (err) {
    // If backend is unreachable or request fails, return null to trigger graceful fallback
    console.warn(`[api-client] Solicitud a ${path} no disponible, usando fallback local:`, err)
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
    // Fallback local
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
    // Fallback a almacenamiento local / starter listings
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
      // Guardar también copia local sincronizada
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
}
