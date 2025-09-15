import { getDB } from "./indexed";

import type { User,UserSyncStatus } from "../../entities/api/userAPI";
export class UserRepository {
  // 🔹 Guardar o actualizar un usuario
  async saveUser(user: User): Promise<User> {
    const db = await getDB();
    await db.put("users", user);
    return user;
  }

  // 🔹 Buscar todos los usuarios de un grupo
  async getUsersByGroupId(groupId: string): Promise<User[]> {
    const db = await getDB();
    return await db.getAllFromIndex("users", "by_groupId", groupId);
  }

  // 🔹 Buscar por estado de sincronización
  async getUsersBySyncStatus(syncStatus: UserSyncStatus): Promise<User[]> {
    const db = await getDB();
    return await db.getAllFromIndex("users", "by_syncStatus", syncStatus);
  }

  // 🔹 Buscar por tempId (para casos offline antes de que el backend asigne un UUID)
  async getUserByTempId(tempId: number): Promise<User | undefined> {
    const db = await getDB();
    return await db.getFromIndex("users", "by_tempId", tempId);
  }

  // 🔹 Obtener todos los usuarios
  async getAllUsers(): Promise<User[]> {
    const db = await getDB();
    return await db.getAll("users");
  }

  // 🔹 Eliminar un usuario
  async deleteUser(userId: string): Promise<void> {
    const db = await getDB();
    await db.delete("users", userId);
  }
}
