import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

// Resend's sandbox sender — works without a verified domain, but can only
// send to the email address the Resend account itself was signed up with.
// Swap this for a verified domain address once one is set up.
export const QUOTE_SENDER_EMAIL = "onboarding@resend.dev";
