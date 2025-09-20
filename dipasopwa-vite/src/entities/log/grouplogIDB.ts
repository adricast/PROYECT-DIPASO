// src/entities/idb/groupLogIDB.ts
import type { DBSchema } from "idb";
import type { Group } from "../api/groupAPI";

export interface GroupLogDB extends DBSchema {
  groups_log: {
    key: string; // usa id o tempId
    value: Group & { loggedAt: string };
    indexes: {
      by_syncStatus: string;
      by_tempId: string | number;
    };
  };
}
