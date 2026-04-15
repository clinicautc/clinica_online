import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { ScrollArea } from './ui/scroll-area';
import { toast } from 'sonner';

type NutritionFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointmentId: string;
};

export function NutritionFormDialog({ open, onOpenChange, appointmentId }: NutritionFormDialogProps) {
  const [formData, setFormData] = useState({
    weight: '',
    height: '',
    allergies: '',
    medications: '',
    waterIntake: '',
    mealsPerDay: '',
    favoriteFood: '',
    dislikedFood: '',
    exerciseFrequency: '',
    healthGoals: '',
    breakfast: '',
    lunch: '',
    dinner: '',
    snacks: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Guardar formulario de nutrición
    const forms = JSON.parse(localStorage.getItem('nutritionForms') || '[]');
    forms.push({
      id: Date.now().toString(),
      appointmentId,
      ...formData,
      submittedAt: new Date().toISOString(),
    });
    localStorage.setItem('nutritionForms', JSON.stringify(forms));

    toast.success('Formulario de nutrición enviado correctamente');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Formulario de Evaluación Nutricional</DialogTitle>
          <DialogDescription>
            Completa la siguiente información para tu evaluación de nutrición
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-gray-700">Datos Antropométricos</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="weight">Peso (kg) *</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height">Altura (cm) *</Label>
                  <Input
                    id="height"
                    type="number"
                    step="0.1"
                    value={formData.height}
                    onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-gray-700">Información Médica</h4>
              <div className="space-y-2">
                <Label htmlFor="allergies">Alergias Alimentarias</Label>
                <Input
                  id="allergies"
                  placeholder="Ej: Lactosa, nueces, mariscos..."
                  value={formData.allergies}
                  onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="medications">Medicamentos Actuales</Label>
                <Input
                  id="medications"
                  placeholder="Lista de medicamentos que tomas regularmente"
                  value={formData.medications}
                  onChange={(e) => setFormData({ ...formData, medications: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-gray-700">Hábitos Alimenticios</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="waterIntake">Consumo de Agua (vasos/día)</Label>
                  <Input
                    id="waterIntake"
                    type="number"
                    value={formData.waterIntake}
                    onChange={(e) => setFormData({ ...formData, waterIntake: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mealsPerDay">Comidas al Día</Label>
                  <Input
                    id="mealsPerDay"
                    type="number"
                    value={formData.mealsPerDay}
                    onChange={(e) => setFormData({ ...formData, mealsPerDay: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="favoriteFood">Alimentos Favoritos</Label>
                <Input
                  id="favoriteFood"
                  placeholder="Alimentos que más disfrutas"
                  value={formData.favoriteFood}
                  onChange={(e) => setFormData({ ...formData, favoriteFood: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dislikedFood">Alimentos que No Te Gustan</Label>
                <Input
                  id="dislikedFood"
                  placeholder="Alimentos que prefieres evitar"
                  value={formData.dislikedFood}
                  onChange={(e) => setFormData({ ...formData, dislikedFood: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-gray-700">Recordatorio de 24 Horas</h4>
              <p className="text-sm text-gray-600">Describe lo que consumiste ayer</p>
              <div className="space-y-2">
                <Label htmlFor="breakfast">Desayuno</Label>
                <Textarea
                  id="breakfast"
                  placeholder="Alimentos y cantidades..."
                  value={formData.breakfast}
                  onChange={(e) => setFormData({ ...formData, breakfast: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lunch">Comida</Label>
                <Textarea
                  id="lunch"
                  placeholder="Alimentos y cantidades..."
                  value={formData.lunch}
                  onChange={(e) => setFormData({ ...formData, lunch: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dinner">Cena</Label>
                <Textarea
                  id="dinner"
                  placeholder="Alimentos y cantidades..."
                  value={formData.dinner}
                  onChange={(e) => setFormData({ ...formData, dinner: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="snacks">Colaciones/Snacks</Label>
                <Textarea
                  id="snacks"
                  placeholder="Alimentos consumidos entre comidas..."
                  value={formData.snacks}
                  onChange={(e) => setFormData({ ...formData, snacks: e.target.value })}
                  rows={2}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-gray-700">Actividad Física y Objetivos</h4>
              <div className="space-y-2">
                <Label htmlFor="exerciseFrequency">Frecuencia de Ejercicio (días/semana)</Label>
                <Input
                  id="exerciseFrequency"
                  type="number"
                  value={formData.exerciseFrequency}
                  onChange={(e) => setFormData({ ...formData, exerciseFrequency: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="healthGoals">Objetivos de Salud</Label>
                <Textarea
                  id="healthGoals"
                  placeholder="Ej: Pérdida de peso, ganancia muscular, control de diabetes..."
                  value={formData.healthGoals}
                  onChange={(e) => setFormData({ ...formData, healthGoals: e.target.value })}
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" className="flex-1 bg-gradient-to-r from-blue-900 to-orange-500 hover:from-blue-800 hover:to-orange-600">
                Enviar Formulario
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
