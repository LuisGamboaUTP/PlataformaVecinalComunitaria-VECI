export function readLocal<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const value = window.localStorage.getItem(key)
    return value ? (JSON.parse(value) as T) : fallback
  } catch {
    return fallback
  }
}

export function writeLocal<T>(key: string, value: T) {
  window.localStorage.setItem(key, JSON.stringify(value))
}

export type LocalUser = {
  id: string
  displayName: string
  zoneName: string
  email: string
  verificationStatus: string
  docType?: 'dni' | 'ce' | 'pasaporte' | string
  docNumber?: string
}

export function currentUser(): LocalUser | null {
  return readLocal<LocalUser | null>('nexobarrio-session', null)
}

export function saveSession(user: LocalUser | null) {
  writeLocal('nexobarrio-session', user)
}
