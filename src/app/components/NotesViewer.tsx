import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Trash2, FileText, Loader2, Clock, User } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { endpoints } from '../lib/api';

// La estructura de las notas que viene de PostgreSQL
interface Note {
  id: number;
  titulo: string;
  contenido: string;
  destino: string;
  creado_por_nombre: string;
  fecha_creacion: string;
}

// Aquí están las propiedades que TypeScript nos pedía usar
interface NotesViewerProps {
  readOnly?: boolean;
  filterCategory?: string;
}

export default function NotesViewer({ readOnly = false, filterCategory }: NotesViewerProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const response = await fetch(endpoints.notas);

      if (response.ok) {
        const data: Note[] = await response.json();

        // AQUÍ USAMOS 'filterCategory': Filtramos las notas según el área
        const filteredNotes = data.filter(note => {
          if (!filterCategory || filterCategory === 'todos' || filterCategory === 'general') return true;
          // Mostramos las notas que son para esta área específica o las que son globales ('todos')
          return note.destino === filterCategory || note.destino === 'todos';
        });

        // Ordenamos para que las más nuevas salgan arriba
        filteredNotes.sort((a, b) => new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime());

        setNotes(filteredNotes);
      }
    } catch (error) {
      toast.error("Error al cargar los comunicados");
    } finally {
      setLoading(false);
    }
  };

  // Se recarga cada vez que cambia la categoría (ej. cambiar de pestaña)
  useEffect(() => {
    fetchNotes();
  }, [filterCategory]);

  const handleDelete = async (id: number) => {
    if (!window.confirm("¿Seguro que deseas eliminar este comunicado?")) return;

    try {
      const response = await fetch(`${endpoints.notas}/${id}`, { method: 'DELETE' });
      if (response.ok) {
        toast.success("Comunicado eliminado");
        fetchNotes(); // Recargar la lista visual
      } else {
        toast.error("Error al eliminar");
      }
    } catch (error) {
      toast.error("Error de conexión");
    }
  };

  if (loading) {
    return <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-blue-900" /></div>;
  }

  if (notes.length === 0) {
    return (
        <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No hay comunicados para mostrar en esta área.</p>
        </div>
    );
  }

  return (
      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-300">
        {notes.map((note) => (
            <Card key={note.id} className="border-l-4 border-l-blue-600 shadow-sm hover:shadow-md transition-all rounded-xl">
              <CardHeader className="py-3 px-4 bg-slate-50/50 flex flex-row justify-between items-start border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Badge variant="outline" className={`text-[9px] font-black uppercase tracking-wider ${note.destino === 'todos' ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                      {note.destino === 'todos' ? 'GLOBAL' : note.destino}
                    </Badge>
                    <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                      {format(new Date(note.fecha_creacion), "dd MMM yyyy, HH:mm", { locale: es })}
                </span>
                  </div>
                  <CardTitle className="text-blue-950 text-sm font-black uppercase tracking-wide">{note.titulo}</CardTitle>
                </div>

                {/* AQUÍ USAMOS 'readOnly': Si no es readOnly, mostramos el basurero */}
                {!readOnly && (
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(note.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50 h-8 w-8 p-0 rounded-full">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                )}
              </CardHeader>
              <CardContent className="px-4 py-3">
                <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">{note.contenido}</p>
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  <User className="w-3 h-3" /> Emitido por: <span className="text-slate-600">{note.creado_por_nombre}</span>
                </div>
              </CardContent>
            </Card>
        ))}
      </div>
  );
}