import type { CollectionConfig } from 'payload'

import {
  getAppUserId,
  isAppUser,
  ownerFieldAccess,
  participantOrAdmin,
  serverWorkflowFieldAccess,
} from './access'

export const Interactions: CollectionConfig = {
  slug: 'interactions',
  admin: { group: 'Operación vecinal', useAsTitle: 'summary' },
  access: {
    create: ({ req }) => isAppUser(req.user) || req.user?.collection === 'admins',
    delete: participantOrAdmin,
    read: participantOrAdmin,
    update: participantOrAdmin,
  },
  hooks: {
    beforeChange: [
      ({ data, operation, req }) => {
        const userId = getAppUserId(req.user)
        if (operation === 'create' && userId !== null) {
          return { ...data, owner: userId }
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
      name: 'summary',
      type: 'text',
      required: true,
      maxLength: 140,
      access: { create: serverWorkflowFieldAccess, update: serverWorkflowFieldAccess },
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      access: { create: serverWorkflowFieldAccess, update: serverWorkflowFieldAccess },
      options: [
        { label: 'Solicitud de servicio', value: 'service' },
        { label: 'Trueque', value: 'barter' },
        { label: 'Préstamo', value: 'loan' },
        { label: 'Regalo', value: 'gift' },
        { label: 'Ayuda', value: 'help' },
        { label: 'Ruta solidaria', value: 'route' },
        { label: 'Necesidad compartida', value: 'shared-need' },
      ],
    },
    {
      name: 'listing',
      type: 'relationship',
      relationTo: 'listings' as never,
      required: true,
      access: { create: serverWorkflowFieldAccess, update: serverWorkflowFieldAccess },
    },
    {
      name: 'counterparty',
      type: 'relationship',
      relationTo: 'users' as never,
      access: { create: serverWorkflowFieldAccess, update: serverWorkflowFieldAccess },
    },
    {
      name: 'details',
      type: 'textarea',
      required: true,
      maxLength: 1000,
      access: { update: serverWorkflowFieldAccess },
    },
    {
      name: 'proposedDate',
      type: 'date',
      access: { create: serverWorkflowFieldAccess, update: serverWorkflowFieldAccess },
    },
    {
      name: 'idempotencyKey',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      access: { create: serverWorkflowFieldAccess, update: serverWorkflowFieldAccess },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'requested',
      access: { create: serverWorkflowFieldAccess, update: serverWorkflowFieldAccess },
      options: [
        { label: 'Solicitada', value: 'requested' },
        { label: 'Propuesta', value: 'proposed' },
        { label: 'En negociación', value: 'negotiating' },
        { label: 'Aceptada', value: 'accepted' },
        { label: 'En coordinación', value: 'coordinating' },
        { label: 'En curso', value: 'in-progress' },
        { label: 'Pendiente de devolución', value: 'return-pending' },
        { label: 'Completada', value: 'completed' },
        { label: 'Rechazada', value: 'rejected' },
        { label: 'Cancelada', value: 'cancelled' },
      ],
    },
    {
      name: 'acceptance',
      type: 'group',
      access: { create: serverWorkflowFieldAccess, update: serverWorkflowFieldAccess },
      fields: [
        { name: 'ownerAccepted', type: 'checkbox', defaultValue: false },
        { name: 'counterpartyAccepted', type: 'checkbox', defaultValue: false },
      ],
    },
    {
      name: 'returnFlow',
      type: 'group',
      access: { create: serverWorkflowFieldAccess, update: serverWorkflowFieldAccess },
      fields: [
        { name: 'dueAt', type: 'date' },
        { name: 'borrowerConfirmed', type: 'checkbox', defaultValue: false },
        { name: 'lenderConfirmed', type: 'checkbox', defaultValue: false },
      ],
    },
    {
      name: 'syncState',
      type: 'select',
      defaultValue: 'confirmed',
      options: ['pending', 'confirmed', 'failed'],
      access: { create: serverWorkflowFieldAccess, update: serverWorkflowFieldAccess },
    },
  ],
  timestamps: true,
}
