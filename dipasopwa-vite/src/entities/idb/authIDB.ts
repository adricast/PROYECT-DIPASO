import type { DBSchema } from "idb";
import type { Auth } from "../api/authAPI";

export interface AuthDB extends DBSchema {
  auths: {
    key: number; // id o tempId
    value: Auth;
    indexes: {
      by_syncStatus: string; // guardamos AuthSyncStatus como string
      by_tempId: number;     // tempId como number
    };
  };
}

