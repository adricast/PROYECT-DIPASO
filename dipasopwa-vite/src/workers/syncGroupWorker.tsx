// src/workers/syncGroupWorker.tsx
import { GroupRepository } from "./../services/db/groupRepository";
import type { Group, GroupSyncStatus } from "./../entities/api/groupAPI";
import { api } from "./../services/api";
import { groupRouteApi } from "./../config/groupConfig";
import { AuthRepository } from "./../services/db/authRepository";
import { groupSensor } from "./../hooks/sensors/groupSensor";
import { networkState } from "../hooks/sensors/networkSensor";

const groupRepo = new GroupRepository();
const authRepo = new AuthRepository();
const TOKEN_KEY = "auth_token";

/**
 * Función centralizada para registrar el estado final de una operación de sincronización.
 */
function logSyncStatus(action: string, finalStatus: string) {
  console.log(`action: ${action} module:groups-user final-status: ${finalStatus};`);
}

/**
 * Función para mapear la respuesta de la API a la interfaz de Group.
 */
function mapGroupFromApi(apiGroup: any): Group {
  return {
    groupId: apiGroup.user_group_id,
    groupName: apiGroup.group_name,
    description: apiGroup.description,
    users: [],
    syncStatus: "backend" as GroupSyncStatus,
  };
}

/**
 * Lógica para manejar errores de sincronización.
 */
async function handleApiError(group: Group, error: unknown) {
  const isNotFound = (error as any)?.response?.status === 404;
  const isConflict = (error as any)?.response?.status === 409;

  if (isNotFound) {
    console.log(`✅ Grupo ${group.groupId} no encontrado en el servidor, eliminando de IndexedDB.`);
    const idToDelete = group.groupId ?? group.tempId;
    if (idToDelete) {
      await groupRepo.deleteGroup(idToDelete);
      groupSensor.emit("itemDeleted", idToDelete);
    }
    logSyncStatus(group.syncStatus, "synced");
  } else if (isConflict) {
    console.error(`❌ Conflicto al sincronizar el grupo ${group.groupId}:`, error);
    await groupRepo.saveGroup({ ...group, syncStatus: "failed" as GroupSyncStatus });
    groupSensor.emit("item-failed", { item: group, error });
    logSyncStatus(group.syncStatus, "failed");
  } else {
    console.error(`❌ Error al sincronizar el grupo ${group.groupId}:`, error);
    await groupRepo.saveGroup({ ...group, syncStatus: "failed" as GroupSyncStatus });
    groupSensor.emit("item-failed", { item: group, error });
    logSyncStatus(group.syncStatus, "failed");
  }
}

/***********************/
/* Funciones de sincronización */
/***********************/
export async function syncFromBackend() {
  const token = await authRepo.getToken(TOKEN_KEY);
  if (!token) return;

  try {
    const backendGroups = (await api.get(`${groupRouteApi.group}`, {
      headers: { Authorization: `Bearer ${token.token}` },
    })).data;
    const localGroups = await groupRepo.getAllGroups();

    const backendGroupIds = new Set(backendGroups.map((g: any) => g.user_group_id));

    for (const localGroup of localGroups) {
      if (
        localGroup.groupId &&
        !backendGroupIds.has(localGroup.groupId as string | number) &&
        (localGroup.syncStatus === "backend" || localGroup.syncStatus === "synced")
      ) {
        await groupRepo.deleteGroup(localGroup.groupId);
        console.log(`Grupo ${localGroup.groupId} eliminado localmente (no encontrado en backend).`);
      }
    }

    for (const backendGroup of backendGroups) {
      const existingLocalGroup = await groupRepo.getGroupByGroupId(backendGroup.user_group_id);
      if (!existingLocalGroup) {
        const newGroup = mapGroupFromApi(backendGroup);
        await groupRepo.saveGroup({ ...newGroup, syncStatus: "backend" as GroupSyncStatus });
        console.log(`Nuevo grupo ${newGroup.groupId} guardado desde backend.`);
      } else if (
        existingLocalGroup.syncStatus === "backend" ||
        existingLocalGroup.syncStatus === "synced"
      ) {
        const updatedGroup = {
          ...existingLocalGroup,
          groupName: backendGroup.group_name,
          description: backendGroup.description,
          syncStatus: "backend" as GroupSyncStatus,
        };
        await groupRepo.saveGroup(updatedGroup);
        console.log(`Grupo ${updatedGroup.groupId} actualizado desde backend.`);
      }
    }
  } catch (error) {
    console.error("Error durante la sincronización inicial desde el backend:", error);
  }
}

export async function syncPendingGroups() {
  const groupsToAdd = await groupRepo.getGroupsBySyncStatus("pending");
  const groupsToUpdate = await groupRepo.getGroupsBySyncStatus("updated");
  const groupsToDelete = await groupRepo.getGroupsBySyncStatus("deleted");

  const allGroups = [...groupsToAdd, ...groupsToUpdate, ...groupsToDelete];

  if (!allGroups.length) {
    console.log("✅ No hay grupos pendientes para sincronizar.");
    groupSensor.success();
    return;
  }
  
  groupSensor.start();

  const token = await authRepo.getToken(TOKEN_KEY);
  if (!token) {
    console.error("❌ Token no disponible, sincronización fallida.");
    groupSensor.failure(new Error("Token no disponible"));
    return;
  }
  
  let hasError = false;

  for (const group of allGroups) {
    const originalStatus: GroupSyncStatus = group.syncStatus;

    try {
      await groupRepo.saveGroup({ ...group, syncStatus: "in-progress" as GroupSyncStatus });

      /***********************/
      /* CREACIÓN */
      if (originalStatus === "pending") {
        const newGroupData = {
          group_name: group.groupName,
          description: group.description,
        };
        const response = await api.post<Group>(groupRouteApi.group, newGroupData, {
          headers: { Authorization: `Bearer ${token.token}` },
        });

        const syncedGroup: Group = {
          ...group,
          groupId: response.data.groupId,
          tempId: undefined,
          syncStatus: "synced" as GroupSyncStatus,
        };
        
        // ✅ CORRECCIÓN: Si el grupo fue creado offline, borra el registro con el tempId
        if (group.tempId !== undefined) {
          await groupRepo.deleteGroup(group.tempId);
        }

        // ✅ CORRECCIÓN: Guarda el nuevo grupo, ahora con el groupId como clave
        await groupRepo.saveGroup(syncedGroup);

        groupSensor.itemSynced(syncedGroup);
        logSyncStatus("add", "synced");

        /***********************/
        /* ACTUALIZACIÓN */
      } else if (originalStatus === "updated") {
        if (!group.groupId) {
          await groupRepo.saveGroup({ ...group, syncStatus: "pending" as GroupSyncStatus });
          logSyncStatus("update", "failed");
          continue;
        }

        const updateData = {
          group_name: group.groupName,
          description: group.description,
        };
        await api.put(`${groupRouteApi.group}${group.groupId}`, updateData, {
          headers: { Authorization: `Bearer ${token.token}` },
        });

        await groupRepo.saveGroup({ ...group, syncStatus: "synced" as GroupSyncStatus });
        groupSensor.itemSynced(group);
        logSyncStatus("update", "synced");

        /***********************/
        /* ELIMINACIÓN */
      } else if (originalStatus === "deleted") {
        if (!group.groupId) {
          console.log(`⚠️ Grupo sin groupId, eliminando solo localmente.`);
          if (group.tempId !== undefined) {
            await groupRepo.deleteGroup(group.tempId);
            groupSensor.emit("itemDeleted", group.tempId);
          }
          logSyncStatus("delete", "synced");
          continue;
        }

        await api.delete(`${groupRouteApi.group}${group.groupId}`, {
          headers: { Authorization: `Bearer ${token.token}` },
        });

        if (group.groupId !== undefined) {
          await groupRepo.deleteGroup(group.groupId);
          groupSensor.emit("itemDeleted", group.groupId);
        }
        logSyncStatus("delete", "synced");
      }
    } catch (error) {
      hasError = true;
      await handleApiError(group, error);
    }
  }

  if (hasError) {
    groupSensor.failure(new Error("Algunos grupos no se pudieron sincronizar."));
  } else {
    groupSensor.success();
  }
}

/***********************/
/* Funciones de servicio público */
/***********************/
export async function getGroups(): Promise<Group[]> {
  const localGroups = await groupRepo.getAllGroups();
  if (networkState.serverOnline) {
    return localGroups.filter(g => g.syncStatus === 'backend' || g.syncStatus === 'synced');
  } else {
    return localGroups;
  }
}

export async function createGroup(group: Omit<Group, "syncStatus">): Promise<Group> {
  const tempId = `temp-${Date.now()}`;
  return await groupRepo.saveGroup({ ...group, tempId, syncStatus: "pending" as GroupSyncStatus });
}

export async function updateGroup(group: Group): Promise<Group> {
  return await groupRepo.saveGroup({ ...group, syncStatus: group.syncStatus === "synced" ? "updated" as GroupSyncStatus : group.syncStatus });
}

export async function deleteGroup(group: Group): Promise<Group> {
  return await groupRepo.saveGroup({ ...group, syncStatus: "deleted" as GroupSyncStatus });
}