import type { CollectionConfig } from 'payload'

import { getAppUserId, isAppUser, ownerFieldAccess } from './access'

export const Reviews: CollectionConfig = {
  slug: 'reviews',
  admin: { group: 'Confianza', useAsTitle: 'comment' },
  access: {
    create: ({ req }) => isAppUser(req.user),
    delete: ({ req }) => {
      if (req.user?.collection === 'admins') return true
      const userId = getAppUserId(req.user)
      return userId === null ? false : ({ author: { equals: userId } } as never)
    },
    read: () => true,
    update: ({ req }) => {
      if (req.user?.collection === 'admins') return true
      const userId = getAppUserId(req.user)
      return userId === null ? false : ({ author: { equals: userId } } as never)
    },
  },
  hooks: {
    beforeChange: [
      ({ data, operation, req, context }) => {
        const userId = getAppUserId(req.user)
        const subjectId = context.reviewSubjectId
        if (
          operation === 'create' &&
          userId !== null &&
          (typeof subjectId === 'string' || typeof subjectId === 'number')
        ) {
          return {
            ...data,
            author: userId,
            subject: subjectId,
            reviewKey: `${String(data.interaction)}:${String(userId)}`,
            isDemo: (req.user as unknown as { isDemo?: boolean }).isDemo === true,
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
      name: 'author',
      type: 'relationship',
      relationTo: 'users' as never,
      required: true,
      access: { create: ownerFieldAccess, update: ownerFieldAccess },
    },
    {
      name: 'subject',
      type: 'relationship',
      relationTo: 'users' as never,
      required: true,
      access: { create: ownerFieldAccess, update: ownerFieldAccess },
    },
    {
      name: 'reviewKey',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      access: { create: ownerFieldAccess, update: ownerFieldAccess },
    },
    { name: 'stars', type: 'number', required: true, min: 1, max: 5 },
    { name: 'comment', type: 'textarea', required: true, maxLength: 600 },
    { name: 'isDemo', type: 'checkbox', defaultValue: false },
  ],
  timestamps: true,
}
