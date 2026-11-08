'use client'
import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import {
  HandHeart,
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
function EmptyState({ onPublish, onExpand }: { onPublish: () => void; onExpand: () => void }) {
  return (
    <div className="empty-state">
      <h2>No encontramos resultados cercanos</h2>
      <p>Amplía el radio o publica lo que necesitas.</p>
      <button className="secondary-button" onClick={onExpand}>
        Ampliar radio a 10 km
      </button>
      <button className="primary-button" onClick={onPublish}>
        Publicar necesidad
      </button>
    </div>
  )
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
  useGSAP(
    () => {
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
      dependencies: [filtered.length, activeKind, radiusKm, nowOnly],
      revertOnUpdate: true,
    },
  )
  return (
    <div className="map-layout" ref={root}>
      <div className="map-canvas">
        <div className="map-quick-filters">
          <button
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
        {sheetOpen && selected && filtered.some((item) => item.id === selected.id) && (
          <div
            className="map-preview"
            style={{
              left: `${Math.min(70, Math.max(10, selected.x))}%`,
              top: `${Math.min(64, Math.max(15, selected.y))}%`,
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
              {selected.distanceKm?.toFixed(2) ?? '—'} km{' '}
              {selected.approvalAuthor
                ? '· ✓ Visto Bueno Vecinal'
                : '· Sin recomendación vecinal aún'}
            </span>
            <button className="primary-button" onClick={() => openDetail(selected)}>
              Ver ficha
            </button>
          </div>
        )}
        <button
          className="my-location"
          aria-label="Consultar mi ubicación aproximada"
          onClick={() => {
            if (!navigator.geolocation) {
              setGeoNotice('La ubicación no está disponible en este navegador.')
              return
            }
            navigator.geolocation.getCurrentPosition(
              () =>
                setGeoNotice(
                  'Ubicación detectada. El mapa muestra posiciones aproximadas de las publicaciones.',
                ),
              () =>
                setGeoNotice(
                  'No se pudo obtener tu ubicación. Puedes explorar el mapa igualmente.',
                ),
              { enableHighAccuracy: false, timeout: 8000 },
            )
          }}
        >
          <Navigation size={20} />
        </button>
        {geoNotice && (
          <p className="geo-notice" role="status">
            {geoNotice}
          </p>
        )}
        <div className="map-license">Mapa esquemático · ubicaciones aproximadas</div>
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
