# 📚 GUÍA DE USO - Supabase en el Código

---

## 📋 ÍNDICE

1. [Configuración Inicial](#configuracion-inicial)
2. [Operaciones CRUD](#operaciones-crud)
3. [Autenticación](#autenticacion)
4. [Consultas Comunes](#consultas-comunes)
5. [Manejo de Errores](#manejo-errores)
6. [Ejemplos Prácticos](#ejemplos-practicos)

---

## 1️⃣ CONFIGURACIÓN INICIAL {#configuracion-inicial}

### Instalar dependencias

```bash
pnpm add @supabase/supabase-js
```

### Crear cliente de Supabase

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### Archivo .env.local

```env
VITE_SUPABASE_URL=https://xxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **IMPORTANTE**: No subas `.env.local` a Git. Agrega al `.gitignore`:
```
.env.local
.env
```

---

## 2️⃣ OPERACIONES CRUD {#operaciones-crud}

### ✅ CREATE (Insertar datos)

```typescript
// Crear un nuevo usuario
const { data, error } = await supabase
  .from('users')
  .insert([
    {
      name: 'Juan Pérez',
      email: 'juan@example.com',
      password: 'hashed_password', // Usar bcrypt en producción
      role: 'paciente'
    }
  ])
  .select(); // Devuelve los datos insertados

if (error) {
  console.error('Error al crear usuario:', error);
} else {
  console.log('Usuario creado:', data);
}
```

### 📖 READ (Leer datos)

```typescript
// Obtener todos los usuarios
const { data, error } = await supabase
  .from('users')
  .select('*');

// Con filtros
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('role', 'paciente') // WHERE role = 'paciente'
  .order('name', { ascending: true });

// Con JOIN
const { data, error } = await supabase
  .from('appointments')
  .select(`
    *,
    users (
      name,
      email
    )
  `)
  .eq('status', 'programada');
```

### ✏️ UPDATE (Actualizar datos)

```typescript
// Actualizar un usuario
const { data, error } = await supabase
  .from('users')
  .update({ name: 'Juan Pérez García' })
  .eq('id', userId)
  .select();

if (error) {
  console.error('Error al actualizar:', error);
} else {
  console.log('Usuario actualizado:', data);
}
```

### ❌ DELETE (Eliminar datos)

```typescript
// Eliminar una cita
const { error } = await supabase
  .from('appointments')
  .delete()
  .eq('id', appointmentId);

if (error) {
  console.error('Error al eliminar:', error);
}
```

---

## 3️⃣ AUTENTICACIÓN {#autenticacion}

### Registrar usuario

```typescript
// src/lib/auth.ts
import { supabase } from './supabase';

export async function signUp(email: string, password: string, userData: any) {
  // 1. Crear cuenta en Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) throw authError;

  // 2. Crear registro en tabla users
  const { data: user, error: userError } = await supabase
    .from('users')
    .insert([
      {
        id: authData.user?.id, // Usar el mismo ID de auth
        name: userData.name,
        email: email,
        role: userData.role,
        area: userData.area,
      }
    ])
    .select()
    .single();

  if (userError) throw userError;

  return user;
}
```

### Iniciar sesión

```typescript
export async function signIn(email: string, password: string) {
  // 1. Autenticar con Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) throw authError;

  // 2. Obtener datos completos del usuario
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', authData.user.id)
    .single();

  if (userError) throw userError;

  return user;
}
```

### Cerrar sesión

```typescript
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
```

### Obtener usuario actual

```typescript
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Obtener datos completos
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) throw error;
  return data;
}
```

---

## 4️⃣ CONSULTAS COMUNES {#consultas-comunes}

### 🗓️ Obtener citas de hoy

```typescript
export async function getTodayAppointments(userId: string, userArea?: string) {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  let query = supabase
    .from('appointments')
    .select('*')
    .eq('date', today)
    .eq('status', 'programada');

  // Si es practicante, filtrar por área
  if (userArea) {
    query = query.eq('type', userArea);
  }

  const { data, error } = await query.order('time', { ascending: true });

  if (error) throw error;
  return data;
}
```

### 📊 Obtener citas de un paciente

```typescript
export async function getPatientAppointments(patientId: string) {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('patient_id', patientId)
    .order('date', { ascending: false });

  if (error) throw error;
  return data;
}
```

### 📄 Obtener historiales médicos

```typescript
export async function getMedicalHistories(patientId: string, type?: string) {
  let query = supabase
    .from('medical_histories')
    .select('*')
    .eq('patient_id', patientId);

  // Filtrar por tipo si se especifica
  if (type) {
    query = query.eq('type', type);
  }

  const { data, error } = await query.order('date', { ascending: false });

  if (error) throw error;
  return data;
}
```

### 📢 Obtener notas (con filtro de categoría)

```typescript
export async function getNotes(category?: string) {
  let query = supabase
    .from('notes')
    .select('*');

  // Si hay categoría, mostrar esa categoría + general
  if (category) {
    query = query.in('category', [category, 'general']);
  }

  const { data, error } = await query.order('created_date', { ascending: false });

  if (error) throw error;
  return data;
}
```

### 👥 Obtener todos los pacientes

```typescript
export async function getAllPatients() {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, email')
    .eq('role', 'paciente')
    .order('name', { ascending: true });

  if (error) throw error;
  return data;
}
```

### 🔍 Buscar paciente por nombre o email

```typescript
export async function searchPatients(searchTerm: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('role', 'paciente')
    .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
    .order('name', { ascending: true });

  if (error) throw error;
  return data;
}
```

### 📅 Crear cita

```typescript
export async function createAppointment(appointmentData: {
  patientId: string;
  patientName: string;
  type: 'nutricion' | 'fisioterapia';
  date: string;
  time: string;
}) {
  const { data, error } = await supabase
    .from('appointments')
    .insert([
      {
        patient_id: appointmentData.patientId,
        patient_name: appointmentData.patientName,
        type: appointmentData.type,
        date: appointmentData.date,
        time: appointmentData.time,
        status: 'programada',
      }
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

### 📝 Crear historial médico

```typescript
export async function createMedicalHistory(historyData: {
  patientId: string;
  patientName: string;
  type: 'nutricion' | 'fisioterapia';
  data: Record<string, any>;
  createdBy: string;
  createdById: string;
}) {
  const { data, error } = await supabase
    .from('medical_histories')
    .insert([
      {
        patient_id: historyData.patientId,
        patient_name: historyData.patientName,
        type: historyData.type,
        date: new Date().toISOString().split('T')[0],
        data: historyData.data,
        created_by: historyData.createdBy,
        created_by_id: historyData.createdById,
      }
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

### 📢 Crear nota (solo admin)

```typescript
export async function createNote(noteData: {
  title: string;
  content: string;
  category: 'general' | 'nutricion' | 'fisioterapia';
  createdBy: string;
  createdById: string;
}) {
  const { data, error } = await supabase
    .from('notes')
    .insert([
      {
        title: noteData.title,
        content: noteData.content,
        category: noteData.category,
        created_by: noteData.createdBy,
        created_by_id: noteData.createdById,
      }
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

---

## 5️⃣ MANEJO DE ERRORES {#manejo-errores}

### Tipos de errores comunes

```typescript
import { PostgrestError } from '@supabase/supabase-js';

export function handleSupabaseError(error: PostgrestError) {
  // Error de violación de unicidad (email duplicado)
  if (error.code === '23505') {
    return 'Este correo electrónico ya está registrado';
  }

  // Error de clave foránea (paciente no existe)
  if (error.code === '23503') {
    return 'El paciente especificado no existe';
  }

  // Error de RLS (sin permisos)
  if (error.code === 'PGRST301') {
    return 'No tienes permisos para realizar esta acción';
  }

  // Error genérico
  return error.message || 'Error desconocido';
}
```

### Uso en componentes

```typescript
try {
  const appointments = await getTodayAppointments(user.id, user.area);
  setAppointments(appointments);
} catch (error) {
  const message = handleSupabaseError(error as PostgrestError);
  toast.error(message);
}
```

---

## 6️⃣ EJEMPLOS PRÁCTICOS {#ejemplos-practicos}

### Ejemplo 1: Hook personalizado para citas

```typescript
// src/hooks/useAppointments.ts
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function useAppointments() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAppointments() {
      try {
        let query = supabase
          .from('appointments')
          .select('*');

        // Filtrar según rol
        if (user?.role === 'paciente') {
          query = query.eq('patient_id', user.id);
        } else if (user?.role === 'practicante') {
          query = query.eq('type', user.area);
        }

        const { data, error } = await query.order('date', { ascending: false });

        if (error) throw error;
        setAppointments(data);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchAppointments();
    }
  }, [user]);

  return { appointments, loading };
}
```

### Ejemplo 2: Suscripciones en tiempo real

```typescript
// src/hooks/useRealtimeAppointments.ts
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useRealtimeAppointments(patientId?: string) {
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    // Cargar datos iniciales
    fetchAppointments();

    // Suscribirse a cambios en tiempo real
    const subscription = supabase
      .channel('appointments_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'appointments',
          filter: patientId ? `patient_id=eq.${patientId}` : undefined,
        },
        (payload) => {
          console.log('Change received!', payload);
          fetchAppointments(); // Recargar datos
        }
      )
      .subscribe();

    // Cleanup
    return () => {
      subscription.unsubscribe();
    };
  }, [patientId]);

  async function fetchAppointments() {
    let query = supabase.from('appointments').select('*');

    if (patientId) {
      query = query.eq('patient_id', patientId);
    }

    const { data, error } = await query;
    if (!error) {
      setAppointments(data);
    }
  }

  return appointments;
}
```

### Ejemplo 3: Componente con Supabase

```typescript
// src/components/AppointmentList.tsx
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function AppointmentList({ patientId }: { patientId: string }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAppointments();
  }, [patientId]);

  async function loadAppointments() {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('patient_id', patientId)
        .order('date', { ascending: false });

      if (error) throw error;
      setAppointments(data);
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
  }

  async function cancelAppointment(id: string) {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelada' })
        .eq('id', id);

      if (error) throw error;

      // Recargar lista
      loadAppointments();
    } catch (error) {
      console.error('Error canceling appointment:', error);
    }
  }

  if (loading) return <div>Cargando...</div>;

  return (
    <div>
      {appointments.map((apt) => (
        <div key={apt.id}>
          <p>{apt.patient_name}</p>
          <p>{apt.date} - {apt.time}</p>
          <p>{apt.type}</p>
          <button onClick={() => cancelAppointment(apt.id)}>
            Cancelar
          </button>
        </div>
      ))}
    </div>
  );
}
```

---

## 🔐 MEJORES PRÁCTICAS

### ✅ DO (Haz esto)

1. **Usa RLS siempre**
   ```typescript
   // RLS se encarga de la seguridad automáticamente
   const { data } = await supabase.from('users').select('*');
   ```

2. **Valida en el backend**
   ```typescript
   // Usa Supabase Edge Functions para lógica compleja
   ```

3. **Maneja errores correctamente**
   ```typescript
   const { data, error } = await supabase.from('users').select('*');
   if (error) {
     console.error(error);
     toast.error('Error al cargar datos');
     return;
   }
   ```

4. **Usa select específico**
   ```typescript
   // ✅ Mejor performance
   .select('id, name, email')

   // ❌ Peor performance (trae todo)
   .select('*')
   ```

### ❌ DON'T (No hagas esto)

1. **No uses service_role key en frontend**
   ```typescript
   // ❌ PELIGROSO - Nunca hagas esto
   const supabase = createClient(url, SERVICE_ROLE_KEY);
   ```

2. **No guardes contraseñas en texto plano**
   ```typescript
   // ❌ MAL
   password: '12345'

   // ✅ BIEN
   password: await bcrypt.hash('12345', 10)
   ```

3. **No confíes solo en validación frontend**
   ```typescript
   // ❌ MAL - El usuario puede modificar el frontend
   if (userRole === 'admin') {
     // hacer algo sensible
   }

   // ✅ BIEN - RLS valida en el servidor
   ```

---

## 📞 TROUBLESHOOTING

### "Row Level Security policy violation"
- **Causa**: Tu usuario no tiene permisos para ver/modificar esos datos
- **Solución**: Verifica que las políticas RLS estén correctas en Supabase Dashboard

### "relation 'public.users' does not exist"
- **Causa**: La tabla no existe
- **Solución**: Ejecuta el schema SQL en Supabase SQL Editor

### "Invalid API key"
- **Causa**: La anon key es incorrecta o expiró
- **Solución**: Verifica en Settings → API y copia la key correcta

### "Failed to fetch"
- **Causa**: URL incorrecta o problema de red
- **Solución**: Verifica la URL en Settings → API

---

**Versión**: 1.0
**Última actualización**: Abril 2026
