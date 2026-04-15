import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Bell, Plus, Trash2, Edit, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { toast } from 'sonner';

type Note = {
  id: string;
  title: string;
  content: string;
  category: string;
  priority: string;
  createdAt: string;
  author: string;
};

export function NotesManagement() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'general',
    priority: 'normal',
  });

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = () => {
    const savedNotes = JSON.parse(localStorage.getItem('utcNotes') || '[]');
    setNotes(savedNotes.sort((a: Note, b: Note) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.content) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    if (editingNote) {
      // Editar nota existente
      const updatedNotes = notes.map((note) =>
        note.id === editingNote.id
          ? { ...note, ...formData }
          : note
      );
      localStorage.setItem('utcNotes', JSON.stringify(updatedNotes));
      toast.success('Nota actualizada correctamente');
    } else {
      // Crear nueva nota
      const newNote: Note = {
        id: Date.now().toString(),
        ...formData,
        createdAt: new Date().toISOString(),
        author: 'Admin UTC',
      };
      const updatedNotes = [newNote, ...notes];
      localStorage.setItem('utcNotes', JSON.stringify(updatedNotes));
      toast.success('Nota publicada correctamente');
    }

    loadNotes();
    resetForm();
    setIsDialogOpen(false);
  };

  const deleteNote = (id: string) => {
    const updatedNotes = notes.filter((note) => note.id !== id);
    localStorage.setItem('utcNotes', JSON.stringify(updatedNotes));
    loadNotes();
    toast.success('Nota eliminada correctamente');
  };

  const startEdit = (note: Note) => {
    setEditingNote(note);
    setFormData({
      title: note.title,
      content: note.content,
      category: note.category,
      priority: note.priority,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      category: 'general',
      priority: 'normal',
    });
    setEditingNote(null);
  };

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      resetForm();
    }
  };

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      general: 'bg-gray-100 text-gray-700',
      fisioterapia: 'bg-blue-100 text-blue-700',
      nutricion: 'bg-green-100 text-green-700',
      administrativo: 'bg-purple-100 text-purple-700',
      urgente: 'bg-red-100 text-red-700',
    };
    return (
      <Badge className={colors[category] || colors.general}>
        {category.charAt(0).toUpperCase() + category.slice(1)}
      </Badge>
    );
  };

  const getPriorityIcon = (priority: string) => {
    if (priority === 'alta') {
      return <AlertCircle className="w-4 h-4 text-red-600" />;
    }
    if (priority === 'media') {
      return <AlertCircle className="w-4 h-4 text-yellow-600" />;
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notas y Recomendaciones UTC
            </CardTitle>
            <CardDescription>
              Publica notas, recomendaciones y avisos para los practicantes de la clínica
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-900 to-orange-500 hover:from-blue-800 hover:to-orange-600">
                <Plus className="w-4 h-4 mr-2" />
                Nueva Nota
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingNote ? 'Editar Nota' : 'Publicar Nueva Nota'}
                </DialogTitle>
                <DialogDescription>
                  {editingNote
                    ? 'Modifica la información de la nota'
                    : 'Completa el formulario para publicar una nueva nota o recomendación'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    placeholder="Título de la nota..."
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Categoría</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                      <SelectTrigger id="category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="fisioterapia">Fisioterapia</SelectItem>
                        <SelectItem value="nutricion">Nutrición</SelectItem>
                        <SelectItem value="administrativo">Administrativo</SelectItem>
                        <SelectItem value="urgente">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority">Prioridad</Label>
                    <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                      <SelectTrigger id="priority">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="baja">Baja</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="media">Media</SelectItem>
                        <SelectItem value="alta">Alta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Contenido *</Label>
                  <Textarea
                    id="content"
                    placeholder="Escribe el contenido de la nota o recomendación..."
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={8}
                    required
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => handleDialogClose(false)} className="flex-1">
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex-1 bg-gradient-to-r from-blue-900 to-orange-500 hover:from-blue-800 hover:to-orange-600">
                    {editingNote ? 'Actualizar' : 'Publicar'} Nota
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-800">{notes.length}</p>
            <p className="text-sm text-gray-600">Total de Notas</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              {notes.filter((n) => n.category === 'fisioterapia').length}
            </p>
            <p className="text-sm text-gray-600">Fisioterapia</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {notes.filter((n) => n.category === 'nutricion').length}
            </p>
            <p className="text-sm text-gray-600">Nutrición</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">
              {notes.filter((n) => n.priority === 'alta').length}
            </p>
            <p className="text-sm text-gray-600">Alta Prioridad</p>
          </div>
        </div>

        {/* Lista de notas */}
        {notes.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No hay notas publicadas</p>
            <p className="text-sm text-gray-500 mt-2">Usa el botón "Nueva Nota" para publicar la primera</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notes.map((note) => (
              <Card key={note.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getPriorityIcon(note.priority)}
                        <CardTitle className="text-lg">{note.title}</CardTitle>
                        {getCategoryBadge(note.category)}
                      </div>
                      <CardDescription className="flex items-center gap-2">
                        <span>{note.author}</span>
                        <span>•</span>
                        <span>
                          {new Date(note.createdAt).toLocaleDateString('es-MX', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => startEdit(note)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteNote(note.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Información */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-base">Sobre las Notas UTC</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-700">
            <p className="flex items-start gap-2">
              <span className="w-2 h-2 bg-blue-600 rounded-full mt-1.5"></span>
              Las notas se publican para todos los practicantes de la clínica
            </p>
            <p className="flex items-start gap-2">
              <span className="w-2 h-2 bg-blue-600 rounded-full mt-1.5"></span>
              Usa categorías para organizar las notas por área (Fisioterapia, Nutrición, etc.)
            </p>
            <p className="flex items-start gap-2">
              <span className="w-2 h-2 bg-blue-600 rounded-full mt-1.5"></span>
              La prioridad "Alta" destaca notas importantes o urgentes
            </p>
            <p className="flex items-start gap-2">
              <span className="w-2 h-2 bg-blue-600 rounded-full mt-1.5"></span>
              Puedes editar o eliminar notas en cualquier momento
            </p>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}
