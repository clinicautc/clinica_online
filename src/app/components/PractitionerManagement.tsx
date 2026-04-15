/**
 * ============================================================================
 * COMPONENTE: PractitionerManagement (Versión Full PostgreSQL)
 * PROPÓSITO: Gestión administrativa de practicantes (Estatus y Eliminación)
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
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
      const response = await fetch('http://localhost:3001/api/usuarios');
      
      if (response.ok) {
        const allUsers: any[] = await response.json();
        
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
      }
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
      const response = await fetch(`http://localhost:3001/api/usuarios/${practitionerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado }) // 'estado' coincide con tu index.js
      });

      if (response.ok) {
        toast.success(`Estatus actualizado: ${nuevoEstado.toUpperCase()}`);
        fetchPractitioners(); // Recarga la lista en vivo
      } else {
        throw new Error();
      }
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
      const response = await fetch(`http://localhost:3001/api/usuarios/${practitionerId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success("Practicante eliminado correctamente");
        fetchPractitioners(); // Actualiza la vista eliminando el registro
      } else {
        throw new Error();
      }
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
            onClick={() => navigate('/administrar-practicantes')}
            className={area === 'nutricion' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-900 hover:bg-blue-800'}
            style={arialStyle}
          >
            <Plus className="w-4 h-4 mr-2" />
            Alta de Usuario
          </Button>
        </div>

        <div className="relative mt-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar por nombre o correo institucional..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`pl-10 border-slate-200 rounded-xl focus:ring-${areaColor}-500`}
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
                className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 border rounded-[1.2rem] transition-all ${
                  practitioner.status === 'activo' ? 'bg-white border-slate-100 shadow-sm' : 'bg-slate-50 opacity-75 grayscale-[0.5]'
                } hover:shadow-md group`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 shadow-inner ${
                      practitioner.status === 'activo'
                        ? area === 'nutricion' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-900'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    <AreaIcon className="w-7 h-7" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-black text-slate-900 text-sm uppercase tracking-tight" style={arialStyle}>
                        {practitioner.nombre}
                      </h3>
                      <Badge
                        className={`text-[9px] font-black uppercase tracking-tighter ${
                          practitioner.status === 'activo'
                            ? 'bg-green-100 text-green-700 border-green-200'
                            : 'bg-red-100 text-red-700 border-red-200'
                        }`}
                      >
                        {practitioner.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-400 font-bold" style={arialStyle}>{practitioner.email}</p>
                  </div>
                </div>

                <div className="mt-4 sm:mt-0 flex items-center gap-2 w-full sm:w-auto">
                  {/* BOTÓN CAMBIAR ESTATUS */}
                  <Button
                    variant={practitioner.status === 'activo' ? 'outline' : 'default'}
                    size="sm"
                    onClick={() => handleToggleStatus(practitioner.id, practitioner.status)}
                    className={`flex-1 sm:flex-none font-black text-[10px] uppercase h-9 px-5 rounded-xl transition-all ${
                      practitioner.status === 'activo'
                        ? 'border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300'
                        : area === 'nutricion' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-900 hover:bg-blue-800 text-white'
                    }`}
                    style={arialStyle}
                  >
                    {practitioner.status === 'activo' ? (
                      <><UserX className="w-3.5 h-3.5 mr-2" /> Desactivar</>
                    ) : (
                      <><UserCheck className="w-3.5 h-3.5 mr-2" /> Activar</>
                    )}
                  </Button>

                  {/* BOTÓN ELIMINAR REGISTRO (CONEXIÓN BD) */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeletePractitioner(practitioner.id, practitioner.nombre)}
                    className="h-9 w-9 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
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