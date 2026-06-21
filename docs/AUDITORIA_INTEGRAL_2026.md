# AUDITORÍA INTEGRAL DEL PROYECTO — Sistema Clínico UTC

**Fecha de auditoría:** 19 de junio de 2026
**Autor:** Auditoría técnica asistida (arquitectura React/TypeScript + Express + PostgreSQL)
**Alcance:** Código fuente completo (`src/`, `utc-api/`), esquema de base de datos, documentación (`docs/`), configuración de build y dependencias.
**Naturaleza del documento:** Solo análisis. **No se modificó, refactorizó ni eliminó ningún archivo de código** durante esta auditoría.

> Nota de honestidad: este documento señala vulnerabilidades de seguridad reales y explotables en el estado actual del sistema (no hipotéticas). Si este repositorio es público o va a usarse con datos clínicos reales, la Sección 5 y los hallazgos CRÍTICOS de la Sección 8 deben tratarse como prioridad inmediata, no como trabajo futuro de tesis.

---

## RESUMEN EJECUTIVO

El proyecto es un sistema de gestión clínica universitaria (citas, historiales, nutrición, fisioterapia) compuesto por:

- **Frontend:** React 19 + TypeScript + Vite + Tailwind v4 + un kit de componentes estilo shadcn/ui (Radix UI) + Material UI parcialmente.
- **Backend:** Node.js + Express, prácticamente monolítico en un único archivo `utc-api/index.js` de **1555 líneas**.
- **Base de datos:** PostgreSQL (alojado en Render), accedido vía `pg.Pool` sin ORM ni capa de migraciones versionada.
- **Autenticación:** Esquema propio (no JWT, no sesiones de Express, no cookies) basado en bcrypt + un header HTTP `email` que el cliente envía en cada petición.
- **Correo:** Doble proveedor (Nodemailer/Gmail y Resend) con selección dinámica por dominio.

El sistema funciona y tiene partes bien resueltas (consultas parametrizadas en toda la capa SQL, separación de roles a nivel de UI, migración progresiva de contraseñas en texto plano a bcrypt). Pero tiene **3 problemas estructurales que dominan el resto del diagnóstico**:

1. **El modelo de autenticación no autentica.** La "sesión" es un email sin firmar que el navegador reenvía; combinado con varios endpoints sin protección, esto permite suplantar a cualquier usuario, incluido `master`, sin contraseña.
2. **Duplicación masiva por especialidad.** Nutrición y Fisioterapia están implementadas como pares de archivos casi idénticos (dashboards, formularios maestros, tablas de historiales) en lugar de un componente/esquema parametrizado. Esto ya causó al menos un bug funcional crítico real (ver 3.3).
3. **Deriva de documentación.** Los tres artefactos que deberían describir la base de datos (`database-schema.sql`, `src/app/lib/database.config.ts`, `docs/*.md`) describen una arquitectura Supabase/UUID que **fue abandonada** y no corresponde a la base de datos real que usa `utc-api/index.js` (Postgres en Render, IDs seriales, nombres de tabla en español). Cualquier persona nueva (incluido un comité de tesis) que lea `docs/` se forma un modelo mental incorrecto del sistema.

---

## 1. ARQUITECTURA ACTUAL — MAPA DEL SISTEMA

### 1.1 Vista de capas

```
┌─────────────────────────────────────────────────────────────────────┐
│  FRONTEND (Vite + React 19 + TS)                  src/app/          │
│                                                                       │
│  App.tsx ──▶ AuthProvider (contexts/AuthContext.tsx)                │
│           └─▶ RouterProvider (routes.tsx, createBrowserRouter)       │
│                                                                       │
│  routes.tsx                                                          │
│   ├─ /login, /register, /forgot-password   (públicas)               │
│   ├─ /dashboard ── ProtectedRoute ── DashboardRouter (switch rol/área)│
│   │      ├─ master      → MasterAdminDashboard                       │
│   │      ├─ paciente    → PatientDashboard                            │
│   │      ├─ practicante → Nutrition|Physiotherapy PractitionerDash.  │
│   │      └─ admin       → Nutrition|Physiotherapy AdminDashboard     │
│   ├─ /forms/{nutricion|fisioterapia}/:appointmentId → *MasterForm     │
│   ├─ /historial/:id/:area , /medical-history-viewer/:patientId        │
│   ├─ /estadisticas, /administrar-practicantes, /hoja-evolutiva/:id    │
│                                                                       │
│  lib/api.ts        → authAPI (solo flujo de auth, ver 3.2)           │
│  lib/database.config.ts → MUERTO, ver 2 y 4                          │
│  lib/mockData.ts   → constantes/tipos heredados, parcialmente vivo    │
│  components/ui/*   → ~50 primitivas estilo shadcn/ui (Radix-based)    │
└─────────────────────────────────────────────────────────────────────┘
                              │  fetch() — 75 llamadas con URL
                              │  "http://localhost:3001" hardcodeada
                              │  en 26 archivos distintos (ver 2.4)
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  BACKEND (Express)                               utc-api/            │
│                                                                       │
│  index.js (1555 líneas) ── monolito con ~60 rutas inline             │
│   ├─ app.use('/api/auth', authRoutes)     (login, validate-session)  │
│   ├─ /api/auth/pre-register, verify-and-register, forgot-password,   │
│   │   resend-code, verify-reset-code, reset-password,                │
│   │   validate-session (duplicada, ver 3.1)                          │
│   ├─ /api/usuarios, /api/practicantes      (CRUD usuarios/roles)     │
│   ├─ /api/citas (+ disponibilidad, asignar)                          │
│   ├─ /api/historiales, /historiales-nutricion, /historiales-fisioterapia│
│   ├─ /api/notas-evolucion, /api/notas_universitarias                 │
│   ├─ /api/recomendaciones                                            │
│   ├─ /api/stats/dashboard, /api/logs                                 │
│   └─ setInterval() interno para desactivación automática de cuentas  │
│                                                                       │
│  middleware/authMiddleware.js → requireAuth, requireRole,             │
│                                  requireSameArea, canModifyAppointment │
│  routes/authRoutes.js         → router separado SOLO para login y     │
│                                  validate-session (duplica index.js)  │
│  services/emailService.js     → enviarCorreo / reenviarCorreo         │
│  services/emailTemplates.js   → 2 plantillas HTML (OTP, recuperación) │
│  db.js                        → pool pg único, reinstanciado 3 veces  │
│                                  en distintos archivos (ver 2.3)      │
└─────────────────────────────────────────────────────────────────────┘
                              │  pg.Pool (SSL, sin verificación de cert)
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  PostgreSQL (Render) — esquema real, inferido del código (sección 4) │
│  usuarios · registro_temporal · password_resets · correos_especiales │
│  citas · historiales_medicos · historiales_nutricion ·               │
│  historiales_fisioterapia · notas_universitarias · notas_evolucion · │
│  practicantes_autorizados (legacy) · metricas · logs_sistema ·       │
│  recomendaciones_nutricion                                            │
│                                                                       │
│  ⚠ Ninguna de estas tablas está definida en un script SQL versionado │
│  que coincida con la realidad (ver sección 4.1).                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 Patrón de autenticación actual (resumen, detalle en sección 5)

No hay JWT, no hay cookies de sesión, no hay `express-session`. El flujo es:

1. `POST /api/auth/login` (en `authRoutes.js`) compara `password` con bcrypt y devuelve el **objeto de usuario completo** (incluido el hash bcrypt, sin proyección de columnas).
2. El frontend guarda ese objeto en `localStorage['utc_current_user']` (`AuthContext.tsx:229-236`).
3. En cada carga de la app, `AuthContext` llama `GET /api/auth/validate-session` enviando el email guardado como **header HTTP** `email`.
4. Cualquier ruta backend protegida usa `requireAuth` (`authMiddleware.js:22-85`), que **vuelve a leer ese mismo header `email`** y carga al usuario de la base de datos sin verificar nada más (ni firma, ni contraseña, ni expiración real del lado servidor).

Esto es la raíz de los hallazgos críticos de la sección 5.

### 1.3 Sistema de correo (resumen, detalle en sección 7)

`emailService.js` decide entre **Resend** (proveedor por defecto) y **Nodemailer/Gmail** consultando la tabla `correos_especiales`, que mapea dominios de correo "no públicos" (institucionales) a `nodemailer`. La lógica de detección de dominio está duplicada entre `emailService.js` y `index.js` (sección 7.2).

### 1.4 Stack y procedencia

`vite.config.ts:8-9` contiene el comentario *"The React and Tailwind plugins are both required for Make"* — esto, sumado a la presencia de `src/app/components/figma/ImageWithFallback.tsx` y ~40 componentes UI genéricos sin usar, indica que el proyecto fue **arrancado desde una plantilla generada por una herramienta IA de app-building tipo Figma-to-code ("Make")** y luego personalizado con la lógica de negocio real (en español, con convenciones propias). Esto explica casi todo el código muerto de la sección 2.

---

## 2. ARCHIVOS Y CÓDIGO NO UTILIZADOS

Confianza: **Alta** = verificado por ausencia total de imports/referencias en todo `src/`. **Media** = sin referencias encontradas pero requiere confirmación manual (posible carga dinámica o uso futuro). **Baja** = sospecha basada en patrón, no en ausencia confirmada.

### 2.1 Páginas completas sin ninguna ruta ni import (confianza ALTA)

| Archivo | Líneas | Evidencia |
|---|---|---|
| `src/app/pages/MasterDashboard.tsx` | 466 | No aparece en `routes.tsx` ni es importado por ningún otro `.tsx`. Coexiste con `MasterAdminDashboard.tsx`, que sí es la versión usada en rutas. |
| `src/app/pages/ManageAdminPage.tsx` | 438 | Cero imports en todo el repo. Curiosamente, `MasterAdminDashboard.tsx:51` declara `export default function ManageAdminPage()` — es decir, el archivo que SÍ se usa tiene el nombre de función de este archivo huérfano, prueba de que `MasterAdminDashboard.tsx` nació de copiar `ManageAdminPage.tsx`. |
| `src/app/pages/AdminDashboard.tsx` | 123 | Cero imports. Importa `AppointmentManager` pero nada lo importa a él. Sustituido por `NutritionAdminDashboard.tsx` / `PhysiotherapyAdminDashboard.tsx`. |
| `src/app/pages/PractitionerDashboard.tsx` | 169 | Cero imports. Sustituido por las variantes `Nutrition/PhysiotherapyPractitionerDashboard.tsx`. |

**Subtotal: 1196 líneas de páginas completas que no se ejecutan nunca.**

### 2.2 Componentes sin ningún import (confianza ALTA)

| Archivo | Líneas | Nota |
|---|---|---|
| `src/app/components/appointment-calendar.tsx` | 320 | Único archivo del proyecto en *kebab-case* (resto usa PascalCase) — refuerza que es un remanente de otra iteración. Reemplazado por `AppointmentForm.tsx` + `AppointmentManager.tsx` (estos sí están enlazados, ver 3). |
| `src/app/components/PatientSchedule.tsx` | 268 | No importado por `PatientDashboard.tsx` ni por nadie; el dashboard de paciente usa `AppointmentForm` directamente. |

### 2.3 Archivos de "documentación ejecutable" muertos o engañosos (confianza ALTA)

| Archivo | Estado |
|---|---|
| `src/app/lib/database.config.ts` (477 líneas) | No lo importa ningún archivo de `src/`. Contiene un `SQL_SCHEMA` y un `EXAMPLE_API_CODE` de ejemplo que **no coinciden con el backend real** (ver sección 4). Es código que nunca se ejecuta pero que un desarrollador puede confundir con la fuente de verdad. |
| `database-schema.sql` (raíz, 504 líneas) | Describe un esquema Supabase con RLS y UUIDs que fue **abandonado**. No se ejecuta contra la base real. |
| Los 7 archivos de `docs/*.md` | Todos describen el setup de **Supabase** (`DATABASE_SETUP.md`, `GUIA_USO_SUPABASE.md`, `DIAGRAMA_BASE_DATOS.md`, `VARIABLES_ENTORNO.md`, etc.). Ninguno menciona Render, Express propio, ni las tablas reales (`registro_temporal`, `historiales_nutricion`, `metricas`, etc.). Es documentación de una arquitectura previa que ya no existe. |
| `estructura.txt` (raíz, **77 011 líneas**, trackeado en git) | Volcado de `tree` de Windows (codificado en UTF-16, se ve corrupto si se abre como UTF-8). No aporta valor y pesa el repositorio innecesariamente. |

### 2.4 Dependencias declaradas en `package.json` sin ninguna referencia en `src/` (confianza ALTA — verificado por grep de imports)

| Paquete | Uso encontrado |
|---|---|
| `xlsx` | Ninguno. `exceljs` + `file-saver` ya cubren la exportación real en `StatisticsPanel.tsx`. Duplicidad de propósito. |
| `react-dnd`, `react-dnd-html5-backend` | Ninguno. |
| `react-slick` | Ninguno. |
| `react-responsive-masonry` | Ninguno. |
| `@tiptap/react`, `@tiptap/starter-kit` | Ninguno (editor de texto enriquecido nunca integrado). |
| `motion` | Ninguno. |
| `next-themes` | Ninguno (no hay modo oscuro implementado). |
| `react-popper`, `@popperjs/core` | Ninguno directo (Radix UI no depende de estos paquetes para posicionamiento). |

Estas 11 dependencias (más sus subdependencias) inflan `node_modules`, el tiempo de `npm install` y la superficie de auditoría de seguridad de la cadena de suministro, sin aportar funcionalidad.

### 2.5 Anomalía de empaquetado (confianza ALTA)

`utc-api/package.json:15` declara como dependencia de producción:
```json
"node": "^26.3.0",
```
`node` **no debe declararse como dependencia npm**: existe un paquete huérfano llamado literalmente `node` en el registro de npm (no es el runtime). Esto es casi con certeza un error de tecleo (se quiso fijar la versión del motor en `engines`, no añadir una dependencia). Es inocuo hoy, pero es una señal de que el `package.json` del backend no se revisa con cuidado.

Adicionalmente, **`react`, `react-dom` y `typescript` no están declarados ni en `dependencies` ni en `devDependencies`** del `package.json` raíz (verificado: cero coincidencias). Compilan y funcionan hoy solo porque otras dependencias (`react-router`, `@mui/material`, `@radix-ui/*`, `@vitejs/plugin-react`) los traen como dependencias transitivas/peer y el gestor de paquetes los resuelve "por accidente". Este es el hallazgo de empaquetado más serio del proyecto (ver sección 8, CRÍTICO).

### 2.6 Código muerto a nivel de ruta backend

Ver sección 3.1 — la ruta `GET /api/auth/validate-session` definida en `index.js:577-649` es inalcanzable: Express ya resuelve esa URL en `routes/authRoutes.js:96-143` porque el router se monta antes (`index.js:32`). Son **73 líneas muertas** que nadie ejecuta jamás, y que however podrían confundir a quien edite una sin saber que existe la otra.

### 2.7 Lo que parece muerto pero NO lo está (para no sobre-actuar)

- `src/app/lib/mockData.ts` (599 líneas): sigue siendo importado por 7 archivos (`MasterAdminDashboard`, `StatisticsPage`, `ManageAdminPage` *— este último está huérfano, ver 2.1, así que ese import específico sí es muerto—*, `PractitionerDashboard` *— también huérfano—*, `NotesManager`, `App.tsx`). Confianza **media**: probablemente solo se usan sus *interfaces* TypeScript y algunas constantes, no los datos mock en sí (`App.tsx` llama `initializeMockData()` en cada carga, lo que sugiere que todavía siembra `localStorage` con datos de prueba incluso en producción — revisar si esto es intencional).
- `PractitionerManagement.tsx`: parecía candidato a duplicado de `ManagePractitionersPage.tsx`, pero se confirmó que es un **componente** (no página) usado dentro de ambos dashboards de admin (`NutritionAdminDashboard.tsx:36`, `PhysiotherapyAdminDashboard.tsx:33`). No es código muerto.

---

## 3. RUTAS Y ENDPOINTS

### 3.1 Duplicados y rutas inalcanzables (backend)

| Hallazgo | Ubicación | Severidad |
|---|---|---|
| `GET /api/auth/validate-session` definida dos veces | `authRoutes.js:96` (vigente) y `index.js:577` (muerta, inalcanzable por orden de montaje) | Importante — confunde mantenimiento, riesgo de editar la copia equivocada |
| `GET /api/historiales-nutricion/detalle/:appointmentId` definida **dos veces de forma idéntica** | `index.js:1132` y `index.js:1163` | **Crítico — ver 3.3** |

### 3.2 `api.ts` no es realmente la API centralizada que dice ser

`src/app/lib/api.ts` define `endpoints.usuarios`, `endpoints.citas`, `endpoints.historiales`, `endpoints.notas`, `endpoints.practicantes` como strings base — pero **ningún componente del proyecto los usa**. Solo el sub-objeto `authAPI` (login, registro, recuperación de contraseña) se usa de forma centralizada. El resto del frontend (citas, historiales, notas, practicantes, estadísticas, recomendaciones, hoja evolutiva) hace `fetch('http://localhost:3001/api/...')` **directamente y por duplicado en 26 archivos distintos (75 ocurrencias)**.

Consecuencia práctica: cambiar el dominio/puerto del backend para producción exige editar manualmente 26 archivos en vez de una constante. Esto es bloqueante para cualquier despliegue real sin antes refactorizar.

### 3.3 Bug funcional crítico confirmado: el visor de Fisioterapia carga datos de Nutrición (o nada)

- Frontend, `PhysiotherapyMasterForm.tsx:46`: hace `fetch('.../api/historiales-fisioterapia/detalle/${appointmentId}')`.
- Backend: **no existe ninguna ruta con ese path.** Las dos únicas definiciones (`index.js:1132` y `1163`) apuntan literalmente a `/api/historiales-nutricion/detalle/:appointmentId` y consultan la tabla `historiales_nutricion` en ambos casos — la segunda, que por su comentario (`/** ENDPOINT: Obtener datos específicos de un historial de FISIOTERAPIA */`) debía apuntar a `historiales_fisioterapia`, es una copia-pega sin terminar de corregir.
- **Efecto real:** cualquier intento del frontend de fisioterapia de recuperar el detalle de un historial guardado por `appointment_id` recibe un `404` de Express (ninguna ruta coincide con `/api/historiales-fisioterapia/detalle/...`). El auto-rellenado de formularios de fisioterapia para citas ya atendidas **está roto en producción tal como está el código hoy.**
- Causa raíz: la duplicación de tablas por especialidad (`historiales_nutricion` / `historiales_fisioterapia`) en vez de una tabla con discriminador `tipo` (que de hecho ya existe en `historiales_medicos`) multiplicó el código y permitió que las dos copias divergieran sin que nada lo detectara (no hay tests).

### 3.4 Endpoints sin autenticación que exponen datos sensibles

Ver inventario completo cruzado con seguridad en la sección 5.2 — se listan aquí solo a título de "endpoint huérfano de protección", no de explotación:

- `GET /api/usuarios`, `GET /api/usuarios/:id` — sin middleware.
- `GET /api/citas`, `GET /api/citas/paciente/:id` — sin middleware.
- `GET /api/historiales-nutricion/paciente/:id`, `GET /api/historiales-fisioterapia/paciente/:id` — sin middleware.
- `POST /api/historiales` (crear historial clínico) — sin middleware.
- `POST /api/practicantes` (crear cuenta de practicante) — sin middleware.
- `PUT /api/practicantes/:id` — sin middleware (además opera sobre la tabla `practicantes_autorizados`, que parece legacy, ver 4.2).
- `GET /api/logs` — sin middleware.
- `GET /api/historiales/verificar/:pacienteId/:area` — sin middleware.

### 3.5 Endpoints con autenticación pero sin autorización por rol/propiedad (IDOR)

- `PUT /api/citas/:id` (`index.js:992`) — tiene `requireAuth` pero no verifica que el solicitante sea dueño de la cita ni su rol; cualquier usuario autenticado (incluido un paciente) puede reprogramar la cita de otro paciente cambiando el `:id` en la URL.
- `POST /api/citas` (`index.js:960`) — el rol `paciente` está permitido, pero `paciente_id` se toma tal cual del body sin compararlo con `req.user.id`.
- `PUT /api/historiales/:id` (`index.js:1101`) — solo `requireAuth`, sin `requireRole`; un paciente autenticado podría sobrescribir el contenido de cualquier historial clínico por ID.
- `POST/GET /api/recomendaciones*` (`index.js:1523`, `1541`) — solo `requireAuth`; un paciente puede leer las recomendaciones nutricionales de **cualquier otro paciente** cambiando el `:id`, y puede escribir una recomendación adjudicándose cualquier `creado_por_id`.
- `GET/POST/PUT /api/notas-evolucion*` — solo `requireAuth`, sin verificar propiedad de la cita ni rol.

### 3.6 Endpoints duplicados en frontend (rutas de React Router)

`routes.tsx:176-192` define dos rutas distintas que renderizan el mismo componente `MedicalHistoryViewer`: `/historial/:id/:area` y `/medical-history-viewer/:patientId`. El propio comentario en el código (`"Mantén esta también por si algún componente usa el nombre largo"`) confirma que es deuda intencional, no un error — pero sigue siendo redundancia que conviene resolver eligiendo una única convención de URL.

---

## 4. BASE DE DATOS

### 4.1 La fuente de verdad real vs. la documentada

El esquema **real** (inferido exclusivamente de las consultas SQL en `utc-api/index.js`, `emailService.js` y `authMiddleware.js`, porque no existe un script DDL versionado que lo describa) usa estas tablas:

| Tabla | Rol | Observaciones |
|---|---|---|
| `usuarios` | Usuarios de los 4 roles (paciente/practicante/admin/master) | Columnas inferidas: `id` (serial), `nombre`, `email`, `password` (bcrypt), `rol`, `area`, `status`, `telefono`, `matricula`, `primer_inicio`, `fecha_creacion`. |
| `registro_temporal` | Holding de pre-registro con OTP | `email` único (usa `ON CONFLICT(email)`), `password_hash`, `codigo_verificacion`, `expira_en`. |
| `password_resets` | Holding de recuperación de contraseña | Igual patrón que la anterior. |
| `correos_especiales` | Enrutamiento de proveedor de correo por dominio | `dominio`, `proveedor`, `origen`. |
| `citas` | Citas médicas | `paciente_id` (FK a `usuarios`), `paciente_nombre` (denormalizado), `tipo`, `fecha`, `hora`, `estado`, `practicante_id`, `practicante_nombre`, `fecha_asignacion`. |
| `historiales_medicos` | Tabla "genérica" original | Aún consultada por `GET /api/historiales`, en paralelo a las dos siguientes. |
| `historiales_nutricion` | Historial clínico de nutrición | `appointment_id`, `datos` (JSONB), `duracion_carga`, `timestamp_inicio`. |
| `historiales_fisioterapia` | Historial clínico de fisioterapia | Mismo shape que la anterior. |
| `notas_universitarias` | Comunicados internos | `categoria`, `destinatario_especifico`, `respuesta`, `fecha_respuesta`. |
| `notas_evolucion` | Hoja de evolución por cita | `numero_expediente`, `edad`, `cuadro_evolucion` (JSON), `area`. |
| `practicantes_autorizados` | **Probable legacy** | Solo referenciada por el endpoint sin protección `PUT /api/practicantes/:id`; la gestión real de practicantes ya vive en `usuarios.rol='practicante'` + `usuarios.status`. |
| `metricas` | Eventos de telemetría interna | `tipo_evento`, `area`, `paciente_id`, `valor_numerico`, `metadata` (JSONB). Crece sin política de retención visible. |
| `logs_sistema` | Logs de error/sistema | `tipo`, `descripcion`, `metadata`, `fecha`. |
| `recomendaciones_nutricion` | Recomendaciones por paciente | `creado_por_id`, `area`. |

**Esto no coincide con ninguno de los tres documentos que el repositorio presenta como "el esquema":**
- `database-schema.sql` (raíz): tablas en inglés (`users`, `appointments`, `medical_histories`, `notes`, `practitioners`), PKs `UUID`, políticas RLS con `auth.uid()` — modelo Supabase nunca usado en producción real.
- `src/app/lib/database.config.ts`: otro esquema de ejemplo (más cercano al real en nombres, pero sin `registro_temporal`, `password_resets`, `correos_especiales`, `historiales_nutricion/fisioterapia`, `notas_evolucion`, `metricas`, `logs_sistema`, `recomendaciones_nutricion` — es decir, le faltan **9 de las 14 tablas reales**).
- `docs/*.md`: instrucciones completas para Supabase, tecnología que el backend actual no usa en absoluto.

**Riesgo:** no existe en el repositorio un script reproducible para recrear la base de datos real. Si la instancia de Render se pierde o hay que mover el proyecto a un nuevo entorno (oral de tesis, otro servidor, otro desarrollador), no hay manera de regenerar el esquema desde el código versionado.

### 4.2 Relaciones y normalización

- **Denormalización extendida sin invalidación.** `paciente_nombre`, `practicante_nombre`, `creado_por_nombre`, `nombre_completo` se copian como texto en `citas`, `historiales_*`, `notas_evolucion`, `recomendaciones_nutricion` en vez de resolverse por `JOIN` a `usuarios`. Esto ya es inconsistente con la funcionalidad existente: `PATCH /api/usuarios/:id` (`index.js:695`) permite editar `nombre`, pero **no hay ninguna lógica que propague ese cambio** a los registros históricos que ya guardaron el nombre antiguo. Resultado: un paciente que corrija su nombre verá nombres distintos en su perfil, sus citas pasadas y sus historiales.
- **Tablas paralelas por especialidad en vez de un discriminador.** `historiales_nutricion` y `historiales_fisioterapia` son estructuralmente idénticas salvo el nombre. La tabla `historiales_medicos` original ya tenía una columna `tipo` con `CHECK (tipo IN ('nutricion','fisioterapia'))` pensada exactamente para evitar esta duplicación — el sistema evolucionó hacia tablas separadas de todas formas, lo cual es la causa raíz del bug crítico de la sección 3.3.
- **Sin claves foráneas verificables para las tablas nuevas.** No hay un script DDL que confirme que `historiales_nutricion.paciente_id`, `notas_evolucion.practicante_id`, `metricas.paciente_id`, etc. tengan `REFERENCES usuarios(id)`. Si no las tienen (no se puede confirmar sin acceso directo a la base), se pierde integridad referencial: una cita o historial podría quedar huérfano (`paciente_id` apuntando a un usuario eliminado) sin que la base de datos lo impida.
- **Doble mecanismo de "estado de practicante".** `usuarios.status` (gestionado con autenticación correcta en `PUT /api/usuarios/:id`) coexiste con `practicantes_autorizados.estado` (gestionado sin autenticación en `PUT /api/practicantes/:id`). Es ambigüedad de fuente de verdad además de hueco de seguridad.
- **Inconsistencia de nombres `status` (inglés) vs. `estado` (español)** entre `usuarios` y `citas` respectivamente — menor, pero afecta legibilidad y propensión a errores al escribir queries nuevas.

### 4.3 Riesgos de escalabilidad

- `metricas` y `logs_sistema` se insertan en casi cada operación (cada cita creada/cancelada/reagendada, cada historial guardado) sin política de archivado, particionado ni TTL. A mediano plazo estas tablas crecerán más rápido que las operativas y degradarán el rendimiento de `GET /api/stats/dashboard`, que hace 5 `COUNT`/`AVG` secuenciales sobre toda la tabla `metricas` (`index.js:1478-1499`) sin filtros de fecha.
- El job de desactivación automática de practicantes (`index.js:155-184`) corre con `setInterval(fn, 60000)` **dentro del proceso de la API**, comparando la hora exacta `"00:38"` con `===`. Si el proceso se reinicia justo en ese minuto, o si hay más de una instancia del backend corriendo (escalado horizontal, típico en producción), la tarea puede no ejecutarse nunca o ejecutarse múltiples veces. No es un cron real ni usa `pg_cron`/un scheduler externo — no escala más allá de una sola instancia del proceso Node.
- Los campos JSONB (`datos`, `cuadro_evolucion`) no tienen ninguna validación de forma en la capa de aplicación: el backend hace `JSON.stringify(datos)` sin verificar su estructura antes de guardarlo. Esto es flexible pero acumula deuda de calidad de datos a medida que los formularios del frontend cambian de forma con el tiempo.

---

## 5. SEGURIDAD

### 5.1 Vulnerabilidad crítica: el sistema completo puede ser comprometido sin contraseña

Cadena de explotación verificada leyendo el código (no se ejecutó contra ningún servidor real):

1. `GET /api/usuarios` (`index.js:651`) **no tiene middleware de autenticación**. Devuelve `SELECT *` de la tabla `usuarios` completa — es decir, **id, nombre, email, rol, área, status y el hash de contraseña bcrypt de cada usuario del sistema**, incluidos los roles `admin` y `master`.
2. El "login por sesión" del resto del sistema (`requireAuth`, `authMiddleware.js:22-85`, y `GET /api/auth/validate-session`) **no valida contraseña ni token alguno**: solo lee el header HTTP `email` y carga al usuario correspondiente de la base de datos. Quien envíe ese header se autentica como ese usuario.
3. `app.use(cors())` (`index.js:30`) está configurado **sin restricción de origen** — cualquier sitio web, no solo el frontend oficial, puede llamar a la API desde el navegador de una víctima o directamente vía script.
4. **Conclusión:** cualquier persona con acceso a la API (no se necesita estar autenticado) puede listar todos los usuarios con el paso 1, elegir el email de un `master`, y enviar ese email como header en cualquier endpoint protegido por `requireAuth`/`requireRole` para operar con privilegios totales — crear/eliminar usuarios, modificar citas, leer historiales clínicos de cualquier paciente, etc. **No se requiere conocer ninguna contraseña.**

Esto no es un riesgo teórico de diseño: es una cadena de pasos ejecutable hoy contra el código tal como está.

### 5.2 Exposición de información sensible (PHI) sin autenticación

Endpoints que devuelven datos clínicos o personales sin ningún middleware (detalle de ubicaciones en sección 3.4):
- Listado completo de usuarios con hash de contraseña (`GET /api/usuarios`, `GET /api/usuarios/:id`).
- Todas las citas de todos los pacientes (`GET /api/citas`), y por paciente individual vía ID secuencial (`GET /api/citas/paciente/:id`).
- Historiales clínicos de nutrición y fisioterapia por paciente (`GET /api/historiales-nutricion/paciente/:id`, `GET /api/historiales-fisioterapia/paciente/:id`) — esto es información de salud, la categoría de dato más sensible que maneja el sistema.
- Creación de historiales clínicos completos (`POST /api/historiales`) sin autenticación.
- Creación de cuentas de practicante (`POST /api/practicantes`) sin autenticación, con contraseña temporal **predecible**: `UTC${matricula}` (`index.js:778`). Si la matrícula de un estudiante es conocida o se puede adivinar/enumerar, su contraseña inicial también lo es.
- Logs internos del sistema (`GET /api/logs`).

### 5.3 Secretos expuestos en el historial de git (CRÍTICO, acción inmediata recomendada)

Se confirmó que `utc-api/.env` **fue commiteado** en commits anteriores del repositorio (`87017421`, `24ffe8ca`) antes de ser añadido a `.gitignore` y eliminado del árbol actual (commit `e5c22a8e`, *"Se elimina la basura"*). El archivo histórico contiene, entre otras, las claves: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `RESEND_API_KEY`.

El repositorio tiene como remoto `https://github.com/Daiv3d/clinica_online.git`. **Eliminar el archivo del working tree no elimina los valores del historial de git** — siguen recuperables con `git show 87017421:utc-api/.env` por cualquiera que tenga (o haya tenido) acceso de lectura al repositorio, o por cualquier clon/fork ya existente.

**Recomendación inmediata, independiente del resto de esta auditoría:** rotar ya las credenciales de la base de datos en Render y la API key de Resend, y considerar reescribir el historial de git (`git filter-repo` o BFG Repo-Cleaner) si el repositorio fue o es público.

### 5.4 Otras debilidades de autenticación/registro

- **Códigos OTP de 6 dígitos sin límite de intentos.** `pre-register`, `forgot-password` y `resend-code` generan un código numérico de 6 cifras válido 15 minutos, pero ningún endpoint de verificación (`verify-and-register`, `verify-reset-code`) limita los intentos fallidos ni aplica backoff/rate limiting. Es factible un ataque de fuerza bruta (1 millón de combinaciones máximo, sin captcha ni límite de peticiones) dentro de la ventana de 15 minutos.
- **Migración automática de contraseñas en texto plano.** `authRoutes.js:39-57` compara `usuario.password === password` en texto plano antes de intentar bcrypt, y si coincide, migra automáticamente a bcrypt. Es una estrategia de migración razonable a corto plazo, pero implica que **hoy mismo pueden existir filas con contraseñas en texto plano** en la tabla `usuarios` (los datos semilla de los documentos de ejemplo usan `admin123`, `prac123`, `pac123`). Mientras no se complete la migración, cualquier acceso de lectura a la base expone contraseñas reales, no solo hashes.
- **Validación de complejidad de contraseña solo en el cliente.** `Register.tsx:20-28` y `ForgotPassword.tsx:28-34` calculan los requisitos (mayúscula, número, símbolo, 8+ caracteres) en React, pero el backend (`pre-register`, `reset-password`) acepta cualquier contraseña sin volver a validarla. Quien llame a la API directamente (sin pasar por el formulario) puede establecer una contraseña vacía o trivial.
- **Bug funcional en el flujo de login.** `AuthContext.tsx:242-250`: la función `login()` hace `return Promise.reject(error)` cuando falla. `Login.tsx:38-46` la consume así: `const success = await login(email, password); if (success) {...} else { setError(...) }` — **sin `try/catch`**. Cuando el login falla, `await login(...)` lanza una excepción no capturada dentro de `handleSubmit`; la rama `else` (que setea el mensaje de error visible) nunca se ejecuta. El usuario no ve ningún mensaje de error ante credenciales incorrectas, solo un fallo silencioso (visible como `unhandled promise rejection` en la consola del navegador). Es un bug de UX/manejo de errores, no de seguridad, pero es 100% reproducible leyendo el código.
- **CORS abierto sin alternativa de configuración por entorno.** `app.use(cors())` no distingue entre desarrollo y producción; no hay variable de entorno para restringir orígenes.
- **Conexión a PostgreSQL con `ssl: { rejectUnauthorized: false }`** (repetido en `db.js`, `authMiddleware.js`, `authRoutes.js` — ver también 7.3 sobre triple instanciación del pool). Esto deshabilita la verificación del certificado TLS del servidor de base de datos, abriendo la puerta a un ataque de intermediario (MITM) si el tráfico de red entre el backend y Render fuera interceptado. Es una práctica común para evitar errores de certificado autofirmado, pero sacrifica la garantía que SSL debería dar.

### 5.5 Lo que sí está bien hecho (para no perder de vista lo positivo)

- **Inyección SQL: no se encontró ningún caso real.** Todas las consultas usan parámetros (`$1, $2...`); los únicos lugares con interpolación de strings en SQL (nombre de tabla según `tipo`/`area` en `index.js:1083-1118`) están restringidos mediante un operador ternario a exactamente dos valores fijos, no a la variable cruda del usuario — mitiga el riesgo hoy, aunque es un patrón frágil si en el futuro alguien simplifica ese ternario a una variable directa.
- **Contraseñas con bcrypt** (costo 10) para todo lo nuevo, con migración progresiva de lo antiguo.
- **Separación de roles a nivel de UI** coherente y consistente con los 4 roles del dominio (`paciente`, `practicante`, `admin`, `master`).

---

## 6. JWT — ANÁLISIS Y PLAN DE MIGRACIÓN GRADUAL (NO IMPLEMENTADO)

### 6.1 Diagnóstico de partida

- No existe `jsonwebtoken` ni ninguna librería de tokens en `utc-api/package.json` — es punto de partida limpio, sin nada que retirar primero.
- El "estado de sesión" hoy vive en 3 lugares distintos y no sincronizados: `localStorage` del navegador, el header `email` que se reenvía en cada petición, y la tabla `usuarios` (consultada en cada petición para revalidar). Cualquier plan de JWT debe sustituir los tres a la vez o mantener una vía de compatibilidad mientras dura la migración.

### 6.2 Diseño propuesto (gradual, sin romper el frontend de golpe)

**Fase A — Emisión de JWT en paralelo, sin retirar el header `email` (compatibilidad):**
- En `POST /api/auth/login` y `POST /api/auth/verify-and-register`, además de devolver el usuario, firmar un **access token** JWT (`jsonwebtoken`, HS256 con secreto en variable de entorno, expiración corta: 15–30 min) con el payload mínimo `{ sub: usuario.id, rol, area }` — nunca el password ni datos sensibles.
- Emitir además un **refresh token** de vida más larga (7–14 días), aleatorio (no necesariamente JWT), persistido en una nueva tabla `refresh_tokens` (`usuario_id`, `token_hash`, `expira_en`, `revocado`) para poder invalidarlo (logout real, cambio de contraseña, robo de dispositivo).
- El frontend guarda el access token en memoria (no en `localStorage`, para reducir exposición a XSS) y el refresh token en una cookie `httpOnly` + `Secure` + `SameSite=Strict` si el backend y frontend comparten dominio raíz, o en `localStorage` solo como solución transicional si no.

**Fase B — Nuevo middleware en paralelo al actual:**
- `verifyToken.js`: lee `Authorization: Bearer <token>`, verifica firma y expiración, adjunta `req.user = { id, rol, area }` (sin tocar la base de datos en cada petición — ésa es la mejora real de rendimiento frente al `requireAuth` actual, que hace un `SELECT` por cada petición).
- `requireRole(roles)`: idéntico en interfaz al actual (`authMiddleware.js`), pero leyendo `req.user` poblado por `verifyToken` en vez de por una consulta SQL repetida.
- Mantener `requireAuth` (el basado en header `email`) **funcionando en paralelo** durante la transición, pero loggeando cada vez que se use, para medir cuántos clientes siguen en el esquema viejo.

**Fase C — Migración endpoint por endpoint:**
- Empezar por los endpoints sin protección hoy (sección 3.4/5.2) — son los de mayor riesgo y los que menos clientes activos tienen integrados, por lo que el cambio de contrato es más barato.
- Seguir por los endpoints con `requireAuth` simple, añadiendo verificación de propiedad (IDOR, sección 3.5) en el mismo cambio, ya que se está tocando el middleware de todas formas.
- Dejar para el final el flujo de login/registro/recuperación (el más usado, el de mayor impacto si algo se rompe).

**Fase D — Frontend:**
- `AuthContext.tsx` pasa a guardar `{ accessToken, user }` en memoria + el refresh en cookie/localStorage según lo decidido en Fase A; añadir un interceptor centralizado (idealmente en el momento en que se construya el cliente HTTP único de la sección 3.2) que adjunte `Authorization: Bearer` a cada petición y que, ante un `401`, intente un refresh silencioso antes de redirigir a `/login`.
- `ProtectedRoute`/`DashboardRouter` en `routes.tsx` no cambian de lógica, solo la fuente del rol (ya no viene de `localStorage` sin firmar, sino del payload del JWT ya verificado).

**Fase E — Retirada del esquema antiguo:**
- Eliminar `requireAuth`/`requireSameArea`/`canModifyAppointment` basados en header `email`, el endpoint duplicado `validate-session`, y la lectura de usuario completo desde `localStorage`.
- Forzar `Access-Control-Allow-Origin` a una lista explícita de orígenes conocidos (frontend de producción + entornos de desarrollo) en vez de `cors()` abierto.

### 6.3 Expiración y persistencia de sesión recomendadas

| Token | Vida útil | Almacenamiento |
|---|---|---|
| Access token (JWT) | 15–30 min | Memoria de la app (variable de React/contexto), nunca `localStorage` |
| Refresh token | 7–14 días, rotación en cada uso | Cookie `httpOnly`+`Secure` (ideal) o `localStorage` (transicional) |
| Sesión "recuérdame" | Opcional, refresh de 30 días | Igual que refresh token, con flag explícito del usuario |

Esto no se implementa en esta auditoría; queda como diseño para la Fase 2 del roadmap (sección 9).

---

## 7. SISTEMA DE CORREOS

### 7.1 Arquitectura actual

`emailService.js` centraliza el envío con dos funciones: `enviarCorreo()` (decide proveedor por dominio, prioriza Resend) y `reenviarCorreo()` (fuerza siempre Nodemailer y registra el dominio como "especial" si no estaba). `emailTemplates.js` aporta dos plantillas HTML inline (código de verificación, recuperación de contraseña), bien maquetadas para email (tablas, estilos inline) — correcto para compatibilidad con clientes de correo.

### 7.2 Duplicación de lógica de enrutamiento por dominio

La lógica "tomar el dominio del email → comparar contra la lista `dominiosPublicos` → si no es público y no existe en `correos_especiales`, insertarlo" está **escrita dos veces de forma independiente**:
- `emailService.js:131-185` (dentro de `reenviarCorreo`).
- `index.js:788-844` (dentro de `POST /api/practicantes`, para decidir el proveedor de un nuevo practicante).

Son casi idénticas pero no extraídas a una función compartida. Si se cambia la lista de dominios públicos en un lugar y se olvida el otro, el comportamiento de enrutamiento de correo divergirá silenciosamente.

### 7.3 Inconsistencia: el aprendizaje de dominios especiales no cubre todos los flujos

`enviarCorreo()` (la función que de hecho se usa en `pre-register` y `forgot-password`, los flujos de mayor volumen) **solo lee** `correos_especiales`, nunca inserta. Solo `reenviarCorreo()` y la creación de practicantes insertan nuevos dominios. Esto significa que un dominio institucional nuevo que un paciente use por primera vez en el registro normal **nunca se registra automáticamente** como "especial" salvo que ese mismo usuario, en algún momento, pida un reenvío de código — comportamiento inconsistente y dependiente del orden de acciones del usuario, no de una regla de negocio explícita.

### 7.4 Triple instanciación del pool de PostgreSQL

`db.js`, `authMiddleware.js` y `authRoutes.js` cada uno crea **su propio** `new Pool({...})` con los mismos parámetros de entorno, en vez de importar la instancia única exportada por `db.js`. `index.js` sí importa `pool` desde `db.js` correctamente. Esto no es un bug funcional (Postgres tolera varios pools), pero triplica el límite de conexiones simultáneas que el backend puede abrir y es exactamente el tipo de cosa que se vuelve un problema sutil bajo carga ("too many connections") sin que el código de negocio cambie nada.

### 7.5 Arquitectura futura propuesta para sistema multicanal (correo + WhatsApp + SMS)

Sin implementarlo ahora, el diseño recomendado para cuando llegue la Fase 5 del roadmap:

```
notificaciones/
  ├─ NotificationService.js        (fachada única: enviar(canal, destinatario, plantilla, datos))
  ├─ providers/
  │    ├─ emailProvider.js         (lo que hoy es emailService.js, sin cambios de lógica)
  │    ├─ whatsappProvider.js      (WhatsApp Business API / Twilio)
  │    └─ smsProvider.js           (Twilio/proveedor local)
  ├─ templates/
  │    ├─ email/   (lo que hoy es emailTemplates.js)
  │    ├─ whatsapp/ (plantillas aprobadas por Meta, con variables)
  │    └─ sms/      (texto plano corto)
  └─ preferences/
       └─ canal preferido por usuario (tabla nueva: usuarios.canal_preferido o tabla aparte)
```

Principio clave: **una sola función de negocio** (`enviarCodigoVerificacion(usuario, codigo)`, `enviarRecuperacion(usuario, codigo)`) que internamente decide el canal, en vez de que cada endpoint de `index.js` siga llamando directamente a `enviarCorreo()` como hace hoy. Esto es lo que permitirá añadir WhatsApp/SMS sin tocar `index.js` en absoluto — hoy, añadir un canal nuevo obligaría a editar cada uno de los ~6 lugares de `index.js` que llaman a `enviarCorreo`/`reenviarCorreo` directamente.

---

## 8. DEUDA TÉCNICA CLASIFICADA

### 🔴 CRÍTICO (puede romper el sistema o comprometer seguridad)

1. **Suplantación de identidad sin contraseña** vía `GET /api/usuarios` sin protección + autenticación basada en header `email` sin firma (sección 5.1). Compromiso total del sistema.
2. **Múltiples endpoints sin autenticación que exponen historiales clínicos, citas y datos de usuario** (incluido el hash de contraseña) (sección 5.2).
3. **Secretos reales (`DB_PASSWORD`, `RESEND_API_KEY`, etc.) en el historial de git**, en un repositorio con remoto en GitHub (sección 5.3). Acción inmediata: rotar credenciales.
4. **Bug funcional confirmado:** el detalle de historiales de fisioterapia por cita (`/api/historiales-fisioterapia/detalle/:id`) no existe como ruta — el auto-rellenado de formularios de fisioterapia está roto (sección 3.3).
5. **`react`, `react-dom` y `typescript` no son dependencias declaradas** del proyecto — el build funciona "por accidente" gracias a dependencias transitivas; un `npm ci` en un entorno distinto, o un cambio en una dependencia indirecta, puede romper la compilación sin aviso (sección 2.5).
6. **CORS completamente abierto** (`app.use(cors())`) combinado con el punto 1 — cualquier sitio externo puede operar la API en nombre de una víctima.

### 🟡 IMPORTANTE (afecta mantenibilidad y escalabilidad)

1. **Backend monolítico de 1555 líneas en un solo archivo** (`index.js`), sin separar por recursos (rutas de citas, historiales, usuarios, practicantes deberían vivir en módulos `routes/*.js` como ya se hizo parcialmente con `authRoutes.js`).
2. **75 URLs hardcodeadas a `http://localhost:3001` en 26 archivos** del frontend en vez de usar la capa `api.ts` ya existente — bloquea el despliegue a producción sin una refactorización amplia (sección 3.2).
3. **Duplicación estructural Nutrición/Fisioterapia**: 6 pares de archivos casi gemelos (`*AdminDashboard`, `*PractitionerDashboard`, `*MasterForm`) que suman más de 6300 líneas combinadas, y dos pares de tablas de base de datos (`historiales_nutricion`/`historiales_fisioterapia`) que ya causaron el bug de la sección 3.3. Cada cambio de negocio debe aplicarse dos veces, con alto riesgo de que diverjan.
4. **Documentación de base de datos completamente desactualizada** (`database-schema.sql`, `database.config.ts`, los 7 archivos de `docs/`) describiendo una arquitectura Supabase abandonada, mientras la base real (Render + Express propio) no tiene ningún script DDL versionado (sección 4.1).
5. **Autorización por propiedad (IDOR) ausente** en varios endpoints que sí exigen `requireAuth` pero no verifican que el recurso pertenezca al solicitante (citas, recomendaciones, notas de evolución — sección 3.5).
6. **Triple instanciación del pool de PostgreSQL** en vez de reutilizar la instancia de `db.js` (sección 7.4).
7. **6 páginas/componentes huérfanos** sin ruta ni import, sumando ~1784 líneas muertas (`MasterDashboard.tsx`, `ManageAdminPage.tsx`, `AdminDashboard.tsx`, `PractitionerDashboard.tsx`, `appointment-calendar.tsx`, `PatientSchedule.tsx`) (sección 2.1–2.2).
8. **Lógica de enrutamiento de proveedor de correo duplicada e inconsistente** entre `emailService.js` e `index.js` (sección 7.2–7.3).
9. **Tarea programada de desactivación de cuentas implementada con `setInterval` dentro del proceso**, no escalable a múltiples instancias del backend (sección 4.3).
10. **Sin tests automatizados** en ningún punto del repositorio (no se encontró carpeta `__tests__`, ni `*.test.ts(x)`, ni configuración de Jest/Vitest) — todo lo anterior se detectó por lectura manual de código, no por una suite que lo hubiera atrapado antes.

### 🟢 DESEABLE (refactorizaciones y mejoras)

1. **11 dependencias npm sin uso** en el frontend (`xlsx`, `react-dnd`, `react-dnd-html5-backend`, `react-slick`, `react-responsive-masonry`, `@tiptap/*`, `motion`, `next-themes`, `react-popper`, `@popperjs/core`) (sección 2.4).
2. **`estructura.txt` de 77 011 líneas trackeado en git** sin valor para el proyecto (sección 2.3).
3. Dependencia fantasma `"node": "^26.3.0"` en `utc-api/package.json` (sección 2.5).
4. Ruta duplicada `GET /api/auth/validate-session` muerta en `index.js` (73 líneas) (sección 2.6).
5. Dos rutas de frontend distintas para el mismo componente `MedicalHistoryViewer` (sección 3.6).
6. ~74 `console.log`/`console.error` repartidos en 24 archivos de frontend y 26 en el backend — útiles en desarrollo, ruido en producción; sustituir por un logger con niveles.
7. Validación de contraseña duplicada entre `Register.tsx` y `ForgotPassword.tsx` — extraer a un hook/util compartido.
8. Inconsistencia de nombres `status`/`estado` en distintas tablas.
9. `App.tsx` llama `initializeMockData()` en cada montaje — confirmar si sigue siendo necesario con el backend real ya operativo.

---

## 9. ROADMAP DE EVOLUCIÓN POR FASES

> El orden respeta el que ya propuso el usuario; aquí se detalla el contenido de cada fase a la luz de los hallazgos de esta auditoría.

### Fase 1 — Limpieza del proyecto
- Eliminar (con confirmación previa) los 6 archivos huérfanos de la sección 2.1–2.2 y la ruta backend muerta de la sección 2.6.
- Retirar las 11 dependencias sin uso y corregir la dependencia fantasma `node` (sección 2.4–2.5).
- Declarar explícitamente `react`, `react-dom`, `typescript` como dependencias directas (hallazgo crítico de empaquetado).
- Eliminar `estructura.txt` del repositorio y añadirlo a `.gitignore` si se sigue generando localmente.
- Archivar o eliminar `database-schema.sql`, `database.config.ts` y los `docs/*.md` de Supabase, sustituyéndolos por un único script DDL que refleje el esquema real (ver Fase 2/3 de DB abajo).
- Unificar las llamadas `fetch` dispersas detrás de `api.ts` (requisito previo para poder cambiar de entorno sin tocar 26 archivos).

### Fase 2 — Implementación de JWT mediante middleware
- Ejecutar el plan detallado en la sección 6: emisión paralela de tokens, nuevo `verifyToken`/`requireRole`, migración endpoint por endpoint priorizando los que hoy están sin protección, retirada del esquema basado en header `email`.
- Aprovechar el mismo cambio para cerrar los huecos de IDOR de la sección 3.5 (verificar propiedad del recurso, no solo autenticación).
- Restringir CORS a orígenes explícitos por entorno.

### Fase 3 — Sistema de perfiles
- Formalizar la edición de perfil (`PATCH /api/usuarios/:id` ya existe) con propagación o normalización de nombre/teléfono/matrícula hacia los registros históricos que hoy los denormalizan sin invalidar (sección 4.2).
- Definir qué campos son editables por cada rol y auditar el cambio (enlaza con la Fase 8, bitácora).

### Fase 4 — Roles y permisos
- Formalizar una matriz rol × acción × recurso (hoy implícita y dispersa entre `requireRole`, `requireSameArea` y `canModifyAppointment`) como tabla de configuración o policy engine simple, reemplazando las verificaciones ad-hoc repetidas en cada ruta.
- Resolver la ambigüedad `usuarios.status` vs `practicantes_autorizados.estado` (sección 4.2) eligiendo una única fuente de verdad.

### Fase 5 — Sistema de notificaciones multicanal
- Implementar la fachada `NotificationService` propuesta en la sección 7.5, migrando el correo actual sin cambiar su comportamiento observable.
- Resolver primero la duplicación e inconsistencia de enrutamiento por dominio (sección 7.2–7.3), ya que cualquier canal nuevo heredará ese problema si no se corrige antes.

### Fase 6 — WhatsApp Business
- Añadir `whatsappProvider.js` sobre la fachada de la Fase 5; requiere catálogo de plantillas aprobadas por Meta para OTP/recordatorios de cita (caso de uso natural dado que el sistema ya genera códigos y recordatorios).

### Fase 7 — Dashboard de métricas
- Reutilizar la tabla `metricas` ya existente, pero antes resolver su falta de política de retención/índices (sección 4.3) para que el dashboard siga siendo rápido cuando la tabla crezca.
- Sustituir las 5 consultas secuenciales de `GET /api/stats/dashboard` por una sola consulta agregada o vistas materializadas.

### Fase 8 — Auditoría y bitácora de acciones
- Generalizar `logs_sistema` (hoy usado de forma ad-hoc para 2-3 eventos) a una bitácora de auditoría real: quién hizo qué, sobre qué recurso, cuándo — especialmente crítico para acciones sobre historiales clínicos y cuentas de usuario, dado que es información de salud.
- Proteger `GET /api/logs` con `requireRole(['master'])` como parte de este trabajo (hoy está sin protección, sección 5.2).

### Fase 9 — Escalabilidad y despliegue
- Resolver la tarea programada basada en `setInterval` (sección 4.3) antes de escalar a más de una instancia del backend.
- Consolidar el pool de PostgreSQL (sección 7.4) y revisar `ssl: { rejectUnauthorized: false }` (sección 5.4) antes de cualquier despliegue con tráfico real.
- Documentar variables de entorno y proceso de despliegue reales (Render + Postgres propio), reemplazando la documentación Supabase obsoleta.

---

## 10. RECOMENDACIONES PARA TESIS

### 10.1 Decisiones arquitectónicas defendibles académicamente

- **Separación de responsabilidades por rol con enrutamiento declarativo** (`DashboardRouter` en `routes.tsx`) es un patrón presentable: el comité puede ver claramente cómo el sistema resuelve "qué panel ve cada usuario" a partir de rol + área, con guardas de ruta explícitas (`ProtectedRoute`).
- **Migración progresiva de contraseñas en texto plano a bcrypt** (`authRoutes.js:39-57`) es un patrón real de la industria (similar a lo que documentan guías de OWASP para migraciones de hash sin forzar reseteo masivo) y es defendible como decisión consciente de transición, siempre que en la tesis se documente como una medida *temporal* con fecha de cierre, no como el estado final deseado.
- **Uso de JSONB para formularios clínicos variables** (`historiales_*.datos`, `notas_evolucion.cuadro_evolucion`) es una decisión de modelado justificable: los formularios médicos de nutrición y fisioterapia tienen estructuras distintas y cambiantes, y forzar un esquema relacional rígido habría sido más costoso de mantener. Es buen material para justificar en el capítulo de diseño de base de datos, citando el patrón "schema-on-read" frente a "schema-on-write".
- **Consultas parametrizadas consistentes** en toda la capa de acceso a datos (sección 5.5) — mencionar explícitamente que se previno inyección SQL por diseño, no por suerte, es un punto a favor real y verificable.

### 10.2 Patrones que el proyecto ya usa (para nombrarlos correctamente en la tesis)

- **Patrón de holding/staging table con expiración** (`registro_temporal`, `password_resets`) para flujos de verificación OTP — patrón reconocible y con nombre en la literatura de sistemas (verificación diferida con expiración TTL).
- **Strategy pattern implícito** en `emailService.js` (selección de proveedor de envío según dominio) — vale la pena nombrarlo así explícitamente y, de paso, formalizarlo (hoy es un `if/else` repetido, no una verdadera implementación del patrón con interfaz común).
- **Middleware chain de Express** (`requireAuth → requireRole → requireSameArea → canModifyAppointment`) es el patrón de *Chain of Responsibility* aplicado correctamente a nivel conceptual, aunque su base (autenticación sin firma) sea débil — la tesis puede defender el patrón de composición de middlewares y, en paralelo, proponer JWT como la mejora natural sin descartar el patrón de composición en sí.

### 10.3 Mejoras que elevarían el proyecto a nivel de tesis universitaria

1. **Cerrar la brecha de autenticación/autorización (secciones 5 y 6)** es, con diferencia, lo que más eleva el rigor del proyecto: un sistema que maneja datos de salud y no puede defender su modelo de autenticación frente a un comité técnico difícilmente sostiene la evaluación. Implementar JWT + verificación de propiedad de recursos convierte esto en una fortaleza demostrable en vez de un riesgo oculto.
2. **Tests automatizados.** Hoy cero. Incluso una suite mínima (tests de integración sobre los endpoints de autenticación y citas, usando Jest/Vitest + Supertest) demuestra rigor metodológico y, como beneficio colateral, hubiera detectado el bug de la sección 3.3 antes de la auditoría.
3. **Un script de esquema único y versionado** (`migrations/001_init.sql`, etc., con una herramienta como `node-pg-migrate` o `Knex`) que sustituya a los tres documentos contradictorios actuales. Esto es exactamente el tipo de "reproducibilidad" que un jurado de tesis valora: que el sistema completo pueda levantarse desde cero solo con el repositorio.
4. **Documentar el modelo de amenazas explícitamente** (qué se protege, de quién, con qué controles) como parte del capítulo de seguridad — convierte los hallazgos de esta auditoría en la justificación formal de las decisiones de la Fase 2 del roadmap, en vez de presentarlas como deuda técnica sin contexto.
5. **Eliminar la duplicación Nutrición/Fisioterapia mediante parametrización** (un único `SpecialtyDashboard`, `SpecialtyMasterForm`, una única tabla `historiales` con columna `tipo`) es un caso de estudio perfecto para un capítulo de "refactorización guiada por deuda técnica detectada": se puede mostrar el bug real que causó la duplicación (sección 3.3) como motivación concreta, no abstracta.
6. **Métricas de calidad de código objetivas** (cobertura de tests, complejidad ciclomática del archivo `index.js` antes/después de modularizar) darían al trabajo un componente cuantitativo que hoy no tiene.

---

## CIERRE

Esta auditoría no modificó ningún archivo. Todos los hallazgos están referenciados por archivo y, donde fue posible, por número de línea, para que puedan verificarse independientemente y priorizarse según el roadmap de la sección 9. El hallazgo que requiere atención más urgente, independientemente de cualquier planificación de fases, es la sección 5.3 (secretos en el historial de git): se recomienda rotar las credenciales de base de datos y la API key de Resend antes de continuar con cualquier otro trabajo sobre el repositorio.
