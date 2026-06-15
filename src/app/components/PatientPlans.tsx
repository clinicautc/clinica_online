/**
 * ============================================================================
 * ARCHIVO: PatientPlans.tsx
 * PROPÓSITO: Visualización de recomendaciones nutricionales y de fisioterapia.
 * ACTUALIZADO: Integración con base de datos mediante NutritionRecommendations.
 * ============================================================================
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Utensils, Activity } from 'lucide-react';
import NutritionRecommendations from './NutritionRecommendations';

interface PatientPlansProps {
  patientId: string | number;
  patientName: string; // Recibimos el nombre para pasarlo al componente hijo
}

export default function PatientPlans({ patientId, patientName }: PatientPlansProps) {
  return (
    <Card className="border-blue-900/10 shadow-sm overflow-hidden">
      <CardHeader className="border-b bg-slate-50/50">
        <CardTitle className="text-blue-900 font-bold text-xl">Mis Planes de Tratamiento</CardTitle>
        <CardDescription className="font-medium text-slate-500">
          Consulta las recomendaciones y planes asignados por tus especialistas.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-6 bg-slate-50/30">
        <Tabs defaultValue="nutrition" className="space-y-6">
          
          {/* --- BOTONES DE NAVEGACIÓN (TABS) --- */}
          <div className="overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
            <TabsList className="bg-slate-100 p-1.5 border border-slate-200/60 shadow-sm rounded-2xl w-full sm:w-auto inline-flex gap-1">
              <TabsTrigger
                value="nutrition"
                className="data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-md font-black uppercase text-xs tracking-wider rounded-xl px-6 py-2.5 transition-all"
              >
                <Utensils className="w-4 h-4 mr-2" />
                Plan Nutricional
              </TabsTrigger>
              <TabsTrigger
                value="physiotherapy"
                className="data-[state=active]:bg-blue-900 data-[state=active]:text-white data-[state=active]:shadow-md font-black uppercase text-xs tracking-wider rounded-xl px-6 py-2.5 transition-all"
              >
                <Activity className="w-4 h-4 mr-2" />
                Fisioterapia
              </TabsTrigger>
            </TabsList>
          </div>

          {/* --- CONTENIDO DE NUTRICIÓN --- */}
          <TabsContent value="nutrition" className="animate-in fade-in-50 duration-300 outline-none">
            <div className="bg-white p-2 sm:p-6 rounded-3xl border border-orange-100/50 shadow-sm">
              <NutritionRecommendations 
                pacienteId={patientId} 
                pacienteNombre={patientName} 
                area="nutricion"
                readOnly={true} 
              />
            </div>
          </TabsContent>

          {/* --- CONTENIDO DE FISIOTERAPIA --- */}
          <TabsContent value="physiotherapy" className="animate-in fade-in-50 duration-300 outline-none">
            <div className="bg-white p-2 sm:p-6 rounded-3xl border border-blue-100/50 shadow-sm">
              <NutritionRecommendations 
                pacienteId={patientId} 
                pacienteNombre={patientName} 
                area="fisioterapia"
                readOnly={true}
              />
            </div>
          </TabsContent>

        </Tabs>
      </CardContent>
    </Card>
  );
}