// src/db/indexedDB.ts
import type { dipasopwa } from "../../entities/idb/rootIDB";
import { openDB, type IDBPDatabase } from "idb";

let dbInstance: IDBPDatabase<dipasopwa> | null = null;

export const getDB = async () => {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<dipasopwa>("dipasopwa-db", 4, { // versión 4
    upgrade(db, _oldVersion) {
      // --- Auths ---
      if (!db.objectStoreNames.contains("auths")) {
        const authStore = db.createObjectStore("auths", { keyPath: "auth_id", autoIncrement: true });
        authStore.createIndex("by_syncStatus", "syncStatus");
        authStore.createIndex("by_tempId", "tempId");
      }

      // --- Tokens ---
      if (!db.objectStoreNames.contains("tokens")) {
        const tokenStore = db.createObjectStore("tokens", { keyPath: "key" });
        tokenStore.createIndex("by_expiresAt", "expiresAt");
      }

      // --- Groups ---
      if (!db.objectStoreNames.contains("groups")) {
        const groupStore = db.createObjectStore("groups", { keyPath: "groupId" });
        groupStore.createIndex("by_syncStatus", "syncStatus");
        groupStore.createIndex("by_tempId", "tempId");
      }

      // --- Users ---
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
