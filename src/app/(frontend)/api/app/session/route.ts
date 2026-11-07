import config from '@payload-config'
import { getPayload } from 'payload'

import { appAuth } from '@/lib/app-auth'
import { ensureSeeded } from '@/lib/seed-db'

const cleanText = (value: unknown, max: number) =>
  typeof value === 'string' ? value.trim().slice(0, max) : ''

export async function GET() {
  const payload = await getPayload({ config })
  await ensureSeeded(payload)
  const user = await appAuth.currentUser()
  if (!user) return Response.json({ user: null })

  return Response.json({
    user: {
      id: String(user.id),
      displayName: 'displayName' in user ? user.displayName : undefined,
      zoneName: 'zoneName' in user ? user.zoneName : undefined,
      bio: 'bio' in user ? user.bio : undefined,
      verificationStatus: 'verificationStatus' in user ? user.verificationStatus : 'not-verified',
    },
  })
}

export async function POST(request: Request) {
  let input: Record<string, unknown>
  try {
    input = await request.json()
  } catch {
    return Response.json({ error: { message: 'No pudimos leer tus datos.' } }, { status: 400 })
  }
  const email = cleanText(input.email, 160).toLowerCase()
  const password = cleanText(input.password, 200)
  if (!email || !password) {
    return Response.json({ error: { message: 'Completa correo y contraseña.' } }, { status: 422 })
  }
  try {
    const payload = await getPayload({ config })
    await ensureSeeded(payload)
    const user = await appAuth.login(email, password)
    return Response.json({
      user: {
        id: String(user.id),
        displayName: 'displayName' in user ? user.displayName : undefined,
        zoneName: 'zoneName' in user ? user.zoneName : undefined,
        verificationStatus: 'verificationStatus' in user ? user.verificationStatus : 'not-verified',
      },
    })
  } catch {
    return Response.json(
      { error: { message: 'No pudimos iniciar sesión. Revisa tus datos.' } },
      { status: 401 },
    )
  }
}

export async function PATCH(request: Request) {
  const user = await appAuth.currentUser()
  if (!user) {
    return Response.json({ error: { message: 'Inicia sesión primero.' } }, { status: 401 })
  }
  let input: Record<string, unknown>
  try {
    input = await request.json()
  } catch {
    return Response.json({ error: { message: 'Datos inválidos.' } }, { status: 400 })
  }

  const payload = await getPayload({ config })
  const dataToUpdate: Record<string, unknown> = {}

  if (typeof input.displayName === 'string' && input.displayName.trim().length >= 2) {
    dataToUpdate.displayName = cleanText(input.displayName, 80)
  }
  if (typeof input.zoneName === 'string' && input.zoneName.trim().length >= 2) {
    dataToUpdate.zoneName = cleanText(input.zoneName, 80)
  }
  if (typeof input.bio === 'string') {
    dataToUpdate.bio = cleanText(input.bio, 400)
  }
  if (input.verifyDocument === true) {
    const docType = cleanText(input.docType, 10)
    const docNumber = cleanText(input.docNumber, 20)
    const isValidDni = docType === 'DNI' && /^\d{8}$/.test(docNumber)
    const isValidCe = docType === 'CE' && /^[A-Z0-9]{9,12}$/i.test(docNumber)
    if (!isValidDni && !isValidCe) {
      return Response.json(
        {
          error: {
            message:
              'Ingresa un número válido: 8 dígitos para DNI o de 9 a 12 caracteres para Carnet de Extranjería.',
          },
        },
        { status: 422 },
      )
    }
    dataToUpdate.verificationStatus = 'verified'
  }

  const updated: any = await payload.update({
    collection: 'users' as never,
    id: user.id,
    data: dataToUpdate as never,
    overrideAccess: true,
  })

  return Response.json({
    user: {
      id: String(updated.id),
      displayName: updated.displayName,
      zoneName: updated.zoneName,
      bio: updated.bio,
      verificationStatus: updated.verificationStatus || 'not-verified',
    },
  })
}

export async function PUT(request: Request) {
  let input: Record<string, unknown>
  try {
    input = await request.json()
  } catch {
    return Response.json({ error: { message: 'No pudimos leer tus datos.' } }, { status: 400 })
  }
  const displayName = cleanText(input.displayName, 80)
  const zoneName = cleanText(input.zoneName, 80)
  const email = cleanText(input.email, 160).toLowerCase()
  const password = cleanText(input.password, 200)
  if (!displayName || !zoneName || !email || password.length < 8) {
    return Response.json(
      {
        error: {
          message: 'Completa todos los campos y usa una contraseña de al menos 8 caracteres.',
        },
      },
      { status: 422 },
    )
  }

  try {
    const payload = await getPayload({ config })
    const docType = cleanText(input.docType, 10)
    const docNumber = cleanText(input.docNumber, 20)
    let verificationStatus: 'not-verified' | 'verified' = 'not-verified'
    if (docNumber) {
      const isValidDni = docType === 'DNI' && /^\d{8}$/.test(docNumber)
      const isValidCe = docType === 'CE' && /^[A-Z0-9]{9,12}$/i.test(docNumber)
      if (!isValidDni && !isValidCe) {
        return Response.json(
          {
            error: {
              message:
                'Documento inválido: usa 8 dígitos para DNI o 9-12 caracteres alfanuméricos para Carnet de Extranjería.',
            },
          },
          { status: 422 },
        )
      }
      verificationStatus = 'verified'
    }
    await payload.create({
      collection: 'users' as never,
      data: { displayName, zoneName, email, password, verificationStatus } as never,
      overrideAccess: true,
    })
    const user = await appAuth.login(email, password)
    return Response.json(
      { user: { id: String(user.id), displayName, zoneName, verificationStatus } },
      { status: 201 },
    )
  } catch {
    return Response.json(
      { error: { message: 'No pudimos crear la cuenta. Quizá el correo ya está registrado.' } },
      { status: 409 },
    )
  }
}

export async function DELETE() {
  await appAuth.logout()
  return Response.json({ success: true })
}
