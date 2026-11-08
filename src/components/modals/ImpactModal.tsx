import type { ListingView } from '@/app/(frontend)/NeighborhoodApp'

export function ImpactModal({ listings }: { listings: ListingView[] }) {
  const counts = Object.entries({
    Servicios: listings.filter((item) => item.kind === 'service').length,
    Trueques: listings.filter((item) => item.kind === 'barter').length,
    Préstamos: listings.filter((item) => item.kind === 'loan').length,
    Regalos: listings.filter((item) => item.kind === 'gift').length,
  })
  const max = Math.max(1, ...counts.map(([, count]) => count))
  return (
    <div className="impact-view">
      <span className="eyebrow">Impacto del barrio</span>
      <h1>Recursos que circulan cerca</h1>
      <p>
        Indicadores basados en las publicaciones visibles. El ahorro económico requiere
        transacciones confirmadas.
      </p>
      <div className="impact-metrics">
        <span>
          <strong>{listings.filter((item) => item.kind === 'loan').length}</strong>
          <small>Herramientas prestables</small>
        </span>
        <span>
          <strong>
            {listings.filter((item) => ['barter', 'gift'].includes(item.kind)).length}
          </strong>
          <small>Opciones de reutilización</small>
        </span>
      </div>
      <h2>Modalidades publicadas</h2>
      {counts.map(([name, count]) => (
        <div className="impact-bar" key={name}>
          <span>{name}</span>
          <div>
            <i style={{ width: `${(count / max) * 100}%` }} />
          </div>
          <strong>{count}</strong>
        </div>
      ))}
    </div>
  )
}
