import type { CollectionConfig } from 'payload'

import {
  getAppUserId,
  ownerFieldAccess,
  ownerOrServerWorkflowOrAdmin,
  serverWorkflowAccess,
} from './access'

export const Reservations: CollectionConfig = {
  slug: 'reservations',
  admin: { group: 'Operación vecinal', useAsTitle: 'listingKey' },
  access: {
    create: serverWorkflowAccess,
    delete: serverWorkflowAccess,
    read: ownerOrServerWorkflowOrAdmin,
    update: () => false,
  },
  hooks: {
    beforeChange: [
      ({ data, operation, req }) => {
        const userId = getAppUserId(req.user)
        if (operation === 'create' && userId !== null) return { ...data, owner: userId }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'owner',
      type: 'relationship',
      relationTo: 'users' as never,
      required: true,
      access: { create: ownerFieldAccess, update: ownerFieldAccess },
    },
    {
      name: 'listingKey',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { description: 'Candado único que evita reservar dos veces el mismo recurso.' },
    },
    {
      name: 'listing',
      type: 'relationship',
      relationTo: 'listings' as never,
      required: true,
    },
    {
      name: 'interaction',
      type: 'relationship',
      relationTo: 'interactions' as never,
      required: true,
    },
  ],
  timestamps: true,
}
