# Splash VECI

Integrado en la entrada `/`, sobre `origin/main` en el commit `7478b2c`.
Rama de trabajo: `codex/alan-aguilera`.

## Verlo localmente

Requisitos y configuración general: consulta el README principal del equipo.

```sh
npm ci
npm run dev
```

Abre `http://localhost:3000` (o el puerto indicado por `PORT`). Recarga la página
para repetir la animación. El splash se puede revisar sin iniciar el backend;
las funciones con datos reales de la app sí usan el backend del equipo.

La intro también vuelve a reproducirse al regresar a `/` con Atrás o Adelante,
al restaurar la página desde la caché de navegación y al entrar de nuevo a esa
ruta. No depende de borrar cookies, sesión ni preferencias de onboarding.

La secuencia dura aproximadamente 3,35 segundos: entra la V, se dibuja la casa,
aparecen las ventanas y los destellos, y se presentan las letras VECI y el mensaje.
En escritorio hay una respuesta suave al puntero. El botón «Entrar» permite omitirla.
Con «reducir movimiento» la entrada dura aproximadamente medio segundo.

Al terminar se conserva el flujo existente: onboarding en la primera visita;
mapa cuando el onboarding ya está completado, conservando el tour solicitado
mediante `?tour=1` o la preferencia `nexobarrio-show-tour`. La salida depende del final de
la animación; se retiró el temporizador anterior de 1,2 segundos.

## Archivos

- `src/components/onboarding/SplashScreen.tsx`: secuencia GSAP y contenido.
- `src/components/onboarding/SplashScreen.module.css`: fondo y ajustes adaptables.
- `src/components/onboarding/veci-logo-paths.ts`: contornos del logo proporcionado,
  separados para mover símbolo, ventanas, destellos y letras sin imágenes externas.
- `src/app/(frontend)/NeighborhoodApp.tsx`: conexión con el flujo de entrada.

## Comprobación

```sh
npm run build
npm exec -- tsc --noEmit
```

Se revisó la versión de producción en escritorio (1440×900), móvil (390×844 y
320×568) y horizontal (844×390), además de movimiento reducido, omisión de la
intro y navegación al onboarding y al mapa. Las comprobaciones de animación
usan respuestas de API simuladas; no modifican el backend ni los datos reales.
