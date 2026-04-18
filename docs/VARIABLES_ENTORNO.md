# 🔐 VARIABLES DE ENTORNO - Sistema Clínica UTC

---

## 📋 VARIABLES REQUERIDAS

### 1. Supabase Connection (OBLIGATORIAS)

```env
SUPABASE_URL=https://xxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### ¿Dónde obtenerlas?
1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Click en **Settings** → **API**
3. Copia:
   - **Project URL** → `SUPABASE_URL`
   - **Project API keys** → `anon` `public` → `SUPABASE_ANON_KEY`

#### ⚠️ IMPORTANTE:
- ✅ `SUPABASE_ANON_KEY` es **segura para exponer** en el frontend (está protegida por RLS)
- ❌ `SUPABASE_SERVICE_ROLE_KEY` **NUNCA** debe exponerse en el frontend
- ❌ No agregues estas variables a `.env` si vas a subir el código a GitHub público

---

## 🔑 NOMBRES DE VARIABLES EN LA BASE DE DATOS

### Tabla: `users`

| Campo | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| `id` | UUID | ID único del usuario | `123e4567-e89b-12d3-a456-426614174000` |
| `name` | VARCHAR(255) | Nombre completo | `Juan Pérez García` |
| `email` | VARCHAR(255) | Correo electrónico (único) | `juan@example.com` |
| `password` | VARCHAR(255) | Contraseña hasheada | `$2b$10$...` |
| `role` | ENUM | Rol del usuario | `'paciente'`, `'practicante'`, `'admin'` |
| `area` | ENUM | Área (solo practicantes) | `'nutricion'`, `'fisioterapia'` |
| `created_at` | TIMESTAMP | Fecha de creación | `2026-04-01 12:00:00+00` |
| `updated_at` | TIMESTAMP | Última actualización | `2026-04-01 12:00:00+00` |

### Tabla: `appointments`

| Campo | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| `id` | UUID | ID único de la cita | `123e4567...` |
| `patient_id` | UUID | ID del paciente (FK → users) | `123e4567...` |
| `patient_name` | VARCHAR(255) | Nombre del paciente | `Juan Pérez García` |
| `type` | ENUM | Tipo de servicio | `'nutricion'`, `'fisioterapia'` |
| `date` | DATE | Fecha de la cita | `2026-04-05` |
| `time` | TIME | Hora de la cita | `09:00:00` |
| `status` | ENUM | Estado de la cita | `'programada'`, `'completada'`, `'cancelada'` |
| `created_at` | TIMESTAMP | Fecha de creación | `2026-04-01 12:00:00+00` |
| `updated_at` | TIMESTAMP | Última actualización | `2026-04-01 12:00:00+00` |

### Tabla: `medical_histories`

| Campo | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| `id` | UUID | ID único del historial | `123e4567...` |
| `patient_id` | UUID | ID del paciente (FK → users) | `123e4567...` |
| `patient_name` | VARCHAR(255) | Nombre del paciente | `Juan Pérez García` |
| `type` | ENUM | Tipo de evaluación | `'nutricion'`, `'fisioterapia'` |
| `date` | DATE | Fecha de la evaluación | `2026-03-25` |
| `data` | JSONB | Datos del formulario (flexible) | `{"peso": "75", "altura": "1.75"}` |
| `created_by` | VARCHAR(255) | Nombre del practicante | `Estudiante Ana Nutrición` |
| `created_by_id` | UUID | ID del practicante (FK → users) | `123e4567...` |
| `created_at` | TIMESTAMP | Fecha de creación | `2026-04-01 12:00:00+00` |
| `updated_at` | TIMESTAMP | Última actualización | `2026-04-01 12:00:00+00` |

### Tabla: `notes`

| Campo | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| `id` | UUID | ID único de la nota | `123e4567...` |
| `title` | VARCHAR(500) | Título del aviso | `Nuevo protocolo de atención` |
| `content` | TEXT | Contenido del mensaje | `Se les recuerda...` |
| `category` | ENUM | Categoría de la nota | `'general'`, `'nutricion'`, `'fisioterapia'` |
| `created_by` | VARCHAR(255) | Nombre del admin | `Dr. Carlos Administrador` |
| `created_by_id` | UUID | ID del admin (FK → users) | `123e4567...` |
| `created_date` | DATE | Fecha de publicación | `2026-04-01` |
| `created_at` | TIMESTAMP | Fecha de creación | `2026-04-01 12:00:00+00` |
| `updated_at` | TIMESTAMP | Última actualización | `2026-04-01 12:00:00+00` |

### Tabla: `practitioners`

| Campo | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| `id` | UUID | ID único del registro | `123e4567...` |
| `user_id` | UUID | ID del usuario (FK → users, único) | `123e4567...` |
| `name` | VARCHAR(255) | Nombre del practicante | `Estudiante Ana Nutrición` |
| `email` | VARCHAR(255) | Correo electrónico | `practicante1@utc.edu.mx` |
| `area` | ENUM | Área de especialización | `'nutricion'`, `'fisioterapia'` |
| `status` | ENUM | Estado del practicante | `'activo'`, `'inactivo'` |
| `date_added` | DATE | Fecha de alta en el sistema | `2026-01-15` |
| `created_at` | TIMESTAMP | Fecha de creación | `2026-04-01 12:00:00+00` |
| `updated_at` | TIMESTAMP | Última actualización | `2026-04-01 12:00:00+00` |

---

## 🎯 VALORES ENUM PERMITIDOS

### `user_role`
```sql
'paciente'     -- Paciente que recibe atención
'practicante'  -- Estudiante que brinda atención
'admin'        -- Administrador del sistema
```

### `specialty_area`
```sql
'nutricion'     -- Área de nutrición
'fisioterapia'  -- Área de fisioterapia
```

### `appointment_type`
```sql
'nutricion'     -- Cita de nutrición
'fisioterapia'  -- Cita de fisioterapia
```

### `appointment_status`
```sql
'programada'  -- Cita programada (futura)
'completada'  -- Cita completada
'cancelada'   -- Cita cancelada
```

### `note_category`
```sql
'general'      -- Para todos los practicantes
'nutricion'    -- Solo para estudiantes de nutrición
'fisioterapia' -- Solo para estudiantes de fisioterapia
```

### `practitioner_status`
```sql
'activo'    -- Practicante activo
'inactivo'  -- Practicante dado de baja
```

---

## 🔍 CONSULTAS ÚTILES (SQL)

### Ver todos los pacientes:
```sql
SELECT id, name, email
FROM users
WHERE role = 'paciente'
ORDER BY name;
```

### Ver citas de hoy:
```sql
SELECT *
FROM appointments
WHERE date = CURRENT_DATE
  AND status = 'programada'
ORDER BY time;
```

### Ver citas de nutrición:
```sql
SELECT *
FROM appointments
WHERE type = 'nutricion'
ORDER BY date DESC, time;
```

### Ver citas de fisioterapia:
```sql
SELECT *
FROM appointments
WHERE type = 'fisioterapia'
ORDER BY date DESC, time;
```

### Ver historiales de un paciente:
```sql
SELECT *
FROM medical_histories
WHERE patient_id = 'UUID_DEL_PACIENTE'
ORDER BY date DESC;
```

### Ver notas recientes:
```sql
SELECT *
FROM notes
ORDER BY created_date DESC
LIMIT 10;
```

### Ver practicantes activos:
```sql
SELECT *
FROM practitioners
WHERE status = 'activo'
ORDER BY area, name;
```

---

## 🛠️ CONFIGURACIÓN EN FIGMA MAKE

### Paso 1: Abrir Make Settings
1. En Figma Make, abre tu archivo
2. Click en el icono de **⚙️ Settings** (engranaje)

### Paso 2: Conectar Supabase
1. Scroll hasta **Supabase Connection**
2. Pega:
   - **Supabase Project URL**: `https://xxxxxxxxxx.supabase.co`
   - **Supabase Anon Key**: `eyJhbGc...`
3. Click en **Connect**

### Paso 3: Verificar Conexión
Una vez conectado, deberías ver:
- ✅ **Status**: Connected
- 📁 Archivos generados automáticamente:
  - `supabase/functions/server/kv_store.tsx`
  - `supabase/functions/server/index.tsx`
  - `utils/supabase/info.tsx`

---

## 🔐 NIVELES DE ACCESO (RLS POLICIES)

### Pacientes (`role = 'paciente'`)
- ✅ Ver su propio perfil
- ✅ Ver sus propias citas
- ✅ Crear nuevas citas
- ✅ Ver sus propios historiales médicos
- ✅ Ver notas generales
- ❌ Ver datos de otros pacientes
- ❌ Crear historiales médicos
- ❌ Modificar notas

### Practicantes de Nutrición (`role = 'practicante', area = 'nutricion'`)
- ✅ Ver su propio perfil
- ✅ Ver citas de **nutrición**
- ✅ Modificar citas de **nutrición**
- ✅ Ver historiales de **nutrición**
- ✅ Crear historiales de **nutrición**
- ✅ Ver notas de categoría **nutrición** y **general**
- ❌ Ver citas de fisioterapia
- ❌ Ver historiales de fisioterapia
- ❌ Ver notas de fisioterapia
- ❌ Crear/modificar notas

### Practicantes de Fisioterapia (`role = 'practicante', area = 'fisioterapia'`)
- ✅ Ver su propio perfil
- ✅ Ver citas de **fisioterapia**
- ✅ Modificar citas de **fisioterapia**
- ✅ Ver historiales de **fisioterapia**
- ✅ Crear historiales de **fisioterapia**
- ✅ Ver notas de categoría **fisioterapia** y **general**
- ❌ Ver citas de nutrición
- ❌ Ver historiales de nutrición
- ❌ Ver notas de nutrición
- ❌ Crear/modificar notas

### Administradores (`role = 'admin'`)
- ✅ Ver **todos** los usuarios
- ✅ Crear usuarios
- ✅ Ver **todas** las citas (nutrición y fisioterapia)
- ✅ Modificar **todas** las citas
- ✅ Ver **todos** los historiales médicos
- ✅ Crear historiales médicos
- ✅ Ver **todas** las notas
- ✅ Crear/modificar/eliminar notas
- ✅ Gestionar practicantes (agregar, desactivar)

---

## 📊 EJEMPLO DE DATOS JSON EN `medical_histories.data`

### Historial de Nutrición:
```json
{
  "peso": "75",
  "altura": "1.75",
  "imc": "24.5",
  "presionArterial": "120/80",
  "frecuenciaCardiaca": "72",
  "temperatura": "36.5",
  "diagnostico": "Evaluación nutricional inicial",
  "objetivo": "Reducción de peso gradual",
  "planAlimentacion": "Dieta balanceada 1800 kcal/día",
  "observaciones": "Paciente motivado y comprometido"
}
```

### Historial de Fisioterapia:
```json
{
  "motivoConsulta": "Dolor lumbar crónico",
  "diagnostico": "Lumbalgia mecánica",
  "tratamiento": "Ejercicios de fortalecimiento",
  "sesiones": "12 sesiones, 2 veces por semana",
  "ejercicios": ["Estiramiento lumbar", "Fortalecimiento core", "Movilidad cadera"],
  "observaciones": "Mejoría del 30% en la primera semana"
}
```

---

## 🚨 IMPORTANTE: SEGURIDAD

### ❌ NUNCA hagas esto:
```javascript
// ❌ MAL: Exponer service_role key
const supabase = createClient(url, SERVICE_ROLE_KEY); // Peligroso!

// ❌ MAL: Desactivar RLS
ALTER TABLE users DISABLE ROW LEVEL SECURITY; // ¡No lo hagas!

// ❌ MAL: Políticas muy permisivas
CREATE POLICY "Everyone can do everything" ON users FOR ALL USING (true); // Inseguro!
```

### ✅ SÍ haz esto:
```javascript
// ✅ BIEN: Usar anon key en frontend
const supabase = createClient(url, ANON_KEY); // Seguro con RLS

// ✅ BIEN: Mantener RLS activo
ALTER TABLE users ENABLE ROW LEVEL SECURITY; // Siempre habilitado

// ✅ BIEN: Políticas específicas
CREATE POLICY "Users see own data" ON users FOR SELECT USING (id = auth.uid()); // Seguro
```

---

## 📞 PREGUNTAS FRECUENTES

**P: ¿Puedo cambiar los nombres de las tablas?**
R: Sí, pero tendrás que actualizar todas las referencias en el código frontend.

**P: ¿Cómo agrego más campos a una tabla?**
R: Ejecuta un `ALTER TABLE`:
```sql
ALTER TABLE users ADD COLUMN telefono VARCHAR(20);
```

**P: ¿Cómo reseteo la base de datos?**
R: En Supabase Dashboard → Database → Tables → selecciona tabla → "Delete table". Luego ejecuta el schema de nuevo.

**P: ¿Los datos de prueba se borran solos?**
R: No, permanecen hasta que los borres manualmente o resetees la tabla.

**P: ¿Qué es JSONB en `medical_histories.data`?**
R: Es un tipo de PostgreSQL para almacenar JSON con indexación. Permite almacenar datos flexibles sin crear muchas columnas.

---

**Versión**: 1.0
**Última actualización**: Abril 2026
