# 🏘️ NexoBarrio — Guía Maestra de Trabajo por Roles (5 Integrantes)
**Reto Hackatón UTP + El Comercio · Grupo 22 (Innovatrux)**

> **Propósito de este documento:** Este `README.md` contiene el paso a paso detallado de principio a fin para los **5 integrantes del equipo**, organizado por roles técnicos (Backend/Supabase, Frontend Auth, Frontend Mapa/Core, Frontend Comunidad/Emergencias y Diseño UI/UX + QA) para trabajar en paralelo sin conflictos en GitHub y llegar listos a la presentación de las **8:00 a. m.**

---

## 📋 Reglas Generales para los 5 Integrantes

1. **Cero jerga interna del prompt en la pantalla:**
   - **Prohibido** mostrar en la interfaz textos como `Escenario A`, `Escenario G`, `VECI-TRQ-16`, `INT-12`, `Módulo 23`, `VECI Juntos`, `VECI Match`, `Dato demo` o `Hackatón`.
   - Todo texto visible para el jurado o los vecinos debe estar en español natural y claro (*«Círculos y Muro Vecinal»*, *«Pedidos y Servicios en Grupo»*, *«Trueque Inteligente entre 3 vecinos»*, *«Biblioteca de Herramientas»*).
2. **Flujo de trabajo en GitHub (Rama Secundaria `develop` + Pull Requests en Videollamada):**
   - **`main`**: Rama principal protegida (solo recibe código revisado y aprobado en videollamada).
   - **`develop`**: Rama secundaria donde ya están cargados todos los avances actuales (base de datos local SQLite funcional, interfaz limpia sin códigos internos y esta guía por roles).
   - **Paso a paso para cada integrante:**
     ```bash
     # 1. Descargar la rama secundaria develop
     git fetch origin
     git checkout develop
     git pull origin develop

     # 2. (Opcional recomendado) Crear tu sub-rama de rol desde develop o trabajar sobre develop
     git checkout -b rol-1-backend     # (o rol-2-auth, rol-3-mapa, rol-4-comunidad, rol-5-uiux)

     # 3. Al terminar tus cambios, guardar y subir al repositorio
     git add .
     git commit -m "feat(rol-X): descripcion de los cambios realizados"
     git push -u origin rol-1-backend  # (o git push origin develop)
     ```
   - **Revisión en Videollamada (Pull Request → Merge a `main`):**
     1. Entrar a [https://github.com/LuisGamboaUTP/PlataformaVecinalComunitaria-VECI/pulls](https://github.com/LuisGamboaUTP/PlataformaVecinalComunitaria-VECI/pulls) → clic en **New pull request**.
     2. Seleccionar `base: main` ← `compare: develop` (o de `rol-X` hacia `develop` y luego `develop` hacia `main`).
     3. Revisar juntos en videollamada la pestaña **Files changed**, verificar que la app compile (`pnpm dev`) y dar clic en **Merge pull request**.
3. **Instalación rápida en Windows / Mac:**
   ```bash
   pnpm install
   pnpm dev
   ```
   La aplicación abre localmente en `http://localhost:3000`.

---

## 👨‍💻 ROL 1: Arquitecto Backend, Base de Datos (Supabase) & Cloud Deploy

### 🎯 Objetivo del Rol
Configurar **Supabase (PostgreSQL + Auth)** como base de datos en la nube, conectar los endpoints del servidor con respaldo local automático (para que nunca se caiga en vivo) y desplegar el link público `https://...` en **Railway** o **Vercel**.

### 📁 Archivos exclusivos a tu cargo
- `supabase/schema.sql`
- `src/lib/supabase/client.ts`
- `src/lib/supabase/server.ts`
- `src/lib/seed-db.ts`
- `src/app/(frontend)/api/app/*` (`listings`, `interactions`, `messages`, `reviews`, `session`, `notifications`)

### 🛠️ Paso a paso detallado

#### Paso 1: Crear el proyecto en Supabase y ejecutar el SQL
1. Ingresa a [https://supabase.com](https://supabase.com) → **New Project** → Nómbralo `nexobarrio-db`.
2. Ve a **SQL Editor** → **New Query**, pega y ejecuta este script completo (y guárdalo en `supabase/schema.sql`):

```sql
-- 1. Tabla de perfiles de vecinos y técnicos
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  display_name text not null,
  zone_name text not null default 'Centro Cívico',
  bio text,
  doc_type text check (doc_type in ('DNI', 'CE')),
  doc_number text,
  verification_status text not null default 'unverified',
  rating numeric(3,2) default 5.0,
  review_count int default 0,
  completed_count int default 0,
  created_at timestamptz default now()
);

-- 2. Tabla de publicaciones (Las 8 modalidades del reto)
create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  kind text not null check (kind in ('service','product','skill','barter','gift','loan','need','help')),
  modes text[] default '{}',
  category text not null,
  price_label text,
  zone_name text not null default 'Centro Cívico',
  location_label text not null,
  distance_km numeric(4,2) default 0.4,
  map_x numeric(5,2) default 50,
  map_y numeric(5,2) default 50,
  availability text default 'now',
  image_url text,
  provider_name text not null,
  provider_initials text default 'NB',
  rating numeric(3,2) default 4.9,
  review_count int default 10,
  completed_count int default 15,
  approval_author text,
  approval_zone text,
  approval_note text,
  featured boolean default false,
  created_at timestamptz default now()
);

-- 3. Tabla de solicitudes, trueques, préstamos y ayudas
create table if not exists public.interactions (
  id uuid primary key default gen_random_uuid(),
  idempotency_key text unique,
  listing_id text not null,
  listing_title text not null,
  requester_id text not null,
  provider_id text,
  type text not null,
  status text not null default 'requested',
  summary text not null,
  loan_due_at timestamptz,
  borrower_confirmed boolean default false,
  lender_confirmed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. Tabla de mensajes de chat por solicitud
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  interaction_id text not null,
  sender_id text not null,
  body text not null,
  delivery_state text default 'sent',
  created_at timestamptz default now()
);

-- 5. Tabla de reseñas verificadas (Visto Bueno Vecinal)
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  interaction_id text not null,
  stars int not null check (stars between 1 and 5),
  comment text not null,
  created_at timestamptz default now()
);

-- 6. Tabla de Muro Vecinal y Círculos
create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  circle_name text not null,
  author_name text not null,
  author_initials text default 'VN',
  body text not null,
  has_shared_listing boolean default false,
  comments jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

-- 7. Tabla de Tablero de Emergencia (Comunidad Activa)
create table if not exists public.emergency_board (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('Necesidad', 'Recurso disponible', 'Grupo de apoyo')),
  title text not null,
  zone_name text not null default 'Centro Cívico',
  source text not null,
  verified boolean default false,
  created_at timestamptz default now()
);
```

#### Paso 2: Instalar y configurar el cliente de Supabase
1. Ejecuta en la terminal:
   ```bash
   pnpm add @supabase/supabase-js
   ```
2. En **Supabase > Project Settings > API**, copia `Project URL` y `anon public key` y colócalos en tu archivo `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
   ```
3. Crea `src/lib/supabase/client.ts` y `src/lib/supabase/server.ts` exportando `createClient(url, key)` y una función auxiliar `isSupabaseConfigured()` para que si algún compañero corre el proyecto sin `.env.local`, el backend siga respondiendo con la base local SQLite (`src/local.db`) sin romperse.

#### Paso 3: Conectar los endpoints API y semillar datos
1. En `src/app/(frontend)/api/app/listings/route.ts`:
   - Si `isSupabaseConfigured()` es `true`, consulta y crea registros en `supabase.from('listings')`.
   - Mantén el respaldo de `ensureSeeded` para que las 8 publicaciones iniciales siempre aparezcan.
2. Haz lo mismo en `interactions/route.ts`, `messages/route.ts` y `reviews/route.ts`.

#### Paso 4: Despliegue en la Nube (Railway o Vercel)
1. Sube los cambios a GitHub (`git push origin main`).
2. Entra a **Railway.com** (o **Vercel.com**) → **New Project from GitHub repo** → selecciona `PlataformaVecinalComunitaria-VECI`.
3. Agrega las variables `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Genera el dominio público (`https://...`) y crea un **Código QR** para ponerlo en la diapositiva final.

---

## 🔐 ROL 2: Desarrollador Frontend — Flujo de Entrada, Auth & Perfiles

### 🎯 Objetivo del Rol
Separar el flujo de bienvenida que hoy está junto en `NeighborhoodApp.tsx` en **pantallas y rutas independientes** (`Splash` → `Onboarding` → `Login` / `Registro` / `Recuperar`) y gestionar la validación de identidad con **DNI y Carnet de Extranjería**.

### 📁 Archivos exclusivos a tu cargo
- `src/components/onboarding/SplashScreen.tsx`
- `src/components/onboarding/OnboardingView.tsx`
- `src/app/(frontend)/onboarding/page.tsx`
- `src/app/(frontend)/login/page.tsx`
- `src/app/(frontend)/registro/page.tsx`
- `src/app/(frontend)/recuperar/page.tsx`
- `src/app/(frontend)/auth/AuthForm.tsx`
- `src/components/modals/ProfileModal.tsx`
- `src/components/modals/ProviderProfileModal.tsx`

### 🛠️ Paso a paso detallado

#### Paso 1: Separar el Splash Screen (`SplashScreen.tsx`)
1. Extrae la pantalla de carga con el logo `N`, las órbitas animadas y el lema *"Lo cercano nos conecta"* a `src/components/onboarding/SplashScreen.tsx`.
2. Ajusta el tiempo de visualización inicial a `1400ms` para que la animación se aprecie con fluidez al abrir la app.

#### Paso 2: Crear la ruta y pantalla de Onboarding (`/onboarding`)
1. Crea `src/components/onboarding/OnboardingView.tsx` y `src/app/(frontend)/onboarding/page.tsx`.
2. Incluye los **3 pasos interactivos** exigidos por el reto:
   - **Paso 1 (Descubrir):** Oficios y productos a pocas cuadras con *«Visto Bueno Vecinal»*.
   - **Paso 2 (Intercambiar sin dinero):** Trueque, Biblioteca de Herramientas y Banco de Tiempo.
   - **Paso 3 (Ayudar y estar prevenidos):** Ayuda comunitaria y Directorio de Emergencia (116, 105, 106).
3. Mantén el botón **🔊 Escuchar** (síntesis de voz) y el selector de barrio (*Centro Cívico, Santa Beatriz, Jesús María, Lince, Breña*).
4. En el último paso, ofrece **3 botones claros de salida**:
   - **Iniciar sesión** → redirige a `/login`
   - **Crear cuenta vecinal** → redirige a `/registro`
   - **Explorar el mapa ahora** → redirige a `/`

#### Paso 3: Separar Login (`/login`), Registro (`/registro`) y Recuperación (`/recuperar`)
1. Crea las rutas independientes:
   - `src/app/(frontend)/login/page.tsx` → Inicia en modo ingreso, con enlaces hacia `/registro` y `/recuperar`, más los **2 botones de prueba rápida en 1 clic**:
     - *Entrar como Vecina (Lucía)* (`demo@nexobarrio.test`)
     - *Entrar como Técnico (Carlos)* (`proveedor.demo@nexobarrio.test`)
   - `src/app/(frontend)/registro/page.tsx` → Formulario exclusivo de registro con validación en vivo de documento oficial:
     - **DNI:** exactamente 8 dígitos numéricos (`^\d{8}$`).
     - **Carnet de Extranjería (CE):** de 9 a 12 caracteres alfanuméricos (`^[A-Z0-9]{9,12}$`).
   - `src/app/(frontend)/recuperar/page.tsx` → Formulario exclusivo para recuperar contraseña por correo.

#### Paso 4: Perfil del Vecino y Portafolio del Técnico
1. Extrae `ProfileView` a `src/components/modals/ProfileModal.tsx` (pestañas: *Identidad DNI/CE*, *Lectura y Voz*, *Guardados*, *Bienvenida*, *Privacidad*).
2. Extrae `ProviderProfileModal` a `src/components/modals/ProviderProfileModal.tsx` mostrando claramente sus trabajos recientes en el barrio y separando su calificación de oficios de sus medallas solidarias.

---

## 🗺️ ROL 3: Desarrollador Frontend — Mapa, Geolocalización & Publicación en 3 Clics

### 🎯 Objetivo del Rol
Dominar el recorrido principal del reto: **Economía Local de Proximidad**, geolocalización en el mapa, **«Visto Bueno Vecinal»** y el flujo de **Publicar en máximo 3 clics**.

### 📁 Archivos exclusivos a tu cargo
- `src/components/map/MapTab.tsx`
- `src/components/explore/ExploreTab.tsx`
- `src/components/publish/PublishTab.tsx`
- `src/components/modals/DetailModal.tsx`
- `src/components/cards/ListingCard.tsx`

### 🛠️ Paso a paso detallado

#### Paso 1: Mejorar el Mapa Interactivo (`MapTab.tsx`)
1. Extrae la vista del mapa a `src/components/map/MapTab.tsx`.
2. Asegúrate de que cada pin en el mapa muestre su ícono según modalidad y su precio o etiqueta (`S/ 40 por visita`, `Trueque`, `Préstamo S/ 0`).
3. **Mejora clave de UI/UX:** Al tocar un pin del mapa, muestra una **minitarjeta flotante sobre el mapa** con el título, distancia (`0.45 km`), sello `✓ Visto Bueno Vecinal` y un botón directo **«Ver ficha»**, además de sincronizar la hoja inferior deslizable (`discovery-sheet`).
4. Verifica que los filtros superiores del mapa funcionen al instante:
   - Botón `⚡ Ahora` (filtra solo quienes tienen atención inmediata).
   - Selector de radio (`1 km`, `3 km`, `5 km`, `10 km`).
   - Píldoras de modalidad (*Todo, Servicio, Producto, Trueque, Préstamo, Habilidad, Regalo, Ayuda*).

#### Paso 2: Catálogo Sincronizado (`ExploreTab.tsx`) y Tarjetas (`ListingCard.tsx`)
1. Extrae `ListingCard` a `src/components/cards/ListingCard.tsx`.
2. En `ExploreTab.tsx`, mantén sincronizados los mismos filtros del mapa y el selector de ordenamiento (*Cercanía*, *Mejor valorados*, *Recientes*).
3. Si un filtro no arroja resultados en 1 km, muestra el estado vacío con el botón **«Ampliar radio a 10 km»** o **«Publicar necesidad»**.

#### Paso 3: Ficha de Detalle con «Visto Bueno Vecinal» (`DetailModal.tsx`)
1. Extrae `DetailView` a `src/components/modals/DetailModal.tsx`.
2. Destaca visualmente la tarjeta verde de **«Visto Bueno Vecinal»** con la cita textual del vecino que lo recomienda y su barrio.
3. Incluye el botón **🔊 Escuchar ficha** y la nota de privacidad residencial (*la dirección exacta nunca es pública, solo se acuerda por chat*).

#### Paso 4: Publicación en Máximo 3 Clics (`PublishTab.tsx`)
1. Extrae la pestaña de publicación a `src/components/publish/PublishTab.tsx`.
2. Comprueba que el flujo cumpla estrictamente los **3 clics del reto**:
   - **Clic 1:** Tocar `Publicar (+)` en la barra inferior.
   - **Clic 2:** Tocar la modalidad deseada (ej. *Servicio*, *Trueque*, *Préstamo*).
   - **Clic 3:** Completar título/descripción y tocar **«Publicar ahora»**.
3. Mantén el botón de **Vista previa** opcional y el **Guardado automático de borrador local** si el usuario no tiene internet.

---

## 🤝 ROL 4: Desarrollador Frontend — Economía Solidaria, Comunidad & Emergencias

### 🎯 Objetivo del Rol
Implementar y dar persistencia a todos los mecanismos de **Cadena de Favores (sin dinero)**, organización vecinal y **evolución en situaciones de emergencia**.

### 📁 Archivos exclusivos a tu cargo
- `src/components/explore/TriangularBarterPanel.tsx`
- `src/components/community/CommunityTab.tsx`
- `src/components/activity/ActivityTab.tsx`
- `src/components/modals/EmergencyModal.tsx`
- `src/components/modals/ImpactModal.tsx`

### 🛠️ Paso a paso detallado

#### Paso 1: Trueque Inteligente (3 vecinos) y Biblioteca de Herramientas (`TriangularBarterPanel.tsx`)
1. Extrae `TriangularBarterPanel` a `src/components/explore/TriangularBarterPanel.tsx`.
2. Muestra claramente la cadena entre los 3 vecinos de Centro Cívico:
   - **Vecino 1 (Alejandro):** Entrega Bicicleta Aro 26 → Recibe Taladro Bosch.
   - **Vecino 2 (María Elena):** Entrega Taladro Bosch → Recibe 3 sesiones de Inglés.
   - **Vecina 3 (Sofía):** Entrega 3 sesiones de Inglés → Recibe Bicicleta Aro 26.
3. Al presionar **«Confirmar mi participación (3/3)»**, cambia el estado a verde: `✓ 3 de 3 confirmados · Listo para coordinar`.
4. En la ficha de préstamo de herramientas, verifica el selector de plazo (`1 día`, `2 días`, `3 días`) y la doble confirmación de devolución.

#### Paso 2: Comunidad, Pedidos Grupales y Rutas Solidarias (`CommunityTab.tsx`)
1. Extrae `CommunityView` a `src/components/community/CommunityTab.tsx` con sus 3 subpestañas limpias:
   - **Círculos y Muro Vecinal:** Permite crear un nuevo círculo, publicar en el muro, responder comentarios y tocar una recomendación compartida para abrir la ficha del electricista.
   - **Pedidos y Servicios en Grupo:** Permite unirse (`+1`) o salir de contrataciones colectivas de la cuadra (ej. mantenimiento de intercomunicadores o recarga de extintores).
   - **Rutas Solidarias:** Permite solicitar apoyo en trayectos habituales de vecinos (ej. compras pesadas del mercado o traslado de medicinas).
2. **Persistencia:** Guarda los nuevos posts del muro, círculos creados y uniones a grupos en `localStorage` (y en Supabase si está activo) para que no se borren al recargar la página.

#### Paso 3: Modo Emergencia y Comunidad Activa (`EmergencyModal.tsx`)
1. Extrae `EmergencyView` a `src/components/modals/EmergencyModal.tsx`.
2. Verifica las 2 vistas clave del reto para situaciones críticas:
   - **Líneas de Emergencia (Offline OK):** Botones grandes de llamada directa (`tel:116` Bomberos, `tel:105` Policía, `tel:106` SAMU, `tel:115` Defensa Civil/INDECI) y botón **🔊 Escuchar**.
   - **Apoyo Vecinal Activo (Tablero de Ayuda Humanitaria):** Contador en vivo de *Necesidades abiertas*, *Recursos vecinales* y *Brigadas activas*, más el formulario para publicar un recurso crítico (agua potable, botiquín, linternas) o pedir ayuda urgente. Guarda los nuevos avisos en `localStorage` / Supabase.

#### Paso 4: Actividad, Chat, Reseñas e Impacto (`ActivityTab.tsx` e `ImpactModal.tsx`)
1. En `ActivityTab.tsx`: Verifica que el proveedor pueda **Aceptar / Rechazar / Confirmar cierre**, que en préstamos ambos confirmen la devolución, que el **Chat** envíe mensajes en tiempo real y que al completar se habilite **Calificar ★** (1 a 5 estrellas).
2. En `ImpactModal.tsx`: Muestra los indicadores de ahorro y reutilización del barrio y las barras de categorías más buscadas.

---

## 🎨 ROL 5: Diseñador UI/UX, Accesibilidad Universal (WCAG) & QA / Pitch

### 🎯 Objetivo del Rol
Darle acabado visual de producto real (ilustraciones/imágenes en las 8 publicaciones, cero tarjetas vacías), garantizar la accesibilidad para cualquier vecino y preparar el guion de demostración para los evaluadores.

### 📁 Archivos exclusivos a tu cargo
- `public/images/listings/*`
- `src/lib/demo-listings.ts`
- `src/app/(frontend)/styles.css`

### 🛠️ Paso a paso detallado

#### Paso 1: Crear y asignar imágenes a las 8 publicaciones iniciales
1. Crea en `public/images/listings/` 8 ilustraciones SVG/PNG limpias y atractivas:
   - `electricista.svg` (Servicio eléctrico)
   - `bicicleta.svg` (Trueque bicicleta aro 26)
   - `taladro.svg` (Préstamo taladro Bosch)
   - `clases.svg` (Habilidad / Banco de tiempo)
   - `gasfiteria.svg` (Servicio gasfitería de urgencia)
   - `ayuda-mayor.svg` (Ayuda solidaria a Don Hernán)
   - `libros.svg` (Regalo lote de libros infantiles)
   - `escalera.svg` (Necesidad escalera de aluminio)
2. Asigna esas rutas (`/images/listings/...`) en `src/lib/demo-listings.ts` y en `src/lib/seed-db.ts` para que **todas las tarjetas del mapa y del catálogo luzcan con imagen a todo color** (tanto con internet como sin internet).

#### Paso 2: Pulido Responsivo y Accesibilidad Universal (`styles.css`)
1. Revisa en el navegador (modo móvil `390x844` y modo escritorio `1440x900`) que ningún texto o botón se desborde.
2. Verifica las 5 funciones de accesibilidad para vecinos y adultos mayores:
   - **🎙️ Botón Voz** en el buscador superior (dictado por voz).
   - **🔊 Botón Escuchar** en bienvenida, fichas y emergencias.
   - **Tamaño de letra** en *Perfil > Lectura y Voz* (`Normal 100%`, `Grande 112%`, `Extra Grande 124%`).
   - **Alto Contraste** (bordes reforzados y contraste nítido).
   - **Vista simplificada** (botones táctiles de mínimo `48px` de alto).

#### Paso 3: Prueba de Resiliencia Offline/Online
1. Abre las herramientas de desarrollador del navegador (`F12` > pestaña *Network* > selecciona **Offline**).
2. Comprueba que aparece el aviso *"Estás navegando sin conexión a internet"*, que puedes abrir las fichas y teléfonos de emergencia (`116/105/106`), y que al enviar una solicitud se guarda en tu dispositivo y se sincroniza apenas vuelves a **Online**.

#### Paso 4: Guion de Demostración en Vivo para el Jurado (3 Minutos · 8:00 AM)
Prepara 2 pestañas o celulares con el link público abierto:
1. **Minuto 0:00 – 0:45 (Bienvenida y Economía Local):** Mostrar el *Onboarding*, entrar al **Mapa de Centro Cívico**, filtrar por `⚡ Ahora`, abrir al electricista *Carlos Mendoza*, mostrar su **«Visto Bueno Vecinal»** de *Rosa Morales* y escuchar la ficha en voz alta (🔊).
2. **Minuto 0:45 – 1:30 (Publicación en 3 Clics y Economía Solidaria):** Crear una publicación en **3 clics** desde la pestaña `Publicar (+)`. Luego ir a `Explorar` para mostrar la **Biblioteca de Herramientas** (préstamo del Taladro Bosch S/ 0) y el **Trueque Inteligente entre 3 vecinos** confirmando el `3/3`.
3. **Minuto 1:30 – 2:15 (Interacción Real entre 2 Cuentas):** Con la cuenta de *Lucía (Vecina)* solicitar el servicio/préstamo → cambiar a la cuenta de *Carlos (Técnico)* en `Actividad`, aceptar la solicitud, responder por el **Chat integrado**, confirmar el cierre y dejar una reseña de **5 estrellas ★**.
4. **Minuto 2:15 – 3:00 (Comunidad y Emergencia):** Mostrar en `Comunidad` los **Pedidos Grupales (`+1`)** y **Rutas Solidarias**, y cerrar tocando el botón rojo **«Emergencia»** para mostrar las líneas oficiales (`116, 105, 106`) y registrar en vivo un recurso de agua potable/botiquín en **Apoyo Vecinal Activo**.

