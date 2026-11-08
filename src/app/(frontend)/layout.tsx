import type { Metadata } from 'next'
import './styles.css'

export const metadata: Metadata = {
  title: 'NexoBarrio',
  description: 'Productos, oficios, recursos y ayuda cerca de ti.',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/favicon.svg' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <div id="root">{children}</div>
      </body>
    </html>
  )
}
