import type { CollectionConfig } from 'payload'

import { getAppUserId } from './access'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    group: 'Comunidad',
    hidden: true,
    useAsTitle: 'displayName',
  },
  access: {
    admin: () => false,
    create: () => true,
    delete: ({ req }) => {
      const userId = getAppUserId(req.user)
      if (userId === null) return false
      return { id: { equals: userId } }
    },
    read: ({ req }) => {
      if (req.user?.collection === 'admins') return true
      const userId = getAppUserId(req.user)
      if (userId === null) return false
      return { id: { equals: userId } }
    },
    update: ({ req }) => {
      if (req.user?.collection === 'admins') return true
      const userId = getAppUserId(req.user)
      if (userId === null) return false
      return { id: { equals: userId } }
    },
  },
  fields: [
    {
      name: 'displayName',
      type: 'text',
      required: true,
      maxLength: 80,
    },
    {
      name: 'zoneName',
      type: 'text',
      required: true,
      defaultValue: 'Centro Cívico',
      maxLength: 80,
    },
    {
      name: 'bio',
      type: 'textarea',
      maxLength: 400,
    },
    {
      name: 'interests',
      type: 'select',
      hasMany: true,
      options: ['Servicios', 'Trueques', 'Préstamos', 'Voluntariado', 'Comunidades'],
    },
    {
      name: 'verificationStatus',
      type: 'select',
      defaultValue: 'not-verified',
      options: [
        { label: 'No verificada', value: 'not-verified' },
        { label: 'Revisión documental pendiente', value: 'pending' },
        { label: 'Verificada por proveedor real', value: 'verified' },
      ],
      access: {
        create: ({ req }) => req.user?.collection === 'admins',
        update: ({ req }) => req.user?.collection === 'admins',
      },
      admin: {
        description: 'Nunca marcar como verificada sin un proceso documental real y auditable.',
      },
    },
    {
      name: 'isDemo',
      type: 'checkbox',
      defaultValue: false,
      access: {
        create: ({ req }) => req.user?.collection === 'admins',
        update: ({ req }) => req.user?.collection === 'admins',
      },
      admin: {
        description: 'Aísla y rotula las cuentas y acciones usadas en demostraciones.',
      },
    },
    {
      name: 'accessibility',
      type: 'group',
      fields: [
        { name: 'simplifiedMode', type: 'checkbox', defaultValue: false },
        { name: 'reducedMotion', type: 'checkbox', defaultValue: false },
        { name: 'largeText', type: 'checkbox', defaultValue: false },
      ],
    },
  ],
  timestamps: true,
  versions: false,
}
