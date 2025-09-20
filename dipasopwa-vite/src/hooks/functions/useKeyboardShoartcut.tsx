import { useEffect } from 'react';

type KeyCombo = string[];
type Callback = () => void;

export const useKeyboardShortcut = (keys: KeyCombo, callback: Callback) => {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      // Verifica si todas las teclas de la combinación están presionadas
      const isMatch = keys.every(key => {
        if (key === 'Control') return event.ctrlKey || event.metaKey;
        if (key === 'Alt') return event.altKey;
        if (key === 'Shift') return event.shiftKey;
        return event.key.toLowerCase() === key.toLowerCase();
      });

      if (isMatch) {
        event.preventDefault();
        callback();
      }
    };

    window.addEventListener('keydown', handler);

    return () => {
      window.removeEventListener('keydown', handler);
    };
  }, [keys, callback]);
};