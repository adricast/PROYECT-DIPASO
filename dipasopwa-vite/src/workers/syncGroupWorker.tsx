import { GroupRepository } from "./../services/db/groupRepository";
import type { Group, GroupSyncStatus } from "./../entities/api/groupAPI";
import { api } from "./../services/api";
import { groupRouteApi } from "./../config/groupConfig";
import { AuthRepository } from "./../services/db/authRepository";
import { groupSensor } from "./../hooks/sensors/groupSensor";

const groupRepo = new GroupRepository();
const authRepo = new AuthRepository();
const TOKEN_KEY = "auth_token";

export async function syncPendingGroups() {
  // ✅ Usando GroupSyncStatus para evitar warning de ESLint
  const pendingGroups = await groupRepo.getGroupsBySyncStatus("pending" as GroupSyncStatus);
  const deletedGroups = await groupRepo.getGroupsBySyncStatus("deleted" as GroupSyncStatus);
  const updatedGroups = await groupRepo.getGroupsBySyncStatus("updated" as GroupSyncStatus);

  const groupsToSync = [...pendingGroups, ...deletedGroups, ...updatedGroups];
  if (!groupsToSync.length) {
    console.log("✅ No hay grupos pendientes para sincronizar.");
    groupSensor.success();
    return;
  }

  groupSensor.start();

  const token = await authRepo.getToken(TOKEN_KEY);
  if (!token) {
    console.error("❌ Token no disponible, sincronización fallida");
    groupSensor.failure(new Error("Token no disponible"));
    return;
  }

  for (const group of groupsToSync) {
    try {
      // --- MARCAR IN-PROGRESS para todos los grupos antes de procesarlos
      await groupRepo.saveGroup({ ...group, syncStatus: "in-progress" });

      if (group.syncStatus === "pending") {
        // --- NUEVO grupo offline ---
        const groupToSend = {
          group_name: group.groupName,
          description: group.description,
        };

        const response = await api.post<Group>(
          groupRouteApi.group,
          groupToSend,
          { headers: { Authorization: `Bearer ${token.token}` } }
        );

        const serverGroup: Group = { ...response.data, syncStatus: "synced" };
        await groupRepo.deleteGroup(group.tempId!);
        await groupRepo.saveGroup(serverGroup);
        groupSensor.itemSynced(serverGroup);

      } else if (group.syncStatus === "updated" || group.syncStatus === "synced") {
        // --- ACTUALIZACIÓN de grupo existente ---
        const groupUpdates = {
          group_name: group.groupName,
          description: group.description,
          updatedAt: Date.now(),
        };

        const response = await api.put<Group>(
          `${groupRouteApi.group}${group.groupId}`,
          groupUpdates,
          { headers: { Authorization: `Bearer ${token.token}` } }
        );

        const serverGroup: Group = { ...response.data, syncStatus: "synced" };
        await groupRepo.saveGroup(serverGroup);
        groupSensor.itemSynced(serverGroup);

      } else if (group.syncStatus === "deleted") {
        // --- Eliminar grupo ---
        if (group.groupId) {
          await api.delete(`${groupRouteApi.group}${group.groupId}`, {
            headers: { Authorization: `Bearer ${token.token}` },
          });
        }
        await groupRepo.deleteGroup(group.groupId || group.tempId!);
        groupSensor.emit("itemDeleted", group.groupId || group.tempId!);
      }

    } catch (error) {
      console.error("❌ Error al sincronizar grupo:", group, error);
      groupSensor.itemFailed(group, error);
    }
  }

  groupSensor.success();
}
