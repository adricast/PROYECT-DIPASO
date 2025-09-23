import { useEffect } from 'react';

type KeyCombo = string[];
type Callback = () => void;

/**
 * Hook para registrar atajos de teclado dinámicos.
 * - Funciona con combinaciones de cualquier cantidad de teclas.
 * - Ignora combinaciones que tengan teclas adicionales no definidas.
 * - Soporta modificadores: Control, Alt, Shift.
 */
export const useKeyboardShortcut = (keys: KeyCombo, callback: Callback) => {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      // Verifica si todas las teclas de la combinación están presionadas
      const isPressed = keys.every(key => {
        if (key.toLowerCase() === 'control') return event.ctrlKey || event.metaKey;
        if (key.toLowerCase() === 'alt') return event.altKey;
        if (key.toLowerCase() === 'shift') return event.shiftKey;
        return event.key.toLowerCase() === key.toLowerCase();
      });

      // Verifica que no haya teclas extra presionadas
      const modifiersCount = (event.ctrlKey ? 1 : 0) + (event.altKey ? 1 : 0) + (event.shiftKey ? 1 : 0);
      const nonModifierKeysPressed = event.key && !['Control','Alt','Shift'].includes(event.key);
      const totalKeysPressed = modifiersCount + (nonModifierKeysPressed ? 1 : 0);

      if (isPressed && totalKeysPressed === keys.length) {
        event.preventDefault();
        callback();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [keys, callback]);
};
