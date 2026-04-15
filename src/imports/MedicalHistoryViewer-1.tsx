import React, { useState, useEffect } from 'react';
// UI: Componentes base de Shadcn para diseño consistente
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { mockMedicalHistories, MedicalHistory } from '../lib/mockData';
// ICONOS: Lucide para identificar servicios y navegación
import { FileText, Calendar, User, Activity, Utensils, ChevronDown, ChevronUp } from 'lucide-react';
// FECHAS: Internacionalización y formateo
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export default function MedicalHistoryViewer() {
  // --- 1. ESTADOS ---
  const [histories, setHistories] = useState<MedicalHistory[]>([]);
  // NOTA: expandedId rastrea qué historial está abierto. Si es null, todos están cerrados.
  const [expandedId, setExpandedId] = useState<string | null>(null);

  /**
   * NOTA: CARGA DE DATOS
   * Buscamos en LocalStorage. Si es la primera vez que se usa, 
   * guardamos los 'mocks' para que la app no se vea vacía.
   */
  useEffect(() => {
    const stored = localStorage.getItem('utc_medical_histories');
    const allHistories = stored ? JSON.parse(stored) : mockMedicalHistories;
    
    // NOTA: Ordenamos por fecha para que lo más reciente salga primero
    setHistories(allHistories.sort((a: MedicalHistory, b: MedicalHistory) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    }));

    if (!stored) {
      localStorage.setItem('utc_medical_histories', JSON.stringify(mockMedicalHistories));
    }
  }, []);

  /**
   * NOTA: toggleExpand
   * Si haces clic en uno ya abierto, se cierra (null).
   * Si haces clic en uno cerrado, se abre su ID.
   */
  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <Card className="border-blue-900/10 shadow-md">
      <CardHeader>
        <CardTitle className="text-blue-900">Historiales Médicos</CardTitle>
        <CardDescription>
          Expedientes clínicos de Nutrición y Fisioterapia.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {histories.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 rounded-lg">
            <FileText className="w-12 h-12 mx-auto text-blue-900/20 mb-3" />
            <p className="text-blue-900/60">No hay historiales registrados aún.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {histories.map((history) => (
              <div
                key={history.id}
                className="border border-blue-900/10 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                {/* CABECERA DEL HISTORIAL (Siempre visible) */}
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      {/* NOTA: Color dinámico según la carrera (Azul=Fisio, Naranja=Nutri) */}
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                        history.type === 'fisioterapia' ? 'bg-blue-100' : 'bg-orange-100'
                      }`}>
                        {history.type === 'fisioterapia' ? (
                          <Activity className="w-6 h-6 text-blue-900" />
                        ) : (
                          <Utensils className="w-6 h-6 text-orange-600" />
                        )}
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-bold text-blue-900 text-lg leading-none">
                            {history.patientName}
                          </h3>
                          <Badge variant="outline" className={
                            history.type === 'fisioterapia'
                              ? 'border-blue-200 text-blue-700 bg-blue-50'
                              : 'border-orange-200 text-orange-700 bg-orange-50'
                          }>
                            {history.type === 'fisioterapia' ? 'Fisioterapia' : 'Nutrición'}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {format(parseISO(history.date), "PPP", { locale: es })}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5" />
                            Doc: {history.createdBy}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpand(history.id)}
                      className="text-blue-900 hover:bg-blue-50"
                    >
                      {expandedId === history.id ? <ChevronUp /> : <ChevronDown />}
                    </Button>
                  </div>

                  {/* CUERPO DEL HISTORIAL (Solo visible si está expandido) */}
                  {expandedId === history.id && (
                    <div className="mt-5 pt-5 border-t border-slate-100 animate-in fade-in zoom-in-95 duration-200">
                      <h4 className="text-xs font-bold text-blue-900/40 uppercase tracking-wider mb-4">
                        Detalles de la Evaluación
                      </h4>
                      
                      {/* NOTA: Renderizado Dinámico de Objetos */}
                      {/* Usamos Object.entries para convertir {peso: 70} en un mapa que podamos recorrer */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {Object.entries(history.data).map(([key, value]) => (
                          <div 
                            key={key}
                            className="bg-slate-50 border border-slate-100 rounded-lg p-3"
                          >
                            <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">
                              {/* NOTA: Quitamos guiones bajos para que sea legible */}
                              {key.replace(/_/g, ' ')}
                            </p>
                            <p className="text-sm font-semibold text-slate-700">
                              {String(value)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}