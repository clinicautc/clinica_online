import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { ScrollArea } from './ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';

type PhysiotherapyFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointmentId: string;
};

export function PhysiotherapyFormDialog({ open, onOpenChange, appointmentId }: PhysiotherapyFormDialogProps) {
  const [formData, setFormData] = useState({
    chiefComplaint: '',
    painLocation: '',
    painLevel: '',
    painType: '',
    onsetDate: '',
    previousTreatment: '',
    medications: '',
    surgeryHistory: '',
    mobilityLevel: '',
    dailyActivities: '',
    workOccupation: '',
    exerciseHabits: '',
    sleepQuality: '',
    goals: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Guardar formulario de fisioterapia
    const forms = JSON.parse(localStorage.getItem('physiotherapyForms') || '[]');
    forms.push({
      id: Date.now().toString(),
      appointmentId,
      ...formData,
      submittedAt: new Date().toISOString(),
    });
    localStorage.setItem('physiotherapyForms', JSON.stringify(forms));

    toast.success('Formulario de fisioterapia enviado correctamente');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Formulario de Evaluación Fisioterapéutica</DialogTitle>
          <DialogDescription>
            Completa la siguiente información para tu evaluación de fisioterapia
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-gray-700">Motivo de Consulta</h4>
              <div className="space-y-2">
                <Label htmlFor="chiefComplaint">Síntoma o Problema Principal *</Label>
                <Textarea
                  id="chiefComplaint"
                  placeholder="Describe el motivo principal de tu visita..."
                  value={formData.chiefComplaint}
                  onChange={(e) => setFormData({ ...formData, chiefComplaint: e.target.value })}
                  rows={3}
                  required
                />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-gray-700">Evaluación del Dolor</h4>
              <div className="space-y-2">
                <Label htmlFor="painLocation">Ubicación del Dolor</Label>
                <Input
                  id="painLocation"
                  placeholder="Ej: Espalda baja, rodilla derecha, hombro..."
                  value={formData.painLocation}
                  onChange={(e) => setFormData({ ...formData, painLocation: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="painLevel">Nivel de Dolor (0-10)</Label>
                  <Select value={formData.painLevel} onValueChange={(value) => setFormData({ ...formData, painLevel: value })}>
                    <SelectTrigger id="painLevel">
                      <SelectValue placeholder="Selecciona nivel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0 - Sin dolor</SelectItem>
                      <SelectItem value="1-3">1-3 - Leve</SelectItem>
                      <SelectItem value="4-6">4-6 - Moderado</SelectItem>
                      <SelectItem value="7-9">7-9 - Severo</SelectItem>
                      <SelectItem value="10">10 - Insoportable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="painType">Tipo de Dolor</Label>
                  <Select value={formData.painType} onValueChange={(value) => setFormData({ ...formData, painType: value })}>
                    <SelectTrigger id="painType">
                      <SelectValue placeholder="Selecciona tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="agudo">Agudo/Punzante</SelectItem>
                      <SelectItem value="sordo">Sordo/Constante</SelectItem>
                      <SelectItem value="pulsante">Pulsante</SelectItem>
                      <SelectItem value="ardiente">Ardiente</SelectItem>
                      <SelectItem value="intermitente">Intermitente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="onsetDate">Fecha de Inicio</Label>
                <Input
                  id="onsetDate"
                  type="date"
                  value={formData.onsetDate}
                  onChange={(e) => setFormData({ ...formData, onsetDate: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-gray-700">Historial Médico</h4>
              <div className="space-y-2">
                <Label htmlFor="previousTreatment">Tratamientos Previos</Label>
                <Textarea
                  id="previousTreatment"
                  placeholder="Describe tratamientos anteriores para esta condición..."
                  value={formData.previousTreatment}
                  onChange={(e) => setFormData({ ...formData, previousTreatment: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="medications">Medicamentos Actuales</Label>
                <Input
                  id="medications"
                  placeholder="Lista de medicamentos que tomas"
                  value={formData.medications}
                  onChange={(e) => setFormData({ ...formData, medications: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="surgeryHistory">Historial de Cirugías</Label>
                <Textarea
                  id="surgeryHistory"
                  placeholder="Cirugías previas relacionadas o relevantes..."
                  value={formData.surgeryHistory}
                  onChange={(e) => setFormData({ ...formData, surgeryHistory: e.target.value })}
                  rows={2}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-gray-700">Funcionalidad y Estilo de Vida</h4>
              <div className="space-y-2">
                <Label htmlFor="mobilityLevel">Nivel de Movilidad</Label>
                <Select value={formData.mobilityLevel} onValueChange={(value) => setFormData({ ...formData, mobilityLevel: value })}>
                  <SelectTrigger id="mobilityLevel">
                    <SelectValue placeholder="Selecciona nivel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="independiente">Completamente Independiente</SelectItem>
                    <SelectItem value="asistencia-minima">Asistencia Mínima</SelectItem>
                    <SelectItem value="asistencia-moderada">Asistencia Moderada</SelectItem>
                    <SelectItem value="asistencia-total">Asistencia Total</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dailyActivities">Actividades Diarias Afectadas</Label>
                <Textarea
                  id="dailyActivities"
                  placeholder="Actividades que te resultan difíciles de realizar..."
                  value={formData.dailyActivities}
                  onChange={(e) => setFormData({ ...formData, dailyActivities: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="workOccupation">Ocupación/Trabajo</Label>
                <Input
                  id="workOccupation"
                  placeholder="Tu ocupación o tipo de trabajo"
                  value={formData.workOccupation}
                  onChange={(e) => setFormData({ ...formData, workOccupation: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="exerciseHabits">Hábitos de Ejercicio</Label>
                <Textarea
                  id="exerciseHabits"
                  placeholder="Tipo y frecuencia de ejercicio que realizas..."
                  value={formData.exerciseHabits}
                  onChange={(e) => setFormData({ ...formData, exerciseHabits: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sleepQuality">Calidad del Sueño</Label>
                <Select value={formData.sleepQuality} onValueChange={(value) => setFormData({ ...formData, sleepQuality: value })}>
                  <SelectTrigger id="sleepQuality">
                    <SelectValue placeholder="Selecciona calidad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excelente">Excelente</SelectItem>
                    <SelectItem value="buena">Buena</SelectItem>
                    <SelectItem value="regular">Regular</SelectItem>
                    <SelectItem value="mala">Mala</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-gray-700">Objetivos de Tratamiento</h4>
              <div className="space-y-2">
                <Label htmlFor="goals">Qué Esperas Lograr con la Fisioterapia</Label>
                <Textarea
                  id="goals"
                  placeholder="Ej: Reducir dolor, mejorar movilidad, regresar a deportes..."
                  value={formData.goals}
                  onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
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
