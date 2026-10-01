import { Resend } from "resend";

// Built lazily rather than at module load, matching lib/twilio.ts: the
// Resend constructor throws without an API key, which would otherwise crash
// any page or build step that imports the email helpers.
export function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

// Resend's sandbox sender — works without a verified domain, but can only
// send to the email address the Resend account itself was signed up with.
// Swap this for a verified domain address once one is set up.
export const QUOTE_SENDER_EMAIL = "onboarding@resend.dev";
