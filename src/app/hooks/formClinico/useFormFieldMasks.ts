import type { Dispatch, SetStateAction } from 'react';

type FormDataState = Record<string, string | boolean>;

/**
 * Máscaras de entrada compartidas entre los 3 formularios clínicos —
 * extraídas literal de HojaEvolutiva.tsx (comportamiento sin cambios).
 */
export function useFormFieldMasks(setFormData: Dispatch<SetStateAction<FormDataState>>) {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const target = e.target;
    const { name, value, type } = target;
    const checked = (target as HTMLInputElement).checked;
    const finalValue = type === 'checkbox' ? checked : value;
    setFormData((prev) => ({ ...prev, [name]: finalValue }));
  };

  const handleDateInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^0-9/]/g, '');
    if (val.length === 8 && !val.includes('/')) {
      val = val.replace(/(\d{2})(\d{2})(\d{4})/, '$1/$2/$3');
    }
    e.target.value = val;
    handleInputChange(e);
  };

  const handleNumberInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.target.value = e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
    handleInputChange(e);
  };

  const handleDaysInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.target.value = e.target.value.replace(/[^1-7]/g, '');
    handleInputChange(e);
  };

  return { handleInputChange, handleDateInput, handleNumberInput, handleDaysInput };
}
