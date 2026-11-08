-- =============================================================================
-- NexoBarrio · Esquema PostgreSQL + RLS para Supabase
-- Reto Hackatón UTP + El Comercio (Grupo 22 - Innovatrux)
-- =============================================================================

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

-- =============================================================================
-- Índices de rendimiento (Búsqueda por zona, modalidad y actividad reciente)
-- =============================================================================
create index if not exists idx_listings_zone_kind on public.listings (zone_name, kind);
create index if not exists idx_listings_created_at on public.listings (created_at desc);
create index if not exists idx_interactions_requester on public.interactions (requester_id, updated_at desc);
create index if not exists idx_interactions_provider on public.interactions (provider_id, updated_at desc);
create index if not exists idx_messages_interaction on public.messages (interaction_id, created_at asc);
create index if not exists idx_community_circle on public.community_posts (circle_name, created_at desc);

-- =============================================================================
-- Seguridad Row Level Security (RLS) y Políticas de Acceso para FastAPI / Web
-- =============================================================================
alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.interactions enable row level security;
alter table public.messages enable row level security;
alter table public.reviews enable row level security;
alter table public.community_posts enable row level security;
alter table public.emergency_board enable row level security;

-- Políticas de lectura y escritura para el API (anon / authenticated / service_role)
drop policy if exists "Lectura y gestion perfiles" on public.profiles;
create policy "Lectura y gestion perfiles" on public.profiles
  for all to anon, authenticated, service_role using (true) with check (true);

drop policy if exists "Lectura y publicacion listings" on public.listings;
create policy "Lectura y publicacion listings" on public.listings
  for all to anon, authenticated, service_role using (true) with check (true);

drop policy if exists "Gestion de interacciones" on public.interactions;
create policy "Gestion de interacciones" on public.interactions
  for all to anon, authenticated, service_role using (true) with check (true);

drop policy if exists "Mensajes de interaccion" on public.messages;
create policy "Mensajes de interaccion" on public.messages
  for all to anon, authenticated, service_role using (true) with check (true);

drop policy if exists "Resenas verificadas" on public.reviews;
create policy "Resenas verificadas" on public.reviews
  for all to anon, authenticated, service_role using (true) with check (true);

drop policy if exists "Muro vecinal y circulos" on public.community_posts;
create policy "Muro vecinal y circulos" on public.community_posts
  for all to anon, authenticated, service_role using (true) with check (true);

drop policy if exists "Tablero de emergencia" on public.emergency_board;
create policy "Tablero de emergencia" on public.emergency_board
  for all to anon, authenticated, service_role using (true) with check (true);

-- =============================================================================
-- Datos Semilla Iniciales (Perfiles y las 8 Publicaciones del Barrio)
-- =============================================================================

insert into public.profiles (email, display_name, zone_name, bio, doc_type, doc_number, verification_status, rating, review_count, completed_count)
values
  ('demo@nexobarrio.test', 'Lucía Paredes', 'Centro Cívico', 'Vecina de Centro Cívico interesada en trueques, préstamos de herramientas y apoyo solidario.', 'DNI', '72849103', 'verified', 5.0, 12, 18),
  ('proveedor.demo@nexobarrio.test', 'Carlos Mendoza', 'Centro Cívico', 'Técnico electricista matriculado con 10 años atendiendo emergencias y mantenimiento en el barrio.', 'DNI', '41928374', 'verified', 4.9, 38, 52)
on conflict (email) do nothing;

insert into public.listings (
  title, description, kind, modes, category, price_label, zone_name, location_label,
  distance_km, map_x, map_y, availability, image_url, provider_name, provider_initials,
  rating, review_count, completed_count, approval_author, approval_zone, approval_note, featured
)
select * from (values
  (
    'Electricista matriculado · Reparaciones y tableros',
    'Técnico con 10 años en la zona. Diagnóstico de cortocircuitos, cambio de llaves térmicas, luminarias LED y tomacorrientes seguros.',
    'service', array['service'], 'Electricidad', 'S/ 40 por visita', 'Centro Cívico',
    'A 450 m · Jr. Washington', 0.45, 48, 42, 'now', '/images/listings/electricista.svg',
    'Carlos Mendoza', 'CM', 4.9, 38, 52, 'Rosa Morales', 'Centro Cívico',
    'Llegó en 20 minutos cuando saltó la llave general del edificio y dejó todo rotulado.', true
  ),
  (
    'Bicicleta Montañera Aro 26 en buen estado',
    'Cambios Shimano de 21 velocidades y frenos recién regulados. La ofrezco en trueque por taladro percutor, escalera o utensilios de cocina.',
    'barter', array['barter', 'product'], 'Transporte', 'Trueque o S/ 220', 'Centro Cívico',
    'A 600 m · Av. Garcilaso de la Vega', 0.60, 62, 55, 'coordinate', '/images/listings/bicicleta.svg',
    'Alejandro Prado', 'AP', 4.8, 14, 19, 'Jorge Villena', 'Centro Cívico',
    'Hicimos trueque el mes pasado en la plazuela, súper puntual y transparente.', true
  ),
  (
    'Taladro Percutor Bosch 650W con maletín de brocas',
    'Parte de la Biblioteca de Herramientas del barrio. Se presta de 1 a 3 días sin costo para instalar repisas, cortinas o cuadros.',
    'loan', array['loan'], 'Herramientas', 'Préstamo S/ 0 (1–3 días)', 'Centro Cívico',
    'A 300 m · Jr. Quilca', 0.30, 35, 38, 'now', '/images/listings/taladro.svg',
    'María Elena Torres', 'MT', 5.0, 22, 29, 'Comité Vecinal Quilca', 'Centro Cívico',
    'Ya ayudó a más de 20 departamentos a equipar sus casas sin comprar herramientas.', true
  ),
  (
    'Clases de Matemáticas, Física e Inglés (Banco de Tiempo)',
    'Ingeniera ofrece refuerzo escolar y conversación en inglés. Puedes pagar por hora o intercambiar por 2 horas de apoyo en diseño o repostería.',
    'skill', array['skill', 'service', 'barter'], 'Clases', '1 h por 1 h / S/ 25', 'Santa Beatriz',
    'A 700 m · Av. Petit Thouars', 0.70, 28, 52, 'now', '/images/listings/clases.svg',
    'Sofía Cárdenas', 'SC', 4.9, 15, 21, 'Carmen Ríos', 'Santa Beatriz',
    'Mi hijo subió sus notas en dos semanas, explica con mucha paciencia.', true
  ),
  (
    'Gasfitería de urgencia y detección de filtraciones',
    'Reparación de fugas en baños y cocinas, cambio de griferías, bombas y limpieza de tanques elevados.',
    'service', array['service'], 'Plomería', 'S/ 35 visita', 'Jesús María',
    'A 800 m · Av. Cuba', 0.80, 56, 66, 'now', '/images/listings/gasfiteria.svg',
    'Pedro Huamán', 'PH', 4.8, 45, 61, 'Lucía Benavides', 'Jesús María',
    'Resolvió una filtración un domingo por la tarde sin cobrar recargo excesivo.', false
  ),
  (
    'Apoyo para compras de mercado de adulto mayor',
    'Coordinamos turno semanal para acompañar o llevar frutas y verduras a Don Hernán (82 años) desde el mercado del barrio.',
    'help', array['help'], 'Apoyo Solidario', 'Voluntariado vecinal', 'Centro Cívico',
    'A 500 m · Jr. Rufino Torrico', 0.50, 42, 70, 'now', '/images/listings/ayuda-mayor.svg',
    'Junta Vecinal Sector 3', 'JV', 5.0, 16, 24, 'Coordinación Social', 'Centro Cívico',
    'Iniciativa verificada por los vecinos del bloque C.', true
  ),
  (
    'Lote de 15 libros escolares y cuentos infantiles ilustrados',
    'Donación gratuita para familias del barrio o rincón de lectura infantil. En excelente estado.',
    'gift', array['gift'], 'Clases', 'Entrega gratuita', 'Lince',
    'A 950 m · Parque Mariscal Castilla', 0.95, 72, 32, 'coordinate', '/images/listings/libros.svg',
    'Beatriz Salazar', 'BS', 5.0, 9, 12, 'Asociación de Padres Lince', 'Lince',
    'Siempre colabora con útiles y libros bien cuidados para los niños.', false
  ),
  (
    'Busco escalera de tijera de 6 pasos por esta tarde',
    'Necesito cambiar dos luminarias altas en el pasadizo común. La recojo y devuelvo el mismo día.',
    'need', array['need', 'loan'], 'Hogar', 'Solicita préstamo hoy', 'Centro Cívico',
    'A 400 m · Av. Bolivia', 0.40, 24, 30, 'now', '/images/listings/escalera.svg',
    'Lucía Paredes', 'LP', 4.9, 7, 10, 'Carlos Mendoza', 'Centro Cívico',
    'Vecina súper cuidadosa, devuelve las herramientas limpias y a tiempo.', false
  )
) as v(
  title, description, kind, modes, category, price_label, zone_name, location_label,
  distance_km, map_x, map_y, availability, image_url, provider_name, provider_initials,
  rating, review_count, completed_count, approval_author, approval_zone, approval_note, featured
)
where not exists (select 1 from public.listings limit 1);
