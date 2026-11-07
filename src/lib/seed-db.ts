import type { Payload } from 'payload'

let seeded = false
let seedingPromise: Promise<void> | null = null

export async function ensureSeeded(payload: Payload): Promise<void> {
  if (seeded) return
  if (seedingPromise) return seedingPromise

  seedingPromise = (async () => {
    try {
      const existingListings = await payload.find({
        collection: 'listings' as never,
        limit: 1,
        overrideAccess: true,
      })

      const existingUsers = await payload.find({
        collection: 'users' as never,
        limit: 1,
        overrideAccess: true,
      })

      let providerId: string | number | null = null
      let requesterId: string | number | null = null

      if (existingUsers.docs.length === 0) {
        const requester = await payload.create({
          collection: 'users' as never,
          data: {
            email: 'demo@nexobarrio.test',
            password: 'DemoNexo!2026',
            displayName: 'Lucía Paredes',
            zoneName: 'Centro Cívico',
            bio: 'Vecina de Centro Cívico interesada en trueques, préstamos de herramientas y apoyo solidario.',
            interests: ['Servicios', 'Trueques', 'Préstamos', 'Voluntariado', 'Comunidades'],
            verificationStatus: 'verified',
            isDemo: true,
          } as never,
          overrideAccess: true,
        })
        requesterId = requester.id

        const provider = await payload.create({
          collection: 'users' as never,
          data: {
            email: 'proveedor.demo@nexobarrio.test',
            password: 'ProveedorNexo!2026',
            displayName: 'Carlos Mendoza',
            zoneName: 'Centro Cívico',
            bio: 'Técnico electricista matriculado con 10 años atendiendo emergencias y mantenimiento en el barrio.',
            interests: ['Servicios', 'Trueques', 'Préstamos'],
            verificationStatus: 'verified',
            isDemo: true,
          } as never,
          overrideAccess: true,
        })
        providerId = provider.id
      } else {
        const prov = await payload.find({
          collection: 'users' as never,
          where: { email: { equals: 'proveedor.demo@nexobarrio.test' } },
          limit: 1,
          overrideAccess: true,
        })
        providerId = prov.docs[0]?.id ?? existingUsers.docs[0]?.id ?? null
        const reqUser = await payload.find({
          collection: 'users' as never,
          where: { email: { equals: 'demo@nexobarrio.test' } },
          limit: 1,
          overrideAccess: true,
        })
        requesterId = reqUser.docs[0]?.id ?? existingUsers.docs[0]?.id ?? null
      }

      if (existingListings.docs.length > 0) {
        const allDocs = await payload.find({
          collection: 'listings' as never,
          limit: 50,
          overrideAccess: true,
        })
        for (const doc of allDocs.docs as any[]) {
          if (typeof doc.description === 'string' && doc.description.includes('(VECI Ahora)')) {
            await payload.update({
              collection: 'listings' as never,
              id: doc.id,
              data: {
                description: doc.description.replace(' (VECI Ahora)', ''),
              } as never,
              overrideAccess: true,
              context: { appWorkflowMutation: true },
            })
          }
        }
      }

      if (existingListings.docs.length === 0 && providerId !== null) {
        const starterListings = [
          {
            title: 'Electricista matriculado · Reparaciones y tableros',
            description:
              'Técnico certificado con 10 años de experiencia en la zona. Reparación de cortocircuitos, cambio de llaves térmicas, luminarias LED y cableado seguro a domicilio.',
            kind: 'service',
            modes: ['service'],
            category: 'Electricidad',
            priceLabel: 'S/ 40 por visita',
            zoneName: 'Centro Cívico',
            locationLabel: 'A 450 m · Jr. Washington (ubicación aprox.)',
            distanceKm: 0.45,
            mapPosition: { x: 48, y: 42 },
            availability: 'now',
            status: 'published',
            featured: true,
            isDemo: true,
            owner: providerId,
            providerName: 'Carlos Mendoza',
            providerInitials: 'CM',
            demoProvider: {
              name: 'Carlos Mendoza',
              initials: 'CM',
              rating: 4.9,
              reviewCount: 38,
              completedCount: 52,
            },
            neighborApproval: {
              author: 'Rosa Morales',
              declaredZone: 'Centro Cívico',
              experienceRegistered: true,
              note: 'Excelente trabajo cambiando el tablero eléctrico de mi departamento, llegó en 20 minutos y cobró lo acordado.',
            },
          },
          {
            title: 'Bicicleta Montañera Aro 26 Shimano en buen estado',
            description:
              'Bicicleta aro 26 con 21 velocidades Shimano y frenos recién ajustados. La ofrezco en trueque por herramientas eléctricas (taladro o amoladora) o modalidad combinada de venta.',
            kind: 'barter',
            modes: ['barter', 'product'],
            category: 'Transporte',
            priceLabel: 'Trueque o S/ 220',
            zoneName: 'Centro Cívico',
            locationLabel: 'A 600 m · Av. Garcilaso',
            distanceKm: 0.6,
            mapPosition: { x: 64, y: 54 },
            availability: 'today',
            status: 'published',
            featured: true,
            isDemo: true,
            owner: providerId,
            providerName: 'Alejandro Prado',
            providerInitials: 'AP',
            demoProvider: {
              name: 'Alejandro Prado',
              initials: 'AP',
              rating: 4.8,
              reviewCount: 14,
              completedCount: 19,
            },
            neighborApproval: {
              author: 'Jorge Villalobos',
              declaredZone: 'Centro Cívico',
              experienceRegistered: true,
              note: 'Vecino muy cumplido, hicimos un trueque de libros y herramientas el mes pasado.',
            },
          },
          {
            title: 'Taladro Percutor Bosch 650W con maletín de brocas',
            description:
              'Parte de la Biblioteca Compartida del Barrio. Disponible en préstamo gratuito de 1 a 3 días para vecinos que necesiten instalar repisas o cortinas. Devolver limpio.',
            kind: 'loan',
            modes: ['loan'],
            category: 'Herramientas',
            priceLabel: 'Préstamo solidario S/ 0',
            zoneName: 'Centro Cívico',
            locationLabel: 'A 300 m · Jr. Quilca',
            distanceKm: 0.3,
            mapPosition: { x: 34, y: 36 },
            availability: 'now',
            status: 'published',
            featured: true,
            isDemo: true,
            owner: providerId,
            providerName: 'María Elena Torres',
            providerInitials: 'MT',
            demoProvider: {
              name: 'María Elena Torres',
              initials: 'MT',
              rating: 5.0,
              reviewCount: 22,
              completedCount: 29,
            },
            neighborApproval: {
              author: 'Comité Vecinal Quilca',
              declaredZone: 'Centro Cívico',
              experienceRegistered: true,
              note: 'Recurso compartido que ya ayudó a más de 20 familias del pasaje sin gastar en comprar herramienta.',
            },
          },
          {
            title: 'Clases de Inglés Conversacional y Matemáticas (Banco de Tiempo)',
            description:
              'Ofrezco sesiones de 1 hora de inglés práctico o refuerzo escolar a cambio de ayuda con reparación de muebles, plantas para balcón o intercambio de horas en el Banco de Tiempo.',
            kind: 'skill',
            modes: ['skill', 'barter'],
            category: 'Clases',
            priceLabel: '1h Banco de Tiempo / Trueque',
            zoneName: 'Centro Cívico',
            locationLabel: 'A 700 m · Av. Tacna',
            distanceKm: 0.7,
            mapPosition: { x: 26, y: 56 },
            availability: 'today',
            status: 'published',
            featured: false,
            isDemo: true,
            owner: providerId,
            providerName: 'Sofía Cárdenas',
            providerInitials: 'SC',
            demoProvider: {
              name: 'Sofía Cárdenas',
              initials: 'SC',
              rating: 4.9,
              reviewCount: 15,
              completedCount: 21,
            },
            neighborApproval: {
              author: 'Carmen Rivas',
              declaredZone: 'Centro Cívico',
              experienceRegistered: true,
              note: 'Muy paciente y didáctica, intercambiamos clases de inglés por arreglo de costura.',
            },
          },
          {
            title: 'Gasfitería de urgencia · Fugas, desatoros y griferías',
            description:
              'Atención inmediata en el barrio. Reparación de tuberías rotas, tanques de inodoro, llaves de ducha y filtraciones sin romper pared.',
            kind: 'service',
            modes: ['service'],
            category: 'Plomería',
            priceLabel: 'S/ 35 orientativo',
            zoneName: 'Centro Cívico',
            locationLabel: 'A 500 m · Jr. Camaná',
            distanceKm: 0.5,
            mapPosition: { x: 56, y: 68 },
            availability: 'now',
            status: 'published',
            featured: true,
            isDemo: true,
            owner: providerId,
            providerName: 'Pedro Huamán',
            providerInitials: 'PH',
            demoProvider: {
              name: 'Pedro Huamán',
              initials: 'PH',
              rating: 4.8,
              reviewCount: 45,
              completedCount: 61,
            },
            neighborApproval: {
              author: 'Lucía Benavides',
              declaredZone: 'Centro Cívico',
              experienceRegistered: true,
              note: 'Solucionó una fuga de agua un domingo en menos de una hora.',
            },
          },
          {
            title: 'Apoyo solidario: compras de mercado para Don Hernán (82 años)',
            description:
              'Necesitamos un vecino voluntario que pueda acompañar o traer las compras de verduras del mercado para Don Hernán este martes y viernes por la mañana.',
            kind: 'help',
            modes: ['help'],
            category: 'Hogar',
            priceLabel: 'Ayuda solidaria',
            zoneName: 'Centro Cívico',
            locationLabel: 'A 400 m · Jr. Rufino Torrico',
            distanceKm: 0.4,
            mapPosition: { x: 42, y: 72 },
            availability: 'now',
            status: 'published',
            featured: true,
            isDemo: true,
            owner: providerId,
            providerName: 'Red Solidaria Sector 3',
            providerInitials: 'RS',
            demoProvider: {
              name: 'Red Solidaria Sector 3',
              initials: 'RS',
              rating: 5.0,
              reviewCount: 18,
              completedCount: 30,
            },
            neighborApproval: {
              author: 'Junta Vecinal Centro Cívico',
              declaredZone: 'Centro Cívico',
              experienceRegistered: true,
              note: 'Solicitud coordinada con los vecinos del edificio para apoyar a adultos mayores.',
            },
          },
          {
            title: 'Lote de libros escolares y cuentos infantiles ilustrados',
            description:
              'Regalo 12 libros de primaria y cuentos en excelente estado para familias del barrio que los aprovechen este año escolar.',
            kind: 'gift',
            modes: ['gift'],
            category: 'Clases',
            priceLabel: 'Sin costo (Regalo)',
            zoneName: 'Centro Cívico',
            locationLabel: 'A 350 m · Jr. Moquegua',
            distanceKm: 0.35,
            mapPosition: { x: 52, y: 26 },
            availability: 'today',
            status: 'published',
            featured: false,
            isDemo: true,
            owner: providerId,
            providerName: 'Beatriz Salazar',
            providerInitials: 'BS',
            demoProvider: {
              name: 'Beatriz Salazar',
              initials: 'BS',
              rating: 5.0,
              reviewCount: 9,
              completedCount: 14,
            },
            neighborApproval: {
              author: 'Elena G.',
              declaredZone: 'Centro Cívico',
              experienceRegistered: true,
              note: 'Muchas gracias por compartir material educativo con los niños de la cuadra.',
            },
          },
          {
            title: 'Necesito escalera tijera de aluminio por este sábado',
            description:
              'Busco vecino que me pueda prestar una escalera de 6 pasos por 3 horas para pintar el techo de mi sala. Ofrezco queque casero o ayuda en jardinería.',
            kind: 'need',
            modes: ['need', 'loan', 'barter'],
            category: 'Hogar',
            priceLabel: 'Préstamo / Trueque solidario',
            zoneName: 'Centro Cívico',
            locationLabel: 'A 250 m · Paseo Colón',
            distanceKm: 0.25,
            mapPosition: { x: 72, y: 38 },
            availability: 'today',
            status: 'published',
            featured: false,
            isDemo: true,
            owner: requesterId ?? providerId,
            providerName: 'Lucía Paredes',
            providerInitials: 'LP',
            demoProvider: {
              name: 'Lucía Paredes',
              initials: 'LP',
              rating: 4.9,
              reviewCount: 7,
              completedCount: 11,
            },
          },
        ]

        for (const item of starterListings) {
          await payload.create({
            collection: 'listings' as never,
            data: item as never,
            overrideAccess: true,
            context: { appWorkflowMutation: true },
          })
        }
      }

      seeded = true
    } catch (err) {
      console.error('[seed-db] Error seeding initial demo data:', err)
    } finally {
      seedingPromise = null
    }
  })()

  return seedingPromise
}

