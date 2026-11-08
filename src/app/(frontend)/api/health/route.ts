import fs from 'fs'
import path from 'path'
import { NextResponse } from 'next/server'

function getSupabaseCredentials(): { url: string; key: string } {
  let url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  let key = process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

  if (!url || !key) {
    try {
      const envPath = path.join(process.cwd(), 'backend', '.env')
      if (fs.existsSync(envPath)) {
        const raw = fs.readFileSync(envPath, 'utf-8')
        for (const line of raw.split(/\r?\n/)) {
          const trimmed = line.trim()
          if (!trimmed || trimmed.startsWith('#')) continue
          const eqIdx = trimmed.indexOf('=')
          if (eqIdx === -1) continue
          const k = trimmed.slice(0, eqIdx).trim()
          const v = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '')
          if (k === 'SUPABASE_URL' && !url) url = v
          if (k === 'SUPABASE_KEY' && !key) key = v
        }
      }
    } catch {
      // Ignore fs errors
    }
  }

  return { url, key }
}

export async function GET() {
  const { url, key } = getSupabaseCredentials()
  const connected = Boolean(url && key)

  return NextResponse.json({
    status: 'ok',
    service: 'VECI API (Next.js + Supabase Bridge)',
    version: '2.0.0',
    database: connected ? 'Supabase PostgreSQL (Conectado)' : 'In-Memory Seed Store (Modo Demo)',
    supabaseConnected: connected,
  })
}

