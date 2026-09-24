// This runs in the backend, linking into the SEPARATE admin app — not the
// same origin as the public site, so it needs its own URL, not
// NEXT_PUBLIC_SITE_URL (that's the public frontend's).
const ADMIN_URL = process.env.ADMIN_URL ?? "http://localhost:3001";

export function adminNotificationEmail({
  title,
  body,
  linkPath,
}: {
  title: string;
  body: string;
  linkPath: string;
}) {
  return {
    subject: title,
    html: `
      <p>${body}</p>
      <p><a href="${ADMIN_URL}${linkPath}">View in admin</a></p>
      <p style="color:#888;font-size:12px">Spiritual Elevation Ministry — admin notification</p>
    `,
  };
}

export function visitorRequestConfirmationEmail({ name }: { name: string }) {
  return {
    subject: "We received your message",
    html: `
      <p>Hi ${name},</p>
      <p>Thank you for reaching out to Spiritual Elevation Ministry. We've received your
      request and someone from the ministry will be in touch soon.</p>
      <p style="color:#888;font-size:12px">[SAMPLE] Placeholder email copy — replace before launch.</p>
    `,
  };
}
