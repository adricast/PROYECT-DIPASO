// src/sensors/syncOrchestrator.ts
import { networkSensor } from "./networkSensor";
import { syncPendingGroups, syncFromBackend } from '../../workers/syncGroupWorker'; // ✅ Importa la nueva función

/**
 * Suscribe un sensor específico al evento 'server-online' del networkSensor.
 * @param syncFunction La función de sincronización (worker) a ejecutar.
 * @param logMessage El mensaje a mostrar en la consola.
 */
export function registerSyncTrigger(syncFunction: () => Promise<void>, logMessage: string) {
    networkSensor.on("server-online", async () => {
        console.log("🔄 Servidor online, activando sincronización inicial y de cambios pendientes..."+logMessage);
        // ✅ CORRECCIÓN: Primero se sincroniza el backend
        await syncFromBackend(); 
        await syncFunction();
    });
}

registerSyncTrigger(syncPendingGroups, "Sincronizando grupos pendientes...");