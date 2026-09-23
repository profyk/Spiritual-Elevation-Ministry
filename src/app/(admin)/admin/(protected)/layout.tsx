import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/get-admin";

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
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white px-6 py-3">
        <span className="font-medium">Spiritual Elevation Ministry — Admin</span>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
