export type UserSyncStatus = "pending" | "synced" | "deleted"| "in-progress" | "updated";


// Usuario
export interface User {
  userId?: string;       // UUID del backend
  tempId?: string;       // ID temporal offline
  username: string;
  identification: string;
  email: string;
  isactive:boolean;
  groupId?: string;      // referencia al grupo
  syncStatus?: UserSyncStatus;
  users?: User[];       // usuarios locales o cache
}