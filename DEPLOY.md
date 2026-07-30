# Guía de despliegue — Clínica UTC

Este proyecto se puede desplegar de 4 formas ("modos"), sin cambiar nada del código. Aquí
explico cada una, y para los modos que se despliegan en un servicio (b, c y d) incluyo el paso
a paso completo, clic por clic.

## 1. Variables de entorno

Una variable de entorno es un dato de configuración (contraseñas, direcciones) que vive fuera
del código, en un archivo `.env`.

### Frontend — archivo `.env` en la raíz del repo

Esta variable se graba dentro del sitio al compilarlo. Si la cambias después de compilar, no
pasa nada hasta que vuelvas a compilar.

| Variable | Para qué sirve |
|---|---|
| `VITE_API_BASE_URL` | Dirección a la que el sitio le pide los datos. Sin definirla, usa `http://localhost:3001/api` — solo funciona en tu computadora. |

### Backend — archivo `.env` dentro de `utc-api/`

- `DB_HOST` — dirección del servidor de la base de datos.
  Ejemplo: `dpg-d97rb53tqb8s73dhdbq0-a.oregon-postgres.render.com`

- `DB_PORT` — puerto de conexión a la base de datos.
  Ejemplo: `5432`

- `DB_NAME` — nombre de la base de datos.
  Ejemplo: `pruebas_bbmc`

- `DB_USER` — usuario con el que el sistema entra a la base de datos.
  Ejemplo: `pruebas_bbmc_user`

- `DB_PASSWORD` — contraseña de ese usuario.
  No la escribas en ningún documento ni la compartas por chat — trátala como cualquier
  contraseña sensible.

- `RESEND_API_KEY` — clave del servicio Resend, que envía correos (códigos de verificación,
  notificaciones de citas).
  Tampoco la compartas — es secreta.

- `EMAIL_USER` — cuenta de Gmail usada como respaldo de Resend.
  Ejemplo: `clinicautc1@gmail.com`

- `EMAIL_PASS` — contraseña de aplicación de esa cuenta (no la contraseña normal de Gmail; es
  una especial que Google genera para apps externas, usada por Nodemailer).
  Es secreta, no la compartas.

- `JWT_SECRET` — clave con la que el sistema valida que una sesión de usuario es legítima.
  Invéntala una sola vez, larga y aleatoria. Cambiarla después cierra la sesión de todos de
  golpe.

- `JWT_REFRESH_SECRET` — igual que la anterior, pero para renovar sesiones sin pedir login de
  nuevo. Debe ser distinta a `JWT_SECRET`.

- `JWT_ACCESS_TTL` — cuánto dura una sesión activa antes de necesitar renovarse.
  Ejemplo: `15m`

- `PORT` — puerto en el que corre el servidor backend.
  Ejemplo: `3001`

- `SERVE_STATIC` — interruptor `true`/`false`. En `true`, el backend también sirve el sitio ya
  compilado, todo desde un solo lugar (modo servicio único, sección 3).

- `CORS_ORIGINS` — lista de direcciones autorizadas a llamar a la API, separadas por coma.
  Ejemplo: `http://localhost:5173,http://localhost:3000,https://algo-al-azar.trycloudflare.com`
  (esa última parte es la URL de un túnel de Cloudflare — cambia cada vez que lo reinicias, así
  que es solo un ejemplo del formato, no un valor fijo)

- `FRONTEND_URL` — dirección pública de tu sitio, usada en los links dentro de los correos.
  Ejemplo: `https://algo-al-azar.trycloudflare.com`

## 2. Modo (a) — Local, dos procesos

El modo del día a día para programar: frontend y backend corren por separado en tu computadora.

Comando para levantar ambos a la vez, desde la raíz del proyecto:

```bash
npm run dev
```

O por separado, cada uno en su propia terminal:

```bash
npm run dev:backend
```

```bash
npm run dev:frontend
```

**Variables a configurar:**

- En `utc-api/.env`, llena estas variables con tus datos reales: las 5 variables de base de
  datos (`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`), 
  Las 3 de sesión
  (`JWT_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_TTL`), 
  API RESEND (`RESEND_API_KEY`, y el par `EMAIL_USER` + `EMAIL_PASS` 
  Para Nodemailer, que se obtiene de una cuenta de Google)
  `PORT=3001`. Deja `SERVE_STATIC=false`.
- En el frontend (la raíz del proyecto) no necesitas crear ningún archivo `.env`. Si no existe,
  el código ya tiene un valor por defecto: le pide los datos a `localhost:3001/api`
  automáticamente. Como en este modo el backend corre en tu misma computadora, ese valor por
  defecto ya funciona solo.
- No necesitas tocar `CORS_ORIGINS`. El código ya trae permitido `localhost:5173` de fábrica
  (que es donde corre el frontend con `npm run dev`), aunque nunca escribas esa variable en
  ningún `.env`.

**Checklist:**

- Abre `http://localhost:5173/` — debe cargar el sitio.
- Recarga (F5) en una ruta interna, por ejemplo `http://localhost:5173/dashboard` — no debe
  dar 404.
- Entra a `http://localhost:3001/api/health` — debe responder en formato JSON.
- Registra un usuario y confirma que el correo de verificación llega.

Sobre el dominio de Spaceship: no aplica en este modo. Todo corre solo en tu computadora, nada
queda accesible desde internet, así que no hay a qué pueda apuntar un dominio. Para eso están
los modos (b), (c) y (d).

## 3. Modo (b) — Un solo servicio, con paso a paso para Render

Un único servidor sirve el sitio compilado y la API juntos, desde la misma dirección. Es la ruta
más simple para desplegar el proyecto completo en un solo lugar.

Comandos, si quieres correrlo tú antes de subirlo a Render:

```bash
npm run build:single
```

```bash
cd utc-api
npm start
```

El build ya deja la dirección de la API como ruta relativa (`/api`) — no necesitas definir
`VITE_API_BASE_URL` a mano en este modo.

**Variables a configurar:**

- En `utc-api/.env`: `SERVE_STATIC=true`(es el interruptor que activa el modo "un solo servicio").
 las mismas de siempre (`DB_*`, `JWT_*`, correo, `PORT`) las variables que siempre necesitas sin importar el modo: las 5 de base de datos, las 3 de sesión (JWT), y las de los servicio de correo, y el puerto.
- No hace falta tocar `CORS_ORIGINS` — todo se sirve desde el mismo lugar.
- `FRONTEND_URL`: la misma dirección pública del servicio (para los links de los correos) cuando el sistema manda un correo (por ejemplo, cuando se crea una cita, o el correo de verificación al registrarse), ese correo trae un botón tipo "Accede aquí" o un link para ver los detalles. Para armar ese link, el código necesita saber cuál es la dirección pública de tu sitio — y ahí es donde entra FRONTEND_URL.

**Checklist:**

- La dirección raíz (`http://localhost:PUERTO/`) carga el sitio (no un texto plano — es normal
  en este modo).
- Recargar (F5) en una ruta interna debe seguir funcionando. Si da 404, revisa que
  `SERVE_STATIC` esté en `true`.
- `http://localhost:PUERTO/api/health` responde en JSON.
- Registrar un usuario de principio a fin.

### 3.1. Paso a paso para desplegarlo en Render

**Paso 1 — Crear cuenta en Render:**

1. Entra a [render.com](https://render.com).
2. Click en "Sign In" (arriba a la derecha).
3. Elige "Sign in with GitHub" — así Render queda conectado a tu cuenta.
4. Autoriza el acceso cuando GitHub lo pida.

**Paso 2 — Crear el Web Service:**

1. Click en el botón "+ New" (arriba a la derecha).
2. Elige "Web Service" en el menú.
3. Busca y selecciona tu repositorio de GitHub.
4. Click en "Connect".

**Paso 3 — Llenar el formulario:**

| Campo | Qué poner |
|---|---|
| Name | `api-clinica-utc` (o el nombre que prefieras) |
| Region | Oregon (misma región que tu base de datos) |
| Branch | `main` |
| Root Directory | Déjalo vacío |
| Runtime | `Node` |
| Build Command | `npm install && npm run build:single && cd utc-api && npm install` |
| Start Command | `cd utc-api && npm start` |
| Instance Type | `Free` para empezar |

**Paso 4 — Agregar las variables de entorno:**

Baja hasta "Environment Variables". Usa la opción "Add from .env" para pegar todas de golpe (con
tus valores reales, no los de ejemplo):
SERVE_STATIC=true
DB_HOST=dpg-d97rb53tqb8s73dhdbq0-a.oregon-postgres.render.com
DB_PORT=5432
DB_NAME=pruebas_bbmc
DB_USER=pruebas_bbmc_user
DB_PASSWORD=tu_password_real
RESEND_API_KEY=tu_clave_real_de_resend
EMAIL_USER=clinicautc1@gmail.com
EMAIL_PASS=tu_contraseña_de_aplicación_real
JWT_SECRET=tu_clave_larga_real
JWT_REFRESH_SECRET=otra_clave_larga_real_distinta
JWT_ACCESS_TTL=15m
`FRONTEND_URL` y `CORS_ORIGINS` no hacen falta en este modo — el sitio y la API viven en el
mismo lugar.

**Paso 5 — Crear y desplegar:**

1. Click en "Create Web Service".
2. Espera a que en los logs aparezca: `API DE LA CLÍNICA UTC EJECUTÁNDOSE - PUERTO ...`
3. Suele tardar entre 2 y 5 minutos la primera vez.

**Paso 6 — Verificar:**

Render te da una URL pública, por ejemplo `https://api-clinica-utc.onrender.com`.

- Ábrela — debe cargar el sitio completo.
- Recarga (F5) en una sección interna — debe seguir funcionando.
- Entra a `https://api-clinica-utc.onrender.com/api/health` — debe responder en JSON.
- Registra un usuario y confirma que el correo llegue.

Aviso del plan gratuito: sin tráfico por ~15 minutos, el servicio se duerme. La siguiente visita
tarda hasta ~50 segundos en despertar — es normal.

### 3.2. Extra — conectar tu dominio de Spaceship

1. En Render: Settings → Custom Domains → "Add Custom Domain".
2. Escribe tu dominio — Render te muestra el registro DNS exacto a usar (un `CNAME` para
   subdominios como `www`, o un `A` si es el dominio raíz).
3. En Spaceship, entra a la administración de DNS de tu dominio y agrega ese registro tal cual.
4. Espera la propagación (minutos a un par de horas). El HTTPS se activa solo.
5. Actualiza `FRONTEND_URL` en Render a tu dominio nuevo.

## 4. Modo (c) — Dos servicios separados, con Vercel + Render

Sitio y backend en lugares distintos: el sitio en Vercel, el backend en Render. Esta es la forma
en la que ya se configuró el proyecto una vez: en vez de "hornear" la URL del backend dentro del
sitio, se usa un archivo `vercel.json` para que Vercel reenvíe automáticamente las peticiones
`/api` al backend de Render. Ventaja: evita el problema de CORS por completo, porque desde el
navegador todo parece un solo origen.

### 4.1. Paso a paso

**Paso 1 — Backend en Render (igual que el modo servicio único, pero sin `SERVE_STATIC`):**

1. En Render: "+ New" → "Web Service" → selecciona tu repositorio → "Connect".
2. Llena el formulario:

| Campo | Qué poner |
|---|---|
| Name | `api-clinica-utc` |
| Region | Oregon |
| Branch | `main` |
| Root Directory | Déjalo vacío |
| Runtime | `Node` |
| Build Command | `cd utc-api && npm install` |
| Start Command | `cd utc-api && npm start` |
| Instance Type | `Free` |

3. Agrega las variables de entorno de siempre (`DB_*`, `JWT_*`, correo), pero esta vez con
   `SERVE_STATIC=false` (o sin ponerla).
4. Click en "Create Web Service" y espera a que termine de desplegar.
5. Copia la URL que te da Render, por ejemplo `https://api-clinica-utc.onrender.com` — la vas a
   necesitar en el paso 2.

**Paso 2 — Crear el archivo `vercel.json` en la raíz del repo:**

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://api-clinica-utc.onrender.com/api/:path*"
    }
  ]
}
```

Reemplaza la URL por la que te dio Render en el paso 1. Este archivo va comiteado al
repositorio — no es una variable de entorno, es código.

**Paso 3 — Frontend en Vercel:**

1. Entra a [vercel.com](https://vercel.com) → "Add New" → "Project".
2. Selecciona tu repositorio de GitHub → "Import".
3. En la configuración del proyecto:

| Campo | Qué poner |
|---|---|
| Framework Preset | `Vite` |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Root Directory | `.` (la raíz del repo) |

4. En "Environment Variables" de Vercel, agrega:

CORS_ORIGINS=https://tu-proyecto.vercel.app
FRONTEND_URL=https://tu-proyecto.vercel.app

No es estrictamente necesario para que funcione, porque el `vercel.json` ya evita el CORS,
   pero `FRONTEND_URL` sí es necesaria para que los links de los correos apunten bien.

**Paso 5 — Verificar:**

- Abre la URL de Vercel — debe cargar el sitio.
- Entra a `https://tu-proyecto.vercel.app/api/health` (con el dominio de Vercel, no el de
  Render) — debe responder en JSON. Si responde, el reenvío del `vercel.json` está funcionando.
- Registra un usuario de principio a fin.

### 4.2. Extra — conectar tu dominio de Spaceship

- Para el frontend (Vercel): Settings → Domains → Add, escribe tu dominio, y Vercel te muestra
  los registros DNS a configurar. Cópialos en el panel de DNS de Spaceship.
- Para el backend (Render), si quieres un subdominio propio (ej. `api.tudominio.com`) en vez de
  la URL de `onrender.com`: mismo proceso que en el modo (b) — Settings → Custom Domains.
- Si conectas un dominio propio al backend, actualiza la URL de `destination` dentro de
  `vercel.json` para que apunte a ese dominio nuevo, y vuelve a desplegar en Vercel.

## 5. Modo (d) — Túnel con Cloudflare

Un túnel le da una dirección pública temporal a algo que corre en tu computadora, para que otras
personas entren desde internet sin desplegar nada de verdad. Úsalo para mostrar el proyecto
rápido, no para tenerlo siempre disponible.

Recomendación: usa un solo túnel apuntando al modo (b) (servicio único), no uno para el frontend
y otro para el backend por separado. La dirección del backend queda grabada en el sitio al
compilar (ver modo c), y las direcciones de los túneles gratuitos cambian cada vez que los
reinicias — tunelizar por separado te obligaría a recompilar el sitio cada vez que eso pase. Con
un solo túnel sobre el modo (b), el sitio ya pide los datos "a sí mismo", así que el túnel puede
cambiar de dirección sin que tengas que recompilar nada.

```bash
npm run build:single
```

```bash
cd utc-api
# antes de este paso, asegúrate de tener SERVE_STATIC=true en utc-api/.env
npm start
```

### 5.1. Opción rápida — sin dominio propio, dirección temporal

1. Instala `cloudflared` (Windows: `winget install --id Cloudflare.cloudflared`, o descárgalo
   de la página de Cloudflare).
2. Con el servicio único ya corriendo, en otra terminal:

```bash
cloudflared tunnel --url http://localhost:3001
```

3. Cloudflare imprime una dirección temporal como `https://algo-al-azar.trycloudflare.com`.
   Cambia cada vez que detienes y vuelves a correr el comando.
4. Actualiza `FRONTEND_URL` en `utc-api/.env` con esa URL, y reinicia el backend
   (`Ctrl+C` y vuelve a correr `npm start`) para que tome el nuevo valor.
5. Comparte esa URL con quien quieras que vea el sitio.

### 5.2. Opción con tu dominio de Spaceship — dirección fija

Requiere mover la administración del DNS de tu dominio hacia Cloudflare.

1. Crea una cuenta gratuita en [cloudflare.com](https://cloudflare.com) y agrega tu dominio con
   "Add a Site".
2. Cloudflare te da dos "nameservers" propios. En Spaceship, busca la sección de Nameservers de
   tu dominio y reemplaza los que trae por defecto con los de Cloudflare. Puede tardar varias
   horas en aplicarse.
3. Cuando Cloudflare confirme que el dominio ya apunta a ellos, autentica la herramienta:

```bash
cloudflared tunnel login
```

4. Crea un túnel con nombre:

```bash
cloudflared tunnel create clinica-utc
```

5. Conéctalo a un subdominio tuyo (cambia `app` por lo que prefieras):

```bash
cloudflared tunnel route dns clinica-utc app.tudominio.com
```

6. Arranca el túnel apuntando a tu servicio local:

```bash
cloudflared tunnel run --url http://localhost:3001 clinica-utc
```

7. `https://app.tudominio.com` ahora sirve tu sitio, con una dirección fija que no cambia cada
   vez que reinicias el túnel. Actualiza `FRONTEND_URL` con esa dirección.

**Variables a configurar (cualquiera de las dos opciones):**

- Igual que el modo (b): `SERVE_STATIC=true`.
- `FRONTEND_URL`: actualízala a la dirección del túnel (solo afecta los links de los correos,
  no requiere recompilar).
- `CORS_ORIGINS`: no hace falta tocarla.

**Checklist:**

- La dirección del túnel carga el sitio.
- Recargar (F5) en una ruta interna sobre esa dirección no debe dar 404.
- `<dirección-del-túnel>/api/health` responde en JSON.
- Registrarse de principio a fin, confirmando que el link del correo apunta a la dirección
  vigente del túnel.

## 6. Tabla resumen

| | (a) Local | (b) Servicio único | (c) Dos servicios (vercel.json) | (d) Túnel |
|---|---|---|---|---|
| Compilación | No hace falta | `npm run build:single` | `npm run build` normal | `npm run build:single` |
| `SERVE_STATIC` | No | Sí | No | Sí |
| API en el sitio | `localhost:3001/api` | Relativa (`/api`) | Relativa (`/api`, reenviada por `vercel.json`) | Relativa (`/api`) |
| ¿Necesita `CORS_ORIGINS`? | No | No | No (el `vercel.json` evita el CORS) | No |
| ¿Recompilar si cambia la URL del backend? | No | No | No — solo editar `vercel.json` y volver a desplegar en Vercel | No |

## 7. Errores comunes

**500 al pre-registrarse:**
Casi siempre `RESEND_API_KEY` vacía, inválida, o el dominio remitente sin verificar en Resend.
Revisa los logs del backend — ahí aparece el error real.

**404 al recargar una ruta interna (modo servicio único o túnel):**
Pasa si `SERVE_STATIC` no está en `true`, o si la parte del backend que sirve el sitio para
rutas que no son de la API se borró por accidente.

**Errores de CORS en el navegador:**
Solo puede pasar si usas el modo (c) sin el `vercel.json` (por ejemplo, si conectas el frontend
directo a la URL del backend en vez de usar el reenvío). Si ves esto, revisa que estés siguiendo
el paso a paso del `vercel.json` completo, o agrega la dirección de tu sitio a `CORS_ORIGINS`
del backend y reinicia — esta variable solo se lee al arrancar.

**Tu dominio de Spaceship no carga el sitio justo después de configurarlo:**
Es normal, los cambios de DNS no son instantáneos — pueden tardar desde minutos hasta un par de
horas (y si cambiaste los nameservers para Cloudflare, hasta 24-48 horas). Espera un rato antes
de asumir que algo está mal configurado.