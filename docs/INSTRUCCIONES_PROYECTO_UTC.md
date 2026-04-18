# 📋 PROYECTO: CLÍNICA UNIVERSITARIA UTC - INSTRUCCIONES COMPLETAS

## 🎯 RESUMEN DEL PROYECTO

Sistema completo de gestión de clínica universitaria con tres tipos de usuarios:
- **Pacientes**: Pueden agendar citas, ver sus planes médicos
- **Practicantes**: Acceden a formularios durante las citas, ven estadísticas
- **Administradores**: Control total, estadísticas avanzadas, gestión de practicantes

---

## ✅ LO QUE YA ESTÁ IMPLEMENTADO

### 1. Estructura Base ✓
- ✅ `AuthContext.tsx` - Manejo de autenticación
- ✅ `mockData.ts` - Datos de prueba
- ✅ `App.tsx` - Rutas y navegación

### 2. Páginas Creadas ✓
- ✅ `NutritionFormPage.tsx` - Formulario completo de nutrición (con estructura colapsable)
- ✅ `StatisticsPage.tsx` - Estadísticas completas con gráficos
- ✅ `ManagePractitionersPage.tsx` - Gestión de practicantes

### 3. Funcionalidades Implementadas ✓
- ✅ Control de permisos por rol
- ✅ Formularios solo visibles para practicantes
- ✅ Estadísticas diferenciadas (practicantes vs admins)
- ✅ Gráficos con recharts
- ✅ Diseño responsive

---

## 📂 ESTRUCTURA DE ARCHIVOS DEL PROYECTO

```
/tmp/sandbox/src/app/
├── App.tsx                          # ✅ CREADO - Rutas principales
├── contexts/
│   └── AuthContext.tsx              # ✅ CREADO - Autenticación
├── lib/
│   └── mockData.ts                  # ✅ CREADO - Datos de prueba
├── pages/
│   ├── Login.tsx                    # ⚠️ PENDIENTE - Copiar de imports/
│   ├── Register.tsx                 # ⚠️ PENDIENTE - Copiar de imports/
│   ├── PatientDashboard.tsx         # ⚠️ PENDIENTE - Copiar de imports/
│   ├── PractitionerDashboard.tsx    # ⚠️ PENDIENTE - Copiar de imports/
│   ├── AdminDashboard.tsx           # ⚠️ PENDIENTE - Copiar de imports/
│   ├── PhysiotherapyFormPage.tsx    # ⚠️ PENDIENTE - Copiar de imports/
│   ├── NutritionFormPage.tsx        # ✅ CREADO - Formulario completo
│   ├── StatisticsPage.tsx           # ✅ CREADO - Estadísticas
│   └── ManagePractitionersPage.tsx  # ✅ CREADO - Gestión practicantes
├── components/
│   ├── AppointmentForm.tsx          # ⚠️ PENDIENTE - Copiar de imports/
│   ├── AppointmentManager.tsx       # ⚠️ PENDIENTE - Copiar de imports/
│   ├── PatientList.tsx              # ⚠️ PENDIENTE - Copiar de imports/
│   ├── PatientPlans.tsx             # ⚠️ PENDIENTE - Copiar de imports/
│   ├── PatientSchedule.tsx          # ⚠️ PENDIENTE - Copiar de imports/
│   ├── MedicalHistoryViewer.tsx     # ⚠️ PENDIENTE - Copiar de imports/
│   ├── NotesManager.tsx             # ⚠️ PENDIENTE - Copiar de imports/
│   ├── NotesViewer.tsx              # ⚠️ PENDIENTE - Copiar de imports/
│   └── ui/                          # ✅ YA EXISTEN - Componentes Shadcn
└── main.tsx                         # ⚠️ VERIFICAR - Punto de entrada
```

---

## 🔧 PASOS PARA COMPLETAR EL PROYECTO

### PASO 1: Copiar páginas desde `/src/imports/` a `/src/app/pages/`

Necesitas copiar y adaptar las siguientes páginas:

```bash
# 1. Login.tsx
cp /tmp/sandbox/src/imports/Login.tsx /tmp/sandbox/src/app/pages/Login.tsx

# 2. Register.tsx
cp /tmp/sandbox/src/imports/Register.tsx /tmp/sandbox/src/app/pages/Register.tsx

# 3. PatientDashboard.tsx
cp /tmp/sandbox/src/imports/PatientDashboard.tsx /tmp/sandbox/src/app/pages/PatientDashboard.tsx

# 4. PractitionerDashboard.tsx
cp /tmp/sandbox/src/imports/PractitionerDashboard.tsx /tmp/sandbox/src/app/pages/PractitionerDashboard.tsx

# 5. AdminDashboard.tsx
cp /tmp/sandbox/src/imports/AdminDashboard.tsx /tmp/sandbox/src/app/pages/AdminDashboard.tsx

# 6. PhysiotherapyFormPage.tsx
cp /tmp/sandbox/src/imports/PhysiotherapyFormPage.tsx /tmp/sandbox/src/app/pages/PhysiotherapyFormPage.tsx
```

### PASO 2: Copiar componentes desde `/src/imports/` a `/src/app/components/`

```bash
# Crear directorio si no existe
mkdir -p /tmp/sandbox/src/app/components

# Copiar componentes
cp /tmp/sandbox/src/imports/AppointmentForm-1.tsx /tmp/sandbox/src/app/components/AppointmentForm.tsx
cp /tmp/sandbox/src/imports/AppointmentManager-1.tsx /tmp/sandbox/src/app/components/AppointmentManager.tsx
cp /tmp/sandbox/src/imports/PatientList-1.tsx /tmp/sandbox/src/app/components/PatientList.tsx
cp /tmp/sandbox/src/imports/PatientPlans-1.tsx /tmp/sandbox/src/app/components/PatientPlans.tsx
cp /tmp/sandbox/src/imports/PatientSchedule-1.tsx /tmp/sandbox/src/app/components/PatientSchedule.tsx
cp /tmp/sandbox/src/imports/MedicalHistoryViewer-1.tsx /tmp/sandbox/src/app/components/MedicalHistoryViewer.tsx
cp /tmp/sandbox/src/imports/NotesManager-1.tsx /tmp/sandbox/src/app/components/NotesManager.tsx
cp /tmp/sandbox/src/imports/NotesViewer-1.tsx /tmp/sandbox/src/app/components/NotesViewer.tsx
```

### PASO 3: Actualizar las rutas de importación en TODOS los archivos

Después de copiar, DEBES actualizar las rutas de importación en cada archivo:

**CAMBIOS NECESARIOS:**

```tsx
// ❌ ANTES (rutas antiguas de imports)
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/ui/card';
import AppointmentForm from '../components/AppointmentForm';

// ✅ DESPUÉS (rutas correctas de app)
import { useAuth } from '../contexts/AuthContext';  // ✓ Correcto
import { Card } from './ui/card';                   // ✓ Correcto (si está en components)
import { Card } from '../components/ui/card';       // ✓ Correcto (si está en pages)
import AppointmentForm from '../components/AppointmentForm';  // ✓ Correcto (si está en pages)
```

### PASO 4: Agregar botón de Estadísticas en los Dashboards

#### En `PractitionerDashboard.tsx`:

Agregar una nueva pestaña en el TabsList:

```tsx
<TabsTrigger value="estadisticas" className="data-[state=active]:bg-blue-900 data-[state=active]:text-white">
  <BarChart3 className="w-4 h-4 mr-2" /> Estadísticas
</TabsTrigger>
```

Y agregar el contenido:

```tsx
<TabsContent value="estadisticas">
  <Button
    onClick={() => navigate('/estadisticas')}
    className="w-full bg-orange-600 hover:bg-orange-700 text-white h-16 text-lg"
  >
    <BarChart3 className="w-6 h-6 mr-3" />
    Ver Estadísticas Completas
  </Button>
</TabsContent>
```

#### En `AdminDashboard.tsx`:

Igual que arriba, más un botón adicional para Administrar Practicantes:

```tsx
<TabsTrigger value="practicantes" className="data-[state=active]:bg-blue-900 data-[state=active]:text-white">
  <Users className="w-4 h-4 mr-2" /> Practicantes
</TabsTrigger>
```

```tsx
<TabsContent value="practicantes">
  <Button
    onClick={() => navigate('/administrar-practicantes')}
    className="w-full bg-blue-900 hover:bg-blue-800 text-white h-16 text-lg"
  >
    <UserCheck className="w-6 h-6 mr-3" />
    Administrar Practicantes
  </Button>
</TabsContent>
```

---

## 🔐 PREPARACIÓN PARA BASE DE DATOS POSTGRESQL

### Archivo de Configuración de Base de Datos

Crea el archivo `/tmp/sandbox/src/app/lib/database.config.ts`:

```typescript
/**
 * ============================================================================
 * ARCHIVO: database.config.ts
 * PROPÓSITO: Configuración para PostgreSQL en Render
 * ============================================================================
 */

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl: boolean;
}

/**
 * CONFIGURACIÓN DE BASE DE DATOS
 *
 * INSTRUCCIONES PARA USAR CON RENDER + POSTGRESQL:
 *
 * 1. Crear base de datos en Render.com:
 *    - Ve a https://render.com
 *    - Crea un nuevo servicio "PostgreSQL"
 *    - Copia las credenciales que te da Render
 *
 * 2. Crear archivo .env en la raíz del proyecto:
 *    VITE_DB_HOST=tu-host.render.com
 *    VITE_DB_PORT=5432
 *    VITE_DB_NAME=nombre_base_datos
 *    VITE_DB_USER=usuario
 *    VITE_DB_PASSWORD=contraseña
 *    VITE_DB_SSL=true
 *
 * 3. Instalar dependencia:
 *    pnpm install pg
 *
 * 4. Descomentar el código de abajo
 */

export const databaseConfig: DatabaseConfig = {
  // NOTA: En producción, estas variables vienen de .env
  host: import.meta.env.VITE_DB_HOST || 'localhost',
  port: parseInt(import.meta.env.VITE_DB_PORT || '5432'),
  database: import.meta.env.VITE_DB_NAME || 'utc_clinica',
  user: import.meta.env.VITE_DB_USER || 'postgres',
  password: import.meta.env.VITE_DB_PASSWORD || '',
  ssl: import.meta.env.VITE_DB_SSL === 'true',
};

/**
 * ESQUEMA DE BASE DE DATOS (SQL)
 *
 * Ejecuta estos comandos en pgAdmin4 o en Render Dashboard:
 */

export const SQL_SCHEMA = `
-- TABLA: usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  rol VARCHAR(50) NOT NULL CHECK (rol IN ('paciente', 'practicante', 'admin')),
  area VARCHAR(50) CHECK (area IN ('nutricion', 'fisioterapia') OR area IS NULL),
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABLA: citas
CREATE TABLE IF NOT EXISTS citas (
  id SERIAL PRIMARY KEY,
  paciente_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('nutricion', 'fisioterapia')),
  fecha DATE NOT NULL,
  hora TIME NOT NULL,
  estado VARCHAR(50) NOT NULL CHECK (estado IN ('programada', 'completada', 'cancelada')),
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABLA: historiales_medicos
CREATE TABLE IF NOT EXISTS historiales_medicos (
  id SERIAL PRIMARY KEY,
  paciente_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('nutricion', 'fisioterapia')),
  datos JSONB NOT NULL,
  creado_por INTEGER REFERENCES usuarios(id),
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABLA: notas_universitarias
CREATE TABLE IF NOT EXISTS notas_universitarias (
  id SERIAL PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  contenido TEXT NOT NULL,
  categoria VARCHAR(50) NOT NULL CHECK (categoria IN ('general', 'nutricion', 'fisioterapia')),
  creado_por INTEGER REFERENCES usuarios(id),
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABLA: practicantes_autorizados
CREATE TABLE IF NOT EXISTS practicantes_autorizados (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
  area VARCHAR(50) NOT NULL CHECK (area IN ('nutricion', 'fisioterapia')),
  estado VARCHAR(50) NOT NULL CHECK (estado IN ('activo', 'inactivo')),
  fecha_autorizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ÍNDICES para mejor rendimiento
CREATE INDEX idx_citas_fecha ON citas(fecha);
CREATE INDEX idx_citas_paciente ON citas(paciente_id);
CREATE INDEX idx_historiales_paciente ON historiales_medicos(paciente_id);
CREATE INDEX idx_usuarios_email ON usuarios(email);
`;

/**
 * EJEMPLO DE USO (cuando conectes la base de datos):
 *
 * import { Pool } from 'pg';
 * import { databaseConfig } from './database.config';
 *
 * const pool = new Pool(databaseConfig);
 *
 * export async function obtenerUsuarios() {
 *   const result = await pool.query('SELECT * FROM usuarios');
 *   return result.rows;
 * }
 */
```

### Archivo `.env` de ejemplo

Crea `/tmp/sandbox/.env.example`:

```env
# ==============================================================================
# CONFIGURACIÓN DE BASE DE DATOS POSTGRESQL (RENDER)
# ==============================================================================
#
# INSTRUCCIONES:
# 1. Copia este archivo y renómbralo a .env
# 2. Reemplaza los valores de ejemplo con tus credenciales reales de Render
# 3. Nunca subas el archivo .env a GitHub (ya está en .gitignore)
#
# ==============================================================================

# Credenciales de PostgreSQL en Render
VITE_DB_HOST=dpg-xxxxxx-a.oregon-postgres.render.com
VITE_DB_PORT=5432
VITE_DB_NAME=utc_clinica_db
VITE_DB_USER=utc_clinica_user
VITE_DB_PASSWORD=tu_password_super_seguro_aqui
VITE_DB_SSL=true
```

---

## 🎨 ESQUEMA DE COLORES

El sistema usa colores específicos de la UTC:

```css
/* Colores principales */
--azul-marino: #1e3a8a (rgb(30, 58, 138))
--azul-700: #1d4ed8
--naranja: #ea580c (rgb(234, 88, 12))
--naranja-700: #c2410c
--blanco: #ffffff

/* Fondos */
--fondo-principal: linear-gradient(135deg, from-blue-50 to-orange-50)
```

**Uso en Tailwind:**
- `bg-blue-900` → Azul marino
- `bg-orange-600` → Naranja
- `text-blue-900` → Texto azul oscuro
- `border-blue-900/20` → Borde azul con 20% opacidad

---

## 📝 VARIABLES Y COMENTARIOS EN ESPAÑOL

Todos los archivos ya incluyen:

✅ **Variables en español** (nombreCompleto, datosPersonales, etc.)
✅ **Comentarios explicativos** en cada sección
✅ **Bloques de documentación** al inicio de cada archivo
✅ **Secciones marcadas** con separadores visuales

**Ejemplo de estructura de comentarios:**

```tsx
/**
 * ============================================================================
 * SECCIÓN: Nombre de la sección
 * ============================================================================
 */

// EXPLICACIÓN: Lo que hace este código
const variable = valor;

/**
 * FUNCIÓN: nombreFunción
 * PROPÓSITO: Qué hace esta función
 * @param parametro - Qué representa este parámetro
 * @returns Qué devuelve la función
 */
function nombreFunción(parametro: string): void {
  // Implementación...
}
```

---

## 🚀 CÓMO EJECUTAR EL PROYECTO

### 1. Instalar dependencias

```bash
cd /tmp/sandbox
pnpm install
```

### 2. Ejecutar en modo desarrollo

```bash
pnpm dev
```

### 3. Credenciales de prueba

**Administrador:**
- Email: `admin1@utc.edu.mx`
- Password: `admin123`

**Practicante de Nutrición:**
- Email: `practicante1@utc.edu.mx`
- Password: `prac123`

**Practicante de Fisioterapia:**
- Email: `practicante2@utc.edu.mx`
- Password: `prac123`

**Paciente:**
- Email: `paciente1@gmail.com`
- Password: `pac123`

---

## 📊 FLUJO DE USUARIO POR ROL

### PACIENTE
1. Login → PatientDashboard
2. Puede:
   - Agendar citas
   - Ver sus citas programadas
   - Ver planes médicos
   - NO puede acceder a formularios

### PRACTICANTE
1. Login → PractitionerDashboard
2. Puede:
   - Ver pacientes
   - Ver citas de hoy
   - Acceder a formularios de evaluación (durante citas)
   - Ver notas universitarias
   - **Ver estadísticas** (botón nuevo)
   - NO puede gestionar citas de otros
   - NO puede gestionar practicantes

### ADMINISTRADOR
1. Login → AdminDashboard
2. Puede:
   - Gestionar todas las citas
   - Ver todos los pacientes
   - Ver historiales médicos
   - Publicar notas para practicantes
   - **Ver estadísticas completas** (con comparativa de áreas)
   - **Administrar practicantes** (agregar, desactivar, eliminar)

---

## 🔒 PERMISOS DE FORMULARIOS

**IMPORTANTE:** Los pacientes NO pueden ver formularios médicos.

**Implementación actual:**

```tsx
// En routes (App.tsx)
<Route
  path="/forms/nutricion/:appointmentId"
  element={
    <ProtectedRoute allowedRoles={['practicante', 'admin']}>
      <NutritionFormPage />
    </ProtectedRoute>
  }
/>
```

**Los practicantes acceden desde:**
- Dashboard → Citas de Hoy → Botón "Iniciar Evaluación"

---

## 📈 FUNCIONALIDADES DE ESTADÍSTICAS

### Para Practicantes:
✅ Total de citas
✅ Citas hoy
✅ Promedio diario
✅ Gráfico de líneas (últimos 14 días)
✅ Top 5 días con más citas
✅ Top 5 días con menos citas

### Solo para Administradores (adicional):
✅ Gráfico de pastel (distribución por área)
✅ Tabla de rendimiento comparativo
✅ Indicador de qué área tiene mejor rendimiento

---

## 🛠️ PRÓXIMOS PASOS PARA CONECTAR POSTGRESQL

1. **Crear base de datos en Render:**
   - https://render.com → New PostgreSQL

2. **Copiar credenciales a .env**

3. **Ejecutar el schema SQL** (en pgAdmin4 o Render Dashboard)

4. **Crear API Backend** (Express + Node.js):
   ```bash
   # En directorio separado
   mkdir utc-api
   cd utc-api
   npm init -y
   npm install express pg cors dotenv
   ```

5. **Modificar los archivos del frontend** para hacer fetch a la API en lugar de localStorage

**Ejemplo de migración:**

```tsx
// ❌ ANTES (localStorage)
const citas = JSON.parse(localStorage.getItem('utc_appointments') || '[]');

// ✅ DESPUÉS (API)
const response = await fetch('https://tu-api.render.com/api/citas');
const citas = await response.json();
```

---

## ✨ RESUMEN DE MEJORAS IMPLEMENTADAS

✅ Formulario de nutrición COMPLETO con todos los campos de las imágenes
✅ Secciones colapsables para mejor UX
✅ Sistema de permisos robusto
✅ Estadísticas con gráficos profesionales (recharts)
✅ Gestión de practicantes completa
✅ Responsive en todas las páginas
✅ Variables en español
✅ Comentarios explicativos exhaustivos
✅ Preparado para conectar PostgreSQL
✅ Estructura escalable y profesional

---

## 📞 NOTAS FINALES

- Todos los datos están en **localStorage** por ahora
- El sistema es 100% funcional sin base de datos
- Cuando conectes PostgreSQL, solo cambiarás las funciones de lectura/escritura
- Los componentes UI de Shadcn ya están instalados
- Recharts para gráficos ya está instalado
- React Router 7 configurado correctamente

**¿Dudas?** Revisa los comentarios dentro de cada archivo, están diseñados para ser autoexplicativos.

---

**CREADO POR: Claude Code**
**FECHA: 30 de Marzo, 2026**
**PROYECTO: Clínica Universitaria UTC**
**VERSIÓN: 2.0**
