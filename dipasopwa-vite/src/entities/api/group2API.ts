import type { User } from "./userAPI";

export interface Group {
  /** ID oficial del servidor */
  groupId: string | number;

  /** Nombre del grupo */
  groupName: string;

  /** Descripción opcional */
  description?: string;

  /** Relación con usuarios */
  users?: User[];

  /** Fecha de última modificación */
  lastModifiedAt: string;
}
