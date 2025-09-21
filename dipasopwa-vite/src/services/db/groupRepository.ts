// src/services/db/groupRepository.ts
import { v4 as uuidv4 } from 'uuid';
import { getDB } from "./indexed";
import type { Group, GroupSyncStatus } from "../../entities/api/groupAPI";

export class GroupRepository {
  async saveGroup(group: Group): Promise<Group> {
    const db = await getDB();
    await db.put("groups", group);
    return group;
  }
  
  // ✅ NUEVO: Método para guardar múltiples grupos de forma eficiente.
  async saveManyGroups(groups: Group[]): Promise<void> {
    const db = await getDB();
    const tx = db.transaction("groups", "readwrite");
    await Promise.all(groups.map(group => tx.store.put(group)));
    await tx.done;
  }

  async getAllGroups(): Promise<Group[]> {
    const db = await getDB();
    return await db.getAll("groups");
  }

  async getGroupsBySyncStatus(syncStatus: GroupSyncStatus): Promise<Group[]> {
    const db = await getDB();
    return await db.getAllFromIndex("groups", "by_syncStatus", syncStatus);
  }

  // ✅ NUEVO: Método para obtener todos los grupos que están pendientes de sincronización.
  async getAllPendingGroups(): Promise<Group[]> {
    const db = await getDB();
    const pending = await db.getAllFromIndex("groups", "by_syncStatus", "pending");
    const updated = await db.getAllFromIndex("groups", "by_syncStatus", "updated");
    const deleted = await db.getAllFromIndex("groups", "by_syncStatus", "deleted");
    return [...pending, ...updated, ...deleted];
  }

  async getGroupByTempId(tempId: number | string): Promise<Group | undefined> {
    const db = await getDB();
    return await db.getFromIndex("groups", "by_tempId", tempId);
  }

  async getGroupByGroupId(groupId: string | number): Promise<Group | undefined> {
    const db = await getDB();
    return await db.getFromIndex("groups", "by_groupId", groupId);
  }

  async deleteGroup(id: string): Promise<void> {
    const db = await getDB();
    await db.delete("groups", id);
  }
  
  // ✅ NUEVO: Método para limpiar toda la tabla de grupos.
  async clearAllGroups(): Promise<void> {
    const db = await getDB();
    await db.clear("groups");
  }

  // ✅ REINCORPORADO: Método para guardar el log de sincronización.
  async logSyncedGroup(group: Group, action: "add" | "update" | "delete", finalStatus: "synced" | "failed"): Promise<void> {
    const db = await getDB();
    const logEntry = {
      id: uuidv4(),
      action: action,
      module: 'groups-user-module',
      finalStatus: finalStatus,
      groupId: group.groupId || group.tempId,
      datetimesync: new Date().toISOString(),
      groupData: group
    };
    await db.add("groups_log", logEntry);
  }
}