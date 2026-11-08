'use client'

import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import {
  ChevronDown,
  ChevronUp,
  HandHeart,
  HelpCircle,
  Layers,
  MapPin,
  Navigation,
  PackageOpen,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Users,
  Wrench,
  X,
} from 'lucide-react'
import { ListingCard } from '@/components/cards/ListingCard'
import { formatPriceLabel } from '@/lib/listing-art'
import type { ListingView } from '@/app/(frontend)/NeighborhoodApp'
import 'leaflet/dist/leaflet.css'

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

const PIN_PALETTE: Record<string, { light: string; main: string; dark: string }> = {
  service: { light: '#2dd4bf', main: '#0f766e', dark: '#115e59' },
  product: { light: '#60a5fa', main: '#1d4ed8', dark: '#1e3a8a' },
  skill: { light: '#a78bfa', main: '#7c3aed', dark: '#4c1d95' },
  barter: { light: '#fb923c', main: '#ea580c', dark: '#9a3412' },
  loan: { light: '#38bdf8', main: '#0284c7', dark: '#075985' },
  gift: { light: '#f472b6', main: '#db2777', dark: '#831843' },
  need: { light: '#fbbf24', main: '#d97706', dark: '#78350f' },
  help: { light: '#f87171', main: '#dc2626', dark: '#7f1d1d' },
}

// Default center: Centro Cívico, Lima, Perú
const DEFAULT_COORDS = { lat: -12.056, lng: -77.037 }

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function shortPinBadge(priceLabel?: string, kind?: string): string {
  const formatted = formatPriceLabel(priceLabel, kind)
  if (/^S\/\s*\d+/i.test(formatted)) {
    const match = formatted.match(/^S\/\s*\d+([.,]\d+)?/i)
    return match ? match[0] : formatted.slice(0, 10)
  }
  if (kind === 'loan') return 'S/ 0'
  if (kind === 'barter') return 'Trueque'
  if (kind === 'gift') return 'Regalo'
  if (kind === 'help') return 'Ayuda'
  if (kind === 'skill') return 'Habilidad'
  if (kind === 'need') return 'Necesidad'
  return formatted.length <= 10 ? formatted : `${formatted.slice(0, 9).trim()}…`
}

function buildTeardropPinSvg(kind: string, uid: string): string {
  const palette = PIN_PALETTE[kind] || PIN_PALETTE.service
  const gradId = `pin-grad-${uid}`
  const rimId = `pin-rim-${uid}`

  // Mini SVG path inside the white center circle depending on category
  const innerGlyph: Record<string, string> = {
    service: `<path d="M20 20l8 8M26.5 18.5a3.5 3.5 0 0 0-4.6 4.6l-4.4 4.4a1.5 1.5 0 0 0 2.1 2.1l4.4-4.4a3.5 3.5 0 0 0 4.6-4.6l-2 2-1.8-.3-.3-1.8 2-2z" stroke="${palette.main}" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
    product: `<path d="M18 20.5L24 17l6 3.5v7L24 31l-6-3.5v-7zM18 20.5l6 3.5 6-3.5M24 24v7" stroke="${palette.main}" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
    skill: `<path d="M17 22l7-3.5L31 22l-7 3.5L17 22zm3 2v4c0 1.5 2 2.8 4 2.8s4-1.3 4-2.8v-4" stroke="${palette.main}" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
    barter: `<path d="M18 21h11l-2.5-2.5M30 27H19l2.5 2.5" stroke="${palette.main}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
    loan: `<path d="M19 22h10v8H19zM21.5 22v-2a2.5 2.5 0 0 1 5 0v2" stroke="${palette.main}" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
    gift: `<path d="M18 23h12v7H18zM17 20.5h14V23H17zM24 20.5V30" stroke="${palette.main}" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
    need: `<circle cx="23" cy="23" r="4.2" stroke="${palette.main}" stroke-width="2" fill="none"/><path d="M26.2 26.2L30 30" stroke="${palette.main}" stroke-width="2" stroke-linecap="round"/>`,
    help: `<path d="M24 29.5s-6-3.8-6-7.8a3.5 3.5 0 0 1 6-2.3 3.5 3.5 0 0 1 6 2.3c0 4-6 7.8-6 7.8z" fill="${palette.main}"/>`,
  }

  return `
    <svg class="teardrop-pin__svg" viewBox="0 0 48 60" width="44" height="54" aria-hidden="true">
      <defs>
        <linearGradient id="${gradId}" x1="20%" y1="8%" x2="80%" y2="92%">
          <stop offset="0%" stop-color="${palette.light}" />
          <stop offset="52%" stop-color="${palette.main}" />
          <stop offset="100%" stop-color="${palette.dark}" />
        </linearGradient>
        <linearGradient id="${rimId}" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="${palette.dark}" />
          <stop offset="100%" stop-color="${palette.light}" />
        </linearGradient>
      </defs>
      <ellipse cx="24" cy="55" rx="9" ry="3.2" fill="rgba(15, 23, 42, 0.28)" />
      <path
        d="M24 3C13.5 3 5 11.4 5 21.8c0 12.9 16.2 29.3 17.9 31a1.6 1.6 0 0 0 2.2 0C26.8 51.1 43 34.7 43 21.8 43 11.4 34.5 3 24 3z"
        fill="url(#${gradId})"
        stroke="#ffffff"
        stroke-width="2.2"
      />
      <circle cx="24" cy="22" r="11.2" fill="url(#${rimId})" opacity="0.55" />
      <circle cx="24" cy="22" r="9.6" fill="#ffffff" />
      ${innerGlyph[kind] || innerGlyph.service}
    </svg>
  `
}

function EmptyState({ onPublish, onExpand }: { onPublish: () => void; onExpand: () => void }) {
  return (
    <div className="empty-state">
      <h2>No encontramos resultados cercanos</h2>
      <p>Amplía el radio de búsqueda o publica lo que necesitas.</p>
      <button className="secondary-button" onClick={onExpand}>
        Ampliar radio a 10 km
      </button>
      <button className="primary-button" onClick={onPublish}>
        Publicar necesidad
      </button>
    </div>
  )
}

type Props = {
  filtered: ListingView[]
  selected: ListingView | null
  setSelected: (item: ListingView) => void
  sheetOpen: boolean
  setSheetOpen: (value: boolean) => void
  nowOnly: boolean
  setNowOnly: (value: boolean) => void
  radiusKm: number
  setRadiusKm: (value: number) => void
  activeKind: string
  setActiveKind: (value: string) => void
  saved: Set<string>
  toggleSaved: (id: string) => void
  openDetail: (item: ListingView) => void
  onPublish: () => void
  geoNotice: string
  setGeoNotice: (value: string) => void
  onStartTour?: () => void
}

gsap.registerPlugin(useGSAP)

export function MapTab({
  filtered,
  selected,
  setSelected,
  sheetOpen,
  setSheetOpen,
  nowOnly,
  setNowOnly,
  radiusKm,
  setRadiusKm,
  activeKind,
  setActiveKind,
  saved,
  toggleSaved,
  openDetail,
  onPublish,
  geoNotice,
  setGeoNotice,
  onStartTour,
}: Props) {
  const root = useRef<HTMLDivElement>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leafletMapRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersLayerRef = useRef<any>(null)

  const [mapMode, setMapMode] = useState<'real' | 'demo'>('real')
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number }>(DEFAULT_COORDS)
  const [previewItem, setPreviewItem] = useState<ListingView | null>(null)
  const [showHint, setShowHint] = useState(true)

  // 1. Initial Geolocation Detection
  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) return

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setUserLocation(coords)
        setGeoNotice('Ubicación activa. Toca un pin de color para ver de qué trata.')
      },
      () => {
        setUserLocation(DEFAULT_COORDS)
        setGeoNotice('Zona: Centro Cívico (Lima). Toca cualquier pin de color para ver su resumen.')
      },
      { timeout: 7000, enableHighAccuracy: true },
    )
  }, [setGeoNotice])

  // Auto-dismiss geoNotice after 4.5 seconds
  useEffect(() => {
    if (!geoNotice) return
    const timer = window.setTimeout(() => {
      setGeoNotice('')
    }, 4500)
    return () => window.clearTimeout(timer)
  }, [geoNotice, setGeoNotice])

  // 2. Leaflet Map Lifecycle in 'real' mode
  useEffect(() => {
    if (mapMode !== 'real' || typeof window === 'undefined' || !mapContainerRef.current) return

    let isCancelled = false

    async function initLeaflet() {
      const L = await import('leaflet')
      if (isCancelled || !mapContainerRef.current) return

      if (leafletMapRef.current) {
        leafletMapRef.current.remove()
        leafletMapRef.current = null
      }

      const map = L.map(mapContainerRef.current, {
        center: [userLocation.lat, userLocation.lng],
        zoom: 15,
        zoomControl: false,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        subdomains: ['a', 'b', 'c'],
        maxZoom: 19,
      }).addTo(map)

      const markersGroup = L.layerGroup().addTo(map)
      markersLayerRef.current = markersGroup
      leafletMapRef.current = map

      const userIcon = L.divIcon({
        className: 'leaflet-div-icon',
        html: `
          <div class="user-pulse-marker" title="Tu ubicación en tiempo real">
            <div class="user-pulse-ring"></div>
            <div class="user-pulse-dot"></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      })

      L.marker([userLocation.lat, userLocation.lng], { icon: userIcon, zIndexOffset: 1000 })
        .addTo(map)
        .bindPopup('<b>Estás aquí</b><br>Tu ubicación vecinal en tiempo real.')
    }

    void initLeaflet()

    return () => {
      isCancelled = true
      if (leafletMapRef.current) {
        leafletMapRef.current.remove()
        leafletMapRef.current = null
      }
    }
  }, [mapMode, userLocation])

  // 3. Render Leaflet 3D Teardrop Pins when listings or selection change
  useEffect(() => {
    if (mapMode !== 'real' || !leafletMapRef.current || !markersLayerRef.current) return

    void import('leaflet').then((L) => {
      if (!markersLayerRef.current) return
      markersLayerRef.current.clearLayers()

      filtered.forEach((item, index) => {
        const spreadAngle = (index * 137.5 * Math.PI) / 180
        const latOffset = ((item.y - 50) / 100) * 0.012 + Math.sin(spreadAngle) * 0.00045
        const lngOffset = ((item.x - 50) / 100) * 0.014 + Math.cos(spreadAngle) * 0.00045
        const itemLat = userLocation.lat + latOffset
        const itemLng = userLocation.lng + lngOffset

        const isSelected = selected?.id === item.id
        const safeBadge = escapeHtml(shortPinBadge(item.priceLabel, item.kind))
        const safeUid = `${item.kind}-${index}`
        const pinSvg = buildTeardropPinSvg(item.kind, safeUid)

        const markerHtml = `
          <button
            type="button"
            class="teardrop-pin teardrop-pin--${item.kind} ${isSelected ? 'is-selected' : ''}"
            title="${escapeHtml(item.title)}"
          >
            ${pinSvg}
            <span class="teardrop-pin__badge">${safeBadge}</span>
          </button>
        `

        const customIcon = L.divIcon({
          className: 'leaflet-div-icon leaflet-div-icon--teardrop',
          html: markerHtml,
          iconSize: [54, 68],
          iconAnchor: [27, 54],
        })

        const marker = L.marker([itemLat, itemLng], { icon: customIcon })
        marker.on('click', () => {
          setSelected(item)
          setPreviewItem(item)
        })
        marker.addTo(markersLayerRef.current)
      })
    })
  }, [mapMode, filtered, selected, setSelected, userLocation])

  // 4. GSAP Stagger for 'demo' mode
  useGSAP(
    () => {
      if (mapMode !== 'demo') return
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      gsap.from('.teardrop-pin', {
        opacity: 0,
        y: -14,
        scale: 0.75,
        duration: 0.34,
        stagger: 0.04,
        ease: 'back.out(1.5)',
      })
    },
    {
      scope: root,
      dependencies: [mapMode, filtered.length, activeKind, radiusKm, nowOnly],
      revertOnUpdate: true,
    },
  )

  const centerOnMyLocation = () => {
    if (!navigator.geolocation) {
      setGeoNotice('La ubicación no está disponible en este navegador.')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setUserLocation(coords)
        setMapMode('real')
        if (leafletMapRef.current) {
          leafletMapRef.current.flyTo([coords.lat, coords.lng], 16, { duration: 1.2 })
        }
        setGeoNotice('Mapa centrado en tu posición exacta en tiempo real.')
      },
      () => {
        setGeoNotice('No pudimos acceder a tu GPS. Mostrando vista general del barrio.')
      },
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }

  return (
    <div className="map-layout" ref={root}>
      <div className="map-canvas">
        {/* FILTROS SUPERIORES Y TOGGLE DE MODO */}
        <div className="map-quick-filters">
          <button
            type="button"
            className={mapMode === 'real' ? 'is-active' : ''}
            onClick={() => setMapMode(mapMode === 'real' ? 'demo' : 'real')}
            title="Alternar entre mapa en vivo y mapa demo"
            style={{ fontWeight: 750 }}
          >
            {mapMode === 'real' ? (
              <>
                <Navigation size={14} /> GPS en vivo
              </>
            ) : (
              <>
                <Layers size={14} /> Barrio Demo
              </>
            )}
          </button>

          {onStartTour && (
            <button
              type="button"
              onClick={onStartTour}
              title="Ver guía paso a paso del mapa"
              style={{ fontWeight: 700, color: '#0f766e', borderColor: '#99f6e4' }}
            >
              <HelpCircle size={14} /> ¿Cómo funciona?
            </button>
          )}

          <button
            type="button"
            className={nowOnly ? 'is-active' : ''}
            onClick={() => setNowOnly(!nowOnly)}
            aria-pressed={nowOnly}
          >
            ⚡ Ahora
          </button>

          <label>
            Radio{' '}
            <select value={radiusKm} onChange={(event) => setRadiusKm(Number(event.target.value))}>
              {[1, 3, 5, 10].map((value) => (
                <option key={value} value={value}>
                  {value} km
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* MODO 1: MAPA REAL EN VIVO (LEAFLET + OPENSTREETMAP) */}
        {mapMode === 'real' ? (
          <div ref={mapContainerRef} className="leaflet-map-wrapper" />
        ) : (
          /* MODO 2: MAPA VECTORIAL ESQUEMÁTICO DE CENTRO CÍVICO */
          <>
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

            {filtered.map((item, index) => (
              <button
                key={item.id}
                type="button"
                className={`teardrop-pin teardrop-pin--demo teardrop-pin--${item.kind} ${selected?.id === item.id ? 'is-selected' : ''}`}
                style={{ left: `${item.x}%`, top: `${item.y}%` }}
                onClick={() => {
                  setSelected(item)
                  setPreviewItem(item)
                }}
                aria-label={`Ver ${item.title}`}
                title={item.title}
              >
                <span
                  className="teardrop-pin__holder"
                  dangerouslySetInnerHTML={{
                    __html: buildTeardropPinSvg(item.kind, `demo-${item.kind}-${index}`),
                  }}
                />
                <span className="teardrop-pin__badge">
                  {shortPinBadge(item.priceLabel, item.kind)}
                </span>
              </button>
            ))}
          </>
        )}

        {/* MINITARJETA FLOTANTE INTUITIVA AL TOCAR UN PIN DEL MAPA */}
        {previewItem && (
          <aside className="map-pin-card" role="dialog" aria-label="Vista rápida de publicación">
            <div className="map-pin-card__top">
              <span className={`kind-tag kind-tag--${previewItem.kind}`}>
                {kindLabel[previewItem.kind] || previewItem.kind}
              </span>
              <span className="map-pin-card__meta">
                <MapPin size={13} /> {previewItem.distanceKm?.toFixed(1) ?? '0.5'} km
                {previewItem.approvalAuthor && (
                  <b className="meta-verified">
                    <ShieldCheck size={13} /> Visto Bueno
                  </b>
                )}
              </span>
              <button
                type="button"
                className="map-preview__close"
                onClick={() => setPreviewItem(null)}
                aria-label="Cerrar vista rápida"
              >
                <X size={15} />
              </button>
            </div>
            <strong className="map-pin-card__title">{previewItem.title}</strong>
            <p className="map-pin-card__desc">{previewItem.description}</p>
            {previewItem.approvalAuthor && (
              <div
                style={{
                  fontSize: '11.5px',
                  color: '#047857',
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontWeight: 650,
                }}
              >
                <ShieldCheck size={14} color="#059669" />
                <span>
                  Recomendado por {previewItem.approvalAuthor} ({previewItem.approvalZone || 'Centro Cívico'})
                </span>
              </div>
            )}
            <div className="map-pin-card__actions">
              <strong className={`price-badge price-badge--${previewItem.kind}`}>
                {formatPriceLabel(previewItem.priceLabel, previewItem.kind)}
              </strong>
              <button
                type="button"
                className="primary-button"
                onClick={() => openDetail(previewItem)}
              >
                Ver ficha y contactar
              </button>
            </div>
          </aside>
        )}

        {/* BOTÓN FLOTANTE MI UBICACIÓN GPS */}
        <button
          className="my-location"
          aria-label="Centrar en mi ubicación en tiempo real"
          title="Centrar en mi ubicación"
          onClick={centerOnMyLocation}
        >
          <Navigation size={20} />
        </button>

        {geoNotice && (
          <p
            className="geo-notice"
            role="status"
            onClick={() => setGeoNotice('')}
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
            title="Toca para cerrar"
          >
            <span>{geoNotice}</span>
            <X size={14} style={{ opacity: 0.7, flexShrink: 0 }} />
          </p>
        )}

        <div className="map-license">
          {mapMode === 'real'
            ? 'OpenStreetMap · Posición en vivo'
            : 'Mapa esquemático · Centro Cívico'}
        </div>
      </div>

      {/* DISCOVERY SHEET INFERIOR (LISTA Y FILTROS) */}
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
            <span className="eyebrow">Cerca de ti · Toca un pin o tarjeta</span>
            <h1>{filtered.length} soluciones en tu zona</h1>
          </div>

          <div className="sheet-heading__actions">
            <button
              type="button"
              className="filter-button sheet-toggle-btn"
              onClick={() => setSheetOpen(!sheetOpen)}
            >
              {sheetOpen ? (
                <>
                  <ChevronDown size={16} /> Ver mapa
                </>
              ) : (
                <>
                  <ChevronUp size={16} /> Ver lista
                </>
              )}
            </button>
            {activeKind !== 'all' && (
              <button
                type="button"
                className="filter-button"
                onClick={() => setActiveKind('all')}
              >
                <SlidersHorizontal size={16} /> Ver todo
              </button>
            )}
          </div>
        </div>

        <div className="filter-pills" role="list" aria-label="Filtrar por color de categoría">
          {['all', 'service', 'product', 'barter', 'loan', 'skill', 'gift', 'need', 'help'].map(
            (kind) => (
              <button
                key={kind}
                type="button"
                data-kind={kind}
                className={`filter-pill filter-pill--${kind} ${activeKind === kind ? 'is-active' : ''}`}
                onClick={() => {
                  setActiveKind(kind)
                  setPreviewItem(null)
                }}
              >
                {kind !== 'all' && <i className={`kind-dot kind-dot--${kind}`} aria-hidden="true" />}
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
          <EmptyState onPublish={() => onPublish()} onExpand={() => setRadiusKm(10)} />
        )}
      </section>
    </div>
  )
}
