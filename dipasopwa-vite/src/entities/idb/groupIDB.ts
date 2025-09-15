// src/entities/idb/tokendIDB
// .ts
// src/entities/idb/tokenIDB.ts
import type { DBSchema } from "idb";
import type { Group } from "../api/groupAPI";

export interface GroupDB extends DBSchema {
  groups: {
    key: string|number; // id o tempId
    value: Group;
    indexes: {
      by_syncStatus: string; // guardamos AuthSyncStatus como string
      by_tempId: string|number;     // tempId como number
    };
  };
}
