import { UserRepository } from "./../services/db/userRepository";
import { AuthRepository } from "./../services/db/authRepository";
import type { User } from "./../entities/api/userAPI";
import { api } from "./../services/api";
import { userRouteApi } from "./../config/userConfig";
import { userSensor } from "./../hooks/sensors/userSensor";

const userRepo = new UserRepository();
const authRepo = new AuthRepository();
const TOKEN_KEY = "auth_token";

// -----------------------------
// Función principal de sincronización
// -----------------------------
export async function syncUsers() {
  const pendingUsers = await userRepo.getUsersBySyncStatus("pending");
  const deletedUsers = await userRepo.getUsersBySyncStatus("deleted");

  const usersToSync = [...pendingUsers, ...deletedUsers];
  if (!usersToSync.length) {
    console.log("✅ No hay usuarios pendientes para sincronizar.");
    userSensor.success();
    return;
  }

  userSensor.start();

  // Obtener token válido
  const token = await authRepo.getToken(TOKEN_KEY);
  if (!token) {
    console.error("❌ Token no disponible, sincronización fallida");
    userSensor.failure(new Error("Token no disponible"));
    return;
  }

  for (const user of usersToSync) {
    try {
      if (user.syncStatus === "pending") {
        // --- Actualización existente ---
        if (user.userId) {
          console.log(`🔄 Sincronizando actualización para usuario con id: ${user.userId}`);
          const response = await api.put<User>(
            `${userRouteApi.user}/${user.userId}`,
            user,
            { headers: { Authorization: `Bearer ${token.token}` } }
          );
          const serverUser: User = { ...response.data, syncStatus: "synced" };
          await userRepo.saveUser(serverUser);
          userSensor.itemSynced(serverUser);

        // --- Nuevo usuario offline ---
        } else {
          console.log(`🔄 Sincronizando nuevo usuario offline con tempId: ${user.tempId}`);
          const userToSend = { ...user };
          delete userToSend.tempId;

          const response = await api.post<User, { data: User }>(
            userRouteApi.user,
            userToSend,
            { headers: { Authorization: `Bearer ${token.token}` } }
          );

          const serverUser: User = { ...response.data, tempId: user.tempId, syncStatus: "synced" };
          await userRepo.saveUser(serverUser);
          await userRepo.deleteUser(user.tempId!);
          userSensor.itemSynced(serverUser);
        }

      } else if (user.syncStatus === "deleted") {
        // --- Eliminar usuario ---
        if (user.userId) {
          await api.delete(`${userRouteApi.user}/${user.userId}`, {
            headers: { Authorization: `Bearer ${token.token}` },
          });
        }
        await userRepo.deleteUser(user.userId || user.tempId!);
        userSensor.emit("itemDeleted", user.userId || user.tempId!);
      }
    } catch (error) {
      console.error("❌ Error al sincronizar usuario:", user, error);
      userSensor.itemFailed(user, error);
    }
  }
  userSensor.success();
}