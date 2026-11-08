const KIND_THEME: Record<string, { start: string; end: string; label: string }> = {
  service: { start: '#14b8a6', end: '#0f766e', label: 'Servicio vecinal' },
  product: { start: '#60a5fa', end: '#1d4ed8', label: 'Producto local' },
  skill: { start: '#a78bfa', end: '#6d28d9', label: 'Habilidad · Banco de Tiempo' },
  barter: { start: '#fb923c', end: '#c2410c', label: 'Trueque directo' },
  loan: { start: '#38bdf8', end: '#0369a1', label: 'Préstamo solidario' },
  gift: { start: '#f472b6', end: '#be185d', label: 'Regalo comunitario' },
  need: { start: '#fbbf24', end: '#b45309', label: 'Necesidad en el barrio' },
  help: { start: '#f87171', end: '#b91c1c', label: 'Ayuda vecinal' },
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export function formatPriceLabel(priceLabel?: string, kind?: string): string {
  const raw = (priceLabel || '').trim()
  if (!raw) {
    if (kind === 'loan') return 'Préstamo S/ 0'
    if (kind === 'barter') return 'Trueque'
    if (kind === 'gift') return 'Regalo S/ 0'
    return 'Sin costo'
  }
  if (/^\d+([.,]\d+)?$/.test(raw)) {
    return `S/ ${raw}`
  }
  return raw
}

export function resolveListingMedia(title?: string, kind?: string, image?: string): string {
  const safeTitle = (title || '').trim()
  const safeKind = (kind || 'service').trim()

  if (image && (image.startsWith('data:image/') || image.startsWith('http://') || image.startsWith('https://'))) {
    return image
  }

  const name = safeTitle.toLocaleLowerCase('es-PE')
  if (/bici/.test(name)) return '/images/listings/bicicleta.svg'
  if (/taladro|amoladora/.test(name)) return '/images/listings/taladro.svg'
  if (/ingl[eé]s|matem[aá]t|f[ií]sica|clase/.test(name)) return '/images/listings/clases.svg'
  if (/gasfiter|tuber[ií]a|fuga|filtraci/.test(name)) return '/images/listings/gasfiteria.svg'
  if (/hern[aá]n|adulto mayor|compra.*mercado|carga pesada/.test(name)) return '/images/listings/ayuda-mayor.svg'
  if (/libro|cuento/.test(name)) return '/images/listings/libros.svg'
  if (/escalera/.test(name)) return '/images/listings/escalera.svg'
  if (/electricista|instalaci[oó]n|tablero|intercomunicador/.test(name)) return '/images/listings/electricista.svg'

  if (image && image.startsWith('/images/listings/') && image !== '/images/listings/reparacion.svg') {
    return image
  }

  return listingArt(safeTitle, safeKind)
}

export function listingArt(title: string, kind: string): string {
  const name = title.toLocaleLowerCase('es-PE')
  if (/bici/.test(name)) return '/images/listings/bicicleta.svg'
  if (/taladro/.test(name)) return '/images/listings/taladro.svg'
  if (/ingl[eé]s/.test(name)) return '/images/listings/clases.svg'
  if (/gasfiter|tuber[ií]a|fuga/.test(name)) return '/images/listings/gasfiteria.svg'
  if (/hern[aá]n|adulto mayor/.test(name)) return '/images/listings/ayuda-mayor.svg'
  if (/libro|cuento/.test(name)) return '/images/listings/libros.svg'
  if (/escalera/.test(name)) return '/images/listings/escalera.svg'
  if (/electricista domiciliario|instalaciones/.test(name)) return '/images/listings/electricista.svg'

  const theme = KIND_THEME[kind] || KIND_THEME.service
  const cleanTitle = escapeXml(title.trim().slice(0, 32) || theme.label)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 320" role="img" aria-label="${cleanTitle}">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${theme.start}"/>
        <stop offset="100%" stop-color="${theme.end}"/>
      </linearGradient>
    </defs>
    <rect width="420" height="320" rx="28" fill="url(#g)"/>
    <circle cx="355" cy="45" r="95" fill="#ffffff" opacity="0.14"/>
    <circle cx="65" cy="285" r="115" fill="#ffffff" opacity="0.12"/>
    <rect x="32" y="190" width="356" height="92" rx="18" fill="#000000" opacity="0.22"/>
    <text x="50" y="232" font-family="Arial, sans-serif" font-weight="800" font-size="23" fill="#ffffff">${cleanTitle}</text>
    <text x="50" y="262" font-family="Arial, sans-serif" font-weight="600" font-size="15" fill="#f1f5f9">${escapeXml(theme.label)}</text>
  </svg>`

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}
