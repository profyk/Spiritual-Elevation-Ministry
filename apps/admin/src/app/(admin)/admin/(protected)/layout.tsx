import Image from "next/image";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/get-admin";
import { adminApiFetchServer } from "@/lib/api-client";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { SignOutButton } from "@/components/admin/SignOutButton";
import { NotificationBell } from "@/components/admin/NotificationBell";
import { ThemeToggle } from "@/components/admin/ThemeToggle";

const MFA_MANDATORY_ROLES = new Set(["admin", "super_admin"]);

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  const { admin, mfaCurrentLevel, mfaNextLevel } = session;

  const mfaRequired = MFA_MANDATORY_ROLES.has(admin.role);
  const hasEnrolledFactor = mfaNextLevel === "aal2";

  if (mfaRequired && !hasEnrolledFactor) {
    // Admin/Super Admin must enroll TOTP before doing anything else (SPEC §22).
    redirect("/admin/mfa/enroll");
  }

  if (hasEnrolledFactor && mfaCurrentLevel !== "aal2") {
    // Factor exists but this session hasn't completed the challenge yet.
    redirect("/admin/mfa/verify");
  }

  const notifications = await adminApiFetchServer<
    { id: string; title: string; body: string | null; link_url: string | null; is_read: boolean; created_at: string }[]
  >("/admin/notifications", session.accessToken);

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <header className="flex flex-shrink-0 items-center justify-between border-b border-line bg-surface px-6 py-3">
        <div className="flex items-center gap-3">
          <Image src="/brand/logo.png" alt="" aria-hidden width={36} height={36} className="rounded-sm" />
          <span className="font-medium">Spiritual Elevation Ministry — Admin</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <NotificationBell adminId={admin.id} initialNotifications={notifications ?? []} />
          <SignOutButton />
        </div>
      </header>
      <div className="flex min-h-0 flex-1">
        <AdminSidebar role={admin.role} />
        <main className="min-w-0 flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
