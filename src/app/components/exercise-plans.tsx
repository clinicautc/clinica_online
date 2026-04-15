import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { ArrowLeft, LogOut, Dumbbell, Clock, Target, AlertCircle } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import type { User } from '../App';

type ExercisePlansProps = {
  user: User;
  onBack: () => void;
  onLogout: () => void;
};

export function ExercisePlans({ user, onBack, onLogout }: ExercisePlansProps) {
  const exercisePrograms = [
    {
      id: 1,
      name: 'Rehabilitación de Espalda Baja',
      description: 'Programa de 6 semanas para fortalecer y estabilizar la zona lumbar',
      difficulty: 'Principiante',
      duration: '6 semanas',
      sessionsPerWeek: 3,
      image: 'https://images.unsplash.com/photo-1545463913-5083aa7359a6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaHlzaW90aGVyYXB5JTIwZXhlcmNpc2UlMjByZWhhYmlsaXRhdGlvbnxlbnwxfHx8fDE3NzA3MzU4NjF8MA&ixlib=rb-4.1.0&q=80&w=1080',
      exercises: [
        { name: 'Estiramiento de gato-camello', sets: '3 series', reps: '10 repeticiones', rest: '30 seg' },
        { name: 'Puente de glúteos', sets: '3 series', reps: '12 repeticiones', rest: '45 seg' },
        { name: 'Plancha abdominal', sets: '3 series', reps: '20-30 segundos', rest: '60 seg' },
        { name: 'Rotación de tronco acostado', sets: '2 series', reps: '8 cada lado', rest: '30 seg' },
      ],
    },
    {
      id: 2,
      name: 'Recuperación de Rodilla',
      description: 'Ejercicios para fortalecer y mejorar la movilidad de la rodilla',
      difficulty: 'Intermedio',
      duration: '8 semanas',
      sessionsPerWeek: 4,
      image: 'https://images.unsplash.com/photo-1767611116147-592ffdb14e80?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHJldGNoaW5nJTIwcGh5c2ljYWwlMjB0aGVyYXB5fGVufDF8fHx8MTc3MDczNTg2Mnww&ixlib=rb-4.1.0&q=80&w=1080',
      exercises: [
        { name: 'Flexión y extensión de rodilla', sets: '3 series', reps: '15 repeticiones', rest: '30 seg' },
        { name: 'Sentadilla asistida', sets: '3 series', reps: '10 repeticiones', rest: '60 seg' },
        { name: 'Elevación de pierna recta', sets: '3 series', reps: '12 cada pierna', rest: '45 seg' },
        { name: 'Estiramiento de cuádriceps', sets: '2 series', reps: '30 segundos cada lado', rest: '20 seg' },
      ],
    },
  ];

  const generalTips = [
    {
      title: 'Antes del Ejercicio',
      tips: [
        'Realiza un calentamiento de 5-10 minutos',
        'Asegúrate de tener el espacio adecuado',
        'Usa ropa cómoda y apropiada',
        'Ten agua cerca para hidratarte',
      ],
    },
    {
      title: 'Durante el Ejercicio',
      tips: [
        'Mantén una respiración constante y controlada',
        'Ejecuta los movimientos de forma lenta y controlada',
        'Detente si sientes dolor agudo',
        'Mantén la postura correcta en cada ejercicio',
      ],
    },
    {
      title: 'Después del Ejercicio',
      tips: [
        'Realiza estiramientos suaves por 5-10 minutos',
        'Aplica hielo si hay inflamación (15-20 min)',
        'Registra tu progreso y sensaciones',
        'Descansa adecuadamente entre sesiones',
      ],
    },
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Principiante':
        return 'bg-green-100 text-green-700';
      case 'Intermedio':
        return 'bg-blue-100 text-blue-700';
      case 'Avanzado':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

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
                  Planes de Fisioterapia
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
        <Tabs defaultValue="programs" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="programs">Mis Programas</TabsTrigger>
            <TabsTrigger value="guide">Guía de Ejercicios</TabsTrigger>
          </TabsList>

          <TabsContent value="programs" className="space-y-6">
            {exercisePrograms.map((program) => (
              <Card key={program.id} className="overflow-hidden">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="relative h-64 md:h-auto overflow-hidden">
                    <ImageWithFallback
                      src={program.image}
                      alt={program.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <CardTitle className="text-xl mb-2">{program.name}</CardTitle>
                        <CardDescription className="text-base">{program.description}</CardDescription>
                      </div>
                      <Badge className={getDifficultyColor(program.difficulty)}>
                        {program.difficulty}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-4 mb-6 text-sm text-gray-600">
                      <span className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {program.duration}
                      </span>
                      <span className="flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        {program.sessionsPerWeek}x por semana
                      </span>
                      <span className="flex items-center gap-2">
                        <Dumbbell className="w-4 h-4" />
                        {program.exercises.length} ejercicios
                      </span>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm">Ejercicios del Programa</h4>
                      {program.exercises.map((exercise, index) => (
                        <div key={index} className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-sm">{exercise.name}</p>
                              <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-600">
                                <span>{exercise.sets}</span>
                                <span>•</span>
                                <span>{exercise.reps}</span>
                                <span>•</span>
                                <span>Descanso: {exercise.rest}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            ))}

            <Card className="bg-gradient-to-r from-blue-50 to-white border-2 border-blue-100">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <CardTitle className="text-lg">Importante</CardTitle>
                    <CardDescription className="mt-2">
                      Estos programas son personalizados según tu evaluación inicial y condición actual.
                      Sigue las indicaciones de tu fisioterapeuta y no avances más rápido de lo recomendado.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mt-1.5"></span>
                  Realiza los ejercicios en el orden indicado
                </p>
                <p className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mt-1.5"></span>
                  Respeta los tiempos de descanso entre series
                </p>
                <p className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mt-1.5"></span>
                  Si experimentas dolor, detén el ejercicio y consulta a tu terapeuta
                </p>
                <p className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mt-1.5"></span>
                  Los programas se ajustan según tu progreso en cada sesión
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="guide" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {generalTips.map((section, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-900 to-orange-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {index + 1}
                      </div>
                      {section.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {section.tips.map((tip, tipIndex) => (
                        <li key={tipIndex} className="flex gap-2 text-sm text-gray-700">
                          <span className="text-green-600">✓</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  Señales de Alerta
                </CardTitle>
                <CardDescription>
                  Detén el ejercicio inmediatamente y contacta a tu fisioterapeuta si experimentas:
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-start gap-2">
                        <span className="text-red-600">⚠</span>
                        <span>Dolor agudo o punzante durante el ejercicio</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-600">⚠</span>
                        <span>Mareos o náuseas</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-600">⚠</span>
                        <span>Inflamación excesiva después del ejercicio</span>
                      </li>
                    </ul>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-start gap-2">
                        <span className="text-red-600">⚠</span>
                        <span>Entumecimiento u hormigueo persistente</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-600">⚠</span>
                        <span>Pérdida de movilidad o función</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-600">⚠</span>
                        <span>Dolor que empeora con el tiempo</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Registro de Progreso</CardTitle>
                <CardDescription>
                  Lleva un registro de tus sesiones para monitorear tu evolución
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gradient-to-r from-blue-50 to-white p-6 rounded-lg border border-blue-200">
                  <p className="text-sm text-gray-700 mb-4">
                    Después de cada sesión, toma nota de:
                  </p>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-blue-600 rounded-full mt-1.5"></span>
                      Nivel de dificultad experimentado (1-10)
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-blue-600 rounded-full mt-1.5"></span>
                      Nivel de dolor antes y después (1-10)
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-blue-600 rounded-full mt-1.5"></span>
                      Ejercicios completados vs. programados
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-blue-600 rounded-full mt-1.5"></span>
                      Observaciones o dificultades específicas
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
