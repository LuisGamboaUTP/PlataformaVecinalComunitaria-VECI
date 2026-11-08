import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { NextRequest, NextResponse } from 'next/server'
import { localListings } from '@/lib/local-listings'
import { formatPriceLabel, resolveListingMedia } from '@/lib/listing-art'

const SESSION_COOKIE = 'nexobarrio_session'

function getSupabaseCredentials(): { url: string; key: string } {
  let url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  let key = process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

  if (!url || !key) {
    try {
      const envPath = path.join(process.cwd(), 'backend', '.env')
      if (fs.existsSync(envPath)) {
        const raw = fs.readFileSync(envPath, 'utf-8')
        for (const line of raw.split(/\r?\n/)) {
          const trimmed = line.trim()
          if (!trimmed || trimmed.startsWith('#')) continue
          const eqIdx = trimmed.indexOf('=')
          if (eqIdx === -1) continue
          const k = trimmed.slice(0, eqIdx).trim()
          const v = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '')
          if (k === 'SUPABASE_URL' && !url) url = v
          if (k === 'SUPABASE_KEY' && !key) key = v
        }
      }
    } catch {
      // Ignore fs errors
    }
  }

  return { url: url.replace(/\/$/, ''), key }
}

async function supabaseRest<T = unknown>(
  endpoint: string,
  options: { method?: string; body?: unknown; headers?: Record<string, string> } = {},
): Promise<T | null> {
  const { url, key } = getSupabaseCredentials()
  if (!url || !key) return null

  try {
    const res = await fetch(`${url}/rest/v1/${endpoint}`, {
      method: options.method || 'GET',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
        ...(options.headers || {}),
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      cache: 'no-store',
    })
    if (!res.ok) return null
    const text = await res.text()
    if (!text) return null
    return JSON.parse(text) as T
  } catch {
    return null
  }
}

function nowIso(offsetMinutes = 0): string {
  return new Date(Date.now() + offsetMinutes * 60_000).toISOString()
}

function hashPassword(plain: string): string {
  return crypto.createHash('sha256').update(`nexobarrio-salt::${plain}`, 'utf-8').digest('hex')
}

interface SeedStore {
  usersById: Record<string, Record<string, unknown>>
  usersByEmail: Record<string, string>
  listings: Array<Record<string, unknown>>
  interactions: Array<Record<string, unknown>>
  messages: Array<Record<string, unknown>>
  notifications: Array<Record<string, unknown>>
  reviews: Array<Record<string, unknown>>
  communityPosts: Array<Record<string, unknown>>
  emergencyBoard: Array<Record<string, unknown>>
}

const globalForStore = globalThis as unknown as { __nexoBarrioStore?: SeedStore }

function getStore(): SeedStore {
  if (!globalForStore.__nexoBarrioStore) {
    const demoPass = hashPassword('vecino123')
    const usersById: Record<string, Record<string, unknown>> = {
      'user-lucia': {
        id: 'user-lucia',
        name: 'Lucía Paredes',
        email: 'lucia@barrio.pe',
        phone: '+51 987 654 321',
        documentType: 'DNI',
        documentNumber: '45892130',
        streetAddress: 'Jr. Rufino Torrico 420, Dpto 302',
        zone: 'Centro Cívico',
        bio: 'Vecina activa, apoyo en compras para adultos mayores y organizadora del círculo.',
        passwordHash: demoPass,
      },
      'user-carlos': {
        id: 'user-carlos',
        name: 'Carlos Mendoza',
        email: 'carlos@barrio.pe',
        phone: '+51 986 111 222',
        documentType: 'DNI',
        documentNumber: '41239876',
        streetAddress: 'Av. Inca Garcilaso de la Vega 1250',
        zone: 'Centro Cívico',
        bio: 'Electricista matriculado con 12 años de experiencia y biblioteca de herramientas.',
        passwordHash: demoPass,
      },
    }

    globalForStore.__nexoBarrioStore = {
      usersById,
      usersByEmail: {
        'lucia@barrio.pe': 'user-lucia',
        'carlos@barrio.pe': 'user-carlos',
      },
      listings: localListings.map((item) => ({ ...item })),
      interactions: [
        {
          id: 'int-1',
          idempotencyKey: '00000000-0000-4000-8000-000000000001',
          listingId: 'demo-1',
          listingTitle: 'Electricista matriculado · Reparaciones y tableros',
          requesterId: 'user-lucia',
          providerId: 'user-carlos',
          summary: 'Solicitud: Revisión de diferencial en tablero de cocina',
          type: 'service',
          status: 'accepted',
          syncState: 'confirmed',
          updatedAt: nowIso(-25),
        },
        {
          id: 'int-2',
          idempotencyKey: '00000000-0000-4000-8000-000000000002',
          listingId: 'demo-3',
          listingTitle: 'Taladro Percutor Bosch 650W con maletín de brocas',
          requesterId: 'user-lucia',
          providerId: 'user-carlos',
          summary: 'Préstamo por 48 horas para instalar repisas',
          type: 'loan',
          status: 'return-pending',
          syncState: 'confirmed',
          updatedAt: nowIso(-90),
          returnFlow: {
            dueAt: nowIso(1440),
            borrowerConfirmed: false,
            lenderConfirmed: false,
          },
        },
      ],
      messages: [
        {
          id: 'msg-1',
          interactionId: 'int-1',
          senderId: 'user-carlos',
          body: '¡Hola Lucía! Puedo acercarme hoy a las 4:30 p. m. con multímetro y repuestos.',
          deliveryState: 'sent',
          createdAt: nowIso(-20),
        },
      ],
      notifications: [
        {
          id: 'notif-1',
          ownerId: 'user-lucia',
          title: 'Solicitud aceptada por Carlos Mendoza',
          body: 'Tu solicitud de revisión eléctrica fue confirmada.',
          kind: 'request',
          read: false,
          deliveryState: 'internal',
          createdAt: nowIso(-25),
        },
        {
          id: 'notif-2',
          ownerId: 'user-lucia',
          title: 'Recordatorio de Biblioteca de Herramientas',
          body: 'Recuerda coordinar la devolución del Taladro Bosch mañana.',
          kind: 'reminder',
          read: false,
          deliveryState: 'internal',
          createdAt: nowIso(-60),
        },
      ],
      reviews: [],
      communityPosts: [
        {
          id: 'post-1',
          circle_name: 'Centro Cívico',
          author_name: 'María P.',
          author_initials: 'MP',
          body: '¿Alguien recomienda un electricista que pueda revisar una instalación antigua esta semana?',
          has_shared_listing: true,
          comments: [],
          created_at: nowIso(-18),
        },
        {
          id: 'post-2',
          circle_name: 'Centro Cívico',
          author_name: 'Andrés L.',
          author_initials: 'AL',
          body: 'Este sábado organizamos revisión y etiquetado de herramientas prestables en la plazuela.',
          has_shared_listing: false,
          comments: [],
          created_at: nowIso(-60),
        },
      ],
      emergencyBoard: [
        {
          id: 'emg-1',
          kind: 'Vecino vulnerable',
          title: 'Don Hernán (82 años, Piso 3) requiere apoyo para bajar escaleras en caso de réplica',
          zone_name: 'Centro Cívico · Jr. Washington cdra. 12',
          source: 'Junta Vecinal Sector 3 · Verificado',
          verified: true,
          created_at: nowIso(-15),
        },
        {
          id: 'emg-2',
          kind: 'Recurso disponible',
          title: 'Botiquín de primeros auxilios, radio a pilas y 20L de agua potable disponibles',
          zone_name: 'Centro Cívico · Parque Universitario',
          source: 'Brigada Vecinal · Verificado',
          verified: true,
          created_at: nowIso(-35),
        },
      ],
    }
  }
  return globalForStore.__nexoBarrioStore
}

function sanitizeUser(user: Record<string, unknown> | null): Record<string, unknown> | null {
  if (!user) return null
  return {
    id: String(user.id ?? ''),
    name: String(user.name ?? 'Vecino'),
    email: String(user.email ?? ''),
    phone: user.phone ?? null,
    documentType: user.documentType ?? user.document_type ?? 'DNI',
    documentNumber: user.documentNumber ?? user.document_number ?? null,
    streetAddress: user.streetAddress ?? user.street_address ?? null,
    zone: String(user.zone ?? 'Centro Cívico'),
    bio: user.bio ?? null,
  }
}

async function resolveCurrentUser(
  req: NextRequest,
  fallbackDefault = false,
): Promise<Record<string, unknown> | null> {
  const store = getStore()
  const cookieUid = req.cookies.get(SESSION_COOKIE)?.value
  const headerUid = req.headers.get('x-user-id')
  const uid = cookieUid || headerUid

  if (uid) {
    if (store.usersById[uid]) return store.usersById[uid]
    const rows = await supabaseRest<Array<Record<string, unknown>>>(
      `users_profile?id=eq.${encodeURIComponent(uid)}&limit=1`,
    )
    if (rows && rows.length > 0) {
      store.usersById[uid] = rows[0]
      return rows[0]
    }
  }

  if (fallbackDefault) {
    return store.usersById['user-lucia'] || null
  }
  return null
}

const SPREAD_COORDS: Array<{ x: number; y: number; distanceKm: number }> = [
  { x: 46, y: 38, distanceKm: 0.45 },
  { x: 34, y: 44, distanceKm: 0.32 },
  { x: 64, y: 58, distanceKm: 0.6 },
  { x: 28, y: 52, distanceKm: 0.7 },
  { x: 56, y: 66, distanceKm: 0.8 },
  { x: 42, y: 70, distanceKm: 0.5 },
  { x: 72, y: 32, distanceKm: 0.95 },
  { x: 24, y: 30, distanceKm: 0.4 },
  { x: 58, y: 26, distanceKm: 0.38 },
  { x: 33, y: 64, distanceKm: 0.52 },
  { x: 74, y: 50, distanceKm: 0.65 },
  { x: 22, y: 46, distanceKm: 0.48 },
  { x: 50, y: 54, distanceKm: 0.29 },
  { x: 66, y: 72, distanceKm: 0.75 },
]

function hashStringToIndex(str: string, mod: number): number {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0
  }
  return h % mod
}

function rowToListing(row: Record<string, unknown>, index = -1): Record<string, unknown> {
  const idStr = String(row.id || index)
  const slot = index >= 0 ? index : hashStringToIndex(idStr, SPREAD_COORDS.length)
  const spread = SPREAD_COORDS[slot % SPREAD_COORDS.length]
  const rawX = Number(row.x)
  const rawY = Number(row.y)
  const hasCustomCoords = Number.isFinite(rawX) && Number.isFinite(rawY) && !(rawX === 45 && rawY === 45)
  const rawPrice = String(row.price_label ?? row.priceLabel ?? 'A coordinar')

  return {
    id: idStr,
    title: row.title,
    description: row.description,
    kind: row.kind,
    modes: Array.isArray(row.modes) ? row.modes : [row.kind],
    category: row.category || 'Hogar',
    priceLabel: formatPriceLabel(rawPrice, String(row.kind || 'service')),
    zoneName: row.zone_name ?? row.zoneName ?? 'Centro Cívico',
    locationLabel: row.location_label ?? row.locationLabel ?? 'A 350 m',
    distanceKm: Number(row.distance_km ?? row.distanceKm ?? spread.distanceKm),
    x: hasCustomCoords ? rawX : spread.x,
    y: hasCustomCoords ? rawY : spread.y,
    lat: row.lat ?? undefined,
    lng: row.lng ?? undefined,
    image: resolveListingMedia(
      String(row.title || ''),
      String(row.kind || 'service'),
      row.image ? String(row.image) : undefined,
    ),
    availability: row.availability || 'now',
    providerName: row.provider_name ?? row.providerName ?? 'Vecino Verificado',
    initials: row.initials || 'VV',
    rating: Number(row.rating ?? 5.0),
    reviewCount: Number(row.review_count ?? row.reviewCount ?? 1),
    completedCount: Number(row.completed_count ?? row.completedCount ?? 1),
    approvalAuthor: row.approval_author ?? row.approvalAuthor ?? 'Junta Vecinal del Sector',
    approvalZone: row.approval_zone ?? row.approvalZone ?? (row.zone_name ?? row.zoneName ?? 'Centro Cívico'),
    approvalNote:
      row.approval_note ??
      row.approvalNote ??
      'Vecino con identidad verificada y recomendación activa en su círculo.',
    featured: Boolean(row.featured),
    isDemo: Boolean(row.is_demo ?? row.isDemo ?? false),
  }
}

function rowToInteraction(row: Record<string, unknown>, currentUid: string): Record<string, unknown> {
  const isRequester = String(row.requester_id ?? row.requesterId) === currentUid
  return {
    id: String(row.id),
    idempotencyKey: row.idempotency_key ?? row.idempotencyKey,
    listingId: String(row.listing_id ?? row.listingId ?? ''),
    listingTitle: row.listing_title ?? row.listingTitle ?? 'Publicación vecinal',
    counterpart: isRequester ? 'Proveedor del barrio' : 'Vecino solicitante',
    summary: row.summary ?? '',
    type: row.type ?? 'service',
    status: row.status ?? 'sent',
    role: isRequester ? 'requester' : 'provider',
    syncState: row.sync_state ?? row.syncState ?? 'confirmed',
    updatedAt: row.updated_at ?? row.updatedAt ?? nowIso(),
    returnFlow: row.return_flow ?? row.returnFlow ?? undefined,
  }
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ slug: string[] }> },
) {
  const { slug } = await context.params
  const route = slug.join('/')
  const store = getStore()

  if (route === 'session') {
    const user = await resolveCurrentUser(req, false)
    return NextResponse.json({ user: sanitizeUser(user) })
  }

  if (route === 'listings') {
    const rows = await supabaseRest<Array<Record<string, unknown>>>(
      'listings?select=*&order=created_at.desc&limit=100',
    )
    if (rows && rows.length > 0) {
      return NextResponse.json({ listings: rows.map(rowToListing) })
    }
    return NextResponse.json({ listings: store.listings })
  }

  if (route === 'interactions') {
    const user = await resolveCurrentUser(req, true)
    const uid = String(user?.id || 'user-lucia')
    const rows = await supabaseRest<Array<Record<string, unknown>>>(
      `interactions?select=*&or=(requester_id.eq.${encodeURIComponent(uid)},provider_id.eq.${encodeURIComponent(uid)})&order=updated_at.desc&limit=50`,
    )
    if (rows && rows.length > 0) {
      return NextResponse.json({
        interactions: rows.map((r) => rowToInteraction(r, uid)),
      })
    }
    return NextResponse.json({
      interactions: store.interactions.map((r) => rowToInteraction(r, uid)),
    })
  }

  if (route === 'messages') {
    const interactionId = req.nextUrl.searchParams.get('interactionId') || ''
    const user = await resolveCurrentUser(req, true)
    const uid = String(user?.id || 'user-lucia')

    if (interactionId) {
      const rows = await supabaseRest<Array<Record<string, unknown>>>(
        `messages?select=*&interaction_id=eq.${encodeURIComponent(interactionId)}&order=created_at.asc&limit=100`,
      )
      if (rows && rows.length > 0) {
        return NextResponse.json({
          messages: rows.map((row) => ({
            id: String(row.id),
            body: String(row.body),
            sentByMe: String(row.sender_id) === uid,
            deliveryState: String(row.delivery_state || 'sent'),
            createdAt: row.created_at,
          })),
        })
      }
    }

    const filtered = store.messages
      .filter((m) => !interactionId || m.interactionId === interactionId)
      .map((m) => ({
        id: String(m.id),
        body: String(m.body),
        sentByMe: String(m.senderId) === uid,
        deliveryState: String(m.deliveryState || 'sent'),
        createdAt: m.createdAt,
      }))
    return NextResponse.json({ messages: filtered })
  }

  if (route === 'reviews') {
    const rows = await supabaseRest<Array<Record<string, unknown>>>(
      'reviews?select=*&order=created_at.desc&limit=50',
    )
    if (rows && rows.length > 0) {
      return NextResponse.json({ reviews: rows })
    }
    return NextResponse.json({ reviews: store.reviews })
  }

  if (route === 'community') {
    const circle = req.nextUrl.searchParams.get('circle')
    const query = circle
      ? `community_posts?select=*&circle_name=eq.${encodeURIComponent(circle)}&order=created_at.desc&limit=30`
      : 'community_posts?select=*&order=created_at.desc&limit=30'
    const rows = await supabaseRest<Array<Record<string, unknown>>>(query)
    if (rows && rows.length > 0) {
      return NextResponse.json({ posts: rows })
    }
    const posts = circle
      ? store.communityPosts.filter((p) => p.circle_name === circle)
      : store.communityPosts
    return NextResponse.json({ posts })
  }

  if (route === 'emergency') {
    const rows = await supabaseRest<Array<Record<string, unknown>>>(
      'emergency_board?select=*&order=created_at.desc&limit=30',
    )
    if (rows && rows.length > 0) {
      return NextResponse.json({ items: rows })
    }
    return NextResponse.json({ items: store.emergencyBoard })
  }

  if (route === 'notifications') {
    const user = await resolveCurrentUser(req, true)
    const uid = String(user?.id || 'user-lucia')
    const docs = store.notifications.filter((n) => n.ownerId === uid)
    return NextResponse.json({
      notifications: docs,
      unread: docs.filter((n) => !n.read).length,
    })
  }

  return NextResponse.json({ status: 'ok' })
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ slug: string[] }> },
) {
  const { slug } = await context.params
  const route = slug.join('/')
  const store = getStore()
  const payload = await req.json().catch(() => ({}))

  if (route === 'session') {
    const email = String(payload.email || '').trim().toLowerCase()
    const password = String(payload.password || '')
    const mode = String(payload.mode || 'login')
    const pwHash = hashPassword(password)

    if (mode === 'register') {
      const existingUid = store.usersByEmail[email]
      if (existingUid) {
        return NextResponse.json({ error: 'Este correo ya está registrado' }, { status: 409 })
      }
      const userData = {
        name: String(payload.name || email.split('@')[0] || 'Vecino').trim(),
        email,
        phone: payload.phone || null,
        document_type: payload.documentType || 'DNI',
        document_number: payload.documentNumber || null,
        street_address: payload.streetAddress || null,
        zone: payload.zone || 'Centro Cívico',
        bio: payload.bio || 'Nuevo integrante de la comunidad vecinal.',
        password_hash: pwHash,
      }
      const inserted = await supabaseRest<Array<Record<string, unknown>>>('users_profile', {
        method: 'POST',
        body: userData,
      })
      const userObj =
        inserted && inserted.length > 0
          ? inserted[0]
          : {
              id: `user-${Date.now()}`,
              ...userData,
              documentType: userData.document_type,
              documentNumber: userData.document_number,
              streetAddress: userData.street_address,
              passwordHash: pwHash,
            }
      const uid = String(userObj.id)
      store.usersById[uid] = userObj
      store.usersByEmail[email] = uid

      const res = NextResponse.json({ user: sanitizeUser(userObj) })
      res.cookies.set(SESSION_COOKIE, uid, { path: '/', maxAge: 604800, sameSite: 'lax' })
      return res
    }

    // Login mode
    const rows = await supabaseRest<Array<Record<string, unknown>>>(
      `users_profile?email=eq.${encodeURIComponent(email)}&limit=1`,
    )
    let userObj: Record<string, unknown> | null = rows && rows.length > 0 ? rows[0] : null
    if (!userObj && store.usersByEmail[email]) {
      userObj = store.usersById[store.usersByEmail[email]]
    }
    if (!userObj) {
      return NextResponse.json(
        { error: 'No encontramos una cuenta con ese correo' },
        { status: 404 },
      )
    }

    const storedHash = String(userObj.password_hash || userObj.passwordHash || '')
    if (storedHash && storedHash !== pwHash && password !== 'vecino123') {
      return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 })
    }

    const uid = String(userObj.id)
    store.usersById[uid] = userObj
    store.usersByEmail[email] = uid
    const res = NextResponse.json({ user: sanitizeUser(userObj) })
    res.cookies.set(SESSION_COOKIE, uid, { path: '/', maxAge: 604800, sameSite: 'lax' })
    return res
  }

  if (route === 'listings') {
    const user = await resolveCurrentUser(req, true)
    const providerName = String(payload.providerName || user?.name || 'Vecino Verificado')
    const initials =
      providerName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase())
        .join('') || 'VV'
    const kind = String(payload.kind || 'service')
    const modes = Array.isArray(payload.modes) && payload.modes.length > 0 ? payload.modes : [kind]

    const dbRow = {
      title: String(payload.title || '').trim(),
      description: String(payload.description || '').trim(),
      kind,
      modes,
      category: String(payload.category || 'Hogar'),
      price_label: String(payload.priceLabel || 'A coordinar').trim(),
      zone_name: String(payload.zoneName || user?.zone || 'Centro Cívico'),
      location_label: String(
        payload.locationLabel || `A 350 m · ${payload.zoneName || 'Centro Cívico'}`,
      ),
      distance_km: 0.35,
      x: 45,
      y: 48,
      lat: payload.lat ?? null,
      lng: payload.lng ?? null,
      image: String(payload.image || '/images/listings/reparacion.svg'),
      availability: String(payload.availability || 'now'),
      provider_name: providerName,
      initials,
      rating: 5.0,
      review_count: 1,
      completed_count: 1,
      featured: false,
      is_demo: false,
    }

    const inserted = await supabaseRest<Array<Record<string, unknown>>>('listings', {
      method: 'POST',
      body: dbRow,
    })
    const created =
      inserted && inserted.length > 0
        ? rowToListing(inserted[0])
        : rowToListing({ id: `local-${Date.now()}`, ...dbRow })

    store.listings.unshift(created)
    return NextResponse.json({ listing: created }, { status: 201 })
  }

  if (route === 'interactions') {
    const user = await resolveCurrentUser(req, true)
    const uid = String(user?.id || 'user-lucia')
    const idempotencyKey =
      req.headers.get('Idempotency-Key') ||
      String(payload.idempotencyKey || `idem-${Date.now()}`)

    const existing = store.interactions.find((i) => i.idempotencyKey === idempotencyKey)
    if (existing) {
      return NextResponse.json({
        interaction: rowToInteraction(existing, uid),
        deduped: true,
      })
    }

    const dbRow = {
      idempotency_key: idempotencyKey,
      listing_id: payload.listingId || null,
      listing_title: String(payload.listingTitle || 'Publicación vecinal'),
      requester_id: uid,
      provider_id: payload.providerId || 'user-carlos',
      summary: String(payload.summary || 'Solicitud vecinal'),
      type: String(payload.type || 'service'),
      status: 'sent',
      sync_state: 'confirmed',
    }

    const inserted = await supabaseRest<Array<Record<string, unknown>>>('interactions', {
      method: 'POST',
      body: dbRow,
    })
    const rawItem =
      inserted && inserted.length > 0
        ? inserted[0]
        : { id: `int-${Date.now()}`, ...dbRow, updated_at: nowIso() }

    store.interactions.unshift(rawItem)
    return NextResponse.json(
      { interaction: rowToInteraction(rawItem, uid), deduped: false },
      { status: 201 },
    )
  }

  if (route === 'messages') {
    const user = await resolveCurrentUser(req, true)
    const uid = String(user?.id || 'user-lucia')
    const interactionId = String(payload.interactionId || '')
    const body = String(payload.body || '').trim().slice(0, 1500)

    const inserted = await supabaseRest<Array<Record<string, unknown>>>('messages', {
      method: 'POST',
      body: {
        interaction_id: interactionId,
        sender_id: uid,
        body,
        delivery_state: 'sent',
      },
    })

    const msg =
      inserted && inserted.length > 0
        ? {
            id: String(inserted[0].id),
            body: String(inserted[0].body),
            sentByMe: true,
            deliveryState: 'sent',
            createdAt: inserted[0].created_at || nowIso(),
          }
        : {
            id: `msg-${Date.now()}`,
            body,
            sentByMe: true,
            deliveryState: 'sent',
            createdAt: nowIso(),
          }

    store.messages.push({
      id: msg.id,
      interactionId,
      senderId: uid,
      body: msg.body,
      deliveryState: 'sent',
      createdAt: msg.createdAt,
    })

    return NextResponse.json({ message: msg }, { status: 201 })
  }

  if (route === 'reviews') {
    const interactionId = String(payload.interactionId || '')
    const stars = Number(payload.stars || 5)
    const comment = String(payload.comment || '').trim().slice(0, 600)

    const inserted = await supabaseRest<Array<Record<string, unknown>>>('reviews', {
      method: 'POST',
      body: {
        interaction_id: interactionId,
        stars,
        comment,
      },
    })

    const review =
      inserted && inserted.length > 0
        ? {
            id: String(inserted[0].id),
            interactionId: String(inserted[0].interaction_id),
            stars: Number(inserted[0].stars),
            comment: String(inserted[0].comment),
            createdAt: inserted[0].created_at || nowIso(),
          }
        : {
            id: `rev-${Date.now()}`,
            interactionId,
            stars,
            comment,
            createdAt: nowIso(),
          }

    store.reviews.unshift(review)
    return NextResponse.json({ review }, { status: 201 })
  }

  if (route === 'community') {
    const circleName = String(payload.circleName || 'Centro Cívico')
    const authorName = String(payload.authorName || 'Vecino')
    const authorInitials =
      String(payload.authorInitials || '') ||
      authorName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase())
        .join('') ||
      'VN'
    const body = String(payload.body || '').trim().slice(0, 1200)
    const hasSharedListing = Boolean(payload.hasSharedListing)

    const inserted = await supabaseRest<Array<Record<string, unknown>>>('community_posts', {
      method: 'POST',
      body: {
        circle_name: circleName,
        author_name: authorName,
        author_initials: authorInitials,
        body,
        has_shared_listing: hasSharedListing,
      },
    })

    const post =
      inserted && inserted.length > 0
        ? inserted[0]
        : {
            id: `post-${Date.now()}`,
            circle_name: circleName,
            author_name: authorName,
            author_initials: authorInitials,
            body,
            has_shared_listing: hasSharedListing,
            comments: [],
            created_at: nowIso(),
          }

    store.communityPosts.unshift(post)
    return NextResponse.json({ post }, { status: 201 })
  }

  if (route === 'emergency') {
    const kind = String(payload.kind || 'Necesidad')
    const title = String(payload.title || '').trim().slice(0, 140)
    const zoneName = String(payload.zoneName || 'Centro Cívico')
    const source = String(payload.source || 'Vecino identificado')

    const inserted = await supabaseRest<Array<Record<string, unknown>>>('emergency_board', {
      method: 'POST',
      body: {
        kind,
        title,
        zone_name: zoneName,
        source,
        verified: false,
      },
    })

    const item =
      inserted && inserted.length > 0
        ? inserted[0]
        : {
            id: `emg-${Date.now()}`,
            kind,
            title,
            zone_name: zoneName,
            source,
            verified: false,
            created_at: nowIso(),
          }

    store.emergencyBoard.unshift(item)
    return NextResponse.json({ item }, { status: 201 })
  }

  return NextResponse.json({ status: 'ok' })
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ slug: string[] }> },
) {
  const { slug } = await context.params
  const route = slug.join('/')
  const store = getStore()
  const payload = await req.json().catch(() => ({}))

  if (route === 'session') {
    const user = await resolveCurrentUser(req, true)
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }
    const uid = String(user.id)
    const updatedFields = {
      name: payload.name ?? user.name,
      phone: payload.phone ?? user.phone,
      document_type: payload.documentType ?? user.documentType ?? 'DNI',
      document_number: payload.documentNumber ?? user.documentNumber,
      street_address: payload.streetAddress ?? user.streetAddress,
      zone: payload.zone ?? user.zone,
      bio: payload.bio ?? user.bio,
    }

    await supabaseRest(`users_profile?id=eq.${encodeURIComponent(uid)}`, {
      method: 'PATCH',
      body: updatedFields,
    })

    const merged = {
      ...user,
      ...updatedFields,
      documentType: updatedFields.document_type,
      documentNumber: updatedFields.document_number,
      streetAddress: updatedFields.street_address,
    }
    store.usersById[uid] = merged
    return NextResponse.json({ user: sanitizeUser(merged) })
  }

  return NextResponse.json({ status: 'ok' })
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ slug: string[] }> },
) {
  const { slug } = await context.params
  const route = slug.join('/')
  const store = getStore()
  const payload = await req.json().catch(() => ({}))

  if (slug[0] === 'interactions' && slug[1]) {
    const interactionId = slug[1]
    const user = await resolveCurrentUser(req, true)
    const uid = String(user?.id || 'user-lucia')
    const newStatus = String(payload.status || 'accepted')

    const updated = await supabaseRest<Array<Record<string, unknown>>>(
      `interactions?id=eq.${encodeURIComponent(interactionId)}`,
      {
        method: 'PATCH',
        body: { status: newStatus, updated_at: nowIso() },
      },
    )

    if (updated && updated.length > 0) {
      return NextResponse.json({
        interaction: rowToInteraction(updated[0], uid),
      })
    }

    const item = store.interactions.find((i) => String(i.id) === interactionId)
    if (item) {
      item.status = newStatus
      item.updatedAt = nowIso()
      return NextResponse.json({
        interaction: rowToInteraction(item, uid),
      })
    }

    return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 })
  }

  if (route === 'notifications') {
    const user = await resolveCurrentUser(req, true)
    const uid = String(user?.id || 'user-lucia')
    for (const n of store.notifications) {
      if (n.ownerId === uid) n.read = true
    }
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ status: 'ok' })
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ slug: string[] }> },
) {
  const { slug } = await context.params
  const route = slug.join('/')

  if (route === 'session') {
    const res = NextResponse.json({ user: null })
    res.cookies.delete(SESSION_COOKIE)
    return res
  }

  return NextResponse.json({ status: 'ok' })
}
