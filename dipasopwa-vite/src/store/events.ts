// Event bus global usando mitt
import mitt, { type Emitter } from "mitt";

// Tipos de eventos que la app puede emitir globalmente
export type AppEvents = {
  "network-change": boolean;        // online/offline
  "sync-start": void;               // cualquier módulo empezó sync
  "sync-complete": void;            // sync finalizado
  "sync-error": { module: string; error: unknown }; // error en sync
};

export const appEvents: Emitter<AppEvents> = mitt<AppEvents>();

// Helper para suscribirse
export const onAppEvent = <K extends keyof AppEvents>(
  event: K,
  callback: (payload: AppEvents[K]) => void
) => {
  appEvents.on(event, callback);

  return () => {
    appEvents.off(event, callback);
  };
};
