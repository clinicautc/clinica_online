# Guía de despliegue — Clínica UTC

El mismo código soporta 4 modos de despliegue sin tocar lógica de negocio. Este documento
describe cada uno con los comandos reales del repo (verificados contra `package.json`,
`utc-api/package.json`, `.env.example`, `utc-api/.env.example` y `utc-api/index.js`).

## 1. Variables de entorno

### Frontend (`.env.example`, raíz del repo)

Vite hornea estas variables **en tiempo de build**, no en tiempo de ejecución. Cambiar el
valor después de compilar no tiene efecto — hay que volver a correr el build.

| Variable | Dónde se usa | Para qué sirve | Ejemplo |
|---|---|---|---|
| `VITE_API_BASE_URL` | Frontend (`src/app/lib/api/client.ts`) | URL base que el frontend compilado usa para llamar a la API. Si no se define, cae al fallback `http://localhost:3001/api` (hardcodeado en `client.ts:9`). | `https://tu-backend.onrender.com/api` |

### Backend (`utc-api/.env.example`)

| Variable | Dónde se usa | Para qué sirve | Ejemplo |
|---|---|---|---|
| `DB_HOST` | Backend (`db.js`) | Host de Postgres (Render) | `dpg-xxxxx.render.com` |
| `DB_PORT` | Backend (`db.js`) | Puerto de Postgres | `5432` |
| `DB_NAME` | Backend (`db.js`) | Nombre de la base de datos | `clinica_utc` |
| `DB_USER` | Backend (`db.js`) | Usuario de Postgres | `clinica_utc_user` |
| `DB_PASSWORD` | Backend (`db.js`) | Password de Postgres | `********` |
| `RESEND_API_KEY` | Backend (`services/emailService.js`) | API key de Resend (uno de los dos proveedores de correo — ver `project_dual_email_providers` en memoria) | `re_xxxxxxxxxxxx` |
| `EMAIL_USER` | Backend (`services/emailService.js`) | Cuenta Gmail/SMTP usada por Nodemailer (segundo proveedor) | `clinica.utc@gmail.com` |
| `EMAIL_PASS` | Backend (`services/emailService.js`) | Password/app-password de esa cuenta | `********` |
| `JWT_SECRET` | Backend (`middleware/authMiddleware.js`) | Firma de los access tokens JWT | cadena aleatoria larga |
| `JWT_REFRESH_SECRET` | Backend (`middleware/authMiddleware.js`) | Firma/derivación de refresh tokens | cadena aleatoria larga, distinta de `JWT_SECRET` |
| `JWT_ACCESS_TTL` | Backend (`middleware/authMiddleware.js`) | Tiempo de vida del access token | `15m` |
| `PORT` | Backend (`index.js`) | Puerto en el que escucha Express | `3001` |
| `SERVE_STATIC` | Backend (`index.js`) | Si es `true`, Express sirve el frontend compilado (`../dist`) además de la API (modo servicio único) | `false` |
| `CORS_ORIGINS` | Backend (`index.js`) | Orígenes permitidos por CORS, separados por coma. Si se omite, en dev se permiten `http://localhost:5173,http://localhost:3000` | `https://tu-frontend.vercel.app` |
| `FRONTEND_URL` | Backend (`services/templates/citas.templates.js`, `services/templates/personal.templates.js`) | URL pública del frontend, usada para armar los links ("Accede aquí", "Iniciar sesión") dentro de los correos | `https://tu-frontend.vercel.app` |

## 2. Modo (a) — Local, dos procesos

Frontend (Vite dev server) y backend (Express con `node --watch`) corriendo por separado.

**Comandos:**
```bash
npm run dev            # desde la raíz — levanta ambos con concurrently
# equivalente manual:
npm run dev:backend    # cd utc-api && npm run dev (node --watch index.js; libera el puerto antes via predev)
npm run dev:frontend   # vite
```

**Variables de entorno:**
- `utc-api/.env`: `DB_*`, `JWT_*`, correo (`RESEND_API_KEY` o `EMAIL_USER`/`EMAIL_PASS`), `PORT=3001`,
  `SERVE_STATIC=false` (o sin definir).
- Frontend: no hace falta `.env` — el fallback de `client.ts` apunta a `http://localhost:3001/api`.
- `CORS_ORIGINS`: no hace falta definirla, el default de dev ya cubre `localhost:5173`.

**Checklist post-arranque:**
- [ ] `http://localhost:5173/` carga la SPA.
- [ ] Recargar (F5) una ruta interna, ej. `http://localhost:5173/dashboard` — el dev server de Vite maneja el fallback de SPA automáticamente, no debería dar 404.
- [ ] `curl http://localhost:3001/api/health` responde JSON con `status` y `serverTime`.
- [ ] Probar un registro/pre-registro de usuario de punta a punta (verifica que el correo de verificación realmente salga).

## 3. Modo (b) — Un solo servicio (`SERVE_STATIC=true`)

Express sirve el frontend ya compilado (`dist/`) y la API desde el mismo puerto/origen.

**Comandos:**
```bash
npm run build:single       # desde la raíz — cross-env VITE_API_BASE_URL=/api vite build
cd utc-api
npm start                  # o: npm run dev
```

`build:single` ya fija `VITE_API_BASE_URL=/api` (ruta relativa) por vos — no hace falta setearla a mano.

**Variables de entorno:**
- `utc-api/.env`: `SERVE_STATIC=true`, más `DB_*`, `JWT_*`, correo, `PORT`.
- `CORS_ORIGINS`: no hace falta agregar nada extra — el frontend se sirve desde el mismo origen que la API, así que el navegador nunca hace una petición cross-origin para ese tráfico.
- `FRONTEND_URL`: la misma URL pública del servicio único (para los links en los correos).

**Checklist post-arranque:**
- [ ] `curl http://localhost:PORT/` devuelve el `index.html` de la SPA (no el texto plano de `app.get('/')` en `index.js:89-91` — ese handler queda inalcanzable en este modo porque el catch-all `app.get('*', ...)` de las líneas 83-87 se registra antes y ya intercepta `/`; es el comportamiento real del archivo, no un bug a corregir aquí).
- [ ] Recargar (F5) una ruta interna, ej. `http://localhost:PORT/dashboard` — debe devolver 200 con la SPA, no 404 (verifica que el catch-all esté activo y `SERVE_STATIC=true`).
- [ ] `curl http://localhost:PORT/api/health` responde JSON (confirma que las rutas `/api/*`, montadas antes del bloque `SERVE_STATIC`, siguen resolviendo antes de llegar al catch-all).
- [ ] Probar un registro/pre-registro de usuario de punta a punta.

## 4. Modo (c) — Dos servicios separados

Frontend y backend en hosts distintos (ej. frontend en Vercel/Netlify, backend en Render).

**Comandos:**
```bash
# Frontend — VITE_API_BASE_URL debe apuntar a la URL pública del backend:
npx cross-env VITE_API_BASE_URL=https://tu-backend.onrender.com/api npm run build
# (alternativa: definir VITE_API_BASE_URL en .env antes de correr `npm run build` a secas)

# Backend:
cd utc-api
npm start
```

Servir el contenido de `dist/` con cualquier hosting estático (Vercel, Netlify, Nginx, etc.).

**⚠️ `VITE_API_BASE_URL` se hornea en build-time.** Vite reemplaza `import.meta.env.VITE_API_BASE_URL`
por el valor literal dentro del bundle JS al momento de compilar. Si la URL del backend cambia
después (nuevo dominio, nueva URL de Render, etc.), **hay que volver a correr `npm run build` con el
nuevo valor y redesplegar el `dist/` resultante** — cambiar la variable de entorno en el hosting del
frontend sin recompilar no tiene ningún efecto, porque no existe una lectura en tiempo de ejecución
de esa variable en el bundle ya generado.

**Variables de entorno:**
- Frontend (build-time): `VITE_API_BASE_URL=<URL pública del backend>/api`.
- Backend (`utc-api/.env`): `SERVE_STATIC=false` (o sin definir), `CORS_ORIGINS=<URL pública del frontend>`, `FRONTEND_URL=<URL pública del frontend>`, más `DB_*`, `JWT_*`, correo, `PORT`.

**Checklist post-arranque:**
- [ ] Abrir la URL pública del frontend — carga la SPA.
- [ ] Recargar (F5) una ruta interna del frontend — depende de que el hosting estático tenga configurado un fallback de SPA a `index.html` (esto lo configura el hosting, no este repo).
- [ ] `curl https://tu-backend.onrender.com/api/health` responde JSON.
- [ ] Probar un registro/pre-registro desde el frontend público — si falla con error de red/CORS en la consola del navegador, revisar que el origen del frontend esté en `CORS_ORIGINS` del backend.

## 5. Modo (d) — Túnel

**Recomendación: un solo túnel sobre el modo (b) (servicio único), no un túnel por cada proceso.**

Por qué: en modo (b) el frontend ya está compilado con `VITE_API_BASE_URL=/api` (ruta relativa, mismo
origen). Un único túnel apuntando al servicio único no le cambia nada a esa relación — el navegador
sigue pidiendo `/api/*` al mismo origen que sirvió el HTML, sin importar cuál sea la URL pública que
el túnel le asigne ese día. Si en cambio se tunelizan frontend y backend por separado, cada uno recibe
su propia URL efímera (`https://algo-random.trycloudflare.com`, `https://xxxx.devtunnels.ms`, etc.).
Como se explica en la sección 3, `VITE_API_BASE_URL` queda horneada en el bundle en build-time — así
que cada vez que el túnel del backend cambia de URL (lo cual pasa cada vez que se reinicia el túnel,
salvo que se pague por un subdominio fijo) habría que recompilar el frontend, volver a levantar el
túnel del frontend, y actualizar `CORS_ORIGINS`/`FRONTEND_URL` en el backend. Con un solo túnel sobre
el modo (b) nada de eso hace falta: se recompila una sola vez con `npm run build:single` y el túnel
puede reiniciarse libremente sin volver a tocar el build.

**Comandos:**
```bash
npm run build:single
cd utc-api
# SERVE_STATIC=true en utc-api/.env
npm start
# en otra terminal, exponer el puerto único (ejemplo con un túnel cualquiera):
# devtunnel host -p 3001    (o: cloudflared tunnel --url http://localhost:3001, ngrok http 3001, etc.)
```

**Variables de entorno:**
- Igual que el modo (b): `SERVE_STATIC=true`.
- `FRONTEND_URL`: actualizar a la URL vigente del túnel cada vez que cambie (afecta solo los links dentro de los correos, no requiere recompilar el frontend).
- `CORS_ORIGINS`: no hace falta tocarla — sigue siendo same-origin.

**Checklist post-arranque:**
- [ ] Abrir la URL del túnel — carga la SPA.
- [ ] Recargar (F5) una ruta interna sobre la URL del túnel — 200, no 404.
- [ ] `<url-del-túnel>/api/health` responde JSON.
- [ ] Probar un registro/pre-registro end-to-end y confirmar que el link del correo apunta a la URL del túnel vigente (`FRONTEND_URL` actualizada).

## 6. Tabla comparativa

| | (a) Local | (b) Servicio único | (c) Dos servicios | (d) Túnel |
|---|---|---|---|---|
| Build usado | ninguno (`vite` dev server) | `npm run build:single` | `npm run build` (con `VITE_API_BASE_URL` seteada) | `npm run build:single` |
| `SERVE_STATIC` | `false`/sin definir | `true` | `false`/sin definir | `true` |
| `VITE_API_BASE_URL` | sin definir (fallback `localhost:3001/api`) | relativo (`/api`) | absoluto (URL del backend) | relativo (`/api`) |
| `CORS_ORIGINS` necesario | no (default de dev alcanza) | no (same-origin) | sí (origen del frontend) | no (same-origin) |
| ¿Recompilar frontend al cambiar de URL/entorno? | no | no | **sí**, siempre que cambie la URL del backend | no |

## 7. Errores comunes

- **500 en pre-registro (`Pre-Registro`)**: `authController.js` captura cualquier falla del envío de
  correo (`notificationService.notificarCodigoVerificacion`) y responde un 500 genérico
  (`authController.js:206-208`). La causa más común es `RESEND_API_KEY` faltante/inválida o el dominio
  remitente no verificado en Resend (`emailService.js:11,96`). Revisar los logs del backend — el
  mensaje real del error de Resend queda en `console.error`, no en la respuesta HTTP.
- **404 al recargar una ruta interna de la SPA (modo servicio único/túnel)**: pasa si `SERVE_STATIC`
  no está en `'true'` (el bloque de `index.js:83-87` ni se registra) o si el catch-all `app.get('*', ...)`
  fue removido/movido. Verificar con el checklist de "recargar ruta interna" de la sección 3.
- **Errores de CORS en el navegador (modo dos servicios/frontend tuneleado por separado)**: el origen
  público del frontend no está en `CORS_ORIGINS` del backend (`index.js:36-41`). Agregar el origen
  exacto (protocolo + host, sin path) y reiniciar el backend — `CORS_ORIGINS` se lee una sola vez al
  arrancar el proceso.
