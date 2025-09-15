// src/entities/idb/tokendIDB
// .ts
// src/entities/idb/tokenIDB.ts
import type { DBSchema } from "idb";
import type { Token, TokenSyncStatus } from "../api/tokenAPI";

export interface TokenDB extends DBSchema {
  tokens: {
    key: string; // corresponde al campo `id` de Token
    value: Token;
    indexes: {
      by_syncStatus: TokenSyncStatus;
      by_expiresAt: number;
    };
  };
}
