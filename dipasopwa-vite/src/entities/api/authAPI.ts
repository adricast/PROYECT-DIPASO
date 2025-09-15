// src/entities/api/authApi.ts
export type AuthSyncStatus = "pending" | "synced" | "deleted";

export interface Auth {
  aut_id?: number;
  aut_tempId?: number;
  aut_username?: string;
  syncStatus: AuthSyncStatus;
}
