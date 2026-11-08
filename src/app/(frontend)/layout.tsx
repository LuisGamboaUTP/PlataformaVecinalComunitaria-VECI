import type { Metadata } from 'next'
import './styles.css'

export const metadata: Metadata = {
  title: 'VECI · Tu Barrio Más Cerca',
  description: 'Plataforma comunitaria vecinal para servicios, préstamos y ayuda mutua.',
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
