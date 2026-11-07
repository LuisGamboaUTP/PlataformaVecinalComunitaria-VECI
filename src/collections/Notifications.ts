import type { CollectionConfig } from 'payload'

import { getAppUserId, ownerFieldAccess, ownerOrAdmin, serverWorkflowAccess } from './access'

export const Notifications: CollectionConfig = {
  slug: 'notifications',
  admin: { group: 'Operación vecinal', useAsTitle: 'title' },
  access: {
    create: serverWorkflowAccess,
    delete: ownerOrAdmin,
    read: ownerOrAdmin,
    update: ownerOrAdmin,
  },
  hooks: {
    beforeChange: [
      ({ data, operation, req, context }) => {
        const currentUserId = getAppUserId(req.user)
        const notificationOwnerId = context.notificationOwnerId
        if (
          operation === 'create' &&
          currentUserId !== null &&
          (typeof notificationOwnerId === 'string' || typeof notificationOwnerId === 'number')
        ) {
          return {
            ...data,
            owner: notificationOwnerId,
            read: false,
            deliveryState: 'internal',
          }
        }
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
    { name: 'title', type: 'text', required: true },
    { name: 'body', type: 'textarea', required: true },
    {
      name: 'kind',
      type: 'select',
      required: true,
      options: ['message', 'request', 'match', 'help', 'reminder', 'system'],
    },
    { name: 'contextPath', type: 'text' },
    { name: 'read', type: 'checkbox', defaultValue: false },
    {
      name: 'deliveryState',
      type: 'select',
      defaultValue: 'internal',
      options: ['internal', 'pending', 'delivered', 'failed'],
    },
  ],
  timestamps: true,
}
