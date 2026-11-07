import type { CollectionConfig } from 'payload'

import { authenticatedAppUser, isAdmin } from './access'

export const Communities: CollectionConfig = {
  slug: 'communities',
  admin: { group: 'Comunidad', useAsTitle: 'name' },
  access: {
    create: authenticatedAppUser,
    delete: isAdmin,
    read: () => true,
    update: isAdmin,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'description', type: 'textarea', required: true },
    { name: 'zoneName', type: 'text' },
    { name: 'topic', type: 'text', required: true },
    { name: 'rules', type: 'textarea', required: true },
    { name: 'memberCount', type: 'number', defaultValue: 0, min: 0 },
    { name: 'visibility', type: 'select', defaultValue: 'public', options: ['public', 'private'] },
    { name: 'isDemo', type: 'checkbox', defaultValue: false },
  ],
  timestamps: true,
}
