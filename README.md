# 🏘️ NexoBarrio — Plataforma Vecinal Comunitaria
**Reto Hackatón UTP + El Comercio · Grupo 22 (Innovatrux)**

Plataforma de Economía de Proximidad, Economía Solidaria (Trueque Inteligente, Biblioteca de Herramientas, Banco de Tiempo) y Organización Comunitaria / Emergencias.

---

## 🚀 Inicio Rápido

### 1. Backend (FastAPI + Supabase)
En una terminal PowerShell:
```powershell
cd PlataformaVecinalComunitaria-VECI\backend
.\.venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
- API Base: `http://localhost:8000/api/app/*`
- Swagger UI interactivo: `http://localhost:8000/docs`
- Healthcheck: `http://localhost:8000/api/health`

### 2. Frontend (Next.js + React + GSAP Mobile)
En otra terminal:
```powershell
cd PlataformaVecinalComunitaria-VECI
npm install
npm run dev
```
Abre en tu navegador `http://localhost:3000`.

---

## 📂 Arquitectura del Proyecto

```text
PlataformaVecinalComunitaria-VECI/
├── backend/                             # Backend oficial en FastAPI + Supabase
│   ├── .venv/                          # Entorno virtual de Python
│   ├── .env                            # Credenciales privadas de Supabase
│   ├── NexoBarrio.postman_collection.json # Colección Postman con todas las APIs
│   ├── schema.sql                      # Esquema de 7 tablas para Supabase
│   └── app/                            # Arquitectura limpia en capas (core, schemas, repositories, routers)
├── src/                                # Frontend Next.js móvil y responsivo
│   ├── components/                     # Componentes modulares (activity, cards, community, explore, map, modals, onboarding, publish)
│   └── app/(frontend)/                 # Páginas y layout
├── TAREAS_BACKEND.md                   # Guía técnica exclusiva de Backend
└── TAREAS_FRONTEND.md                  # Guía técnica exclusiva de Frontend
```

---

## 📋 Reglas Generales del Reto
1. **Cero jerga interna del prompt en la pantalla:**
   - Prohibido mostrar códigos como `Escenario A`, `VECI-TRQ-16`, `Módulo 23`.
   - Textos en español natural (*«Círculos y Muro Vecinal»*, *«Pedidos y Servicios en Grupo»*, *«Trueque Inteligente entre 3 vecinos»*, *«Biblioteca de Herramientas»*).
2. **Guion de Demostración en Vivo para el Jurado:**
   - Onboarding ➔ Mapa de Centro Cívico con Visto Bueno Vecinal ➔ Publicación en 3 clics ➔ Trueque Triangular ➔ Interacción entre dos cuentas (Chat y Reseña ★) ➔ Tablero de Emergencias y Comunidad Activa.
