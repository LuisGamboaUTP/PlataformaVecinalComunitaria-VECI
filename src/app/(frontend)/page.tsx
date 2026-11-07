import config from '@payload-config'
import { getPayload } from 'payload'

import { toPublicListing } from '@/lib/listing-view'
import { NeighborhoodApp, type ListingView } from './NeighborhoodApp'

export const dynamic = 'force-static'

export default async function HomePage() {
  const payload = await getPayload({ config })
  const result = await payload.find({
    collection: 'listings' as never,
    depth: 1,
    limit: 30,
    sort: '-featured',
    overrideAccess: false,
  })

  const listings: ListingView[] = result.docs.map(toPublicListing)

  return <NeighborhoodApp listings={listings} />
}
