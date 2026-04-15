import React, { useState, useEffect } from 'react';
// UI: Componentes visuales de Shadcn para el visor
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
// DATA: Tipado y datos de respaldo
import { mockNotes, Note } from '../lib/mockData';
// ICONOS: Representación visual para el usuario
import { MessageSquare, Calendar, User } from 'lucide-react';
// FECHAS: Formateo profesional en español
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface NotesViewerProps {
  readOnly?: boolean;
}

export default function NotesViewer({ readOnly = false }: NotesViewerProps) {
  const [notes, setNotes] = useState<Note[]>([]);

  // CARGA: Al abrir el visor, recuperamos las notas del LocalStorage o las de prueba
  useEffect(() => {
    const stored = localStorage.getItem('utc_notes');
    const allNotes = stored ? JSON.parse(stored) : mockNotes;
    
    setNotes(allNotes.sort((a: Note, b: Note) => {
      return new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime();
    }));
  }, []);

  // Badge de categoría para identificar rápido el área
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
    <Card className="border-blue-900/10">
      <CardHeader>
        <CardTitle className="text-blue-900">Notas de la Universidad</CardTitle>
        <CardDescription>
          Recomendaciones y avisos importantes de la UTC
        </CardDescription>
      </CardHeader>
      <CardContent>
        {notes.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 mx-auto text-blue-900/30 mb-3" />
            <p className="text-blue-900/60">No hay notas publicadas</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <div
                key={note.id}
                className="border border-blue-900/10 rounded-lg p-4 bg-white hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-blue-900">{note.title}</h3>
                  {getCategoryBadge(note.category)}
                </div>
                <div className="flex items-center gap-4 text-sm text-blue-900/60 mb-3">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {note.createdBy}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {format(parseISO(note.createdDate), "d 'de' MMMM, yyyy", { locale: es })}
                  </span>
                </div>
                <p className="text-sm text-blue-900/70">{note.content}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * ==============================================================================
 * DOCUMENTACIÓN DE ETIQUETAS Y COMPONENTES (GUÍA TÉCNICA UTC)
 * ==============================================================================
 * * 1. <Card />, <CardHeader />, <CardTitle />, <CardContent />: Estructura de 
 * Shadcn UI que organiza el visor en una tarjeta limpia y moderna.
 * * 2. <Badge />: Etiqueta pequeña de color que indica visualmente si la nota 
 * pertenece a Fisioterapia, Nutrición o es General.
 * * 3. <div>: Contenedor genérico de HTML. Aquí se usa mucho con "flex" y "gap" 
 * para alinear iconos y textos perfectamente.
 * * 4. <h3>: Etiqueta de encabezado de nivel 3. Se usa para resaltar el título 
 * de la nota con una fuente más gruesa (font-semibold).
 * * 5. <p>: Etiqueta de párrafo estándar. Se usa para mostrar el cuerpo del 
 * mensaje de la nota de forma legible.
 * * 6. <span />: Etiqueta de texto en línea. Ideal para agrupar iconos con sus 
 * textos (como el nombre del docente y la fecha) sin que salten de línea.
 * * 7. <MessageSquare />, <Calendar />, <User />: Etiquetas de iconos (Lucide-React) 
 * que ayudan a que el usuario identifique la información por símbolos.
 * * 8. {notes.map((note) => (...))}: No es una etiqueta, pero es la función de JS 
 * que recorre la lista de notas y genera una "tarjeta" por cada una automáticamente.
 * ==============================================================================
 */