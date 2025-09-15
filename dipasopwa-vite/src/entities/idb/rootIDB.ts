// src/entities/idb/rootDB.ts
import type { AuthDB } from "./authIDB";
import type { TokenDB } from "./tokenIDB";
import type { GroupDB } from "./groupIDB";
import type { UserDB } from "./userIDB";

// Combina todos en uno solo
export interface dipasopwa extends AuthDB, TokenDB, GroupDB, UserDB {}
