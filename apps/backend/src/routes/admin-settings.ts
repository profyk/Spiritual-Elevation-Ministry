import { randomBytes } from "node:crypto";
import { Router } from "express";
import { requireAdmin } from "../middleware/auth";
import { writeAuditLog } from "../lib/audit";
import { createServiceRoleClient } from "../lib/supabase";
import { canManageAdminUsers, createAdminUserSchema } from "@sem/shared";
import type { AdminRole } from "@sem/shared";

export const adminSettingsRouter = Router();

function generateTempPassword(): string {
  // 24 random bytes, base64url — well above Supabase's minimum, no
  // ambiguous characters to transcribe if it's read aloud/typed manually.
  return randomBytes(24).toString("base64url");
}

// ── Settings — admin+ ────────────────────────────────────────────────────

adminSettingsRouter.get("/settings", requireAdmin("admin"), async (req, res) => {
  const keys = String(req.query.keys ?? "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  const { data, error } = await req.userClient!
    .from("website_settings")
    .select("key, value")
    .in("key", keys.length > 0 ? keys : ["__none__"]);
  if (error) return res.status(500).json({ error: "Query failed." });

  const result: Record<string, unknown> = {};
  for (const row of data ?? []) result[row.key] = row.value;
  res.json(result);
});

adminSettingsRouter.put("/settings/:key", requireAdmin("admin"), async (req, res) => {
  const value = req.body?.value;
  if (typeof value !== "string") return res.status(400).json({ error: "value must be a string." });

  const { error } = await req.userClient!
    .from("website_settings")
    .upsert({ key: req.params.key, value, updated_by: req.admin!.id, updated_at: new Date().toISOString() });
  if (error) return res.status(500).json({ error: error.message });

  await writeAuditLog(req.userClient!, {
    actorId: req.admin!.id,
    action: "settings.update",
    entityType: "website_settings",
    entityId: req.params.key,
  });

  res.json({ ok: true });
});

// ── Legal pages — write is admin+; public read is GET /legal-pages/:type ─

adminSettingsRouter.put("/legal-pages/:type", requireAdmin("admin"), async (req, res) => {
  if (!["privacy_policy", "terms_of_use"].includes(req.params.type)) {
    return res.status(400).json({ error: "Invalid legal page type." });
  }
  const body = req.body?.body;
  if (typeof body !== "string") return res.status(400).json({ error: "body must be a string." });

  const { error } = await req.userClient!.from("legal_pages").upsert(
    { page_type: req.params.type, body, updated_by: req.admin!.id, updated_at: new Date().toISOString() },
    { onConflict: "page_type" }
  );
  if (error) return res.status(500).json({ error: error.message });

  await writeAuditLog(req.userClient!, {
    actorId: req.admin!.id,
    action: "legal_page.update",
    entityType: "legal_pages",
    entityId: req.params.type,
  });

  res.json({ ok: true });
});

// ── Users & roles — super_admin only ─────────────────────────────────────

/**
 * Only Super Admin creates new admin accounts, and only from here — SPEC
 * §21/§27 ("only Super Admin manages other users"). There's no self-serve
 * signup for /admin anywhere. Creating a Supabase Auth user is inherently
 * a service-role operation (RLS governs table rows, not identity
 * creation), so this is one of the few routes that reaches for it — but
 * only for that one call; the admin_users row itself is still inserted
 * through the caller's own token so RLS's "super admin manages staff
 * profiles" policy is what actually authorizes the row, not the service
 * role bypass.
 */
adminSettingsRouter.post("/users", requireAdmin("super_admin"), async (req, res) => {
  if (!canManageAdminUsers(req.admin as { id: string; role: AdminRole; isActive: boolean })) {
    return res.status(403).json({ error: "Not authorized." });
  }

  const parsed = createAdminUserSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input.", issues: parsed.error.flatten() });
  }

  const tempPassword = generateTempPassword();
  const serviceClient = createServiceRoleClient();

  const { data: authUser, error: authError } = await serviceClient.auth.admin.createUser({
    email: parsed.data.email,
    password: tempPassword,
    email_confirm: true,
  });

  if (authError || !authUser.user) {
    // Most common cause: the email is already registered.
    return res.status(400).json({ error: authError?.message ?? "Could not create the account." });
  }

  const { error: insertError } = await req.userClient!.from("admin_users").insert({
    id: authUser.user.id,
    full_name: parsed.data.fullName,
    role: parsed.data.role,
  });

  if (insertError) {
    // Roll back the orphaned auth user rather than leave a login with no
    // admin_users row (which would just 403 forever, confusingly).
    await serviceClient.auth.admin.deleteUser(authUser.user.id);
    return res.status(500).json({ error: insertError.message });
  }

  await writeAuditLog(req.userClient!, {
    actorId: req.admin!.id,
    action: "admin_user.create",
    entityType: "admin_users",
    entityId: authUser.user.id,
    changes: { email: parsed.data.email, role: parsed.data.role },
  });

  // The only time this password is ever visible — shown once in the admin
  // UI so the Super Admin can hand it to the new admin out of band; there's
  // no way to retrieve it again after this response.
  res.status(201).json({ id: authUser.user.id, email: parsed.data.email, tempPassword });
});

adminSettingsRouter.get("/users", requireAdmin("super_admin"), async (req, res) => {
  const { data, error } = await req.userClient!
    .from("admin_users")
    .select("id, full_name, role, is_active")
    .order("full_name");
  if (error) return res.status(500).json({ error: "Query failed." });
  res.json(data ?? []);
});

adminSettingsRouter.patch("/users/:id/role", requireAdmin("super_admin"), async (req, res) => {
  if (!canManageAdminUsers(req.admin as { id: string; role: AdminRole; isActive: boolean })) {
    return res.status(403).json({ error: "Not authorized." });
  }
  const role = req.body?.role;
  if (!["moderator", "staff", "admin", "super_admin"].includes(role)) {
    return res.status(400).json({ error: "Invalid role." });
  }

  const { error } = await req.userClient!.from("admin_users").update({ role }).eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });

  await writeAuditLog(req.userClient!, {
    actorId: req.admin!.id,
    action: "admin_user.role_change",
    entityType: "admin_users",
    entityId: req.params.id,
    changes: { role },
  });

  res.json({ ok: true });
});

adminSettingsRouter.patch("/users/:id/active", requireAdmin("super_admin"), async (req, res) => {
  const isActive = Boolean(req.body?.isActive);
  const { error } = await req.userClient!.from("admin_users").update({ is_active: isActive }).eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });

  await writeAuditLog(req.userClient!, {
    actorId: req.admin!.id,
    action: "admin_user.active_change",
    entityType: "admin_users",
    entityId: req.params.id,
    changes: { is_active: isActive },
  });

  res.json({ ok: true });
});

// ── Audit log — admin+, read-only ────────────────────────────────────────

adminSettingsRouter.get("/audit-log", requireAdmin("admin"), async (req, res) => {
  const { data, error } = await req.userClient!
    .from("audit_log")
    .select("id, actor_id, action, entity_type, entity_id, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) return res.status(500).json({ error: "Query failed." });
  res.json(data ?? []);
});

// ── Notifications — any admin, scoped to their own rows ──────────────────

adminSettingsRouter.get("/notifications", requireAdmin("moderator"), async (req, res) => {
  const { data, error } = await req.userClient!
    .from("notifications")
    .select("id, title, body, link_url, is_read, created_at")
    .eq("recipient_admin_id", req.admin!.id)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) return res.status(500).json({ error: "Query failed." });
  res.json(data ?? []);
});

adminSettingsRouter.patch("/notifications/:id/read", requireAdmin("moderator"), async (req, res) => {
  await req.userClient!
    .from("notifications")
    .update({ is_read: true })
    .eq("id", req.params.id)
    .eq("recipient_admin_id", req.admin!.id);
  res.json({ ok: true });
});

adminSettingsRouter.patch("/notifications/read-all", requireAdmin("moderator"), async (req, res) => {
  await req.userClient!
    .from("notifications")
    .update({ is_read: true })
    .eq("recipient_admin_id", req.admin!.id)
    .eq("is_read", false);
  res.json({ ok: true });
});

adminSettingsRouter.get("/notification-preferences", requireAdmin("moderator"), async (req, res) => {
  const { data, error } = await req.userClient!
    .from("notification_preferences")
    .select("category, email_enabled")
    .eq("admin_id", req.admin!.id);
  if (error) return res.status(500).json({ error: "Query failed." });
  res.json(data ?? []);
});

adminSettingsRouter.put("/notification-preferences/:category", requireAdmin("moderator"), async (req, res) => {
  const emailEnabled = Boolean(req.body?.emailEnabled);
  const { error } = await req.userClient!
    .from("notification_preferences")
    .upsert(
      { admin_id: req.admin!.id, category: req.params.category, email_enabled: emailEnabled },
      { onConflict: "admin_id,category" }
    );
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});
