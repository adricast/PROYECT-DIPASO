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

  const groupsToSync = new Map<string | number, Group>();
  [...pendingGroups, ...updatedGroups, ...deletedGroups].forEach(group => {
      groupsToSync.set(group.groupId || group.tempId!, group);
  });
  
  if (!groupsToSync.size) {
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

  let hasError = false;

  for (const group of groupsToSync.values()) {
    // Manejo de errores de manera individual para cada tipo de operación
    if (group.syncStatus === "pending") {
        try {
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
        } catch (pendingError: unknown) {
            console.error(`❌ Error al crear grupo ${group.tempId}:`, pendingError);
            hasError = true;
            await groupRepo.saveGroup({ ...group, syncStatus: "pending" });
            groupSensor.emit("item-failed", { item: group, error: pendingError });
        }
      } else if (group.syncStatus === "updated") {
        try {
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
            groupSensor.itemSynced(serverGroup); // ⬅️ He añadido esta línea
        } catch (updateError: unknown) {
            const isNotFoundError = typeof updateError === 'object' && updateError !== null && 'response' in updateError && (updateError as any).response?.status === 404;

            if (isNotFoundError) {
                console.log(`✅ Grupo ${group.groupId} no encontrado en el servidor al actualizar, eliminando de IndexedDB.`);
                await groupRepo.deleteGroup(group.groupId!);
                groupSensor.emit("itemDeleted", group.groupId!);
            } else {
                console.error(`❌ Error al actualizar grupo ${group.groupId}:`, updateError);
                hasError = true;
                await groupRepo.saveGroup({ ...group, syncStatus: "updated" });
                groupSensor.emit("item-failed", { item: group, error: updateError });
            }
        }
      } else if (group.syncStatus === "deleted") {
        if (group.groupId) {
          try {
            await api.delete(`${groupRouteApi.group}${group.groupId}`, {
              headers: { Authorization: `Bearer ${token.token}` },
            });
            await groupRepo.deleteGroup(group.groupId);
            groupSensor.emit("itemDeleted", group.groupId);
          } catch (deleteError: unknown) {
            const isNotFoundError = typeof deleteError === 'object' && deleteError !== null && 'response' in deleteError && (deleteError as any).response?.status === 404;

            if (isNotFoundError) {
              console.log(`✅ Grupo ${group.groupId} no encontrado en el servidor, eliminando de IndexedDB.`);
              await groupRepo.deleteGroup(group.groupId);
              groupSensor.emit("itemDeleted", group.groupId);
            } else {
              console.error(`❌ Error al eliminar grupo ${group.groupId}:`, deleteError);
              hasError = true;
              await groupRepo.saveGroup({ ...group, syncStatus: "deleted" });
              groupSensor.emit("item-failed", { item: group, error: deleteError });
            }
          }
        } else {
          await groupRepo.deleteGroup(group.tempId!);
          groupSensor.emit("itemDeleted", group.tempId!);
        }
      }
  }

  if (hasError) {
    groupSensor.failure(new Error("Algunos grupos no se pudieron sincronizar."));
  } else {
    groupSensor.success();
  }
}