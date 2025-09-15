// src/sensors/syncOrchestrator.ts
import { networkSensor } from "./networkSensor";

/**
 * Suscribe un sensor específico al evento 'server-online' del networkSensor.
 * * @param syncFunction La función de sincronización (worker) a ejecutar.
 * @param logMessage El mensaje a mostrar en la consola.
 */
export function registerSyncTrigger(syncFunction: () => Promise<void>, logMessage: string) {
    networkSensor.on("server-online", async () => {
        console.log(logMessage);
        await syncFunction();
    });
}