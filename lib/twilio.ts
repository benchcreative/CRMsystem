import twilio from "twilio";

// Built lazily rather than at module load: twilio() throws immediately if
// the Account SID isn't present/well-formed, and we want a missing/invalid
// config to surface as a caught, logged failure at send time (see
// lib/reminders.ts), not a crash on import.
export function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !authToken) return null;
  return twilio(accountSid, authToken);
}

// Twilio trial number — trial accounts can only send SMS to phone numbers
// verified in the Twilio console. Swap for a paid number once upgraded.
export const TWILIO_FROM_NUMBER = process.env.TWILIO_PHONE_NUMBER;
