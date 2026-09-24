"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Mandatory TOTP enrollment for Admin/Super Admin (SPEC §22). Staff/
 * Moderator are not routed here by the (protected) layout gate, but can
 * still reach this page voluntarily to enroll if they choose to.
 */
export default function MfaEnrollPage() {
  const router = useRouter();
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function enroll() {
      const supabase = createClient();
      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: "totp",
      });

      if (enrollError) {
        setError(enrollError.message);
        return;
      }

      setFactorId(data.id);
      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
    }

    enroll();
  }, []);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!factorId) return;
    setError(null);
    setSubmitting(true);

    const supabase = createClient();
    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code,
    });

    setSubmitting(false);

    if (verifyError) {
      setError("That code didn't work. Check the time on your authenticator app and try again.");
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-2 px-4">
      <div className="w-full max-w-sm space-y-4 rounded-lg border border-line bg-surface p-6">
        <h1 className="text-lg font-semibold">Set up two-factor authentication</h1>
        <p className="text-sm text-ink-muted">
          Required for your role. Scan this code with an authenticator app (Google
          Authenticator, Authy, 1Password, etc.), then enter the 6-digit code it shows.
        </p>

        {error && <p className="text-sm text-danger-ink">{error}</p>}

        {qrCode && (
          // eslint-disable-next-line @next/next/no-img-element -- data: URI from Supabase, not an optimizable remote image
          <img src={qrCode} alt="Scan with your authenticator app" className="mx-auto h-40 w-40" />
        )}

        {secret && (
          <p className="break-all rounded bg-surface-3 p-2 text-center text-xs text-ink-faint">
            Can&apos;t scan it? Enter this key manually: {secret}
          </p>
        )}

        <form onSubmit={handleVerify} className="space-y-3">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="6-digit code"
            className="w-full rounded-md border border-line px-3 py-2 text-center text-sm tracking-widest"
          />
          <button
            type="submit"
            disabled={submitting || !factorId}
            className="w-full rounded-md bg-solid px-3 py-2 text-sm font-medium text-on-solid disabled:opacity-50"
          >
            {submitting ? "Verifying…" : "Verify & continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
