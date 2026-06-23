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

import {
  authAPI,
  bootstrapSession,
  clearSession,
  getAccessToken as getClientAccessToken,
  setAccessToken as setClientAccessToken,
  getRefreshToken,
  setRefreshToken
} from '../lib/api';

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
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (
    email: string,
    password: string
  ) => Promise<User>;

  completarPrimerInicio: (
    email: string,
    passwordActual: string,
    passwordNueva: string
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

  const [accessToken, setAccessToken] =
    useState<string | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  /**
   * ============================================================================
   * VALIDAR SESIÓN GUARDADA
   * La sesión persistida es el refresh token (no el usuario completo). Al cargar
   * la app, se cambia por un access token + los datos de usuario vigentes.
   * ============================================================================
   */
  useEffect(() => {

    const loadStoredSession = async () => {

      try {

        const sessionUser = await bootstrapSession();

        if (sessionUser) {
          setUser(sessionUser as User);
          setAccessToken(getClientAccessToken());
        }

      } catch (error) {

        console.error(
          'Error validando sesión:',
          error
        );

      } finally {

        setIsLoading(false);
      }
    };

    loadStoredSession();

  }, []);

  /**
   * ============================================================================
   * LOGIN
   * ============================================================================
   */
  /**
   * Guarda la sesión emitida por login() o por completarPrimerInicio() —
   * ambos endpoints devuelven la misma forma: { ...usuario, accessToken, refreshToken }.
   */
  const aplicarSesion = (data: any): User => {

    const foundUser: User = {
      id: data.id,
      nombre: data.nombre,
      email: data.email,
      rol: data.rol,
      area: data.area,
      estado: data.estado || 'activo'
    };

    setClientAccessToken(data.accessToken);
    setRefreshToken(data.refreshToken);
    setAccessToken(data.accessToken);
    setUser(foundUser);

    return foundUser;
  };

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

      // PRIMER INICIO: credenciales correctas, pero todavía sin sesión real.
      // Se rechaza la promesa con esta marca para que Login.tsx redirija
      // al cambio de contraseña obligatorio en vez de avisar un error.
      if (data.requiereCambioPassword) {
        return Promise.reject({
          requiereCambioPassword: true,
          email: data.email
        });
      }

      return aplicarSesion(data);

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
   * COMPLETAR PRIMER INICIO (cambio de contraseña obligatorio)
   * ============================================================================
   */
  const completarPrimerInicio = async (
    email: string,
    passwordActual: string,
    passwordNueva: string
  ): Promise<User> => {

    const data = await authAPI.cambiarPasswordInicial({
      email,
      passwordActual,
      passwordNueva
    });

    return aplicarSesion(data);
  };

  /**
   * ============================================================================
   * LOGOUT
   * ============================================================================
   */
  const logout = () => {

    const storedRefreshToken = getRefreshToken();

    if (storedRefreshToken) {
      authAPI.logout(storedRefreshToken).catch(() => {});
    }

    clearSession();
    setUser(null);
    setAccessToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isAuthenticated: !!user,
        isLoading,
        login,
        completarPrimerInicio,
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