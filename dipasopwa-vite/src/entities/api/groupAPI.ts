// src/entities/api/groupAPI.ts
import type { User } from "./userAPI";

export type GroupSyncStatus =
  | "pending"      // creado offline, esperando sincronización
  | "in-progress"  // en proceso de enviar al backend
  | "synced"       // sincronizado correctamente
  | "updated"      // modificado offline después de haber estado sincronizado
  | "deleted"      // marcado para eliminar
  | "failed"      // error al sincronizar
  | "backend";

export interface Group {
  /** ✅ NUEVO: ID único local para IndexedDB (tempId o groupId) */
  id?: string | number;

  /** ID oficial del servidor (si ya existe en backend) */
  groupId?: string | number;
  tempId?: string | number;

  /** Nombre del grupo */
  groupName: string;

  /** Descripción opcional */
  description?: string;

  /** Relación con usuarios */
  users?: User[];

  /** Estado de sincronización */
  syncStatus: GroupSyncStatus;
}