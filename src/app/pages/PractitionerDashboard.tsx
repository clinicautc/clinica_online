import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { LogOut, Users, FileText, Calendar, Clock, Utensils, Activity, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { toast } from 'sonner';

import PatientList from '../components/PatientList';
import MedicalHistoryViewer from '../components/MedicalHistoryViewer';
import NotesViewer from '../components/NotesViewer';
import { endpoints } from '../lib/api';

interface Appointment {
    id: number;
    paciente_nombre: string;
    tipo: string;
    fecha: string;
    hora: string;
    estado: string;
    practicante_id?: number | null;
    paciente_id?: number;
}

export default function PractitionerDashboard() {
    const { user, logout, isLoading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
    const [isLoadingCitas, setIsLoadingCitas] = useState(true);

    // Variables dinámicas según el área
    const isNutricion = user?.area === 'nutricion';
    const themeColor = isNutricion ? 'orange' : 'blue';
    const AreaIcon = isNutricion ? Utensils : Activity;
    const areaName = isNutricion ? 'Nutrición' : 'Fisioterapia';

    useEffect(() => {
        const fetchTodayAppointments = async () => {
            try {
                setIsLoadingCitas(true);
                const todayStr = format(new Date(), 'yyyy-MM-dd');
                const response = await fetch(endpoints.citas);

                if (response.ok) {
                    const allAppointments: Appointment[] = await response.json();
                    const filtered = allAppointments.filter((apt) => {
                        const cleanAptDate = apt.fecha.split('T')[0];
                        return (
                            cleanAptDate === todayStr &&
                            apt.tipo === user?.area &&
                            (apt.estado === 'programada' || apt.estado === 'asignada') &&
                            String(apt.practicante_id) === String(user?.id)
                        );
                    });
                    setTodayAppointments(filtered);
                }
            } catch (error) {
                toast.error("Error al sincronizar la agenda");
            } finally {
                setIsLoadingCitas(false);
            }
        };

        if (user?.id) fetchTodayAppointments();
    }, [user]);

    const handleAccessForms = (appointment: any) => {
        const idReal = appointment.paciente_id || 5;
        navigate(`/forms/${user?.area}/${appointment.id}?pId=${idReal}`);
    };

    if (authLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className={`animate-spin text-${themeColor}-600 w-10 h-10`} /></div>;

    return (
        <div className={`min-h-screen bg-gradient-to-br from-${themeColor}-50 to-${themeColor}-100`}>
            <header className={`bg-white border-b border-${themeColor}-900/10 shadow-sm`}>
                <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 bg-gradient-to-br from-${themeColor}-600 to-${themeColor}-500 rounded-full flex items-center justify-center shadow-sm`}>
                            <AreaIcon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className={`text-xl font-bold text-${themeColor}-900`}>Clínica UTC - {areaName}</h1>
                            <p className={`text-sm text-${themeColor}-900/60 font-serif italic`}>Practicante: {user?.nombre}</p>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => { logout(); navigate('/login'); }} className={`border-${themeColor}-200 text-${themeColor}-900`}>
                        <LogOut className="w-4 h-4 mr-2" /> Cerrar Sesión
                    </Button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
                <Tabs defaultValue="today_appointments" className="space-y-6">
                    <TabsList className={`bg-white border border-${themeColor}-200 p-1 h-auto shadow-sm`}>
                        <TabsTrigger value="today_appointments" className={`data-[state=active]:bg-${themeColor}-600 data-[state=active]:text-white font-bold`}><Calendar className="w-4 h-4 mr-2" /> Citas Asignadas</TabsTrigger>
                        <TabsTrigger value="patients" className={`data-[state=active]:bg-${themeColor}-600 data-[state=active]:text-white font-bold`}><Users className="w-4 h-4 mr-2" /> Pacientes</TabsTrigger>
                        <TabsTrigger value="histories" className={`data-[state=active]:bg-${themeColor}-600 data-[state=active]:text-white font-bold`}><FileText className="w-4 h-4 mr-2" /> Historiales</TabsTrigger>
                        <TabsTrigger value="notes" className={`data-[state=active]:bg-${themeColor}-600 data-[state=active]:text-white font-bold`}><FileText className="w-4 h-4 mr-2" /> Notas del Docente</TabsTrigger>
                    </TabsList>

                    <TabsContent value="today_appointments">
                        <Card className="shadow-md">
                            <CardHeader><CardTitle className={`text-${themeColor}-900 flex items-center gap-2`}><Clock className={`w-5 h-5 text-${themeColor}-600`} /> Agenda - Hoy ({format(new Date(), 'dd/MM/yyyy')})</CardTitle></CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {isLoadingCitas ? (
                                        <div className="flex flex-col items-center py-12"><Loader2 className={`w-10 h-10 animate-spin text-${themeColor}-600`} /></div>
                                    ) : todayAppointments.length === 0 ? (
                                        <div className="text-center py-12 border-2 border-dashed bg-white"><p className="text-gray-500 italic">No tienes citas asignadas para hoy.</p></div>
                                    ) : (
                                        todayAppointments.map((apt) => (
                                            <div key={apt.id} className={`flex justify-between items-center p-4 border rounded-lg bg-white shadow-sm border-l-4 border-l-${themeColor}-600`}>
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-3 rounded-full bg-${themeColor}-50`}><AreaIcon className={`w-5 h-5 text-${themeColor}-600`}/></div>
                                                    <div>
                                                        <p className={`font-bold text-${themeColor}-900 text-lg`}>{apt.paciente_nombre}</p>
                                                        <p className="text-sm text-gray-500 flex items-center gap-1"><Clock className="w-3 h-3"/> {apt.hora.substring(0,5)} hrs</p>
                                                    </div>
                                                </div>
                                                <Button className={`bg-${themeColor}-600 hover:bg-${themeColor}-700 text-white`} onClick={() => handleAccessForms(apt)}>
                                                    <FileText className="w-4 h-4 mr-2" /> Iniciar Evaluación
                                                </Button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="patients"><PatientList /></TabsContent>
                    <TabsContent value="histories"><MedicalHistoryViewer filterType={user?.area || undefined} /></TabsContent>
                    <TabsContent value="notes"><NotesViewer readOnly filterCategory={user?.area || undefined} /></TabsContent>
                </Tabs>
            </main>
        </div>
    );
}