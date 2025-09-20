// src/sensors/groupSensor.ts
import { SyncSensor } from "./syncSensor";
import type { Group } from "../../entities/api/groupAPI";
import { syncPendingGroups } from '../../workers/syncGroupWorker'; // ⬅️ Corrected this line
import { registerSyncTrigger } from "./syncOrchestrator";

export const groupSensor: SyncSensor<Group> = new SyncSensor<Group>();

// -----------------------------
// Auto-sync cuando el backend esté disponible
// -----------------------------
registerSyncTrigger(syncPendingGroups, "🔄 Server online, activando sincronización de grupos...");