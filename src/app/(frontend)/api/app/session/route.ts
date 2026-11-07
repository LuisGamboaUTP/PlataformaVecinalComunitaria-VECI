import config from '@payload-config'
import { getPayload } from 'payload'

import { appAuth } from '@/lib/app-auth'

const cleanText = (value: unknown, max: number) =>
  typeof value === 'string' ? value.trim().slice(0, max) : ''

export async function GET() {
  const user = await appAuth.currentUser()
  if (!user) return Response.json({ user: null })

  return Response.json({
    user: {
      id: String(user.id),
      displayName: 'displayName' in user ? user.displayName : undefined,
      zoneName: 'zoneName' in user ? user.zoneName : undefined,
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
    const user = await appAuth.login(email, password)
    return Response.json({
      user: {
        id: String(user.id),
        displayName: 'displayName' in user ? user.displayName : undefined,
      },
    })
  } catch {
    return Response.json(
      { error: { message: 'No pudimos iniciar sesión. Revisa tus datos.' } },
      { status: 401 },
    )
  }
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
    await payload.create({
      collection: 'users' as never,
      data: { displayName, zoneName, email, password } as never,
      overrideAccess: false,
    })
    const user = await appAuth.login(email, password)
    return Response.json({ user: { id: String(user.id), displayName, zoneName } }, { status: 201 })
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
