import { spawn } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const nextCli = resolve(projectRoot, 'node_modules/next/dist/bin/next')
const port = process.env.PORT || '3000'

const child = spawn(process.execPath, [nextCli, 'dev', '--webpack', '--port', port, '--hostname', '0.0.0.0'], {
  cwd: projectRoot,
  stdio: 'inherit',
  env: { ...process.env, NODE_OPTIONS: [process.env.NODE_OPTIONS, '--no-deprecation'].filter(Boolean).join(' ') },
})

child.on('error', (error) => { console.error(error); process.exitCode = 1 })
child.on('exit', (code) => { process.exitCode = code ?? 1 })
