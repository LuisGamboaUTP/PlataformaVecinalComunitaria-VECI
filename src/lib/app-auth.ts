import config from '@payload-config'
import { getPayload } from 'payload'
import { cookies } from 'next/headers'

const APP_SESSION_COOKIE = 'app-session'

export function createAppAuth(collection: 'users') {
  return {
    async currentUser() {
      const token = (await cookies()).get(APP_SESSION_COOKIE)?.value
      if (!token) return null

      const payload = await getPayload({ config })
      const authHeaders = new Headers({ Authorization: `JWT ${token}` })
      const { user } = await payload.auth({ headers: authHeaders })
      if (!user || user.collection !== collection) return null
      return user
    },

    async login(email: string, password: string) {
      const payload = await getPayload({ config })
      const result = await payload.login({
        collection: collection as never,
        data: { email, password },
      } as never)
      if (!result.token || !result.user) throw new Error('No se pudo iniciar la sesión.')

      ;(await cookies()).set(APP_SESSION_COOKIE, result.token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      })
      return result.user
    },

    async logout() {
      ;(await cookies()).delete(APP_SESSION_COOKIE)
    },
  }
}

export const appAuth = createAppAuth('users')
