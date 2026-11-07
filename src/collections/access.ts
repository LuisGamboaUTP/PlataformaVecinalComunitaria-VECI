import type { Access, FieldAccess } from 'payload'

export const isAdmin: Access = ({ req }) => req.user?.collection === 'admins'

export const isAppUser = (user: unknown): boolean =>
  Boolean(
    user &&
    typeof user === 'object' &&
    'collection' in user &&
    (user as { collection?: string }).collection === 'users',
  )

export const getAppUserId = (user: unknown): string | number | null => {
  if (!isAppUser(user) || !user || typeof user !== 'object' || !('id' in user)) return null
  const id = (user as { id?: unknown }).id
  return typeof id === 'string' || typeof id === 'number' ? id : null
}

export const authenticatedAppUser: Access = ({ req }) => isAppUser(req.user)

export const ownerOrAdmin: Access = ({ req }) => {
  if (req.user?.collection === 'admins') return true
  const userId = getAppUserId(req.user)
  if (userId === null) return false
  return { owner: { equals: userId } }
}

export const participantOrAdmin: Access = ({ req }) => {
  if (req.user?.collection === 'admins') return true
  const userId = getAppUserId(req.user)
  if (userId === null) return false
  return {
    or: [{ owner: { equals: userId } }, { counterparty: { equals: userId } }],
  } as never
}

export const ownerFieldAccess: FieldAccess = ({ req }) => req.user?.collection === 'admins'

export const serverWorkflowAccess: Access = ({ req }) =>
  req.user?.collection === 'admins' || req.context.appWorkflowMutation === true

export const ownerOrServerWorkflowOrAdmin: Access = ({ req }) => {
  if (req.user?.collection === 'admins' || req.context.appWorkflowMutation === true) return true
  const userId = getAppUserId(req.user)
  if (userId === null) return false
  return { owner: { equals: userId } }
}

export const serverWorkflowFieldAccess: FieldAccess = ({ req }) =>
  req.user?.collection === 'admins' || req.context.appWorkflowMutation === true
