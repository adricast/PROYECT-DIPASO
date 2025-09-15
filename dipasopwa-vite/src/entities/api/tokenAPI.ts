// src/entities/api/tokenApi.ts
export type TokenSyncStatus = "synced" | "expired" | "pending" | "deleted";

export interface Token {
  id: string; 
  key: string;                   // Puede ser "auth_token" o relacionado al userId
  token: string;
  expiresAt: number;    // timestamp de expiración
  syncStatus: TokenSyncStatus;
}
