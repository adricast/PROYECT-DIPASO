import { getDB } from "./indexed";
import type { Group,GroupSyncStatus } from "../../entities/api/groupAPI";

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

  async getGroupByTempId(tempId: number): Promise<Group | undefined> {
    const db = await getDB();
    return await db.getFromIndex("groups", "by_tempId", tempId);
  }

  // 🔹 Aquí aclaramos que groupId es string porque es UUID
 async deleteGroup(group_id: string|number): Promise<void> {
  const db = await getDB();
  await db.delete("groups", group_id);

}
}
