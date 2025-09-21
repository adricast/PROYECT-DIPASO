// src/entities/idb/rootIDB.ts
import type { AuthDB } from "./authIDB";
import type { TokenDB } from "./tokenIDB";
import type { GroupDB } from "./groupIDB";
import type { UserDB } from "./userIDB";
// ✅ CORRECCIÓN: Eliminamos la importación de GroupLogDB

// Combina todos en uno solo
export interface dipasopwa extends AuthDB, TokenDB, GroupDB, UserDB {}