'use client'
import { Map, ListFilter } from 'lucide-react'
import { ListingCard } from '@/components/cards/ListingCard'
import { TriangularBarterPanel } from '@/components/explore/TriangularBarterPanel'
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
type Props = {
  filtered: ListingView[]
  activeKind: string
  setActiveKind: (value: string) => void
  sortBy: 'distance' | 'rating' | 'recent'
  setSortBy: (value: 'distance' | 'rating' | 'recent') => void
  radiusKm: number
  setRadiusKm: (value: number) => void
  saved: Set<string>
  toggleSaved: (id: string) => void
  openDetail: (item: ListingView) => void
  onPublish: () => void
  onMap: () => void
}
export function ExploreTab({
  filtered,
  activeKind,
  setActiveKind,
  sortBy,
  setSortBy,
  radiusKm,
  setRadiusKm,
  saved,
  toggleSaved,
  openDetail,
  onPublish,
  onMap,
}: Props) {
  return (
    <section className="content-page">
      <TriangularBarterPanel />
      <div className="page-heading">
        <div>
          <span className="eyebrow">Explorar el barrio</span>
          <h1>Todo lo que está cerca</h1>
          <p>La lista usa los mismos filtros y publicaciones que el mapa.</p>
        </div>
        <button className="secondary-button" onClick={() => onMap()}>
          <Map size={18} /> Ver mapa
        </button>
      </div>
      <div className="explore-tools">
        <div className="filter-pills">
          {['all', 'service', 'product', 'barter', 'loan', 'skill', 'gift', 'help'].map((kind) => (
            <button
              key={kind}
              className={activeKind === kind ? 'is-active' : ''}
              onClick={() => setActiveKind(kind)}
            >
              {kind === 'all' ? 'Todos' : kindLabel[kind]}
            </button>
          ))}
        </div>
        <label className="filter-button">
          <ListFilter size={18} /> Ordenar{' '}
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as typeof sortBy)}
          >
            <option value="distance">Cercanía</option>
            <option value="rating">Mejor valorados</option>
            <option value="recent">Recientes</option>
          </select>
        </label>
        <label className="filter-button">
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
        <EmptyState onPublish={() => onPublish()} onExpand={() => setRadiusKm(10)} />
      )}
    </section>
  )
}
