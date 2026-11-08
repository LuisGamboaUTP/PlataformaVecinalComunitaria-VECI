import type { ListingView } from '@/app/(frontend)/NeighborhoodApp'
import {
  Award,
  HeartHandshake,
  Leaf,
  PackageOpen,
  Recycle,
  Sparkles,
  TrendingUp,
  Wrench,
  ShieldCheck,
} from 'lucide-react'

export function ImpactModal({ listings }: { listings: ListingView[] }) {
  const loanCount = listings.filter((item) => item.kind === 'loan').length
  const barterCount = listings.filter((item) => item.kind === 'barter').length
  const giftCount = listings.filter((item) => item.kind === 'gift').length
  const serviceCount = listings.filter((item) => item.kind === 'service').length
  const helpCount = listings.filter((item) => item.kind === 'help').length

  const totalCircular = loanCount + barterCount + giftCount
  // Cada herramienta prestada o trueque evita la manufactura y despacho de un producto (~14.5 kg CO2)
  const co2SavedKg = Math.round(loanCount * 14.5 + barterCount * 9.2 + giftCount * 7.5 + serviceCount * 2.5)
  // Ahorro monetario colectivo estimado retenido en el vecindario
  const estimatedSavings = Math.round(loanCount * 45 + barterCount * 55 + giftCount * 30 + serviceCount * 35)

  const categories = [
    {
      label: 'Préstamos de Herramientas',
      count: loanCount,
      icon: Wrench,
      detail: 'Biblioteca comunitaria (cero compra innecesaria)',
      color: '#059669',
    },
    {
      label: 'Trueques Vecinales',
      count: barterCount,
      icon: Sparkles,
      detail: 'Intercambio circular directo y triangular',
      color: '#0d9488',
    },
    {
      label: 'Regalos y Donaciones',
      count: giftCount,
      icon: Recycle,
      detail: 'Reutilización activa y cero desperdicio',
      color: '#10b981',
    },
    {
      label: 'Servicios de Proximidad',
      count: serviceCount,
      icon: PackageOpen,
      detail: 'Menos traslados largos en transporte',
      color: '#0284c7',
    },
    {
      label: 'Apoyo y Voluntariado',
      count: helpCount,
      icon: HeartHandshake,
      detail: 'Cuidado de adultos mayores y compras',
      color: '#f59e0b',
    },
  ]

  const maxCategory = Math.max(1, ...categories.map((c) => c.count))

  return (
    <div className="impact-view">
      {/* CABECERA HERO SOSTENIBLE */}
      <div className="impact-hero">
        <div className="impact-hero__badge">
          <Leaf size={15} />
          <span>Economía Circular & Impacto Comunitario</span>
        </div>
        <h1>Huella Verde del Barrio</h1>
        <p>
          Cada herramienta prestada, trueque y oficio de proximidad evita residuos, reduce
          emisiones por transporte y fortalece la economía de nuestro vecindario.
        </p>
      </div>

      {/* METRICAS PRINCIPALES DE IMPACTO */}
      <div className="impact-kpis-grid">
        <div className="impact-kpi impact-kpi--eco">
          <div className="impact-kpi__header">
            <span className="impact-kpi__icon">
              <Leaf size={20} />
            </span>
            <small>Emisiones reducidas</small>
          </div>
          <strong>{co2SavedKg} kg</strong>
          <p>CO₂ evitado por reutilización local</p>
          <div className="impact-kpi__sub">
            <TrendingUp size={13} />
            <span>Equivale a {Math.max(1, Math.round(co2SavedKg / 18))} árboles salvados</span>
          </div>
        </div>

        <div className="impact-kpi impact-kpi--circular">
          <div className="impact-kpi__header">
            <span className="impact-kpi__icon">
              <Recycle size={20} />
            </span>
            <small>Economía Circular</small>
          </div>
          <strong>{totalCircular}</strong>
          <p>Ítems y recursos recirculando</p>
          <div className="impact-kpi__sub">
            <ShieldCheck size={13} />
            <span>Préstamos, trueques y donaciones</span>
          </div>
        </div>

        <div className="impact-kpi impact-kpi--tools">
          <div className="impact-kpi__header">
            <span className="impact-kpi__icon">
              <Wrench size={20} />
            </span>
            <small>Biblioteca Barrial</small>
          </div>
          <strong>{loanCount}</strong>
          <p>Equipos y herramientas para uso libre</p>
          <div className="impact-kpi__sub">
            <span>S/ 0 costo de alquiler a vecinos</span>
          </div>
        </div>

        <div className="impact-kpi impact-kpi--savings">
          <div className="impact-kpi__header">
            <span className="impact-kpi__icon">
              <Award size={20} />
            </span>
            <small>Ahorro Comunitario</small>
          </div>
          <strong>S/ {estimatedSavings.toLocaleString('es-PE')}</strong>
          <p>Dinero retenido en los vecinos</p>
          <div className="impact-kpi__sub">
            <span>Calculado por intercambios directos</span>
          </div>
        </div>
      </div>

      {/* DESGLOSE POR MODALIDAD ECOLÓGICA */}
      <div className="impact-section">
        <div className="impact-section__header">
          <h2>Modalidades Activas y Sostenibles</h2>
          <span className="impact-section__pill">Total: {listings.length} activas</span>
        </div>

        <div className="impact-bars-stack">
          {categories.map((item) => {
            const Icon = item.icon
            const percentage = Math.round((item.count / maxCategory) * 100)
            return (
              <div className="impact-bar-card" key={item.label}>
                <div className="impact-bar-card__top">
                  <div className="impact-bar-card__label">
                    <span className="impact-bar-card__icon" style={{ color: item.color }}>
                      <Icon size={16} />
                    </span>
                    <div>
                      <strong>{item.label}</strong>
                      <small>{item.detail}</small>
                    </div>
                  </div>
                  <strong className="impact-bar-card__count">{item.count}</strong>
                </div>
                <div className="impact-bar-track">
                  <div
                    className="impact-bar-fill"
                    style={{
                      width: `${item.count > 0 ? Math.max(12, percentage) : 0}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* SELLO DE RECONOCIMIENTO BARRIAL */}
      <div className="impact-badge-banner">
        <div className="impact-badge-banner__icon">
          <Sparkles size={24} />
        </div>
        <div className="impact-badge-banner__text">
          <strong>Nivel de Barrio Circular: Activo Nivel 2</strong>
          <p>
            Cumpliendo las metas ODS 11 (Ciudades Sostenibles) y ODS 12 (Consumo Responsable)
            al priorizar la economía comunitaria de proximidad.
          </p>
        </div>
      </div>
    </div>
  )
}
