import config from '@payload-config'
import { getPayload } from 'payload'
import sharp from 'sharp'

import { appAuth } from '@/lib/app-auth'
import { toPublicListing } from '@/lib/listing-view'
import { ensureSeeded } from '@/lib/seed-db'

const listingKinds = new Set([
  'product',
  'service',
  'skill',
  'barter',
  'gift',
  'loan',
  'need',
  'help',
])

const cleanText = (value: unknown, max: number) =>
  typeof value === 'string' ? value.trim().slice(0, max) : ''

export async function GET() {
  const payload = await getPayload({ config })
  await ensureSeeded(payload)
  const result = await payload.find({
    collection: 'listings' as never,
    depth: 1,
    limit: 50,
    sort: '-createdAt',
    overrideAccess: false,
  })
  return Response.json({ listings: result.docs.map(toPublicListing) })
}

export async function POST(request: Request) {
  const user = await appAuth.currentUser()
  if (!user) {
    return Response.json(
      { error: { code: 'AUTH_REQUIRED', message: 'Inicia sesión para publicar.' } },
      { status: 401 },
    )
  }

  let input: Record<string, unknown>
  let imageFile: File | null = null
  try {
    if (request.headers.get('content-type')?.includes('multipart/form-data')) {
      const formData = await request.formData()
      input = Object.fromEntries(formData.entries())
      input.acceptsBarter = formData.get('acceptsBarter') === 'true'
      const candidate = formData.get('photo')
      imageFile = candidate instanceof File && candidate.size > 0 ? candidate : null
    } else {
      input = await request.json()
    }
  } catch {
    return Response.json(
      { error: { code: 'INVALID_INPUT', message: 'No pudimos leer la publicación.' } },
      { status: 400 },
    )
  }

  const kind = cleanText(input.kind, 20)
  const title = cleanText(input.title, 120)
  const description = cleanText(input.description, 1200)
  const category = cleanText(input.category, 80)
  const priceLabel = cleanText(input.priceLabel, 80)
  const zoneName = cleanText(input.zoneName, 80)
  const acceptsBarter = input.acceptsBarter === true

  if (!listingKinds.has(kind) || title.length < 4 || description.length < 12 || !category) {
    return Response.json(
      {
        error: {
          code: 'VALIDATION',
          message: 'Revisa modalidad, título, descripción y categoría.',
        },
      },
      { status: 422 },
    )
  }

  const modes = acceptsBarter && kind !== 'barter' ? [kind, 'barter'] : [kind]
  const payload = await getPayload({ config })
  let uploadedMediaId: string | number | null = null

  try {
    if (imageFile) {
      if (imageFile.size > 5 * 1024 * 1024) {
        return Response.json(
          {
            error: {
              code: 'FILE_TOO_LARGE',
              message: 'La foto supera el límite de 5 MB.',
            },
          },
          { status: 413 },
        )
      }

      if (!['image/jpeg', 'image/png'].includes(imageFile.type)) {
        return Response.json(
          {
            error: {
              code: 'INVALID_FILE_TYPE',
              message: 'La foto debe ser JPG o PNG.',
            },
          },
          { status: 415 },
        )
      }

      const imageBuffer = Buffer.from(await imageFile.arrayBuffer())
      let metadata: Awaited<ReturnType<ReturnType<typeof sharp>['metadata']>>
      try {
        metadata = await sharp(imageBuffer).metadata()
      } catch {
        return Response.json(
          {
            error: {
              code: 'INVALID_IMAGE',
              message: 'No pudimos validar esa imagen. Prueba con otro archivo JPG o PNG.',
            },
          },
          { status: 422 },
        )
      }
      if (
        !['jpeg', 'png'].includes(metadata.format || '') ||
        !metadata.width ||
        !metadata.height ||
        metadata.width > 10000 ||
        metadata.height > 10000
      ) {
        return Response.json(
          {
            error: {
              code: 'INVALID_IMAGE',
              message: 'No pudimos validar esa imagen. Prueba con otro archivo JPG o PNG.',
            },
          },
          { status: 422 },
        )
      }

      const media = await payload.create({
        collection: 'media',
        data: { alt: `Foto de ${title}` },
        file: {
          data: imageBuffer,
          mimetype: metadata.format === 'png' ? 'image/png' : 'image/jpeg',
          name: imageFile.name,
          size: imageBuffer.length,
        },
        user,
        overrideAccess: false,
      })
      uploadedMediaId = media.id
    }

    const doc = await payload.create({
      collection: 'listings' as never,
      data: {
        title,
        description,
        kind,
        modes,
        category,
        priceLabel: priceLabel || (kind === 'gift' || kind === 'help' ? 'Sin costo' : undefined),
        zoneName: zoneName || ('zoneName' in user ? user.zoneName : '') || 'Zona seleccionada',
        locationLabel: `Punto aproximado en ${zoneName || 'la zona seleccionada'}`,
        distanceKm: 0,
        mapPosition: {
          x: 30 + ((title.length * 7) % 55),
          y: 22 + ((description.length * 3) % 62),
        },
        availability: 'coordinate',
        status: 'published',
        featured: false,
        media: uploadedMediaId || undefined,
      } as never,
      user,
      overrideAccess: false,
      depth: 1,
      context: { appWorkflowMutation: true },
    })

    return Response.json({ listing: toPublicListing(doc) }, { status: 201 })
  } catch {
    if (uploadedMediaId !== null) {
      try {
        await payload.delete({
          collection: 'media',
          id: uploadedMediaId,
          user,
          overrideAccess: false,
        })
      } catch {
        // The original publication error remains the actionable failure for the user.
      }
    }
    return Response.json(
      {
        error: {
          code: 'CREATE_FAILED',
          message: 'No se confirmó la publicación. Tu borrador sigue guardado.',
        },
      },
      { status: 500 },
    )
  }
}
