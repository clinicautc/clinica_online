import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom'; 
import { endpoints } from '../../lib/api';

import Page1 from './Page1';
import Page2 from './Page2';
import Page3 from './Page3';
import Page4 from './Page4';

const NutritionMasterForm: React.FC = () => {
  const { appointmentId } = useParams(); 
  const [step, setStep] = useState(1);
  const [isReadOnly, setIsReadOnly] = useState(false);
  
  const [formData, setFormData] = useState<any>({
    pagina_1: {}, pagina_2: {}, pagina_3: {}, pagina_4: {}
  });

  useEffect(() => {
    const cargarDatosGuardados = async () => {
      if (!appointmentId) return; 
      try {
        const response = await fetch(endpoints.historiales);
        if (response.ok) {
          const todos: any[] = await response.json();
          const encontrado = todos.find(h => 
            String(h.appointment_id) === String(appointmentId) && h.tipo === 'nutricion'
          );
          if (encontrado) {
            setFormData(encontrado.datos);
            setIsReadOnly(true);
          }
        }
      } catch (error) {
        console.error("Error al recuperar datos:", error);
      }
    };
    cargarDatosGuardados();
  }, [appointmentId]);

  const updateGlobalData = (page: string, data: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [page]: { ...prev[page], ...data }
    }));
  };

  return (
    <div className="bg-zinc-600 min-h-screen flex justify-center p-5 font-sans print:bg-white print:p-0 relative">
      {step === 1 && <Page1 accumulatedData={formData} onUpdate={updateGlobalData} onNext={() => setStep(2)} isReadOnly={isReadOnly} />}
      {step === 2 && <Page2 accumulatedData={formData} onUpdate={updateGlobalData} onBack={() => setStep(1)} onNext={() => setStep(3)} />}
      {step === 3 && <Page3 accumulatedData={formData} onUpdate={updateGlobalData} onBack={() => setStep(2)} onNext={() => setStep(4)} />}
      {step === 4 && <Page4 accumulatedData={formData} onBack={() => setStep(3)} appointmentId={appointmentId} />}
    </div>
  );
};

export default NutritionMasterForm;