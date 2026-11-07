import type { CollectionConfig } from 'payload'

import { isAdmin } from './access'

export const ResourceDirectory: CollectionConfig = {
  slug: 'resource-directory',
  admin: { group: 'Emergencia y ayuda', useAsTitle: 'name' },
  access: {
    create: isAdmin,
    delete: isAdmin,
    read: () => true,
    update: isAdmin,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'type', type: 'select', required: true, options: ['official', 'community'] },
    { name: 'phone', type: 'text' },
    { name: 'zoneName', type: 'text', required: true },
    { name: 'description', type: 'textarea', required: true },
    { name: 'source', type: 'text', required: true },
    { name: 'sourceUpdatedAt', type: 'date', required: true },
    { name: 'availabilityVerified', type: 'checkbox', defaultValue: false },
    { name: 'isDemo', type: 'checkbox', defaultValue: false },
  ],
  timestamps: true,
}
