import type { CollectionConfig } from 'payload'

import { APIError, createFolderField, createTagField } from 'payload'

import { isAppUser, ownerFieldAccess, ownerOrAdmin } from './access'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    group: 'Contenido',
  },
  access: {
    create: ({ req }) => req.user?.collection === 'admins' || isAppUser(req.user),
    delete: ownerOrAdmin,
    read: () => true,
    update: ownerOrAdmin,
  },
  hooks: {
    beforeValidate: [
      ({ req }) => {
        if (req.user?.collection === 'users' && req.file && req.file.size > 5 * 1024 * 1024) {
          throw new APIError('La foto supera el límite de 5 MB.', 413)
        }
      },
    ],
    beforeChange: [
      ({ data, operation, req }) => {
        if (operation === 'create' && req.user?.collection === 'users') {
          return {
            ...data,
            owner: req.user.id,
            useCase: 'listing-image',
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
      index: true,
      access: { create: ownerFieldAccess, update: ownerFieldAccess },
      admin: {
        description: 'Cuenta de la aplicación que subió el archivo. Vacío en medios editoriales.',
      },
    },
    {
      name: 'useCase',
      type: 'select',
      options: [{ label: 'Imagen de publicación', value: 'listing-image' }],
      access: { create: ownerFieldAccess, update: ownerFieldAccess },
    },
    {
      name: 'alt',
      type: 'text',
      required: true,
      maxLength: 160,
    },
    createFolderField({ relationTo: 'folders' }),
    createTagField({ relationTo: 'tags' }),
  ],
  upload: {
    mimeTypes: ['image/jpeg', 'image/png'],
  },
}
