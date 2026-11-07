import type { CollectionConfig } from 'payload'
import { APIError } from 'payload'

import {
  getAppUserId,
  isAppUser,
  ownerFieldAccess,
  ownerOrAdmin,
  ownerOrServerWorkflowOrAdmin,
  serverWorkflowFieldAccess,
} from './access'

const kindOptions = [
  { label: 'Producto', value: 'product' },
  { label: 'Servicio', value: 'service' },
  { label: 'Habilidad', value: 'skill' },
  { label: 'Trueque', value: 'barter' },
  { label: 'Regalo', value: 'gift' },
  { label: 'Préstamo', value: 'loan' },
  { label: 'Necesidad', value: 'need' },
  { label: 'Ayuda', value: 'help' },
]

export const Listings: CollectionConfig = {
  slug: 'listings',
  admin: { group: 'Operación vecinal', useAsTitle: 'title' },
  access: {
    create: ({ req }) => isAppUser(req.user) || req.user?.collection === 'admins',
    delete: ownerOrAdmin,
    read: ({ req }) => {
      if (req.user?.collection === 'admins') return true
      const userId = getAppUserId(req.user)
      if (userId !== null) {
        return {
          or: [{ status: { equals: 'published' } }, { owner: { equals: userId } }],
        } as never
      }
      return { status: { equals: 'published' } }
    },
    update: ownerOrServerWorkflowOrAdmin,
  },
  hooks: {
    beforeChange: [
      async ({ data, operation, req }) => {
        const userId = getAppUserId(req.user)
        if (userId !== null && data.media) {
          const mediaId =
            typeof data.media === 'object' && data.media !== null && 'id' in data.media
              ? data.media.id
              : data.media
          const media = await req.payload.findByID({
            collection: 'media',
            id: mediaId as string | number,
            depth: 0,
            overrideAccess: false,
            req,
          })
          const mediaOwner =
            typeof media.owner === 'object' && media.owner !== null ? media.owner.id : media.owner
          if (String(mediaOwner ?? '') !== String(userId)) {
            throw new APIError('La imagen no pertenece a la cuenta que publica.', 403)
          }
        }
        if (operation === 'create' && userId !== null) {
          const appUser = req.user as unknown as {
            displayName?: string
            isDemo?: boolean
          }
          const displayName =
            typeof appUser.displayName === 'string' && appUser.displayName
              ? appUser.displayName
              : 'Vecino de la zona'
          const initials = displayName
            .split(/\s+/)
            .slice(0, 2)
            .map((part) => part[0])
            .join('')
            .toUpperCase()
          const isDemo = appUser.isDemo === true
          return {
            ...data,
            owner: userId,
            providerName: displayName,
            providerInitials: initials,
            isDemo,
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
      access: { create: ownerFieldAccess, update: ownerFieldAccess },
      index: true,
    },
    {
      name: 'providerName',
      type: 'text',
      maxLength: 80,
      access: { create: ownerFieldAccess, update: ownerFieldAccess },
      admin: { description: 'Snapshot público; evita exponer el documento completo del usuario.' },
    },
    {
      name: 'providerInitials',
      type: 'text',
      maxLength: 3,
      access: { create: ownerFieldAccess, update: ownerFieldAccess },
    },
    { name: 'title', type: 'text', required: true, maxLength: 120 },
    { name: 'description', type: 'textarea', required: true, maxLength: 1200 },
    { name: 'kind', type: 'select', required: true, options: kindOptions, index: true },
    {
      name: 'modes',
      type: 'select',
      hasMany: true,
      required: true,
      options: kindOptions,
    },
    { name: 'category', type: 'text', required: true, index: true },
    { name: 'priceLabel', type: 'text', maxLength: 80 },
    { name: 'zoneName', type: 'text', required: true, index: true },
    { name: 'locationLabel', type: 'text', required: true, maxLength: 120 },
    { name: 'distanceKm', type: 'number', min: 0, max: 100 },
    {
      name: 'mapPosition',
      type: 'group',
      fields: [
        { name: 'x', type: 'number', min: 5, max: 95, required: true },
        { name: 'y', type: 'number', min: 8, max: 92, required: true },
      ],
    },
    {
      name: 'media',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'availability',
      type: 'select',
      defaultValue: 'coordinate',
      options: [
        { label: 'Disponible ahora', value: 'now' },
        { label: 'Disponible hoy', value: 'today' },
        { label: 'Por coordinar', value: 'coordinate' },
      ],
    },
    { name: 'availabilityUpdatedAt', type: 'date' },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      required: true,
      index: true,
      options: [
        { label: 'Borrador', value: 'draft' },
        { label: 'Publicada', value: 'published' },
        { label: 'Pausada', value: 'paused' },
        { label: 'Reservada', value: 'reserved' },
        { label: 'Completada', value: 'completed' },
        { label: 'Archivada', value: 'archived' },
      ],
      access: { create: serverWorkflowFieldAccess, update: serverWorkflowFieldAccess },
    },
    {
      name: 'demoProvider',
      type: 'group',
      admin: { description: 'Solo para datos de demostración rotulados.' },
      fields: [
        { name: 'name', type: 'text' },
        { name: 'initials', type: 'text', maxLength: 3 },
        { name: 'rating', type: 'number', min: 0, max: 5 },
        { name: 'reviewCount', type: 'number', min: 0 },
        { name: 'completedCount', type: 'number', min: 0 },
      ],
    },
    {
      name: 'neighborApproval',
      type: 'group',
      fields: [
        { name: 'author', type: 'text' },
        { name: 'declaredZone', type: 'text' },
        { name: 'date', type: 'date' },
        { name: 'experienceRegistered', type: 'checkbox', defaultValue: false },
        { name: 'note', type: 'textarea', maxLength: 240 },
      ],
    },
    { name: 'featured', type: 'checkbox', defaultValue: false },
    {
      name: 'isDemo',
      type: 'checkbox',
      defaultValue: false,
      index: true,
      access: { create: ownerFieldAccess, update: ownerFieldAccess },
    },
  ],
  timestamps: true,
  versions: false,
}
