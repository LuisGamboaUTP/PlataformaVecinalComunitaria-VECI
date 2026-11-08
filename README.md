# 🏘️ NexoBarrio — Plataforma Vecinal Comunitaria
**Reto Hackatón UTP + El Comercio · Grupo 22 (Innovatrux)**

Plataforma móvil y web de Economía de Proximidad, Economía Solidaria (*Trueque Inteligente*, *Biblioteca de Herramientas*, *Banco de Tiempo*) y Organización Comunitaria / Emergencias vecinales.

---

## ⚡ Inicio Rápido (En 2 Terminales)

### 📌 Paso 0: Clonar y ubicarse en la rama
```bash
git clone https://github.com/LuisGamboaUTP/PlataformaVecinalComunitaria-VECI.git
cd PlataformaVecinalComunitaria-VECI
git checkout rol-1-backend
```

---

### 🖥️ Terminal 1: Backend (FastAPI + Supabase)
```powershell
cd PlataformaVecinalComunitaria-VECI\backend

# Crear y activar entorno virtual (si no lo tienes):
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Instalar dependencias:
pip install -r requirements.txt

# Iniciar servidor FastAPI:
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
* **API Base:** `http://localhost:8000/api/app/*`
* **Swagger UI interactivo:** [http://localhost:8000/docs](http://localhost:8000/docs)
* **Healthcheck:** [http://localhost:8000/api/health](http://localhost:8000/api/health)

---

### 📱 Terminal 2: Frontend (Next.js + React + Leaflet)
```powershell
cd PlataformaVecinalComunitaria-VECI

# Instalar paquetes:
npm install

# Iniciar frontend de desarrollo:
npm run dev
```
Abre en tu navegador: [http://localhost:3000](http://localhost:3000) (o activa la vista responsive móvil con `F12` > Modo Dispositivo).

---

## 🧪 Guía de Prueba Rápida (Paso a Paso)

Para probar todas las funcionalidades implementadas en el flujo completo:

### 1. Registro Inteligente con DNI / CE (Autocompletado en Tiempo Real)
1. Ve a la pantalla o modal de **Registro / Iniciar Sesión** (icono de perfil arriba a la derecha).
2. Selecciona **DNI (Perú)** como primer campo.
3. Escribe cualquier DNI de 8 dígitos (ejemplo: `72345678` o `45678912`):
   * ✨ **Magia:** El sistema autocompleta al instante el nombre del vecino y su zona comunitaria.
4. Escribe una contraseña y dale a **"Crear cuenta vecinal"**.
   * Se guarda en Supabase/FastAPI y te otorga el sello `✓ Vecino verificado (DNI)`.
5. *(Opcional)*: Prueba cerrar sesión e ingresar colocando tu número de DNI directamente en el campo de usuario.

---

### 2. Mapa Dual Mobile Híbrido (GPS Real + Barrio Demo)
1. Toca la pestaña inferior **Mapa**:
2. En la parte superior izquierda tienes el conmutador dinámico:
   * **`[ 📍 GPS en vivo ]`**: Carga el mapa real con OpenStreetMap (sin marcas de agua ni API keys) con tu ubicación GPS en tiempo real y el botón flotante circular para centrarte.
   * **`[ 🏙️ Barrio Demo ]`**: Muestra el mapa vectorial ilustrado del Centro Cívico (Av. Arequipa, Paseo Colón, Parque de la Exposición).
3. **Toca cualquier marcador (pin) del mapa**:
   * Se desliza suavemente desde abajo una tarjeta compacta con la información, distancia, sello de confianza vecinal y el botón *"Ver ficha completa"*.

---

### 3. Accesibilidad WCAG: Lectura de Anuncios por Voz (TTS)
1. Toca **"Ver ficha completa"** en cualquier publicación.
2. Toca el botón verde **🔊 Escuchar ficha (Voz)**:
   * El navegador leerá en voz alta y clara el título, categoría y descripción de la solución vecinal.
   * Toca **⏹ Silenciar** en cualquier momento para pausar la reproducción.

---

### 4. Publicar Solución o Necesidad (Persistencia en Backend)
1. Toca el botón central naranja **"+" (Publicar)** en la barra inferior.
2. Selecciona una modalidad (*Servicio*, *Préstamo*, *Trueque*, *Regalo*, *Ayuda*).
3. Completa los campos:
   * **Título:** Ej. *«Presto escalera de aluminio 3 metros»*
   * **Descripción:** Ej. *«Escalera de 6 pasos en buen estado para arreglos del hogar.»*
   * **Categoría:** *Hogar* o *Reparaciones*
   * **Costo orientativo:** *Préstamo S/ 0*
4. Dale a **"Publicar ahora"**:
   * Se envía a FastAPI (`/api/app/listings`), se persiste en base de datos y aparece de inmediato como un nuevo marcador en el mapa.

---

### 5. Acuerdos Vecinales y Ciclo de Vida en Actividad
1. En la ficha de cualquier servicio, dale clic a **"Contactar / Solicitar"**.
2. Ve a la pestaña inferior **Actividad**:
   * Verás el acuerdo en estado **Pendiente** con botones para **Aceptar**, **Completar** y calificar con estrellas al vecino.

---

## 📂 Arquitectura del Proyecto

```text
PlataformaVecinalComunitaria-VECI/
├── backend/                             # Backend oficial en FastAPI + Supabase
│   ├── app/                            # Capas limpias (core, repositories, routers, schemas)
│   ├── .env                            # Credenciales privadas de Supabase
│   ├── NexoBarrio.postman_collection.json # Colección de pruebas para Postman
│   ├── schema.sql                      # Esquema de 7 tablas de Supabase
│   └── requirements.txt                # Dependencias Python
├── src/                                # Frontend Next.js móvil y responsivo
│   ├── components/                     # Componentes modulares (map, modals, publish, activity, cards...)
│   ├── lib/                            # Clientes de API, store local y utilidades
│   └── app/(frontend)/                 # Enrutador App de Next.js y estilos globales
└── README.md                           # Guía completa de ejecución y pruebas
```

---

## 📋 Reglas Generales del Reto Hackatón
1. **Cero jerga interna de prompts en pantalla:**
   * Textos en español natural (*«Círculos y Muro Vecinal»*, *«Biblioteca de Herramientas»*, *«Trueque Inteligente»*, *«Banco de Tiempo»*).
2. **Guion de Demostración para el Jurado:**
   * Registro con DNI autocompletado ➔ Mapa dual con pines interactivos ➔ Ficha con lectura accesible por voz ➔ Publicación vecinal ➔ Ciclo de acuerdo completado con reseña comunitaria.
