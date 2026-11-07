'use client'

import Image from 'next/image'
import Link from 'next/link'
import {
  Activity,
  AlertTriangle,
  Award,
  BarChart3,
  Bell,
  Bookmark,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  Compass,
  CreditCard,
  Eye,
  HandHeart,
  Heart,
  ListFilter,
  Map,
  MapPin,
  Menu,
  MessageCircle,
  Mic,
  Navigation,
  PackageOpen,
  Plus,
  RefreshCw,
  Repeat,
  Search,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  Truck,
  Users,
  Volume2,
  Wifi,
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
  bio?: string
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

type AccessibilityPrefs = {
  fontScale: 'normal' | 'large' | 'xlarge'
  highContrast: boolean
  reducedMotion: boolean
  simplified: boolean
}

type Tab = 'map' | 'explore' | 'publish' | 'community' | 'activity'
type Modal =
  | 'detail'
  | 'emergency'
  | 'profile'
  | 'help'
  | 'notifications'
  | 'provider-profile'
  | 'impact'
  | null

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

const QUICK_GUIDES = [
  {
    code: 'A',
    title: 'Contratar un oficio de confianza',
    desc: 'Revisa técnicos cercanos con «Visto Bueno Vecinal», consulta su portafolio y solicita atención.',
  },
  {
    code: 'B',
    title: 'Hacer un trueque directo',
    desc: 'Compara propuestas con fotografía, conversa con tu vecino y acuerda el intercambio sin usar dinero.',
  },
  {
    code: 'C',
    title: 'Compartir habilidades y Banco de Tiempo',
    desc: 'Ofrece o recibe clases y asesorías intercambiando horas con otros vecinos de tu zona.',
  },
  {
    code: 'D',
    title: 'Trueque inteligente entre 3 vecinos',
    desc: 'Descubre cadenas de intercambio donde tres vecinos conectan lo que ofrecen con lo que buscan.',
  },
  {
    code: 'E',
    title: 'Pedir prestada una herramienta',
    desc: 'Usa la Biblioteca de Herramientas del barrio por 1 a 3 días sin gastar en comprar equipo nuevo.',
  },
  {
    code: 'F',
    title: 'Ver quién está disponible ahora',
    desc: 'Activa el filtro de atención inmediata para urgencias del hogar en tu cuadra.',
  },
  {
    code: 'G',
    title: 'Participar en los círculos de tu barrio',
    desc: 'Conversa en el muro vecinal, pide datos de confianza y comparte recomendaciones.',
  },
  {
    code: 'H',
    title: 'Apoyar a un vecino o adulto mayor',
    desc: 'Únete como voluntario a solicitudes solidarias y acompaña su progreso paso a paso.',
  },
  {
    code: 'I',
    title: 'Directorio de Emergencia y Comunidad Activa',
    desc: 'Accede rápido al 116, 105 y 106 o coordina puntos de apoyo y suministros en el barrio.',
  },
  {
    code: 'K',
    title: 'Pedidos y servicios en grupo',
    desc: 'Júntate con vecinos de tu edificio o cuadra para coordinar mantenimientos en conjunto.',
  },
  {
    code: 'L',
    title: 'Impacto Vecinal y tendencias',
    desc: 'Mira cuánto ha ahorrado y reutilizado tu comunidad y qué oficios se buscan más.',
  },
]

function speakText(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'es-PE'
  utterance.rate = 1
  window.speechSynthesis.speak(utterance)
}

export function NeighborhoodApp({ listings }: { listings: ListingView[] }) {
  const [splash, setSplash] = useState(true)
  const [onboarding, setOnboarding] = useState(false)
  const [onboardStep, setOnboardStep] = useState(0)
  const [tab, setTab] = useState<Tab>('map')
  const [modal, setModal] = useState<Modal>(null)
  const [selected, setSelected] = useState<ListingView | null>(listings[0] ?? null)
  const [query, setQuery] = useState('')
  const [activeKind, setActiveKind] = useState('all')
  const [onlyAvailableNow, setOnlyAvailableNow] = useState(false)
  const [radiusKm, setRadiusKm] = useState<number>(5)
  const [sortBy, setSortBy] = useState<'distance' | 'rating' | 'recent'>('distance')
  const [saved, setSaved] = useState<Set<string>>(new Set())
  const [sheetOpen, setSheetOpen] = useState(false)
  const [publishKind, setPublishKind] = useState('service')
  const [published, setPublished] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
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
  const [browserOnline, setBrowserOnline] = useState(true)
  const [simulateOffline, setSimulateOffline] = useState(false)
  const [queuedInteractions, setQueuedInteractions] = useState<QueuedInteraction[]>([])
  const [syncingQueue, setSyncingQueue] = useState(false)
  const [activeScenario, setActiveScenario] = useState<string | null>(null)
  const [listeningVoice, setListeningVoice] = useState(false)
  const [exploreSubView, setExploreSubView] = useState<'list' | 'match' | 'library'>('list')
  const [communitySubView, setCommunitySubView] = useState<'circles' | 'juntos' | 'routes'>(
    'circles',
  )
  const [emergencyInitialMode, setEmergencyInitialMode] = useState<'directory' | 'board'>(
    'directory',
  )
  const [a11y, setA11y] = useState<AccessibilityPrefs>({
    fontScale: 'normal',
    highContrast: false,
    reducedMotion: false,
    simplified: false,
  })

  const isOnline = browserOnline && !simulateOffline
  const syncingQueueRef = useRef(false)
  const signedInName = sessionUser?.displayName

  const refreshQueue = useCallback((userId?: string) => {
    const queue = readInteractionQueue()
    setQueuedInteractions(userId ? queue.filter((item) => item.userId === userId) : queue)
  }, [])

  const syncInteractionQueue = useCallback(async () => {
    if (syncingQueueRef.current || !isOnline || !sessionUser) {
      return
    }
    syncingQueueRef.current = true
    setSyncingQueue(true)
    try {
      const queue = readInteractionQueue().filter(
        (item) =>
          (item.userId === sessionUser.id || item.userId === 'demo-local') &&
          item.state === 'pending',
      )

      for (const operation of queue) {
        try {
          const response = await fetch('/api/app/interactions', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ ...operation, userId: sessionUser.id }),
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
  }, [isOnline, refreshQueue, sessionUser])

  useEffect(() => {
    try {
      const savedIds = JSON.parse(window.localStorage.getItem('nexobarrio-favorites') || '[]')
      if (Array.isArray(savedIds)) setSaved(new Set(savedIds.map(String)))
      const savedDraft = JSON.parse(window.localStorage.getItem('nexobarrio-draft') || 'null')
      if (savedDraft && typeof savedDraft === 'object') {
        setDraft(savedDraft)
        if (typeof savedDraft.kind === 'string') setPublishKind(savedDraft.kind)
      }
      const savedA11y = JSON.parse(window.localStorage.getItem('nexobarrio-a11y') || 'null')
      if (savedA11y && typeof savedA11y === 'object') {
        setA11y((prev) => ({ ...prev, ...savedA11y }))
      }
    } catch {
      window.localStorage.removeItem('nexobarrio-favorites')
      window.localStorage.removeItem('nexobarrio-draft')
    }
    const savedZone = window.localStorage.getItem('nexobarrio-zone')
    if (savedZone) setZone(savedZone)
    setBrowserOnline(window.navigator.onLine)

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
      if (Array.isArray(listingData.listings) && listingData.listings.length > 0) {
        setLiveListings(listingData.listings)
        setSelected(listingData.listings[0])
      }
      if (sessionData.user) setSessionUser(sessionData.user)
    })

    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    const handleOffline = () => setBrowserOnline(false)
    const handleOnline = () => {
      setBrowserOnline(true)
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
    if (isOnline) void syncInteractionQueue()
  }, [isOnline, refreshQueue, sessionUser, syncInteractionQueue])

  const updateA11y = (patch: Partial<AccessibilityPrefs>) => {
    setA11y((prev) => {
      const next = { ...prev, ...patch }
      window.localStorage.setItem('nexobarrio-a11y', JSON.stringify(next))
      return next
    })
  }

  const startVoiceDictation = () => {
    const SpeechRecognitionCtor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognitionCtor) {
      setQuery('electricista')
      return
    }
    try {
      const recognition = new SpeechRecognitionCtor()
      recognition.lang = 'es-PE'
      recognition.interimResults = false
      setListeningVoice(true)
      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript || ''
        if (transcript) setQuery(transcript)
        setListeningVoice(false)
      }
      recognition.onerror = () => setListeningVoice(false)
      recognition.onend = () => setListeningVoice(false)
      recognition.start()
    } catch {
      setListeningVoice(false)
    }
  }

  const filtered = useMemo(() => {
    const normalized = query.toLowerCase().trim()
    const list = liveListings.filter((item) => {
      const matchesKind =
        activeKind === 'all' || item.kind === activeKind || item.modes.includes(activeKind)
      const matchesNow = !onlyAvailableNow || item.availability === 'now'
      const matchesRadius = typeof item.distanceKm !== 'number' || item.distanceKm <= radiusKm
      const matchesQuery =
        !normalized ||
        `${item.title} ${item.description} ${item.category} ${item.providerName || ''}`
          .toLowerCase()
          .includes(normalized)
      return matchesKind && matchesNow && matchesRadius && matchesQuery
    })

    return [...list].sort((a, b) => {
      if (sortBy === 'rating') return (b.rating ?? 0) - (a.rating ?? 0)
      if (sortBy === 'distance') return (a.distanceKm ?? 0) - (b.distanceKm ?? 0)
      return 0
    })
  }, [activeKind, liveListings, onlyAvailableNow, query, radiusKm, sortBy])

  const completeOnboarding = () => {
    window.localStorage.setItem('nexobarrio-onboarded', '1')
    window.localStorage.setItem('nexobarrio-zone', zone)
    setOnboarding(false)
  }

  const openDetail = (listing: ListingView) => {
    setSelected(listing)
    setModal('detail')
  }

  const triggerScenario = (code: string) => {
    setActiveScenario(code)
    setOnlyAvailableNow(false)
    setQuery('')
    setActiveKind('all')

    const findByKind = (k: string) =>
      liveListings.find((item) => item.kind === k || item.modes.includes(k)) || liveListings[0]

    switch (code) {
      case 'A': {
        const elec =
          liveListings.find((i) => i.category.toLowerCase().includes('electric')) ||
          findByKind('service')
        setTab('map')
        if (elec) {
          setSelected(elec)
          setModal('detail')
        }
        break
      }
      case 'B': {
        const bike = findByKind('barter')
        setTab('map')
        if (bike) {
          setSelected(bike)
          setModal('detail')
        }
        break
      }
      case 'C': {
        const skill = findByKind('skill')
        setTab('explore')
        setExploreSubView('list')
        if (skill) {
          setSelected(skill)
          setModal('detail')
        }
        break
      }
      case 'D': {
        setModal(null)
        setTab('explore')
        setExploreSubView('match')
        break
      }
      case 'E': {
        const loan = findByKind('loan')
        setTab('explore')
        setExploreSubView('library')
        if (loan) {
          setSelected(loan)
          setModal('detail')
        }
        break
      }
      case 'F': {
        setModal(null)
        setTab('map')
        setOnlyAvailableNow(true)
        setSheetOpen(true)
        break
      }
      case 'G': {
        setModal(null)
        setTab('community')
        setCommunitySubView('circles')
        break
      }
      case 'H': {
        const help = findByKind('help')
        setTab('map')
        if (help) {
          setSelected(help)
          setModal('detail')
        }
        break
      }
      case 'I': {
        setEmergencyInitialMode('board')
        setModal('emergency')
        break
      }
      case 'J': {
        setSimulateOffline(true)
        setModal(null)
        setTab('activity')
        break
      }
      case 'K': {
        setModal(null)
        setTab('community')
        setCommunitySubView('juntos')
        break
      }
      case 'L': {
        setModal('impact')
        break
      }
    }
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
    setPublishMessage('Borrador guardado en este dispositivo (disponible sin conexión).')
  }

  const submitListing = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    const nextDraft = {
      kind: publishKind,
      title: String(data.get('title') || ''),
      description: String(data.get('description') || ''),
      category: String(data.get('category') || ''),
      priceLabel: String(data.get('priceLabel') || ''),
      acceptsBarter: data.get('acceptsBarter') === 'on',
      zoneName: zone,
    }

    window.localStorage.setItem('nexobarrio-draft', JSON.stringify(nextDraft))
    setDraft(nextDraft)

    if (!isOnline) {
      setPublishMessage(
        'Estás sin conexión. Tu borrador quedó guardado localmente y NO se presenta como publicado hasta confirmar con el servidor.',
      )
      return
    }

    setPublishing(true)
    setPublishMessage('')

    try {
      const requestData = new FormData()
      Object.entries(nextDraft).forEach(([key, value]) => requestData.set(key, String(value)))
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
      setPublishMessage('Publicación confirmada por el servidor y visible en mapa y lista.')
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
    const steps = [
      {
        badge: 'Paso 1 de 3 · Descubrir',
        title: 'Encuentra oficios y productos con «Visto Bueno Vecinal»',
        body: 'Ubica en el mapa electricistas, gasfiteros y objetos a pocas cuadras, respaldados por experiencias reales de vecinos de tu misma zona.',
      },
      {
        badge: 'Paso 2 de 3 · Intercambiar sin dinero',
        title: 'Trueque, Biblioteca de Herramientas y Banco de Tiempo',
        body: 'Pide prestado un taladro en vez de comprarlo, propón intercambios directos o entre varios vecinos y comparte habilidades por horas.',
      },
      {
        badge: 'Paso 3 de 3 · Ayudar y estar prevenidos',
        title: 'Ayuda comunitaria y Directorio de Emergencia',
        body: 'Coordina apoyo vecinal, consulta rápido los números de emergencia (116, 105, 106) y guarda tus borradores o solicitudes incluso sin señal.',
      },
    ]
    const currentStep = steps[onboardStep] ?? steps[0]

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
          <span className="eyebrow">{currentStep.badge}</span>
          <h1>{currentStep.title}</h1>
          <p>{currentStep.body}</p>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {[0, 1, 2].map((idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setOnboardStep(idx)}
                className={`progress-step ${onboardStep === idx ? 'is-current' : 'is-done'}`}
              >
                {idx === 0 ? '1. Descubrir' : idx === 1 ? '2. Intercambiar' : '3. Ayudar'}
              </button>
            ))}
            <button
              type="button"
              className="tts-btn"
              onClick={() => speakText(`${currentStep.title}. ${currentStep.body}`)}
              aria-label="Escuchar explicación en voz alta"
            >
              <Volume2 size={15} /> Escuchar
            </button>
          </div>

          <label className="zone-choice">
            <MapPin size={20} />
            <span>
              <small>Tu barrio o zona</small>
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
              <option>Breña</option>
            </select>
          </label>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {onboardStep < 2 ? (
              <button
                className="primary-button"
                type="button"
                onClick={() => setOnboardStep((s) => s + 1)}
              >
                Siguiente paso
              </button>
            ) : null}
            <button className="primary-button primary-button--wide" onClick={completeOnboarding}>
              Entrar al mapa principal <Navigation size={18} />
            </button>
          </div>
          <button className="text-button" onClick={completeOnboarding}>
            Saltar bienvenida
          </button>
        </section>
      </main>
    )
  }

  return (
    <main
      className="app-shell"
      data-font-scale={a11y.fontScale}
      data-high-contrast={String(a11y.highContrast)}
      data-reduced-motion={String(a11y.reducedMotion)}
      data-simplified={String(a11y.simplified)}
    >
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
        <button
          className="rail-profile"
          onClick={() => setModal('impact')}
          aria-label="Impacto del barrio"
          title="Impacto Vecinal"
        >
          <BarChart3 size={20} />
        </button>
        <button className="rail-profile" onClick={() => setModal('profile')} aria-label="Perfil">
          <span>{signedInName?.slice(0, 2).toUpperCase() || 'NB'}</span>
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
            onClick={() =>
              setZone((z) =>
                z === 'Centro Cívico'
                  ? 'Santa Beatriz'
                  : z === 'Santa Beatriz'
                    ? 'Jesús María'
                    : 'Centro Cívico',
              )
            }
          >
            <MapPin size={17} />
            <span>
              <small>Tu barrio</small>
              {zone}
            </span>
            <ChevronDown size={16} />
          </button>
          <label className="global-search">
            <Search size={20} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar electricista, taladro, bicicleta, ayuda…"
              aria-label="Búsqueda global"
            />
            <button
              type="button"
              className={`voice-btn ${listeningVoice ? 'is-listening' : ''}`}
              onClick={startVoiceDictation}
              aria-label="Dictar búsqueda por voz"
              title="Dictar búsqueda por voz"
            >
              <Mic size={15} />
              <span>{listeningVoice ? 'Escuchando…' : 'Voz'}</span>
            </button>
          </label>
          <div className="topbar__actions">
            <button className="text-icon-button" onClick={() => setModal('impact')}>
              <BarChart3 size={19} />
              <span>Impacto</span>
            </button>
            <button className="text-icon-button" onClick={() => setModal('help')}>
              <CircleHelp size={19} />
              <span>Ayuda</span>
            </button>
            <button
              className="emergency-button"
              onClick={() => {
                setEmergencyInitialMode('directory')
                setModal('emergency')
              }}
            >
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
            <button
              className="avatar-button"
              onClick={() => setModal('profile')}
              aria-label="Abrir perfil y preferencias"
            >
              {signedInName?.slice(0, 2).toUpperCase() || 'NB'}
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
              <strong>
                {isOnline ? 'Conexión restablecida' : 'Estás navegando sin conexión a internet'}
              </strong>
              <small>
                {queuedInteractions.length
                  ? `Tienes ${queuedInteractions.length} solicitud${queuedInteractions.length === 1 ? '' : 'es'} guardada${queuedInteractions.length === 1 ? '' : 's'} en tu dispositivo lista${queuedInteractions.length === 1 ? '' : 's'} para enviarse.`
                  : 'Puedes seguir viendo las publicaciones guardadas, tus favoritos y los teléfonos de emergencia (116, 105, 106).'}
              </small>
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              {simulateOffline && (
                <button type="button" onClick={() => setSimulateOffline(false)}>
                  Volver a conectar
                </button>
              )}
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
                  {syncingQueue ? 'Enviando…' : 'Enviar pendientes ahora'}
                </button>
              )}
            </div>
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
                <span className="map-label map-label--three">{zone}</span>
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
                    aria-label={`Ver ${item.title} (${item.priceLabel || kindLabel[item.kind]})`}
                  >
                    <Icon size={18} />
                    <span>{item.priceLabel || kindLabel[item.kind]}</span>
                  </button>
                )
              })}
              <button
                className="my-location"
                aria-label="Centrar ubicación"
                onClick={() => setSheetOpen(true)}
              >
                <Navigation size={20} />
              </button>
              <div className="map-license">
                Mapa del barrio · Ubicaciones referenciales por privacidad · Radio: {radiusKm} km
              </div>
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
                  <span className="eyebrow">
                    {onlyAvailableNow
                      ? '⚡ Atención inmediata en tu zona'
                      : `Cerca de ti en ${zone}`}
                  </span>
                  <h1>
                    {filtered.length} opciones a menos de {radiusKm} km
                  </h1>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    className={`filter-button ${onlyAvailableNow ? 'is-active' : ''}`}
                    onClick={() => setOnlyAvailableNow((v) => !v)}
                    title="Mostrar solo vecinos y técnicos disponibles ahora mismo"
                  >
                    <Clock3 size={16} /> Ahora {onlyAvailableNow && <b>ON</b>}
                  </button>
                  <button
                    className="filter-button"
                    onClick={() =>
                      setRadiusKm((r) => (r === 1 ? 3 : r === 3 ? 5 : r === 5 ? 10 : 1))
                    }
                    title="Cambiar radio de distancia (1, 3, 5, 10 km)"
                  >
                    <SlidersHorizontal size={16} /> {radiusKm} km
                  </button>
                </div>
              </div>
              <div className="filter-pills" role="list">
                {['all', 'service', 'product', 'barter', 'loan', 'skill', 'gift', 'help'].map(
                  (kind) => (
                    <button
                      key={kind}
                      className={activeKind === kind ? 'is-active' : ''}
                      onClick={() => setActiveKind(kind)}
                    >
                      {kind === 'all' ? 'Todo' : kindLabel[kind]}
                    </button>
                  ),
                )}
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
                <EmptyState
                  onPublish={() => setTab('publish')}
                  onExpandRadius={() => setRadiusKm(10)}
                />
              )}
            </section>
          </div>
        )}

        {tab === 'explore' && (
          <section className="content-page">
            <div className="page-heading">
              <div>
                <span className="eyebrow">Explorar en {zone}</span>
                <h1>Todo lo que tu barrio ofrece y comparte</h1>
                <p>
                  Servicios recomendados, intercambios inteligentes y préstamo de herramientas entre
                  vecinos.
                </p>
              </div>
              <button className="secondary-button" onClick={() => setTab('map')}>
                <Map size={18} /> Ver en mapa
              </button>
            </div>

            <div className="sub-tabs" role="tablist">
              <button
                type="button"
                className={exploreSubView === 'list' ? 'is-active' : ''}
                onClick={() => setExploreSubView('list')}
              >
                <Compass size={16} /> Catálogo del barrio ({filtered.length})
              </button>
              <button
                type="button"
                className={exploreSubView === 'match' ? 'is-active' : ''}
                onClick={() => setExploreSubView('match')}
              >
                <Repeat size={16} /> Trueque Inteligente (3 vecinos)
              </button>
              <button
                type="button"
                className={exploreSubView === 'library' ? 'is-active' : ''}
                onClick={() => setExploreSubView('library')}
              >
                <PackageOpen size={16} /> Biblioteca de Herramientas y Banco de Tiempo
              </button>
            </div>

            {exploreSubView === 'match' && (
              <TriangularBarterPanel
                onOpenListing={(kind) => {
                  const found =
                    liveListings.find((item) => item.kind === kind) || liveListings[0]
                  if (found) openDetail(found)
                }}
              />
            )}

            {exploreSubView === 'library' && (
              <div className="feature-panel">
                <div>
                  <span className="eyebrow">Economía Colaborativa</span>
                  <h2>Biblioteca de Herramientas y Banco de Tiempo</h2>
                  <p>
                    Ahorra pidiendo prestada una herramienta cuando solo la necesitas por un par de
                    días, o intercambia horas de enseñanza y apoyo con tus vecinos.
                  </p>
                </div>
                <div className="listing-grid">
                  {liveListings
                    .filter(
                      (item) =>
                        item.kind === 'loan' ||
                        item.kind === 'skill' ||
                        item.kind === 'gift' ||
                        item.modes.includes('loan'),
                    )
                    .map((item) => (
                      <ListingCard
                        key={item.id}
                        item={item}
                        saved={saved.has(item.id)}
                        onSave={() => toggleSaved(item.id)}
                        onOpen={() => openDetail(item)}
                      />
                    ))}
                </div>
              </div>
            )}

            {exploreSubView === 'list' && (
              <>
                <div className="explore-tools">
                  <div className="filter-pills">
                    {[
                      'all',
                      'service',
                      'product',
                      'barter',
                      'loan',
                      'skill',
                      'gift',
                      'need',
                      'help',
                    ].map((kind) => (
                      <button
                        key={kind}
                        className={activeKind === kind ? 'is-active' : ''}
                        onClick={() => setActiveKind(kind)}
                      >
                        {kind === 'all' ? 'Todos' : kindLabel[kind]}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      className={`filter-button ${onlyAvailableNow ? 'is-active' : ''}`}
                      onClick={() => setOnlyAvailableNow((v) => !v)}
                    >
                      <Clock3 size={16} /> Disponible ahora {onlyAvailableNow ? '(Activo)' : ''}
                    </button>
                    <button
                      className="filter-button"
                      onClick={() =>
                        setSortBy((s) =>
                          s === 'distance' ? 'rating' : s === 'rating' ? 'recent' : 'distance',
                        )
                      }
                    >
                      <ListFilter size={18} /> Ordenar:{' '}
                      {sortBy === 'distance'
                        ? 'Cercanía'
                        : sortBy === 'rating'
                          ? 'Mejor valorados'
                          : 'Recientes'}
                    </button>
                  </div>
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
                  <EmptyState
                    onPublish={() => setTab('publish')}
                    onExpandRadius={() => setRadiusKm(10)}
                  />
                )}
              </>
            )}
          </section>
        )}

        {tab === 'publish' && (
          <section className="publish-page">
            <div className="publish-intro">
              <span className="eyebrow">Nueva publicación en {zone}</span>
              <h1>¿Qué quieres ofrecer, compartir o pedir hoy?</h1>
              <p>
                Elige el tipo de publicación, completa los datos esenciales y compártelo con los
                vecinos de tu zona.
              </p>
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
                    <h2>¡Listo! Ya está publicado en tu barrio</h2>
                    <p>
                      {publishMessage ||
                        'Tus vecinos ya pueden verlo en el mapa y en el catálogo de tu zona.'}
                    </p>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                      <button
                        type="button"
                        className="primary-button"
                        onClick={() => {
                          setPublished(false)
                          setTab('map')
                        }}
                      >
                        Ver en el mapa
                      </button>
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => setPublished(false)}
                      >
                        Crear otra publicación
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="form-section-heading">
                      <span>Modalidad: {kindLabel[publishKind]}</span>
                      <small>Visible en {zone}</small>
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
                            : publishKind === 'barter'
                              ? 'Ej. Cambio bicicleta aro 26 por taladro'
                              : publishKind === 'loan'
                                ? 'Ej. Presto escalera de aluminio por 2 días'
                                : 'Describe qué ofreces o necesitas'
                        }
                      />
                    </label>
                    <label>
                      Descripción y condiciones
                      <textarea
                        name="description"
                        required
                        rows={4}
                        defaultValue={draft?.description || ''}
                        placeholder={
                          publishKind === 'loan'
                            ? 'Indica plazo máximo de préstamo y condiciones de cuidado y devolución.'
                            : 'Incluye disponibilidad, qué incluye o qué necesitas a cambio.'
                        }
                      />
                    </label>
                    <div className="form-row">
                      <label>
                        Categoría
                        <select name="category" defaultValue={draft?.category || 'Electricidad'}>
                          <option>Electricidad</option>
                          <option>Plomería</option>
                          <option>Herramientas</option>
                          <option>Hogar</option>
                          <option>Reparaciones</option>
                          <option>Tecnología</option>
                          <option>Transporte</option>
                          <option>Clases</option>
                          <option>Alimentación</option>
                          <option>Mascotas</option>
                        </select>
                      </label>
                      <label>
                        {publishKind === 'gift' || publishKind === 'help'
                          ? 'Modalidad solidaria'
                          : publishKind === 'loan'
                            ? 'Plazo de préstamo'
                            : 'Costo o equivalencia orientativa'}
                        <input
                          name="priceLabel"
                          defaultValue={draft?.priceLabel || ''}
                          placeholder={
                            publishKind === 'gift' || publishKind === 'help'
                              ? 'Sin costo (Solidario)'
                              : publishKind === 'loan'
                                ? 'Préstamo gratis por 2 días'
                                : 'Ej. S/ 40 por visita o Trueque'
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
                        <strong>{photoName || 'Añadir fotografía (JPG/PNG)'}</strong>
                        <small>
                          {photoName
                            ? 'Archivo seleccionado · toca para cambiar'
                            : 'Recomendada para objetos, trueques y portafolio · máx. 5 MB'}
                        </small>
                      </span>
                    </label>
                    <label className="checkbox-row">
                      <input name="acceptsBarter" type="checkbox" />
                      <span>
                        También acepto propuestas de trueque o intercambio de horas (Banco de Tiempo)
                      </span>
                    </label>

                    {showPreview && (
                      <div className="doc-verify-box" role="region" aria-label="Vista previa">
                        <strong>Vista previa de tu publicación:</strong>
                        <p>
                          Se mostrará en <b>{zone}</b> con ubicación referencial por privacidad bajo
                          la modalidad <b>{kindLabel[publishKind]}</b>.
                        </p>
                      </div>
                    )}

                    {publishMessage && (
                      <p className="form-feedback" role="status">
                        {publishMessage}
                        {!sessionUser && (
                          <>
                            {' '}
                            <Link href="/auth">Iniciar sesión</Link>
                          </>
                        )}
                      </p>
                    )}
                    <div className="publish-actions">
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="text-button"
                          onClick={(event) => saveDraft(event.currentTarget.form!)}
                        >
                          Guardar borrador
                        </button>
                        <button
                          type="button"
                          className="text-button"
                          onClick={() => setShowPreview((p) => !p)}
                        >
                          <Eye size={15} /> {showPreview ? 'Ocultar vista previa' : 'Vista previa'}
                        </button>
                      </div>
                      <button className="primary-button" disabled={publishing}>
                        {publishing ? 'Publicando…' : 'Publicar ahora'} <Send size={17} />
                      </button>
                    </div>
                  </>
                )}
              </form>
            </div>
          </section>
        )}

        {tab === 'community' && (
          <CommunityView
            subView={communitySubView}
            onChangeSubView={setCommunitySubView}
            zone={zone}
            onOpenListing={() => liveListings[0] && openDetail(liveListings[0])}
          />
        )}

        {tab === 'activity' && (
          <ActivityView
            interactions={interactions}
            signedIn={Boolean(sessionUser)}
            queuedInteractions={queuedInteractions}
            syncingQueue={syncingQueue}
            isOnline={isOnline}
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
                onOpenProviderProfile={() => setModal('provider-profile')}
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
            {modal === 'provider-profile' && selected && (
              <ProviderProfileModal
                item={selected}
                onBack={() => setModal('detail')}
                onRequest={() => setModal('detail')}
              />
            )}
            {modal === 'emergency' && <EmergencyView initialMode={emergencyInitialMode} />}
            {modal === 'impact' && (
              <ImpactAndRadarView
                listingsCount={liveListings.length}
                interactionsCount={interactions.length}
                zone={zone}
                onSelectCategory={(cat) => {
                  setQuery(cat)
                  setModal(null)
                  setTab('explore')
                  setExploreSubView('list')
                }}
              />
            )}
            {modal === 'profile' && (
              <ProfileView
                user={sessionUser}
                savedItems={liveListings.filter((item) => saved.has(item.id))}
                a11y={a11y}
                onUpdateA11y={updateA11y}
                onRepeatTutorial={() => {
                  setModal(null)
                  setOnboardStep(0)
                  setOnboarding(true)
                }}
                onUserUpdated={(updatedUser) => setSessionUser(updatedUser)}
                onOpenSavedItem={(item) => {
                  setSelected(item)
                  setModal('detail')
                }}
                onLogout={async () => {
                  await fetch('/api/app/session', { method: 'DELETE' })
                  setSessionUser(null)
                  setModal(null)
                }}
              />
            )}
            {modal === 'help' && (
              <HelpView
                onTriggerScenario={(code) => triggerScenario(code)}
                onRepeatTutorial={() => {
                  setModal(null)
                  setOnboardStep(0)
                  setOnboarding(true)
                }}
              />
            )}
            {modal === 'notifications' && (
              <NotificationsView
                notifications={notifications}
                unread={unreadNotifications}
                onOpenActivity={() => {
                  setModal(null)
                  setTab('activity')
                }}
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
      </button>
      <div className="listing-card__body">
        <div className="listing-card__meta">
          <span>
            <MapPin size={14} /> {item.distanceKm?.toFixed(2) ?? '0.4'} km
          </span>
          {item.availability === 'now' && <b>⚡ Disponible ahora</b>}
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
        {item.approvalAuthor && (
          <small style={{ color: 'var(--green)', fontWeight: 700, fontSize: '11px' }}>
            ✓ Visto Bueno Vecinal ({item.approvalAuthor})
          </small>
        )}
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

function EmptyState({
  onPublish,
  onExpandRadius,
}: {
  onPublish: () => void
  onExpandRadius: () => void
}) {
  return (
    <div className="empty-state">
      <span>
        <Search size={28} />
      </span>
      <h2>No encontramos resultados en este radio</h2>
      <p>
        Amplía el radio de búsqueda a 10 km o publica lo que necesitas para que tus vecinos puedan
        ayudarte.
      </p>
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button className="secondary-button" onClick={onExpandRadius}>
          Ampliar radio a 10 km
        </button>
        <button className="primary-button" onClick={onPublish}>
          Publicar necesidad
        </button>
      </div>
    </div>
  )
}

function DetailView({
  item,
  saved,
  onSave,
  onCreated,
  onQueued,
  onOpenProviderProfile,
  userId,
  isOnline,
}: {
  item: ListingView
  saved: boolean
  onSave: () => void
  onCreated: (interaction: InteractionView) => void
  onQueued: () => void
  onOpenProviderProfile: () => void
  userId?: string
  isOnline: boolean
}) {
  const [requestState, setRequestState] = useState<
    'idle' | 'sending' | 'queued' | 'confirmed' | 'error'
  >('idle')
  const [requestMessage, setRequestMessage] = useState('')
  const [selectedProposalIdx, setSelectedProposalIdx] = useState(0)
  const [helpStep, setHelpStep] = useState<'open' | 'assigned' | 'coordinating' | 'resolved'>(
    'assigned',
  )
  const [loanDays, setLoanDays] = useState('3')
  const [reportNotice, setReportNotice] = useState('')
  const [details, setDetails] = useState(
    item.kind === 'barter'
      ? 'Propongo intercambiar mi taladro percutor / set de herramientas con foto adjunta.'
      : item.kind === 'loan'
        ? 'Solicito préstamo temporal por 3 días; me comprometo a cuidarlo y devolverlo limpio.'
        : item.kind === 'help'
          ? 'Me ofrezco como voluntario disponible esta semana para apoyar a Don Hernán.'
          : 'Me interesa coordinar este servicio; quedo atento a disponibilidad y cotización.',
  )

  const barterProposals = [
    {
      author: 'Jorge V. (A 350 m)',
      offerTitle: 'Set de llaves y taladro Black+Decker con maletín',
      condition: 'Muy buen estado · Incluye fotografía adjunta',
      compatibility: 'Coincide con lo que busca el vecino',
    },
    {
      author: 'Sofía C. (A 700 m)',
      offerTitle: '4 sesiones de Inglés Conversacional + Rack de pared',
      condition: 'Propuesta mixta: Objeto + Clases',
      compatibility: 'Compatible con intercambio flexible',
    },
  ]

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

    const operation: QueuedInteraction = {
      userId: userId || 'demo-local',
      idempotencyKey: createIdempotencyKey(),
      listingId: item.id,
      listingTitle: item.title,
      type,
      details: item.kind === 'loan' ? `${details} (Plazo: ${loanDays} días)` : details,
      createdAt: new Date().toISOString(),
      state: 'pending',
    }

    if (!isOnline) {
      enqueueInteraction(operation)
      onQueued()
      setRequestState('queued')
      setRequestMessage(
        'Estás sin conexión. Tu solicitud se guardó en tu dispositivo y se enviará automáticamente al recuperar internet.',
      )
      return
    }

    if (!userId) {
      setRequestState('error')
      setRequestMessage('Inicia sesión para enviar tu solicitud y conversar con tu vecino.')
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
            'El servidor tardó en responder. Guardamos tu solicitud para reintentar automáticamente.',
          )
          return
        }
        setRequestState('error')
        setRequestMessage(result.error?.message || 'No se pudo enviar la solicitud.')
        return
      }
      onCreated(result.interaction)
      setRequestState('confirmed')
      setRequestMessage('¡Solicitud enviada! Ya puedes coordinar por chat en la pestaña Actividad.')
    } catch {
      enqueueInteraction(operation)
      onQueued()
      setRequestState('queued')
      setRequestMessage('Sin conexión. Guardada en tu dispositivo para enviarse al reconectar.')
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
      </div>
      <div className="detail-content">
        <div className="detail-topline">
          <span className={`kind-tag kind-tag--${item.kind}`}>{kindLabel[item.kind]}</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="tts-btn"
              onClick={() =>
                speakText(
                  `${item.title}. Ofrecido por ${item.providerName}. Costo: ${item.priceLabel || 'Sin costo'}. ${item.description}. ${
                    item.approvalAuthor
                      ? `Cuenta con Visto Bueno Vecinal de ${item.approvalAuthor}: ${item.approvalNote}`
                      : ''
                  }`,
                )
              }
              aria-label="Escuchar ficha en voz alta"
            >
              <Volume2 size={16} /> Escuchar ficha
            </button>
            <button onClick={onSave} className={saved ? 'is-saved' : ''}>
              <Heart size={20} fill={saved ? 'currentColor' : 'none'} />{' '}
              {saved ? 'Guardado' : 'Guardar'}
            </button>
          </div>
        </div>
        <h1>{item.title}</h1>
        <p className="detail-lead">{item.description}</p>
        <div className="detail-stats">
          <span>
            <strong>{item.priceLabel || 'Sin costo'}</strong>
            <small>Costo / Modalidad</small>
          </span>
          <span>
            <strong>{item.distanceKm?.toFixed(2) ?? '0.4'} km</strong>
            <small>Distancia aprox.</small>
          </span>
          <span>
            <strong>{item.availability === 'now' ? '⚡ Disponible ahora' : 'Coordinar hoy'}</strong>
            <small>Actualizado hace 5 min</small>
          </span>
        </div>

        <div className="provider-card">
          <span className="provider-avatar">{item.initials || 'NB'}</span>
          <div>
            <small>Ofrece en {item.zoneName}</small>
            <strong>{item.providerName || 'Vecino de la zona'}</strong>
            <span>
              <Star size={14} fill="currentColor" /> {item.rating?.toFixed(1) || '4.9'} ·{' '}
              {item.reviewCount || 12} reseñas verificadas · {item.completedCount || 18} cumplidas
            </span>
          </div>
          <button type="button" onClick={onOpenProviderProfile}>
            Ver perfil y portafolio
          </button>
        </div>

        {item.approvalAuthor && (
          <div className="approval-card">
            <ShieldCheck size={23} />
            <div>
              <strong>Visto Bueno Vecinal</strong>
              <p>“{item.approvalNote}”</p>
              <small>
                Recomendado por <b>{item.approvalAuthor}</b> · Vecino de {item.approvalZone}
              </small>
            </div>
          </div>
        )}

        {item.kind === 'barter' && (
          <div className="feature-panel">
            <div>
              <span className="eyebrow">Propuestas de trueque</span>
              <h3>Ofertas recibidas de otros vecinos</h3>
              <p>
                Revisa qué objetos o habilidades ofrecen tus vecinos para acordar el intercambio.
              </p>
            </div>
            <div className="triangle-flow">
              {barterProposals.map((prop, idx) => (
                <div
                  key={prop.author}
                  className={`triangle-node ${selectedProposalIdx === idx ? 'is-approved' : ''}`}
                >
                  <header>
                    <strong>{prop.author}</strong>
                    <span className="status-pill status-pill--green">Con foto</span>
                  </header>
                  <p style={{ fontWeight: 700 }}>{prop.offerTitle}</p>
                  <small>{prop.condition}</small>
                  <small style={{ color: 'var(--green)', fontWeight: 700 }}>
                    ✓ {prop.compatibility}
                  </small>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => {
                      setSelectedProposalIdx(idx)
                      setDetails(`Acepto coordinar la propuesta: ${prop.offerTitle}`)
                    }}
                  >
                    {selectedProposalIdx === idx
                      ? 'Propuesta seleccionada'
                      : 'Seleccionar para coordinar'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {item.kind === 'loan' && (
          <div className="doc-verify-box">
            <strong>
              <Clock3 size={16} /> Biblioteca de Herramientas · Plazo de préstamo
            </strong>
            <label>
              Días que necesitas la herramienta (con recordatorio de devolución):
              <select value={loanDays} onChange={(e) => setLoanDays(e.target.value)}>
                <option value="1">1 día (devolución mañana)</option>
                <option value="2">2 días</option>
                <option value="3">3 días (estándar vecinal)</option>
              </select>
            </label>
            <small>
              Al finalizar, tanto tú como el dueño confirman que la herramienta fue devuelta en buen
              estado.
            </small>
          </div>
        )}

        {item.kind === 'help' && (
          <div className="feature-panel">
            <div>
              <span className="eyebrow">Apoyo Vecinal</span>
              <h3>Estado de la solicitud solidaria</h3>
            </div>
            <div className="progress-steps">
              {(
                [
                  ['open', '1. Abierta'],
                  ['assigned', '2. Voluntario asignado'],
                  ['coordinating', '3. En coordinación'],
                  ['resolved', '4. Resuelta y confirmada'],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setHelpStep(key)}
                  className={`progress-step ${helpStep === key ? 'is-current' : 'is-done'}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <small>
              Cada ayuda completada suma a tu reconocimiento solidario dentro de la comunidad.
            </small>
          </div>
        )}

        <div className="privacy-row">
          <MapPin size={18} />
          <span>
            <strong>{item.locationLabel}</strong>
            <small>
              Ubicación referencial por seguridad. La dirección exacta solo se acuerda por chat
              privado entre vecinos.
            </small>
          </span>
        </div>

        {requestState === 'confirmed' || requestState === 'queued' ? (
          <div className={`request-confirmed ${requestState === 'queued' ? 'is-queued' : ''}`}>
            {requestState === 'queued' ? <WifiOff size={20} /> : <Check size={20} />}
            <span>
              <strong>
                {requestState === 'queued'
                  ? 'Guardada en tu dispositivo (Se enviará al conectar)'
                  : 'Solicitud enviada'}
              </strong>
              <small>{requestMessage}</small>
            </span>
          </div>
        ) : (
          <div className="request-box">
            <label>
              Mensaje para tu vecino
              <textarea
                value={details}
                onChange={(event) => setDetails(event.target.value)}
                rows={3}
              />
            </label>
            {requestMessage && (
              <p className="form-feedback" role="alert">
                {requestMessage}{' '}
                {!userId && (
                  <Link href="/auth" style={{ fontWeight: 800, textDecoration: 'underline' }}>
                    Iniciar sesión ahora
                  </Link>
                )}
              </p>
            )}
            <button
              className="primary-button primary-button--wide"
              onClick={createInteraction}
              disabled={requestState === 'sending' || details.trim().length < 8}
            >
              {requestState === 'sending'
                ? 'Enviando…'
                : item.kind === 'barter'
                  ? 'Proponer trueque'
                  : item.kind === 'loan'
                    ? 'Solicitar préstamo gratuito'
                    : item.kind === 'help'
                      ? 'Ofrecerme como voluntario'
                      : item.kind === 'skill'
                        ? 'Proponer intercambio de horas'
                        : 'Contactar y solicitar'}{' '}
              <MessageCircle size={18} />
            </button>
          </div>
        )}

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '14px',
            paddingTop: '12px',
            borderTop: '1px solid var(--line)',
          }}
        >
          <small style={{ color: 'var(--muted)' }}>
            Acuerdo directo entre vecinos · Sin comisiones
          </small>
          <button
            type="button"
            className="text-button"
            onClick={() =>
              setReportNotice('Gracias. Tu reporte fue enviado para revisión de la comunidad.')
            }
          >
            Reportar publicación
          </button>
        </div>
        {reportNotice && (
          <small style={{ color: 'var(--green)', fontWeight: 700 }}>{reportNotice}</small>
        )}
      </div>
    </div>
  )
}

function TriangularBarterPanel({ onOpenListing }: { onOpenListing: (kind: string) => void }) {
  const [approvals, setApprovals] = useState<{ a: boolean; b: boolean; c: boolean }>({
    a: true,
    b: true,
    c: false,
  })
  const allApproved = approvals.a && approvals.b && approvals.c

  return (
    <div className="feature-panel" role="region" aria-label="Trueque entre 3 vecinos">
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <span className="eyebrow">Trueque Inteligente · Cadena de 3 vecinos</span>
          <h2>Intercambio compatible en Centro Cívico</h2>
          <p>
            Cuando dos vecinos no buscan exactamente lo mismo, el sistema conecta a tres vecinos
            cuyas ofertas se complementan. <b>El intercambio se confirma cuando los 3 aceptan.</b>
          </p>
        </div>
        <span className={`status-pill ${allApproved ? 'status-pill--green' : 'status-pill--pending'}`}>
          {allApproved
            ? '✓ 3 de 3 confirmados · Listo para coordinar'
            : '2 de 3 confirmados · Falta Sofía C.'}
        </span>
      </div>

      <div className="triangle-flow">
        <div className={`triangle-node ${approvals.a ? 'is-approved' : ''}`}>
          <header>
            <strong>1. Alejandro Prado</strong>
            <span className="status-pill status-pill--green">
              {approvals.a ? 'Confirmado' : 'Pendiente'}
            </span>
          </header>
          <p>
            <b>Entrega:</b> Bicicleta Montañera Aro 26 → a Sofía C.
          </p>
          <p>
            <b>Recibe:</b> Taladro Percutor Bosch ← de María Elena
          </p>
          <button
            type="button"
            className="secondary-button"
            onClick={() => onOpenListing('barter')}
          >
            Ver ficha de Bicicleta
          </button>
        </div>

        <div className={`triangle-node ${approvals.b ? 'is-approved' : ''}`}>
          <header>
            <strong>2. María Elena Torres</strong>
            <span className="status-pill status-pill--green">
              {approvals.b ? 'Confirmado' : 'Pendiente'}
            </span>
          </header>
          <p>
            <b>Entrega:</b> Taladro Bosch 650W → a Alejandro Prado
          </p>
          <p>
            <b>Recibe:</b> 3 sesiones de Inglés ← de Sofía C.
          </p>
          <button type="button" className="secondary-button" onClick={() => onOpenListing('loan')}>
            Ver ficha de Taladro
          </button>
        </div>

        <div className={`triangle-node ${approvals.c ? 'is-approved' : ''}`}>
          <header>
            <strong>3. Sofía Cárdenas (Tu turno)</strong>
            <span className={`status-pill ${approvals.c ? 'status-pill--green' : 'status-pill--pending'}`}>
              {approvals.c ? 'Confirmado' : 'Por confirmar'}
            </span>
          </header>
          <p>
            <b>Entrega:</b> 3 sesiones de Inglés → a María Elena
          </p>
          <p>
            <b>Recibe:</b> Bicicleta Montañera Aro 26 ← de Alejandro
          </p>
          <button
            type="button"
            className="primary-button"
            onClick={() => setApprovals((prev) => ({ ...prev, c: !prev.c }))}
          >
            {approvals.c ? 'Cancelar mi confirmación' : 'Confirmar mi participación (3/3)'}
          </button>
        </div>
      </div>

      <p className="prototype-caption">
        Sugerido automáticamente porque los 3 vecinos están a menos de 700 metros en Centro Cívico y
        tienen disponibilidad esta semana.
      </p>
    </div>
  )
}

function CommunityView({
  subView,
  onChangeSubView,
  zone,
  onOpenListing,
}: {
  subView: 'circles' | 'juntos' | 'routes'
  onChangeSubView: (v: 'circles' | 'juntos' | 'routes') => void
  zone: string
  onOpenListing: () => void
}) {
  const [circles, setCircles] = useState([
    { name: zone, count: '124 vecinos', scope: 'Barrio local' },
    { name: 'Herramientas compartidas', count: '68 vecinos', scope: 'Temático' },
    { name: 'Mascotas del barrio', count: '91 vecinos', scope: 'Temático' },
    { name: 'Apoyo Adulto Mayor', count: '42 vecinos', scope: 'Solidario' },
  ])
  const [activeCircleIdx, setActiveCircleIdx] = useState(0)
  const [newCircleName, setNewCircleName] = useState('')
  const [showNewCircle, setShowNewCircle] = useState(false)
  const [posts, setPosts] = useState([
    {
      id: 'p1',
      author: 'María P.',
      initials: 'MP',
      meta: `${zone} · hace 18 min`,
      body: '¿Alguien recomienda un electricista de confianza que pueda revisar un tablero antiguo esta semana?',
      hasSharedListing: true,
      comments: [
        'Rosa M.: Te recomiendo a Carlos Mendoza, tiene Visto Bueno Vecinal de nuestra cuadra.',
      ],
    },
    {
      id: 'p2',
      author: 'Jorge Villalobos',
      initials: 'JV',
      meta: `${zone} · hace 1 h`,
      body: 'Vecinos, recuerden que este sábado actualizamos el inventario de herramientas prestables del pasaje.',
      hasSharedListing: false,
      comments: [],
    },
  ])
  const [newPostText, setNewPostText] = useState('')
  const [sharedNeeds, setSharedNeeds] = useState([
    {
      id: 'j1',
      title: 'Mantenimiento preventivo de intercomunicadores y chapas eléctricas',
      category: 'Electricidad · Servicio grupal',
      participants: 6,
      joined: false,
      status: 'En coordinación · 2 propuestas de técnicos del barrio',
      proposal: 'Propuesta Carlos Mendoza: S/ 25 por departamento al agrupar 5 o más vecinos.',
    },
    {
      id: 'j2',
      title: 'Recarga grupal de extintores para edificios de Jr. Washington',
      category: 'Seguridad · Mantenimiento de edificio',
      participants: 9,
      joined: true,
      status: 'Abierto a más vecinos de la cuadra',
      proposal: 'Proveedor verificado ofrece recojo y entrega el mismo día sin recargo de traslado.',
    },
  ])
  const [routes, setRoutes] = useState([
    {
      id: 'r1',
      driver: 'Andrés L. (Vecino verificado)',
      origin: `${zone} (Av. Garcilaso ref.)`,
      dest: 'Mercado Mayorista / Jesús María',
      when: 'Sábado 8:30 a.m.',
      capacity: 'Espacio en maletera para cajas, herramientas o compras pesadas',
      requested: false,
    },
    {
      id: 'r2',
      driver: 'Claudia M.',
      origin: 'Santa Beatriz',
      dest: `${zone} · Centro de Salud`,
      when: 'Martes y Jueves 9:00 a.m.',
      capacity: 'Acompañamiento solidario o traslado de medicinas y suministros',
      requested: false,
    },
  ])

  const addPost = (e: FormEvent) => {
    e.preventDefault()
    if (!newPostText.trim()) return
    setPosts((prev) => [
      {
        id: `p-${Date.now()}`,
        author: 'Vecino de ' + zone,
        initials: 'VN',
        meta: `${circles[activeCircleIdx]?.name || zone} · ahora mismo`,
        body: newPostText.trim(),
        hasSharedListing: false,
        comments: [],
      },
      ...prev,
    ])
    setNewPostText('')
  }

  return (
    <section className="content-page community-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Comunidad vecinal · {zone}</span>
          <h1>Círculos que sí se mueven en {zone}</h1>
          <p>
            Conversa con tus vecinos, comparte datos de confianza, coordina servicios en grupo y
            apóyense en traslados del barrio.
          </p>
        </div>
        <button className="primary-button" onClick={() => setShowNewCircle((v) => !v)}>
          <Plus size={17} /> Crear círculo
        </button>
      </div>

      <div className="sub-tabs" role="tablist">
        <button
          type="button"
          className={subView === 'circles' ? 'is-active' : ''}
          onClick={() => onChangeSubView('circles')}
        >
          <Users size={16} /> Círculos y Muro Vecinal
        </button>
        <button
          type="button"
          className={subView === 'juntos' ? 'is-active' : ''}
          onClick={() => onChangeSubView('juntos')}
        >
          <HandHeart size={16} /> Pedidos y Servicios en Grupo
        </button>
        <button
          type="button"
          className={subView === 'routes' ? 'is-active' : ''}
          onClick={() => onChangeSubView('routes')}
        >
          <Truck size={16} /> Rutas Solidarias
        </button>
      </div>

      {showNewCircle && (
        <div className="feature-panel">
          <h3>Crear nuevo círculo comunitario</h3>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <input
              value={newCircleName}
              onChange={(e) => setNewCircleName(e.target.value)}
              placeholder="Nombre del círculo (ej. Huertos Urbanos Lince)"
              style={{
                flex: 1,
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1px solid var(--line)',
              }}
            />
            <button
              type="button"
              className="primary-button"
              onClick={() => {
                if (!newCircleName.trim()) return
                setCircles((prev) => [
                  ...prev,
                  { name: newCircleName.trim(), count: '1 vecino (Tú)', scope: 'Local' },
                ])
                setActiveCircleIdx(circles.length)
                setNewCircleName('')
                setShowNewCircle(false)
              }}
            >
              Crear y unirme
            </button>
          </div>
        </div>
      )}

      {subView === 'circles' && (
        <div className="community-layout">
          <aside className="circle-list">
            <h2>Tus círculos</h2>
            {circles.map((c, index) => (
              <button
                key={c.name}
                className={index === activeCircleIdx ? 'is-active' : ''}
                onClick={() => setActiveCircleIdx(index)}
              >
                <span>{c.name.slice(0, 2).toUpperCase()}</span>
                <div>
                  <strong>{c.name}</strong>
                  <small>
                    {c.count} · {c.scope}
                  </small>
                </div>
              </button>
            ))}
          </aside>
          <div className="community-feed">
            <form className="composer" onSubmit={addPost}>
              <span className="avatar-button">VN</span>
              <input
                value={newPostText}
                onChange={(e) => setNewPostText(e.target.value)}
                placeholder={`Pregunta, pide recomendación o avisa algo en ${circles[activeCircleIdx]?.name}…`}
                style={{
                  flex: 1,
                  border: 0,
                  background: 'transparent',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
              <button type="submit" className="primary-button" style={{ minHeight: '36px' }}>
                Publicar
              </button>
            </form>

            {posts.map((post) => (
              <article key={post.id} className="feed-post">
                <header>
                  <span className="mini-avatar">{post.initials}</span>
                  <div>
                    <strong>{post.author}</strong>
                    <small>{post.meta}</small>
                  </div>
                  <Menu size={18} />
                </header>
                <p>{post.body}</p>
                {post.hasSharedListing && (
                  <button className="shared-listing" onClick={onOpenListing}>
                    <Wrench size={23} />
                    <span>
                      <small>Recomendación vecinal</small>
                      <strong>Electricista matriculado · Carlos Mendoza</strong>
                      <em>Toca para ver su ficha y Visto Bueno Vecinal</em>
                    </span>
                  </button>
                )}
                {post.comments.map((c, i) => (
                  <p
                    key={i}
                    style={{
                      fontSize: '13px',
                      background: '#f5f8f5',
                      padding: '8px 12px',
                      borderRadius: '10px',
                    }}
                  >
                    💬 {c}
                  </p>
                ))}
                <footer>
                  <button
                    type="button"
                    onClick={() =>
                      setPosts((prev) =>
                        prev.map((p) =>
                          p.id === post.id
                            ? {
                                ...p,
                                comments: [
                                  ...p.comments,
                                  'Vecino: ¡Gracias por el dato! Ya revisé su ficha.',
                                ],
                              }
                            : p,
                        ),
                      )
                    }
                  >
                    <MessageCircle size={17} /> Responder ({post.comments.length})
                  </button>
                  <button type="button" onClick={onOpenListing}>
                    <Sparkles size={17} /> Recomendar proveedor
                  </button>
                </footer>
              </article>
            ))}
          </div>
        </div>
      )}

      {subView === 'juntos' && (
        <div className="feature-panel">
          <div>
            <span className="eyebrow">Coordinación Vecinal</span>
            <h2>Pedidos y servicios en grupo</h2>
            <p>
              Únete a vecinos de tu misma cuadra o edificio que necesitan el mismo servicio para
              coordinar juntos con un técnico o proveedor local.
            </p>
          </div>
          <div className="juntos-grid">
            {sharedNeeds.map((need) => (
              <article key={need.id} className="juntos-card">
                <span className="eyebrow">{need.category}</span>
                <h3>{need.title}</h3>
                <p style={{ fontSize: '13px', color: 'var(--muted)' }}>{need.proposal}</p>
                <span className="status-pill status-pill--green">{need.status}</span>
                <footer>
                  <strong>👥 {need.participants} vecinos unidos</strong>
                  <button
                    type="button"
                    className={need.joined ? 'secondary-button' : 'primary-button'}
                    onClick={() =>
                      setSharedNeeds((prev) =>
                        prev.map((n) =>
                          n.id === need.id
                            ? {
                                ...n,
                                joined: !n.joined,
                                participants: n.joined ? n.participants - 1 : n.participants + 1,
                              }
                            : n,
                        ),
                      )
                    }
                  >
                    {need.joined ? 'Salir del grupo' : 'Unirme al grupo (+1)'}
                  </button>
                </footer>
              </article>
            ))}
          </div>
        </div>
      )}

      {subView === 'routes' && (
        <div className="feature-panel">
          <div>
            <span className="eyebrow">Movilidad y Encargos</span>
            <h2>Rutas solidarias entre vecinos</h2>
            <p>
              Aprovecha viajes que tus vecinos ya van a realizar para encargar o trasladar objetos
              pesados, compras de mercado o suministros dentro del barrio.
            </p>
          </div>
          <div className="juntos-grid">
            {routes.map((rt) => (
              <article key={rt.id} className="juntos-card">
                <strong>🚗 {rt.driver}</strong>
                <p style={{ fontSize: '13px' }}>
                  <b>Punto de partida:</b> {rt.origin}
                  <br />
                  <b>Destino:</b> {rt.dest}
                  <br />
                  <b>Horario:</b> {rt.when}
                </p>
                <small style={{ color: 'var(--muted)' }}>{rt.capacity}</small>
                <footer>
                  <span className="status-pill">Apoyo vecinal</span>
                  <button
                    type="button"
                    className={rt.requested ? 'secondary-button' : 'primary-button'}
                    onClick={() =>
                      setRoutes((prev) =>
                        prev.map((r) => (r.id === rt.id ? { ...r, requested: !r.requested } : r)),
                      )
                    }
                  >
                    {rt.requested ? 'Solicitud enviada ✓' : 'Solicitar apoyo en ruta'}
                  </button>
                </footer>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

function ActivityView({
  interactions,
  signedIn,
  queuedInteractions,
  syncingQueue,
  isOnline,
  onDiscardQueue,
  onRetryQueue,
  onUpdated,
}: {
  interactions: InteractionView[]
  signedIn: boolean
  queuedInteractions: QueuedInteraction[]
  syncingQueue: boolean
  isOnline: boolean
  onSimulateOfflineQueue?: () => void
  onDiscardQueue: (idempotencyKey: string) => void
  onRetryQueue: () => void
  onUpdated: (interaction: InteractionView) => void
}) {
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState('')
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [activeReviewId, setActiveReviewId] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<string>('all')

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
        setActionMessage(result.error?.message || 'No se pudo actualizar el estado.')
        return
      }
      onUpdated(result.interaction)
      setActionMessage('Estado actualizado correctamente.')
    } catch {
      setActionMessage('Sin conexión. Intenta nuevamente al conectarte.')
    } finally {
      setPendingId(null)
    }
  }

  const filteredInteractions = interactions.filter(
    (item) => filterType === 'all' || item.type === filterType,
  )

  return (
    <section className="content-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Mis solicitudes y acuerdos</span>
          <h1>Seguimiento de servicios, trueques, préstamos y ayudas</h1>
          {!signedIn && (
            <p>
              Para gestionar tus acuerdos y conversar con tus vecinos:{' '}
              <Link href="/auth" style={{ fontWeight: 800, color: 'var(--green)' }}>
                Inicia sesión o entra con una cuenta de prueba rápida
              </Link>
              .
            </p>
          )}
        </div>
      </div>

      <div className="activity-tabs">
        {[
          ['all', 'Todo'],
          ['service', 'Servicios'],
          ['barter', 'Trueques'],
          ['loan', 'Préstamos'],
          ['help', 'Ayudas'],
        ].map(([key, label]) => (
          <button
            key={key}
            className={filterType === key ? 'is-active' : ''}
            onClick={() => setFilterType(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="activity-list">
        {queuedInteractions.map((queued) => (
          <div key={queued.idempotencyKey} className="activity-item is-queued">
            <span className="activity-icon activity-icon--orange">
              <WifiOff size={20} />
            </span>
            <div>
              <strong>{queued.listingTitle}</strong>
              <p>{queued.details}</p>
              <small>
                {queued.error ||
                  'Guardada en tu dispositivo · Se enviará apenas recuperes conexión.'}
              </small>
            </div>
            <div className="activity-controls">
              <span
                className={`status-pill ${queued.state === 'failed' ? 'status-pill--failed' : 'status-pill--pending'}`}
              >
                {queued.state === 'failed' ? 'Requiere revisión' : 'Pendiente de conexión'}
              </span>
              {signedIn && isOnline && (
                <button
                  type="button"
                  className="mini-action"
                  onClick={onRetryQueue}
                  disabled={syncingQueue}
                >
                  {syncingQueue ? 'Enviando…' : 'Enviar ahora'}
                </button>
              )}
              <button
                type="button"
                className="mini-action mini-action--muted"
                onClick={() => onDiscardQueue(queued.idempotencyKey)}
              >
                Descartar
              </button>
            </div>
          </div>
        ))}

        {filteredInteractions.length > 0 ? (
          filteredInteractions.map((interaction) => {
            const isProvider = interaction.role === 'provider'
            const isLoan = interaction.type === 'loan'
            const canAccept =
              isProvider &&
              ['requested', 'proposed', 'negotiating'].includes(interaction.status)
            const canReject =
              isProvider &&
              ['requested', 'proposed', 'negotiating'].includes(interaction.status)
            const canComplete =
              !isLoan &&
              ['accepted', 'coordinating', 'in-progress'].includes(interaction.status)
            const canBorrowerReturn =
              isLoan &&
              !isProvider &&
              ['accepted', 'in-progress', 'return-pending'].includes(interaction.status) &&
              !interaction.returnFlow?.borrowerConfirmed
            const canLenderReturn =
              isLoan &&
              isProvider &&
              ['accepted', 'in-progress', 'return-pending'].includes(interaction.status) &&
              !interaction.returnFlow?.lenderConfirmed
            const canCancel = !['completed', 'rejected', 'cancelled'].includes(
              interaction.status,
            )

            return (
              <div key={interaction.id} className="activity-item">
                <span className="activity-icon activity-icon--green">
                  <Check size={20} />
                </span>
                <div>
                  <strong>{interaction.listingTitle}</strong>
                  <p>{interaction.summary}</p>
                  <small>
                    {isProvider ? 'Recibida como proveedor' : 'Enviada como vecino solicitante'}
                  </small>
                </div>
                <div className="activity-controls">
                  <span className="status-pill status-pill--green">
                    {statusLabel[interaction.status] || interaction.status}
                  </span>
                  {canAccept && (
                    <button
                      type="button"
                      className="mini-action"
                      onClick={() => updateInteraction(interaction.id, 'accept')}
                      disabled={pendingId === interaction.id}
                    >
                      Aceptar
                    </button>
                  )}
                  {canReject && (
                    <button
                      type="button"
                      className="mini-action mini-action--muted"
                      onClick={() => updateInteraction(interaction.id, 'reject')}
                      disabled={pendingId === interaction.id}
                    >
                      Rechazar
                    </button>
                  )}
                  {canComplete && (
                    <button
                      type="button"
                      className="mini-action"
                      onClick={() => updateInteraction(interaction.id, 'complete')}
                      disabled={pendingId === interaction.id}
                    >
                      Confirmar cierre
                    </button>
                  )}
                  {canBorrowerReturn && (
                    <button
                      type="button"
                      className="mini-action"
                      onClick={() => updateInteraction(interaction.id, 'confirm-return')}
                      disabled={pendingId === interaction.id}
                    >
                      Confirmar devolución
                    </button>
                  )}
                  {canLenderReturn && (
                    <button
                      type="button"
                      className="mini-action"
                      onClick={() => updateInteraction(interaction.id, 'confirm-return')}
                      disabled={pendingId === interaction.id}
                    >
                      Confirmar recepción
                    </button>
                  )}
                  {canCancel && (
                    <button
                      type="button"
                      className="mini-action mini-action--muted"
                      onClick={() => updateInteraction(interaction.id, 'cancel')}
                      disabled={pendingId === interaction.id}
                    >
                      Cancelar
                    </button>
                  )}
                  <button
                    type="button"
                    className="mini-action mini-action--muted"
                    onClick={() =>
                      setActiveChatId(activeChatId === interaction.id ? null : interaction.id)
                    }
                  >
                    Chat
                  </button>
                  {interaction.status === 'completed' && (
                    <button
                      type="button"
                      className="mini-action"
                      onClick={() =>
                        setActiveReviewId(
                          activeReviewId === interaction.id ? null : interaction.id,
                        )
                      }
                    >
                      Calificar ★
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
            <h2>Aún no tienes solicitudes activas</h2>
            <p>
              Abre cualquier publicación del mapa o del catálogo para contactar a un vecino,
              proponer un trueque o pedir prestada una herramienta.
            </p>
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
          <strong>Respaldo automático sin conexión</strong>
          <p>
            Si en algún momento te quedas sin señal o datos móviles, tus solicitudes se guardan en
            tu teléfono y se envían sin duplicarse apenas vuelve la conexión.
          </p>
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
        setStatus(result.error?.message || 'El mensaje no se pudo enviar.')
        return
      }
      setMessages((current) => [...current, result.message])
      setBody('')
      setStatus('Mensaje enviado.')
    } catch {
      setStatus('Sin conexión. Tu mensaje no fue enviado.')
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
          <span>Aún no hay mensajes. Escribe aquí para coordinar con tu vecino.</span>
        )}
      </div>
      <div className="chat-compose">
        <input
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Escribe un mensaje…"
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
        setStatus(result.error?.message || 'No se pudo guardar la reseña.')
        return
      }
      setSent(true)
      setStatus('¡Gracias! Tu reseña ya suma al Visto Bueno Vecinal.')
    } catch {
      setStatus('Sin conexión. La reseña no fue enviada.')
    }
  }

  return (
    <div className="review-panel">
      <strong>Califica tu experiencia con este vecino</strong>
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
        placeholder="Cuenta cómo fue la atención para orientar a otros vecinos del barrio"
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

function ProviderProfileModal({
  item,
  onBack,
  onRequest,
}: {
  item: ListingView
  onBack: () => void
  onRequest: () => void
}) {
  return (
    <div className="profile-view">
      <button type="button" className="text-button" onClick={onBack} style={{ marginBottom: 10 }}>
        ← Volver a la publicación
      </button>
      <div className="profile-cover">
        <div className="provider-avatar provider-avatar--large">{item.initials || 'CM'}</div>
      </div>
      <h1>{item.providerName || 'Carlos Mendoza'}</h1>
      <p>{item.zoneName} · Vecino activo desde 2025</p>
      <span className="verification-chip">
        <ShieldCheck size={16} /> Identidad verificada con DNI
      </span>

      <div className="profile-metrics">
        <span>
          <strong>{item.rating?.toFixed(1) || '4.9'} ★</strong>
          <small>{item.reviewCount || 38} reseñas</small>
        </span>
        <span>
          <strong>{item.completedCount || 52}</strong>
          <small>Trabajos cumplidos</small>
        </span>
        <span>
          <strong>14</strong>
          <small>Apoyos solidarios</small>
        </span>
      </div>

      <div className="feature-panel" style={{ textAlign: 'left', marginTop: 14 }}>
        <span className="eyebrow">Confianza y Reconocimientos</span>
        <p style={{ fontSize: 13 }}>
          <b>Calificación de oficios:</b> Basada en {item.reviewCount || 38} servicios y acuerdos
          completados con vecinos de la zona.
        </p>
        <p style={{ fontSize: 13 }}>
          <b>Reconocimiento comunitario:</b> 🏅 Vecino Colaborador · 🧰 Aportante de Biblioteca de
          Herramientas · 🤝 14 horas compartidas en Banco de Tiempo.
        </p>
      </div>

      <div className="feature-panel" style={{ textAlign: 'left' }}>
        <span className="eyebrow">Trabajos recientes en el barrio</span>
        <p style={{ fontSize: 13 }}>
          • Renovación de tablero eléctrico con llaves diferenciales (Jr. Washington, hace 3 días)
          <br />• Instalación de luminarias LED en áreas comunes de edificio (Av. Garcilaso)
          <br />• Diagnóstico de fugas a tierra y puesta a tierra certificada
        </p>
      </div>

      <button className="primary-button primary-button--wide" onClick={onRequest}>
        Contactar en su publicación
      </button>
    </div>
  )
}

function ImpactAndRadarView({
  listingsCount,
  interactionsCount,
  zone,
  onSelectCategory,
}: {
  listingsCount: number
  interactionsCount: number
  zone: string
  onSelectCategory: (cat: string) => void
}) {
  const radarData = [
    { category: 'Electricidad', count: 28, pct: 88, note: 'Alta demanda en edificios antiguos' },
    { category: 'Herramientas', count: 22, pct: 72, note: 'Préstamos frecuentes los fines de semana' },
    { category: 'Plomería', count: 19, pct: 64, note: 'Urgencias de filtraciones y griferías' },
    { category: 'Clases', count: 14, pct: 48, note: 'Intercambio en Banco de Tiempo' },
  ]

  return (
    <div className="simple-modal">
      <span className="simple-modal__icon">
        <BarChart3 size={28} />
      </span>
      <span className="eyebrow">Comunidad de {zone}</span>
      <h1>Impacto Vecinal y Tendencias</h1>
      <p>
        Conoce cómo el intercambio, el préstamo de herramientas y el apoyo mutuo están ayudando a
        las familias de {zone}.
      </p>

      <div className="impact-grid" style={{ marginTop: 14 }}>
        <div className="impact-card">
          <strong>{48 + interactionsCount}</strong>
          <small>Acuerdos completados</small>
        </div>
        <div className="impact-card">
          <strong>31</strong>
          <small>Objetos reutilizados (Trueque/Regalo)</small>
        </div>
        <div className="impact-card">
          <strong>29</strong>
          <small>Herramientas prestadas sin costo</small>
        </div>
        <div className="impact-card">
          <strong>18</strong>
          <small>Ayudas solidarias resueltas</small>
        </div>
      </div>

      <div className="feature-panel" style={{ marginTop: 16 }}>
        <div>
          <span className="eyebrow">Lo más buscado en tu zona</span>
          <h3>Categorías con mayor movimiento en {zone}</h3>
          <p style={{ fontSize: 12, color: 'var(--muted)' }}>
            Toca cualquier categoría para explorar las publicaciones disponibles:
          </p>
        </div>
        <div className="radar-list">
          {radarData.map((row) => (
            <div key={row.category} className="radar-row">
              <div className="radar-row__head">
                <button
                  type="button"
                  className="text-button"
                  onClick={() => onSelectCategory(row.category)}
                  style={{ fontWeight: 800, color: 'var(--green)' }}
                >
                  {row.category} → Ver publicaciones ({listingsCount > 0 ? 'Disponibles' : ''})
                </button>
                <span>{row.count} búsquedas recientes</span>
              </div>
              <div className="radar-bar">
                <span style={{ width: `${row.pct}%` }} />
              </div>
              <small style={{ color: 'var(--muted)', fontSize: 11 }}>{row.note}</small>
            </div>
          ))}
        </div>
      </div>

      <p className="prototype-caption">
        Cada préstamo de herramienta ahorra en promedio S/ 140 a las familias del barrio al evitar
        compras de un solo uso. Las estadísticas son anónimas y agrupadas por zona.
      </p>
    </div>
  )
}

function EmergencyView({ initialMode = 'directory' }: { initialMode?: 'directory' | 'board' }) {
  const [mode, setMode] = useState<'directory' | 'board'>(initialMode)
  const [boardItems, setBoardItems] = useState([
    {
      id: 'e1',
      kind: 'Necesidad',
      title: 'Agua potable y linternas para punto de encuentro Parque de la Exposición',
      meta: 'Zona: Centro Cívico · hace 18 min',
      source: 'Comité Vecinal Sector 2 · En coordinación (2 voluntarios)',
      verified: true,
    },
    {
      id: 'e2',
      kind: 'Recurso disponible',
      title: 'Botiquín de primeros auxilios y cargadores solares portátiles',
      meta: 'Zona: Jr. Quilca (referencial) · hace 10 min',
      source: 'María Elena T. · Disponible para vecinos del bloque',
      verified: true,
    },
    {
      id: 'e3',
      kind: 'Grupo de apoyo',
      title: 'Brigada Comunitaria de Acompañamiento a Adultos Mayores',
      meta: 'Centro Cívico / Santa Beatriz · Activo hoy',
      source: 'Organización vecinal verificada',
      verified: true,
    },
  ])
  const [newResourceTitle, setNewResourceTitle] = useState('')
  const [newResourceKind, setNewResourceKind] = useState<'Recurso disponible' | 'Necesidad'>(
    'Recurso disponible',
  )

  return (
    <div className="emergency-view">
      <div className="emergency-header">
        <span>
          <AlertTriangle size={25} />
        </span>
        <div>
          <small>Líneas oficiales y red de apoyo vecinal</small>
          <h1>Emergencia y Comunidad Activa</h1>
        </div>
        <button
          type="button"
          className="tts-btn"
          onClick={() =>
            speakText(
              'Modo de emergencia. Ante peligro inmediato llama al 116 Bomberos, 105 Policía Nacional o 106 SAMU. NexoBarrio es un canal complementario de apoyo vecinal y no reemplaza a los servicios oficiales.',
            )
          }
        >
          <Volume2 size={15} /> Escuchar
        </button>
      </div>
      <div className="warning-box">
        <strong>Ante peligro inmediato, comunícate primero con las líneas oficiales.</strong>
        <p>
          Esta sección facilita el apoyo solidario entre vecinos y el acceso rápido a números de
          emergencia, pero no reemplaza la atención médica, policial ni de bomberos.
        </p>
      </div>
      <div className="segmented">
        <button
          className={mode === 'directory' ? 'is-active' : ''}
          onClick={() => setMode('directory')}
        >
          Líneas de Emergencia
        </button>
        <button className={mode === 'board' ? 'is-active' : ''} onClick={() => setMode('board')}>
          Apoyo Vecinal Activo
        </button>
      </div>
      {mode === 'directory' ? (
        <div className="emergency-list">
          <a href="tel:116">
            <span>116</span>
            <div>
              <strong>Bomberos Voluntarios del Perú</strong>
              <small>Incendios, rescates y fugas de gas · Disponible sin internet</small>
            </div>
            <Navigation size={18} />
          </a>
          <a href="tel:105">
            <span>105</span>
            <div>
              <strong>Policía Nacional del Perú</strong>
              <small>Central de emergencias policiales · Disponible sin internet</small>
            </div>
            <Navigation size={18} />
          </a>
          <a href="tel:106">
            <span>106</span>
            <div>
              <strong>SAMU (Atención Médica Urgente)</strong>
              <small>Urgencias médicas y ambulancias · Disponible sin internet</small>
            </div>
            <Navigation size={18} />
          </a>
          <a href="tel:115">
            <span>115</span>
            <div>
              <strong>Defensa Civil / INDECI</strong>
              <small>Orientación ante sismos y desastres naturales</small>
            </div>
            <Navigation size={18} />
          </a>
        </div>
      ) : (
        <div className="active-community">
          <div className="board-summary">
            <span>
              <strong>
                {boardItems.filter((i) => i.kind === 'Necesidad').length}
              </strong>
              <small>Necesidades abiertas</small>
            </span>
            <span>
              <strong>
                {boardItems.filter((i) => i.kind === 'Recurso disponible').length}
              </strong>
              <small>Recursos vecinales</small>
            </span>
            <span>
              <strong>
                {boardItems.filter((i) => i.kind === 'Grupo de apoyo').length}
              </strong>
              <small>Brigadas activas</small>
            </span>
          </div>

          <div className="doc-verify-box">
            <strong>Publicar recurso disponible o necesidad urgente en el barrio</strong>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <select
                value={newResourceKind}
                onChange={(e) => setNewResourceKind(e.target.value as any)}
                style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--line)' }}
              >
                <option value="Recurso disponible">Ofrezco apoyo (Agua/Botiquín/Transporte)</option>
                <option value="Necesidad">Solicito apoyo de vecinos</option>
              </select>
              <input
                value={newResourceTitle}
                onChange={(e) => setNewResourceTitle(e.target.value)}
                placeholder="Ej. Tengo bidones de agua hervida y linternas recargables"
                style={{
                  flex: 1,
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: '1px solid var(--line)',
                }}
              />
              <button
                type="button"
                className="primary-button"
                onClick={() => {
                  if (!newResourceTitle.trim()) return
                  setBoardItems((prev) => [
                    {
                      id: `e-${Date.now()}`,
                      kind: newResourceKind,
                      title: newResourceTitle.trim(),
                      meta: 'Zona: Centro Cívico · hace un momento',
                      source: 'Publicado por vecino de la zona',
                      verified: false,
                    },
                    ...prev,
                  ])
                  setNewResourceTitle('')
                }}
              >
                Publicar aviso
              </button>
            </div>
          </div>

          {boardItems.map((item) => (
            <article key={item.id}>
              <span className="kind-tag kind-tag--help">{item.kind}</span>
              <h3>{item.title}</h3>
              <p>{item.meta}</p>
              <small>
                {item.verified ? '✓ ' : '• '}
                {item.source}
              </small>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

function ProfileView({
  user,
  savedItems,
  a11y,
  onUpdateA11y,
  onRepeatTutorial,
  onUserUpdated,
  onOpenSavedItem,
  onLogout,
}: {
  user: SessionUser | null
  savedItems: ListingView[]
  a11y: AccessibilityPrefs
  onUpdateA11y: (patch: Partial<AccessibilityPrefs>) => void
  onRepeatTutorial: () => void
  onUserUpdated: (u: SessionUser) => void
  onOpenSavedItem: (item: ListingView) => void
  onLogout: () => Promise<void>
}) {
  const [activeSection, setActiveSection] = useState<
    'verify' | 'a11y' | 'favorites' | 'offline' | 'moderation'
  >('verify')
  const [docType, setDocType] = useState<'DNI' | 'CE'>('DNI')
  const [docNumber, setDocNumber] = useState('')
  const [verifyMsg, setVerifyMsg] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [blockedUsers, setBlockedUsers] = useState<string[]>([])

  const name = user?.displayName
  const isVerified = user?.verificationStatus === 'verified'

  const handleVerifyIdentity = async (e: FormEvent) => {
    e.preventDefault()
    setVerifyMsg('')
    const isValidDni = docType === 'DNI' && /^\d{8}$/.test(docNumber)
    const isValidCe = docType === 'CE' && /^[A-Z0-9]{9,12}$/i.test(docNumber)
    if (!isValidDni && !isValidCe) {
      setVerifyMsg(
        'Formato inválido: ingresa 8 dígitos numéricos para DNI o de 9 a 12 caracteres para Carnet de Extranjería.',
      )
      return
    }
    if (!user) {
      onUserUpdated({
        id: 'local-verified',
        displayName: 'Vecino Verificado',
        zoneName: 'Centro Cívico',
        verificationStatus: 'verified',
      })
      setVerifyMsg(`¡${docType} ${docNumber} validado correctamente! Insignia activada.`)
      return
    }
    setVerifying(true)
    try {
      const response = await fetch('/api/app/session', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ verifyDocument: true, docType, docNumber }),
      })
      const result = await response.json()
      if (!response.ok) {
        setVerifyMsg(result.error?.message || 'No se pudo verificar el documento.')
        return
      }
      onUserUpdated(result.user)
      setVerifyMsg(`¡Identidad verificada con ${docType} ${docNumber}!`)
    } catch {
      setVerifyMsg('Sin conexión. Intenta nuevamente al conectarte.')
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div className="profile-view">
      <div className="profile-cover">
        <div className="provider-avatar provider-avatar--large">
          {name?.slice(0, 2).toUpperCase() || 'NB'}
        </div>
      </div>
      <h1>{name || 'Vecino de NexoBarrio'}</h1>
      <p>{user?.zoneName || 'Centro Cívico'} · Mi barrio</p>
      <span className="verification-chip">
        <ShieldCheck size={16} />{' '}
        {isVerified
          ? 'Identidad verificada (DNI / Carnet de Extranjería)'
          : 'Cuenta activa · Verifica tu DNI o CE'}
      </span>

      <div className="profile-metrics">
        <span>
          <strong>4.9 ★</strong>
          <small>Valoración</small>
        </span>
        <span>
          <strong>12</strong>
          <small>Ayudas solidarias</small>
        </span>
        <span>
          <strong>{savedItems.length}</strong>
          <small>Guardados</small>
        </span>
      </div>

      <div className="sub-tabs" style={{ marginTop: 16, justifyContent: 'center' }}>
        <button
          type="button"
          className={activeSection === 'verify' ? 'is-active' : ''}
          onClick={() => setActiveSection('verify')}
        >
          <CreditCard size={15} /> Identidad
        </button>
        <button
          type="button"
          className={activeSection === 'a11y' ? 'is-active' : ''}
          onClick={() => setActiveSection('a11y')}
        >
          ♿ Lectura y Voz
        </button>
        <button
          type="button"
          className={activeSection === 'favorites' ? 'is-active' : ''}
          onClick={() => setActiveSection('favorites')}
        >
          <Bookmark size={15} /> Guardados ({savedItems.length})
        </button>
        <button
          type="button"
          className={activeSection === 'offline' ? 'is-active' : ''}
          onClick={() => setActiveSection('offline')}
        >
          <RefreshCw size={15} /> Bienvenida
        </button>
        <button
          type="button"
          className={activeSection === 'moderation' ? 'is-active' : ''}
          onClick={() => setActiveSection('moderation')}
        >
          <ShieldCheck size={15} /> Privacidad
        </button>
      </div>

      {activeSection === 'verify' && (
        <form className="doc-verify-box" onSubmit={handleVerifyIdentity} style={{ textAlign: 'left' }}>
          <div className="doc-verify-header">
            <CreditCard size={20} />
            <div>
              <strong>Verificación de Identidad con DNI o Carnet de Extranjería</strong>
              <small>Genera mayor confianza al ofrecer servicios o intercambiar con vecinos</small>
            </div>
          </div>
          <label>
            Tipo de documento oficial
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value as 'DNI' | 'CE')}
              style={{ padding: '9px', borderRadius: '10px', border: '1px solid var(--line)' }}
            >
              <option value="DNI">DNI (Documento Nacional de Identidad · 8 dígitos)</option>
              <option value="CE">Carnet de Extranjería (CE · 9 a 12 caracteres)</option>
            </select>
          </label>
          <label>
            Número de {docType}
            <input
              value={docNumber}
              onChange={(e) => setDocNumber(e.target.value.trim())}
              placeholder={docType === 'DNI' ? 'Ej. 72918405' : 'Ej. 001948271'}
              maxLength={docType === 'DNI' ? 8 : 12}
              style={{ padding: '9px', borderRadius: '10px', border: '1px solid var(--line)' }}
              required
            />
          </label>
          <button type="submit" className="primary-button" disabled={verifying}>
            {verifying ? 'Validando documento…' : `Validar ${docType} y activar insignia`}
          </button>
          {verifyMsg && (
            <p className="form-feedback" role="status">
              {verifyMsg}
            </p>
          )}
        </form>
      )}

      {activeSection === 'a11y' && (
        <div className="feature-panel" style={{ textAlign: 'left' }}>
          <div>
            <span className="eyebrow">Comodidad visual y auditiva</span>
            <h3>Adapta la pantalla a tu preferencia</h3>
          </div>
          <label style={{ display: 'grid', gap: 6, fontWeight: 700, fontSize: 13 }}>
            Tamaño de letra:
            <select
              value={a11y.fontScale}
              onChange={(e) => onUpdateA11y({ fontScale: e.target.value as any })}
              style={{ padding: '9px', borderRadius: '10px', border: '1px solid var(--line)' }}
            >
              <option value="normal">Normal (100%)</option>
              <option value="large">Grande (112% · Lectura cómoda)</option>
              <option value="xlarge">Extra Grande (124% · Mayor visibilidad)</option>
            </select>
          </label>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={a11y.highContrast}
              onChange={(e) => onUpdateA11y({ highContrast: e.target.checked })}
            />
            <span>Activar alto contraste y bordes más nítidos</span>
          </label>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={a11y.simplified}
              onChange={(e) => onUpdateA11y({ simplified: e.target.checked })}
            />
            <span>Botones más grandes y vista simplificada (Ideal para adultos mayores)</span>
          </label>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={a11y.reducedMotion}
              onChange={(e) => onUpdateA11y({ reducedMotion: e.target.checked })}
            />
            <span>Reducir animaciones de pantalla</span>
          </label>
          <small style={{ color: 'var(--muted)' }}>
            También puedes buscar hablando con el botón 🎙️ <b>Voz</b> en la barra superior o
            escuchar cualquier publicación tocando 🔊 <b>Escuchar ficha</b>.
          </small>
        </div>
      )}

      {activeSection === 'favorites' && (
        <div className="feature-panel" style={{ textAlign: 'left' }}>
          <h3>Tus publicaciones guardadas</h3>
          {savedItems.length ? (
            savedItems.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px',
                  border: '1px solid var(--line)',
                  borderRadius: '12px',
                }}
              >
                <div>
                  <strong>{item.title}</strong>
                  <small style={{ display: 'block', color: 'var(--muted)' }}>
                    {item.providerName} · {item.priceLabel}
                  </small>
                </div>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => onOpenSavedItem(item)}
                >
                  Abrir ficha
                </button>
              </div>
            ))
          ) : (
            <p style={{ fontSize: 13, color: 'var(--muted)' }}>
              Aún no has guardado publicaciones. Toca el ícono de marcador en cualquier tarjeta para
              tenerla siempre a la mano.
            </p>
          )}
        </div>
      )}

      {activeSection === 'offline' && (
        <div className="feature-panel" style={{ textAlign: 'left' }}>
          <h3>Datos en tu dispositivo y Bienvenida</h3>
          <p style={{ fontSize: 13 }}>
            • Teléfonos de emergencia (116, 105, 106, 115): <b>Disponibles sin internet</b>
            <br />• Publicaciones guardadas: <b>{savedItems.length}</b>
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button type="button" className="secondary-button" onClick={onRepeatTutorial}>
              Ver introducción de bienvenida
            </button>
            <button
              type="button"
              className="text-button"
              onClick={() => {
                window.localStorage.removeItem('nexobarrio-draft')
                alert('Borradores locales eliminados.')
              }}
            >
              Borrar borradores guardados
            </button>
          </div>
        </div>
      )}

      {activeSection === 'moderation' && (
        <div className="feature-panel" style={{ textAlign: 'left' }}>
          <h3>Privacidad y seguridad vecinal</h3>
          <p style={{ fontSize: 13 }}>
            Tu dirección exacta nunca es pública en el mapa; solo se muestra una distancia
            referencial en tu zona. Puedes reportar cualquier anuncio o bloquear contactos no
            deseados.
          </p>
          {blockedUsers.length > 0 ? (
            blockedUsers.map((u) => (
              <div
                key={u}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 10px',
                  background: '#f7f9f7',
                  borderRadius: '10px',
                }}
              >
                <span>🚫 {u}</span>
                <button
                  type="button"
                  className="text-button"
                  onClick={() => setBlockedUsers((prev) => prev.filter((item) => item !== u))}
                >
                  Desbloquear
                </button>
              </div>
            ))
          ) : (
            <small style={{ color: 'var(--muted)' }}>No tienes usuarios bloqueados.</small>
          )}
        </div>
      )}

      <div style={{ marginTop: 18 }}>
        {user ? (
          <button className="secondary-button primary-button--wide" onClick={onLogout}>
            Cerrar sesión ({user.displayName})
          </button>
        ) : (
          <Link href="/auth" className="primary-button primary-button--wide">
            Iniciar sesión o cambiar de cuenta
          </Link>
        )}
      </div>
    </div>
  )
}

function HelpView({
  onTriggerScenario,
  onRepeatTutorial,
}: {
  onTriggerScenario: (code: string) => void
  onRepeatTutorial: () => void
}) {
  return (
    <div className="simple-modal">
      <span className="simple-modal__icon">
        <CircleHelp size={28} />
      </span>
      <span className="eyebrow">Centro de Ayuda · NexoBarrio</span>
      <h1>¿Qué te gustaría hacer hoy en tu barrio?</h1>
      <p>
        Selecciona cualquiera de estas acciones para ir directamente a esa sección de la plataforma:
      </p>
      <div className="help-options" style={{ maxHeight: '340px', overflowY: 'auto' }}>
        {QUICK_GUIDES.map((guide) => (
          <button key={guide.code} type="button" onClick={() => onTriggerScenario(guide.code)}>
            <Award size={20} />
            <span>
              <strong>{guide.title}</strong>
              <small>{guide.desc}</small>
            </span>
          </button>
        ))}
      </div>
      <div style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between' }}>
        <button type="button" className="secondary-button" onClick={onRepeatTutorial}>
          Ver bienvenida paso a paso
        </button>
      </div>
    </div>
  )
}

function NotificationsView({
  notifications,
  unread,
  onOpenActivity,
  onMarkAllRead,
}: {
  notifications: NotificationView[]
  unread: number
  onOpenActivity: () => void
  onMarkAllRead: () => Promise<void>
}) {
  const demoNotices: NotificationView[] =
    notifications.length > 0
      ? notifications
      : [
          {
            id: 'n-demo-1',
            title: 'Nueva coincidencia en tu barrio',
            body: 'María Elena presta un Taladro Bosch a 300 m que coincide con tu búsqueda.',
            kind: 'match',
            read: false,
            deliveryState: 'internal',
          },
          {
            id: 'n-demo-2',
            title: 'Recordatorio de préstamo de herramienta',
            body: 'Recuerda confirmar la devolución junto con tu vecino al terminar de usarla.',
            kind: 'reminder',
            read: false,
            deliveryState: 'internal',
          },
        ]

  return (
    <div className="simple-modal">
      <span className="simple-modal__icon">
        <Bell size={28} />
      </span>
      <span className="eyebrow">Avisos de tu barrio</span>
      <h1>Notificaciones</h1>
      {unread > 0 && (
        <button className="text-button notification-read-all" onClick={onMarkAllRead}>
          Marcar {unread} como leídas
        </button>
      )}
      <div className="notification-list">
        {demoNotices.map((notification) => {
          const Icon =
            notification.kind === 'message'
              ? MessageCircle
              : notification.kind === 'reminder'
                ? Clock3
                : Sparkles
          return (
            <article
              key={notification.id}
              className={notification.read ? '' : 'is-unread'}
              onClick={onOpenActivity}
              style={{ cursor: 'pointer' }}
            >
              <span className="activity-icon activity-icon--green">
                <Icon size={18} />
              </span>
              <div>
                <strong>{notification.title}</strong>
                <p>{notification.body}</p>
                <small>Toca para ver en Actividad</small>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
