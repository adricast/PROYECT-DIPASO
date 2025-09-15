import { SyncSensor } from "./syncSensor";
import { networkSensor } from "./networkSensor";
import type { User } from "../../entities/api/userAPI";
import { syncUsers } from "../../workers/syncUserWorker";

// -----------------------------
// Sensor específico para usuarios
// -----------------------------
export const userSensor: SyncSensor<User> = new SyncSensor<User>();

// -----------------------------
// Auto-sync cuando el backend esté disponible
// Ahora llama a la función del worker
// -----------------------------
networkSensor.on("server-online", async () => {
  console.log("🔄 Server online, activando sincronización de usuarios...");
  await syncUsers();
});