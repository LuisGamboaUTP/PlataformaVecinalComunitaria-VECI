# 🏘️ NexoBarrio — Guía de Tareas de BACKEND (FastAPI + Arquitectura en Capas + Supabase)
**Reto Hackatón UTP + El Comercio · Grupo 22 (Innovatrux)**

> **Propósito de este documento:** Contiene todas las tareas exclusivas de **Backend con FastAPI (Python), entorno virtual `.venv`, Arquitectura Limpia en Capas, Base de Datos Supabase y Pruebas con Postman**, completamente separado del Frontend.

---

## 📂 Arquitectura en Capas del Backend (`backend/app/`)

Siguiendo buenas prácticas de ingeniería de software (**Separation of Concerns / Clean Layered Architecture**), el backend está modularizado en 4 capas claras (`core`, `schemas`, `repositories`, `routers`) más un punto de entrada ligero (`main.py`):

```text
PlataformaVecinalComunitaria-VECI/
├── backend/
│   ├── .venv/                              # Entorno virtual de Python (aislado)
│   ├── .env                                # Credenciales privadas de Supabase (no se sube a Git)
│   ├── .env.example                        # Plantilla de variables de entorno
│   ├── requirements.txt                    # Dependencias Python (fastapi, uvicorn, supabase, pydantic)
│   ├── schema.sql                          # Script SQL de las 7 tablas + RLS + datos semilla
│   ├── NexoBarrio.postman_collection.json  # Colección Postman v2.1 con las 8 carpetas de servicios
│   └── app/
│       ├── __init__.py
│       ├── main.py                         # Entrypoint ligero: instancia FastAPI, CORS y registra Routers
│       ├── core/                           # 1. CAPA CORE (Configuración, Cliente Supabase y Seguridad)
│       │   ├── __init__.py
│       │   ├── config.py                   # Variables de entorno y Settings centralizados
│       │   ├── database.py                 # Singleton de conexión a Supabase y health validation
│       │   └── security.py                 # Resolución de sesión por Cookie o Header X-User-Id
│       ├── schemas/                        # 2. CAPA SCHEMAS (DTOs y Validación Pydantic por dominio)
│       │   ├── __init__.py
│       │   ├── auth_schema.py              # LoginInput, RegisterInput, ProfilePatchInput
│       │   ├── listing_schema.py           # ListingCreateInput
│       │   ├── interaction_schema.py       # InteractionCreateInput, InteractionActionInput
│       │   ├── message_schema.py           # MessageCreateInput
│       │   ├── review_schema.py            # ReviewCreateInput
│       │   ├── community_schema.py         # CommunityPostInput
│       │   └── emergency_schema.py         # EmergencyBoardInput
│       ├── repositories/                   # 3. CAPA REPOSITORIES (Acceso a Datos Supabase + Fallback)
│       │   ├── __init__.py
│       │   ├── seed_store.py               # Datos semilla en memoria y mappers de Supabase
│       │   ├── listing_repository.py       # Operaciones CRUD sobre public.listings
│       │   ├── auth_repository.py          # Operaciones sobre public.profiles
│       │   ├── interaction_repository.py   # Operaciones e idempotencia sobre public.interactions
│       │   ├── message_repository.py       # Operaciones sobre public.messages
│       │   ├── review_repository.py        # Operaciones sobre public.reviews
│       │   ├── community_repository.py     # Operaciones sobre public.community_posts
│       │   └── emergency_repository.py     # Operaciones sobre public.emergency_board
│       └── routers/                        # 4. CAPA ROUTERS (Controladores HTTP / Endpoints REST)
│           ├── __init__.py
│           ├── health_router.py            # GET /api/health
│           ├── listings_router.py          # GET, POST /api/app/listings
│           ├── session_router.py           # GET, POST, PUT, PATCH, DELETE /api/app/session
│           ├── interactions_router.py      # GET, POST, PATCH /api/app/interactions
│           ├── messages_router.py          # GET, POST /api/app/messages
│           ├── reviews_router.py           # GET, POST /api/app/reviews
│           ├── notifications_router.py     # GET, PATCH /api/app/notifications
│           ├── community_router.py         # GET, POST /api/app/community
│           └── emergency_router.py         # GET, POST /api/app/emergency
└── supabase/
    └── schema.sql                          # Copia del script SQL para Supabase
```

---

## 🛠️ Paso a paso para levantar y probar tu Backend

### Paso 1: Activar tu entorno virtual (`.venv`) y levantar FastAPI
Desde PowerShell en la carpeta `PlataformaVecinalComunitaria-VECI/backend`:

```powershell
cd PlataformaVecinalComunitaria-VECI\backend
.\.venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
- **API Base:** `http://localhost:8000/api/app/*`
- **Swagger UI ( agrupado por los 8 módulos):** `http://localhost:8000/docs`
- **Healthcheck Supabase:** `http://localhost:8000/api/health`

---

### Paso 2: Probar guardado en Supabase con Postman
1. Abre **Postman** → **Import** → selecciona `PlataformaVecinalComunitaria-VECI/backend/NexoBarrio.postman_collection.json`.
2. Ejecuta **`0. Health Check & Conexión Supabase -> GET Estado del Servidor y Conexión Supabase`** y verifica `"supabaseConnected": true`.
3. Ejecuta los `POST`, `PUT` y `PATCH` de cualquiera de las 8 carpetas y verifica en **Supabase → Table Editor** cómo se insertan y actualizan las filas en tiempo real.
