import { localListings } from '@/lib/local-listings'
import { NeighborhoodApp } from './NeighborhoodApp'

export default function HomePage() {
  return <NeighborhoodApp listings={localListings} />
}
