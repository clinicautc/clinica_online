import { useCallback, useEffect, useRef, useState } from 'react';

const DEFAULT_COOLDOWN_SECONDS = 60;

// Cuenta regresiva reutilizable para los botones de "reenviar código"
// (registro, olvidé mi contraseña, primer inicio). Evita que el usuario
// spamee el reenvío de correos — al llamar start(), el consumidor debe
// deshabilitar su botón mientras isActive sea true y mostrar secondsLeft.
export function useResendCooldown(seconds: number = DEFAULT_COOLDOWN_SECONDS) {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const start = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    setSecondsLeft(seconds);

    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [seconds]);

  return { secondsLeft, isActive: secondsLeft > 0, start };
}
