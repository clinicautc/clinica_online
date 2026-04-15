import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { mockNutritionPlans, mockPhysiotherapyPlans, NutritionPlan, PhysiotherapyPlan } from '../lib/mockData';
import { Utensils, Activity, Calendar, ImageIcon } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface PatientPlansProps {
  patientId: string;
}

export default function PatientPlans({ patientId }: PatientPlansProps) {
  const [nutritionPlans, setNutritionPlans] = useState<NutritionPlan[]>([]);
  const [physiotherapyPlans, setPhysiotherapyPlans] = useState<PhysiotherapyPlan[]>([]);

  useEffect(() => {
    // In a real app, these would be filtered by patientId from backend
    const storedNutrition = localStorage.getItem('utc_nutrition_plans');
    const storedPhysio = localStorage.getItem('utc_physio_plans');

    const nutrition = storedNutrition ? JSON.parse(storedNutrition) : mockNutritionPlans;
    const physio = storedPhysio ? JSON.parse(storedPhysio) : mockPhysiotherapyPlans;

    setNutritionPlans(nutrition.filter((p: NutritionPlan) => p.patientId === patientId));
    setPhysiotherapyPlans(physio.filter((p: PhysiotherapyPlan) => p.patientId === patientId));

    if (!storedNutrition) localStorage.setItem('utc_nutrition_plans', JSON.stringify(mockNutritionPlans));
    if (!storedPhysio) localStorage.setItem('utc_physio_plans', JSON.stringify(mockPhysiotherapyPlans));
  }, [patientId]);

  return (
    <Card className="border-blue-900/10">
      <CardHeader>
        <CardTitle className="text-blue-900">Mis Planes de Tratamiento</CardTitle>
        <CardDescription>
          Consulta tus planes de alimentación y ejercicios
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="nutrition" className="space-y-4">
          <TabsList className="bg-white border border-blue-900/10">
            <TabsTrigger 
              value="nutrition"
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
            >
              <Utensils className="w-4 h-4 mr-2" />
              Nutrición
            </TabsTrigger>
            <TabsTrigger 
              value="physiotherapy"
              className="data-[state=active]:bg-blue-900 data-[state=active]:text-white"
            >
              <Activity className="w-4 h-4 mr-2" />
              Fisioterapia
            </TabsTrigger>
          </TabsList>

          <TabsContent value="nutrition" className="space-y-4">
            {nutritionPlans.length === 0 ? (
              <div className="text-center py-8">
                <Utensils className="w-12 h-12 mx-auto text-orange-300 mb-3" />
                <p className="text-blue-900/60">No tienes planes de alimentación asignados</p>
              </div>
            ) : (
              nutritionPlans.map((plan) => (
                <Card key={plan.id} className="border-orange-200 bg-orange-50/30">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg text-blue-900">{plan.title}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <Calendar className="w-3 h-3" />
                          {format(parseISO(plan.createdDate), "d 'de' MMMM, yyyy", { locale: es })}
                        </CardDescription>
                      </div>
                      <Badge className="bg-orange-500 text-white">Nutrición</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-blue-900/70 mb-4">{plan.description}</p>
                    
                    <div className="space-y-3">
                      <h4 className="font-semibold text-blue-900 text-sm">Plan de Comidas</h4>
                      {plan.meals.map((meal, index) => (
                        <div 
                          key={index}
                          className="bg-white border border-orange-200 rounded-lg p-3"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Utensils className="w-5 h-5 text-orange-600" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-blue-900 text-sm">{meal.time}</p>
                              <p className="text-sm text-blue-900/70 mt-1">{meal.meal}</p>
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

          <TabsContent value="physiotherapy" className="space-y-4">
            {physiotherapyPlans.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 mx-auto text-blue-300 mb-3" />
                <p className="text-blue-900/60">No tienes planes de fisioterapia asignados</p>
              </div>
            ) : (
              physiotherapyPlans.map((plan) => (
                <Card key={plan.id} className="border-blue-200 bg-blue-50/30">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg text-blue-900">{plan.title}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <Calendar className="w-3 h-3" />
                          {format(parseISO(plan.createdDate), "d 'de' MMMM, yyyy", { locale: es })}
                        </CardDescription>
                      </div>
                      <Badge className="bg-blue-900 text-white">Fisioterapia</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-blue-900/70 mb-4">{plan.description}</p>
                    
                    <div className="space-y-3">
                      <h4 className="font-semibold text-blue-900 text-sm">Rutina de Ejercicios</h4>
                      {plan.exercises.map((exercise, index) => (
                        <div 
                          key={index}
                          className="bg-white border border-blue-200 rounded-lg p-4"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Activity className="w-5 h-5 text-blue-900" />
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-blue-900">{exercise.name}</p>
                              <div className="flex gap-4 mt-2 text-sm text-blue-900/70">
                                <span><strong>Series:</strong> {exercise.sets}</span>
                                <span><strong>Repeticiones:</strong> {exercise.reps}</span>
                              </div>
                              <p className="text-sm text-blue-900/70 mt-2">{exercise.description}</p>
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
