/**
 * ============================================================================
 * ARCHIVO: NotesViewer.tsx
 * PROPÓSITO: Visor de comunicados segmentado con notificaciones inteligentes.
 * MODIFICACIÓN: Restauración de burbujas rojas dinámicas por pestaña y mensaje.
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
  ChevronDown, ChevronUp, MessageCircle, ShieldAlert, Users, Shield
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { notasAPI } from '../lib/api';

// Interfaz sincronizada con la base de datos PostgreSQL de la Clínica UTC
interface Note {
  id: number;
  titulo: string;
  contenido: string;
  categoria: 'fisioterapia' | 'nutricion' | 'general' | 'todos';
  creado_por_nombre: string;
  creado_por_email: string;
  creado_por_rol?: string; // <--- AÑADIR ESTA LÍNEA
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
  
  /**
   * ESTADO DE PESTAÑAS SEGMENTADAS
   * Para Admins de área: Alumnos (avisos practicantes) vs Administrativo (Avisos Master)
   * Para Practicantes: Se mantiene la vista estándar de Recibidos.
   */
  const [tabView, setTabView] = useState<'alumnos' | 'administrativo' | 'enviados'>('alumnos');
  
  const [activeReplyId, setActiveReplyId] = useState<number | null>(null);
  const [showFullViewId, setShowFullViewId] = useState<number | null>(null);
  const [replyTexts, setReplyTexts] = useState<{ [key: number]: string }>({});
  const [isSendingReply, setIsSendingReply] = useState<number | null>(null);

  /**
   * LÓGICA DE PERSISTENCIA DE LECTURA
   * Guarda cuántas respuestas ha visto el usuario de cada nota en localStorage.
   */
  const [readMessages, setReadMessages] = useState<{[key: number]: number}>(() => {
    const saved = localStorage.getItem(`utc_read_notes_${user?.id}`);
    return saved ? JSON.parse(saved) : {};
  });

  const arialStyle = { fontFamily: 'Arial, sans-serif' };
  const esAdminDeArea = user?.rol === 'admin';

  const fetchNotes = async () => {
  try {
    setIsLoading(true);
    const data = await notasAPI.getUniversitarias();
    setNotes(data);
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
   * FUNCIÓN PARA MARCAR COMO LEÍDO
   * Actualiza el contador de mensajes vistos para eliminar las burbujas rojas.
   */
  const markAsRead = (noteId: number, count: number) => {
    const newReadStatus = { ...readMessages, [noteId]: count };
    setReadMessages(newReadStatus);
    localStorage.setItem(`utc_read_notes_${user?.id}`, JSON.stringify(newReadStatus));
  };

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
      const nuevoComentario = `[${nombreUsuario} | Area: ${user?.area}]: ${text.trim()} (${format(new Date(), "d MMM, HH:mm")})`;
      
      const historialCompleto = notaActual?.respuesta 
        ? `${notaActual.respuesta} <BR> ${nuevoComentario}` 
        : nuevoComentario;

      await notasAPI.responderUniversitaria(noteId, historialCompleto);

      toast.success("Comentario publicado exitosamente.");
      setReplyTexts(prev => ({ ...prev, [noteId]: '' }));
      setActiveReplyId(null);
      fetchNotes();
    } catch (error) {
      toast.error("Error al publicar respuesta.");
    } finally {
      setIsSendingReply(null);
    }
  };

  const miEmail = (user?.email || '').toLowerCase();
  const miArea = (user?.area || '').toLowerCase();

  


  /**
   * LÓGICA DE CONTEO PARA BURBUJAS DE PESTAÑA
   * Verifica si existen mensajes con respuestas nuevas en la categoría seleccionada.
   */
 const hasUnreadInTab = (type: 'alumnos' | 'administrativo') => {
    return notes.some(note => {
      // CAMBIO AQUÍ: Evaluamos el rol directo de la base de datos
      const fromMaster = note.creado_por_rol === 'master'; 
      const matchTab = type === 'alumnos' ? !fromMaster : fromMaster;
      
      if (!matchTab) return false;

      const destino = (note.categoria || '').toLowerCase();
      const esParaMi = (note.destinatario_especifico || '').toLowerCase() === miEmail;
      
      if (!(destino === miArea || destino === 'todos' || destino === 'general' || esParaMi)) return false;

      const numRespuestas = note.respuesta ? note.respuesta.split('<BR>').length : 0;
      const leidas = readMessages[note.id] || 0;
      return numRespuestas > leidas;
    });
  };

  const filteredNotes = notes.filter(note => {
    // CAMBIO AQUÍ: Evaluamos el rol
    const fromMaster = note.creado_por_rol === 'master'; 
    const destinoNota = (note.categoria || '').toLowerCase();
    // ... resto de la función sigue igual
    const esParaMi = (note.destinatario_especifico || '').toLowerCase() === miEmail;

    if (filterCategory && destinoNota !== filterCategory && destinoNota !== 'todos' && destinoNota !== 'general') {
      return false;
    }

    if (esAdminDeArea) { // Lógica para ADMINS
      if (tabView === 'alumnos') {
        return !fromMaster && (destinoNota === miArea || destinoNota === 'todos' || destinoNota === 'general' || esParaMi);
      } else {
        return fromMaster;
      }
    } else if (user?.rol === 'practicante') { // Lógica estricta SOLO para PRACTICANTES
      // Bloqueamos los mensajes del Master, pase lo que pase
      if (fromMaster) return false; 
      
      // Solo ven mensajes de su área, todos, general o privados
      return (destinoNota === miArea || destinoNota === 'todos' || destinoNota === 'general' || esParaMi);
    } else { // Lógica para el MASTER u otros roles
      return (destinoNota === miArea || destinoNota === 'todos' || destinoNota === 'general' || esParaMi);
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
            <CardTitle className="text-blue-950 text-2xl font-black flex items-center gap-3">
              <MessageSquare className="w-8 h-8 text-blue-600" />
              CENTRO DE COMUNICADOS
            </CardTitle>
            <CardDescription className="font-bold text-slate-400 italic">Gestión de avisos institucionales - Clínica UTC.</CardDescription>
          </div>

          <div className="flex bg-white p-1.5 rounded-2xl shadow-inner border border-slate-200">
            {esAdminDeArea ? (
              <>
                <Button 
                  size="sm" 
                  variant={tabView === 'alumnos' ? 'default' : 'ghost'}
                  onClick={() => setTabView('alumnos')}
                  className={`relative rounded-xl h-10 px-6 font-black transition-all ${tabView === 'alumnos' ? 'bg-blue-900 text-white shadow-lg' : 'text-slate-500'}`}
                >
                  <Users className="w-4 h-4 mr-2" /> ALUMNOS
                  {hasUnreadInTab('alumnos') && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full border-2 border-white animate-pulse" />
                  )}
                </Button>
                <Button 
                  size="sm" 
                  variant={tabView === 'administrativo' ? 'default' : 'ghost'}
                  onClick={() => setTabView('administrativo')}
                  className={`relative rounded-xl h-10 px-6 font-black transition-all ${tabView === 'administrativo' ? 'bg-blue-900 text-white shadow-lg' : 'text-slate-500'}`}
                >
                  <Shield className="w-4 h-4 mr-2" /> ADMINISTRATIVO
                  {hasUnreadInTab('administrativo') && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full border-2 border-white animate-pulse" />
                  )}
                </Button>
              </>
            ) : (
              <Button 
                size="sm" 
                variant="default"
                className="rounded-xl h-10 px-6 font-black bg-blue-900 text-white shadow-lg"
              >
                <Inbox className="w-4 h-4 mr-2" /> RECIBIDOS
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-8">
        {isLoading ? (
          <div className="flex flex-col items-center py-20 gap-4"><Loader2 className="w-12 h-12 animate-spin text-blue-900 opacity-20" /></div>
        ) : filteredNotes.length === 0 ? (
          <div className="text-center py-24 border-4 border-dashed rounded-[3rem] border-slate-50 bg-slate-50/30">
            <p className="text-slate-400 font-bold italic text-sm">No hay mensajes en esta categoría.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8">
            {filteredNotes.map((note) => {
              const nombreAutor = note.creado_por_nombre || 'Usuario UTC';
              // CAMBIO AQUÍ: Evaluamos el rol
              const esMensajeMaster = note.creado_por_rol === 'master'; 
              const numRespuestas = note.respuesta ? note.respuesta.split('<BR>').length : 0;
              // ... resto del renderizado sigue igual
              const leido = (readMessages[note.id] || 0) >= numRespuestas;
              
              let areaBorderColor = esMensajeMaster ? 'border-l-amber-500' : 'border-l-blue-900';

              return (
                <Card key={note.id} className={`border-none shadow-xl rounded-[1.5rem] overflow-hidden border-l-[10px] transition-all relative ${areaBorderColor} bg-white`}>
                  <CardContent className="p-0">
                    <div className={`p-8 border-2 m-4 rounded-[1.2rem] shadow-sm relative border-black bg-white`}>
                      
                      {/* BURBUJA DE NOTIFICACIÓN INDIVIDUAL */}
                      {!leido && (
                        <div className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg z-10 border-2 border-white">
                          NUEVO
                        </div>
                      )}

                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-xs uppercase shadow-md border-2 ${esMensajeMaster ? 'bg-amber-600 border-amber-700' : 'bg-blue-900 border-black'}`}>
                            {esMensajeMaster ? <ShieldAlert size={16} /> : nombreAutor.substring(0,2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-black leading-none uppercase text-blue-950">
                              {nombreAutor} {esMensajeMaster && "(Autoridad Master)"}
                            </p>
                            <p className="text-[10px] text-slate-400 font-bold mt-1">
                              {note.fecha_creacion ? format(parseISO(note.fecha_creacion), "d MMM, HH:mm 'hrs'", { locale: es }) : 'Fecha pendiente'}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {note.destinatario_especifico && <Badge className="bg-purple-50 text-purple-600 border-black border text-[8px] font-black uppercase">PRIVADO</Badge>}
                          {getCategoryBadge(note.categoria || 'general')}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="text-xl font-black uppercase tracking-tight text-slate-900">{note.titulo}</h4>
                        <p className="text-base leading-relaxed whitespace-pre-wrap font-medium text-slate-700">{note.contenido}</p>
                        
                        {note.respuesta && (
                          <button 
                            onClick={() => {
                              if (showFullViewId === note.id) setShowFullViewId(null);
                              else {
                                setShowFullViewId(note.id);
                                markAsRead(note.id, numRespuestas); // Marca como leído al expandir
                              }
                            }}
                            className={`mt-4 font-black text-xs flex items-center gap-2 underline decoration-2 underline-offset-4 transition-colors ${esMensajeMaster ? 'text-amber-700 hover:text-black' : 'text-blue-700 hover:text-black'}`}
                          >
                            <MessageCircle size={16}/>
                            {showFullViewId === note.id ? "OCULTAR COMENTARIOS" : `VISTA COMPLETA (${numRespuestas})`}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* HILO DE COMENTARIOS RESPONSIVO */}
                    {showFullViewId === note.id && note.respuesta && (
                      <div className="px-12 pb-6 space-y-4 animate-in slide-in-from-top-2 duration-300">
                        {note.respuesta.split('<BR>').map((comentario, index) => {
                          const esNutriComment = comentario.toLowerCase().includes('area: nutricion');
                          const esFisicComment = comentario.toLowerCase().includes('area: fisioterapia');
                          const textoLimpio = comentario.replace(/\| Area: (nutricion|fisioterapia)/gi, '').trim();

                          let chatBg = 'bg-slate-50', chatBorder = 'border-black';
                          if (esNutriComment) { chatBg = 'bg-orange-50'; chatBorder = 'border-orange-500'; }
                          if (esFisicComment) { chatBg = 'bg-blue-50'; chatBorder = 'border-blue-500'; }

                          return (
                            <div key={index} className="flex gap-4 items-start">
                              <div className={`w-8 h-8 rounded-full border-2 ${chatBorder} flex items-center justify-center text-[10px] font-black uppercase`}>{textoLimpio.charAt(1)}</div>
                              <div className={`flex-1 p-4 rounded-[1.2rem] border-2 shadow-sm ${chatBorder} ${chatBg}`}>
                                <p className="text-sm text-slate-800 font-bold leading-relaxed">{textoLimpio}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {!readOnly && (
                      <div className={`border-t p-4 ${esMensajeMaster ? 'bg-slate-50/50 border-slate-100' : 'bg-slate-50/20 border-slate-100'}`}>
                        {activeReplyId === note.id ? (
                          <div className="p-2 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                            <Textarea 
                              placeholder="Escribe un comentario..."
                              className="rounded-xl border-2 bg-white text-sm min-h-[100px] resize-none shadow-xl font-medium border-black focus-visible:ring-blue-900"
                              value={replyTexts[note.id] || ''}
                              onChange={(e) => setReplyTexts({ ...replyTexts, [note.id]: e.target.value })}
                            />
                            <div className="flex justify-end gap-3">
                              <Button size="sm" variant="ghost" className="text-xs font-black text-slate-400 uppercase" onClick={() => setActiveReplyId(null)}>Descartar</Button>
                              <Button 
                                size="sm" 
                                className="rounded-xl px-10 h-10 font-black shadow-2xl transition-all transform active:scale-95 bg-blue-950 hover:bg-black text-white"
                                onClick={() => handleSendReply(note.id)}
                                disabled={isSendingReply === note.id}
                              >
                                {isSendingReply === note.id ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : "PUBLICAR"}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <button 
                            onClick={() => {
                              setActiveReplyId(note.id);
                              setShowFullViewId(note.id);
                              markAsRead(note.id, numRespuestas); // Marca como leído al intentar comentar
                            }}
                            className="flex items-center gap-3 w-full p-4 hover:bg-white hover:shadow-md rounded-xl transition-all group border border-transparent hover:border-black"
                          >
                            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-[10px] font-black uppercase bg-slate-200 border-black text-slate-500`}>
                              {user?.nombre?.substring(0,2).toUpperCase() || "U"}
                            </div>
                            <span className="text-sm font-black uppercase tracking-widest text-slate-400 group-hover:text-blue-900">Añadir un comentario...</span>
                          </button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>

      <div className="p-8 bg-slate-50 border-t text-center">
        <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.6em]">UTC Security Communications Hub • v4.0 • Intelligent Notifications</p>
      </div>
    </Card>
  );
}