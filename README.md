
  # Clínica Universitaria App

  This is a code bundle for Clínica Universitaria App. The original project is available at https://www.figma.com/design/u9NkRDeVeyelQrtQDWQ8Om/Cl%C3%ADnica-Universitaria-App.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

  ## Modos de despliegue

  El mismo código soporta 4 modos, sin tocar lógica de negocio:

  - **(a) Local (dos procesos):** `npm run dev` — levanta frontend (Vite) y
    backend (Express) por separado, como arriba. Configurar `utc-api/.env`
    (ver `utc-api/.env.example`).
  - **(b) Un solo servicio:** Express sirve el frontend ya compilado desde el
    mismo puerto/origen que la API. Pasos:
    1. `npm run build:single` — compila el frontend con `VITE_API_BASE_URL=/api`
       (ruta relativa, mismo origen) en vez de una URL absoluta. Usa
       [`cross-env`](https://www.npmjs.com/package/cross-env) para que el
       mismo comando funcione igual en Windows (cmd/PowerShell), Mac y Linux.
    2. En `utc-api/.env`, poner `SERVE_STATIC=true`.
    3. Arrancar el backend normalmente: `cd utc-api && npm start` (o
       `npm run dev`). Va a servir la SPA en `/` y la API en `/api/*` desde
       el mismo puerto.
    4. Si vuelves a modo (a)/(c), basta con `SERVE_STATIC=false` (o quitar la
       variable) — no hace falta deshacer nada más.
  - **(c) Dos servicios separados:** compilar con `VITE_API_BASE_URL` apuntando
    a la URL pública del backend (`npm run build -- ` con esa env var, o
    ajustar `.env` antes de `npm run build`), servir `dist/` con cualquier
    estático, y agregar el origen del frontend a `CORS_ORIGINS` en el backend.
  - **(d) Túnel (ngrok/cloudflare/devtunnels):** más simple combinando con el
    modo (b) — un solo túnel apuntando al servicio único. Si se tunela el
    frontend y el backend por separado, hay que agregar la URL del túnel del
    frontend a `CORS_ORIGINS`, compilar con `VITE_API_BASE_URL` apuntando a la
    URL del túnel del backend, y actualizar `FRONTEND_URL` — y recompilar cada
    vez que cambie la URL del túnel (a menos que uses un subdominio fijo).

  # citas_medicas
# consultorio_medico
# clinica_online
