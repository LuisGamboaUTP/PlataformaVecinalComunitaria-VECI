export function listingArt(title: string, kind: string): string {
  const name = title.toLocaleLowerCase('es-PE')
  if (/bici/.test(name)) return '/images/listings/bicicleta.svg'
  if (/taladro|herramienta/.test(name)) return '/images/listings/taladro.svg'
  if (/clase|ingl[eé]s|tiempo/.test(name)) return '/images/listings/clases.svg'
  if (/gasfiter|tuber[ií]a|agua/.test(name)) return '/images/listings/gasfiteria.svg'
  if (/hern[aá]n|mayor|acompa[nñ]/.test(name)) return '/images/listings/ayuda-mayor.svg'
  if (/libro|cuento/.test(name)) return '/images/listings/libros.svg'
  if (/escalera/.test(name)) return '/images/listings/escalera.svg'
  if (/electric/.test(name)) return '/images/listings/electricista.svg'
  return `/images/listings/${({ barter: 'bicicleta', loan: 'taladro', skill: 'clases', help: 'ayuda-mayor', gift: 'libros', need: 'escalera', service: 'electricista', product: 'libros' } as Record<string, string>)[kind] || 'electricista'}.svg`
}
