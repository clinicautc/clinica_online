import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { ArrowLeft, LogOut, Apple, Calendar, Clock } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import type { User } from '../App';

type NutritionPlansProps = {
  user: User;
  onBack: () => void;
  onLogout: () => void;
};

export function NutritionPlans({ user, onBack, onLogout }: NutritionPlansProps) {
  const mealPlans = [
    {
      id: 1,
      name: 'Plan de Pérdida de Peso',
      description: 'Plan balanceado de 1500 calorías diarias',
      calories: 1500,
      duration: '4 semanas',
      image: 'https://images.unsplash.com/photo-1606858274001-dd10efc5ce7d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFsdGh5JTIwbWVhbCUyMG51dHJpdGlvbiUyMGZvb2R8ZW58MXx8fHwxNzcwNjM1MjY1fDA&ixlib=rb-4.1.0&q=80&w=1080',
      meals: {
        breakfast: 'Avena con frutos rojos y nueces (350 cal)',
        snack1: 'Yogurt griego con miel (150 cal)',
        lunch: 'Pechuga de pollo con ensalada y quinoa (500 cal)',
        snack2: 'Manzana con mantequilla de almendra (200 cal)',
        dinner: 'Salmón al horno con verduras al vapor (300 cal)',
      },
    },
    {
      id: 2,
      name: 'Plan de Ganancia Muscular',
      description: 'Plan alto en proteínas de 2500 calorías',
      calories: 2500,
      duration: '6 semanas',
      image: 'https://images.unsplash.com/photo-1624340209404-4f479dd59708?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFsdGh5JTIwc2FsYWQlMjBib3dsfGVufDF8fHx8MTc3MDcwODEzMnww&ixlib=rb-4.1.0&q=80&w=1080',
      meals: {
        breakfast: 'Claras de huevo con aguacate y pan integral (500 cal)',
        snack1: 'Batido de proteína con plátano (300 cal)',
        lunch: 'Carne magra con arroz integral y vegetales (700 cal)',
        snack2: 'Nueces mixtas y frutas (250 cal)',
        dinner: 'Pechuga de pavo con camote y brócoli (550 cal)',
        snack3: 'Requesón bajo en grasa (200 cal)',
      },
    },
  ];

  const nutritionTips = [
    'Mantén una hidratación adecuada: mínimo 2 litros de agua al día',
    'Come porciones moderadas cada 3-4 horas',
    'Incluye proteína en cada comida para mantener la saciedad',
    'Prioriza alimentos frescos y naturales sobre procesados',
    'Planifica tus comidas con anticipación para evitar decisiones impulsivas',
    'Lee las etiquetas nutricionales al hacer compras',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={onBack} size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-900 to-orange-500 bg-clip-text text-transparent">
                  Planes de Nutrición
                </h1>
                <p className="text-sm text-gray-600">{user.name}</p>
              </div>
            </div>
            <Button variant="outline" onClick={onLogout} className="flex items-center gap-2">
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="plans" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="plans">Mis Planes</TabsTrigger>
            <TabsTrigger value="tips">Recomendaciones</TabsTrigger>
          </TabsList>

          <TabsContent value="plans" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {mealPlans.map((plan) => (
                <Card key={plan.id} className="overflow-hidden">
                  <div className="relative h-48 w-full overflow-hidden">
                    <ImageWithFallback
                      src={plan.image}
                      alt={plan.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full text-sm font-semibold text-green-600">
                      {plan.calories} cal
                    </div>
                  </div>
                  <CardHeader>
                    <CardTitle>{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {plan.duration}
                      </span>
                      <span className="flex items-center gap-1">
                        <Apple className="w-4 h-4" />
                        {Object.keys(plan.meals).length} comidas
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm">Menú del Día</h4>
                      {Object.entries(plan.meals).map(([mealType, meal]) => (
                        <div key={mealType} className="text-sm">
                          <span className="font-medium capitalize text-gray-700">
                            {mealType === 'breakfast' && 'Desayuno'}
                            {mealType === 'lunch' && 'Comida'}
                            {mealType === 'dinner' && 'Cena'}
                            {mealType.startsWith('snack') && `Colación ${mealType.slice(-1)}`}:
                          </span>
                          <p className="text-gray-600 ml-2">{meal}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="bg-gradient-to-r from-blue-50 to-white border-2 border-blue-100">
              <CardHeader>
                <CardTitle>Información Importante</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-green-600 rounded-full mt-1.5"></span>
                  Los planes de alimentación son personalizados según tu evaluación inicial
                </p>
                <p className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-green-600 rounded-full mt-1.5"></span>
                  Sigue las porciones indicadas para obtener mejores resultados
                </p>
                <p className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-green-600 rounded-full mt-1.5"></span>
                  Consulta con tu nutriólogo cualquier duda o ajuste necesario
                </p>
                <p className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-green-600 rounded-full mt-1.5"></span>
                  Los planes se actualizan cada 2-4 semanas según tu progreso
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tips" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Apple className="w-5 h-5 text-green-600" />
                  Recomendaciones Nutricionales
                </CardTitle>
                <CardDescription>
                  Consejos para mantener una alimentación saludable
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {nutritionTips.map((tip, index) => (
                    <div key={index} className="flex gap-3 p-4 bg-gradient-to-r from-orange-50 to-blue-50 rounded-lg border border-orange-200">
                      <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-blue-900 to-orange-500 text-white rounded-full flex items-center justify-center font-semibold">
                        {index + 1}
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed pt-1">{tip}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Alimentos Recomendados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h4 className="font-semibold text-sm mb-3 text-green-700">Proteínas</h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>• Pollo y pavo</li>
                      <li>• Pescado (salmón, atún)</li>
                      <li>• Huevos</li>
                      <li>• Legumbres</li>
                      <li>• Yogurt griego</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-3 text-blue-700">Carbohidratos</h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>• Avena integral</li>
                      <li>• Arroz integral</li>
                      <li>• Quinoa</li>
                      <li>• Camote</li>
                      <li>• Pan integral</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-3 text-green-700">Grasas Saludables</h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>• Aguacate</li>
                      <li>• Nueces y almendras</li>
                      <li>• Aceite de oliva</li>
                      <li>• Semillas (chía, linaza)</li>
                      <li>• Pescados grasos</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
