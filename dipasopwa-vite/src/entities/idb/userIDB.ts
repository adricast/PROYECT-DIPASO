import type { DBSchema } from "idb";
import type { User } from "../api/userAPI";

export interface UserDB extends DBSchema {
  users: {
    key: string; // userId (UUID)
    value: User;
    indexes: {
      by_groupId: string;
      by_syncStatus: string;
      by_tempId: number;
    };
  };
}
