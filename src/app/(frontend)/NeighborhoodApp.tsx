'use client'

import Image from 'next/image'
import Link from 'next/link'
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Bell,
  Bookmark,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  Compass,
  Filter,
  HandHeart,
  Heart,
  Home,
  Layers3,
  ListFilter,
  Map,
  MapPin,
  Menu,
  MessageCircle,
  Navigation,
  PackageOpen,
  Plus,
  Search,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  Users,
  WifiOff,
  Wrench,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'

import {
  createIdempotencyKey,
  enqueueInteraction,
  readInteractionQueue,
  removeQueuedInteraction,
  updateQueuedInteraction,
  type QueuedInteraction,
} from '@/lib/interaction-queue'

export type ListingView = {
  id: string
  title: string
  description: string
  kind: string
  modes: string[]
  category: string
  priceLabel?: string
  zoneName: string
  locationLabel: string
  distanceKm?: number
  x: number
  y: number
  image?: string
  availability?: string
  providerName?: string
  initials?: string
  rating?: number
  reviewCount?: number
  completedCount?: number
  approvalAuthor?: string
  approvalZone?: string
  approvalNote?: string
  featured?: boolean
  isDemo?: boolean
}

type SessionUser = {
  id: string
  displayName?: string
  zoneName?: string
  verificationStatus?: string
}

type InteractionView = {
  id: string
  summary: string
  type: string
  status: string
  syncState: string
  listingTitle: string
  updatedAt?: string
  role?: 'requester' | 'provider'
  returnFlow?: {
    dueAt?: string
    borrowerConfirmed?: boolean
    lenderConfirmed?: boolean
  }
}

type NotificationView = {
  id: string
  title: string
  body: string
  kind: string
  read: boolean
  deliveryState: string
  createdAt?: string
}

type Tab = 'map' | 'explore' | 'publish' | 'community' | 'activity'
type Modal = 'detail' | 'emergency' | 'profile' | 'help' | 'notifications' | null

const kindLabel: Record<string, string> = {
  product: 'Producto',
  service: 'Servicio',
  skill: 'Habilidad',
  barter: 'Trueque',
  gift: 'Regalo',
  loan: 'Préstamo',
  need: 'Necesidad',
  help: 'Ayuda',
}

const kindIcon: Record<string, typeof Wrench> = {
  service: Wrench,
  product: PackageOpen,
  barter: Sparkles,
  loan: PackageOpen,
  gift: HandHeart,
  help: HandHeart,
  need: Search,
  skill: Users,
}

const tabs: { id: Tab; label: string; icon: typeof Map }[] = [
  { id: 'map', label: 'Mapa', icon: Map },
  { id: 'explore', label: 'Explorar', icon: Compass },
  { id: 'publish', label: 'Publicar', icon: Plus },
  { id: 'community', label: 'Comunidad', icon: Users },
  { id: 'activity', label: 'Actividad', icon: Activity },
]

const publishKinds = ['product', 'service', 'skill', 'barter', 'gift', 'loan', 'need', 'help']

export function NeighborhoodApp({ listings }: { listings: ListingView[] }) {
  const [splash, setSplash] = useState(true)
  const [onboarding, setOnboarding] = useState(false)
  const [tab, setTab] = useState<Tab>('map')
  const [modal, setModal] = useState<Modal>(null)
  const [selected, setSelected] = useState<ListingView | null>(listings[0] ?? null)
  const [query, setQuery] = useState('')
  const [activeKind, setActiveKind] = useState('all')
  const [saved, setSaved] = useState<Set<string>>(new Set())
  const [sheetOpen, setSheetOpen] = useState(false)
  const [publishKind, setPublishKind] = useState('service')
  const [published, setPublished] = useState(false)
  const [zone, setZone] = useState('Centro Cívico')
  const [liveListings, setLiveListings] = useState(listings)
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null)
  const [interactions, setInteractions] = useState<InteractionView[]>([])
  const [publishMessage, setPublishMessage] = useState('')
  const [publishing, setPublishing] = useState(false)
  const [photoName, setPhotoName] = useState('')
  const [draft, setDraft] = useState<Record<string, string> | null>(null)
  const [notifications, setNotifications] = useState<NotificationView[]>([])
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [isOnline, setIsOnline] = useState(true)
  const [queuedInteractions, setQueuedInteractions] = useState<QueuedInteraction[]>([])
  const [syncingQueue, setSyncingQueue] = useState(false)
  const syncingQueueRef = useRef(false)
  const signedInName = sessionUser?.displayName

  const refreshQueue = useCallback((userId?: string) => {
    const queue = readInteractionQueue()
    setQueuedInteractions(userId ? queue.filter((item) => item.userId === userId) : [])
  }, [])

  const syncInteractionQueue = useCallback(async () => {
    if (syncingQueueRef.current || !window.navigator.onLine || !sessionUser) {
      return
    }
    syncingQueueRef.current = true
    setSyncingQueue(true)
    try {
      const queue = readInteractionQueue().filter(
        (item) => item.userId === sessionUser.id && item.state === 'pending',
      )

      for (const operation of queue) {
        try {
          const response = await fetch('/api/app/interactions', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(operation),
          })
          const result = await response.json()
          if (response.ok) {
            removeQueuedInteraction(operation.idempotencyKey)
            setInteractions((current) =>
              current.some((item) => item.id === result.interaction.id)
                ? current
                : [result.interaction, ...current],
            )
          } else if (response.status >= 400 && response.status < 500) {
            updateQueuedInteraction(operation.idempotencyKey, {
              state: 'failed',
              error: result.error?.message || 'La operación necesita revisión.',
            })
          } else {
            updateQueuedInteraction(operation.idempotencyKey, {
              state: 'pending',
              error: 'El servidor no respondió. Se reintentará al recuperar conexión.',
            })
          }
        } catch {
          setIsOnline(false)
          updateQueuedInteraction(operation.idempotencyKey, {
            state: 'pending',
            error: 'Sin conexión. La operación sigue guardada en este dispositivo.',
          })
          break
        }
      }
    } finally {
      refreshQueue(sessionUser.id)
      syncingQueueRef.current = false
      setSyncingQueue(false)
    }
  }, [refreshQueue, sessionUser])

  useEffect(() => {
    try {
      const savedIds = JSON.parse(window.localStorage.getItem('nexobarrio-favorites') || '[]')
      if (Array.isArray(savedIds)) setSaved(new Set(savedIds.map(String)))
      const savedDraft = JSON.parse(window.localStorage.getItem('nexobarrio-draft') || 'null')
      if (savedDraft && typeof savedDraft === 'object') {
        setDraft(savedDraft)
        if (typeof savedDraft.kind === 'string') setPublishKind(savedDraft.kind)
      }
    } catch {
      window.localStorage.removeItem('nexobarrio-favorites')
      window.localStorage.removeItem('nexobarrio-draft')
    }
    const savedZone = window.localStorage.getItem('nexobarrio-zone')
    if (savedZone) setZone(savedZone)
    setIsOnline(window.navigator.onLine)

    if ('serviceWorker' in window.navigator && process.env.NODE_ENV === 'production') {
      void window.navigator.serviceWorker.register('/sw.js')
    }

    const timer = window.setTimeout(() => {
      setSplash(false)
      setOnboarding(!window.localStorage.getItem('nexobarrio-onboarded'))
    }, 650)

    void Promise.all([
      fetch('/api/app/listings', { cache: 'no-store' }).then((response) => response.json()),
      fetch('/api/app/session', { cache: 'no-store' }).then((response) => response.json()),
    ]).then(([listingData, sessionData]) => {
      if (Array.isArray(listingData.listings)) setLiveListings(listingData.listings)
      if (sessionData.user) setSessionUser(sessionData.user)
    })

    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    const handleOffline = () => setIsOnline(false)
    const handleOnline = () => {
      setIsOnline(true)
      void syncInteractionQueue()
    }
    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)
    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [syncInteractionQueue])

  useEffect(() => {
    if (!sessionUser) {
      setInteractions([])
      setNotifications([])
      setUnreadNotifications(0)
      refreshQueue()
      return
    }
    refreshQueue(sessionUser.id)
    void Promise.all([
      fetch('/api/app/interactions', { cache: 'no-store' }).then((response) => response.json()),
      fetch('/api/app/notifications', { cache: 'no-store' }).then((response) => response.json()),
    ]).then(([activityData, notificationData]) => {
      setInteractions(Array.isArray(activityData.interactions) ? activityData.interactions : [])
      setNotifications(
        Array.isArray(notificationData.notifications) ? notificationData.notifications : [],
      )
      setUnreadNotifications(Number(notificationData.unread) || 0)
    })
    if (window.navigator.onLine) void syncInteractionQueue()
  }, [refreshQueue, sessionUser, syncInteractionQueue])

  const filtered = useMemo(() => {
    const normalized = query.toLowerCase()
    return liveListings.filter((item) => {
      const matchesKind =
        activeKind === 'all' || item.kind === activeKind || item.modes.includes(activeKind)
      const matchesQuery =
        !normalized ||
        `${item.title} ${item.description} ${item.category}`.toLowerCase().includes(normalized)
      return matchesKind && matchesQuery
    })
  }, [activeKind, liveListings, query])

  const completeOnboarding = () => {
    window.localStorage.setItem('nexobarrio-onboarded', '1')
    window.localStorage.setItem('nexobarrio-zone', zone)
    setOnboarding(false)
  }

  const openDetail = (listing: ListingView) => {
    setSelected(listing)
    setModal('detail')
  }

  const toggleSaved = (id: string) => {
    setSaved((current) => {
      const next = new Set(current)
      next.has(id) ? next.delete(id) : next.add(id)
      window.localStorage.setItem('nexobarrio-favorites', JSON.stringify([...next]))
      return next
    })
  }

  const saveDraft = (form: HTMLFormElement) => {
    const data = new FormData(form)
    const nextDraft = {
      kind: publishKind,
      title: String(data.get('title') || ''),
      description: String(data.get('description') || ''),
      category: String(data.get('category') || ''),
      priceLabel: String(data.get('priceLabel') || ''),
      zoneName: zone,
    }
    window.localStorage.setItem('nexobarrio-draft', JSON.stringify(nextDraft))
    setDraft(nextDraft)
    setPublishMessage('Borrador guardado en este dispositivo.')
  }

  const submitListing = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    const draft = {
      kind: publishKind,
      title: String(data.get('title') || ''),
      description: String(data.get('description') || ''),
      category: String(data.get('category') || ''),
      priceLabel: String(data.get('priceLabel') || ''),
      acceptsBarter: data.get('acceptsBarter') === 'on',
      zoneName: zone,
    }

    window.localStorage.setItem('nexobarrio-draft', JSON.stringify(draft))
    setPublishing(true)
    setPublishMessage('')

    try {
      const requestData = new FormData()
      Object.entries(draft).forEach(([key, value]) => requestData.set(key, String(value)))
      const photo = data.get('photo')
      if (photo instanceof File && photo.size > 0) requestData.set('photo', photo)

      const response = await fetch('/api/app/listings', {
        method: 'POST',
        body: requestData,
      })
      const result = await response.json()
      if (!response.ok) {
        setPublishMessage(result.error?.message || 'No se confirmó la publicación.')
        return
      }
      setLiveListings((current) => [result.listing, ...current])
      setSelected(result.listing)
      window.localStorage.removeItem('nexobarrio-draft')
      setDraft(null)
      form.reset()
      setPhotoName('')
      setPublished(true)
      setPublishMessage('Publicación confirmada por el servidor.')
    } catch {
      setPublishMessage('Sin conexión. El borrador sigue guardado y no fue enviado.')
    } finally {
      setPublishing(false)
    }
  }

  if (splash) {
    return (
      <main className="splash-screen" aria-label="Cargando NexoBarrio">
        <div className="splash-orbit" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="brand-mark brand-mark--splash">N</div>
        <h1>NexoBarrio</h1>
        <p>Lo cercano nos conecta.</p>
      </main>
    )
  }

  if (onboarding) {
    return (
      <main className="onboarding">
        <div className="onboarding__visual" aria-hidden="true">
          <div className="street-grid" />
          <div className="onboard-node onboard-node--one">
            <Search size={22} />
          </div>
          <div className="onboard-node onboard-node--two">
            <Sparkles size={22} />
          </div>
          <div className="onboard-node onboard-node--three">
            <HandHeart size={22} />
          </div>
          <div className="onboard-person">
            <span>NB</span>
          </div>
        </div>
        <section className="onboarding__copy">
          <div className="brand-lockup">
            <span className="brand-mark">N</span>
            <span>NexoBarrio</span>
          </div>
          <span className="eyebrow">Bienvenido a tu red cercana</span>
          <h1>Descubre. Intercambia. Ayuda.</h1>
          <p>
            Resuelve necesidades cerca, con costos claros, ubicación aproximada y experiencias
            atribuidas.
          </p>
          <div className="onboard-points">
            <span>
              <Search size={18} /> Encuentra productos y oficios
            </span>
            <span>
              <Sparkles size={18} /> Comparte sin depender del dinero
            </span>
            <span>
              <HandHeart size={18} /> Coordina ayuda con responsabilidad
            </span>
          </div>
          <label className="zone-choice">
            <MapPin size={20} />
            <span>
              <small>Tu zona seleccionada</small>
              <strong>{zone}</strong>
            </span>
            <select
              aria-label="Elegir barrio"
              value={zone}
              onChange={(event) => setZone(event.target.value)}
            >
              <option>Centro Cívico</option>
              <option>Santa Beatriz</option>
              <option>Jesús María</option>
              <option>Lince</option>
            </select>
          </label>
          <button className="primary-button primary-button--wide" onClick={completeOnboarding}>
            Entrar al mapa <Navigation size={18} />
          </button>
          <button className="text-button" onClick={completeOnboarding}>
            Saltar tutorial
          </button>
        </section>
      </main>
    )
  }

  return (
    <main className="app-shell">
      <aside className="desktop-rail" aria-label="Navegación principal">
        <div className="brand-mark">N</div>
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={tab === id ? 'is-active' : ''}
            onClick={() => setTab(id)}
            aria-label={label}
          >
            <Icon size={22} />
            <span>{label}</span>
          </button>
        ))}
        <button className="rail-profile" onClick={() => setModal('profile')} aria-label="Perfil">
          <span>{signedInName?.slice(0, 2).toUpperCase() || 'DE'}</span>
        </button>
      </aside>

      <section className="app-main">
        <header className="topbar">
          <div className="brand-lockup topbar__brand">
            <span className="brand-mark">N</span>
            <span>NexoBarrio</span>
          </div>
          <button
            className="zone-button"
            onClick={() => setZone(zone === 'Centro Cívico' ? 'Santa Beatriz' : 'Centro Cívico')}
          >
            <MapPin size={17} />
            <span>
              <small>Explorando</small>
              {zone}
            </span>
            <ChevronDown size={16} />
          </button>
          <label className="global-search">
            <Search size={20} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="¿Qué necesitas cerca?"
              aria-label="Búsqueda global"
            />
            <kbd>⌘ K</kbd>
          </label>
          <div className="topbar__actions">
            <button className="text-icon-button" onClick={() => setModal('help')}>
              <CircleHelp size={19} />
              <span>Ayuda</span>
            </button>
            <button className="emergency-button" onClick={() => setModal('emergency')}>
              <AlertTriangle size={18} />
              <span>Emergencia</span>
            </button>
            <button
              className="round-control has-badge"
              onClick={() => setModal('notifications')}
              aria-label="Notificaciones"
            >
              <Bell size={20} />
              {unreadNotifications > 0 && <i />}
            </button>
            <button className="avatar-button" onClick={() => setModal('profile')}>
              {signedInName?.slice(0, 2).toUpperCase() || 'DE'}
            </button>
          </div>
        </header>

        {(!isOnline || queuedInteractions.length > 0) && (
          <div
            className={`connection-banner ${isOnline ? '' : 'is-offline'}`}
            role="status"
            aria-live="polite"
          >
            <WifiOff size={18} />
            <span>
              <strong>{isOnline ? 'Sincronización local' : 'Estás sin conexión'}</strong>
              <small>
                {queuedInteractions.length
                  ? `${queuedInteractions.length} operación${queuedInteractions.length === 1 ? '' : 'es'} guardada${queuedInteractions.length === 1 ? '' : 's'} en este dispositivo.`
                  : 'Puedes explorar el contenido cargado. Las acciones no se marcarán como enviadas.'}
              </small>
            </span>
            {isOnline && queuedInteractions.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  queuedInteractions.forEach((item) =>
                    updateQueuedInteraction(item.idempotencyKey, {
                      state: 'pending',
                      error: undefined,
                    }),
                  )
                  void syncInteractionQueue()
                }}
                disabled={syncingQueue}
              >
                {syncingQueue ? 'Sincronizando…' : 'Reintentar ahora'}
              </button>
            )}
          </div>
        )}

        {tab === 'map' && (
          <div className="map-layout">
            <div className="map-canvas">
              <div className="map-grid" aria-hidden="true">
                <span className="road road--one" />
                <span className="road road--two" />
                <span className="road road--three" />
                <span className="park">
                  Parque
                  <br />
                  de la Exposición
                </span>
                <span className="map-label map-label--one">Av. Arequipa</span>
                <span className="map-label map-label--two">Paseo Colón</span>
                <span className="map-label map-label--three">Centro Cívico</span>
              </div>
              {filtered.map((item) => {
                const Icon = kindIcon[item.kind] ?? MapPin
                return (
                  <button
                    key={item.id}
                    className={`map-marker map-marker--${item.kind} ${selected?.id === item.id ? 'is-selected' : ''}`}
                    style={{ left: `${item.x}%`, top: `${item.y}%` }}
                    onClick={() => {
                      setSelected(item)
                      setSheetOpen(true)
                    }}
                    aria-label={`Ver ${item.title}`}
                  >
                    <Icon size={18} />
                    <span>{item.priceLabel || kindLabel[item.kind]}</span>
                  </button>
                )
              })}
              <button className="my-location" aria-label="Centrar ubicación aproximada">
                <Navigation size={20} />
              </button>
              <div className="map-license">Mapa esquemático demo · ubicaciones aproximadas</div>
            </div>

            <section className={`discovery-sheet ${sheetOpen ? 'is-expanded' : ''}`}>
              <button
                className="sheet-handle"
                onClick={() => setSheetOpen(!sheetOpen)}
                aria-label={sheetOpen ? 'Contraer resultados' : 'Expandir resultados'}
              >
                <span />
              </button>
              <div className="sheet-heading">
                <div>
                  <span className="eyebrow">Cerca de ti</span>
                  <h1>{filtered.length} soluciones en tu zona</h1>
                </div>
                <button
                  className="filter-button"
                  onClick={() => setActiveKind(activeKind === 'all' ? 'service' : 'all')}
                >
                  <SlidersHorizontal size={18} /> Filtros {activeKind !== 'all' && <b>1</b>}
                </button>
              </div>
              <div className="filter-pills" role="list">
                {['all', 'service', 'product', 'barter', 'loan', 'help'].map((kind) => (
                  <button
                    key={kind}
                    className={activeKind === kind ? 'is-active' : ''}
                    onClick={() => setActiveKind(kind)}
                  >
                    {kind === 'all' ? 'Todo' : kindLabel[kind]}
                  </button>
                ))}
              </div>
              {filtered.length ? (
                <div className="listing-strip">
                  {filtered.map((item) => (
                    <ListingCard
                      key={item.id}
                      item={item}
                      saved={saved.has(item.id)}
                      onSave={() => toggleSaved(item.id)}
                      onOpen={() => openDetail(item)}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState onPublish={() => setTab('publish')} />
              )}
            </section>
          </div>
        )}

        {tab === 'explore' && (
          <section className="content-page">
            <div className="page-heading">
              <div>
                <span className="eyebrow">Explorar el barrio</span>
                <h1>Todo lo que está cerca</h1>
                <p>La lista usa los mismos filtros y publicaciones que el mapa.</p>
              </div>
              <button className="secondary-button" onClick={() => setTab('map')}>
                <Map size={18} /> Ver mapa
              </button>
            </div>
            <div className="explore-tools">
              <div className="filter-pills">
                {['all', 'service', 'product', 'barter', 'loan', 'gift', 'help'].map((kind) => (
                  <button
                    key={kind}
                    className={activeKind === kind ? 'is-active' : ''}
                    onClick={() => setActiveKind(kind)}
                  >
                    {kind === 'all' ? 'Todos' : kindLabel[kind]}
                  </button>
                ))}
              </div>
              <button className="filter-button">
                <ListFilter size={18} /> Ordenar: cercanía
              </button>
            </div>
            {filtered.length ? (
              <div className="listing-grid">
                {filtered.map((item) => (
                  <ListingCard
                    key={item.id}
                    item={item}
                    saved={saved.has(item.id)}
                    onSave={() => toggleSaved(item.id)}
                    onOpen={() => openDetail(item)}
                  />
                ))}
              </div>
            ) : (
              <EmptyState onPublish={() => setTab('publish')} />
            )}
          </section>
        )}

        {tab === 'publish' && (
          <section className="publish-page">
            <div className="publish-intro">
              <span className="eyebrow">Publicación rápida · 2 de 3 acciones</span>
              <h1>¿Qué quieres mover en tu barrio?</h1>
              <p>Elige modalidad, completa aquí y publica. La vista previa es opcional.</p>
            </div>
            <div className="publish-layout">
              <div className="publish-kinds" aria-label="Modalidad">
                {publishKinds.map((kind) => {
                  const Icon = kindIcon[kind] ?? Plus
                  return (
                    <button
                      key={kind}
                      className={publishKind === kind ? 'is-active' : ''}
                      onClick={() => setPublishKind(kind)}
                    >
                      <Icon size={21} />
                      <span>{kindLabel[kind]}</span>
                      {publishKind === kind && <Check size={16} />}
                    </button>
                  )
                })}
              </div>
              <form className="publish-form" onSubmit={submitListing}>
                {published ? (
                  <div className="success-state">
                    <span>
                      <Check size={28} />
                    </span>
                    <h2>Publicación confirmada</h2>
                    <p>
                      {publishMessage ||
                        'La publicación ya puede aparecer en el mapa y en la lista.'}
                    </p>
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => setPublished(false)}
                    >
                      Crear otra
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="form-section-heading">
                      <span>{kindLabel[publishKind]}</span>
                      <small>Campos esenciales</small>
                    </div>
                    <label>
                      Título
                      <input
                        name="title"
                        required
                        defaultValue={draft?.title || ''}
                        placeholder={
                          publishKind === 'service'
                            ? 'Ej. Reparación eléctrica a domicilio'
                            : 'Describe qué ofreces o necesitas'
                        }
                      />
                    </label>
                    <label>
                      Descripción
                      <textarea
                        name="description"
                        required
                        rows={4}
                        defaultValue={draft?.description || ''}
                        placeholder="Incluye condiciones, disponibilidad y detalles útiles."
                      />
                    </label>
                    <div className="form-row">
                      <label>
                        Categoría
                        <select name="category" defaultValue={draft?.category || 'Hogar'}>
                          <option>Hogar</option>
                          <option>Reparaciones</option>
                          <option>Tecnología</option>
                          <option>Transporte</option>
                          <option>Clases</option>
                        </select>
                      </label>
                      <label>
                        {publishKind === 'gift' || publishKind === 'help'
                          ? 'Costo'
                          : 'Costo orientativo'}
                        <input
                          name="priceLabel"
                          defaultValue={draft?.priceLabel || ''}
                          placeholder={
                            publishKind === 'gift' || publishKind === 'help'
                              ? 'Sin costo'
                              : 'Ej. S/ 45 por visita'
                          }
                        />
                      </label>
                    </div>
                    <label className="upload-zone">
                      <input
                        name="photo"
                        type="file"
                        accept="image/jpeg,image/png"
                        onChange={(event) => setPhotoName(event.target.files?.[0]?.name || '')}
                      />
                      <Plus size={22} />
                      <span>
                        <strong>{photoName || 'Añadir una foto'}</strong>
                        <small>
                          {photoName ? 'Toca para cambiarla' : 'JPG o PNG · máximo 5 MB'}
                        </small>
                      </span>
                    </label>
                    <label className="checkbox-row">
                      <input name="acceptsBarter" type="checkbox" />
                      <span>También acepto trueque compatible</span>
                    </label>
                    {publishMessage && (
                      <p className="form-feedback" role="status">
                        {publishMessage}
                        {!sessionUser && (
                          <>
                            {' '}
                            <Link href="/auth">Ingresar o crear cuenta</Link>
                          </>
                        )}
                      </p>
                    )}
                    <div className="publish-actions">
                      <button
                        type="button"
                        className="text-button"
                        onClick={(event) => saveDraft(event.currentTarget.form!)}
                      >
                        Guardar borrador local
                      </button>
                      <button className="primary-button" disabled={publishing}>
                        {publishing ? 'Confirmando…' : 'Publicar ahora'} <Send size={17} />
                      </button>
                    </div>
                  </>
                )}
              </form>
            </div>
          </section>
        )}

        {tab === 'community' && (
          <CommunityView onOpenListing={() => liveListings[0] && openDetail(liveListings[0])} />
        )}
        {tab === 'activity' && (
          <ActivityView
            interactions={interactions}
            signedIn={Boolean(sessionUser)}
            queuedInteractions={queuedInteractions}
            syncingQueue={syncingQueue}
            onDiscardQueue={(idempotencyKey) => {
              removeQueuedInteraction(idempotencyKey)
              refreshQueue(sessionUser?.id)
            }}
            onRetryQueue={() => {
              queuedInteractions.forEach((item) =>
                updateQueuedInteraction(item.idempotencyKey, {
                  state: 'pending',
                  error: undefined,
                }),
              )
              void syncInteractionQueue()
            }}
            onUpdated={(updated) =>
              setInteractions((current) =>
                current.map((item) => (item.id === updated.id ? updated : item)),
              )
            }
          />
        )}
      </section>

      <nav className="bottom-nav" aria-label="Navegación principal">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`${tab === id ? 'is-active' : ''} ${id === 'publish' ? 'is-publish' : ''}`}
            onClick={() => setTab(id)}
          >
            <span>
              <Icon size={id === 'publish' ? 25 : 21} />
            </span>
            <small>{label}</small>
          </button>
        ))}
      </nav>

      {modal && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setModal(null)}>
          <section
            className={`modal-panel modal-panel--${modal}`}
            role="dialog"
            aria-modal="true"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button className="modal-close" onClick={() => setModal(null)} aria-label="Cerrar">
              <X size={21} />
            </button>
            {modal === 'detail' && selected && (
              <DetailView
                item={selected}
                saved={saved.has(selected.id)}
                onSave={() => toggleSaved(selected.id)}
                userId={sessionUser?.id}
                isOnline={isOnline}
                onCreated={(interaction) =>
                  setInteractions((current) =>
                    current.some((item) => item.id === interaction.id)
                      ? current
                      : [interaction, ...current],
                  )
                }
                onQueued={() => refreshQueue(sessionUser?.id)}
              />
            )}
            {modal === 'emergency' && <EmergencyView />}
            {modal === 'profile' && (
              <ProfileView
                user={sessionUser}
                savedCount={saved.size}
                onLogout={async () => {
                  await fetch('/api/app/session', { method: 'DELETE' })
                  setSessionUser(null)
                  setModal(null)
                }}
              />
            )}
            {modal === 'help' && <HelpView />}
            {modal === 'notifications' && (
              <NotificationsView
                notifications={notifications}
                unread={unreadNotifications}
                onMarkAllRead={async () => {
                  const response = await fetch('/api/app/notifications', { method: 'PATCH' })
                  if (!response.ok) return
                  setNotifications((current) =>
                    current.map((notification) => ({ ...notification, read: true })),
                  )
                  setUnreadNotifications(0)
                }}
              />
            )}
          </section>
        </div>
      )}
    </main>
  )
}

function ListingCard({
  item,
  saved,
  onSave,
  onOpen,
}: {
  item: ListingView
  saved: boolean
  onSave: () => void
  onOpen: () => void
}) {
  return (
    <article className="listing-card">
      <button className="listing-card__media" onClick={onOpen} aria-label={`Abrir ${item.title}`}>
        {item.image ? (
          <Image src={item.image} alt="" fill sizes="(max-width: 640px) 78vw, 300px" />
        ) : (
          <span>
            <PackageOpen size={30} />
          </span>
        )}
        <span className={`kind-tag kind-tag--${item.kind}`}>{kindLabel[item.kind]}</span>
        {item.isDemo && <span className="demo-tag">Dato demo</span>}
      </button>
      <div className="listing-card__body">
        <div className="listing-card__meta">
          <span>
            <MapPin size={14} /> {item.distanceKm?.toFixed(1) ?? '—'} km
          </span>
          {item.availability === 'now' && <b>Disponible ahora</b>}
        </div>
        <button className="card-title" onClick={onOpen}>
          {item.title}
        </button>
        <div className="provider-line">
          <span className="mini-avatar">{item.initials || 'NB'}</span>
          <span>{item.providerName || 'Vecino de la zona'}</span>
          {item.rating && (
            <b>
              <Star size={13} fill="currentColor" /> {item.rating.toFixed(1)}
            </b>
          )}
        </div>
        <div className="card-footer">
          <strong>{item.priceLabel || 'Sin costo'}</strong>
          <button
            className={saved ? 'is-saved' : ''}
            onClick={onSave}
            aria-label={saved ? 'Quitar de favoritos' : 'Guardar favorito'}
          >
            <Bookmark size={19} fill={saved ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>
    </article>
  )
}

function EmptyState({ onPublish }: { onPublish: () => void }) {
  return (
    <div className="empty-state">
      <span>
        <Search size={28} />
      </span>
      <h2>No encontramos resultados cercanos</h2>
      <p>Amplía el radio o publica lo que necesitas para recibir coincidencias.</p>
      <button className="primary-button" onClick={onPublish}>
        Publicar necesidad
      </button>
    </div>
  )
}

function DetailView({
  item,
  saved,
  onSave,
  onCreated,
  onQueued,
  userId,
  isOnline,
}: {
  item: ListingView
  saved: boolean
  onSave: () => void
  onCreated: (interaction: InteractionView) => void
  onQueued: () => void
  userId?: string
  isOnline: boolean
}) {
  const [requestState, setRequestState] = useState<
    'idle' | 'sending' | 'queued' | 'confirmed' | 'error'
  >('idle')
  const [requestMessage, setRequestMessage] = useState('')
  const [details, setDetails] = useState(
    item.kind === 'barter'
      ? 'Quiero proponer un intercambio y coordinar las condiciones.'
      : 'Me interesa esta publicación y quisiera coordinar los detalles.',
  )

  const createInteraction = async () => {
    setRequestState('sending')
    setRequestMessage('')
    const type =
      item.kind === 'barter'
        ? 'barter'
        : item.kind === 'loan'
          ? 'loan'
          : item.kind === 'gift'
            ? 'gift'
            : item.kind === 'help' || item.kind === 'need'
              ? 'help'
              : 'service'
    if (!userId) {
      setRequestState('error')
      setRequestMessage('Inicia sesión para continuar.')
      return
    }
    const operation: QueuedInteraction = {
      userId,
      idempotencyKey: createIdempotencyKey(),
      listingId: item.id,
      listingTitle: item.title,
      type,
      details,
      createdAt: new Date().toISOString(),
      state: 'pending',
    }
    if (!isOnline) {
      enqueueInteraction(operation)
      onQueued()
      setRequestState('queued')
      setRequestMessage('Solicitud guardada en este dispositivo. Se enviará al recuperar conexión.')
      return
    }
    try {
      const response = await fetch('/api/app/interactions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(operation),
      })
      const result = await response.json()
      if (!response.ok) {
        if (response.status >= 500) {
          enqueueInteraction(operation)
          onQueued()
          setRequestState('queued')
          setRequestMessage(
            'El servidor no confirmó la respuesta. La solicitud quedó guardada para un reintento seguro.',
          )
          return
        }
        setRequestState('error')
        setRequestMessage(result.error?.message || 'No se confirmó la solicitud.')
        return
      }
      onCreated(result.interaction)
      setRequestState('confirmed')
      setRequestMessage('El servidor confirmó la operación y ya aparece en Actividad.')
    } catch {
      enqueueInteraction(operation)
      onQueued()
      setRequestState('queued')
      setRequestMessage(
        'Sin conexión. La solicitud quedó guardada localmente y todavía no está confirmada.',
      )
    }
  }

  return (
    <div className="detail-view">
      <div className="detail-media">
        {item.image ? (
          <Image src={item.image} alt={`Imagen de ${item.title}`} fill sizes="720px" />
        ) : (
          <PackageOpen size={42} />
        )}
        {item.isDemo && <span className="demo-tag">Datos de demostración</span>}
      </div>
      <div className="detail-content">
        <div className="detail-topline">
          <span className={`kind-tag kind-tag--${item.kind}`}>{kindLabel[item.kind]}</span>
          <button onClick={onSave} className={saved ? 'is-saved' : ''}>
            <Heart size={20} fill={saved ? 'currentColor' : 'none'} />{' '}
            {saved ? 'Guardado' : 'Guardar'}
          </button>
        </div>
        <h1>{item.title}</h1>
        <p className="detail-lead">{item.description}</p>
        <div className="detail-stats">
          <span>
            <strong>{item.priceLabel || 'Sin costo'}</strong>
            <small>Costo orientativo</small>
          </span>
          <span>
            <strong>{item.distanceKm?.toFixed(1)} km</strong>
            <small>Distancia aprox.</small>
          </span>
          <span>
            <strong>{item.availability === 'now' ? 'Ahora' : 'Coordinar'}</strong>
            <small>Disponibilidad</small>
          </span>
        </div>
        <div className="provider-card">
          <span className="provider-avatar">{item.initials || 'NB'}</span>
          <div>
            <small>Ofrece</small>
            <strong>{item.providerName || 'Vecino de la zona'}</strong>
            <span>
              <Star size={14} fill="currentColor" /> {item.rating?.toFixed(1) || 'Sin reseñas'} ·{' '}
              {item.reviewCount || 0} reseñas
            </span>
          </div>
          <button>Ver perfil</button>
        </div>
        {item.approvalAuthor && (
          <div className="approval-card">
            <ShieldCheck size={23} />
            <div>
              <strong>Visto Bueno Vecinal</strong>
              <p>“{item.approvalNote}”</p>
              <small>
                {item.approvalAuthor} · {item.approvalZone} (zona declarada)
              </small>
            </div>
          </div>
        )}
        <div className="privacy-row">
          <MapPin size={18} />
          <span>
            <strong>{item.locationLabel}</strong>
            <small>Ubicación aproximada. La dirección exacta requiere consentimiento.</small>
          </span>
        </div>
        {requestState === 'confirmed' || requestState === 'queued' ? (
          <div className={`request-confirmed ${requestState === 'queued' ? 'is-queued' : ''}`}>
            {requestState === 'queued' ? <WifiOff size={20} /> : <Check size={20} />}
            <span>
              <strong>
                {requestState === 'queued' ? 'Pendiente de conexión' : 'Solicitud confirmada'}
              </strong>
              <small>{requestMessage}</small>
            </span>
          </div>
        ) : (
          <div className="request-box">
            <label>
              Mensaje para coordinar
              <textarea
                value={details}
                onChange={(event) => setDetails(event.target.value)}
                rows={3}
              />
            </label>
            {requestMessage && (
              <p className="form-feedback" role="alert">
                {requestMessage}{' '}
                {requestMessage.includes('sesión') && <Link href="/auth">Ingresar</Link>}
              </p>
            )}
            <button
              className="primary-button primary-button--wide"
              onClick={createInteraction}
              disabled={requestState === 'sending' || details.trim().length < 8}
            >
              {requestState === 'sending'
                ? 'Confirmando…'
                : item.kind === 'barter'
                  ? 'Proponer trueque'
                  : item.kind === 'loan'
                    ? 'Solicitar préstamo'
                    : item.kind === 'help'
                      ? 'Ofrecer ayuda'
                      : 'Solicitar ahora'}{' '}
              <MessageCircle size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function CommunityView({ onOpenListing }: { onOpenListing: () => void }) {
  return (
    <section className="content-page community-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Comunidad</span>
          <h1>Círculos que sí se mueven</h1>
          <p>Recomendaciones, preguntas y ayuda de zonas cercanas.</p>
        </div>
        <button className="primary-button">
          <Plus size={17} /> Crear círculo
        </button>
      </div>
      <div className="community-layout">
        <aside className="circle-list">
          <h2>Tus círculos</h2>
          {[
            ['Centro Cívico', '124 vecinos'],
            ['Herramientas compartidas', '68 vecinos'],
            ['Mascotas del barrio', '91 vecinos'],
          ].map(([name, count], index) => (
            <button key={name} className={index === 0 ? 'is-active' : ''}>
              <span>{name.slice(0, 2).toUpperCase()}</span>
              <div>
                <strong>{name}</strong>
                <small>{count}</small>
              </div>
            </button>
          ))}
        </aside>
        <div className="community-feed">
          <div className="composer">
            <span className="avatar-button">DE</span>
            <button>Pregunta, recomienda o comparte algo…</button>
            <Plus size={19} />
          </div>
          <article className="feed-post">
            <header>
              <span className="mini-avatar">MP</span>
              <div>
                <strong>María P.</strong>
                <small>Centro Cívico · hace 18 min</small>
              </div>
              <Menu size={18} />
            </header>
            <p>
              ¿Alguien recomienda un electricista que pueda revisar una instalación antigua esta
              semana?
            </p>
            <button className="shared-listing" onClick={onOpenListing}>
              <Wrench size={23} />
              <span>
                <small>Publicación compartida</small>
                <strong>Electricista domiciliario</strong>
                <em>Ver ficha original</em>
              </span>
            </button>
            <footer>
              <button>
                <Heart size={17} /> 8
              </button>
              <button>
                <MessageCircle size={17} /> 4 respuestas
              </button>
            </footer>
          </article>
          <article className="feed-post">
            <header>
              <span className="mini-avatar mini-avatar--green">AL</span>
              <div>
                <strong>Andrés L.</strong>
                <small>Moderador · hace 1 h</small>
              </div>
              <ShieldCheck size={18} />
            </header>
            <p>
              Este sábado organizamos revisión y etiquetado de herramientas prestables. No compartan
              direcciones en comentarios.
            </p>
            <footer>
              <button>
                <Heart size={17} /> 16
              </button>
              <button>
                <MessageCircle size={17} /> 7 respuestas
              </button>
            </footer>
          </article>
        </div>
      </div>
    </section>
  )
}

function ActivityView({
  interactions,
  signedIn,
  queuedInteractions,
  syncingQueue,
  onDiscardQueue,
  onRetryQueue,
  onUpdated,
}: {
  interactions: InteractionView[]
  signedIn: boolean
  queuedInteractions: QueuedInteraction[]
  syncingQueue: boolean
  onDiscardQueue: (idempotencyKey: string) => void
  onRetryQueue: () => void
  onUpdated: (interaction: InteractionView) => void
}) {
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState('')
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [activeReviewId, setActiveReviewId] = useState<string | null>(null)
  const statusLabel: Record<string, string> = {
    requested: 'Solicitada',
    proposed: 'Propuesta',
    negotiating: 'Negociando',
    accepted: 'Aceptada',
    coordinating: 'Coordinando',
    'in-progress': 'En curso',
    'return-pending': 'Pendiente de devolución',
    completed: 'Completada',
    rejected: 'Rechazada',
    cancelled: 'Cancelada',
  }

  const updateInteraction = async (id: string, action: string) => {
    setPendingId(id)
    setActionMessage('')
    try {
      const response = await fetch(`/api/app/interactions/${id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const result = await response.json()
      if (!response.ok) {
        setActionMessage(result.error?.message || 'No se confirmó el cambio.')
        return
      }
      onUpdated(result.interaction)
      setActionMessage('Estado confirmado por el servidor.')
    } catch {
      setActionMessage('Sin conexión. El estado no cambió.')
    } finally {
      setPendingId(null)
    }
  }

  return (
    <section className="content-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Actividad</span>
          <h1>Todo lo que está en movimiento</h1>
          <p>Solicitudes, intercambios, ayudas y conversaciones en un solo lugar.</p>
        </div>
      </div>
      <div className="activity-tabs">
        <button className="is-active">Todo</button>
        <button>Servicios</button>
        <button>Trueques</button>
        <button>Ayudas</button>
        <button>Mensajes</button>
      </div>
      <div className="activity-list">
        {signedIn &&
          queuedInteractions.map((operation) => (
            <div className="activity-item activity-item--queued" key={operation.idempotencyKey}>
              <span className="activity-icon activity-icon--orange">
                <WifiOff size={20} />
              </span>
              <div>
                <strong>{operation.listingTitle}</strong>
                <p>{operation.details}</p>
                <small>{operation.error || 'Guardada solo en este dispositivo'}</small>
              </div>
              <span className={`status-pill status-pill--${operation.state}`}>
                {operation.state === 'failed' ? 'Fallida' : 'Pendiente'}
              </span>
              <div className="activity-actions">
                <button onClick={onRetryQueue} disabled={syncingQueue}>
                  {syncingQueue ? 'Sincronizando…' : 'Reintentar'}
                </button>
                <button
                  onClick={() => onDiscardQueue(operation.idempotencyKey)}
                  disabled={syncingQueue}
                >
                  Descartar
                </button>
              </div>
            </div>
          ))}
        {!signedIn ? (
          <div className="empty-state">
            <span>
              <Activity size={28} />
            </span>
            <h2>Tu actividad está protegida</h2>
            <p>Ingresa para consultar solicitudes y propuestas confirmadas.</p>
            <Link href="/auth" className="primary-button">
              Ingresar
            </Link>
          </div>
        ) : interactions.length ? (
          interactions.map((interaction) => {
            const Icon =
              interaction.type === 'barter'
                ? Sparkles
                : interaction.type === 'help'
                  ? HandHeart
                  : interaction.type === 'loan'
                    ? PackageOpen
                    : Wrench
            return (
              <div className="activity-item" key={interaction.id}>
                <span
                  className={`activity-icon ${
                    interaction.type === 'barter'
                      ? 'activity-icon--orange'
                      : interaction.type === 'help'
                        ? 'activity-icon--green'
                        : 'activity-icon--blue'
                  }`}
                >
                  <Icon size={20} />
                </span>
                <div>
                  <strong>{interaction.summary}</strong>
                  <p>{interaction.listingTitle}</p>
                  <small>
                    <Clock3 size={14} /> Estado confirmado por el servidor
                  </small>
                </div>
                <span className="status-pill">
                  {statusLabel[interaction.status] || interaction.status}
                </span>
                <div className="activity-actions">
                  <button
                    onClick={() =>
                      setActiveChatId((current) =>
                        current === interaction.id ? null : interaction.id,
                      )
                    }
                  >
                    Conversar
                  </button>
                  {interaction.role === 'provider' &&
                    ['requested', 'proposed', 'negotiating'].includes(interaction.status) && (
                      <>
                        <button
                          onClick={() => updateInteraction(interaction.id, 'accept')}
                          disabled={pendingId === interaction.id}
                        >
                          Aceptar
                        </button>
                        <button
                          onClick={() => updateInteraction(interaction.id, 'reject')}
                          disabled={pendingId === interaction.id}
                        >
                          Rechazar
                        </button>
                      </>
                    )}
                  {interaction.role === 'provider' && interaction.status === 'accepted' && (
                    <button
                      onClick={() =>
                        updateInteraction(
                          interaction.id,
                          interaction.type === 'loan' ? 'mark-delivered' : 'start',
                        )
                      }
                      disabled={pendingId === interaction.id}
                    >
                      {interaction.type === 'loan' ? 'Marcar entregado' : 'Iniciar'}
                    </button>
                  )}
                  {interaction.role === 'provider' &&
                    interaction.type === 'loan' &&
                    interaction.status === 'in-progress' && (
                      <button
                        onClick={() => updateInteraction(interaction.id, 'mark-delivered')}
                        disabled={pendingId === interaction.id}
                      >
                        Marcar entregado
                      </button>
                    )}
                  {interaction.role === 'requester' &&
                    ['requested', 'proposed', 'negotiating'].includes(interaction.status) && (
                      <button
                        onClick={() => updateInteraction(interaction.id, 'cancel')}
                        disabled={pendingId === interaction.id}
                      >
                        Cancelar
                      </button>
                    )}
                  {interaction.type !== 'loan' &&
                    ['accepted', 'coordinating', 'in-progress'].includes(interaction.status) && (
                      <button
                        onClick={() => updateInteraction(interaction.id, 'confirm-complete')}
                        disabled={pendingId === interaction.id}
                      >
                        Confirmar cierre
                      </button>
                    )}
                  {interaction.type === 'loan' &&
                    interaction.role === 'requester' &&
                    interaction.status === 'return-pending' &&
                    !interaction.returnFlow?.borrowerConfirmed && (
                      <button
                        onClick={() => updateInteraction(interaction.id, 'confirm-return')}
                        disabled={pendingId === interaction.id}
                      >
                        Confirmar que devolví
                      </button>
                    )}
                  {interaction.type === 'loan' &&
                    interaction.role === 'provider' &&
                    interaction.status === 'return-pending' && (
                      <button
                        onClick={() => updateInteraction(interaction.id, 'close-return')}
                        disabled={
                          pendingId === interaction.id || !interaction.returnFlow?.borrowerConfirmed
                        }
                      >
                        Confirmar devolución
                      </button>
                    )}
                  {interaction.status === 'completed' && (
                    <button
                      onClick={() =>
                        setActiveReviewId((current) =>
                          current === interaction.id ? null : interaction.id,
                        )
                      }
                    >
                      Evaluar
                    </button>
                  )}
                </div>
                {interaction.status === 'return-pending' && interaction.returnFlow?.dueAt && (
                  <p className="loan-due">
                    <Clock3 size={14} /> Devolución prevista:{' '}
                    {new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium' }).format(
                      new Date(interaction.returnFlow.dueAt),
                    )}
                    {interaction.returnFlow.borrowerConfirmed &&
                      ' · prestatario confirmó la entrega'}
                  </p>
                )}
                {activeChatId === interaction.id && <ChatPanel interactionId={interaction.id} />}
                {activeReviewId === interaction.id && (
                  <ReviewPanel interactionId={interaction.id} />
                )}
              </div>
            )
          })
        ) : queuedInteractions.length === 0 ? (
          <div className="empty-state">
            <span>
              <Activity size={28} />
            </span>
            <h2>Aún no tienes actividad</h2>
            <p>Solicita un servicio, préstamo, trueque o ayuda desde una ficha.</p>
          </div>
        ) : null}
      </div>
      {actionMessage && (
        <p className="form-feedback activity-feedback" role="status">
          {actionMessage}
        </p>
      )}
      <div className="offline-banner">
        <span>
          <ShieldCheck size={22} />
        </span>
        <div>
          <strong>Estados transparentes</strong>
          <p>Una acción pendiente sin red nunca se muestra como confirmada por el servidor.</p>
        </div>
      </div>
    </section>
  )
}

type MessageView = {
  id: string
  body: string
  sentByMe: boolean
  deliveryState: string
  createdAt?: string
}

function ChatPanel({ interactionId }: { interactionId: string }) {
  const [messages, setMessages] = useState<MessageView[]>([])
  const [body, setBody] = useState('')
  const [status, setStatus] = useState('Cargando conversación…')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    void fetch(`/api/app/messages?interactionId=${encodeURIComponent(interactionId)}`, {
      cache: 'no-store',
    })
      .then(async (response) => {
        const result = await response.json()
        if (!response.ok) throw new Error(result.error?.message)
        setMessages(Array.isArray(result.messages) ? result.messages : [])
        setStatus('')
      })
      .catch((error) => setStatus(error.message || 'No pudimos cargar la conversación.'))
  }, [interactionId])

  const sendMessage = async () => {
    const text = body.trim()
    if (!text) return
    setSending(true)
    setStatus('')
    try {
      const response = await fetch('/api/app/messages', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ interactionId, body: text }),
      })
      const result = await response.json()
      if (!response.ok) {
        setStatus(result.error?.message || 'El mensaje no se confirmó.')
        return
      }
      setMessages((current) => [...current, result.message])
      setBody('')
      setStatus('Mensaje enviado y confirmado.')
    } catch {
      setStatus('Sin conexión. El mensaje no se presentó como enviado.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="chat-panel">
      <div className="chat-messages" aria-live="polite">
        {messages.length ? (
          messages.map((message) => (
            <p key={message.id} className={message.sentByMe ? 'is-mine' : ''}>
              {message.body}
              <small>{message.deliveryState === 'sent' ? 'Enviado' : 'Fallido'}</small>
            </p>
          ))
        ) : (
          <span>Aún no hay mensajes. Mantén la coordinación dentro de la app.</span>
        )}
      </div>
      <div className="chat-compose">
        <input
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Escribe un mensaje"
          aria-label="Mensaje"
        />
        <button onClick={sendMessage} disabled={sending || !body.trim()}>
          <Send size={17} />
          <span>{sending ? 'Enviando' : 'Enviar'}</span>
        </button>
      </div>
      {status && (
        <small className="chat-status" role="status">
          {status}
        </small>
      )}
    </div>
  )
}

function ReviewPanel({ interactionId }: { interactionId: string }) {
  const [stars, setStars] = useState(5)
  const [comment, setComment] = useState('')
  const [status, setStatus] = useState('')
  const [sent, setSent] = useState(false)

  const submitReview = async () => {
    setStatus('')
    try {
      const response = await fetch('/api/app/reviews', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ interactionId, stars, comment }),
      })
      const result = await response.json()
      if (!response.ok) {
        setStatus(result.error?.message || 'No se confirmó la reseña.')
        return
      }
      setSent(true)
      setStatus('Reseña vinculada a la interacción completada.')
    } catch {
      setStatus('Sin conexión. La reseña no fue enviada.')
    }
  }

  return (
    <div className="review-panel">
      <strong>Evalúa esta interacción confirmada</strong>
      <div className="star-picker" aria-label={`${stars} estrellas`}>
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            onClick={() => setStars(value)}
            aria-label={`${value} estrellas`}
            disabled={sent}
          >
            <Star size={20} fill={value <= stars ? 'currentColor' : 'none'} />
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        placeholder="Cuenta brevemente cómo fue la experiencia"
        rows={3}
        disabled={sent}
      />
      <button
        className="primary-button"
        onClick={submitReview}
        disabled={sent || comment.trim().length < 5}
      >
        Publicar reseña
      </button>
      {status && <small role="status">{status}</small>}
    </div>
  )
}

function EmergencyView() {
  const [mode, setMode] = useState<'directory' | 'board'>('directory')
  return (
    <div className="emergency-view">
      <div className="emergency-header">
        <span>
          <AlertTriangle size={25} />
        </span>
        <div>
          <small>Atención responsable</small>
          <h1>Emergencia y apoyo</h1>
        </div>
      </div>
      <div className="warning-box">
        <strong>Ante peligro inmediato, contacta a servicios oficiales.</strong>
        <p>
          NexoBarrio no reemplaza atención médica, policial ni de bomberos, y no garantiza despacho.
        </p>
      </div>
      <div className="segmented">
        <button
          className={mode === 'directory' ? 'is-active' : ''}
          onClick={() => setMode('directory')}
        >
          Contactos oficiales
        </button>
        <button className={mode === 'board' ? 'is-active' : ''} onClick={() => setMode('board')}>
          Comunidad Activa
        </button>
      </div>
      {mode === 'directory' ? (
        <div className="emergency-list">
          <a href="tel:116">
            <span>116</span>
            <div>
              <strong>Bomberos del Perú</strong>
              <small>Fuente oficial · consulta local</small>
            </div>
            <Navigation size={18} />
          </a>
          <a href="tel:105">
            <span>105</span>
            <div>
              <strong>Policía Nacional</strong>
              <small>Central de emergencias</small>
            </div>
            <Navigation size={18} />
          </a>
          <a href="tel:106">
            <span>106</span>
            <div>
              <strong>SAMU</strong>
              <small>Urgencias médicas donde esté disponible</small>
            </div>
            <Navigation size={18} />
          </a>
        </div>
      ) : (
        <div className="active-community">
          <div className="board-summary">
            <span>
              <strong>3</strong>
              <small>Necesidades abiertas</small>
            </span>
            <span>
              <strong>7</strong>
              <small>Recursos demo</small>
            </span>
            <span>
              <strong>2</strong>
              <small>En coordinación</small>
            </span>
          </div>
          <article>
            <span className="kind-tag kind-tag--help">Necesidad</span>
            <h3>Agua para punto de encuentro</h3>
            <p>Zona general: Centro Cívico · hace 24 min</p>
            <small>Fuente: vecino identificado · información no confirmada</small>
            <button>Ver coordinación</button>
          </article>
          <p className="prototype-caption">
            Tablero demo. Ninguna alerta se presenta como entregada ni verificada.
          </p>
        </div>
      )}
    </div>
  )
}

function ProfileView({
  user,
  savedCount,
  onLogout,
}: {
  user: SessionUser | null
  savedCount: number
  onLogout: () => Promise<void>
}) {
  const name = user?.displayName
  return (
    <div className="profile-view">
      <div className="profile-cover">
        <div className="provider-avatar provider-avatar--large">
          {name?.slice(0, 2).toUpperCase() || 'DE'}
        </div>
      </div>
      <h1>{name || 'Cuenta de demostración'}</h1>
      <p>{user?.zoneName || 'Centro Cívico'} · zona declarada</p>
      <span className="verification-chip">
        <ShieldCheck size={16} />{' '}
        {user?.verificationStatus === 'verified'
          ? 'Identidad verificada por proceso real'
          : 'Identidad no verificada'}
      </span>
      <div className="profile-metrics">
        <span>
          <strong>0</strong>
          <small>Servicios</small>
        </span>
        <span>
          <strong>3</strong>
          <small>Ayudas demo</small>
        </span>
        <span>
          <strong>{savedCount}</strong>
          <small>Guardados</small>
        </span>
      </div>
      <div className="profile-menu">
        {[
          'Mis publicaciones',
          'Favoritos',
          'Accesibilidad',
          'Datos sin conexión',
          'Usuarios bloqueados',
          'Reglas y ayuda',
        ].map((item) => (
          <button key={item}>
            <span>{item}</span>
            <ChevronDown size={17} />
          </button>
        ))}
      </div>
      {user ? (
        <button className="secondary-button primary-button--wide" onClick={onLogout}>
          Cerrar sesión
        </button>
      ) : (
        <Link href="/auth" className="primary-button primary-button--wide">
          Ingresar o crear cuenta
        </Link>
      )}
      <p className="prototype-caption">
        Verificación con DNI/carnet: preparada para proveedor externo; no recopila documentos en
        este prototipo.
      </p>
    </div>
  )
}

function HelpView() {
  return (
    <div className="simple-modal">
      <span className="simple-modal__icon">
        <CircleHelp size={28} />
      </span>
      <span className="eyebrow">Centro de ayuda</span>
      <h1>¿Qué quieres resolver?</h1>
      <p>
        Usa el mapa para descubrir, Publicar para ofrecer o pedir, y Comunidad para coordinar con tu
        zona.
      </p>
      <div className="help-options">
        <button>
          <Map size={20} />
          <span>
            <strong>Cómo usar el mapa</strong>
            <small>Marcadores y lista sincronizados</small>
          </span>
        </button>
        <button>
          <Sparkles size={20} />
          <span>
            <strong>Intercambios seguros</strong>
            <small>Aceptación de ambas partes</small>
          </span>
        </button>
        <button>
          <HandHeart size={20} />
          <span>
            <strong>Ayuda vs. emergencia</strong>
            <small>Cuándo usar cada flujo</small>
          </span>
        </button>
      </div>
    </div>
  )
}

function NotificationsView({
  notifications,
  unread,
  onMarkAllRead,
}: {
  notifications: NotificationView[]
  unread: number
  onMarkAllRead: () => Promise<void>
}) {
  return (
    <div className="simple-modal">
      <span className="simple-modal__icon">
        <Bell size={28} />
      </span>
      <span className="eyebrow">Notificaciones internas</span>
      <h1>Novedades de tu barrio</h1>
      {unread > 0 && (
        <button className="text-button notification-read-all" onClick={onMarkAllRead}>
          Marcar {unread} como leídas
        </button>
      )}
      <div className="notification-list">
        {notifications.length ? (
          notifications.map((notification) => {
            const Icon =
              notification.kind === 'message'
                ? MessageCircle
                : notification.kind === 'reminder'
                  ? Clock3
                  : Sparkles
            return (
              <article key={notification.id} className={notification.read ? '' : 'is-unread'}>
                <span className="activity-icon activity-icon--green">
                  <Icon size={18} />
                </span>
                <div>
                  <strong>{notification.title}</strong>
                  <p>{notification.body}</p>
                  <small>
                    {notification.deliveryState === 'internal'
                      ? 'Aviso interno confirmado'
                      : notification.deliveryState}
                  </small>
                </div>
              </article>
            )
          })
        ) : (
          <div className="empty-state">
            <span>
              <Bell size={28} />
            </span>
            <h2>Sin avisos nuevos</h2>
            <p>Las solicitudes, mensajes y devoluciones aparecerán aquí.</p>
          </div>
        )}
      </div>
      <p className="prototype-caption">
        Push externo no configurado. La bandeja interna sí usa eventos persistentes.
      </p>
    </div>
  )
}
