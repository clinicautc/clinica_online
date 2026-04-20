import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { MessageSquare, Inbox, SendHorizontal, MessageCircle, ShieldAlert, Loader2} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { endpoints } from '../lib/api';
// import { Input } from './ui/input';

interface Comment {
  id: number;
  texto: string;
  creado_por_nombre: string | null;
  fecha_creacion: string;
}

interface Note {
  id: number;
  titulo: string;
  contenido: string;
  destino: 'fisioterapia' | 'nutricion' | 'general' | 'todos';
  creado_por_nombre: string | null;
  creado_por_email: string;
  destinatario_especifico: string | null;
  fecha_creacion: string;
  respuesta: string | null;
  fecha_respuesta: string | null;
  comentarios?: Comment[];
}

interface NotesViewerProps {
  readOnly?: boolean;
  filterCategory?: 'fisioterapia' | 'nutricion' | 'general';
}

export default function NotesViewer({ readOnly = false, filterCategory }: NotesViewerProps) {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tabView, setTabView] = useState<'recibidos' | 'enviados'>('recibidos');
  const [activeReplyId, setActiveReplyId] = useState<number | null>(null);
  const [showFullViewId, setShowFullViewId] = useState<number | null>(null);
  const [replyTexts, setReplyTexts] = useState<{ [key: number]: string }>({});
  const [isSendingReply, setIsSendingReply] = useState<number | null>(null);

  const [readMessages, setReadMessages] = useState<{[key: number]: number}>(() => {
    const saved = localStorage.getItem(`utc_read_notes_${user?.id}`);
    return saved ? JSON.parse(saved) : {};
  });

  const esPracticante = user?.rol === 'practicante';
  const isNutri = user?.area?.toLowerCase() === 'nutricion' || filterCategory === 'nutricion';
  const mainColor = isNutri ? 'orange' : 'blue';
  const textMain = isNutri ? 'text-orange-500' : 'text-blue-600';
  const bgMain = isNutri ? 'bg-orange-600' : 'bg-blue-900';

  const fetchNotes = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(endpoints.notas);
      if (response.ok) {
        let data: Note[] = await response.json();
        if (filterCategory) {
          data = data.filter(n => n.destino === filterCategory || n.destino === 'general' || n.destino === 'todos');
        }
        setNotes(data.sort((a, b) => new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime()));
      }
    } catch (error) {
      toast.error("Error al sincronizar comunicados");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
    const interval = setInterval(fetchNotes, 45000); 
    return () => clearInterval(interval);
  }, [user, filterCategory]);

  const markAsRead = (noteId: number, count: number) => {
    const newReadStatus = { ...readMessages, [noteId]: count };
    setReadMessages(newReadStatus);
    localStorage.setItem(`utc_read_notes_${user?.id}`, JSON.stringify(newReadStatus));
  };

  const handleSendReply = async (noteId: number) => {
    const text = replyTexts[noteId];
    if (!text || text.trim().length < 2) return toast.error("El comentario es muy breve.");

    try {
      setIsSendingReply(noteId);
      const notaActual = notes.find(n => n.id === noteId);
      const nombreUsuario = user?.nombre || 'Usuario UTC';
      const nuevoComentario = `[${nombreUsuario} | Area: ${user?.area}]: ${text.trim()} (${format(new Date(), "d MMM, HH:mm")})`;
      const historialCompleto = notaActual?.respuesta ? `${notaActual.respuesta} <BR> ${nuevoComentario}` : nuevoComentario;

      const response = await fetch(`${endpoints.notas}/${noteId}/responder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ respuesta: historialCompleto })
      });

      if (response.ok) {
        setReplyTexts(prev => ({ ...prev, [noteId]: '' }));
        setActiveReplyId(null);
        markAsRead(noteId, historialCompleto.split('<BR>').length);
        fetchNotes(); 
      }
    } catch (error) {
      toast.error("Error al publicar respuesta.");
    } finally {
      setIsSendingReply(null);
    }
  };

  // 🔥 ESCUDO ANTI-CRASHEOS: Validamos estrictamente que name exista antes de hacer split
  const getInitials = (name?: string | null) => {
    if (!name || typeof name !== 'string' || name.trim() === '') return "US"; // "Usuario Sistema" por defecto
    try {
      return name.trim().split(/\s+/).map(n => n[0]).join('').substring(0, 2).toUpperCase();
    } catch (e) {
      return "US"; // Si algo más falla, no rompemos la app
    }
  };

  const miEmail = (user?.email || '').toLowerCase();
  const miArea = (user?.area || '').toLowerCase();

  const filteredNotes = notes.filter(note => {
    const autorEmail = (note.creado_por_email || '').toLowerCase();
    if (tabView === 'enviados') return autorEmail === miEmail;
    
    const esPropia = autorEmail === miEmail;
    const esParaMi = (note.destinatario_especifico || '').toLowerCase() === miEmail;
    const esParaMiArea = (note.destino || '').toLowerCase() === miArea || note.destino === 'todos' || note.destino === 'general';
    return !esPropia && (esParaMi || esParaMiArea);
  });

  const getCategoryBadge = (category: string) => {
    const baseClass = "font-black uppercase text-[9px] px-3 py-1 rounded-full border shadow-sm";
    switch (category) {
      case 'nutricion': return <Badge className={`${baseClass} bg-orange-50 text-orange-600 border-orange-200`}>Nutrición</Badge>;
      case 'fisioterapia': return <Badge className={`${baseClass} bg-blue-50 text-blue-700 border-blue-200`}>Fisioterapia</Badge>;
      default: return <Badge className={`${baseClass} bg-slate-50 text-slate-600 border-slate-200`}>General</Badge>;
    }
  };

  return (
    <div className="font-sans w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100">
          <Button 
            size="sm" 
            variant={tabView === 'recibidos' ? 'default' : 'ghost'}
            onClick={() => setTabView('recibidos')}
            className={`rounded-xl h-10 px-6 font-black transition-all relative ${tabView === 'recibidos' ? `${bgMain} text-white shadow-md` : 'text-slate-400 hover:bg-slate-50'}`}
          >
            <Inbox className="w-4 h-4 mr-2" /> RECIBIDOS
            {notes.some(n => {
              const count = n.id !== showFullViewId && n.respuesta ? n.respuesta.split('<BR>').length : 0;
              return (n.creado_por_email || '').toLowerCase() !== miEmail && count > (readMessages[n.id] || 0);
            }) && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse" />}
          </Button>
          
          {!esPracticante && (
            <Button 
              size="sm" 
              variant={tabView === 'enviados' ? 'default' : 'ghost'}
              onClick={() => setTabView('enviados')}
              className={`rounded-xl h-10 px-6 font-black transition-all ${tabView === 'enviados' ? `${bgMain} text-white shadow-md` : 'text-slate-400 hover:bg-slate-50'}`}
            >
              <SendHorizontal className="w-4 h-4 mr-2" /> MIS PUBLICACIONES
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className={`w-10 h-10 animate-spin ${textMain}`} /></div>
      ) : filteredNotes.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-[2rem] border-slate-100 bg-slate-50/50">
          <p className="text-slate-400 font-bold italic">No hay comunicados en esta bandeja.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredNotes.map((note) => {
            const nombreAutor = note.creado_por_nombre || 'Coordinación UTC';
            const esMensajeMaster = nombreAutor.toLowerCase().includes('master');
            const numRespuestas = note.respuesta ? note.respuesta.split('<BR>').length : 0;
            const tieneMensajesNuevos = numRespuestas > (readMessages[note.id] || 0);
            
            let areaBorderColor = esMensajeMaster ? 'border-l-amber-500' : `border-l-${mainColor}-500`;

            return (
              <Card key={note.id} className={`border border-slate-100 shadow-sm rounded-[1.5rem] overflow-hidden border-l-[6px] transition-all relative ${areaBorderColor} ${esMensajeMaster ? 'bg-amber-50/20' : 'bg-white'}`}>
                {numRespuestas > 0 && tieneMensajesNuevos && showFullViewId !== note.id && (
                  <div className="absolute top-4 right-4 flex items-center gap-1 bg-red-500 text-white px-2 py-1 rounded-full shadow-md z-10 animate-bounce">
                    <span className="text-[10px] font-black">{numRespuestas}</span>
                    <MessageSquare size={10} fill="white" />
                  </div>
                )}

                <CardContent className="p-6 md:p-8">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-black text-sm shadow-inner ${esMensajeMaster ? 'bg-amber-600' : 'bg-slate-800'}`}>
                        {esMensajeMaster ? <ShieldAlert size={20} /> : getInitials(nombreAutor)}
                      </div>
                      <div>
                        <p className={`text-base font-black leading-none uppercase tracking-tight ${esMensajeMaster ? 'text-amber-900' : 'text-slate-900'}`}>
                          {nombreAutor} {esMensajeMaster && "(Master)"}
                        </p>
                        <p className="text-[11px] text-slate-400 font-bold mt-1.5 uppercase">
                          {note.fecha_creacion ? format(parseISO(note.fecha_creacion), "d MMM, HH:mm 'hrs'", { locale: es }) : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {note.destinatario_especifico && <Badge className="bg-purple-50 text-purple-600 border-purple-200 text-[9px] font-black uppercase px-3 py-1">Privado</Badge>}
                      {getCategoryBadge(note.destino || 'general')}
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <h4 className={`text-xl font-black uppercase tracking-tight ${esMensajeMaster ? 'text-amber-950' : 'text-slate-900'}`}>{note.titulo}</h4>
                    <p className="text-slate-600 leading-relaxed font-medium whitespace-pre-wrap">{note.contenido}</p>
                  </div>

                  {note.respuesta && (
                    <button 
                      onClick={() => {
                        if (showFullViewId === note.id) setShowFullViewId(null);
                        else {
                          setShowFullViewId(note.id);
                          markAsRead(note.id, numRespuestas);
                        }
                      }}
                      className={`font-black text-xs flex items-center gap-2 transition-colors uppercase ${esMensajeMaster ? 'text-amber-600 hover:text-amber-800' : 'text-blue-600 hover:text-blue-800'}`}
                    >
                      <MessageCircle size={16}/> {showFullViewId === note.id ? "Ocultar Comentarios" : `Ver Hilo Completo (${numRespuestas})`}
                    </button>
                  )}

                  {showFullViewId === note.id && note.respuesta && (
                    <div className="mt-6 pt-6 border-t border-slate-100 space-y-4">
                      {note.respuesta.split('<BR>').map((comentario, index) => {
                        const esNutriComment = comentario.toLowerCase().includes('area: nutricion');
                        const esFisicComment = comentario.toLowerCase().includes('area: fisioterapia');
                        const textoLimpio = comentario.replace(/\| Area: (nutricion|fisioterapia)/gi, '').trim();

                        let chatBg = 'bg-slate-50';
                        let chatBorder = 'border-slate-200';
                        let textColor = 'text-slate-700';

                        if (esNutriComment) { chatBg = 'bg-orange-50'; chatBorder = 'border-orange-200'; textColor = 'text-orange-900'; }
                        if (esFisicComment) { chatBg = 'bg-blue-50'; chatBorder = 'border-blue-200'; textColor = 'text-blue-900'; }

                        return (
                          <div key={index} className="flex gap-4 items-start">
                            <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-[10px] font-black uppercase bg-white shrink-0 ${chatBorder} ${textColor}`}>
                              {getInitials(textoLimpio.split(']:')[0].replace('[', ''))}
                            </div>
                            <div className={`flex-1 p-3.5 rounded-[1.2rem] border shadow-sm ${chatBorder} ${chatBg}`}>
                              <p className={`text-sm font-medium leading-relaxed ${textColor}`}>{textoLimpio}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className={`mt-6 ${showFullViewId === note.id ? '' : 'border-t border-slate-100 pt-6'}`}>
                    {activeReplyId === note.id ? (
                      <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                        <Textarea 
                          placeholder="Escribe tu respuesta aquí..."
                          className="rounded-2xl border-slate-200 bg-slate-50 min-h-[100px] resize-none focus-visible:ring-blue-500 font-medium text-sm"
                          value={replyTexts[note.id] || ''}
                          onChange={(e) => setReplyTexts({ ...replyTexts, [note.id]: e.target.value })}
                        />
                        <div className="flex justify-end gap-3">
                          <Button size="sm" variant="ghost" className="text-xs font-black text-slate-400 uppercase" onClick={() => setActiveReplyId(null)}>Cancelar</Button>
                          <Button size="sm" onClick={() => handleSendReply(note.id)} disabled={isSendingReply === note.id} className="rounded-xl px-8 h-10 font-black shadow-md bg-blue-900 hover:bg-blue-950 text-white">
                            {isSendingReply === note.id ? <Loader2 className="animate-spin w-4 h-4" /> : "Enviar"}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      tabView === 'recibidos' && !readOnly && (
                        <button 
                          onClick={() => { setActiveReplyId(note.id); setShowFullViewId(note.id); markAsRead(note.id, numRespuestas); }}
                          className="flex items-center gap-3 w-full p-3 hover:bg-slate-50 rounded-xl transition-all border border-transparent hover:border-slate-200"
                        >
                          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-black uppercase text-slate-400">
                            {getInitials(user?.nombre)}
                          </div>
                          <span className="text-sm font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600">Añadir comentario al hilo...</span>
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
    </div>
  );
}