import type { User } from "./userAPI";

export type GroupSyncStatus = "pending" | "synced" | "deleted"| "in-progress" | "updated";

export interface Group {
  groupId?: string | number; // ✅ Cambiado a groupId para coincidir con el keyPath de IndexedDB
  tempId?: string | number;
  groupName: string; // ✅ Cambiado a groupName
  description?: string;
  users?: User[];
  syncStatus?: GroupSyncStatus;
}