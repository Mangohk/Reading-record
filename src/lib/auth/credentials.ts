/**
 * Detect whether Google OAuth / service-account env is present.
 * Never invent or hardcode secrets — only report configuration status.
 */

export function hasGoogleOAuthConfigured(): boolean {
  const clientId =
    process.env.AUTH_GOOGLE_ID?.trim() || process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret =
    process.env.AUTH_GOOGLE_SECRET?.trim() ||
    process.env.GOOGLE_CLIENT_SECRET?.trim();
  const secret =
    process.env.AUTH_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim();
  return Boolean(clientId && clientSecret && secret);
}

export function hasServiceAccountConfigured(): boolean {
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim()) return true;
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64?.trim()) return true;
  if (
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim() &&
    process.env.GOOGLE_PRIVATE_KEY?.trim()
  ) {
    return true;
  }
  if (
    process.env.GOOGLE_SERVICE_ACCOUNT_PATH?.trim() ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim()
  ) {
    return true;
  }
  return false;
}
