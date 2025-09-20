// src/services/db/groupRepository.ts
import { getDB } from "./indexed";
import type { Group, GroupSyncStatus } from "../../entities/api/groupAPI";

export class GroupRepository {
  async saveGroup(group: Group): Promise<Group> {
    const db = await getDB();
    await db.put("groups", group);
    return group;
  }

  async getAllGroups(): Promise<Group[]> {
    const db = await getDB();
    return await db.getAll("groups");
  }

  async getGroupsBySyncStatus(syncStatus: GroupSyncStatus): Promise<Group[]> {
    const db = await getDB();
    return await db.getAllFromIndex("groups", "by_syncStatus", syncStatus);
  }

  async getGroupByTempId(tempId: number | string): Promise<Group | undefined> {
    const db = await getDB();
    return await db.getFromIndex("groups", "by_tempId", tempId);
  }

  async getGroupByGroupId(groupId: string | number): Promise<Group | undefined> {
    const db = await getDB();
    return await db.getFromIndex("groups", "by_groupId", groupId);
  }

  async deleteGroup(group_id: string | number): Promise<void> {
    const db = await getDB();
    await db.delete("groups", group_id);
  }

  /***********************/
  /* Nuevo método para borrar por groupId */
  /***********************/
  async deleteGroupByGroupId(groupId: string | number): Promise<void> {
    const db = await getDB();
    const groupToDelete = await this.getGroupByGroupId(groupId);
    if (groupToDelete && groupToDelete.tempId !== undefined) {
      await db.delete("groups", groupToDelete.tempId);
    }
  }

  async logSyncedGroup(group: Group): Promise<void> {
    const db = await getDB();
    const logRecord: Group & { loggedAt: string } = {
      ...group,
      loggedAt: new Date().toISOString(),
    };
    await db.put("groups_log", logRecord);
  }

  async deleteGroupByTempId(tempId: string | number): Promise<void> {
    const db = await getDB();
    await db.delete("groups", tempId);
  }
}