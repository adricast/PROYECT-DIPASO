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

  try {
    for (const group of groupsToSync) {
      // 🚨 CAMBIO CLAVE: Diferenciamos el tipo de operación
      if (group.syncStatus === "pending" || (group.syncStatus === "updated" && group.tempId)) {
        // --- CREACIÓN de grupo nuevo (o actualización de un grupo nuevo) ---
        await groupRepo.saveGroup({ ...group, syncStatus: "in-progress" });

        const newGroupData = {
          group_name: group.groupName,
          description: group.description,
          createdAt: Date.now(),
        };
        const response = await api.post<Group>(
          groupRouteApi.group,
          newGroupData,
          { headers: { Authorization: `Bearer ${token.token}` } }
        );

        const serverGroup: Group = { ...response.data, syncStatus: "synced" };
        await groupRepo.deleteGroup(group.tempId!);
        await groupRepo.saveGroup(serverGroup);
        groupSensor.itemSynced(serverGroup);
      } else if (group.syncStatus === "updated" && group.groupId) {
        // --- ACTUALIZACIÓN de un grupo existente (que ya tiene groupId) ---
        await groupRepo.saveGroup({ ...group, syncStatus: "in-progress" });
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
    }
    groupSensor.success();
  } catch (error) {
    console.error("❌ Error al sincronizar grupo:", error);
    groupSensor.failure(error);
    // Revertir el estado a `updated` o `pending` si la sincronización falla
    for (const group of groupsToSync) {
      if (group.syncStatus === "in-progress") {
        await groupRepo.saveGroup({
          ...group,
          syncStatus: group.tempId ? "pending" : "updated",
        });
      }
    }
  }
}