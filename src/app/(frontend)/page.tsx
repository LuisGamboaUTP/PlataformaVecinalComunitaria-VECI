import config from '@payload-config'
import { getPayload } from 'payload'

import { toPublicListing } from '@/lib/listing-view'
import { fallbackDemoListings } from '@/lib/demo-listings'
import { ensureSeeded } from '@/lib/seed-db'
import { NeighborhoodApp, type ListingView } from './NeighborhoodApp'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const payload = await getPayload({ config })
  await ensureSeeded(payload)
  const result = await payload.find({
    collection: 'listings' as never,
    depth: 1,
    limit: 30,
    sort: '-featured',
    overrideAccess: false,
  })

  const dbListings: ListingView[] = result.docs.map(toPublicListing)
  const listings: ListingView[] = dbListings.length > 0 ? dbListings : fallbackDemoListings

  return <NeighborhoodApp listings={listings} />
}
