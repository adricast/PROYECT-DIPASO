// src/utils/syncStatusHelper.ts
import type { Group, GroupSyncStatus } from "../entities/api/groupAPI";

export const SyncTransitions: Record<GroupSyncStatus, GroupSyncStatus[]> = {
  pending: ["in-progress", "failed"],
  "in-progress": ["synced", "failed"],
  synced: ["updated", "deleted"],
  updated: ["in-progress", "failed"],
  deleted: ["in-progress", "failed"],
  failed: ["pending", "updated", "deleted", "in-progress"],
  backend: ["updated", "deleted"], // ✅ CORRECCIÓN: Se añade el estado 'backend'
};

export function canTransition(
  current: GroupSyncStatus,
  next: GroupSyncStatus
): boolean {
  return SyncTransitions[current].includes(next);
}

export function updateGroupStatus(
  group: Group,
  newStatus: GroupSyncStatus
): Group {
  if (!canTransition(group.syncStatus, newStatus)) {
    throw new Error(
      `Transición inválida: ${group.syncStatus} → ${newStatus}`
    );
  }
  return { ...group, syncStatus: newStatus };
}