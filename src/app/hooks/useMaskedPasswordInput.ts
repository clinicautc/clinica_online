import { useCallback, useRef, useState } from 'react';

const MASK_CHAR = '•';

// Enmascara un <input type="text"> como si fuera type="password" (puntos),
// sin usar type="password" de verdad — así ningún navegador (Chrome, Edge,
// Safari, Firefox, Opera) lo detecta como campo de contraseña y ninguno
// ofrece el prompt nativo de "¿Guardar contraseña?", porque ese prompt se
// activa específicamente sobre inputs type="password", no type="text".
//
// El valor real nunca toca el DOM del input — lo que se ve siempre son
// puntos (maskedValue), y el valor real se reconstruye a partir de la
// posición del cursor/selección antes del cambio (selectionRef) más lo que
// el navegador insertó en e.target.value durante ese evento. Cubre escribir,
// backspace/delete, seleccionar+sobrescribir y pegar.
export function useMaskedPasswordInput(initialValue = '') {
  const [realValue, setRealValue] = useState(initialValue);
  // "Ojo" para mostrar/ocultar — el input sigue siendo type="text" siempre
  // (nunca vuelve a type="password"), solo cambia qué se muestra: los puntos
  // o el valor real. Eso conserva el fix del prompt de "guardar contraseña".
  const [visible, setVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const selectionRef = useRef({ start: initialValue.length, end: initialValue.length });

  const maskedValue = MASK_CHAR.repeat(realValue.length);
  const displayValue = visible ? realValue : maskedValue;

  const syncSelection = useCallback(() => {
    const el = inputRef.current;
    if (el && el.selectionStart !== null && el.selectionEnd !== null) {
      selectionRef.current = { start: el.selectionStart, end: el.selectionEnd };
    }
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    // En modo visible, lo que se ve YA es el valor real editado por el
    // navegador — no hay nada que reconstruir, a diferencia del modo
    // enmascarado donde e.target.value es una mezcla de puntos + lo tecleado.
    if (visible) {
      const next = e.target.value;
      setRealValue(next);
      const cursor = e.target.selectionStart ?? next.length;
      selectionRef.current = { start: cursor, end: cursor };
      return;
    }

    const newRaw = e.target.value;
    const oldLen = realValue.length;
    const newLen = newRaw.length;
    let { start: selStart, end: selEnd } = selectionRef.current;

    // Con el cursor colapsado (sin selección), backspace/delete no dejan
    // rastro en la selección "antes del cambio" — hay que inferir el rango
    // borrado a partir del tipo de edición nativa.
    if (selStart === selEnd) {
      const inputType = (e.nativeEvent as InputEvent).inputType;
      if (inputType === 'deleteContentBackward' && selStart > 0) {
        selStart -= 1;
      } else if (inputType === 'deleteContentForward') {
        selEnd = Math.min(selEnd + 1, oldLen);
      }
    }

    const insertedLen = newLen - oldLen + (selEnd - selStart);
    const insertedText = insertedLen > 0 ? newRaw.slice(selStart, selStart + insertedLen) : '';

    const nextReal = realValue.slice(0, selStart) + insertedText + realValue.slice(selEnd);
    const nextCursor = selStart + insertedText.length;

    setRealValue(nextReal);
    selectionRef.current = { start: nextCursor, end: nextCursor };

    // El input ya se re-renderiza con la máscara nueva (más corta/larga que
    // newRaw) — el navegador puede dejar el cursor en un lugar raro, así que
    // se restaura a mano tras el repintado.
    requestAnimationFrame(() => {
      inputRef.current?.setSelectionRange(nextCursor, nextCursor);
    });
  }, [realValue, visible]);

  const toggleVisible = useCallback(() => setVisible((v) => !v), []);

  const reset = useCallback((value = '') => {
    setRealValue(value);
    selectionRef.current = { start: value.length, end: value.length };
  }, []);

  return {
    realValue,
    displayValue,
    visible,
    toggleVisible,
    inputRef,
    handleChange,
    handleSelect: syncSelection,
    reset,
  };
}
