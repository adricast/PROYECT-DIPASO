// src/workers/syncGroupWorker.tsx
import { GroupRepository } from "./../services/db/groupRepository";
import type { Group, GroupSyncStatus } from "./../entities/api/groupAPI";
import { api } from "./../services/api";
import { groupRouteApi } from "./../config/groupConfig";
import { AuthRepository } from "./../services/db/authRepository";
import { groupSensor } from "./../hooks/sensors/groupSensor";
import { networkState } from "../hooks/sensors/networkSensor";
import { v4 as uuidv4 } from 'uuid';

const groupRepo = new GroupRepository();
const authRepo = new AuthRepository();
const TOKEN_KEY = "auth_token";

/**
 * Función centralizada para registrar el estado final de una operación de sincronización.
 */
async function logSyncStatus(group: Group, action: "add" | "update" | "delete", finalStatus: "synced" | "failed") {
  // Asegurarse de que el objeto del log tiene un id, ya sea el del grupo o uno nuevo.
  const logId = group.id || `log-${uuidv4()}`;
  await groupRepo.logSyncedGroup({ ...group, id: logId }, action, finalStatus);
  console.log(`action: ${action} module:groups-user final-status: ${finalStatus};`);
}

/**
 * Función para mapear la respuesta de la API a la interfaz de Group.
 */
function mapGroupFromApi(apiGroup: any): Group {
  return {
    id: uuidv4(), // ✅ CORRECCIÓN: Genera un ID local único para el objeto.
    groupId: apiGroup.user_group_id,
    groupName: apiGroup.group_name,
    description: apiGroup.description,
    users: [],
    syncStatus: "backend" as GroupSyncStatus,
    lastModifiedAt: apiGroup.last_modified_at || new Date().toISOString(),
  };
}

/**
 * Lógica para manejar errores de sincronización.
 */
async function handleApiError(group: Group, action: "add" | "update" | "delete", error: unknown) {
  const isNotFound = (error as any)?.response?.status === 404;
  const isConflict = (error as any)?.response?.status === 409;

  if (isNotFound) {
    console.log(`✅ Grupo ${group.groupId} no encontrado en el servidor, eliminando de IndexedDB.`);
    if (group.id) {
      await groupRepo.deleteGroup(group.id);
      groupSensor.emit("itemDeleted", group.id);
    }
    await logSyncStatus(group, action, "synced");
  } else if (isConflict) {
    console.error(`❌ Conflicto al sincronizar el grupo ${group.groupId}:`, error);
    await groupRepo.saveGroup({ ...group, syncStatus: "failed" as GroupSyncStatus });
    groupSensor.itemFailed(group, error);
    await logSyncStatus(group, action, "failed");
  } else {
    console.error(`❌ Error al sincronizar el grupo ${group.groupId}:`, error);
    await groupRepo.saveGroup({ ...group, syncStatus: "failed" as GroupSyncStatus });
    groupSensor.itemFailed(group, error);
    await logSyncStatus(group, action, "failed");
  }
}

/**
 * Limpia los grupos que ya han sido sincronizados o han fallado de la base de datos principal.
 */
async function cleanupGroups() {
  console.log("Limpiando registros de grupos sincronizados y fallidos...");
  const syncedGroups = await groupRepo.getGroupsBySyncStatus("synced");
  const failedGroups = await groupRepo.getGroupsBySyncStatus("failed");
  const inProgressGroups = await groupRepo.getGroupsBySyncStatus("in-progress");

  for (const group of [...syncedGroups, ...failedGroups, ...inProgressGroups]) {
    // ✅ CORRECCIÓN CLAVE: Siempre eliminar usando el 'id' principal.
    if (group.id) {
      await groupRepo.deleteGroup(group.id);
      groupSensor.emit("itemDeleted", group.id);
    } else {
      console.warn(`⚠️ Omitting deletion of malformed group record: ${JSON.stringify(group)}`);
    }
  }
}

//### **Funciones de sincronización**

export async function syncFromBackend() {
  if (!networkState.serverOnline) {
    console.log("No hay conexión con el servidor. Sincronización desde backend cancelada.");
    return;
  }
  const token = await authRepo.getToken(TOKEN_KEY);
  if (!token) return;

  try {
    const localBackendGroups = await groupRepo.getGroupsBySyncStatus("backend");
    for (const group of localBackendGroups) {
      await groupRepo.deleteGroup(group.id);
    }

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
        await groupRepo.deleteGroup(localGroup.id);
        console.log(`Grupo ${localGroup.groupId} eliminado localmente (no encontrado en backend).`);
      }
    }

    for (const backendGroup of backendGroups) {
      const existingLocalGroup = await groupRepo.getGroupByGroupId(backendGroup.user_group_id);
      if (!existingLocalGroup) {
        const newGroup = mapGroupFromApi(backendGroup);
        await groupRepo.saveGroup(newGroup);
        console.log(`Nuevo grupo ${newGroup.groupId} guardado desde backend.`);
      } else {
        const backendLastModifiedAt = new Date(backendGroup.last_modified_at);
        const localLastModifiedAt = new Date(existingLocalGroup.lastModifiedAt);

        if (backendLastModifiedAt > localLastModifiedAt) {
          const updatedGroup = mapGroupFromApi(backendGroup);
          await groupRepo.saveGroup({ ...updatedGroup, id: existingLocalGroup.id });
          console.log(`Grupo ${updatedGroup.groupId} actualizado desde backend (conflicto resuelto).`);
        }
      }
    }

    await cleanupGroups();
  } catch (error) {
    console.error("Error durante la sincronización inicial desde el backend:", error);
  }
}

/**
 * Sincroniza los cambios del cliente al backend.
 */
export async function syncPendingGroups() {
  if (!networkState.serverOnline) {
    console.log("Sin conexión, posponiendo la sincronización de grupos pendientes.");
    return;
  }

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

    // ✅ CORRECCIÓN CLAVE: El grupo ya debe tener un 'id' válido, ya que fue guardado antes.
    if (!group.id) {
      console.error("❌ Grupo sin ID local, no se puede sincronizar.", group);
      continue;
    }

    try {
      // Marcamos como "in-progress"
      await groupRepo.saveGroup({ ...group, syncStatus: "in-progress" as GroupSyncStatus });

      if (originalStatus === "pending") {
        const newGroupData = {
          group_name: group.groupName,
          description: group.description,
        };
        const response = await api.post(groupRouteApi.group, newGroupData, {
          headers: { Authorization: `Bearer ${token.token}` },
        });

        const syncedGroup: Group = {
          ...group,
          // ✅ CORRECCIÓN: Usamos el ID local del grupo original.
          id: group.id,
          groupId: response.data.user_group_id,
          syncStatus: "synced" as GroupSyncStatus,
          tempId: undefined, // Eliminar el ID temporal
        };

        await groupRepo.saveGroup(syncedGroup);
        await logSyncStatus(syncedGroup, "add", "synced");
        groupSensor.itemSynced(syncedGroup);

      } else if (originalStatus === "updated") {
        if (!group.groupId) {
          console.log("Grupo actualizado sin groupId, se reintentará como pendiente.");
          await groupRepo.saveGroup({ ...group, syncStatus: "pending" as GroupSyncStatus });
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
        await logSyncStatus(group, "update", "synced");
        groupSensor.itemSynced(group);

      } else if (originalStatus === "deleted") {
        if (!group.groupId) {
          console.log(`⚠️ Grupo sin groupId, se elimina solo localmente.`);
          if (group.id) {
            await groupRepo.deleteGroup(group.id);
            groupSensor.emit("itemDeleted", group.id);
          }
          await logSyncStatus(group, "delete", "synced");
          continue;
        }

        await api.delete(`${groupRouteApi.group}${group.groupId}`, {
          headers: { Authorization: `Bearer ${token.token}` },
        });

        if (group.id) {
          await groupRepo.deleteGroup(group.id);
          groupSensor.emit("itemDeleted", group.id);
        }
        await logSyncStatus(group, "delete", "synced");
      }
    } catch (error) {
      hasError = true;
      await handleApiError(group, originalStatus === "pending" ? "add" : originalStatus === "updated" ? "update" : "delete", error);
    }
  }

  // ✅ CORRECCIÓN: La limpieza de grupos ahora es manual al final del proceso.
  await cleanupGroups();

  if (hasError) {
    groupSensor.failure(new Error("Algunos grupos no se pudieron sincronizar."));
  } else {
    groupSensor.success();
  }
}

// **Funciones de servicio público**

export async function getGroups(): Promise<Group[]> {
  const localGroups = await groupRepo.getAllGroups();
  if (networkState.serverOnline) {
    return localGroups.filter(g => g.syncStatus === 'backend' || g.syncStatus === 'synced' || g.syncStatus === 'pending' || g.syncStatus === 'updated');
  } else {
    return localGroups.filter(g => g.syncStatus !== 'deleted');
  }
}

export async function createGroup(group: Omit<Group, "id" | "syncStatus">): Promise<Group> {
  // ✅ CORRECCIÓN CLAVE: Construir el objeto de forma explícita y completa.
  const newGroup: Group = {
    id: crypto.randomUUID(), // El ID único local, clave para la base de datos.
    groupName: group.groupName,
    description: group.description,
    users: [], // Asignar un array vacío si no se especifica.
    syncStatus: "pending" as GroupSyncStatus,
    lastModifiedAt: group.lastModifiedAt || new Date().toISOString(),
  };

  return await groupRepo.saveGroup(newGroup);
}

export async function updateGroup(group: Group): Promise<Group> {
  const updatedGroup = {
    ...group,
    syncStatus: group.syncStatus === "synced" ? "updated" as GroupSyncStatus : group.syncStatus,
    lastModifiedAt: new Date().toISOString(),
  };
  return await groupRepo.saveGroup(updatedGroup);
}

export async function deleteGroup(group: Group): Promise<Group> {
  const deletedGroup = {
    ...group,
    syncStatus: "deleted" as GroupSyncStatus,
    lastModifiedAt: new Date().toISOString(),
  };
  return await groupRepo.saveGroup(deletedGroup);
}