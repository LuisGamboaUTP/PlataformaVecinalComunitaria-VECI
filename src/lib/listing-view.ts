export type PublicListing = {
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

export function toPublicListing(doc: any): PublicListing {
  const owner = typeof doc.owner === 'object' ? doc.owner : null
  const displayName = owner?.displayName as string | undefined

  return {
    id: String(doc.id),
    title: String(doc.title ?? ''),
    description: String(doc.description ?? ''),
    kind: String(doc.kind ?? 'product'),
    modes: Array.isArray(doc.modes) ? doc.modes.map(String) : [],
    category: String(doc.category ?? ''),
    priceLabel: doc.priceLabel || undefined,
    zoneName: String(doc.zoneName ?? ''),
    locationLabel: String(doc.locationLabel ?? ''),
    distanceKm: typeof doc.distanceKm === 'number' ? doc.distanceKm : undefined,
    x: typeof doc.mapPosition?.x === 'number' ? doc.mapPosition.x : 50,
    y: typeof doc.mapPosition?.y === 'number' ? doc.mapPosition.y : 50,
    image: typeof doc.media === 'object' ? doc.media?.url || undefined : undefined,
    availability: doc.availability || undefined,
    providerName: doc.providerName || displayName || doc.demoProvider?.name || 'Vecino de la zona',
    initials:
      displayName
        ?.split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase() ||
      doc.providerInitials ||
      doc.demoProvider?.initials ||
      'NB',
    rating: typeof doc.demoProvider?.rating === 'number' ? doc.demoProvider.rating : undefined,
    reviewCount:
      typeof doc.demoProvider?.reviewCount === 'number' ? doc.demoProvider.reviewCount : undefined,
    completedCount:
      typeof doc.demoProvider?.completedCount === 'number'
        ? doc.demoProvider.completedCount
        : undefined,
    approvalAuthor: doc.neighborApproval?.author || undefined,
    approvalZone: doc.neighborApproval?.declaredZone || undefined,
    approvalNote: doc.neighborApproval?.note || undefined,
    featured: Boolean(doc.featured),
    isDemo: Boolean(doc.isDemo),
  }
}
