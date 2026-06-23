/**
 * ============================================================================
 * COMPONENTE: PractitionerManagement (Versión Full PostgreSQL)
 * PROPÓSITO: Gestión administrativa de practicantes (Estatus y Eliminación)
 * ============================================================================
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  UserCheck, 
  UserX, 
  Activity, 
  Utensils, 
  Search, 
  Loader2, 
  Plus, 
  Trash2 
} from 'lucide-react';
import { Input } from './ui/input';
import { toast } from 'sonner';
import { usuariosAPI } from '../lib/api';

interface Practitioner {
  id: string;
  nombre: string;
  email: string;
  area: string;
  rol: string;
  status: string;
  fecha_creacion?: string;
}

interface PractitionerManagementProps {
  area: 'nutricion' | 'fisioterapia';
}

export default function PractitionerManagement({ area }: PractitionerManagementProps) {
  const navigate = useNavigate();
  const [practitioners, setPracticantes] = useState<Practitioner[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const arialStyle = { fontFamily: 'Arial, sans-serif' };

  useEffect(() => {
    fetchPractitioners();
  }, [area]);

  /**
   * CARGA DE DATOS: Obtiene usuarios de la base de datos y filtra por rol y área
   */
  const fetchPractitioners = async () => {
    try {
      setLoading(true);
      const allUsers: any[] = await usuariosAPI.getAll();

      // Filtramos para asegurar que el Admin de área solo vea lo que le corresponde
      const filtered = allUsers.filter(u =>
        u.rol === 'practicante' &&
        u.area?.toLowerCase() === area.toLowerCase()
      ).map(p => ({
        id: p.id.toString(),
        nombre: p.nombre || 'Sin Nombre',
        email: p.email || 'sin@correo.com',
        area: p.area,
        rol: p.rol,
        status: p.estado || p.status || 'activo' // Mapeo de columna 'estado' de la BD
      }));

      filtered.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
      setPracticantes(filtered);
    } catch (error) {
      console.error("Error cargando practicantes:", error);
      toast.error("Error de conexión con el servidor PostgreSQL");
    } finally {
      setLoading(false);
    }
  };

  /**
   * CAMBIO DE ESTATUS: Activa o Desactiva la cuenta del practicante en la BD
   */
  const handleToggleStatus = async (practitionerId: string, currentStatus: string) => {
    const nuevoEstado = currentStatus === 'activo' ? 'inactivo' : 'activo';
    
    try {
      await usuariosAPI.updateStatus(practitionerId, nuevoEstado);
      toast.success(`Estatus actualizado: ${nuevoEstado.toUpperCase()}`);
      fetchPractitioners(); // Recarga la lista en vivo
    } catch (error) {
      toast.error("No se pudo actualizar el estatus en la base de datos");
    }
  };

  /**
   * ELIMINACIÓN PERMANENTE: Borra el registro de la tabla usuarios de PostgreSQL
   */
  const handleDeletePractitioner = async (practitionerId: string, nombre: string) => {
    if (!window.confirm(`¿Estás seguro de eliminar permanentemente a ${nombre}? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      await usuariosAPI.remove(practitionerId);
      toast.success("Practicante eliminado correctamente");
      fetchPractitioners(); // Actualiza la vista eliminando el registro
    } catch (error) {
      toast.error("Error al intentar eliminar el registro de la base de datos");
    }
  };

  const filteredPractitioners = practitioners.filter((p) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      p.nombre.toLowerCase().includes(searchLower) ||
      p.email.toLowerCase().includes(searchLower)
    );
  });

  const areaColor = area === 'nutricion' ? 'orange' : 'blue';
  const AreaIcon = area === 'nutricion' ? Utensils : Activity;

  return (
    <Card className={`border-${areaColor}-900/10 shadow-md bg-white`} style={arialStyle}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className={`text-${areaColor === 'orange' ? 'orange-600' : 'blue-900'} flex items-center gap-2`} style={arialStyle}>
              <AreaIcon className="w-5 h-5" />
              Gestión de Personal - {area === 'nutricion' ? 'Nutrición' : 'Fisioterapia'}
            </CardTitle>
            <CardDescription style={arialStyle}>
              Panel administrativo sincronizado con PostgreSQL.
            </CardDescription>
          </div>

          <Button 
            onClick={() => navigate('/administrar-personal')}
            className={area === 'nutricion' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-900 hover:bg-blue-800'}
            style={arialStyle}
          >
            <Plus className="w-4 h-4 mr-2" />
            Alta de Usuario
          </Button>
        </div>

        <div className="relative mt-6">
          <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar por nombre o correo institucional..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`pl-11 h-11 text-base border-slate-200 rounded-xl focus:ring-${areaColor}-500`}
            style={arialStyle}
          />
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-slate-400">
            <Loader2 className={`w-8 h-8 animate-spin text-${areaColor === 'orange' ? 'orange-600' : 'blue-900'}`} />
            <p className="text-sm font-bold uppercase tracking-widest" style={arialStyle}>Sincronizando registros...</p>
          </div>
        ) : filteredPractitioners.length === 0 ? (
          <div className="text-center py-12 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-100">
            <UserX className="w-12 h-12 mx-auto text-slate-200 mb-3" />
            <p className="text-slate-400 font-medium italic" style={arialStyle}>
              No hay practicantes registrados en este departamento.
            </p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[550px] overflow-y-auto pr-2">
            {filteredPractitioners.map((practitioner) => (
              <div
                key={practitioner.id}
                className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 border rounded-[1.2rem] transition-all ${
                  practitioner.status === 'activo' ? 'bg-white border-slate-100 shadow-sm' : 'bg-slate-50 opacity-75 grayscale-[0.5]'
                } hover:shadow-md group`}
              >
                <div className="flex items-center gap-5">
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center shrink-0 shadow-inner ${
                      practitioner.status === 'activo'
                        ? area === 'nutricion' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-900'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    <AreaIcon className="w-8 h-8" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2.5 mb-1">
                      <h3 className="font-black text-slate-900 text-base uppercase tracking-tight" style={arialStyle}>
                        {practitioner.nombre}
                      </h3>
                      <Badge
                        className={`text-[10px] font-black uppercase tracking-tighter ${
                          practitioner.status === 'activo'
                            ? 'bg-green-100 text-green-700 border-green-200'
                            : 'bg-red-100 text-red-700 border-red-200'
                        }`}
                      >
                        {practitioner.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-400 font-bold" style={arialStyle}>{practitioner.email}</p>
                  </div>
                </div>

                <div className="mt-5 sm:mt-0 flex items-center gap-2.5 w-full sm:w-auto">
                  {/* BOTÓN CAMBIAR ESTATUS */}
                  <Button
                    variant={practitioner.status === 'activo' ? 'outline' : 'default'}
                    size="sm"
                    onClick={() => handleToggleStatus(practitioner.id, practitioner.status)}
                    className={`flex-1 sm:flex-none font-black text-xs uppercase h-10 px-6 rounded-xl transition-all ${
                      practitioner.status === 'activo'
                        ? 'border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300'
                        : area === 'nutricion' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-900 hover:bg-blue-800 text-white'
                    }`}
                    style={arialStyle}
                  >
                    {practitioner.status === 'activo' ? (
                      <><UserX className="w-4 h-4 mr-2" /> Desactivar</>
                    ) : (
                      <><UserCheck className="w-4 h-4 mr-2" /> Activar</>
                    )}
                  </Button>

                  {/* BOTÓN ELIMINAR REGISTRO (CONEXIÓN BD) */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeletePractitioner(practitioner.id, practitioner.nombre)}
                    className="h-10 w-10 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}