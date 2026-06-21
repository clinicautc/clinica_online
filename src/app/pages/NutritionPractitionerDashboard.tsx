/**
 * ============================================================================
 * DASHBOARD DE PRACTICANTE DE NUTRICIÓN (Versión Sincronizada DB - Final)
 * MODIFICACIÓN: Lógica de Paciente Recurrente para Botón Dinámico y Perfil Drawer.
 * NUEVO: Soporte para Matrícula Institucional.
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { citasAPI, historialesAPI, usuariosAPI } from '../lib/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { 
  LogOut, Users, FileText, Calendar, Clock, Utensils, Loader2, 
  History, User, X, Edit2, Phone, Building, Trash2, AlertTriangle 
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { format, parseISO, isSameDay } from 'date-fns';
import PatientList from '../components/PatientList';
import MedicalHistoryViewer from '../components/MedicalHistoryViewer';
import NotesViewer from '../components/NotesViewer';
import { toast } from 'sonner';

// Interfaz sincronizada con las columnas de pgAdmin
interface Appointment {
  id: number;
  paciente_id: number;
  paciente_nombre: string; 
  tipo: string;      
  fecha: string;
  hora: string;
  estado: string;    
}

export default function NutritionPractitionerDashboard() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [isLoadingCitas, setIsLoadingCitas] = useState(true);
  const [recurrenceMap, setRecurrenceMap] = useState<Record<number, boolean>>({});

  // ==========================================
  // ESTADOS DEL DRAWER Y PERFIL
  // ==========================================
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [profileData, setProfileData] = useState({
    nombre: '',
    telefono: '',
    matricula: '',
    email: '',
    rol: '',
    area: ''
  });
  const [backupProfile, setBackupProfile] = useState(profileData);

  // Inicializar datos del perfil cuando el usuario carga
  useEffect(() => {
    if (user) {
      setProfileData({
        nombre: user.nombre || '',
        telefono: user.telefono || '',
        matricula: user.matricula || '',
        email: user.email || '',
        rol: user.rol || '',
        area: user.area || ''
      });
    }
  }, [user]);

  /**
   * EFECTO: Sincronización con la DB Real y Persistencia
   */
  useEffect(() => {
    const fetchTodayAppointments = async () => {
      try {
        setIsLoadingCitas(true);
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        const allAppointments: Appointment[] = await citasAPI.getAll();
        const filtered = allAppointments.filter((apt) => {
          const cleanAptDate = apt.fecha.split('T')[0];
          return (
            cleanAptDate === todayStr &&
            apt.tipo === 'nutricion' &&
            apt.estado === 'programada'
          );
        });

        setTodayAppointments(filtered);

        // VERIFICACIÓN DE RECURRENCIA
        const recurrenceData: Record<number, boolean> = {};
        await Promise.all(filtered.map(async (apt) => {
          if (apt.paciente_id) {
            try {
              const data = await historialesAPI.verificarRecurrencia(apt.paciente_id, 'nutricion');
              recurrenceData[apt.paciente_id] = data.existe;
            } catch (err) { console.error("Error verificando recurrencia:", err); }
          }
        }));
        setRecurrenceMap(recurrenceData);
      } catch (error) {
        console.error("❌ Error de conexión Practicante Nutrición:", error);
        toast.error("Error al sincronizar la agenda del día");
      } finally {
        setIsLoadingCitas(false);
      }
    };

    const savedUser = localStorage.getItem('utc_current_user');
    if (!user && !authLoading && !savedUser) {
      navigate('/login');
      return;
    }

    fetchTodayAppointments();
  }, [user, authLoading, navigate]);

  // ==========================================
  // FUNCIONES DEL PERFIL (DRAWER)
  // ==========================================
  const handleEditProfileClick = () => {
    setBackupProfile(profileData);
    setIsEditingProfile(true);
  };

  const handleCancelEditProfile = () => {
    setProfileData(backupProfile);
    setIsEditingProfile(false);
  };

  const handleSaveProfile = async () => {
    if (!user?.id || !user?.email) {
      toast.error("Error de sesión: No se pudo identificar al usuario.");
      return;
    }

    try {
      await usuariosAPI.updateProfile(user.id, {
        nombre: profileData.nombre,
        telefono: profileData.telefono,
        matricula: profileData.matricula // <-- Modificación de Matrícula Integrada
      });

      setIsEditingProfile(false);
      toast.success("Tu perfil se actualizó correctamente en el sistema.");
    } catch (error: any) {
      console.error("Error actualizando perfil:", error);
      toast.error(error.message || "Error de conexión con la base de datos.");
    }
  };

  const handleConfirmDeleteAccount = () => {
    // Aquí puedes agregar la lógica para borrar cuenta si la implementas en backend
    toast.error("Función temporalmente deshabilitada.");
    setIsDeleteModalOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleAccessForms = (appointment: Appointment) => {
    const esRecurrente = recurrenceMap[appointment.paciente_id];
    
    if (esRecurrente) {
      navigate(`/historial/${appointment.paciente_id}/nutricion`);
    } else {
      navigate(`/forms/nutricion/${appointment.id}`);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orange-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-orange-600" />
          <p className="text-orange-900 font-medium">Recuperando sesión clínica...</p>
        </div>
      </div>
    );
  }

  // Generar iniciales para el Avatar
  const inicialesAvatar = profileData.nombre
    ? profileData.nombre.split(' ').map(n => n[0]).join('').substring(0, 2)
    : 'U';

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 relative">
      <header className="bg-white border-b border-orange-900/10 shadow-sm relative z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-600 to-orange-500 rounded-full flex items-center justify-center relative">
                <Utensils className="w-6 h-6 text-white" />
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full shadow-sm animate-pulse"></span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-orange-900">Clínica UTC - Nutrición</h1>
                <p className="text-sm text-orange-900/60 font-serif italic">Practicante: {profileData.nombre || user?.nombre || "Usuario UTC"}</p>
              </div>
            </div>
            
            {/* BOTÓN PARA ABRIR EL DRAWER DEL PERFIL */}
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsDrawerOpen(true)} 
                className="border-orange-900/20 text-orange-900 hover:bg-orange-50 transition-colors flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Mi Perfil</span>
              </Button>
            </div>
            
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-orange-900 mb-2">Panel de Nutrición</h2>
          <p className="text-orange-900/70">Gestión de consultas y expedientes clínicos en tiempo real.</p>
        </div>

        <Tabs defaultValue="today_appointments" className="space-y-6">
          <TabsList className="bg-white border border-orange-900/10 p-1 h-auto flex-wrap gap-1 shadow-sm">
            <TabsTrigger value="today_appointments" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white font-bold">
              <Calendar className="w-4 h-4 mr-2" /> Citas de Hoy
            </TabsTrigger>
            <TabsTrigger value="patients" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white font-bold">
              <Users className="w-4 h-4 mr-2" /> Pacientes
            </TabsTrigger>
            <TabsTrigger value="notes" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white font-bold">
              <FileText className="w-4 h-4 mr-2" /> Notas del Docente
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today_appointments">
            <Card className="border-orange-900/10 shadow-md">
              <CardHeader>
                <CardTitle className="text-orange-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-orange-600" />
                  Agenda Sincronizada - Hoy ({format(new Date(), 'dd/MM/yyyy')})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {isLoadingCitas ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                      <Loader2 className="w-10 h-10 animate-spin text-orange-600" />
                      <p className="text-orange-900/50">Consultando base de datos...</p>
                    </div>
                  ) : todayAppointments.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed rounded-lg border-orange-100 bg-orange-50/20">
                       <Calendar className="w-12 h-12 text-orange-200 mx-auto mb-3" />
                       <p className="text-gray-500 font-medium italic">No se encontraron citas de nutrición programadas para hoy.</p>
                    </div>
                  ) : (
                    todayAppointments.map((apt) => (
                      <div key={apt.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow gap-4 border-l-4 border-l-orange-600">
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-full bg-orange-50">
                            <Utensils className="w-5 h-5 text-orange-600"/>
                          </div>
                          <div>
                            <p className="font-bold text-orange-900 text-lg">{apt.paciente_nombre}</p>
                            <div className="flex gap-3 mt-1">
                              <p className="text-sm text-gray-500 flex items-center gap-1 bg-gray-50 px-2 py-1 rounded font-semibold">
                                <Clock className="w-3 h-3 text-orange-600"/> {apt.hora.substring(0,5)} hrs
                              </p>
                              <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider self-center border border-green-200">
                                {apt.estado}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className={`w-full sm:w-auto shadow-sm font-bold text-white ${
                            recurrenceMap[apt.paciente_id] ? 'bg-orange-500 hover:bg-orange-600' : 'bg-orange-600 hover:bg-orange-700'
                          }`}
                          onClick={() => handleAccessForms(apt)}
                        >
                          {recurrenceMap[apt.paciente_id] ? (
                            <><History className="w-4 h-4 mr-2" /> Ver Historial / Evolución</>
                          ) : (
                            <><FileText className="w-4 h-4 mr-2" /> Ver Evaluación Inicial</>
                          )}
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="patients">
            <PatientList />
          </TabsContent>

          <TabsContent value="notes">
  <NotesViewer readOnly={false} filterCategory="nutricion" />
</TabsContent>
        </Tabs>
      </main>

      <footer className="max-w-7xl mx-auto px-4 py-8 text-center text-slate-400 text-xs">
        <p>© 2026 Universidad Tres Culturas - Sistema de Gestión de Clínica Universitaria</p>
        <p className="mt-1 font-serif italic text-[10px]">Conexión PostgreSQL Activa</p>
      </footer>

      {/* ========================================== */}
      {/* PANEL LATERAL DEL PERFIL (DRAWER)          */}
      {/* ========================================== */}
      
      {/* Overlay Oscuro */}
      <div 
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 ease-in-out ${isDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsDrawerOpen(false)}
      ></div>

      {/* Panel Lateral */}
      <aside 
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white shadow-2xl z-50 flex flex-col border-l border-gray-200 transition-transform duration-300 ease-in-out ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
            <User className="w-5 h-5 text-orange-600" /> Mi Perfil
          </h2>
          <button 
            onClick={() => setIsDrawerOpen(false)}
            className="text-gray-400 hover:text-gray-900 hover:bg-gray-200 p-2 rounded-full transition-colors focus:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col">
          <div className="flex flex-col items-center mb-6">
            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 border-4 border-white shadow-lg flex items-center justify-center mb-3">
              <span className="text-3xl font-black text-orange-600">{inicialesAvatar.toUpperCase()}</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 text-center">{profileData.nombre}</h3>
            <span className="bg-orange-100 text-orange-800 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mt-1">
              Practicante
            </span>
          </div>

          <div className="flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Información Personal</span>
                {!isEditingProfile && (
                  <button 
                    onClick={handleEditProfileClick}
                    className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 transition-colors focus:outline-none"
                  >
                    <Edit2 className="w-3 h-3" /> Editar Datos
                  </button>
                )}
              </div>

            
                <div className="space-y-1">
                  <Label className="text-[11px] font-black text-blue-950/60 uppercase tracking-widest ml-1">Nombre Completo</Label>
                  <div className="relative flex items-center">
                    <User className="w-4 h-4 text-blue-400 absolute left-4" />
                    <input 
                      type="text" 
                      maxLength={40} // <-- 1. Límite estricto de 40 caracteres
                      value={profileData.nombre}
                      onChange={(e) => {
                        // 2. Esta línea elimina cualquier cosa que NO sea letra, acento, ñ, o espacio
                        const soloLetras = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
                        
                        // Opcional: Si quieres que no puedan poner múltiples espacios seguidos, puedes usar:
                        // const nombreLimpio = soloLetras.replace(/\s{2,}/g, ' ');
                        
                        setProfileData({...profileData, nombre: soloLetras});
                      }}
                      disabled={!isEditingProfile}
                      className={`w-full rounded-xl pl-11 pr-4 py-3 text-sm font-medium transition-all focus:outline-none ${isEditingProfile ? 'bg-white border-blue-300 ring-2 ring-blue-500 border' : 'bg-slate-50 border border-slate-200 text-blue-950 disabled:cursor-not-allowed'}`}
                    />
                  </div>
                </div>
            
          
            
              <div className="space-y-1">
  <Label className="text-[11px] font-black text-blue-950/60 uppercase tracking-widest ml-1">Número Personal</Label>
  <div className="relative flex items-center">
    <Phone className="w-4 h-4 text-blue-400 absolute left-4" />
    <input 
      type="tel" // <-- 1. Cambiado a 'tel'
      maxLength={15} // <-- 2. Límite estricto de 15 dígitos
      value={profileData.telefono}
      onChange={(e) => {
        // 3. Esta línea elimina cualquier carácter que NO sea un dígito (\D)
        const soloNumeros = e.target.value.replace(/\D/g, '');
        setProfileData({...profileData, telefono: soloNumeros});
      }}
      disabled={!isEditingProfile}
      className={`w-full rounded-xl pl-11 pr-4 py-3 text-sm font-medium transition-all focus:outline-none ${isEditingProfile ? 'bg-white border-blue-300 ring-2 ring-blue-500 border' : 'bg-slate-50 border border-slate-200 text-blue-950 disabled:cursor-not-allowed'}`}
    />
  </div>
</div>

            

              {/* INPUT MODIFICADO: MATRÍCULA CONDICIONAL */}
              {(profileData.rol === 'practicante' || profileData.rol === 'paciente') && (
                <div className="space-y-1">
                  <Label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Matrícula Institucional</Label>
                  <div className="relative flex items-center">
                    <FileText className="w-4 h-4 text-gray-400 absolute left-4" />
                    <input 
                      type="text" 
                      value={profileData.matricula}
                      onChange={(e) => setProfileData({...profileData, matricula: e.target.value})}
                      disabled={!isEditingProfile}
                      placeholder="Ej. UTC-12345"
                      className={`w-full rounded-xl pl-11 pr-4 py-3 text-sm font-medium transition-all focus:outline-none ${isEditingProfile ? 'bg-white border-orange-300 ring-2 ring-orange-500 border' : 'bg-gray-50 border border-gray-200 text-gray-800 disabled:cursor-not-allowed'}`}
                    />
                  </div>
                </div>
              )}
              
              <div className="space-y-1">
                <Label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Área Asignada</Label>
                <div className="relative flex items-center">
                  <Building className="w-4 h-4 text-gray-400 absolute left-4" />
                  <input type="text" value="Nutrición Clínica" disabled className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-sm text-gray-400 font-medium cursor-not-allowed" />
                </div>
              </div>

              {isEditingProfile && (
                <div className="flex gap-2 pt-2">
                  <button onClick={handleCancelEditProfile} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl text-xs transition-colors">
                    Cancelar
                  </button>
                  <button onClick={handleSaveProfile} className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors shadow-sm">
                    Guardar Cambios
                  </button>
                </div>
              )}
            </div>

            {!isEditingProfile && (
              <div className="space-y-3 pt-6 border-t border-gray-100 mt-6">
                <button onClick={handleLogout} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors">
                  <LogOut className="w-4 h-4" /> Cerrar Sesión
                </button>
                <button onClick={() => setIsDeleteModalOpen(true)} className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors border border-red-100">
                  <Trash2 className="w-4 h-4" /> Eliminar Cuenta
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ========================================== */}
      {/* MODAL CONFIRMAR ELIMINACIÓN DE CUENTA      */}
      {/* ========================================== */}
      <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center transition-opacity duration-200 ${isDeleteModalOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className={`bg-white max-w-md w-full mx-4 rounded-3xl p-6 shadow-2xl transition-all duration-200 ${isDeleteModalOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 mx-auto">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-xl font-black text-center text-gray-900 mb-2">¿Deseas borrar tu cuenta?</h3>
          <p className="text-sm text-gray-500 text-center mb-8">
            Esta acción es permanente y no se puede deshacer. Se eliminarán todos tus datos, configuraciones y acceso al sistema clínico.
          </p>
          <div className="flex gap-3">
            <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 rounded-xl transition-colors">
              No, cancelar
            </button>
            <button onClick={handleConfirmDeleteAccount} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-colors shadow-md">
              Sí, eliminar
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}