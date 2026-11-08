import type { ListingView } from '@/app/(frontend)/NeighborhoodApp'
import {
  Heart,
  Leaf,
  Sparkles,
  TreePine,
  Wrench,
  Coins,
} from 'lucide-react'

export function ImpactModal({ listings }: { listings: ListingView[] }) {
  const loanCount = listings.filter((item) => item.kind === 'loan').length
  const barterCount = listings.filter((item) => item.kind === 'barter').length
  const giftCount = listings.filter((item) => item.kind === 'gift').length
  const serviceCount = listings.filter((item) => item.kind === 'service').length

  const totalShared = loanCount + barterCount + giftCount
  // Cada herramienta prestada o trueque evita manufactura y transporte nuevo
  const co2SavedKg = Math.round(loanCount * 14.5 + barterCount * 9.2 + giftCount * 7.5 + serviceCount * 2.5)
  const treesEquiv = Math.max(2, Math.round(co2SavedKg / 18))
  const estimatedSavings = Math.round(loanCount * 45 + barterCount * 60 + giftCount * 35 + serviceCount * 25)

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
        {/* CARD 1: ÁRBOLES Y CO2 */}
        <div className="wow-card wow-card--green">
          <div className="wow-card__icon">
            <TreePine size={28} />
          </div>
          <div className="wow-card__content">
            <span className="wow-card__number">{treesEquiv} árboles</span>
            <strong className="wow-card__title">Equivalente de CO₂ evitado</strong>
            <p>
              Evitamos que <b>{co2SavedKg} kg</b> de emisiones vayan al aire al compartir
              herramientas y no comprar productos nuevos.
            </p>
          </div>
        </div>

        {/* CARD 2: COSAS COMPARTIDAS */}
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

        {/* CARD 3: PLATA AHORRADA */}
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

      {/* MINI MENSAJE DE CIERRE VECINAL */}
      <div className="impact-wow-footer">
        <Heart size={18} className="impact-heart-pulse" />
        <span>Menos consumo innecesario, más amigos en la cuadra.</span>
      </div>
    </div>
  )
}
