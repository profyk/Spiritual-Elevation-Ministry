import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/get-admin";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { SignOutButton } from "@/components/admin/SignOutButton";

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

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-6 py-3">
        <span className="font-medium">Spiritual Elevation Ministry — Admin</span>
        <SignOutButton />
      </header>
      <div className="flex flex-1">
        <AdminSidebar role={admin.role} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
