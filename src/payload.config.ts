import path from 'path'
import { buildConfig } from 'payload'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { mcpPlugin } from '@payloadcms/plugin-mcp'
import { es as adminLanguage } from '@payloadcms/translations/languages/es'
import { fileURLToPath } from 'url'
import { Admins } from './collections/Admins'
import { Media } from './collections/Media'
import { Folders } from './collections/Folders'
import { Tags } from './collections/Tags'
import { Communities } from './collections/Communities'
import { Interactions } from './collections/Interactions'
import { Listings } from './collections/Listings'
import { Notifications } from './collections/Notifications'
import { Reports } from './collections/Reports'
import { ResourceDirectory } from './collections/ResourceDirectory'
import { Users } from './collections/Users'
import { Zones } from './collections/Zones'
import { Messages } from './collections/Messages'
import { Reviews } from './collections/Reviews'
import { Reservations } from './collections/Reservations'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const defaultSqliteUrl =
  process.env.VERCEL === '1'
    ? 'file:/tmp/local.db'
    : `file:${path.resolve(dirname, 'local.db')}`

export default buildConfig({
  secret: process.env.PAYLOAD_SECRET || 'hackaton-veci-local-secret-key-1234567890',
  db: sqliteAdapter({
    client: {
      url: process.env.DATABASE_URI || defaultSqliteUrl,
    },
  }),
  editor: lexicalEditor(),
  admin: {
    user: Admins.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  i18n: {
    fallbackLanguage: 'es',
    supportedLanguages: { es: adminLanguage },
  },
  collections: [
    Admins,
    Users,
    Media,
    Folders,
    Tags,
    Zones,
    Listings,
    Interactions,
    Reservations,
    Messages,
    Reviews,
    Communities,
    ResourceDirectory,
    Notifications,
    Reports,
  ],
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  localization: {
    locales: [{ code: 'en', label: 'English' }],
    fallback: true,
    defaultLocale: 'en',
  },
  plugins: [mcpPlugin({})],
  figma: {},
})
