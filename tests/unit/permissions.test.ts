import { describe, expect, it } from "vitest";
import {
  isModeratorOrAbove,
  isStaffOrAbove,
  isAdminOrAbove,
  isSuperAdmin,
  hasAtLeastRole,
  canTransferConversation,
  canDisableRequiredDisclaimer,
  canManageAdminUsers,
  type AdminProfile,
  type AdminRole,
} from "@/lib/permissions";

function admin(role: AdminRole, overrides: Partial<AdminProfile> = {}): AdminProfile {
  return { id: "admin-1", role, isActive: true, ...overrides };
}

describe("role boundary: moderator is not staff", () => {
  // Regression test for a real bug: isStaffOrAbove() originally only
  // checked "is any active admin", which silently let Moderator manage
  // content/events/coaching/requests/chat — contradicting SPEC §21
  // ("Moderator: testimony moderation and content review only").
  it("isModeratorOrAbove accepts every active role, including moderator", () => {
    expect(isModeratorOrAbove(admin("moderator"))).toBe(true);
    expect(isModeratorOrAbove(admin("staff"))).toBe(true);
    expect(isModeratorOrAbove(admin("admin"))).toBe(true);
    expect(isModeratorOrAbove(admin("super_admin"))).toBe(true);
    expect(isModeratorOrAbove(null)).toBe(false);
  });

  it("isStaffOrAbove rejects moderator", () => {
    expect(isStaffOrAbove(admin("moderator"))).toBe(false);
  });

  it("isStaffOrAbove accepts staff, admin, and super_admin", () => {
    expect(isStaffOrAbove(admin("staff"))).toBe(true);
    expect(isStaffOrAbove(admin("admin"))).toBe(true);
    expect(isStaffOrAbove(admin("super_admin"))).toBe(true);
  });

  it("rejects a deactivated admin regardless of role", () => {
    expect(isStaffOrAbove(admin("admin", { isActive: false }))).toBe(false);
    expect(isModeratorOrAbove(admin("super_admin", { isActive: false }))).toBe(false);
  });
});

describe("isAdminOrAbove / isSuperAdmin", () => {
  it("rejects staff and moderator", () => {
    expect(isAdminOrAbove(admin("staff"))).toBe(false);
    expect(isAdminOrAbove(admin("moderator"))).toBe(false);
  });

  it("accepts admin and super_admin", () => {
    expect(isAdminOrAbove(admin("admin"))).toBe(true);
    expect(isAdminOrAbove(admin("super_admin"))).toBe(true);
  });

  it("isSuperAdmin accepts only super_admin", () => {
    expect(isSuperAdmin(admin("admin"))).toBe(false);
    expect(isSuperAdmin(admin("super_admin"))).toBe(true);
  });
});

describe("hasAtLeastRole", () => {
  it("ranks moderator < staff < admin < super_admin", () => {
    expect(hasAtLeastRole(admin("moderator"), "staff")).toBe(false);
    expect(hasAtLeastRole(admin("staff"), "staff")).toBe(true);
    expect(hasAtLeastRole(admin("admin"), "staff")).toBe(true);
    expect(hasAtLeastRole(admin("staff"), "super_admin")).toBe(false);
  });
});

describe("canTransferConversation", () => {
  it("rejects moderator entirely", () => {
    expect(canTransferConversation(admin("moderator"), { assignedTo: null })).toBe(false);
  });

  it("lets staff claim/transfer an unassigned conversation", () => {
    expect(canTransferConversation(admin("staff"), { assignedTo: null })).toBe(true);
  });

  it("lets the assigned staff member transfer their own conversation", () => {
    const me = admin("staff", { id: "staff-1" });
    expect(canTransferConversation(me, { assignedTo: "staff-1" })).toBe(true);
  });

  it("blocks staff from transferring a conversation assigned to someone else", () => {
    const me = admin("staff", { id: "staff-1" });
    expect(canTransferConversation(me, { assignedTo: "staff-2" })).toBe(false);
  });

  it("lets admin+ transfer any conversation regardless of assignment", () => {
    const me = admin("admin", { id: "admin-9" });
    expect(canTransferConversation(me, { assignedTo: "staff-2" })).toBe(true);
  });
});

describe("super-admin-only actions", () => {
  it("canDisableRequiredDisclaimer is super_admin only", () => {
    expect(canDisableRequiredDisclaimer(admin("admin"))).toBe(false);
    expect(canDisableRequiredDisclaimer(admin("super_admin"))).toBe(true);
  });

  it("canManageAdminUsers is super_admin only", () => {
    expect(canManageAdminUsers(admin("admin"))).toBe(false);
    expect(canManageAdminUsers(admin("super_admin"))).toBe(true);
  });
});
