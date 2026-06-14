/**
 * ============================================================================
 * DASHBOARD DE PRACTICANTE DE FISIOTERAPIA (Versión Asignación Filtrada)
 * MODIFICACIÓN: Lógica de Paciente Recurrente para Fisioterapia + Perfil Drawer.
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { 
  LogOut, Users, FileText, Calendar, Clock, Activity, Loader2, History, 
  User, X, Edit2, Phone, Building, Trash2, AlertTriangle 
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { format } from 'date-fns';
import PatientList from '../components/PatientList';
import MedicalHistoryViewer from '../components/MedicalHistoryViewer';
import NotesViewer from '../components/NotesViewer';
import { toast } from 'sonner';

// Interfaz sincronizada con paciente_id para la verificación de historial
interface Appointment {
  id: number;
  paciente_id: number; 
  paciente_nombre: string; 
  tipo: string;      
  fecha: string;
  hora: string;
  estado: string;
  practicante_id?: number | null; 
}

export default function PhysiotherapyPractitionerDashboard() {
  const { user, logout } = useAuth();
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

  // Inicializar datos del perfil
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
   * EFECTO: Sincronización con la DB Real y Verificación de Historiales
   */
  useEffect(() => {
    const fetchTodayAppointments = async () => {
      try {
        setIsLoadingCitas(true);
        const todayStr = format(new Date(), 'yyyy-MM-dd');

        const response = await fetch(`http://localhost:3001/api/citas`);
        
        if (response.ok) {
          const allAppointments: Appointment[] = await response.json();
          
          const filtered = allAppointments.filter((apt) => {
            const cleanAptDate = apt.fecha.split('T')[0];
            return (
              cleanAptDate === todayStr && 
              apt.tipo === 'fisioterapia' && 
              (apt.estado === 'programada' || apt.estado === 'asignada' || apt.estado === 'pendiente') && 
              String(apt.practicante_id) === String(user?.id)
            );
          });

          setTodayAppointments(filtered);

          // VERIFICACIÓN: Consultamos el servidor por cada paciente asignado
          const recurrenceData: Record<number, boolean> = {};
          await Promise.all(filtered.map(async (apt) => {
            if (apt.paciente_id) {
              try {
                // Consultamos específicamente la recurrencia en fisioterapia
                const res = await fetch(`http://localhost:3001/api/historiales/verificar/${apt.paciente_id}/fisioterapia`);
                if (res.ok) {
                  const data = await res.json();
                  recurrenceData[apt.paciente_id] = data.existe;
                }
              } catch (err) { console.error("Error verificando historial fisio:", err); }
            }
          }));
          setRecurrenceMap(recurrenceData);
        }
      } catch (error) {
        console.error("❌ Error de conexión Practicante Fisio -> PostgreSQL:", error);
      } finally {
        setIsLoadingCitas(false);
      }
    };

    if (user?.id) {
      fetchTodayAppointments();
    }
  }, [user]);

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
      const response = await fetch(`http://localhost:3001/api/usuarios/${user.id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'email': user.email
        },
        body: JSON.stringify({
          nombre: profileData.nombre,
          telefono: profileData.telefono,
          matricula: profileData.matricula
        })
      });

      if (response.ok) {
        setIsEditingProfile(false);
        toast.success("Tu perfil se actualizó correctamente.");
      } else {
        const data = await response.json();
        toast.error(data.error || "El servidor no pudo procesar la actualización.");
      }
    } catch (error) {
      console.error("Error actualizando perfil:", error);
      toast.error("Error de conexión con la base de datos.");
    }
  };

  const handleConfirmDeleteAccount = () => {
    toast.error("Función temporalmente deshabilitada.");
    setIsDeleteModalOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  /**
   * ACCESO DINÁMICO: Redirige a Evaluación o Seguimiento según el historial
   */
  const handleAccessForms = (appointment: Appointment) => {
    const esRecurrente = recurrenceMap[appointment.paciente_id];
    
    if (esRecurrente) {
      toast.info(`Cargando registros previos de ${appointment.paciente_nombre}`);
      navigate(`/historial/${appointment.paciente_id}/fisioterapia`);
    } else {
      navigate(`/forms/fisioterapia/${appointment.id}`);
    }
  };

  // Generar iniciales para el Avatar
  const inicialesAvatar = profileData.nombre
    ? profileData.nombre.split(' ').map(n => n[0]).join('').substring(0, 2)
    : 'U';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 relative">
      <header className="bg-white border-b border-blue-900/10 shadow-sm relative z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-900 to-blue-700 rounded-full flex items-center justify-center relative text-white">
                <Activity />
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full animate-pulse"></span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-blue-900">Clínica UTC - Fisioterapia</h1>
                <p className="text-sm text-blue-900/60 font-medium">Panel de Practicante</p>
              </div>
            </div>
            
            {/* BOTÓN PARA ABRIR EL DRAWER DEL PERFIL */}
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsDrawerOpen(true)} 
                className="border-blue-900/20 text-blue-900 hover:bg-blue-50 transition-colors flex items-center gap-2"
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
          <h2 className="text-2xl font-bold text-blue-900 mb-2">Panel de Trabajo</h2>
          <p className="text-blue-900/70">Gestiona pacientes, citas y consulta historiales de fisioterapia</p>
        </div>

        <Tabs defaultValue="today_appointments" className="space-y-6">
          <TabsList className="bg-white border border-blue-900/10 p-1 h-auto flex-wrap gap-1 shadow-sm">
            <TabsTrigger value="today_appointments" className="data-[state=active]:bg-blue-900 data-[state=active]:text-white font-bold">
              <Calendar className="w-4 h-4 mr-2" /> Citas de Hoy
            </TabsTrigger>
            <TabsTrigger value="patients" className="data-[state=active]:bg-blue-900 data-[state=active]:text-white font-bold">
              <Users className="w-4 h-4 mr-2" /> Pacientes
            </TabsTrigger>
            <TabsTrigger value="histories" className="data-[state=active]:bg-blue-900 data-[state=active]:text-white font-bold">
              <FileText className="w-4 h-4 mr-2" /> Historiales
            </TabsTrigger>
            <TabsTrigger value="notes" className="data-[state=active]:bg-blue-900 data-[state=active]:text-white font-bold">
              <FileText className="w-4 h-4 mr-2" /> Notas del Docente
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today_appointments">
            <Card className="border-blue-900/10 shadow-md">
              <CardHeader>
                <CardTitle className="text-blue-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-700" />
                  Mis Citas Asignadas - Hoy ({format(new Date(), 'dd/MM/yyyy')})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isLoadingCitas ? (
                  <div className="flex flex-col items-center py-12 gap-3">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-900" />
                    <p className="text-blue-900/50">Cargando agenda clínica...</p>
                  </div>
                ) : todayAppointments.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed rounded-xl border-blue-100 bg-blue-50/20 italic text-gray-500">
                    <Calendar className="w-12 h-12 text-blue-200 mx-auto mb-3" />
                    No tienes citas asignadas para hoy.
                  </div>
                ) : (
                  todayAppointments.map((apt) => (
                    <div key={apt.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow gap-4 border-l-4 border-l-blue-900">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-blue-100 text-blue-900"><Activity className="w-5 h-5"/></div>
                        <div>
                          <p className="font-bold text-blue-900 text-lg">{apt.paciente_nombre}</p>
                          <div className="flex gap-3 mt-1">
                            <p className="text-sm text-gray-500 font-semibold bg-gray-50 px-2 py-1 rounded">
                              <Clock className="w-3 h-3 inline mr-1 text-blue-900"/> {apt.hora.substring(0, 5)} hrs
                            </p>
                            <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold uppercase border border-green-200">{apt.estado}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* BOTÓN DINÁMICO: Cambia a Púrpura si el paciente ya tiene historial */}
                      <Button
                        size="sm"
                        className={`w-full sm:w-auto font-bold text-white shadow-sm ${
                          recurrenceMap[apt.paciente_id] ? 'bg-purple-700 hover:bg-purple-800' : 'bg-blue-900 hover:bg-blue-800'
                        }`}
                        onClick={() => handleAccessForms(apt)}
                      >
                        {recurrenceMap[apt.paciente_id] ? (
                          <><History className="w-4 h-4 mr-2" /> Ver Historial / Seguimiento</>
                        ) : (
                          <><FileText className="w-4 h-4 mr-2" /> Iniciar Evaluación</>
                        )}
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="patients"><PatientList /></TabsContent>
          <TabsContent value="histories"><MedicalHistoryViewer filterType="fisioterapia" /></TabsContent>
          <TabsContent value="notes"><NotesViewer readOnly={false} filterCategory="fisioterapia" /></TabsContent>
        </Tabs>
      </main>

      <footer className="max-w-7xl mx-auto px-4 py-8 text-center text-slate-400 text-xs">
        <p>© 2026 Universidad Tres Culturas - Sistema de Gestión de Clínica Universitaria</p>
        <p className="mt-1 font-serif italic text-[10px]">Carga de trabajo controlada por Coordinación</p>
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
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white shadow-2xl z-50 flex flex-col border-l border-blue-100 transition-transform duration-300 ease-in-out ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-blue-100 bg-blue-50/50">
          <h2 className="text-lg font-black text-blue-950 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" /> Mi Perfil
          </h2>
          <button 
            onClick={() => setIsDrawerOpen(false)}
            className="text-slate-400 hover:text-blue-900 hover:bg-blue-100 p-2 rounded-full transition-colors focus:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col">
          <div className="flex flex-col items-center mb-6">
            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 border-4 border-white shadow-lg flex items-center justify-center mb-3">
              <span className="text-3xl font-black text-blue-700">{inicialesAvatar.toUpperCase()}</span>
            </div>
            <h3 className="text-xl font-bold text-blue-950 text-center">{profileData.nombre}</h3>
            <span className="bg-blue-100 text-blue-800 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mt-1">
              Practicante
            </span>
          </div>

          <div className="flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Información Personal</span>
                {!isEditingProfile && (
                  <button 
                    onClick={handleEditProfileClick}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors focus:outline-none"
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

              

              {(profileData.rol === 'practicante' || profileData.rol === 'paciente') && (
                <div className="space-y-1">
                  <Label className="text-[11px] font-black text-blue-950/60 uppercase tracking-widest ml-1">Matrícula Institucional</Label>
                  <div className="relative flex items-center">
                    <FileText className="w-4 h-4 text-blue-400 absolute left-4" />
                    <input 
                      type="text" 
                      value={profileData.matricula}
                      onChange={(e) => setProfileData({...profileData, matricula: e.target.value})}
                      disabled={!isEditingProfile}
                      placeholder="Ej. UTC-12345"
                      className={`w-full rounded-xl pl-11 pr-4 py-3 text-sm font-medium transition-all focus:outline-none ${isEditingProfile ? 'bg-white border-blue-300 ring-2 ring-blue-500 border' : 'bg-slate-50 border border-slate-200 text-blue-950 disabled:cursor-not-allowed'}`}
                    />
                  </div>
                </div>
              )}
              
              <div className="space-y-1">
                <Label className="text-[11px] font-black text-blue-950/60 uppercase tracking-widest ml-1">Área Asignada</Label>
                <div className="relative flex items-center">
                  <Building className="w-4 h-4 text-blue-400 absolute left-4" />
                  <input type="text" value="Fisioterapia Clínica" disabled className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-400 font-medium cursor-not-allowed" />
                </div>
              </div>

              {isEditingProfile && (
                <div className="flex gap-2 pt-2">
                  <button onClick={handleCancelEditProfile} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs transition-colors">
                    Cancelar
                  </button>
                  <button onClick={handleSaveProfile} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors shadow-sm">
                    Guardar Cambios
                  </button>
                </div>
              )}
            </div>

            {!isEditingProfile && (
              <div className="space-y-3 pt-6 border-t border-slate-100 mt-6">
                <button onClick={handleLogout} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors">
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

      {/* MODAL ELIMINAR CUENTA */}
      <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center transition-opacity duration-200 ${isDeleteModalOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className={`bg-white max-w-md w-full mx-4 rounded-3xl p-6 shadow-2xl transition-all duration-200 ${isDeleteModalOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 mx-auto">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-xl font-black text-center text-blue-950 mb-2">¿Deseas borrar tu cuenta?</h3>
          <p className="text-sm text-slate-500 text-center mb-8">
            Esta acción es permanente y no se puede deshacer. Se eliminarán todos tus datos, configuraciones y acceso al sistema clínico.
          </p>
          <div className="flex gap-3">
            <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3 rounded-xl transition-colors">
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