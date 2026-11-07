import type { CollectionConfig } from 'payload'

import { getAppUserId, isAppUser, ownerFieldAccess } from './access'

export const Messages: CollectionConfig = {
  slug: 'messages',
  admin: { group: 'Operación vecinal', useAsTitle: 'body' },
  access: {
    create: ({ req }) => isAppUser(req.user),
    delete: ({ req }) => {
      if (req.user?.collection === 'admins') return true
      const userId = getAppUserId(req.user)
      return userId === null ? false : ({ sender: { equals: userId } } as never)
    },
    read: ({ req }) => {
      if (req.user?.collection === 'admins') return true
      const userId = getAppUserId(req.user)
      return userId === null ? false : ({ participants: { contains: userId } } as never)
    },
    update: ({ req }) => {
      if (req.user?.collection === 'admins') return true
      const userId = getAppUserId(req.user)
      return userId === null ? false : ({ sender: { equals: userId } } as never)
    },
  },
  hooks: {
    beforeChange: [
      ({ data, operation, req, context }) => {
        const userId = getAppUserId(req.user)
        const participantIds = Array.isArray(context.participantIds)
          ? context.participantIds.filter(
              (id): id is string | number => typeof id === 'string' || typeof id === 'number',
            )
          : []
        if (operation === 'create' && userId !== null && participantIds.length >= 2) {
          return {
            ...data,
            sender: userId,
            participants: participantIds,
            deliveryState: 'sent',
          }
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'interaction',
      type: 'relationship',
      relationTo: 'interactions' as never,
      required: true,
      index: true,
    },
    {
      name: 'sender',
      type: 'relationship',
      relationTo: 'users' as never,
      required: true,
      access: { create: ownerFieldAccess, update: ownerFieldAccess },
    },
    {
      name: 'participants',
      type: 'relationship',
      relationTo: 'users' as never,
      hasMany: true,
      required: true,
      access: { create: ownerFieldAccess, update: ownerFieldAccess },
    },
    { name: 'body', type: 'textarea', required: true, maxLength: 1500 },
    {
      name: 'deliveryState',
      type: 'select',
      defaultValue: 'sent',
      options: ['sent', 'failed'],
      access: { create: ownerFieldAccess, update: ownerFieldAccess },
    },
  ],
  timestamps: true,
}
