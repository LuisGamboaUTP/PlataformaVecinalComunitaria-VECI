import type { CollectionConfig } from 'payload'

import { isAdmin } from './access'

export const Zones: CollectionConfig = {
  slug: 'zones',
  admin: { group: 'Comunidad', useAsTitle: 'name' },
  access: {
    create: isAdmin,
    delete: isAdmin,
    read: () => true,
    update: isAdmin,
  },
  fields: [
    { name: 'name', type: 'text', required: true, unique: true, index: true },
    { name: 'district', type: 'text', required: true },
    { name: 'centerLatitude', type: 'number', required: true },
    { name: 'centerLongitude', type: 'number', required: true },
    { name: 'active', type: 'checkbox', defaultValue: true },
  ],
  timestamps: true,
}
