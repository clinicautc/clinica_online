# 🏥 SISTEMA CLÍNICA UTC - Documentación de Base de Datos

---

## 📚 ÍNDICE DE DOCUMENTACIÓN

Este proyecto incluye **documentación completa** para configurar y usar la base de datos Supabase. Aquí está todo lo que necesitas:

### 📄 Documentos Disponibles

1. **[DATABASE_SETUP.md](./DATABASE_SETUP.md)** ⭐ **COMIENZA AQUÍ**
   - Guía paso a paso para configurar Supabase desde cero
   - Instrucciones para ejecutar el schema SQL
   - Configuración de variables de entorno
   - Verificación de que todo funciona correctamente

2. **[database-schema.sql](./database-schema.sql)** 📝 **ARCHIVO SQL**
   - Script SQL completo para crear toda la base de datos
   - Incluye tablas, tipos ENUM, índices, y políticas RLS
   - Datos de prueba iniciales (seed data)
   - Funciones y triggers automáticos

3. **[VARIABLES_ENTORNO.md](./VARIABLES_ENTORNO.md)** 🔐 **CONFIGURACIÓN**
   - Lista de todas las variables de entorno necesarias
   - Nombres exactos de los campos en cada tabla
   - Valores ENUM permitidos
   - Consultas SQL útiles

4. **[DIAGRAMA_BASE_DATOS.md](./DIAGRAMA_BASE_DATOS.md)** 📊 **ARQUITECTURA**
   - Diagrama visual de todas las tablas
   - Relaciones entre tablas (Foreign Keys)
   - Políticas de seguridad (RLS) explicadas
   - Flujo de datos del sistema

5. **[GUIA_USO_SUPABASE.md](./GUIA_USO_SUPABASE.md)** 💻 **CÓDIGO**
   - Ejemplos de código para usar Supabase
   - Operaciones CRUD completas
   - Hooks personalizados
   - Mejores prácticas y troubleshooting

---

## 🚀 INICIO RÁPIDO (5 PASOS)

### 1️⃣ Crear cuenta en Supabase
- Ve a [supabase.com](https://supabase.com)
- Crea una cuenta gratuita
- Crea un nuevo proyecto

### 2️⃣ Ejecutar el schema SQL
- Abre el SQL Editor en Supabase
- Copia el contenido de `database-schema.sql`
- Pégalo y ejecuta (Run)

### 3️⃣ Obtener credenciales
- Ve a Settings → API
- Copia `Project URL` y `anon public key`

### 4️⃣ Configurar en Figma Make
- Abre Make Settings
- Pega las credenciales de Supabase
- Click en "Connect"

### 5️⃣ ¡Listo!
- Tu aplicación ahora usa Supabase en lugar de localStorage
- Los datos persisten en la nube
- Múltiples usuarios pueden usar el sistema

---

## 📋 ESTRUCTURA DE LA BASE DE DATOS

### 5 Tablas Principales

```
┌─────────────────────────────────────────┐
│  USERS                                  │
│  - Pacientes, Practicantes, Admins      │
└─────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
┌──────────────────┐    ┌──────────────────┐
│  APPOINTMENTS    │    │ MEDICAL_HISTORIES│
│  - Citas         │    │ - Historiales    │
└──────────────────┘    └──────────────────┘

┌──────────────────┐    ┌──────────────────┐
│  NOTES           │    │  PRACTITIONERS   │
│  - Avisos        │    │  - Autorizados   │
└──────────────────┘    └──────────────────┘
```

### Características

- ✅ **Row Level Security (RLS)** habilitado en todas las tablas
- ✅ **Separación por área**: Nutrición y Fisioterapia completamente separadas
- ✅ **3 niveles de acceso**: Paciente, Practicante (por área), Admin
- ✅ **Índices optimizados** para búsquedas rápidas
- ✅ **Triggers automáticos** para actualizar timestamps
- ✅ **Datos de prueba** incluidos para testing

---

## 🎯 NIVELES DE ACCESO

### 👤 Pacientes
- Ver su propio perfil
- Ver sus propias citas
- Crear nuevas citas
- Ver sus historiales médicos
- Ver notas generales

### 🎓 Practicantes de Nutrición
- Ver y gestionar citas de **NUTRICIÓN** únicamente
- Ver y crear historiales de **NUTRICIÓN** únicamente
- Ver notas de categoría "nutrición" y "general"

### 🎓 Practicantes de Fisioterapia
- Ver y gestionar citas de **FISIOTERAPIA** únicamente
- Ver y crear historiales de **FISIOTERAPIA** únicamente
- Ver notas de categoría "fisioterapia" y "general"

### 👨‍⚕️ Administradores
- Acceso total a todo el sistema
- Ver y gestionar todos los usuarios
- Ver y gestionar todas las citas (ambas áreas)
- Ver y gestionar todos los historiales
- Crear, editar y eliminar notas
- Gestionar practicantes autorizados

---

## 🔐 SEGURIDAD

### Row Level Security (RLS)

Todas las tablas tienen **RLS habilitado**, lo que significa:

1. **Automático**: No necesitas validar permisos en el código frontend
2. **Seguro**: Aunque alguien modifique el código frontend, el backend valida
3. **Por rol y área**: Cada usuario solo ve lo que le corresponde

### Ejemplo de Política RLS

```sql
-- Practicantes de nutrición solo ven citas de nutrición
CREATE POLICY "Practitioners can view appointments in their area"
  ON appointments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'practicante'
        AND users.area::text = appointments.type::text
    )
  );
```

---

## 📊 DATOS INCLUIDOS (SEED DATA)

El schema incluye datos de prueba para que puedas empezar inmediatamente:

### Usuarios
- ✅ 1 Administrador
- ✅ 1 Practicante de Nutrición
- ✅ 1 Practicante de Fisioterapia
- ✅ 3 Pacientes

### Datos de prueba
- ✅ 3 citas de ejemplo
- ✅ 2 historiales médicos de ejemplo
- ✅ 3 notas de ejemplo

### Credenciales de prueba
```
Admin:
  Email: admin@utc.edu.mx
  Password: admin123

Practicante Nutrición:
  Email: practicante1@utc.edu.mx
  Password: prac123

Practicante Fisioterapia:
  Email: practicante2@utc.edu.mx
  Password: prac123

Paciente:
  Email: paciente1@gmail.com
  Password: pac123
```

---

## 🛠️ CARACTERÍSTICAS TÉCNICAS

### Tipos ENUM
- `user_role`: paciente | practicante | admin
- `specialty_area`: nutricion | fisioterapia
- `appointment_type`: nutricion | fisioterapia
- `appointment_status`: programada | completada | cancelada
- `note_category`: general | nutricion | fisioterapia
- `practitioner_status`: activo | inactivo

### Campos JSONB
La tabla `medical_histories` usa JSONB para almacenar datos flexibles:
- Los formularios de nutrición y fisioterapia tienen campos diferentes
- JSONB permite agregar campos sin modificar el schema
- Se puede buscar dentro del JSON con índices GIN

### Triggers Automáticos
- Todas las tablas tienen un trigger que actualiza `updated_at` automáticamente
- No necesitas actualizar este campo manualmente

---

## 📖 EJEMPLO DE USO EN CÓDIGO

### Obtener citas de hoy (Practicante)

```typescript
import { supabase } from './lib/supabase';

// Automáticamente filtra por área gracias a RLS
const { data: appointments } = await supabase
  .from('appointments')
  .select('*')
  .eq('date', today)
  .eq('status', 'programada')
  .order('time');

// Si eres practicante de nutrición, solo verás citas de nutrición
// Si eres practicante de fisioterapia, solo verás citas de fisioterapia
// Si eres admin, verás todas las citas
```

### Crear historial médico

```typescript
const { data, error } = await supabase
  .from('medical_histories')
  .insert([{
    patient_id: patientId,
    patient_name: patientName,
    type: 'nutricion', // o 'fisioterapia'
    date: new Date().toISOString().split('T')[0],
    data: {
      peso: '75',
      altura: '1.75',
      imc: '24.5',
      presionArterial: '120/80',
      // ... más campos del formulario
    },
    created_by: practitionerName,
    created_by_id: practitionerId,
  }])
  .select()
  .single();
```

---

## ❓ PREGUNTAS FRECUENTES

### ¿Necesito Supabase para usar esta aplicación?
**Opción 1**: Actualmente funciona con localStorage (solo para desarrollo/demo)
**Opción 2**: Conecta Supabase para datos persistentes en la nube (recomendado)

### ¿Cuánto cuesta Supabase?
**Gratis** hasta 500 MB de base de datos, suficiente para ~50,000 usuarios.

### ¿Puedo modificar el schema después?
Sí, puedes ejecutar `ALTER TABLE` para agregar/modificar campos.

### ¿Los datos de prueba se pueden borrar?
Sí, simplemente ejecuta `DELETE FROM table_name` para limpiar.

### ¿Cómo agrego más practicantes?
1. Crea el usuario en la tabla `users` con `role='practicante'` y `area`
2. Agrégalo a la tabla `practitioners` para autorizarlo

### ¿Puedo cambiar las contraseñas de prueba?
Sí, pero en producción debes usar **hashing** (bcrypt/argon2).

---

## 🚨 IMPORTANTE: PRODUCCIÓN

### Antes de lanzar a producción:

1. ✅ **Cambiar contraseñas**: Reemplaza las contraseñas de prueba
2. ✅ **Hashear contraseñas**: Usa bcrypt en lugar de texto plano
3. ✅ **Verificar RLS**: Asegúrate de que todas las políticas sean correctas
4. ✅ **Configurar backups**: Supabase hace backups automáticos
5. ✅ **Monitorear logs**: Revisa regularmente en Supabase Dashboard
6. ✅ **Actualizar .env**: No subas archivos .env a Git público

---

## 📞 SOPORTE

### ¿Problemas o dudas?

1. **Revisa la documentación**: Lee los 5 archivos de documentación
2. **SQL Editor**: Usa el SQL Editor de Supabase para debugging
3. **Logs**: Revisa los logs en Supabase Dashboard → Logs
4. **Documentación oficial**: [supabase.com/docs](https://supabase.com/docs)

---

## 📁 ARCHIVOS DEL PROYECTO

```
proyecto/
├── README_BASE_DATOS.md          ← Estás aquí
├── DATABASE_SETUP.md             ← Guía de instalación
├── database-schema.sql           ← Script SQL completo
├── VARIABLES_ENTORNO.md          ← Variables y configuración
├── DIAGRAMA_BASE_DATOS.md        ← Arquitectura visual
├── GUIA_USO_SUPABASE.md          ← Ejemplos de código
└── src/
    ├── app/
    │   ├── App.tsx               ← Usa RouterProvider
    │   ├── routes.tsx            ← Configuración de rutas
    │   ├── pages/
    │   │   ├── Login.tsx
    │   │   ├── Register.tsx
    │   │   ├── PatientDashboard.tsx
    │   │   ├── NutritionPractitionerDashboard.tsx    ← Nutrición
    │   │   ├── PhysiotherapyPractitionerDashboard.tsx ← Fisioterapia
    │   │   └── AdminDashboard.tsx
    │   └── lib/
    │       └── mockData.ts       ← Datos de prueba (localStorage)
    └── (más archivos...)
```

---

## ✨ CARACTERÍSTICAS DEL SISTEMA

### Módulos Separados por Área

El sistema está **completamente separado** por especialidad:

#### 🍎 Módulo de Nutrición
- Dashboard específico para practicantes de nutrición
- Solo ve citas de nutrición
- Solo ve historiales de nutrición
- Tema visual naranja

#### 🏃 Módulo de Fisioterapia
- Dashboard específico para practicantes de fisioterapia
- Solo ve citas de fisioterapia
- Solo ve historiales de fisioterapia
- Tema visual azul

#### 👨‍⚕️ Panel de Administrador
- Dashboard único para el jefe/coordinador
- Ve todo: ambas áreas, todas las citas, todos los historiales
- Gestión de practicantes
- Publicación de notas/avisos

#### 👤 Panel de Pacientes
- Sin cambios, igual que antes
- Puede agendar citas de ambos tipos
- Ve sus propias citas e historiales

---

## 🎉 ¡TODO LISTO!

Ahora tienes:

- ✅ Error de react-router-dom **solucionado**
- ✅ Módulos de fisioterapia y nutrición **separados**
- ✅ Base de datos SQL **completa**
- ✅ Documentación **detallada**
- ✅ Políticas RLS **configuradas**
- ✅ Ejemplos de código **incluidos**

**Próximos pasos**:
1. Lee `DATABASE_SETUP.md`
2. Crea tu proyecto en Supabase
3. Ejecuta `database-schema.sql`
4. Conecta desde Make Settings
5. ¡Empieza a usar el sistema!

---

**Versión**: 1.0
**Última actualización**: Abril 2026
**Autor**: Sistema Clínica UTC
