import { GroupRepository } from "./../../services/db/groupRepository";
import type { Group, GroupSyncStatus } from "./../../entities/api/groupAPI";
import { api } from "./../../services/api";
import { groupRouteApi } from "./../../config/groupConfig";
import { AuthRepository } from "./../../services/db/authRepository";
import { groupSensor } from "./../../hooks/sensors/groupSensor";

const groupRepo = new GroupRepository();
const authRepo = new AuthRepository();
const TOKEN_KEY = "auth_token";

/**
 * Función centralizada para registrar el estado final de una operación de sincronización.
 * @param action El tipo de acción intentada ('add', 'update', 'delete').
 * @param finalStatus El estado final del intento ('synced' o 'failed').
 */
function logSyncStatus(action: string, finalStatus: string) {
  console.log(`action: ${action} module:groups-user final-status: ${finalStatus};`);
}

/**
 * Función para mapear la respuesta de la API a la interfaz de Group.
 * @param apiGroup El objeto de grupo tal como viene de la API.
 * @returns El objeto de grupo con los nombres de propiedades corregidos.
 */
function mapGroupFromApi(apiGroup: any): Group {
  return {
    groupId: apiGroup.user_group_id,
    groupName: apiGroup.group_name,
    description: apiGroup.description,
    users: [],
    syncStatus: "synced",
  };
}


/***********************/
/* Manejo de errores de sincronización */
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
    await groupRepo.saveGroup({ ...group, syncStatus: "failed" });
    groupSensor.emit("item-failed", { item: group, error });
    logSyncStatus(group.syncStatus, "failed");
  } else {
    console.error(`❌ Error al sincronizar el grupo ${group.groupId}:`, error);
    await groupRepo.saveGroup({ ...group, syncStatus: "failed" });
    groupSensor.emit("item-failed", { item: group, error });
    logSyncStatus(group.syncStatus, "failed");
  }
}

/***********************/
/* Funciones de servicio público */
export async function getGroups(): Promise<Group[]> {
  try {
    const response = await api.get<any[]>(groupRouteApi.group);
    const apiGroups = response.data.map(mapGroupFromApi);
    const localGroups = await groupRepo.getAllGroups();
    return [...localGroups, ...apiGroups];
  } catch (error) {
    console.error("Error al obtener grupos:", error);
    return await groupRepo.getAllGroups();
  }
}


export async function createGroup(group: Omit<Group, "syncStatus">): Promise<Group> {
  const tempId = `temp-${Date.now()}`;
  // ✅ CORRECCIÓN: Asignar el tempId a la propiedad groupId para que la DB tenga una clave.
  return await groupRepo.saveGroup({ ...group, groupId: tempId, tempId, syncStatus: "pending" });
}
export async function updateGroup(group: Group): Promise<Group> {
  const newSyncStatus = group.tempId 
    ? "pending"
    : group.syncStatus === "synced"
    ? "updated"
    : group.syncStatus;
    
  return await groupRepo.saveGroup({ ...group, syncStatus: newSyncStatus });
}

export async function deleteGroup(group: Group): Promise<Group> {
  return await groupRepo.saveGroup({ ...group, syncStatus: "deleted" });
}

/***********************/
/* Función principal de sincronización */
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
      // Marcamos como "in-progress"
      await groupRepo.saveGroup({ ...group, syncStatus: "in-progress" });

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
          tempId: undefined, // ✅ CORRECCIÓN: Eliminar el tempId explícitamente
          syncStatus: "synced",
        };
        
        // Eliminar el grupo temporal y luego guardar el nuevo registro con el ID oficial.
        if (group.tempId !== undefined) {
          await groupRepo.deleteGroup(group.tempId);
        }
        await groupRepo.saveGroup(syncedGroup);

        groupSensor.itemSynced(syncedGroup);
        logSyncStatus("pending", "synced");

        /***********************/
        /* ACTUALIZACIÓN */
      } else if (originalStatus === "updated") {
        if (!group.groupId) {
          console.log(`⚠️ Grupo sin groupId, se tratará como creación.`);
          await groupRepo.saveGroup({ ...group, syncStatus: "pending" });
          logSyncStatus("updated", "failed");
          continue;
        }

        const updateData = {
          group_name: group.groupName,
          description: group.description,
        };
        await api.put(`${groupRouteApi.group}/${group.groupId}`, updateData, {
          headers: { Authorization: `Bearer ${token.token}` },
        });

        await groupRepo.saveGroup({ ...group, syncStatus: "synced" });
        groupSensor.itemSynced(group);
        logSyncStatus("updated", "synced");

        /***********************/
        /* ELIMINACIÓN */
      } else if (originalStatus === "deleted") {
        if (!group.groupId) {
          console.log(`⚠️ Grupo sin groupId, eliminando solo localmente.`);
          if (group.tempId !== undefined) {
            await groupRepo.deleteGroup(group.tempId);
            groupSensor.emit("itemDeleted", group.tempId);
          }
          logSyncStatus("deleted", "synced");
          continue;
        }

        await api.delete(`${groupRouteApi.group}/${group.groupId}`, {
          headers: { Authorization: `Bearer ${token.token}` },
        });

        if (group.groupId !== undefined) {
          await groupRepo.deleteGroup(group.groupId);
          groupSensor.emit("itemDeleted", group.groupId);
        }
        logSyncStatus("deleted", "synced");
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