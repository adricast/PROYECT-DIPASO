// src/hooks/sensors/syncOrchestrator.ts
import { networkSensor, networkState } from "./networkSensor";
import { syncPendingGroups, syncFromBackend } from '../../workers/syncGroupWorker';
import { groupSensor } from "./groupSensor";

/**
 * Suscribe un sensor específico al evento 'server-online' del networkSensor.
 * @param syncFunction La función de sincronización (worker) a ejecutar.
 * @param logMessage El mensaje a mostrar en la consola.
 */
export function registerSyncTrigger(syncFunction: () => Promise<void>, logMessage: string) {
  // Función de sincronización para evitar duplicar código.
  const performSync = async () => {
    console.log("🔄 Servidor online, activando sincronización: " + logMessage);
    try {
      // ✅ 1. Sincroniza primero cambios locales pendientes
      await syncFunction();
      // ✅ 2. Luego refresca desde backend y dispara reload en UI
      await syncFromBackend();
      groupSensor.emit("groups-reloaded", undefined);
    } catch (err) {
      console.error("❌ Error durante sincronización:", err);
    }
  };

  // 1. Ejecuta la sincronización de inmediato si el servidor ya está online al cargar la página.
  if (networkState.serverOnline) {
    performSync();
  }

  // 2. Suscribe la función para que se active cada vez que el servidor se recupere.
  networkSensor.on("server-online", performSync);
}

registerSyncTrigger(syncPendingGroups, "Sincronizando grupos pendientes...");