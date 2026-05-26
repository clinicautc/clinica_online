# 📋 INSTRUCTIVO DE CONFIGURACIÓN DE BASE DE DATOS
## Sistema de Gestión Clínica UTC - Supabase

---

## 📌 ÍNDICE

1. [Requisitos Previos](#requisitos-previos)
2. [Crear Proyecto en Supabase](#crear-proyecto)
3. [Ejecutar Scripts SQL](#ejecutar-scripts)
4. [Configurar Variables de Entorno](#variables-entorno)
5. [Políticas de Seguridad (RLS)](#politicas-seguridad)
6. [Verificación](#verificacion)

---

## 1️⃣ REQUISITOS PREVIOS {#requisitos-previos}

### ✅ Necesitas:
- Una cuenta en [Supabase](https://supabase.com) (gratis)
- Acceso a la configuración de **Make settings page** en Figma Make
- El archivo `database-schema.sql` (incluido en este proyecto)

---

## 2️⃣ CREAR PROYECTO EN SUPABASE {#crear-proyecto}

### Paso 1: Crear nuevo proyecto
1. Ve a [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Click en **"New Project"**
3. Configura:
   - **Name**: `utc-clinica-production`
   - **Database Password**: Genera una contraseña segura (guárdala!)
   - **Region**: Elige la más cercana (ej: `South America - São Paulo`)
   - **Pricing Plan**: Free (suficiente para comenzar)

### Paso 2: Esperar inicialización
- Supabase tardará ~2 minutos en crear la base de datos
- Verás un mensaje "Setting up project..."

### Paso 3: Obtener credenciales
Una vez listo, ve a **Settings** → **API**:
- **Project URL**: `https://xxxxxxxxxx.supabase.co`
- **anon/public key**: `eyJhbGc...` (clave pública, se puede exponer)
- **service_role key**: `eyJhbGc...` (clave secreta, NUNCA exponerla en frontend)

---

## 3️⃣ EJECUTAR SCRIPTS SQL {#ejecutar-scripts}

### Paso 1: Abrir SQL Editor
1. En Supabase Dashboard, ve a **SQL Editor** (icono de hoja)
2. Click en **"New Query"**

### Paso 2: Ejecutar el schema
1. Abre el archivo `database-schema.sql` de este proyecto
2. Copia TODO el contenido
3. Pégalo en el SQL Editor de Supabase
4. Click en **"Run"** (o presiona `Ctrl+Enter` / `Cmd+Enter`)

### Paso 3: Verificar ejecución
- Deberías ver mensaje: ✅ `Success. No rows returned`
- Si hay error, lee el mensaje y verifica que copiaste todo el código

### Paso 4: Verificar tablas creadas
Ve a **Table Editor** y deberías ver:
- ✅ `users`
- ✅ `appointments`
- ✅ `medical_histories`
- ✅ `notes`
- ✅ `practitioners`

---

## 4️⃣ CONFIGURAR VARIABLES DE ENTORNO {#variables-entorno}

### En Figma Make Settings Page:

1. Abre la **Make settings page**
2. Sección **Supabase Connection**:
   - **Project URL**: Pega tu `https://xxxxxxxxxx.supabase.co`
   - **Anon Key**: Pega tu `anon/public key`
3. Click en **"Connect"**

### Variables de entorno adicionales (si usas API externa):

Si planeas integrar APIs externas (ej: envío de emails), agrega secretos:
- Ve a **Supabase Dashboard** → **Settings** → **Edge Functions** → **Secrets**
- Agrega:
  ```
  SMTP_HOST=smtp.gmail.com
  SMTP_USER=tu-email@gmail.com
  SMTP_PASS=tu-contraseña-app
  ```

---

## 5️⃣ POLÍTICAS DE SEGURIDAD (RLS) {#politicas-seguridad}

### ¿Qué es RLS?
**Row Level Security (RLS)** controla qué filas puede ver/modificar cada usuario según su rol.

### Políticas incluidas en el schema:

#### 📋 Tabla `users`
- ✅ **Admin**: Puede ver todos los usuarios
- ✅ **Usuario propio**: Puede ver y actualizar su propio perfil
- ❌ **Otros**: No pueden ver datos de otros usuarios

#### 📅 Tabla `appointments`
- ✅ **Paciente**: Ve solo SUS citas
- ✅ **Practicante**: Ve citas de SU área (fisioterapia o nutrición)
- ✅ **Admin**: Ve TODAS las citas
- ✅ **Creación**: Pacientes pueden crear citas, practicantes/admin pueden modificarlas

#### 📄 Tabla `medical_histories`
- ✅ **Paciente**: Ve solo SUS historiales
- ✅ **Practicante**: Ve historiales de SU área
- ✅ **Admin**: Ve TODOS los historiales
- ✅ **Creación**: Solo practicantes y admin pueden crear historiales

#### 📢 Tabla `notes`
- ✅ **Lectura**: Todos los usuarios autenticados pueden leer notas
- ✅ **Creación**: Solo admin puede crear/editar/eliminar notas

#### 👥 Tabla `practitioners`
- ✅ **Lectura**: Todos pueden ver la lista de practicantes
- ✅ **Gestión**: Solo admin puede agregar/modificar/eliminar practicantes

### Verificar RLS está activo:
1. Ve a **Table Editor** → Selecciona una tabla
2. Click en **"RLS"** (arriba a la derecha)
3. Verifica que diga: `RLS is enabled` ✅

---

## 6️⃣ VERIFICACIÓN {#verificacion}

### ✅ Checklist Final:

1. **Tablas creadas**:
   - [ ] `users`
   - [ ] `appointments`
   - [ ] `medical_histories`
   - [ ] `notes`
   - [ ] `practitioners`

2. **RLS habilitado**:
   - [ ] Cada tabla tiene políticas de seguridad
   - [ ] El icono de escudo aparece en Table Editor

3. **Datos de prueba**:
   - [ ] Se insertaron usuarios de ejemplo (admin, practicantes, pacientes)
   - [ ] Se insertaron citas de ejemplo

4. **Conexión a Make**:
   - [ ] Supabase URL configurada en Make settings
   - [ ] Anon Key configurada en Make settings

### 🧪 Probar conexión:

Ejecuta este query en SQL Editor para verificar datos:
```sql
-- Ver todos los usuarios
SELECT id, name, email, role, area FROM users;

-- Ver todas las citas
SELECT * FROM appointments ORDER BY date DESC;

-- Ver historiales
SELECT * FROM medical_histories ORDER BY created_at DESC;
```

---

## 🔐 NOTAS DE SEGURIDAD

### ⚠️ NUNCA EXPONGAS:
- ❌ `service_role key` en el código frontend
- ❌ Contraseñas de la base de datos
- ❌ API keys en código público

### ✅ SÍ PUEDES EXPONER:
- ✅ `anon/public key` (está protegida por RLS)
- ✅ `Project URL`

### 🛡️ Mejores prácticas:
1. **RLS siempre activo**: Nunca desactives RLS en producción
2. **Validación backend**: No confíes solo en validación frontend
3. **Auditoría**: Revisa logs regularmente en Supabase Dashboard → Logs
4. **Backups**: Supabase hace backups automáticos (gratis: diarios, pro: point-in-time)

---

## 📞 SOPORTE

### Si tienes problemas:

1. **Error en SQL**:
   - Lee el mensaje de error
   - Verifica que copiaste TODO el schema
   - Intenta ejecutar sección por sección

2. **No aparecen tablas**:
   - Refresca el Table Editor
   - Verifica que el query se ejecutó exitosamente

3. **RLS bloqueando acceso**:
   - Temporalmente desactiva RLS para debugging
   - Verifica que el `auth.uid()` coincide con el user_id

4. **Conexión desde Make**:
   - Verifica las credenciales
   - Asegúrate de usar el `anon key` (no service_role)

---

## 🚀 PRÓXIMOS PASOS

Una vez configurada la base de datos:

1. ✅ Las funciones de la app automáticamente usarán Supabase
2. ✅ Los datos se guardarán en la nube (no más localStorage)
3. ✅ Múltiples usuarios pueden usar el sistema simultáneamente
4. ✅ Los datos persisten entre sesiones y dispositivos

### Migración de datos existentes:

Si ya tienes datos en localStorage, puedes migrarlos:
1. Exporta desde localStorage (ver archivo `migrate-data.ts`)
2. Ejecuta el script de migración
3. Verifica que todo se transfirió correctamente

---

## 📚 RECURSOS ADICIONALES

- [Documentación Supabase](https://supabase.com/docs)
- [Guía RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [SQL Reference](https://supabase.com/docs/guides/database/tables)
- [Figma Make + Supabase](https://help.figma.com/hc/en-us/articles/supabase)

---

**Versión**: 1.0
**Última actualización**: Abril 2026
**Autor**: Sistema Clínica UTC
