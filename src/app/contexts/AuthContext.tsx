/**
 * ============================================================================
 * ARCHIVO: AuthContext.tsx
 * PROPÓSITO: Gestión global de autenticación profesional
 * ============================================================================
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode
} from 'react';

import { authAPI } from '../lib/api';

export interface User {
  telefono: string;
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

  login: (
    email: string,
    password: string
  ) => Promise<User>;

  logout: () => void;
}

const AuthContext =
  createContext<AuthContextType | undefined>(
    undefined
  );

export function AuthProvider({
  children
}: {
  children: ReactNode;
}) {

  const [user, setUser] =
    useState<User | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  /**
   * ============================================================================
   * DURACIÓN DE SESIÓN
   * 24 horas
   * ============================================================================
   */
  const SESSION_DURATION =
    1000 * 60 * 60 * 24;

  /**
   * ============================================================================
   * VALIDAR SESIÓN GUARDADA
   * ============================================================================
   */
  useEffect(() => {

    const loadStoredUser = async () => {

      try {

        const storedUser =
          localStorage.getItem(
            'utc_current_user'
          );

        /**
         * ============================================================================
         * NO HAY SESIÓN
         * ============================================================================
         */
        if (!storedUser) {

          setIsLoading(false);
          return;
        }

        const parsedUser =
          JSON.parse(storedUser);

        /**
         * ============================================================================
         * VALIDAR ESTRUCTURA
         * ============================================================================
         */
        const isValidUser =
          parsedUser &&
          typeof parsedUser === 'object' &&
          parsedUser.id &&
          parsedUser.nombre &&
          parsedUser.email &&
          parsedUser.rol;

        if (!isValidUser) {

          localStorage.removeItem(
            'utc_current_user'
          );

          setIsLoading(false);
          return;
        }

        /**
         * ============================================================================
         * VALIDAR SESIÓN EN BACKEND
         * ============================================================================
         */
        const sessionValidation =
          await authAPI.validateSession(
            parsedUser.email
          );

        if (!sessionValidation.valid) {

          localStorage.removeItem(
            'utc_current_user'
          );

          setIsLoading(false);
          return;
        }

        /**
         * ============================================================================
         * VALIDAR EXPIRACIÓN
         * ============================================================================
         */
        const now = Date.now();

        const sessionAge =
          now -
          (parsedUser.sessionCreatedAt || 0);

        const isExpired =
          sessionAge > SESSION_DURATION;

        if (isExpired) {

          localStorage.removeItem(
            'utc_current_user'
          );

          setIsLoading(false);
          return;
        }

        /**
         * ============================================================================
         * SESIÓN CORRECTA
         * ============================================================================
         */
        setUser(sessionValidation.user);

      console.log(
      '✅ Usuario validado desde backend:',
      sessionValidation.user
);
        
      } catch (error) {

        console.error(
          'Error validando sesión:',
          error
        );

        localStorage.removeItem(
          'utc_current_user'
        );

      } finally {

        setIsLoading(false);
      }
    };

    loadStoredUser();

  }, []);

  /**
   * ============================================================================
   * LOGIN
   * ============================================================================
   */
  const login = async (
    email: string,
    password: string
  ): Promise<User> => {

    try {

      const data =
        await authAPI.login({
          email,
          password
        });

      const foundUser: User = {
        id: data.id,
        nombre: data.nombre,
        email: data.email,
        rol: data.rol,
        area: data.area,
        estado: data.estado || 'activo'
      };

      /**
       * ============================================================================
       * GUARDAR SESIÓN
       * ============================================================================
       */
      localStorage.setItem(
        'utc_current_user',
        JSON.stringify({
          ...foundUser,
          sessionCreatedAt: Date.now(),
          sessionVersion: 1
        })
      );

      setUser(foundUser);

      return foundUser;

    } catch (error: any) {

      console.error(
        'Fallo detallado en login:',
        error.message
      );

      return Promise.reject(error);
    }
  };

  /**
   * ============================================================================
   * LOGOUT
   * ============================================================================
   */
  const logout = () => {

    setUser(null);

    localStorage.removeItem(
      'utc_current_user'
    );
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout
      }}
    >

      {isLoading ? (

        <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50">

          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mb-4"></div>

          <p className="text-blue-900 font-serif animate-pulse">
            Sincronizando con Clínica UTC...
          </p>

        </div>

      ) : children}

    </AuthContext.Provider>
  );
}

/**
 * ============================================================================
 * HOOK GLOBAL
 * ============================================================================
 */
export const useAuth = () => {

  const context =
    useContext(AuthContext);

  if (context === undefined) {

    throw new Error(
      'useAuth debe ser usado dentro de un AuthProvider'
    );
  }

  return context;
};