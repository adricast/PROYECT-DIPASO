export type UserSyncStatus = "pending" | "synced" | "deleted";

// Usuario
export interface User {
  userId?: string;       // UUID del backend
  tempId?: string;       // ID temporal offline
  username: string;
  name: string;
  groupId?: string;      // referencia al grupo
  syncStatus?: UserSyncStatus;
  users?: User[];       // usuarios locales o cache
}