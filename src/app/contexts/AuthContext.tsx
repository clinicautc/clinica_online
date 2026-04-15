/**
 * ============================================================================
 * ARCHIVO: AuthContext.tsx (Versión Extensa y Sincronizada)
 * UBICACIÓN: src/app/contexts/AuthContext.tsx
 * PROPÓSITO: Gestión centralizada de autenticación, persistencia y roles.
 * ============================================================================
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

/**
 * INTERFAZ: User
 * Refleja la estructura estricta de la tabla 'usuarios' en la base de datos.
 */
export interface User {
  id: string | number;
  nombre: string;         // Mapeado desde la columna SQL 'nombre'
  email: string;          // Correo institucional o personal
  rol: 'paciente' | 'practicante' | 'admin' | 'master'; 
  area?: 'nutricion' | 'fisioterapia' | null;
  status?: string;        // Ejem: 'activo', 'suspendido'
}

/**
 * INTERFAZ: AuthContextType
 */
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string, role?: string, area?: string) => Promise<boolean>; 
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * COMPONENTE PROVIDER: AuthProvider
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * EFECTO DE REHIDRATACIÓN:
   * Verifica la sesión persistente al cargar la aplicación.
   */
  useEffect(() => {
    const loadStoredUser = () => {
      try {
        const storedUser = localStorage.getItem('utc_current_user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          // Normalización preventiva de campos para evitar discrepancias de nombres
          parsedUser.rol = parsedUser.rol || parsedUser.role;
          setUser(parsedUser);
          console.log("✅ AuthContext: Sesión rehidratada correctamente.");
        }
      } catch (error) {
        console.error("❌ AuthContext: Error al recuperar sesión local:", error);
        localStorage.removeItem('utc_current_user');
      } finally {
        setIsLoading(false);
      }
    };
    loadStoredUser();
  }, []);

  /**
   * FUNCIÓN: login
   * Realiza la validación contra el backend y asegura la persistencia atómica.
   */
  const login = async (email: string, password: string): Promise<User> => {
    try {
      const searchEmail = email.trim().toLowerCase();

      const response = await fetch('http://localhost:3001/api/usuarios/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: searchEmail, password })
      });

      const data = await response.json();

      if (response.ok) {
        // MAPEO EXHAUSTIVO: Normalizamos los datos del Backend a nuestra interfaz
        const foundUser: User = {
          id: data.id,
          nombre: data.nombre || data.name, 
          email: data.email,
          rol: data.rol || data.role || 'paciente',   
          area: data.area,
          status: data.status || 'activo'
        };

        // BLOQUEO DE PERSISTENCIA: Guardamos en disco ANTES de actualizar el estado
        // Esto garantiza que el router encuentre la sesión al navegar.
        localStorage.setItem('utc_current_user', JSON.stringify(foundUser));
        setUser(foundUser);
        
        return foundUser; 
      } else {
        throw new Error(data.error || 'Credenciales no válidas');
      }
    } catch (error: any) {
      console.error("❌ AuthContext: Error en proceso de login:", error.message);
      throw error;
    }
  };

  /**
   * FUNCIÓN: register
   */
  const register = async (
    name: string, 
    email: string, 
    password: string, 
    providedRole?: string, 
    providedArea?: string
  ): Promise<boolean> => {
    try {
      const searchEmail = email.trim().toLowerCase();

      // Mantenemos la lógica de registro flexible solicitada
      const response = await fetch('http://localhost:3001/api/usuarios/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          nombre: name, 
          email: searchEmail, 
          password,
          rol: providedRole,
          area: providedArea
        }) 
      });

      if (response.ok) {
        const data = await response.json();
        const newUser: User = {
          id: data.id,
          nombre: data.nombre,
          email: data.email,
          rol: data.rol || data.role,
          area: data.area,
          status: data.status || 'activo'
        };

        localStorage.setItem('utc_current_user', JSON.stringify(newUser));
        setUser(newUser);
        return true;
      } else {
        const errorData = await response.json();
        console.error("❌ AuthContext: Error en respuesta de registro:", errorData);
      }
    } catch (error) {
      console.error("❌ AuthContext: Error de comunicación con el servidor:", error);
    }
    return false;
  };

  /**
   * FUNCIÓN: logout
   */
  const logout = () => {
    setUser(null);
    localStorage.removeItem('utc_current_user');
    console.log("👋 Sesión cerrada correctamente.");
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {/* NOTAS SHERLOCK SOBRE EL REBOTE:
          Mientras isLoading sea true, mostramos un estado neutro.
          Esto detiene a ProtectedRoute de redirigir al Login prematuramente.
      */}
      {isLoading ? (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mb-4"></div>
          <p className="text-blue-900 font-serif animate-pulse">Sincronizando con Clínica UTC...</p>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

/**
 * HOOK PERSONALIZADO: useAuth
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe utilizarse dentro de un AuthProvider');
  }
  return context;
}