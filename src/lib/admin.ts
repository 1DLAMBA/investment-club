/**
 * Only the original seeded admin (SEED_ADMIN_EMAIL) can create other admin
 * accounts — every other admin is capped at the regular admin powers
 * (manage companies, credit wallets, approve requests) and can't mint more
 * admins. Shared between the server action and the page that gates the UI.
 */
export function isOwnerAdmin(email: string) {
  const ownerEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@example.com";
  return email.toLowerCase() === ownerEmail.toLowerCase();
}
