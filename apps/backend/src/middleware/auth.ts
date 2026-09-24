import type { Request, Response, NextFunction } from "express";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createUserScopedClient } from "../lib/supabase";
import type { AdminRole } from "@sem/shared";

const ROLE_RANK: Record<AdminRole, number> = {
  moderator: 0,
  staff: 1,
  admin: 2,
  super_admin: 3,
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** Present whenever the caller sent a valid Supabase access token —
       * a visitor's anonymous session or a staff member's session alike. */
      userId?: string;
      /** The same token, wrapped in a Supabase client — every RLS policy
       * in supabase/migrations applies exactly as it would to a direct
       * browser request using this token. */
      userClient?: SupabaseClient;
      /** Only set once requireAdmin() has confirmed an active admin_users
       * row for this caller. */
      admin?: { id: string; role: AdminRole; isActive: boolean };
    }
  }
}

/**
 * Always runs first (mounted at the app level): resolves whoever sent the
 * request, if anyone, without requiring it. Routes that need a specific
 * identity layer their own requireVisitor/requireAdmin on top.
 */
export async function attachIdentity(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (token) {
    const client = createUserScopedClient(token);
    const {
      data: { user },
    } = await client.auth.getUser();
    if (user) {
      req.userId = user.id;
      req.userClient = client;
    }
  }

  next();
}

/** Any authenticated Supabase identity — a chatting visitor or staff alike. */
export function requireVisitor(req: Request, res: Response, next: NextFunction) {
  if (!req.userId || !req.userClient) {
    return res.status(401).json({ error: "No session." });
  }
  next();
}

/**
 * An active admin_users row at or above minRole. Reads admin_users through
 * the caller's OWN token-scoped client — RLS's "admin reads own profile"
 * policy is what actually permits this, not a service-role bypass, so this
 * check can never see a role the caller doesn't really have.
 */
export function requireAdmin(minRole: AdminRole = "moderator") {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.userId || !req.userClient) {
      return res.status(401).json({ error: "No session." });
    }

    const { data, error } = await req.userClient
      .from("admin_users")
      .select("id, role, is_active")
      .eq("id", req.userId)
      .maybeSingle();

    if (error || !data || !data.is_active) {
      return res.status(403).json({ error: "Not authorized." });
    }

    if (ROLE_RANK[data.role as AdminRole] < ROLE_RANK[minRole]) {
      return res.status(403).json({ error: "Not authorized." });
    }

    req.admin = { id: data.id, role: data.role as AdminRole, isActive: data.is_active };
    next();
  };
}
