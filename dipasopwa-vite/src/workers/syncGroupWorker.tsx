/****************************/
/* WORKER DE SINCRONIZACIÓN */
/****************************/
/* Este módulo centraliza toda la lógica para sincronizar grupos
   entre IndexedDB (almacenamiento local) y el backend (API).
   Está diseñado para un enfoque offline-first, manejando estados
   de sincronización, conflictos, y manteniendo consistencia entre
   cliente y servidor. */

// src/workers/syncGroupWorker.tsx

/**
 * ============================================================
 * WORKER DE SINCRONIZACIÓN DE GRUPOS
 * ============================================================
 * Este módulo se encarga de toda la lógica de sincronización
 * de los grupos entre IndexedDB (local) y el backend (API).
 *
 * Funcionalidades principales:
 * 1. Sincronización desde backend hacia IndexedDB (syncFromBackend).
 * 2. Sincronización de cambios locales pendientes hacia backend (syncPendingGroups).
 * 3. Manejo de estados de sincronización: "pending", "updated", "deleted", "synced", "failed", "backend".
 * 4. Gestión de errores y conflictos.
 * 5. Limpieza de registros ya sincronizados o fallidos.
 * 6. Registro de eventos de sincronización usando groupSensor.
 * 7. Integración con networkState para validación de conexión y modo offline-first.
 * ============================================================
 */

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

/****************************/
/* FUNCIONES AUXILIARES     */
/****************************/
/* Contienen lógica de apoyo como logging, mapeo de datos desde
   el backend, manejo de errores, y limpieza de registros. */

/**
 * Loguea el estado final de la sincronización de un grupo.
 * Sirve para auditoría y para el manejo visual de estados en la UI.
 */
async function logSyncStatus(group: Group, action: "add" | "update" | "delete", finalStatus: "synced" | "failed") {
  const logId = group.id || `log-${uuidv4()}`;
  await groupRepo.logSyncedGroup({ ...group, id: logId }, action, finalStatus);
  console.log(`action: ${action} module:groups-user final-status: ${finalStatus};`);
}

/**
 * Convierte un objeto recibido desde la API en la interfaz Group local.
 * Genera un ID local único (uuid) para la persistencia en IndexedDB.
 */
function mapGroupFromApi(apiGroup: any) {
  return {
    groupId: apiGroup.user_group_id,
    groupName: apiGroup.group_name,
    description: apiGroup.description,
    lastModifiedAt: apiGroup.last_modified_at || new Date().toISOString(),
    syncStatus: "backend" as GroupSyncStatus,
    users: [],
  };
}
/**
 * Maneja errores de sincronización y conflictos de backend.
 * Diferencia entre 404 (no encontrado), 409 (conflicto) y otros errores.
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
 * Limpia los registros de grupos que ya han sido sincronizados o han fallado.
 * Esto evita acumulación innecesaria en IndexedDB.
 */
async function cleanupGroups() {
  console.log("Limpiando registros de grupos sincronizados y fallidos...");
  const syncedGroups = await groupRepo.getGroupsBySyncStatus("synced");
  const failedGroups = await groupRepo.getGroupsBySyncStatus("failed");
  const inProgressGroups = await groupRepo.getGroupsBySyncStatus("in-progress");

  for (const group of [...syncedGroups, ...failedGroups, ...inProgressGroups]) {
    if (group.id) {
      await groupRepo.deleteGroup(group.id);
      groupSensor.emit("itemDeleted", group.id);
    } else {
      console.warn(`⚠️ Omitting deletion of malformed group record: ${JSON.stringify(group)}`);
    }
  }

}


/****************************/
/* FUNCIONES DE SINCRONIZACIÓN */
/****************************/
/* Encargadas de la lógica principal de sincronización con el backend.
   Incluyen la importación de datos desde el servidor y la exportación
   de cambios locales pendientes. */

/**
 * Sincroniza los grupos desde el backend hacia la base local (IndexedDB).
 * Se asegura de mantener consistencia y resolver conflictos por fecha de modificación.
 */
// src/workers/syncGroupWorker.tsx

export async function syncFromBackend() {
  if (!networkState.serverOnline) {
    console.log("No hay conexión con el servidor. Sincronización desde backend cancelada.");
    return;
  }
  const token = await authRepo.getToken(TOKEN_KEY);
  if (!token) return;

  try {
    const backendGroups = (await api.get(`${groupRouteApi.group}`, {
      headers: { Authorization: `Bearer ${token.token}` },
    })).data;
    const localGroups = await groupRepo.getAllGroups();
    const backendGroupIds = new Set(backendGroups.map((g: any) => g.user_group_id));

    // Eliminar localmente los grupos que ya no existen en backend
    for (const localGroup of localGroups) {
      if (localGroup.groupId && !backendGroupIds.has(localGroup.groupId as string | number) &&
        (localGroup.syncStatus === "backend" || localGroup.syncStatus === "synced")) {
        await groupRepo.deleteGroup(localGroup.id);
        console.log(`Grupo ${localGroup.groupId} eliminado localmente (no encontrado en backend).`);
      }
    }

    // Insertar o actualizar grupos desde backend
    for (const backendGroup of backendGroups) {
      const existingLocalGroup = await groupRepo.getGroupByGroupId(backendGroup.user_group_id);
      const mappedGroupData = mapGroupFromApi(backendGroup);

      if (!existingLocalGroup) {
        const newGroup = { ...mappedGroupData, id: crypto.randomUUID() };
        await groupRepo.saveGroup(newGroup);
        console.log(`Nuevo grupo ${newGroup.groupId} guardado desde backend.`);
      } else {
        const backendLastModifiedAt = new Date(backendGroup.last_modified_at);
        const localLastModifiedAt = new Date(existingLocalGroup.lastModifiedAt);

        if (backendLastModifiedAt > localLastModifiedAt) {
          const updatedGroup = { ...mappedGroupData, id: existingLocalGroup.id };
          await groupRepo.saveGroup(updatedGroup);
          console.log(`Grupo ${updatedGroup.groupId} actualizado desde backend (conflicto resuelto).`);
        }
      }
    }
    
    // Llama a cleanupGroups() y luego notifica a la UI.
    await cleanupGroups();
    groupSensor.success();
    
    // ✅ Emite el evento de recarga inmediatamente, sin retraso.
    groupSensor.emit("groups-reloaded", undefined);
    
  } catch (error) {
    console.error("Error durante la sincronización inicial desde el backend:", error);
    groupSensor.failure(error);
  }
}
/**
 * Sincroniza los cambios locales pendientes al backend.
 * Maneja los estados "pending", "updated" y "deleted".
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
        if (!group.id) {
            console.error("❌ Grupo sin ID local, no se puede sincronizar.", group);
            continue;
        }

        try {
            await groupRepo.saveGroup({ ...group, syncStatus: "in-progress" as GroupSyncStatus });

            if (originalStatus === "pending") {
                const newGroupData = { group_name: group.groupName, description: group.description };
                const response = await api.post(groupRouteApi.group, newGroupData, { headers: { Authorization: `Bearer ${token.token}` } });
                const syncedGroup: Group = { ...group, id: group.id, groupId: response.data.user_group_id, syncStatus: "synced" as GroupSyncStatus };
                await groupRepo.saveGroup(syncedGroup);
                await logSyncStatus(syncedGroup, "add", "synced");
                groupSensor.itemSynced(syncedGroup);

            } else if (originalStatus === "updated") {
                if (!group.groupId) {
                    await groupRepo.saveGroup({ ...group, syncStatus: "pending" as GroupSyncStatus });
                    continue;
                }
                const updateData = { group_name: group.groupName, description: group.description };
                await api.put(`${groupRouteApi.group}${group.groupId}`, updateData, { headers: { Authorization: `Bearer ${token.token}` } });
              
                await groupRepo.saveGroup({ ...group, syncStatus: "synced" as GroupSyncStatus });
               
                await logSyncStatus(group, "update", "synced");
                groupSensor.itemSynced(group);

            } else if (originalStatus === "deleted") {
                if (!group.groupId) {
                    if (group.id) {
                        await groupRepo.deleteGroup(group.id);
                        groupSensor.emit("itemDeleted", group.id);
                    }
                    await logSyncStatus(group, "delete", "synced");
                    continue;
                }
                await api.delete(`${groupRouteApi.group}${group.groupId}`, { headers: { Authorization: `Bearer ${token.token}` } });
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

    await cleanupGroups();


      if (hasError) {
          groupSensor.failure(new Error("Algunos grupos no se pudieron sincronizar."));
      } else {
          groupSensor.success();
      }
      
      // ✅ PASO 1: Llama a syncFromBackend al final de syncPendingGroups
      await syncFromBackend();
  

    if (hasError) groupSensor.failure(new Error("Algunos grupos no se pudieron sincronizar."));
    else groupSensor.success();
}

/****************************/
/* FUNCIONES PÚBLICAS DE SERVICIO */
/****************************/
/* Estas funciones son las que expone el worker para ser usadas
   por el resto de la aplicación. Incluyen la creación, actualización,
   eliminación y obtención de grupos con soporte offline-first. */

export async function getGroups(): Promise<Group[]> {
  const localGroups = await groupRepo.getAllGroups();
  if (networkState.serverOnline) {
    return localGroups.filter(g => ['backend','synced','pending','updated'].includes(g.syncStatus));
  } else {
    return localGroups.filter(g => g.syncStatus !== 'deleted');
  }
}

export async function createGroup(group: Omit<Group, "id" | "syncStatus">): Promise<Group> {
  const newGroup: Group = {
    id: crypto.randomUUID(),
    groupName: group.groupName,
    description: group.description,
    users: [],
    syncStatus: "pending" as GroupSyncStatus,
    lastModifiedAt: group.lastModifiedAt || new Date().toISOString(),
  };
  const savedGroup = await groupRepo.saveGroup(newGroup);
  // ✅ Se notifica inmediatamente del nuevo grupo optimista.
  groupSensor.emit("item-synced", savedGroup);
  // ✅ Se dispara la sincronización en segundo plano.
  syncPendingGroups();
  return savedGroup;
}

export async function updateGroup(group: Group): Promise<Group> {
  const updatedGroup = {
    ...group,
    syncStatus: group.syncStatus === "synced" ? "updated" as GroupSyncStatus : group.syncStatus,
    lastModifiedAt: new Date().toISOString(),
  };
  const savedGroup = await groupRepo.saveGroup(updatedGroup);
  // ✅ Se notifica inmediatamente del cambio optimista.
  groupSensor.emit("item-synced", savedGroup);
  // ✅ Se dispara la sincronización en segundo plano.
  syncPendingGroups();
  return savedGroup;
}

export async function deleteGroup(group: Group): Promise<Group> {
  const deletedGroup = {
    ...group,
    syncStatus: "deleted" as GroupSyncStatus,
    lastModifiedAt: new Date().toISOString(),
  };
  const savedGroup = await groupRepo.saveGroup(deletedGroup);
  // ✅ Se notifica inmediatamente del cambio optimista.
 groupSensor.emit("itemDeleted", savedGroup.id);
  // ✅ Se dispara la sincronización en segundo plano.
  syncPendingGroups();
  return savedGroup;
}
