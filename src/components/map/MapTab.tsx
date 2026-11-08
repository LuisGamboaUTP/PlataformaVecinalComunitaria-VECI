'use client'

import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import {
  Compass,
  HandHeart,
  Layers,
  MapPin,
  Navigation,
  PackageOpen,
  Search,
  SlidersHorizontal,
  Sparkles,
  Users,
  Wrench,
  X,
} from 'lucide-react'
import { ListingCard } from '@/components/cards/ListingCard'
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

// Default center: Centro Cívico, Lima, Perú
const DEFAULT_COORDS = { lat: -12.056, lng: -77.037 }

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
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
}: Props) {
  const root = useRef<HTMLDivElement>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leafletMapRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersLayerRef = useRef<any>(null)

  const [mapMode, setMapMode] = useState<'real' | 'demo'>('real')
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number }>(DEFAULT_COORDS)
  const [hasRealGps, setHasRealGps] = useState(false)

  // 1. Initial Geolocation Detection
  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) return

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setUserLocation(coords)
        setHasRealGps(true)
        setGeoNotice('Ubicación detectada en tiempo real. Mostrando ofertas vecinales alrededor de ti.')
      },
      () => {
        setUserLocation(DEFAULT_COORDS)
        setHasRealGps(false)
        setGeoNotice('Punto de referencia: Centro Cívico (Lima). Puedes activar GPS para ver tu zona.')
      },
      { timeout: 7000, enableHighAccuracy: true },
    )
  }, [setGeoNotice])

  // 2. Leaflet Map Lifecycle in 'real' mode
  useEffect(() => {
    if (mapMode !== 'real' || typeof window === 'undefined' || !mapContainerRef.current) return

    let isCancelled = false

    async function initLeaflet() {
      const L = await import('leaflet')
      if (isCancelled || !mapContainerRef.current) return

      // Clean up previous map instance if exists
      if (leafletMapRef.current) {
        leafletMapRef.current.remove()
        leafletMapRef.current = null
      }

      const map = L.map(mapContainerRef.current, {
        center: [userLocation.lat, userLocation.lng],
        zoom: 15,
        zoomControl: false,
      })

      // Minimalist Clean CartoDB Positron Layer (Light, OpenStreetMap data)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map)

      // Layer group for dynamic markers
      const markersGroup = L.layerGroup().addTo(map)
      markersLayerRef.current = markersGroup
      leafletMapRef.current = map

      // Pulsing User Location Marker
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

  // 3. Render Leaflet Markers when listings or selection change
  useEffect(() => {
    if (mapMode !== 'real' || !leafletMapRef.current || !markersLayerRef.current) return

    void import('leaflet').then((L) => {
      if (!markersLayerRef.current) return
      markersLayerRef.current.clearLayers()

      filtered.forEach((item) => {
        // Calculate coordinate around user's location based on item (x, y) offset
        const latOffset = ((item.y - 50) / 100) * 0.012
        const lngOffset = ((item.x - 50) / 100) * 0.014
        const itemLat = userLocation.lat + latOffset
        const itemLng = userLocation.lng + lngOffset

        const isSelected = selected?.id === item.id

        const markerHtml = `
          <button type="button" class="map-marker map-marker--${item.kind} ${isSelected ? 'is-selected' : ''}" style="position: relative; transform: translate(-50%, -50%); cursor: pointer;">
            <span>${item.priceLabel || kindLabel[item.kind] || item.title}</span>
          </button>
        `

        const customIcon = L.divIcon({
          className: 'leaflet-div-icon',
          html: markerHtml,
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        })

        const marker = L.marker([itemLat, itemLng], { icon: customIcon })
        marker.on('click', () => {
          setSelected(item)
          setSheetOpen(true)
        })
        marker.addTo(markersLayerRef.current)
      })
    })
  }, [mapMode, filtered, selected, setSelected, setSheetOpen, userLocation])

  // 4. GSAP Stagger for 'demo' mode
  useGSAP(
    () => {
      if (mapMode !== 'demo') return
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      gsap.from('.map-marker', {
        opacity: 0,
        scale: 0.75,
        duration: 0.32,
        stagger: 0.035,
        ease: 'back.out(1.4)',
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
        setHasRealGps(true)
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
          </>
        )}

        {/* TARJETA DESLIZANTE DE VISTA PREVIA (BOTTOM SHEET COMPACTO) */}
        {sheetOpen && selected && filtered.some((item) => item.id === selected.id) && (
          <div
            className="map-preview"
            style={{
              left: mapMode === 'real' ? '12px' : `${Math.min(70, Math.max(10, selected.x))}%`,
              top: mapMode === 'real' ? 'auto' : `${Math.min(64, Math.max(15, selected.y))}%`,
              bottom: mapMode === 'real' ? '185px' : undefined,
            }}
          >
            <div className="map-preview__header">
              <strong>{selected.title}</strong>
              <button
                type="button"
                className="map-preview__close"
                onClick={(e) => {
                  e.stopPropagation()
                  setSelected(null as unknown as ListingView)
                }}
                aria-label="Cerrar vista previa"
              >
                <X size={16} />
              </button>
            </div>

            <span>
              {selected.distanceKm != null ? `${selected.distanceKm.toFixed(2)} km` : 'Cerca de ti'}{' '}
              {selected.approvalAuthor
                ? '· ✓ Visto Bueno Vecinal'
                : '· Vecino verificado'}
            </span>

            <button className="primary-button" onClick={() => openDetail(selected)}>
              Ver ficha completa
            </button>
          </div>
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
          <p className="geo-notice" role="status">
            {geoNotice}
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
          {['all', 'service', 'product', 'barter', 'loan', 'skill', 'gift', 'help'].map((kind) => (
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
          <EmptyState onPublish={() => onPublish()} onExpand={() => setRadiusKm(10)} />
        )}
      </section>
    </div>
  )
}
