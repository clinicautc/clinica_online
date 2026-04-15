/**
 * ============================================================================
 * ARCHIVO: NotesViewer.tsx (Versión Master Inteligente - Hilos de Color Invertidos)
 * PROPÓSITO: Visor interactivo con colores de área corregidos (Nutri: Naranja).
 * UBICACIÓN: src/components/NotesViewer.tsx
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { 
  MessageSquare, Calendar, User, Loader2, Target, 
  Inbox, SendHorizontal, CheckCircle2, Send, Clock, AlertCircle,
  ChevronDown, ChevronUp, MessageCircle, ShieldAlert
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

// Interfaz sincronizada con la base de datos PostgreSQL de la Clínica UTC
interface Note {
  id: number;
  titulo: string;
  contenido: string;
  destino: 'fisioterapia' | 'nutricion' | 'general' | 'todos';
  creado_por_nombre: string;
  creado_por_email: string;
  destinatario_especifico: string | null;
  fecha_creacion: string;
  respuesta: string | null;
  fecha_respuesta: string | null;
}

interface NotesViewerProps {
  readOnly?: boolean;
  filterCategory?: 'fisioterapia' | 'nutricion' | 'general';
}

export default function NotesViewer({ readOnly = false, filterCategory }: NotesViewerProps) {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // CONTROL DE VISTA: Pestañas segmentadas por rol
  const [tabView, setTabView] = useState<'recibidos' | 'enviados'>('recibidos');
  
  // ESTADOS DEL HILO DE CONVERSACIÓN
  const [activeReplyId, setActiveReplyId] = useState<number | null>(null);
  const [showFullViewId, setShowFullViewId] = useState<number | null>(null);
  const [replyTexts, setReplyTexts] = useState<{ [key: number]: string }>({});
  const [isSendingReply, setIsSendingReply] = useState<number | null>(null);

  // --- ESTADO PARA MEMORIA DE LECTURA (PERSISTENCIA) ---
  const [readMessages, setReadMessages] = useState<{[key: number]: number}>(() => {
    const saved = localStorage.getItem(`utc_read_notes_${user?.id}`);
    return saved ? JSON.parse(saved) : {};
  });

  const arialStyle = { fontFamily: 'Arial, sans-serif' };
  const esPracticante = user?.rol === 'practicante';

  /**
   * FUNCIÓN: fetchNotes
   * Recupera todos los comunicados desde el servidor Node.js
   */
  const fetchNotes = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:3001/api/notas');
      if (response.ok) {
        const data = await response.json();
        setNotes(data);
      }
    } catch (error) {
      console.error("Error en sincronización de notas:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
    const interval = setInterval(fetchNotes, 45000); 
    return () => clearInterval(interval);
  }, [user]);

  /**
   * FUNCIÓN: markAsRead
   * Guarda en localStorage que el usuario ya vio todos los mensajes actuales de una nota
   */
  const markAsRead = (noteId: number, count: number) => {
    const newReadStatus = { ...readMessages, [noteId]: count };
    setReadMessages(newReadStatus);
    localStorage.setItem(`utc_read_notes_${user?.id}`, JSON.stringify(newReadStatus));
  };

  /**
   * FUNCIÓN: handleSendReply
   * LÓGICA DE MURO SOCIAL: Concatena comentarios con un separador <BR>
   */
  const handleSendReply = async (noteId: number) => {
    const text = replyTexts[noteId];
    if (!text || text.trim().length < 2) {
      toast.error("El comentario es demasiado breve.");
      return;
    }

    try {
      setIsSendingReply(noteId);
      const notaActual = notes.find(n => n.id === noteId);
      const nombreUsuario = user?.nombre || 'Usuario UTC';
      
      // Mantenemos el Area en el guardado para que el sistema la detecte, pero la limpiaremos al mostrar
      const nuevoComentario = `[${nombreUsuario} | Area: ${user?.area}]: ${text.trim()} (${format(new Date(), "d MMM, HH:mm")})`;
      
      const historialCompleto = notaActual?.respuesta 
        ? `${notaActual.respuesta} <BR> ${nuevoComentario}` 
        : nuevoComentario;

      const response = await fetch(`http://localhost:3001/api/notas/${noteId}/responder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ respuesta: historialCompleto })
      });

      if (response.ok) {
        toast.success("Comentario publicado exitosamente.");
        setReplyTexts(prev => ({ ...prev, [noteId]: '' }));
        setActiveReplyId(null);
        // Marcamos como leído el nuevo total al responder
        const newCount = historialCompleto.split('<BR>').length;
        markAsRead(noteId, newCount);
        fetchNotes(); 
      }
    } catch (error) {
      toast.error("Error de red al publicar respuesta.");
    } finally {
      setIsSendingReply(null);
    }
  };

  /**
   * LÓGICA DE FILTRADO Y PRIVACIDAD (PROTECCIÓN CONTRA NULOS)
   */
  const miEmail = (user?.email || '').toLowerCase();
  const miArea = (user?.area || '').toLowerCase();

  const filteredNotes = notes.filter(note => {
    const autorEmail = (note.creado_por_email || '').toLowerCase();

    if (tabView === 'enviados') {
      return autorEmail === miEmail;
    } else {
      const esPropia = autorEmail === miEmail;
      const esParaMi = (note.destinatario_especifico || '').toLowerCase() === miEmail;
      const esParaMiArea = (note.destino || '').toLowerCase() === miArea || note.destino === 'todos' || note.destino === 'general';
      return !esPropia && (esParaMi || esParaMiArea);
    }
  });

  const getCategoryBadge = (category: string) => {
    const baseClass = "font-black uppercase text-[9px] px-2 py-0.5 rounded-full border border-black shadow-sm";
    switch (category) {
      case 'nutricion': return <Badge className={`${baseClass} bg-orange-50 text-orange-600`}>Nutrición</Badge>;
      case 'fisioterapia': return <Badge className={`${baseClass} bg-blue-50 text-blue-700`}>Fisioterapia</Badge>;
      default: return <Badge className={`${baseClass} bg-slate-100 text-slate-600`}>General</Badge>;
    }
  };

  return (
    <Card className="border-none shadow-2xl rounded-[2rem] bg-white overflow-hidden" style={arialStyle}>
      <CardHeader className="bg-slate-50/50 border-b p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <CardTitle className="text-blue-950 text-2xl font-black flex items-center gap-3" style={arialStyle}>
              <MessageSquare className="w-8 h-8 text-blue-600" />
              CENTRO DE COMUNICADOS
            </CardTitle>
            <CardDescription className="font-bold text-slate-400 italic">Gestión de avisos institucionales - Clínica UTC.</CardDescription>
          </div>

          <div className="flex bg-white p-1.5 rounded-2xl shadow-inner border border-slate-200">
            <Button 
              size="sm" 
              variant={tabView === 'recibidos' ? 'default' : 'ghost'}
              onClick={() => setTabView('recibidos')}
              className={`rounded-xl h-10 px-6 font-black transition-all relative ${tabView === 'recibidos' ? 'bg-blue-900 text-white shadow-lg' : 'text-slate-500'}`}
            >
              <Inbox className="w-4 h-4 mr-2" /> RECIBIDOS
              {/* PUNTO ROJO NOTIFICACIÓN GLOBAL: Solo si hay notas con más mensajes de los registrados y showFullViewId no es esa nota */}
              {notes.some(n => {
                const count = n.id !== showFullViewId && n.respuesta ? n.respuesta.split('<BR>').length : 0;
                return (n.creado_por_email || '').toLowerCase() !== miEmail && count > (readMessages[n.id] || 0);
              }) && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full border-2 border-white animate-pulse" />
              )}
            </Button>
            
            {!esPracticante && (
              <Button 
                size="sm" 
                variant={tabView === 'enviados' ? 'default' : 'ghost'}
                onClick={() => setTabView('enviados')}
                className={`rounded-xl h-10 px-6 font-black transition-all ${tabView === 'enviados' ? 'bg-blue-900 text-white shadow-lg' : 'text-slate-500'}`}
              >
                <SendHorizontal className="w-4 h-4 mr-2" /> MIS PUBLICACIONES
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-8">
        {isLoading ? (
          <div className="flex flex-col items-center py-20 gap-4"><Loader2 className="w-12 h-12 animate-spin text-blue-900 opacity-20" /></div>
        ) : filteredNotes.length === 0 ? (
          <div className="text-center py-24 border-4 border-dashed rounded-[3rem] border-slate-50 bg-slate-50/30"><p className="text-slate-400 font-bold italic text-sm">No hay mensajes disponibles.</p></div>
        ) : (
          <div className="grid grid-cols-1 gap-8">
            {filteredNotes.map((note) => {
              const nombreAutor = note.creado_por_nombre || 'Usuario UTC';
              const esMensajeMaster = nombreAutor.toLowerCase().includes('master');
              const numRespuestas = note.respuesta ? note.respuesta.split('<BR>').length : 0;
              const tieneMensajesNuevos = numRespuestas > (readMessages[note.id] || 0);
              
              const ultimaRespNutri = (note.respuesta || '').toLowerCase().includes('area: nutricion');
              const ultimaRespFisic = (note.respuesta || '').toLowerCase().includes('area: fisioterapia');
              
              // Bordes dinámicos de la Card principal
              let areaBorderColor = esMensajeMaster ? 'border-l-amber-500' : 'border-l-blue-900';
              if (tabView === 'recibidos' && note.respuesta) {
                if (ultimaRespNutri) areaBorderColor = 'border-l-orange-500';
                if (ultimaRespFisic) areaBorderColor = 'border-l-blue-500';
              }

              return (
                <Card key={note.id} className={`border-none shadow-xl rounded-[1.5rem] overflow-hidden border-l-[10px] transition-all relative ${areaBorderColor} ${esMensajeMaster ? 'bg-amber-50/40' : 'bg-white'}`}>
                  
                  {numRespuestas > 0 && tieneMensajesNuevos && showFullViewId !== note.id && (
                    <div className="absolute top-4 right-4 flex items-center gap-1 bg-red-600 text-white px-2 py-1 rounded-full shadow-lg z-10 animate-bounce">
                      <span className="text-[10px] font-black">{numRespuestas}</span>
                      <MessageSquare size={10} fill="white" />
                    </div>
                  )}

                  <CardContent className="p-0">
                    <div className={`p-8 border-2 m-4 rounded-[1.2rem] shadow-sm relative ${esMensajeMaster ? 'border-amber-400 bg-amber-50/30' : 'border-black bg-white'}`}>
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-xs uppercase shadow-md border-2 ${esMensajeMaster ? 'bg-amber-600 border-amber-700' : 'bg-blue-900 border-black'}`}>
                            {esMensajeMaster ? <ShieldAlert size={16} /> : nombreAutor.substring(0,2).toUpperCase()}
                          </div>
                          <div>
                            <p className={`text-sm font-black leading-none uppercase ${esMensajeMaster ? 'text-amber-900' : 'text-blue-950'}`}>
                              {nombreAutor} {esMensajeMaster && "(Autoridad Master)"}
                            </p>
                            <p className="text-[10px] text-slate-400 font-bold mt-1">
                              {note.fecha_creacion ? format(parseISO(note.fecha_creacion), "d MMM, HH:mm 'hrs'", { locale: es }) : 'Fecha pendiente'}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {note.destinatario_especifico && <Badge className="bg-purple-50 text-purple-600 border-black border text-[8px] font-black uppercase">PRIVADO</Badge>}
                          {getCategoryBadge(note.destino || 'general')}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className={`text-xl font-black uppercase tracking-tight ${esMensajeMaster ? 'text-amber-950' : 'text-slate-900'}`}>{note.titulo}</h4>
                        <p className={`text-base leading-relaxed whitespace-pre-wrap font-medium ${esMensajeMaster ? 'text-amber-900/80' : 'text-slate-700'}`}>{note.contenido}</p>
                        
                        {note.respuesta && (
                          <button 
                            onClick={() => {
                              if (showFullViewId === note.id) setShowFullViewId(null);
                              else {
                                setShowFullViewId(note.id);
                                markAsRead(note.id, numRespuestas);
                              }
                            }}
                            className={`mt-4 font-black text-xs flex items-center gap-2 underline decoration-2 underline-offset-4 transition-colors ${esMensajeMaster ? 'text-amber-700 hover:text-amber-950' : 'text-blue-700 hover:text-black'}`}
                          >
                            <MessageCircle size={16}/>
                            {showFullViewId === note.id ? "OCULTAR COMENTARIOS" : `VISTA COMPLETA (${numRespuestas})`}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* SECCIÓN DE HILO DE COMENTARIOS (COLORES INVERTIDOS) */}
                    {showFullViewId === note.id && note.respuesta && (
                      <div className="px-12 pb-6 space-y-4 animate-in slide-in-from-top-2 duration-300">
                        {note.respuesta.split('<BR>').map((comentario, index) => {
                          // LÓGICA DE DETECCIÓN: Nutrición -> Naranja | Fisioterapia -> Azul
                          const esNutriComment = comentario.toLowerCase().includes('area: nutricion');
                          const esFisicComment = comentario.toLowerCase().includes('area: fisioterapia');
                          
                          const textoLimpio = comentario.replace(/\| Area: (nutricion|fisioterapia)/gi, '').trim();

                          let chatBg = 'bg-slate-50';
                          let chatBorder = 'border-black';
                          
                          // Inversión aplicada: Nutrición es naranja, Fisioterapia es azul
                          if (esNutriComment) { chatBg = 'bg-orange-50'; chatBorder = 'border-orange-500'; }
                          if (esFisicComment) { chatBg = 'bg-blue-50'; chatBorder = 'border-blue-500'; }

                          return (
                            <div key={index} className="flex gap-4 items-start">
                              <div className={`w-8 h-8 rounded-full border-2 ${chatBorder} flex items-center justify-center text-[10px] font-black uppercase`}>
                                {textoLimpio.charAt(1)}
                              </div>
                              <div className={`flex-1 p-4 rounded-[1.2rem] border-2 shadow-sm ${chatBorder} ${chatBg}`}>
                                <p className="text-sm text-slate-800 font-bold leading-relaxed">{textoLimpio}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className={`border-t p-4 ${esMensajeMaster ? 'bg-amber-100/20 border-amber-100' : 'bg-slate-50/20 border-slate-100'}`}>
                      {activeReplyId === note.id ? (
                        <div className="p-2 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                          <Textarea 
                            placeholder="Escribe un comentario..."
                            className={`rounded-xl border-2 bg-white text-sm min-h-[100px] resize-none shadow-xl font-medium ${esMensajeMaster ? 'border-amber-400 focus-visible:ring-amber-500' : 'border-black focus-visible:ring-blue-900'}`}
                            value={replyTexts[note.id] || ''}
                            onChange={(e) => setReplyTexts({ ...replyTexts, [note.id]: e.target.value })}
                          />
                          <div className="flex justify-end gap-3">
                            <Button size="sm" variant="ghost" className="text-xs font-black text-slate-400 uppercase" onClick={() => setActiveReplyId(null)}>Descartar</Button>
                            <Button 
                              size="sm" 
                              className={`rounded-xl px-10 h-10 font-black shadow-2xl transition-all transform active:scale-95 ${esMensajeMaster ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-blue-950 hover:bg-black text-white'}`}
                              onClick={() => handleSendReply(note.id)}
                              disabled={isSendingReply === note.id}
                            >
                              {isSendingReply === note.id ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : "PUBLICAR"}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        tabView === 'recibidos' && (
                          <button 
                            onClick={() => {
                              setActiveReplyId(note.id);
                              setShowFullViewId(note.id);
                              markAsRead(note.id, numRespuestas);
                            }}
                            className={`flex items-center gap-3 w-full p-4 hover:bg-white hover:shadow-md rounded-xl transition-all group border border-transparent ${esMensajeMaster ? 'hover:border-amber-300' : 'hover:border-black'}`}
                          >
                            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-[10px] font-black uppercase ${esMensajeMaster ? 'bg-amber-100 border-amber-400 text-amber-600' : 'bg-slate-200 border-black text-slate-500'}`}>
                              {user?.nombre?.substring(0,2).toUpperCase() || "U"}
                            </div>
                            <span className={`text-sm font-black uppercase tracking-widest ${esMensajeMaster ? 'text-amber-600 group-hover:text-amber-800' : 'text-slate-400 group-hover:text-blue-900'}`}>Añadir un comentario...</span>
                          </button>
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>

      <div className="p-8 bg-slate-50 border-t text-center">
        <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.6em]">UTC Security Communications Hub • v3.0 • Academic Intelligence</p>
      </div>
    </Card>
  );
}