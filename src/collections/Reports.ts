import type { CollectionConfig } from 'payload'

import { isAppUser } from './access'

export const Reports: CollectionConfig = {
  slug: 'reports',
  admin: { group: 'Seguridad', useAsTitle: 'reason' },
  access: {
    create: ({ req }) => isAppUser(req.user),
    delete: ({ req }) => req.user?.collection === 'admins',
    read: ({ req }) => req.user?.collection === 'admins',
    update: ({ req }) => req.user?.collection === 'admins',
  },
  fields: [
    {
      name: 'reason',
      type: 'select',
      required: true,
      options: ['fraud', 'abuse', 'spam', 'privacy', 'false-information', 'other'],
    },
    { name: 'details', type: 'textarea', required: true, maxLength: 1000 },
    {
      name: 'targetType',
      type: 'select',
      required: true,
      options: ['listing', 'profile', 'message', 'review', 'emergency'],
    },
    { name: 'targetId', type: 'text', required: true },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'open',
      options: ['open', 'reviewing', 'resolved', 'dismissed'],
    },
  ],
  timestamps: true,
}
