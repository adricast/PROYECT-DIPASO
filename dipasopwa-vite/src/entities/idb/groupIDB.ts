// src/entities/idb/groupIDB.ts
import type { DBSchema } from "idb";
import type { Group } from "../api/groupAPI";

// Define la estructura para un registro de log
interface GroupLogEntry {
  id: string|number;
  action: "add" | "update" | "delete";
  module: string;
  finalStatus: "synced" | "failed";
  groupId?: string | number;
  datetimesync: string;
  groupData: Group;
}

export interface GroupDB extends DBSchema {
  groups: {
    // ✅ CORRECCIÓN 1: La clave (`keyPath`) es siempre 'id' y es un string (UUID).
    key: string;
    // El valor es el objeto `Group` que ya definimos.
    value: Group;
    indexes: {
      by_syncStatus: "pending" | "in-progress" | "synced" | "updated" | "deleted" | "failed" | "backend";
      by_tempId: string | number;
      by_groupId: string | number;
      // ✅ CORRECCIÓN 2: Agregado el índice `by_lastModifiedAt`, necesario para la resolución de conflictos.
      by_lastModifiedAt: string;
    };
  };
  groups_log: {
    // ✅ CORRECCIÓN 3: La clave es el UUID único del registro de log.
    key: string;
    // ✅ CORRECCIÓN 4: El valor es de tipo `GroupLogEntry`, que define la estructura del log.
    value: GroupLogEntry;
    indexes: {
      by_groupId: string | number;
    };
  };
}