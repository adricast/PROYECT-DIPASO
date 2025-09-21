// src/services/db/indexed.ts
import type { dipasopwa } from "../../entities/idb/rootIDB";
import { openDB, type IDBPDatabase } from "idb";

let dbInstance: IDBPDatabase<dipasopwa> | null = null;

export const getDB = async () => {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<dipasopwa>("dipasopwa-db", 6, {
    upgrade(db, oldVersion) {
      if (oldVersion < 6) {
        // --- Groups ---
        if (!db.objectStoreNames.contains("groups")) {
          // ✅ CORRECCIÓN CLAVE: Cambiamos `keyPath` a `id`. Este será el ID único local.
          const groupStore = db.createObjectStore("groups", { keyPath: "id" });
          groupStore.createIndex("by_syncStatus", "syncStatus");
          groupStore.createIndex("by_tempId", "tempId");
          // ✅ NUEVO ÍNDICE: Necesario para la sincronización y resolución de conflictos.
          groupStore.createIndex("by_lastModifiedAt", "lastModifiedAt");
          // ✅ NUEVO ÍNDICE: Para buscar grupos por su ID definitivo del backend.
          groupStore.createIndex("by_groupId", "groupId", { unique: true });
        }

        // --- Groups Log ---
        if (!db.objectStoreNames.contains("groups_log")) {
          // ✅ CORRECCIÓN CLAVE: Usamos 'id' como keyPath para asegurar unicidad.
          db.createObjectStore("groups_log", { keyPath: "id" });
        }
      }

      // Resto de los stores (sin cambios)
      if (!db.objectStoreNames.contains("auths")) {
        const authStore = db.createObjectStore("auths", { keyPath: "auth_id", autoIncrement: true });
        authStore.createIndex("by_syncStatus", "syncStatus");
        authStore.createIndex("by_tempId", "tempId");
      }
      if (!db.objectStoreNames.contains("tokens")) {
        const tokenStore = db.createObjectStore("tokens", { keyPath: "key" });
        tokenStore.createIndex("by_expiresAt", "expiresAt");
      }
      if (!db.objectStoreNames.contains("users")) {
        const userStore = db.createObjectStore("users", { keyPath: "userId" });
        userStore.createIndex("by_groupId", "groupId");
        userStore.createIndex("by_syncStatus", "syncStatus");
        userStore.createIndex("by_tempId", "tempId");
      }
    },
  });

  return dbInstance;
};