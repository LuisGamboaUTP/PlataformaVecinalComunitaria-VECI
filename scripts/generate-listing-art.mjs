import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'images', 'listings')
await mkdir(out, { recursive: true })

const art = {
  electricista: ['Electricidad', '#1c7563', '#9edbc1', '<path d="M218 74 155 173h53l-20 88 89-120h-54l25-67z"/>'],
  bicicleta: ['Bicicleta', '#357f9a', '#a2dcdf', '<circle cx="122" cy="205" r="46"/><circle cx="300" cy="205" r="46"/><path d="m122 205 61-94 54 94h-115m61-94h56l61 94m-120-94-13-22h-27m89 0h47"/>'],
  taladro: ['Taladro', '#db7b4c', '#ffd0a0', '<path d="M124 128h167v58H124zM164 186h72v82h-47l-25-49zM291 146h42m-185-18v58m36-58v58"/>'],
  clases: ['Clases', '#6b69a8', '#c7c1f2', '<path d="M111 107h200v142H111zM210 107v142m-81-110h58m-58 27h58m48-27h58m-58 27h58"/>'],
  gasfiteria: ['Gasfitería', '#2e8292', '#b3e1dc', '<path d="M124 106v77q0 37 40 37h90q40 0 40-40v-73m-170 0h42m86 0h42M164 220v40m90-40v40"/>'],
  'ayuda-mayor': ['Ayuda vecinal', '#b16474', '#f4c9bd', '<path d="M211 250c-66-45-96-73-96-108 0-34 41-46 63-18l33 31 33-31c22-28 63-16 63 18 0 35-30 63-96 108z"/>'],
  libros: ['Libros', '#a6813e', '#f3d68b', '<path d="M110 112h64v145h-64zM178 93h65v164h-65zM248 123h64v134h-64zM124 139h36m32-18h36m34 30h36"/>'],
  escalera: ['Escalera', '#697b8b', '#cbd9e1', '<path d="m162 75-40 194m138-194 40 194m-151-155h124m-132 39h140m-148 39h156m-164 39h172"/>'],
}

for (const [name, [label, dark, light, drawing]] of Object.entries(art)) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 320" role="img" aria-label="${label}">
<defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="${light}"/><stop offset="1" stop-color="${dark}"/></linearGradient></defs>
<rect width="420" height="320" rx="30" fill="url(#bg)"/>
<circle cx="355" cy="35" r="100" fill="#fff" opacity=".13"/><circle cx="70" cy="292" r="120" fill="#fff" opacity=".12"/>
<g fill="none" stroke="#fff" stroke-width="11" stroke-linecap="round" stroke-linejoin="round">${drawing}</g>
<text x="32" y="49" font-family="Arial,sans-serif" font-weight="700" font-size="22" fill="#fff">${label}</text>
</svg>`
  await writeFile(join(out, `${name}.svg`), svg)
}
