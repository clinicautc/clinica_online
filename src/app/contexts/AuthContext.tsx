/**
 * ============================================================================
 * ARCHIVO: AuthContext.tsx (Versión PRO - API Centralizada)
 * ============================================================================
 */
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { endpoints } from '../lib/api'; // <-- IMPORTACIÓN DE TU API CENTRALIZADA

export interface User {
  id: string | number;
  nombre: string;
  email: string;
  rol: 'paciente' | 'practicante' | 'admin' | 'master';
  area?: 'nutricion' | 'fisioterapia' | null;
  estado?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (nombre: string, email: string, password: string, rol?: string, area?: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStoredUser = () => {
      try {
        const storedUser = localStorage.getItem('utc_current_user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        localStorage.removeItem('utc_current_user');
      } finally {
        setIsLoading(false);
      }
    };
    loadStoredUser();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    try {
      // USO DE LA API CENTRALIZADA
      const response = await fetch(`${endpoints.usuarios}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password })
      });

      const data = await response.json();

      if (response.ok) {
        const foundUser: User = {
          id: data.id,
          nombre: data.nombre,
          email: data.email,
          rol: data.rol,
          area: data.area,
          estado: data.estado || 'activo'
        };

        localStorage.setItem('utc_current_user', JSON.stringify(foundUser));
        setUser(foundUser);
        return foundUser;
      } else {
        throw new Error(data.error || 'Credenciales no válidas');
      }
    } catch (error: any) {
      throw error;
    }
  };

  const register = async (nombre: string, email: string, password: string, providedRole?: string, providedArea?: string): Promise<boolean> => {
    try {
      // USO DE LA API CENTRALIZADA
      const response = await fetch(`${endpoints.usuarios}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre,
          email: email.trim().toLowerCase(),
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
          rol: data.rol,
          area: data.area,
          estado: data.estado || 'activo'
        };
        localStorage.setItem('utc_current_user', JSON.stringify(newUser));
        setUser(newUser);
        return true;
      }
    } catch (error) {
      console.error("Error de registro:", error);
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('utc_current_user');
  };

  return (
      <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, register, logout }}>
        {isLoading ? (
            <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mb-4"></div>
              <p className="text-blue-900 font-serif animate-pulse">Sincronizando con Clínica UTC...</p>
            </div>
        ) : children}
      </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth debe usarse dentro de un AuthProvider');
  return context;
}