// src/sensors/groupSensor.ts
import { SyncSensor } from "./syncSensor";
import type { Group } from "../../entities/api/groupAPI";
import { syncPendingGroups } from "../../workers/syncGroupWorker";
import { registerSyncTrigger } from "./syncOrchestrator"; // ⬅️ Importamos el orquestador

export const groupSensor: SyncSensor<Group> = new SyncSensor<Group>();

// -----------------------------
// Auto-sync cuando el backend esté disponible
// -----------------------------
registerSyncTrigger(syncPendingGroups, "🔄 Server online, activando sincronización de grupos...");