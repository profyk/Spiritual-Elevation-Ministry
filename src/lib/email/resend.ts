/**
 * Thin wrapper around Resend (SPEC §19). No-ops with a console warning if
 * RESEND_API_KEY isn't configured, so the rest of the app never has to
 * branch on whether email is set up — every call site just calls
 * sendEmail() and moves on.
 */
export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    console.warn(`sendEmail skipped (no RESEND_API_KEY/EMAIL_FROM configured): "${subject}" -> ${to}`);
    return;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, html }),
    });

    if (!response.ok) {
      console.error("Resend send failed", response.status, await response.text());
    }
  } catch (error) {
    // Email is never allowed to block the caller's real action (e.g.
    // submitting a request) — log and move on.
    console.error("sendEmail failed", error);
  }
}
