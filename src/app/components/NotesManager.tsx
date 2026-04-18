import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { mockNotes, Note } from '../lib/mockData';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Calendar, User, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

export default function NotesManager() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    category: 'general' as 'general' | 'nutricion' | 'fisioterapia'
  });

  useEffect(() => {
    const stored = localStorage.getItem('utc_notes');
    const allNotes = stored ? JSON.parse(stored) : mockNotes;
    setNotes(allNotes.sort((a: Note, b: Note) => {
      return new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime();
    }));
    if (!stored) localStorage.setItem('utc_notes', JSON.stringify(mockNotes));
  }, []);

  const updateNotes = (updated: Note[]) => {
    setNotes(updated);
    localStorage.setItem('utc_notes', JSON.stringify(updated));
  };

  const handleCreate = () => {
    if (!newNote.title || !newNote.content) {
      toast.error('Por favor completa todos los campos');
      return;
    }
    const note: Note = {
      id: `note${Date.now()}`,
      title: newNote.title,
      content: newNote.content,
      category: newNote.category,
      createdBy: user?.nombre || 'Administrador UTC',
      createdDate: new Date().toISOString().split('T')[0] 
    };
    const updated = [note, ...notes]; 
    updateNotes(updated);
    setNewNote({ title: '', content: '', category: 'general' });
    setIsCreating(false);
    toast.success('Nota publicada para los practicantes');
  };

  const handleDelete = (id: string) => {
    const updated = notes.filter(note => note.id !== id);
    updateNotes(updated);
    toast.success('Nota eliminada');
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'nutricion':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Nutrición</Badge>;
      case 'fisioterapia':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Fisioterapia</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">General</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-blue-900/15">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-blue-900">Comunicación Académica</CardTitle>
              <CardDescription>Avisos oficiales para los departamentos</CardDescription>
            </div>
            {!isCreating && (
              <Button onClick={() => setIsCreating(true)} className="bg-blue-900 text-white">
                <Plus className="w-4 h-4 mr-2" /> Nueva Nota
              </Button>
            )}
          </div>
        </CardHeader>
        {isCreating && (
          <CardContent className="animate-in fade-in">
            <div className="space-y-4 p-4 border border-blue-100 rounded-lg bg-blue-50/30">
              <Label className="text-blue-900">Título</Label>
              <Input
                value={newNote.title}
                onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                placeholder="Título del aviso"
              />
              <Label className="text-blue-900">Área destinada</Label>
              <Select value={newNote.category} onValueChange={(v: any) => setNewNote({ ...newNote, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">Aviso General</SelectItem>
                  <SelectItem value="nutricion">Nutrición</SelectItem>
                  <SelectItem value="fisioterapia">Fisioterapia</SelectItem>
                </SelectContent>
              </Select>
              <Label className="text-blue-900">Mensaje</Label>
              <Textarea
                value={newNote.content}
                onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                placeholder="Mensaje para los practicantes..."
              />
              <div className="flex gap-2">
                <Button onClick={handleCreate} className="bg-blue-900 flex-1">Publicar</Button>
                <Button variant="outline" onClick={() => setIsCreating(false)} className="flex-1">Cancelar</Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      <Card className="border-blue-900/10">
        <CardHeader className="bg-slate-50/50">
          <CardTitle className="text-blue-900 text-lg">Tablero de Avisos</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {notes.length === 0 ? (
            <p className="text-center text-slate-400 py-10">No hay avisos recientes.</p>
          ) : (
            <div className="space-y-4">
              {notes.map((note) => (
                <div key={note.id} className="group border rounded-xl p-5 bg-white relative">
                  <div className="flex justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-bold text-blue-900">{note.title}</span>
                        {getCategoryBadge(note.category)}
                      </div>
                      <div className="flex gap-4 text-xs text-slate-400 mb-3">
                        <span className="flex items-center gap-1"><User className="w-3" /> {note.createdBy}</span>
                        <span className="flex items-center gap-1"><Calendar className="w-3" /> {format(parseISO(note.createdDate), "PPP", { locale: es })}</span>
                      </div>
                      <p className="text-sm text-slate-600 whitespace-pre-wrap">{note.content}</p>
                    </div>
                    <Button
                      variant="ghost" size="sm" onClick={() => handleDelete(note.id)}
                      className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**

* * 1. <div className="...">: Etiqueta estándar de HTML para agrupar elementos. 
 * En este código usa Tailwind CSS (ej: "space-y-6") para separar componentes.
 
* * 2. <Card />, <CardHeader />, <CardTitle />, <CardContent />: Componentes de Shadcn 
 * que crean un contenedor visual elegante con bordes y jerarquía de títulos.
 
* * 3. <Button />: Botón reactivo. La propiedad "variant" define si es sólido, 
 * transparente (ghost) o con borde (outline).

* * 4. <Input />: Etiqueta para entrada de texto de una sola línea (ej: el título).

* * 5. <Textarea />: Etiqueta de entrada de texto grande, permite múltiples líneas 
 * y saltos de párrafo (ej: el cuerpo del aviso).

* * 6. <Select />, <SelectTrigger />, <SelectItem />: Conjunto de etiquetas que forman 
 * el menú desplegable para elegir categorías de forma controlada.

* * 7. <Badge />: Pequeña etiqueta de color (como una "medalla") para identificar 
 * visualmente las categorías como Nutrición o Fisioterapia.

* * 8. <Label />: Etiqueta de texto vinculada a un input. Ayuda a que el sistema sea 
 * accesible para personas con discapacidad visual y define qué pide cada campo.

* * 9. <span />: Etiqueta de texto en línea. Se usa para pequeños detalles como 
 * nombres de usuario o fechas sin romper la estructura del párrafo.

* * 10. <Plus />, <Calendar />, <User />, <Trash2 />: Etiquetas de Lucide-React que 
 * inyectan iconos vectoriales (SVG) directamente en la interfaz.
 * ==============================================================================
 */