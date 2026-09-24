/**
 * App-layer permission checks (SPEC §21). These mirror the RLS policies in
 * supabase/migrations/0001_init.sql but exist independently because RLS
 * can't express every rule (e.g. "only the assigned staff member or a Super
 * Admin can transfer this conversation") — SPEC §27 requires both layers,
 * neither is a substitute for the other.
 */

import { z } from "zod";

export const adminRoleSchema = z.enum(["super_admin", "admin", "staff", "moderator"]);
export type AdminRole = z.infer<typeof adminRoleSchema>;

export interface AdminProfile {
  id: string;
  role: AdminRole;
  isActive: boolean;
}

const ROLE_RANK: Record<AdminRole, number> = {
  moderator: 0,
  staff: 1,
  admin: 2,
  super_admin: 3,
};

/**
 * Any active admin, Moderator included. Use only for what Moderator is
 * actually meant to touch — testimony moderation, content review (SPEC
 * §21). Everything else (content writes, events, coaching, requests,
 * chat) must gate on isStaffOrAbove() below instead.
 */
export function isModeratorOrAbove(admin: AdminProfile | null): admin is AdminProfile {
  return !!admin && admin.isActive;
}

export function isStaffOrAbove(admin: AdminProfile | null): admin is AdminProfile {
  return !!admin && admin.isActive && ROLE_RANK[admin.role] >= ROLE_RANK.staff;
}

export function isAdminOrAbove(admin: AdminProfile | null): boolean {
  return !!admin && admin.isActive && ROLE_RANK[admin.role] >= ROLE_RANK.admin;
}

export function isSuperAdmin(admin: AdminProfile | null): boolean {
  return !!admin && admin.isActive && admin.role === "super_admin";
}

export function hasAtLeastRole(admin: AdminProfile | null, minimum: AdminRole): boolean {
  return !!admin && admin.isActive && ROLE_RANK[admin.role] >= ROLE_RANK[minimum];
}

/**
 * A conversation may be transferred/claimed by its current assignee or by
 * anyone admin-or-above. RLS allows any staff+ user to UPDATE a conversation
 * row (needed so anyone can claim an unassigned one); this function is what
 * actually gates the "transfer" action in the UI/route handler.
 */
export function canTransferConversation(
  admin: AdminProfile | null,
  conversation: { assignedTo: string | null }
): boolean {
  if (!isStaffOrAbove(admin)) return false;
  if (isAdminOrAbove(admin)) return true;
  return conversation.assignedTo === null || conversation.assignedTo === admin.id;
}

/**
 * Only Super Admin may turn off a required disclaimer's is_required flag
 * (SPEC §37). Editing the disclaimer's text is an ordinary admin+ action.
 */
export function canDisableRequiredDisclaimer(admin: AdminProfile | null): boolean {
  return isSuperAdmin(admin);
}

/**
 * Only Super Admin may change another admin's role or deactivate them
 * (SPEC §21) — Admin can manage content/requests but not other users.
 */
export function canManageAdminUsers(admin: AdminProfile | null): boolean {
  return isSuperAdmin(admin);
}
