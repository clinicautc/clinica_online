# Cambios realizados — sesión del 21 de junio de 2026

> Documento de referencia técnica. Escrito para que cualquier otra IA (o el propio Enrique)
> pueda retomar este proyecto sin tener que releer todo el historial de conversación.
> El proyecto cambió de fondo en esta sesión: pasó de un monolito sin autenticación real
> a un backend modular con JWT y un frontend con API centralizada.
>
> **No se hizo ningún `git commit`.** Todo lo descrito aquí está en el working tree,
> pendiente de revisión. Ver el nombre de commit sugerido al final de este documento.
>
> **Este documento es solo para referencia/lectura — no se commitea ni se borra nada
> a partir de él.**

---

## 0. Punto de partida

Esta sesión continuó dos auditorías de solo-lectura previas (2026-06-19 y la mañana del
2026-06-21) que identificaron deuda técnica y vulnerabilidades reales:

- Autenticación basada en un header HTTP `email` sin firmar (cualquiera podía
  suplantar a cualquier usuario, incluido `master`, sin contraseña).
- Endpoints completamente abiertos que exponían historiales clínicos, citas y
  hashes de contraseña de toda la tabla `usuarios`.
- Un bug funcional real: el visor de fisioterapia no podía auto-rellenar
  formularios guardados (ruta duplicada/mal apuntada).
- `index.js` como monolito de ~1500 líneas con ~60 rutas inline.
- `api.ts` centralizado solo para login; ~80 llamadas `fetch()` directas repartidas
  en 26 archivos del frontend.
- Código muerto: páginas huérfanas, ~33 componentes de un kit de UI nunca usado,
  documentación de un esquema Supabase abandonado, dependencias npm sin uso.

A partir de ahí, el usuario pidió **implementar** la evolución (no solo diagnosticarla),
en 5 fases, cada una verificada antes de pasar a la siguiente, seguido de una segunda
pasada de limpieza más profunda y un intento de ajuste de escala visual (revertido).

---

## 1. Fase A — Seguridad y bugs, sin tocar el modelo de autenticación

### 1.1 Bug de fisioterapia (corregido de verdad)

`utc-api/index.js` tenía dos definiciones de la misma ruta
`GET /api/historiales-nutricion/detalle/:appointmentId` (una de ellas con el comentario
"FISIOTERAPIA" pero apuntando, por error de copy-paste, a la tabla de nutrición). La
segunda definición se corrigió para ser de verdad
`GET /api/historiales-fisioterapia/detalle/:appointmentId` consultando
`historiales_fisioterapia`. En la Fase D, esto terminó viviendo en
`utc-api/controllers/historialesController.js`, funciones `getNutricionDetalle()` y
`getFisioterapiaDetalle()` (ver tabla completa en la sección 4).

### 1.2 Ruta muerta eliminada

`GET /api/auth/validate-session` estaba definida dos veces: una en
`utc-api/routes/authRoutes.js` (la que de verdad responde, porque ese router se monta
antes) y otra, inalcanzable, directamente en `index.js`. Se eliminó la copia muerta de
`index.js`.

### 1.3 Pool de Postgres consolidado

`utc-api/middleware/authMiddleware.js` y `utc-api/routes/authRoutes.js` creaban cada
uno su propio `new Pool({...})` con las mismas variables de entorno. Ambos pasaron a
hacer `const pool = require('../db')`, usando la única instancia que ya existía en
`utc-api/db.js` (y que `index.js`/`emailService.js` ya usaban correctamente).

### 1.4 Endpoints que estaban completamente abiertos (sin ningún middleware) y se protegieron

Todos en `utc-api/index.js` en ese momento (antes de la Fase D); hoy viven en los
controladores listados en la sección 4:

| Endpoint | Protección añadida |
|---|---|
| `GET /api/usuarios` | `requireAuth, requireRole(['admin','master'])` |
| `GET /api/usuarios/:id` | `requireAuth` |
| `GET /api/citas` | `requireAuth` |
| `GET /api/citas/paciente/:id` | `requireAuth` + verificación: si el rol es `paciente`, solo puede ver las suyas |
| `GET /api/citas/disponibilidad` | `requireAuth` |
| `GET /api/historiales-nutricion/paciente/:id` | `requireAuth, requireRole(['practicante','admin','master'])` |
| `GET /api/historiales-fisioterapia/paciente/:id` | `requireAuth, requireRole(['practicante','admin','master'])` |
| `GET /api/historiales/verificar/:pacienteId/:area` | `requireAuth, requireRole(['practicante','admin','master'])` |
| `PUT /api/historiales/:id` | se le añadió `requireRole(['practicante','admin','master'])` (ya tenía `requireAuth`) |
| `POST /api/historiales` | `requireAuth, requireRole(['practicante','admin','master'])` |
| `POST /api/practicantes` | `requireAuth, requireRole(['admin','master'])` |
| `PUT /api/practicantes/:id` | `requireAuth, requireRole(['admin','master'])` |
| `GET /api/logs` | `requireAuth` (sin restricción de rol — ver razón en 1.6) |
| `GET/POST/PUT /api/notas-evolucion*` | se les añadió `requireRole(['practicante','admin','master'])` (ya tenían `requireAuth`) |

### 1.5 IDOR cerrados

- `PUT /api/citas/:id`: se le añadió `canModifyAppointment` (el mismo middleware que ya
  protegía `DELETE` sobre el mismo recurso, pero que no estaba en `PUT`).
- `POST /api/recomendaciones`: `creado_por_id`/`creado_por_nombre` ya no se toman del
  body — se toman siempre de `req.user` (autenticado), para que nadie pueda adjudicarse
  otra autoría.
- `GET /api/recomendaciones/paciente/:id`: si el rol es `paciente`, se verifica que el
  `:id` de la URL sea el suyo.

### 1.6 Por qué `GET /api/logs` no quedó restringido por rol

Se descubrió que `StatisticsPage.tsx` (accesible para `practicante`, `admin` y `master`
según `routes.tsx`) llama a este endpoint. Restringirlo solo a `admin`/`master` habría
roto esa pantalla para los practicantes que hoy sí la usan. Se dejó solo con
`requireAuth` (cierra el hueco de "cualquiera sin sesión", que era el problema real).

### 1.7 CORS

`app.use(cors())` (abierto a cualquier origen) se reemplazó por una lista explícita
leída de `process.env.CORS_ORIGINS` (coma-separado). Si la variable no existe, el
default en dev es `http://localhost:5173,http://localhost:3000`.

### 1.8 Empaquetado

- `react`, `react-dom`, `typescript` se declararon explícitamente en el `package.json`
  raíz (antes compilaban "por accidente" vía dependencias transitivas de
  `react-router-dom`, `@mui/material`, etc.). Versiones tomadas de las que ya estaban
  resueltas en `package-lock.json` (`18.3.1` para react/react-dom).
- Se añadió `src/vite-env.d.ts` para declarar el tipo de `import.meta.env` (necesario
  para `VITE_API_BASE_URL`, usado luego en la Fase C).
- Se eliminó la dependencia fantasma `"node": "^26.3.0"` de `utc-api/package.json`
  (el paquete npm literal llamado `node`, no el runtime).

### 1.9 Frontend — header `email` añadido donde faltaba

Antes de existir el cliente centralizado (Fase C), hubo que añadir manualmente el
header `email` a cada `fetch()` que apuntaba a un endpoint recién protegido. Archivos
tocados en este paso (todos en `src/app/`):

`components/AppointmentManager.tsx`, `components/PatientList.tsx`,
`components/PractitionerManagement.tsx`, `components/AppointmentForm.tsx`,
`components/MedicalHistoryViewer.tsx`, `pages/StatisticsPage.tsx`,
`pages/MasterAdminDashboard.tsx`, `pages/NutritionAdminDashboard.tsx`,
`pages/PhysiotherapyAdminDashboard.tsx`, `pages/NutritionPractitionerDashboard.tsx`,
`pages/PhysiotherapyPractitionerDashboard.tsx`, `pages/PatientDashboard.tsx`,
`pages/PhysiotherapyMasterForm.tsx`.

**Importante:** al revisar estos archivos se confirmó que varias llamadas **ya estaban
silenciosamente rotas antes de esta sesión**, porque el endpoint de destino ya exigía
`requireAuth`/`requireRole` desde antes, pero el frontend nunca mandaba el header:
- Publicar un comunicado (`POST /api/notas_universitarias`) desde
  `NutritionAdminDashboard.tsx` y `PhysiotherapyAdminDashboard.tsx`.
- Cancelar/marcar como completada una cita y eliminarla desde
  `AppointmentManager.tsx` (las tres acciones: GET, PUT, DELETE).
- Eliminar un paciente desde `PatientList.tsx` y eliminar un practicante desde
  `PractitionerManagement.tsx` (ambos `DELETE`).

Estas quedaron arregladas como parte del mismo cambio.

### 1.10 Bug colateral durante el arranque (no relacionado con seguridad, encontrado al verificar)

Al quitar la dependencia fantasma `"node"` (1.8) mientras `node --watch index.js` seguía
corriendo, el proceso se rompió con `Error: spawn ...node_modules\node\bin\node.exe
ENOENT`. Causa: ese paquete fantasma instalaba un binario de Node real en
`node_modules/node/bin/`, y el watcher lo había tomado como su intérprete. Se resolvió
matando los procesos, limpiando `utc-api/node_modules` y reinstalando.

---

## 2. Fase B — Migración completa a JWT

### 2.1 Backend — piezas nuevas

| Archivo | Qué se añadió |
|---|---|
| `utc-api/migrations/001_refresh_tokens.sql` | Tabla `refresh_tokens` (`usuario_id`, `token_hash` SHA-256, `expira_en`, `revocado`, `creado_en`). **Ya se ejecutó** contra la base real de Render (no es solo un script sin aplicar). |
| `utc-api/middleware/authMiddleware.js` | Nuevas funciones: `signAccessToken(usuario)`, `generateRefreshToken()`, `hashToken(token)`, y `verifyToken(req,res,next)` (el middleware real). |
| `utc-api/.env` / `.env.example` | Variables nuevas: `JWT_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_TTL` (15m por defecto). |

`requireAuth` es ahora **un alias de `verifyToken`** (`const requireAuth = verifyToken;`),
así que ninguna ruta de los controllers/routers tuvo que cambiar de firma.

`verifyToken` acepta `Authorization: Bearer <JWT>` **y, de forma temporal, el header
legado `email`** como fallback (lee la tabla `usuarios` directamente, igual que el
`requireAuth` viejo). Ese fallback existía para no romper nada mientras la Fase C
migraba el frontend. **La Fase C ya migró todo** — ver sección 8, este fallback debería
poder retirarse pero no se ha hecho.

Access token: JWT firmado con `JWT_SECRET`, payload `{sub, nombre, email, rol, area}`,
expira en 15 minutos. Refresh token: string aleatorio opaco (no JWT) de 48 bytes, se
guarda **hasheado con SHA-256** en `refresh_tokens`, expira en 14 días, y se **rota**
en cada uso (`POST /api/auth/refresh` revoca el que se usó y emite uno nuevo).

### 2.2 Endpoints nuevos/cambiados

- `POST /api/auth/login`: además del usuario, ahora devuelve `{ accessToken, refreshToken }`.
- `POST /api/auth/refresh` (nuevo): recibe `{ refreshToken }`, devuelve
  `{ accessToken, refreshToken, user }` nuevos.
- `POST /api/auth/logout` (nuevo): recibe `{ refreshToken }`, lo revoca. Idempotente.

### 2.3 Hallazgo de seguridad cerrado de paso (mismo bug que ya se conocía, en más sitios)

Al tocar `authController.js` (entonces todavía dentro de `routes/authRoutes.js`, antes
de la Fase D) se confirmó que varios endpoints devolvían el **hash bcrypt de la
contraseña** en el JSON de respuesta, porque hacían `SELECT *`/`RETURNING *` sobre
`usuarios` sin excluir la columna `password`:

- `POST /api/auth/login` (las dos rutas internas: contraseña migrada y contraseña ya en bcrypt)
- `POST /api/auth/verify-and-register`
- `GET /api/usuarios`, `GET /api/usuarios/:id`, `GET /api/practicantes`
- `PUT /api/usuarios/:id` (cambio de estado)
- `POST /api/practicantes` (alta de practicante)

Se corrigió en todos los casos: o bien con una lista explícita de columnas
(`USUARIO_COLUMNAS_SEGURAS` en `usuariosController.js`, reutilizada por
`practicantesController.js`), o bien destructurando `const { password, ...resto } = fila`
antes de responder.

### 2.4 Bug de UX corregido de paso

`src/app/pages/Login.tsx`: `handleSubmit` hacía `const success = await login(...)` sin
`try/catch`. Como `AuthContext.login()` rechaza la promesa cuando las credenciales son
incorrectas, esa línea lanzaba una excepción no capturada y el usuario nunca veía el
mensaje de error (el `else { setError(...) }` nunca se ejecutaba). Se envolvió la
llamada en `try/catch`.

### 2.5 Frontend — `AuthContext.tsx`

Ya no guarda el usuario completo en `localStorage`. Guarda solo el refresh token, bajo
la llave **`utc_refresh_token`** (antes era `utc_current_user`, que guardaba el objeto
de usuario entero). El access token vive en memoria (estado de React), nunca en
`localStorage`. Al cargar la app, en vez de `validateSession(email)` llama a
`bootstrapSession()` (función nueva, definida en `src/app/lib/api/client.ts`, ver
Fase C) para intercambiar el refresh token guardado por una sesión nueva.

### 2.6 Por qué el JWT se diseñó así (y no de otra forma)

**Por qué dos tokens (access + refresh) y no uno solo.** Un solo token de larga
duración es cómodo pero peligroso: si alguien lo roba (XSS, un log con la petición
completa, una extensión de navegador maliciosa), lo puede usar durante todo el tiempo
que dure. Con dos tokens, el que viaja en cada petición (`accessToken`) dura solo 15
minutos — si se filtra, la ventana de uso es corta. El que vive más tiempo
(`refreshToken`, 14 días) casi no viaja: solo se usa contra un único endpoint
(`/api/auth/refresh`) y se puede revocar en el servidor en cualquier momento. Es el
patrón estándar de la industria (OAuth2/OIDC lo usan igual), no algo inventado para
este proyecto.

**Por qué el access token es un JWT pero el refresh token NO lo es.** El access token
necesita ser auto-verificable sin tocar la base de datos en cada petición — por eso es
un JWT firmado: `verifyToken` solo comprueba la firma y la fecha de expiración, sin
hacer ningún `SELECT`. Esa es la mejora real de rendimiento frente al `requireAuth`
viejo, que hacía una consulta a `usuarios` en cada petición protegida. El refresh
token, en cambio, necesita poder **revocarse antes de su expiración** (al hacer logout,
o si se detecta un robo) — un JWT no se puede "desfirmar" una vez emitido, así que un
refresh token como JWT sería imposible de invalidar sin mantener una lista negra
aparte. Por eso el refresh token es simplemente una cadena aleatoria opaca
(`crypto.randomBytes(48)`) que solo sirve como llave de búsqueda contra la tabla
`refresh_tokens` — revocarlo es tan simple como poner `revocado = true` en esa fila.

**Por qué el refresh token se guarda hasheado (SHA-256) y no en texto plano.** Es el
mismo razonamiento que ya se aplica a las contraseñas con bcrypt: si algún día la base
de datos se lee sin autorización (un backup mal guardado, una inyección, un acceso
indebido), una tabla con los refresh tokens en texto plano le regalaría a quien la lea
una sesión activa de cualquier usuario, sin necesitar contraseña ni el secreto JWT. Con
el hash guardado, ese mismo escenario no le da nada usable: para autenticarse necesita
el token original, que solo existe en el navegador del usuario. No se usó bcrypt aquí
(como sí se usa para contraseñas) porque el refresh token ya es aleatorio y de alta
entropía (48 bytes) — no hace falta un hash lento con sal pensado para resistir fuerza
bruta sobre contraseñas cortas elegidas por personas; un hash rápido (SHA-256) ya es
suficiente y no penaliza la latencia de cada `/refresh`.

**Por qué se rota el refresh token en cada uso (en vez de reusar el mismo durante 14
días).** Si un refresh token se usa una sola vez y luego se marca como revocado e
inmediatamente se emite uno nuevo, un token robado solo puede usarse **una vez** antes
de quedar inútil — y si el atacante lo usa antes que el usuario legítimo, el usuario
legítimo va a recibir un error de "sesión expirada" la próxima vez que intente refrescar
con el suyo (porque ya fue revocado), lo cual es una señal detectable de que algo se
robó. Sin rotación, un token robado serviría durante los 14 días completos sin que
nadie se entere.

**Por qué `requireAuth` se dejó como alias de `verifyToken`, en vez de borrar
`requireAuth` y poner `verifyToken` en cada ruta.** Para que la Fase B (backend) se
pudiera hacer y probar de forma aislada, sin tocar al mismo tiempo los ~80 `fetch()` del
frontend (eso era trabajo de la Fase C, todavía no hecha en ese momento). Si en la Fase
B se hubiera reemplazado `requireAuth` por algo que **solo** acepta
`Authorization: Bearer`, toda la aplicación se habría roto de inmediato, porque en ese
momento todo el frontend seguía mandando el header `email`. El alias permitió cambiar el
backend primero, con cero riesgo, y migrar el frontend después con calma — exactamente
la idea de "migración gradual" que ya estaba en el plan original antes de empezar a
programar.

**Por qué el fallback al header `email` se mantuvo dentro de `verifyToken` en vez de
hacer un segundo middleware aparte.** Para que cada ruta sólo tuviera que declarar
`requireAuth` una vez (igual que antes) y que el propio middleware decidiera, petición
por petición, si lo que llegó es un Bearer token o el header viejo. Esto evitó tener que
tocar la lista de middlewares de cada una de las ~40 rutas dos veces (una en la Fase B,
otra al "apagar" el fallback más adelante) — alcanza con borrar el bloque de fallback
dentro de una sola función cuando ya no haga falta (ver sección 8).

**Por qué la tabla `refresh_tokens` tiene exactamente estas columnas:**

```sql
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id serial PRIMARY KEY,
  usuario_id integer NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expira_en timestamptz NOT NULL,
  revocado boolean NOT NULL DEFAULT false,
  creado_en timestamptz NOT NULL DEFAULT now()
);
```

- `usuario_id ... REFERENCES usuarios(id) ON DELETE CASCADE`: para saber de quién es
  cada token (y poder, por ejemplo, revocar todas las sesiones de un usuario de un
  golpe). El `ON DELETE CASCADE` es para que, si algún día se borra un usuario, sus
  tokens no se queden huérfanos en la tabla — se limpian solos.
- `token_hash text NOT NULL UNIQUE`: es la columna que de verdad se consulta en cada
  `/refresh` (`WHERE token_hash = $1`). `UNIQUE` además evita, por construcción, que dos
  filas distintas terminen apuntando al mismo hash (no debería poder pasar nunca, pero
  la base de datos lo garantiza en vez de confiar en que el código nunca tenga un bug).
- `expira_en timestamptz NOT NULL`: para que la verificación de validez
  (`AND expira_en > NOW()`) se haga en la propia consulta SQL, no en JavaScript después
  de traer la fila — más simple y no hay forma de "olvidarse" de checar la fecha.
- `revocado boolean NOT NULL DEFAULT false`: se eligió marcar como revocado en vez de
  borrar la fila al hacer logout o al rotar, porque conservar la fila deja rastro de
  cuándo se cerró cada sesión (útil si algún día se quiere auditar actividad de cuentas,
  ver la idea de bitácora en `docs/AUDITORIA_INTEGRAL_2026.md`). Borrar habría sido más
  simple de implementar pero pierde esa trazabilidad sin necesidad.
- `creado_en timestamptz NOT NULL DEFAULT now()`: sirve de referencia para saber cuándo
  se emitió cada token, sin tener que calcularlo restando `expira_en` menos 14 días.

---

## 3. Fase C — Centralización completa del frontend

### 3.1 Qué reemplazó a qué

`src/app/lib/api.ts` (un solo archivo, ~300 líneas) fue **eliminado** y reemplazado por
el directorio `src/app/lib/api/`:

| Archivo nuevo | Contenido |
|---|---|
| `src/app/lib/api/client.ts` | `API_BASE_URL` (lee `import.meta.env.VITE_API_BASE_URL`), `apiFetch()` (fetch crudo + Authorization automático + refresh-y-reintento en 401), `apiFetchJson()` (igual, pero ya parsea JSON y lanza `Error` si falla), `bootstrapSession()`, `clearSession()`, `getAccessToken/setAccessToken`, `getRefreshToken/setRefreshToken`. |
| `src/app/lib/api/authAPI.ts` | `login`, `sendRegisterCode`, `verifyRegister`, `forgotPassword`, `verifyResetCode`, `resetPassword`, `resendCode`, `logout`. Todo con `fetch()` directo (sin `apiFetch`) porque son endpoints públicos, sin token que adjuntar. |
| `src/app/lib/api/usuariosAPI.ts` | `getAll`, `getById`, `updateProfile`, `updateStatus`, `remove`. |
| `src/app/lib/api/citasAPI.ts` | `getAll`, `getByPaciente`, `getDisponibilidad`, `create`, `update`, `remove`, `asignar`. |
| `src/app/lib/api/historialesAPI.ts` | `getAll`, `verificarRecurrencia`, `updateGenerico`, `create`, `guardar` (POST/PUT condicional), `getNutricionDetalle`, `getFisioterapiaDetalle`, `getNutricionByPaciente`, `getFisioterapiaByPaciente`. |
| `src/app/lib/api/notasAPI.ts` | `getEvolucion`, `createEvolucion`, `updateEvolucion`, `getUniversitarias`, `createUniversitaria`, `responderUniversitaria`. |
| `src/app/lib/api/practicantesAPI.ts` | `getAll`, `create`, `updateStatus`, `remove`. |
| `src/app/lib/api/recomendacionesAPI.ts` | `getByPaciente`, `create`. |
| `src/app/lib/api/metricasAPI.ts` | `getDashboardStats`, `getLogs`. |
| `src/app/lib/api/index.ts` | Barrel — re-exporta todo lo anterior, para que `import ... from '../lib/api'` siga funcionando igual que antes en los archivos que ya lo usaban (`AuthContext.tsx`, `Login.tsx`, `Register.tsx`, `ForgotPassword.tsx`). |

También nuevo: `src/vite-env.d.ts` (declara `ImportMetaEnv.VITE_API_BASE_URL`).

### 3.2 Mapa completo: de qué archivo, a qué módulo (frontend)

Para cada archivo, qué llamada tenía y a qué función del nuevo `lib/api/` se migró.
Cuando dice "`apiFetch` crudo" es porque ese caso necesita inspeccionar el `Response`
directamente (un código de estado específico como 409, o un 404 que es un estado válido
y no un error) y por eso no usa el `apiFetchJson` de las demás llamadas.

| Archivo (`src/app/...`) | Llamada original | Migrado a |
|---|---|---|
| `components/PatientList.tsx` | `GET endpoints.usuarios` | `usuariosAPI.getAll()` |
| | `DELETE /api/usuarios/:id` | `usuariosAPI.remove(id)` |
| `components/PractitionerManagement.tsx` | `GET /api/usuarios` | `usuariosAPI.getAll()` |
| | `PUT /api/usuarios/:id` (estado) | `usuariosAPI.updateStatus(id, estado)` |
| | `DELETE /api/usuarios/:id` | `usuariosAPI.remove(id)` |
| `components/AppointmentManager.tsx` | `GET /api/citas` | `citasAPI.getAll()` |
| | `PUT /api/citas/:id` | `citasAPI.update(id, data)` |
| | `DELETE /api/citas/:id` | `citasAPI.remove(id)` |
| `components/AppointmentForm.tsx` | `GET /api/citas/disponibilidad` | `citasAPI.getDisponibilidad(fecha, tipo)` |
| | `POST`/`PUT /api/citas` (agendar/reagendar) | **`apiFetch` crudo** (necesita distinguir el 409 de horario ocupado) |
| `components/MedicalHistoryViewer.tsx` | `GET /api/usuarios/:id` | **`apiFetch` crudo** (un 404 aquí es "sin nombre todavía", no un error) |
| | `GET /api/historiales-{area}/paciente/:id` | **`apiFetch` crudo** (mismo motivo) |
| `components/NutritionRecommendations.tsx` | `GET /api/recomendaciones/paciente/:id` | `recomendacionesAPI.getByPaciente(id, area)` |
| | `POST /api/recomendaciones` | `recomendacionesAPI.create(data)` |
| `pages/HojaEvolutiva.tsx` | `GET /api/notas-evolucion/:id` | `notasAPI.getEvolucion(appointmentId)` |
| | `POST /api/notas-evolucion` | `notasAPI.createEvolucion(payload)` |
| | `PUT /api/notas-evolucion/:id` | `notasAPI.updateEvolucion(notaId, payload)` |
| `components/NotesViewer.tsx` | `GET /api/notas_universitarias` | `notasAPI.getUniversitarias()` |
| | `PUT /api/notas_universitarias/:id/responder` | `notasAPI.responderUniversitaria(id, respuesta)` |
| `components/StatisticsPanel.tsx` | `GET /api/citas`, `/api/historiales`, `/api/stats/dashboard` (en paralelo) | `citasAPI.getAll()`, `historialesAPI.getAll()`, `metricasAPI.getDashboardStats()` |
| `pages/ManagePractitionersPage.tsx` | `GET /api/practicantes` | `practicantesAPI.getAll(area)` |
| | `POST /api/practicantes` | `practicantesAPI.create(data)` |
| | `PUT /api/practicantes/:id` | `practicantesAPI.updateStatus(id, estado)` |
| | `DELETE /api/practicantes/:id` | `practicantesAPI.remove(id)` |
| `pages/StatisticsPage.tsx` | `GET /api/citas`, `GET /api/logs` (en paralelo) | `citasAPI.getAll()`, `metricasAPI.getLogs()` (el fallback a `localStorage['utc_appointments']` en el `catch` se dejó igual) |
| `pages/MasterAdminDashboard.tsx` | `GET /api/usuarios` | `usuariosAPI.getAll()` |
| | `PUT /api/usuarios/:id` (estado) | `usuariosAPI.updateStatus(id, estado)` |
| | `DELETE /api/usuarios/:id` | `usuariosAPI.remove(id)` |
| | `POST /api/notas_universitarias` | `notasAPI.createUniversitaria(payload)` |
| | `PATCH /api/usuarios/:id` (perfil propio) | `usuariosAPI.updateProfile(id, data)` |
| `pages/NutritionAdminDashboard.tsx` | `GET /api/citas` | `citasAPI.getAll()` |
| | `GET /api/usuarios` | `usuariosAPI.getAll()` |
| | `PATCH /api/citas/:id/asignar` | `citasAPI.asignar(id, data)` |
| | `POST /api/notas_universitarias` | `notasAPI.createUniversitaria(payload)` |
| | `PATCH /api/usuarios/:id` (perfil propio) | `usuariosAPI.updateProfile(id, data)` |
| `pages/PhysiotherapyAdminDashboard.tsx` | (mismo patrón que la versión de Nutrición, archivo gemelo) | mismas funciones: `citasAPI.getAll()` (x2 sitios), `usuariosAPI.getAll()`, `citasAPI.asignar()`, `notasAPI.createUniversitaria()`, `usuariosAPI.updateProfile()` |
| `pages/NutritionPractitionerDashboard.tsx` | `GET /api/citas` | `citasAPI.getAll()` |
| | `GET /api/historiales/verificar/:id/:area` | `historialesAPI.verificarRecurrencia(pacienteId, 'nutricion')` |
| | `PATCH /api/usuarios/:id` (perfil propio) | `usuariosAPI.updateProfile(id, data)` |
| `pages/PhysiotherapyPractitionerDashboard.tsx` | (mismo patrón, archivo gemelo) | `citasAPI.getAll()`, `historialesAPI.verificarRecurrencia(pacienteId, 'fisioterapia')`, `usuariosAPI.updateProfile()` |
| `pages/PatientDashboard.tsx` | `GET /api/citas/paciente/:id` | `citasAPI.getByPaciente(patientId)` |
| | `DELETE /api/citas/:id` | `citasAPI.remove(id)` |
| | `PATCH /api/usuarios/:id` (perfil propio) | `usuariosAPI.updateProfile(id, data)` |
| `pages/NutritionMasterForm.tsx` | `GET /api/historiales-nutricion/detalle/:id` | **`apiFetch` crudo** (mismo motivo que `MedicalHistoryViewer`) |
| | `POST`/`PUT /api/historiales` (guardar expediente) | `historialesAPI.guardar(historialId, payload)` |
| `pages/PhysiotherapyMasterForm.tsx` | `GET /api/historiales-fisioterapia/detalle/:id` | **`apiFetch` crudo** |
| | `POST /api/historiales` (función vieja `handleFinalSave`, probablemente ya no se llama desde la UI pero se migró igual) | `historialesAPI.create(payload)` |
| | `POST`/`PUT /api/historiales` (función real de guardado, `handleFinalizarYGuardar`, dentro de `PhysiotherapyPage3Component`) | `historialesAPI.guardar(historialId, payload)` |

`AuthContext.tsx`, `Login.tsx`, `Register.tsx`, `ForgotPassword.tsx` seguían usando
`authAPI` desde `'../lib/api'` — no necesitaron cambiar su import, solo se benefician
de que ese barrel ahora vive en el directorio nuevo.

### 3.3 Verificación

Se verificó con un script Playwright headless desechable (`.qa-playwright.cjs`, borrado
al terminar) y una cuenta de prueba descartable (registrada y luego eliminada vía la
API): login real → aterriza en `/dashboard`, `localStorage` solo tiene
`utc_refresh_token`, las peticiones reales llevan `Authorization: Bearer`, y recargar la
página mantiene la sesión (gracias a `bootstrapSession()`).

---

## 4. Fase D — Modularización del backend a MVC

`utc-api/index.js` pasó de **~1500 líneas (~60 rutas inline) a ~75** (puro bootstrap).

### 4.1 Estructura nueva

```
utc-api/
  index.js                          # cors, express.json, monta todos los routers en /api
                                     # (y /api/auth para authRoutes), health check, listen()
  db.js                              # (sin cambios — pool único de pg)
  middleware/
    authMiddleware.js                # requireAuth/verifyToken, requireRole, requireSameArea,
                                     # canModifyAppointment, signAccessToken, generateRefreshToken, hashToken
  controllers/
    authController.js
    usuariosController.js
    practicantesController.js
    citasController.js
    historialesController.js
    notasController.js
    recomendacionesController.js
    statsController.js
  routes/
    authRoutes.js
    usuariosRoutes.js
    practicantesRoutes.js
    citasRoutes.js
    historialesRoutes.js
    notasRoutes.js
    recomendacionesRoutes.js
    statsRoutes.js
  services/
    emailService.js                  # sin cambios de lógica
    emailTemplates.js                 # sin cambios de lógica
    notificationService.js            # NUEVO
    scheduledTasks.js                  # NUEVO
  migrations/
    001_refresh_tokens.sql            # de la Fase B
```

### 4.2 Mapa completo: de qué ruta (antes en `index.js`/`authRoutes.js`), a qué archivo/función

| Endpoint | Antes (Fase A/B) | Ahora — controller (función) | Ahora — route file |
|---|---|---|---|
| `POST /api/auth/login` | `routes/authRoutes.js` (inline) | `authController.js` → `login()` | `routes/authRoutes.js` |
| `GET /api/auth/validate-session` | `routes/authRoutes.js` (inline) | `authController.js` → `validateSession()` | `routes/authRoutes.js` |
| `POST /api/auth/refresh` | `routes/authRoutes.js` (inline) | `authController.js` → `refresh()` | `routes/authRoutes.js` |
| `POST /api/auth/logout` | `routes/authRoutes.js` (inline) | `authController.js` → `logout()` | `routes/authRoutes.js` |
| `POST /api/auth/pre-register` | `index.js` (inline) | `authController.js` → `preRegister()` | `routes/authRoutes.js` |
| `POST /api/auth/verify-and-register` | `index.js` (inline) | `authController.js` → `verifyAndRegister()` | `routes/authRoutes.js` |
| `POST /api/auth/forgot-password` | `index.js` (inline) | `authController.js` → `forgotPassword()` | `routes/authRoutes.js` |
| `POST /api/auth/resend-code` | `index.js` (inline) | `authController.js` → `resendCode()` | `routes/authRoutes.js` |
| `POST /api/auth/verify-reset-code` | `index.js` (inline) | `authController.js` → `verifyResetCode()` | `routes/authRoutes.js` |
| `POST /api/auth/reset-password` | `index.js` (inline) | `authController.js` → `resetPassword()` | `routes/authRoutes.js` |
| `GET /api/usuarios` | `index.js` (inline) | `usuariosController.js` → `getAll()` | `routes/usuariosRoutes.js` |
| `GET /api/usuarios/:id` | `index.js` (inline) | `usuariosController.js` → `getById()` | `routes/usuariosRoutes.js` |
| `PATCH /api/usuarios/:id` | `index.js` (inline) | `usuariosController.js` → `updateProfile()` | `routes/usuariosRoutes.js` |
| `PUT /api/usuarios/:id` | `index.js` (inline) | `usuariosController.js` → `updateStatus()` | `routes/usuariosRoutes.js` |
| `DELETE /api/usuarios/:id` | `index.js` (inline) | `usuariosController.js` → `remove()` | `routes/usuariosRoutes.js` |
| `GET /api/practicantes` | `index.js` (inline) | `practicantesController.js` → `getAll()` | `routes/practicantesRoutes.js` |
| `POST /api/practicantes` | `index.js` (inline) | `practicantesController.js` → `create()` | `routes/practicantesRoutes.js` |
| `PUT /api/practicantes/:id` | `index.js` (inline) | `practicantesController.js` → `updateStatus()` | `routes/practicantesRoutes.js` |
| `GET /api/citas` | `index.js` (inline) | `citasController.js` → `getAll()` | `routes/citasRoutes.js` |
| `GET /api/citas/paciente/:id` | `index.js` (inline) | `citasController.js` → `getByPaciente()` | `routes/citasRoutes.js` |
| `GET /api/citas/disponibilidad` | `index.js` (inline) | `citasController.js` → `getDisponibilidad()` | `routes/citasRoutes.js` |
| `POST /api/citas` | `index.js` (inline) | `citasController.js` → `create()` | `routes/citasRoutes.js` |
| `PUT /api/citas/:id` | `index.js` (inline) | `citasController.js` → `update()` | `routes/citasRoutes.js` |
| `DELETE /api/citas/:id` | `index.js` (inline) | `citasController.js` → `remove()` | `routes/citasRoutes.js` |
| `PATCH /api/citas/:id/asignar` | `index.js` (inline) | `citasController.js` → `asignar()` | `routes/citasRoutes.js` |
| `GET /api/historiales` | `index.js` (inline) | `historialesController.js` → `getAll()` | `routes/historialesRoutes.js` |
| `GET /api/historiales/verificar/:pacienteId/:area` | `index.js` (inline) | `historialesController.js` → `verificarRecurrencia()` | `routes/historialesRoutes.js` |
| `PUT /api/historiales/:id` | `index.js` (inline) | `historialesController.js` → `updateGenerico()` | `routes/historialesRoutes.js` |
| `GET /api/historiales-nutricion/detalle/:appointmentId` | `index.js` (inline) | `historialesController.js` → `getNutricionDetalle()` | `routes/historialesRoutes.js` |
| `GET /api/historiales-fisioterapia/detalle/:appointmentId` | `index.js` (inline) | `historialesController.js` → `getFisioterapiaDetalle()` | `routes/historialesRoutes.js` |
| `GET /api/historiales-nutricion/paciente/:id` | `index.js` (inline) | `historialesController.js` → `getNutricionByPaciente()` | `routes/historialesRoutes.js` |
| `GET /api/historiales-fisioterapia/paciente/:id` | `index.js` (inline) | `historialesController.js` → `getFisioterapiaByPaciente()` | `routes/historialesRoutes.js` |
| `POST /api/historiales` | `index.js` (inline) | `historialesController.js` → `create()` | `routes/historialesRoutes.js` |
| `GET /api/notas-evolucion/:id` | `index.js` (inline) | `notasController.js` → `getEvolucion()` | `routes/notasRoutes.js` |
| `POST /api/notas-evolucion` | `index.js` (inline) | `notasController.js` → `createEvolucion()` | `routes/notasRoutes.js` |
| `PUT /api/notas-evolucion/:id` | `index.js` (inline) | `notasController.js` → `updateEvolucion()` | `routes/notasRoutes.js` |
| `GET /api/notas_universitarias` | `index.js` (inline) | `notasController.js` → `getUniversitarias()` | `routes/notasRoutes.js` |
| `POST /api/notas_universitarias` | `index.js` (inline) | `notasController.js` → `createUniversitaria()` | `routes/notasRoutes.js` |
| `PUT /api/notas_universitarias/:id/responder` | `index.js` (inline) | `notasController.js` → `responderUniversitaria()` | `routes/notasRoutes.js` |
| `POST /api/recomendaciones` | `index.js` (inline) | `recomendacionesController.js` → `create()` | `routes/recomendacionesRoutes.js` |
| `GET /api/recomendaciones/paciente/:id` | `index.js` (inline) | `recomendacionesController.js` → `getByPaciente()` | `routes/recomendacionesRoutes.js` |
| `GET /api/stats/dashboard` | `index.js` (inline) | `statsController.js` → `getDashboard()` | `routes/statsRoutes.js` |
| `GET /api/logs` | `index.js` (inline) | `statsController.js` → `getLogs()` | `routes/statsRoutes.js` |
| `GET /api/health`, `GET /` | `index.js` (inline) | se quedaron en `index.js` (son del propio bootstrap, no de un recurso) | — |

El cron `verificarYDesactivarPracticantes()` (antes un `setInterval` suelto al final de
`index.js`) se movió a `utc-api/services/scheduledTasks.js`, exportado como
`iniciarTareasProgramadas()`, y se llama una sola vez desde `index.js`.

### 4.3 `notificationService.js` (nuevo)

`utc-api/services/notificationService.js` es una fachada: `enviar({canal, destino,
asunto, html})` y `reenviar({...})`. Hoy `canal` solo soporta `'email'` (delega en
`emailService.enviarCorreo`/`reenviarCorreo`, que quedaron intactos). `authController.js`
ya llama a `notificationService.enviar()`/`.reenviar()` en vez de a `emailService`
directamente (en `preRegister`, `forgotPassword`, `resendCode`). El día que se quiera
agregar WhatsApp/SMS, se añade el `case` correspondiente aquí adentro y ningún
controller necesita cambiar.

### 4.4 Verificación

Se repitió toda la batería de pruebas `curl` de las Fases A/B contra el backend ya
modularizado (mismos códigos 401/403/200 exactos) y el ciclo completo de JWT
(pre-register → leer OTP por SQL → verify-and-register → login → llamada con Bearer →
refresh con rotación → logout) usando una cuenta de prueba descartable, creada y
eliminada al terminar.

### 4.5 Recorrido detallado: el código real de cada bloque, a dónde se fue, y por qué ahí

Esto va un nivel más profundo que la tabla de 4.2: en vez de solo decir "esta ruta se
movió a este archivo", aquí está **el código tal como estaba**, a dónde se fue, y la
razón concreta de por qué se eligió ese destino y no otro. El orden sigue el orden
original de arriba hacia abajo en los archivos viejos.

#### `utc-api/routes/authRoutes.js` (como era ANTES de la Fase D)

El router tenía una sola ruta grande, `router.post('/login', ...)`, con varios bloques
marcados por comentario adentro. El primero busca al usuario:

```js
const result = await pool.query(
  'SELECT * FROM usuarios WHERE email = $1',
  [email.trim().toLowerCase()]
);
```

**Se movió a** `utc-api/controllers/authController.js`, función `login()`, sin
cambios, al principio. **Por qué ahí:** toda la función `login()` se movió completa de
un solo golpe — partirla en dos archivos distintos (la búsqueda en uno, la validación
de contraseña en otro) habría obligado a pasar `result`/`usuario` de un lado a otro sin
ninguna ganancia real.

Justo después estaba el bloque que el usuario preguntó puntualmente:

```js
// =========================
// PASSWORD VIEJA (texto plano)
// =========================
if (usuario.password === password) {

  // =========================
  // MIGRAR A BCRYPT AUTOMÁTICAMENTE
  // =========================

  const nuevaHash = await bcrypt.hash(password, 10);

  await pool.query(
    'UPDATE usuarios SET password = $1 WHERE id = $2',
    [nuevaHash, usuario.id]
  );

  console.log(` Password migrada automáticamente: ${usuario.email}`);

  return res.json(usuario);
}
```

**Se movió a** `authController.js` → `login()`, exactamente en el mismo lugar dentro de
la función (justo después de buscar al usuario, antes de la comparación con bcrypt).
**No se tocó la lógica de migración en sí** (sigue comparando texto plano y
re-hasheando con `bcrypt.hash(password, 10)` igual que antes). **Por qué se dejó tal
cual, en vez de rediseñarlo:** es una estrategia de migración progresiva ya en marcha
— hay filas en `usuarios` que todavía pueden tener la contraseña en texto plano, y
cambiar esta lógica a mitad de la migración (por ejemplo, exigiendo que todo esté en
bcrypt desde ya) habría bloqueado el login de cualquier cuenta que no se haya
actualizado todavía. **Lo único que sí cambió** es el final: antes hacía
`return res.json(usuario)` (que filtraba el hash de la contraseña sin querer, ver
sección 2.3); ahora se construye `usuarioSafe1` sin el campo `password` y se le agregan
`accessToken`/`refreshToken` antes de responder.

Después seguía:

```js
// =========================
// PASSWORD NUEVA (bcrypt)
// =========================
const passwordCorrecta = await bcrypt.compare(password, usuario.password);

if (!passwordCorrecta) {
  return res.status(401).json({ error: 'Credenciales incorrectas' });
}

// =========================
// USUARIO INACTIVO
// =========================
if (usuario.status === 'inactivo') {
  return res.status(403).json({ error: 'Tu cuenta se encuentra inactiva.' });
}
```

**Se movió a** `authController.js` → `login()`, sin cambios, justo después del bloque
de migración. **Por qué ahí:** es la continuación natural del mismo flujo de decisión
(¿la contraseña es correcta? ¿la cuenta está activa?) — separarlo de la migración
habría forzado a duplicar la consulta a `usuarios` o a pasar el objeto `usuario` entre
funciones sin necesidad.

La función `issueTokens(usuario)` (firma el access token y genera/guarda el refresh
token) se escribió por primera vez en la Fase B, dentro del propio `authRoutes.js`,
porque en ese momento todavía no existían los controllers. **Se movió a**
`authController.js` como función auxiliar interna (no es una ruta). **Por qué ahí:** es
lógica que solo usan `login()` y `refresh()`, ambas ya en este mismo archivo — vive al
lado de quienes la llaman, en vez de en un archivo de utilidades separado que solo
tendría dos consumidores.

`router.get('/validate-session', ...)` (la única otra ruta que ya existía en
`authRoutes.js` desde antes de esta sesión) **se movió a** `authController.js` →
`validateSession()`.

`router.post('/refresh', ...)` y `router.post('/logout', ...)` (escritas durante la
Fase B directamente dentro de `authRoutes.js`, porque todavía no existían los
controllers) **se movieron a** `authController.js` → `refresh()` y `logout()`.

**Por qué las cuatro rutas de auth (`login`, `validate-session`, `refresh`, `logout`)
y las seis que venían de `index.js` (`pre-register`, `verify-and-register`,
`forgot-password`, `resend-code`, `verify-reset-code`, `reset-password`) terminaron
todas en el mismo `authController.js`, en vez de en dos archivos separados:** las diez
manipulan la misma tabla (`usuarios`, `registro_temporal` o `password_resets`) y
comparten el mismo propósito de negocio — "todo lo que tiene que ver con identidad y
sesión". Separarlas en "auth viejo" y "auth nuevo" habría sido una división arbitraria
basada en el historial de la sesión de trabajo, no en el dominio del problema.

#### `utc-api/index.js` (como era ANTES de la Fase D, ~1500 líneas), de arriba hacia abajo

El bloque de imports se repartió según quién usa qué:

```js
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const { Resend } = require('resend');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const authRoutes = require('./routes/authRoutes');
```

`express`/`cors`/`pool`/`dotenv`/`authRoutes` **se quedaron en** el `index.js` nuevo,
porque siguen siendo necesarios para el bootstrap de la app (montar middlewares y
routers). `Resend` y `nodemailer` **se eliminaron de `index.js` por completo** — desde
la Fase A ya no se usan ahí directamente, solo dentro de `emailService.js`, que es el
único lugar que de verdad envía correos; mantener el import en `index.js` sin usarlo
habría sido el mismo tipo de código muerto que se limpió en las Fases E/6. `bcrypt`
**se movió a** `authController.js` y a `practicantesController.js` — son los dos
únicos lugares que siguen hasheando contraseñas (login/registro y alta de
practicante). `authMiddleware` (`requireAuth`, `requireRole`, etc.) **se repartió**:
cada archivo de `routes/*.js` importa hoy solo las funciones de middleware que de
verdad usa, en vez de que un único archivo importe todo el middleware para todas las
rutas (que es lo que pasaba en el `index.js` viejo).

```js
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
```

**Se quedó en** `index.js`, pero el `cors()` ya no es exactamente este — desde la Fase
A lee `CORS_ORIGINS` (sección 1.7). **Por qué se quedó en `index.js` y no se movió a
ningún router:** son middlewares globales, que aplican a *todas* las rutas sin
excepción — es exactamente el tipo de cosa que le corresponde al archivo de bootstrap,
no a un router de un recurso específico.

```js
app.get('/api/health', async (req, res) => { ... });
```

**Se quedó tal cual en** `index.js`. **Por qué:** no es un recurso de negocio (no toca
`usuarios`, `citas`, etc.) — es un chequeo de infraestructura para monitoreo, y vive
mejor junto al resto del bootstrap.

```js
/**
 * ENDPOINT: PRE-REGISTRO Y ENVÍO DE CÓDIGO (Blindado)
 */
app.post('/api/auth/pre-register', async (req, res) => {
  // VERIFICAR SI EMAIL YA EXISTE
  // PASO 1: Inserción en la tabla de retención
  // PASO 2: Envío por Resend con manejo de errores específico
  ...
});
```

**Se movió completo a** `authController.js` → `preRegister()`. El sub-bloque "PASO 2"
es el que se reescribió para llamar a `notificationService.enviar(...)` en vez de a
`emailService.enviarCorreo(...)` directamente (ver 4.3). **Por qué a `authController`
y no a un `registroController` aparte:** registrar una cuenta nueva es, de nuevo, parte
del mismo dominio de "identidad y sesión" que el login.

```js
/**
 * ENDPOINT: VALIDACIÓN Y REGISTRO DEFINITIVO
 */
app.post('/api/auth/verify-and-register', async (req, res) => { ... });
```

**Se movió completo a** `authController.js` → `verifyAndRegister()`. El paso final,
que antes hacía `res.status(201).json(newUser.rows[0])` (filtrando el hash sin
querer), ahora construye `usuarioCreado` sin el campo `password` antes de responder
(mismo arreglo que en `login()`, sección 2.3).

```js
/**
 * LÓGICA DE DESACTIVACIÓN AUTOMÁTICA (MODO PRECISIÓN HH:mm)
 */
const verificarYDesactivarPracticantes = async () => { ... };

setInterval(verificarYDesactivarPracticantes, 60000);
```

**Se movió a** `utc-api/services/scheduledTasks.js`. La función conservó su nombre;
el `setInterval` quedó adentro de una función nueva, `iniciarTareasProgramadas()`, que
es lo único que `index.js` llama hoy (una sola vez, al arrancar). **Por qué se sacó de
`index.js` y no se dejó ahí:**
no es una ruta HTTP — es una tarea de fondo, y mezclarla entre rutas (como estaba) hacía
que cualquiera que buscara "todas las rutas de la API" tuviera que saltarse este bloque
mentalmente. Vivir en `services/` la pone junto a la otra pieza de "cosas que pasan sin
que nadie haga una petición" (el envío de correos).

```js
/**
 * FORGOT PASSWORD — ENVIAR CÓDIGO
 */
app.post('/api/auth/forgot-password', async (req, res) => { ... });
```

**Se movió completo a** `authController.js` → `forgotPassword()`. Mismo cambio: ahora
usa `notificationService.enviar(...)`.

```js
/**
 * REENVIAR CÓDIGO DE REGISTRO
 */
app.post('/api/auth/resend-code', async (req, res) => {
  // BUSCAR REGISTRO TEMPORAL
  // GENERAR NUEVO CÓDIGO
  // ACTUALIZAR CÓDIGO Y EXPIRACIÓN
  // OBTENER NOMBRE
  // ENVIAR CORREO
  ...
});
```

**Se movió completo a** `authController.js` → `resendCode()`. El sub-bloque "ENVIAR
CORREO" ahora llama a `notificationService.reenviar(...)`.

```js
app.post('/api/auth/verify-reset-code', async (req, res) => { ... });
app.post('/api/auth/reset-password', async (req, res) => { ... });
```

**Se movieron a** `authController.js` → `verifyResetCode()` y `resetPassword()`.

La ruta duplicada `GET /api/auth/validate-session` que estaba aquí (inalcanzable porque
`authRoutes.js` ya resolvía esa misma URL primero) **no se movió a ningún lado: se
borró**, en la Fase A (sección 1.2) — antes incluso de que existiera la Fase D.

```js
const USUARIO_COLUMNAS_SEGURAS = 'id, nombre, email, rol, area, status, telefono, matricula, primer_inicio, fecha_creacion';
```

**Se movió al principio de** `usuariosController.js`, exportada desde ahí. **Por qué
ahí y no en un archivo de constantes aparte:** la usan `usuariosController.js` (en
varias de sus funciones) y `practicantesController.js` (que la importa desde
`usuariosController.js`) — vive junto a su consumidor principal en vez de en un
tercer archivo solo para una constante.

`GET /api/usuarios` y `GET /api/usuarios/:id` **se movieron a**
`usuariosController.js` → `getAll()` / `getById()`.

```js
/**
 * ENDPOINT DEFINITIVO: ACTUALIZAR PERFIL (NOMBRE, TELÉFONO Y MATRÍCULA)
 */
app.patch('/api/usuarios/:id', requireAuth, async (req, res) => {
  if (String(req.user.id) !== String(id)) {
    return res.status(403).json({ error: 'No tienes autorización para modificar este perfil.' });
  }
  ...
});
```

**Se movió completo a** `usuariosController.js` → `updateProfile()`.

`PUT /api/usuarios/:id` (cambio de estado activo/inactivo) **se movió a**
`updateStatus()` — aquí también se aplicó el arreglo de la fuga de hash (responde
`usuarioActualizado` sin `password`). `DELETE /api/usuarios/:id` **se movió a**
`remove()`.

**Por qué estas cinco rutas de `usuarios` se agruparon en un solo
`usuariosController.js` en vez de separar, por ejemplo, "lectura" de "escritura":**
todas operan sobre la misma tabla y el mismo recurso (`usuarios`) — la separación por
recurso es más fácil de navegar que una separación por tipo de operación, porque
cuando alguien necesita tocar algo de usuarios, sabe que está en un solo archivo.

```js
/**
 * SECCIÓN: GESTIÓN DE PRACTICANTES (AUTORIZACIONES)
 */
app.get('/api/practicantes', ...);

app.post('/api/practicantes', async (req, res) => {
  const passwordTemporal = `UTC${matricula}`;
  const passwordHash = await bcrypt.hash(passwordTemporal, 10);

  // DETECTAR DOMINIO DEL CORREO
  // DOMINIOS PÚBLICOS CONOCIDOS
  // SI NO ES UN DOMINIO PÚBLICO
  //   VERIFICAR SI EL DOMINIO YA EXISTE
  //   SI EL DOMINIO NO EXISTE, REGISTRARLO
  ...
});

app.put('/api/practicantes/:id', async (req, res) => { ... });
```

**Se movieron completos a** `practicantesController.js` → `getAll()`, `create()`,
`updateStatus()`. **Por qué `practicantesController.js` es un archivo separado de
`usuariosController.js`, aunque un practicante también es una fila en `usuarios`:**
`POST /api/practicantes` y `PUT /api/practicantes/:id` tienen su propia lógica de
negocio que no aplica a un usuario cualquiera (la contraseña temporal `UTC<matrícula>`,
la detección de dominio de correo institucional) — agruparlas bajo "practicantes" deja
claro que son operaciones especiales de alta/gestión, no CRUD genérico de usuarios.
Dentro de `create()`, el bloque de detección de dominio **no se tocó** (se reubicó
completo, en el mismo orden) — sigue siendo la misma lógica duplicada que ya existía
también en `emailService.js` antes de esta sesión (ver `docs/AUDITORIA_INTEGRAL_2026.md`,
sección 7.2 — no se unificó en esta sesión porque no estaba en el plan de las 5 fases).

```js
/**
 * SECCIÓN: OPERACIONES CLÍNICAS (CITAS E HISTORIALES MÉDICOS)
 */
app.get('/api/citas', ...);
app.get('/api/citas/paciente/:id', ...);          // OBTENER CITAS POR PACIENTE
app.get('/api/citas/disponibilidad', ...);          // OBTENER DISPONIBILIDAD DE HORARIOS
app.post('/api/citas', ...);
app.put('/api/citas/:id', ...);                      // REAGENDAR O MODIFICAR CITA
app.delete('/api/citas/:id', ...);
app.patch('/api/citas/:id/asignar', ...);
```

**Se movieron, las siete, completas, a** `citasController.js` → `getAll()`,
`getByPaciente()`, `getDisponibilidad()`, `create()`, `update()`, `remove()`,
`asignar()`. **Por qué un solo archivo para las siete:** todas leen o escriben
exclusivamente la tabla `citas` (algunas también insertan en `metricas`, como
`update()` con el evento `cita_reagendada` y `remove()` con `cita_cancelada`, pero
`metricas` es un efecto secundario del cambio de estado de una cita, no un recurso
propio con sus propias rutas).

```js
/**
 * SECCIÓN: GESTIÓN DE HISTORIALES (CONFIGURACIÓN API)
 */
app.get('/api/historiales', ...);
app.get('/api/historiales/verificar/:pacienteId/:area', ...);   // VERIFICACIÓN DE RECURRENCIA
app.put('/api/historiales/:id', ...);

/** ENDPOINT: Obtener datos específicos de un historial de NUTRICIÓN */
app.get('/api/historiales-nutricion/detalle/:appointmentId', ...);

/** ENDPOINT: Obtener datos específicos de un historial de FISIOTERAPIA */
app.get('/api/historiales-nutricion/detalle/:appointmentId', ...); // <- bug: path y tabla repetidos

app.get('/api/historiales-nutricion/paciente/:id', ...);
app.get('/api/historiales-fisioterapia/paciente/:id', ...);
app.post('/api/historiales', ...);                                  // GUARDADO DE HISTORIAL CLÍNICO
```

**Se movieron, las ocho, a** `historialesController.js` → `getAll()`,
`verificarRecurrencia()`, `updateGenerico()`, `getNutricionDetalle()`,
`getFisioterapiaDetalle()`, `getNutricionByPaciente()`, `getFisioterapiaByPaciente()`,
`create()`. **El bloque del bug** (la segunda definición de "FISIOTERAPIA" que en
realidad apuntaba a `historiales_nutricion`, sección 1.1) se corrigió **antes** de
moverlo: `getFisioterapiaDetalle()` ya consulta `historiales_fisioterapia` de verdad,
con el path correcto `/api/historiales-fisioterapia/detalle/:appointmentId`. **Por qué
se corrigió en la Fase A y no se dejó "tal cual" para arreglar después, como con el
resto del código que solo se reubicó:** porque es la diferencia entre una ruta que
funciona y una que devuelve 404 siempre — no había forma de "mover" un bug sin
arreglarlo sin seguir rompiendo el auto-rellenado de fisioterapia en el archivo nuevo
también.

```js
app.get('/api/notas-evolucion/:id', ...);     // OBTENER HOJA EVOLUTIVA POR ID DE CITA
app.post('/api/notas-evolucion', ...);          // GUARDAR HOJA EVOLUTIVA
app.put('/api/notas-evolucion/:id', ...);        // ACTUALIZAR HOJA EVOLUTIVA (PUT)
```

**Se movieron a** `notasController.js` → `getEvolucion()`, `createEvolucion()`,
`updateEvolucion()`.

```js
/**
 * SECCIÓN: SISTEMA DE LOGS Y COMUNICADOS
 */
app.get('/api/logs', ...);
app.get('/api/notas_universitarias', ...);
app.post('/api/notas_universitarias', ...);
app.put('/api/notas_universitarias/:id/responder', ...);
```

Esta "sección" del archivo viejo en realidad mezclaba dos recursos distintos
(`logs_sistema` y `notas_universitarias`) bajo un solo título. `GET /api/logs` **se
movió a** `statsController.js` → `getLogs()`. Las otras tres **se movieron a**
`notasController.js` → `getUniversitarias()`, `createUniversitaria()`,
`responderUniversitaria()` (junto con `notas-evolucion`, no junto a `logs`). **Por qué
se separaron aunque estuvieran juntas en el comentario original:** `logs_sistema` es
métricas/observabilidad del sistema (por eso terminó junto a `stats/dashboard`, que es
lo mismo), mientras que `notas_universitarias` son comunicados entre personas — mismo
tipo de recurso que `notas_evolucion` (ambas son "notas" que alguien escribe para que
otra persona las lea), aunque el archivo viejo las haya puesto en secciones distintas
por cómo se fue escribiendo el código con el tiempo, no por su naturaleza real.

```js
/**
 * SECCIÓN: ESTADÍSTICAS E INTELIGENCIA
 */
app.get('/api/stats/dashboard', ..., async (req, res) => {
  const total = await pool.query("SELECT COUNT(*) FROM citas");
  const completadas = await pool.query("SELECT COUNT(*) FROM citas WHERE estado = 'completada'");
  const programadas = await pool.query("SELECT COUNT(*) FROM citas WHERE estado = 'programada'");
  const canceladasMetrica = await pool.query("SELECT COUNT(*) FROM metricas WHERE tipo_evento = 'cita_cancelada'");
  const reagendadasMetrica = await pool.query("SELECT COUNT(*) FROM metricas WHERE tipo_evento = 'cita_reagendada'");
  const promedioConsultaMetrica = await pool.query("SELECT AVG(valor_numerico) FROM metricas WHERE tipo_evento = 'tiempo_consulta'");
  ...
});
```

**Se movió completo a** `statsController.js` → `getDashboard()`. Las 5 consultas
secuenciales **no se tocaron** — consolidarlas en una sola consulta agregada es
justamente la "Fase F" que el usuario dejó fuera de alcance por ser la prioridad más
baja (ver sección 8); tocarlo ahora habría sido optimizar algo que nadie pidió
optimizar todavía.

```js
app.get('/', (req, res) => { res.send(' Servidor UTC Activo...'); });
app.listen(PORT, () => { ... });
```

**Se quedaron en** `index.js`. Son, junto con `app.use(...)` y `/api/health`, las
únicas piezas que de verdad pertenecen al archivo de arranque.

```js
/**
 * Api de las recomendaciones
 */
app.post('/api/recomendaciones', async (req, res) => { ... });
app.get('/api/recomendaciones/paciente/:id', async (req, res) => { ... });
```

Este bloque, en el archivo viejo, aparecía **después** de `app.listen(...)` — no
afecta el funcionamiento (en JavaScript el motor ya registró estas rutas antes de que
el servidor empezara a aceptar conexiones, sin importar en qué línea del archivo
estén), pero era una señal de que el archivo había crecido sin orden. **Se movieron a**
`recomendacionesController.js` → `create()` y `getByPaciente()`, con el arreglo de IDOR
de la sección 1.5 ya aplicado (`creado_por_id`/`creado_por_nombre` ya no vienen del
body, sino de `req.user`). **Por qué un archivo propio y no dentro de
`historialesController.js` o `notasController.js`:** aunque conceptualmente una
recomendación se parece a una nota, la tabla (`recomendaciones_nutricion`) y el caso de
uso (un practicante le escribe una recomendación a un paciente específico, que el
paciente luego puede leer en su propio panel) son lo bastante distintos como para que
agruparlo con notas hubiera mezclado dos audiencias distintas (personal interno vs.
paciente) en el mismo archivo.

---

## 5. Fase E — Limpieza de código muerto (primera pasada)

Eliminado, todo con cero referencias confirmadas en el código (ni imports directos ni
rutas en `routes.tsx`):

| Archivo eliminado | Motivo |
|---|---|
| `src/app/pages/MasterDashboard.tsx` | Huérfano — reemplazado por `MasterAdminDashboard.tsx` |
| `src/app/pages/ManageAdminPage.tsx` | Huérfano (la función que sí se usa, con el mismo nombre, vive dentro de `MasterAdminDashboard.tsx`) |
| `src/app/pages/AdminDashboard.tsx` | Huérfano — reemplazado por las versiones por especialidad |
| `src/app/pages/PractitionerDashboard.tsx` | Huérfano — reemplazado por las versiones por especialidad |
| `src/app/pages/validacion.tsx` | Huérfano — encontrado en esta sesión, no estaba en la auditoría original |
| `src/app/components/appointment-calendar.tsx` | Huérfano — reemplazado por `AppointmentForm.tsx`/`AppointmentManager.tsx` |
| `src/app/components/PatientSchedule.tsx` | Huérfano — el dashboard de paciente usa `AppointmentForm` directamente |
| `src/app/lib/database.config.ts` | Esquema de ejemplo de un Supabase abandonado, nunca usado por el backend real |
| `database-schema.sql` (raíz) | Mismo motivo — esquema Supabase con UUIDs/RLS nunca usado |
| `estructura.txt` (raíz) | Volcado de `tree`, 77 011 líneas, sin valor |

También: 11 dependencias npm sin ningún `import` en el código —
`xlsx`, `react-dnd`, `react-dnd-html5-backend`, `react-slick`, `react-responsive-masonry`,
`@tiptap/react`, `@tiptap/starter-kit`, `motion`, `next-themes`, `react-popper`,
`@popperjs/core`.

**Los 7 archivos `docs/*.md` que describen Supabase NO se tocaron** — el usuario pidió
explícitamente conservarlos aunque estén obsoletos:
`docs/DATABASE_SETUP.md`, `docs/DIAGRAMA_BASE_DATOS.md`, `docs/GUIA_USO_SUPABASE.md`,
`docs/INSTRUCCIONES_PROYECTO_UTC.md`, `docs/PROYECTO_COMPLETADO.md`,
`docs/README_BASE_DATOS.md`, `docs/VARIABLES_ENTORNO.md`. **Regla para el futuro: no
borrar documentación `.md` en este proyecto sin que él lo pida de forma explícita y
puntual, aunque esté confirmado que nada la referencia.**

---

## 6. Segunda pasada de limpieza (misma sesión, más profunda)

Tras la Fase E, el usuario pidió volver a analizar todo el proyecto para encontrar más
basura, sin afectar funcionalidad y sin tocar `.md`.

### 6.1 Componentes de UI: de 45 archivos, solo 12 están vivos

Se mapeó el grafo de imports completo de `src/app/components/ui/` (el kit de
componentes estilo shadcn/ui heredado de la plantilla original con la que se arrancó el
proyecto). Resultado: **solo 12 de 45 archivos tienen al menos un importador real en
todo `src/app`**: `card.tsx`, `button.tsx`, `badge.tsx`, `table.tsx`, `dialog.tsx`,
`label.tsx`, `select.tsx`, `calendar.tsx`, `textarea.tsx`, `input.tsx`, `tabs.tsx`,
`sonner.tsx` — más `utils.ts`, del que todos ellos dependen para la función `cn()`.

**Eliminados los 33 restantes** (ninguno alcanzable, ni directa ni transitivamente,
desde ningún archivo vivo — se verificó también que ninguno de los 12 vivos depende de
ninguno de estos 33):

`accordion.tsx`, `alert-dialog.tsx`, `alert.tsx`, `aspect-ratio.tsx`, `avatar.tsx`,
`breadcrumb.tsx`, `carousel.tsx`, `chart.tsx`, `checkbox.tsx`, `collapsible.tsx`,
`command.tsx`, `context-menu.tsx`, `drawer.tsx`, `dropdown-menu.tsx`, `form.tsx`,
`hover-card.tsx`, `input-otp.tsx`, `menubar.tsx`, `navigation-menu.tsx`,
`pagination.tsx`, `popover.tsx`, `progress.tsx`, `radio-group.tsx`, `resizable.tsx`,
`scroll-area.tsx`, `separator.tsx`, `sheet.tsx`, `sidebar.tsx`, `skeleton.tsx`,
`slider.tsx`, `switch.tsx`, `toggle-group.tsx`, `toggle.tsx`, `tooltip.tsx`,
`use-mobile.ts` (todos en `src/app/components/ui/`).

### 6.2 Otros archivos huérfanos encontrados en esta pasada

- `src/app/components/NotesManager.tsx` — cero imports en todo el proyecto.
- `src/app/components/figma/ImageWithFallback.tsx` — remanente de la plantilla
  original (junto con el directorio `figma/`, que quedó vacío y también se eliminó).

### 6.3 Dependencias npm eliminadas como consecuencia

27 dependencias que solo eran usadas por los archivos del punto 6.1:

- 21 paquetes `@radix-ui/react-*`: `accordion`, `alert-dialog`, `aspect-ratio`,
  `avatar`, `checkbox`, `collapsible`, `context-menu`, `dropdown-menu`, `hover-card`,
  `menubar`, `navigation-menu`, `popover`, `progress`, `radio-group`, `scroll-area`,
  `separator`, `slider`, `switch`, `toggle`, `toggle-group`, `tooltip`.
- `cmdk` (usado solo por `command.tsx`), `embla-carousel-react` (solo por
  `carousel.tsx`), `input-otp` (solo por `input-otp.tsx`), `react-hook-form` (solo por
  `form.tsx`), `react-resizable-panels` (solo por `resizable.tsx`), `vaul` (solo por
  `drawer.tsx`).

**Se conservaron** (siguen en uso por los 12 componentes vivos o directamente por
páginas/componentes de la aplicación): `@radix-ui/react-dialog`, `@radix-ui/react-label`,
`@radix-ui/react-select`, `@radix-ui/react-slot`, `@radix-ui/react-tabs`, y `recharts`
(usado directamente por `StatisticsPanel.tsx`/`StatisticsPage.tsx`, no solo por el ya
eliminado `chart.tsx`).

### 6.4 Lo que se revisó y se decidió NO tocar

`src/app/lib/mockData.ts` y la llamada a `initializeMockData()` desde `App.tsx` (en
cada carga de la app). Parece vestigial casi en su totalidad, pero tiene **un
consumidor real**: `src/app/pages/StatisticsPage.tsx` lee
`localStorage.getItem('utc_appointments')` como *fallback* dentro del `catch` de su
carga de datos, si la llamada real a la API falla por error de red. Tocarlo habría sido
alterar (aunque sea mínimamente) ese camino de resiliencia ante fallos de red, así que
se dejó igual.

### 6.5 Resultado medible y verificación

El CSS de producción bajó de **135 KB a 91 KB**. El JS no cambió de tamaño (esos
componentes nunca se incluían en el bundle final porque Vite/Rollup no los alcanzaba
desde ningún punto de entrada — la limpieza fue de higiene del repo y superficie de
auditoría, no de peso real en producción).

Se verificó además que el backend no tenía ningún archivo huérfano: un listado manual
de todos los `.js` fuera de `node_modules` confirmó que los 22 archivos de
`controllers/`, `routes/`, `services/`, `middleware/` (creados en la Fase D) están
todos referenciados. `npm run build` quedó limpio después de cada lote de borrado.

---

## 7. Ajuste de escala visual — intentado y revertido

El usuario sentía que la app se ve "muy pequeña" en general y pidió igualar la escala
de `MasterAdminDashboard` (la que percibía más grande) en todas las páginas, como
último paso, deliberadamente aislado para poder probarlo y revertirlo fácilmente.

**Investigación:** todas las páginas (Master, ambos Admin, ambos Practicante, Paciente,
Estadísticas, Gestión de Practicantes) ya usan el mismo contenedor `max-w-7xl` — no hay
ninguna diferencia de ancho/escala *por página* en el código. La única palanca global
que existe en este proyecto para una sensación de "todo más grande" es una variable CSS
en `src/styles/theme.css`, porque Tailwind aquí usa unidades `rem` (relativas a la raíz):

```css
:root {
  --font-size: 16px;
}
html { font-size: var(--font-size); }
```

**Cambio probado:** `--font-size: 16px` → `18px`. Agranda proporcionalmente texto,
paddings, alturas de botones e iconos (todo lo medido en `rem`) en toda la app por
igual. Las etiquetas con tamaño fijo en píxeles vía `text-[10px]` (algunos badges de
`MasterAdminDashboard.tsx`) no se ven afectadas a propósito, porque no usan `rem`.

**Resultado: Enrique lo probó en vivo (con los servidores de dev corriendo) y no le
gustó.** Se revirtió a `--font-size: 16px` (el valor original). Al cierre de esta
sesión, este archivo quedó exactamente igual que al principio — **cero cambio neto**.

**Nota para el futuro:** si se vuelve a pedir "agrandar la app", esta vía (subir
`--font-size` globalmente) ya se probó y fue rechazada explícitamente. Conviene explorar
en su lugar ajustes puntuales por componente (p.ej. agrandar específicamente los
headers o botones de una pantalla concreta), no un cambio de escala global.

---

## 8. Lo que queda pendiente / deuda intencional

- **El fallback al header `email` legado en `verifyToken`/`requireAuth`
  (`utc-api/middleware/authMiddleware.js`) sigue activo.** Era scaffolding explícito
  para no romper nada mientras la Fase C migraba el frontend. Ahora que la Fase C ya
  migró todo, en teoría ya no hace falta — pero no se retiró en esta sesión. Antes de
  quitarlo, confirmar que ningún cliente externo (Postman guardado, otra integración)
  dependa todavía de mandar `email` en vez de `Authorization`.
- **Rotación de credenciales filtradas en el historial de git** (`utc-api/.env` viejo
  con `DB_PASSWORD`/`RESEND_API_KEY` reales, commits `87017421`/`24ffe8ca`) — sigue sin
  confirmar si se rotaron. No relacionado con el trabajo de esta sesión.
- **Fase F (no implementada, prioridad explícitamente más baja):** consolidar las 5
  queries secuenciales de `GET /api/stats/dashboard` en una sola, y un logger con
  niveles en vez de `console.log`/`console.error` sueltos.
- **Sistema de perfiles:** sigue sin foto de perfil real, fecha de nacimiento, cambio
  de contraseña estando logueado, ni activación real del flag `primer_inicio` (se
  escribe al crear un practicante pero nada lo lee todavía). Solo se diseñó en la
  auditoría de lectura, nunca se implementó.
- **No hay suite de tests automatizados** en ningún punto del repo. Toda la
  verificación de esta sesión fue manual: `node -c` para sintaxis, `npm run build` para
  el frontend, baterías de `curl` contra el backend real, y un script Playwright
  desechable para el flujo de login en navegador (ambos artefactos de prueba se
  borraron al terminar, no quedaron en el repo).
- **Ajuste de escala visual:** probado y revertido (sección 7) — sigue siendo una
  queja abierta del usuario ("la app se siente pequeña"), solo que la solución
  intentada no le convenció.

---

## 9. Cómo verificar que todo sigue funcionando

```bash
# Backend + frontend juntos
npm run dev
# Backend solo: http://localhost:3001/api/health
# Frontend: http://localhost:5173
```

No hay credenciales de prueba guardadas. Para probar login/registro/recuperación de
extremo a extremo sin depender de la entrega real de correo, registrar una cuenta vía
`/api/auth/pre-register` y leer el código OTP directamente de la base de datos:

```sql
SELECT codigo_verificacion FROM registro_temporal WHERE email = '...';
-- o, para recuperación de contraseña:
SELECT codigo_verificacion FROM password_resets WHERE email = '...';
```

---

## 10. Nombre de commit sugerido (no se hizo ningún commit)

**Título:**
```
Migrar auth a JWT, centralizar API del frontend, modularizar backend a MVC y depurar código muerto
```

**Cuerpo sugerido:**
```
- Seguridad: cierra endpoints abiertos, IDOR, fuga de hashes de contraseña; CORS
  restringido; corrige el bug de auto-rellenado de fisioterapia.
- Auth: header `email` sin firmar reemplazado por JWT (access + refresh con rotación).
- Frontend: api.ts -> lib/api/ (cliente único + un módulo por recurso), ~26 archivos
  migrados de fetch() directo.
- Backend: index.js de ~1500 a ~75 líneas; lógica movida a controllers/, rutas a
  routes/, nuevo notificationService.js y scheduledTasks.js.
- Limpieza: ~40 archivos muertos (páginas huérfanas, 33 componentes UI sin uso,
  documentación Supabase obsoleta) y 38 dependencias npm sin uso eliminadas.

(El ajuste de --font-size global se probó y se revirtió en la misma sesión — no
queda ningún cambio de escala visual pendiente de incluir en este commit.)
```

---

## 11. Diagrama de la estructura actual del proyecto

Árbol real del repositorio al cierre de esta sesión (se omiten `node_modules/`, `dist/`,
`.git/` y archivos de configuración sin relación con los cambios de hoy).

```
clinica_online/
│
├── docs/
│   ├── AUDITORIA_INTEGRAL_2026.md          # auditoría de solo lectura, 2026-06-19
│   ├── CAMBIOS_REALIZADOS_2026-06-21.md     # este documento
│   ├── DATABASE_SETUP.md                     # \
│   ├── DIAGRAMA_BASE_DATOS.md                #  \  describen un esquema Supabase
│   ├── GUIA_USO_SUPABASE.md                  #  /  abandonado — obsoletos pero
│   ├── INSTRUCCIONES_PROYECTO_UTC.md         #  /  conservados a petición explícita
│   ├── PROYECTO_COMPLETADO.md                # /   (no se borran sin pedirlo)
│   ├── README_BASE_DATOS.md                  #/
│   └── VARIABLES_ENTORNO.md
│
├── src/
│   ├── vite-env.d.ts                         # (NUEVO, Fase C) tipado de import.meta.env
│   │
│   ├── styles/
│   │   ├── fonts.css
│   │   ├── index.css                          # importa tailwind.css y theme.css
│   │   ├── tailwind.css
│   │   └── theme.css                           # --font-size global (sección 7)
│   │
│   └── app/
│       ├── App.tsx                              # raíz: AuthProvider + RouterProvider
│       ├── routes.tsx                            # todas las rutas de React Router
│       │
│       ├── contexts/
│       │   └── AuthContext.tsx                   # (REESCRITO, Fase B/C) usa lib/api/client.ts
│       │
│       ├── lib/
│       │   ├── mockData.ts                        # vestigial; un solo uso real (fallback
│       │   │                                       # de StatisticsPage.tsx ante error de red)
│       │   └── api/                                # (NUEVO, Fase C — reemplazó api.ts)
│       │       ├── client.ts                        # fetch wrapper, Authorization, refresh
│       │       ├── authAPI.ts
│       │       ├── usuariosAPI.ts
│       │       ├── citasAPI.ts
│       │       ├── historialesAPI.ts
│       │       ├── notasAPI.ts
│       │       ├── practicantesAPI.ts
│       │       ├── recomendacionesAPI.ts
│       │       ├── metricasAPI.ts
│       │       └── index.ts                          # barrel
│       │
│       ├── pages/                                  # 14 páginas, todas enrutadas (sin huérfanas)
│       │   ├── Login.tsx                             # (Fase B: try/catch en handleSubmit)
│       │   ├── Register.tsx
│       │   ├── ForgotPassword.tsx
│       │   ├── PatientDashboard.tsx
│       │   ├── NutritionAdminDashboard.tsx
│       │   ├── PhysiotherapyAdminDashboard.tsx
│       │   ├── NutritionPractitionerDashboard.tsx
│       │   ├── PhysiotherapyPractitionerDashboard.tsx
│       │   ├── MasterAdminDashboard.tsx               # referencia de escala (sección 7)
│       │   ├── NutritionMasterForm.tsx
│       │   ├── PhysiotherapyMasterForm.tsx
│       │   ├── ManagePractitionersPage.tsx
│       │   ├── StatisticsPage.tsx
│       │   └── HojaEvolutiva.tsx
│       │
│       └── components/
│           ├── AppointmentForm.tsx
│           ├── AppointmentManager.tsx
│           ├── MedicalHistoryViewer.tsx
│           ├── NotesViewer.tsx
│           ├── NutritionRecommendations.tsx
│           ├── PatientList.tsx
│           ├── PatientPlans.tsx
│           ├── PractitionerManagement.tsx
│           ├── StatisticsPanel.tsx
│           │
│           └── ui/                                   # 12 archivos vivos (de 45 originales,
│               ├── button.tsx                          # ver sección 6.1 — los otros 33 y
│               ├── card.tsx                             # figma/ImageWithFallback.tsx y
│               ├── badge.tsx                             # NotesManager.tsx se eliminaron)
│               ├── table.tsx
│               ├── dialog.tsx
│               ├── label.tsx
│               ├── select.tsx
│               ├── calendar.tsx
│               ├── textarea.tsx
│               ├── input.tsx
│               ├── tabs.tsx
│               ├── sonner.tsx
│               └── utils.ts                            # función cn(), dependencia común
│
└── utc-api/
    ├── index.js                                  # (REDUCIDO de ~1500 a ~75 líneas, Fase D)
    │                                              # bootstrap: cors, json, monta routers, listen
    ├── db.js                                       # pool único de pg (sin cambios)
    ├── .env / .env.example                          # + JWT_SECRET, JWT_REFRESH_SECRET,
    │                                                # JWT_ACCESS_TTL, CORS_ORIGINS (nuevas)
    │
    ├── migrations/                                  # (NUEVO, Fase B)
    │   └── 001_refresh_tokens.sql                     # ya ejecutada contra Render
    │
    ├── middleware/
    │   └── authMiddleware.js                           # requireAuth (=verifyToken), requireRole,
    │                                                    # requireSameArea, canModifyAppointment,
    │                                                    # signAccessToken, generateRefreshToken, hashToken
    │
    ├── controllers/                                  # (NUEVO, Fase D — toda la lógica que antes
    │   ├── authController.js                            # vivía inline en index.js/authRoutes.js)
    │   ├── usuariosController.js
    │   ├── practicantesController.js
    │   ├── citasController.js
    │   ├── historialesController.js
    │   ├── notasController.js
    │   ├── recomendacionesController.js
    │   └── statsController.js
    │
    ├── routes/                                       # (NUEVO, Fase D — antes solo existía
    │   ├── authRoutes.js                                # authRoutes.js, y con lógica adentro)
    │   ├── usuariosRoutes.js
    │   ├── practicantesRoutes.js
    │   ├── citasRoutes.js
    │   ├── historialesRoutes.js
    │   ├── notasRoutes.js
    │   ├── recomendacionesRoutes.js
    │   └── statsRoutes.js
    │
    └── services/
        ├── emailService.js                             # sin cambios de lógica
        ├── emailTemplates.js                             # sin cambios de lógica
        ├── notificationService.js                          # (NUEVO, Fase D) fachada de canal
        └── scheduledTasks.js                                # (NUEVO, Fase D) cron de practicantes
```

**Cómo leer este árbol:** todo lo marcado `(NUEVO, ...)` no existía antes de esta
sesión. Todo lo marcado `(REESCRITO, ...)` o `(REDUCIDO, ...)` existía pero cambió de
fondo. Lo que no tiene ninguna marca se quedó igual o con cambios menores ya descritos
en las secciones de arriba. Los 33 archivos de `components/ui/`, `NotesManager.tsx`,
`figma/ImageWithFallback.tsx`, las 4 páginas huérfanas, `validacion.tsx`,
`database.config.ts`, `database-schema.sql` y `estructura.txt` (secciones 5 y 6) ya no
aparecen en este árbol porque se eliminaron — si se buscan en el repo, no van a estar.
