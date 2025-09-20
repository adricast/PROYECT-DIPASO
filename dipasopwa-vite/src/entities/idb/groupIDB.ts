
// src/entities/idb/groupIDB.ts
import type { DBSchema } from "idb";
import type { Group } from "../api/groupAPI";

export interface GroupDB extends DBSchema {
  groups: {
    key: string|number; // id o tempId
    value: Group;
    indexes: {
       by_syncStatus: string; 
      by_tempId: string|number;     
      by_groupId: string | number; // ✅ CORRECCIÓN: Agregado el índice
      
    };
  };
   groups_log: {
    key: string; 
    value: Group & { loggedAt: string };
    indexes: {
        by_groupId: string | number;
    }
  };
}
