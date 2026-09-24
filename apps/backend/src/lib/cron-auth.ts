/**
 * Every scheduled-job route checks this before doing anything — these
 * endpoints run with no admin session (called by an external scheduler,
 * not a signed-in user) and use the service-role client internally, so a
 * shared secret is the only thing standing between them and the public
 * internet.
 */
export function isAuthorizedCronRequest(req: { headers: Record<string, string | string[] | undefined> }): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("CRON_SECRET is not configured — refusing all cron requests.");
    return false;
  }

  const header = req.headers.authorization;
  return header === `Bearer ${secret}`;
}
