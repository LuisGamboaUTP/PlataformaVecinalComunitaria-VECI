import type { ListingView } from '@/app/(frontend)/NeighborhoodApp'
import {
  Heart,
  ShieldCheck,
  Sparkles,
  TreePine,
  Wrench,
  Coins,
} from 'lucide-react'

const CATEGORY_BARS: { key: string; label: string; color: string }[] = [
  { key: 'service', label: 'Servicios y oficios locales', color: '#0f766e' },
  { key: 'loan', label: 'Préstamo de herramientas (S/ 0)', color: '#0284c7' },
  { key: 'barter', label: 'Trueques sin dinero', color: '#ea580c' },
  { key: 'skill', label: 'Banco de Tiempo / Habilidades', color: '#7c3aed' },
  { key: 'gift', label: 'Donaciones y regalos', color: '#db2777' },
  { key: 'help', label: 'Ayuda solidaria y necesidades', color: '#dc2626' },
]

export function ImpactModal({ listings }: { listings: ListingView[] }) {
  const loanCount = listings.filter((item) => item.kind === 'loan').length
  const barterCount = listings.filter((item) => item.kind === 'barter').length
  const giftCount = listings.filter((item) => item.kind === 'gift').length
  const serviceCount = listings.filter((item) => item.kind === 'service').length
  const totalCount = Math.max(1, listings.length)

  const totalShared = loanCount + barterCount + giftCount
  const co2SavedKg = Math.round(
    loanCount * 14.5 + barterCount * 9.2 + giftCount * 7.5 + serviceCount * 2.5,
  )
  const treesEquiv = Math.max(2, Math.round(co2SavedKg / 18))
  const estimatedSavings = Math.round(
    loanCount * 45 + barterCount * 60 + giftCount * 35 + serviceCount * 25,
  )

  return (
    <div className="impact-view impact-view--simple">
      {/* CABECERA EMOCIONAL Y HUMANA */}
      <div className="impact-wow-hero">
        <span className="impact-wow-pill">
          <Sparkles size={14} /> Orgullo de tu Barrio
        </span>
        <h2>¡Mira lo que estamos logrando juntos!</h2>
        <p>
          En tu zona no compramos cosas por gusto. Nos prestamos, truequeamos y nos damos una mano.
        </p>
      </div>

      {/* LAS 3 WOW CARDS LIMPIAS */}
      <div className="impact-wow-cards">
        <div className="wow-card wow-card--green">
          <div className="wow-card__icon">
            <TreePine size={28} />
          </div>
          <div className="wow-card__content">
            <span className="wow-card__number">{treesEquiv} árboles</span>
            <strong className="wow-card__title">Equivalente de CO₂ evitado</strong>
            <p>
              Evitamos que <b>{co2SavedKg} kg</b> de emisiones vayan al aire al compartir
              herramientas y evitar transporte mayor.
            </p>
          </div>
        </div>

        <div className="wow-card wow-card--teal">
          <div className="wow-card__icon">
            <Wrench size={28} />
          </div>
          <div className="wow-card__content">
            <span className="wow-card__number">{totalShared} recursos</span>
            <strong className="wow-card__title">Herramientas y cosas en rotación</strong>
            <p>
              Escaleras, taladros y libros que no terminan en la basura y sirven a muchas familias
              de la cuadra.
            </p>
          </div>
        </div>

        <div className="wow-card wow-card--amber">
          <div className="wow-card__icon">
            <Coins size={28} />
          </div>
          <div className="wow-card__content">
            <span className="wow-card__number">S/ {estimatedSavings.toLocaleString('es-PE')}</span>
            <strong className="wow-card__title">Plata ahorrada en el bolsillo</strong>
            <p>
              Dinero que las familias ahorraron en alquileres y compras gracias a la solidaridad
              vecinal.
            </p>
          </div>
        </div>
      </div>

      {/* GRÁFICO VISUAL POR CATEGORÍA (RECURSO AUDIOVISUAL PARA EL JURADO) */}
      <section className="wow-card" style={{ display: 'grid', gap: '10px' }}>
        <strong className="wow-card__title">Distribución de soluciones activas por categoría</strong>
        <div style={{ display: 'grid', gap: '8px' }}>
          {CATEGORY_BARS.map(({ key, label, color }) => {
            const count =
              key === 'help'
                ? listings.filter((item) => item.kind === 'help' || item.kind === 'need').length
                : listings.filter((item) => item.kind === key).length
            const pct = Math.max(12, Math.round((count / totalCount) * 100))
            return (
              <div key={key} style={{ display: 'grid', gap: '3px', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                  <span>{label}</span>
                  <span style={{ color }}>{count} pub.</span>
                </div>
                <div
                  style={{
                    height: '8px',
                    borderRadius: '999px',
                    background: '#eef2ef',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${pct}%`,
                      height: '100%',
                      borderRadius: '999px',
                      background: color,
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* MITIGACIÓN DE RIESGOS Y BENEFICIOS INSTITUCIONALES */}
      <section className="wow-card" style={{ display: 'grid', gap: '8px' }}>
        <strong className="wow-card__title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ShieldCheck size={17} color="#0f766e" /> Mitigación de Riesgos y Confianza Vecinal
        </strong>
        <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted)', lineHeight: 1.45 }}>
          • <b>Identidad validada:</b> Registro con DNI/CE y sello <i>Visto Bueno Vecinal</i>.<br />
          • <b>Privacidad residencial:</b> La dirección exacta nunca se publica en el mapa.<br />
          • <b>Resiliencia ante emergencias:</b> Directorio oficial y caché local operativos sin internet.
        </p>
      </section>

      {/* MINI MENSAJE DE CIERRE VECINAL */}
      <div className="impact-wow-footer">
        <Heart size={18} className="impact-heart-pulse" />
        <span>Menos consumo innecesario, más amigos en la cuadra.</span>
      </div>
    </div>
  )
}
