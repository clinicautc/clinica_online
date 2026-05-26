/**
 * ============================================================================
 * ARCHIVO: PatientPlans.tsx
 * PROPÓSITO: Visualización de planes nutricionales y de fisioterapia para el paciente.
 * CORRECCIONES: Iteración de objetos (meals) y mapeo de propiedades (exercises.notes).
 * ============================================================================
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { mockNutritionPlans, mockPhysiotherapyPlans, NutritionPlan, PhysiotherapyPlan } from '../lib/mockData';
import { Utensils, Activity, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface PatientPlansProps {
  patientId: string;
}

export default function PatientPlans({ patientId }: PatientPlansProps) {
  const [nutritionPlans, setNutritionPlans] = useState<NutritionPlan[]>([]);
  const [physiotherapyPlans, setPhysiotherapyPlans] = useState<PhysiotherapyPlan[]>([]);

  useEffect(() => {
    // Sincronización con LocalStorage (Simulando persistencia en lo que se integra API)
    const storedNutrition = localStorage.getItem('utc_nutrition_plans');
    const storedPhysio = localStorage.getItem('utc_physio_plans');

    const nutrition = storedNutrition ? JSON.parse(storedNutrition) : mockNutritionPlans;
    const physio = storedPhysio ? JSON.parse(storedPhysio) : mockPhysiotherapyPlans;

    setNutritionPlans(nutrition.filter((p: NutritionPlan) => String(p.patientId) === String(patientId)));
    setPhysiotherapyPlans(physio.filter((p: PhysiotherapyPlan) => String(p.patientId) === String(patientId)));
  }, [patientId]);

  return (
      <Card className="border-blue-900/10 shadow-sm">
        <CardHeader className="border-b bg-slate-50/50">
          <CardTitle className="text-blue-900 font-bold">Mis Planes de Tratamiento</CardTitle>
          <CardDescription className="font-medium">
            Consulta tus planes de alimentación y rutinas de ejercicio personalizadas.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <Tabs defaultValue="nutrition" className="space-y-6">
            <TabsList className="bg-slate-100 p-1 border">
              <TabsTrigger
                  value="nutrition"
                  className="data-[state=active]:bg-orange-500 data-[state=active]:text-white font-bold"
              >
                <Utensils className="w-4 h-4 mr-2" />
                Plan Nutricional
              </TabsTrigger>
              <TabsTrigger
                  value="physiotherapy"
                  className="data-[state=active]:bg-blue-900 data-[state=active]:text-white font-bold"
              >
                <Activity className="w-4 h-4 mr-2" />
                Fisioterapia
              </TabsTrigger>
            </TabsList>

            {/* --- CONTENIDO DE NUTRICIÓN --- */}
            <TabsContent value="nutrition" className="space-y-4 animate-in fade-in-50 duration-300">
              {nutritionPlans.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed rounded-xl">
                    <Utensils className="w-12 h-12 mx-auto text-orange-200 mb-3" />
                    <p className="text-slate-500 italic">No tienes planes de alimentación asignados actualmente.</p>
                  </div>
              ) : (
                  nutritionPlans.map((plan) => (
                      <Card key={plan.id} className="border-orange-200 bg-orange-50/20 overflow-hidden">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-lg text-blue-900 font-black uppercase">{plan.title}</CardTitle>
                              <CardDescription className="flex items-center gap-2 mt-1 font-bold">
                                <Calendar className="w-3 h-3 text-orange-500" />
                                {format(parseISO(plan.createdDate), "d 'de' MMMM, yyyy", { locale: es })}
                              </CardDescription>
                            </div>
                            <Badge className="bg-orange-500 text-white border-none">DIETA ACTIVA</Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-slate-600 mb-6 bg-white p-3 rounded-lg border border-orange-100">{plan.description}</p>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* SOLUCIÓN AL ERROR DEL .MAP: Iteramos las entradas del objeto meals */}
                            {Object.entries(plan.meals).map(([mealTime, items], index) => (
                                <div key={index} className="bg-white border border-orange-100 rounded-xl p-4 shadow-sm">
                                  <div className="flex items-center gap-3 mb-3">
                                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                                      <Utensils className="w-4 h-4 text-orange-600" />
                                    </div>
                                    <h4 className="font-black text-blue-900 text-xs uppercase tracking-wider">{mealTime}</h4>
                                  </div>
                                  <ul className="space-y-2">
                                    {(items as string[]).map((food, fIndex) => (
                                        <li key={fIndex} className="text-sm text-slate-600 flex items-start gap-2">
                                          <span className="text-orange-500 mt-1">•</span> {food}
                                        </li>
                                    ))}
                                  </ul>
                                </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                  ))
              )}
            </TabsContent>

            {/* --- CONTENIDO DE FISIOTERAPIA --- */}
            <TabsContent value="physiotherapy" className="space-y-4 animate-in fade-in-50 duration-300">
              {physiotherapyPlans.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed rounded-xl">
                    <Activity className="w-12 h-12 mx-auto text-blue-200 mb-3" />
                    <p className="text-slate-500 italic">No se registran rutinas de fisioterapia asignadas.</p>
                  </div>
              ) : (
                  physiotherapyPlans.map((plan) => (
                      <Card key={plan.id} className="border-blue-200 bg-blue-50/20 overflow-hidden">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-lg text-blue-900 font-black uppercase">{plan.title}</CardTitle>
                              <CardDescription className="flex items-center gap-2 mt-1 font-bold">
                                <Calendar className="w-3 h-3 text-blue-600" />
                                {format(parseISO(plan.createdDate), "d 'de' MMMM, yyyy", { locale: es })}
                              </CardDescription>
                            </div>
                            <Badge className="bg-blue-900 text-white border-none">REHABILITACIÓN</Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-slate-600 mb-6 bg-white p-3 rounded-lg border border-blue-100">{plan.description}</p>

                          <div className="space-y-4">
                            <h4 className="font-bold text-blue-900 text-sm flex items-center gap-2">
                              <Activity className="w-4 h-4" /> Rutina Prescrita
                            </h4>
                            {plan.exercises.map((exercise, index) => (
                                <div
                                    key={index}
                                    className="bg-white border border-blue-100 rounded-xl p-4 shadow-sm hover:border-blue-300 transition-colors"
                                >
                                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                                        <Activity className="w-5 h-5 text-blue-900" />
                                      </div>
                                      <div>
                                        <p className="font-bold text-blue-950 uppercase text-sm">{exercise.name}</p>
                                        <div className="flex gap-4 mt-1">
                                          <span className="text-[10px] font-black text-blue-600 uppercase">Series: {exercise.sets}</span>
                                          <span className="text-[10px] font-black text-blue-600 uppercase">Reps: {exercise.reps}</span>
                                        </div>
                                      </div>
                                    </div>
                                    {/* SOLUCIÓN AL ERROR DE DESCRIPTION: Cambiamos a exercise.notes */}
                                    <div className="md:max-w-xs">
                                      <p className="text-xs text-slate-500 italic bg-slate-50 p-2 rounded border border-dashed">
                                        <strong>Nota:</strong> {exercise.notes || "Sin instrucciones adicionales."}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                  ))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
  );
}