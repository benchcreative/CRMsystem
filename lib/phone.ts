// Customer phone numbers are stored as free-text UK-style strings (e.g.
// "07700 900001"), but Twilio requires E.164. Good enough for a UK-only
// business; numbers already in international format are left alone.
export function toE164(phone: string): string {
  const digitsOnly = phone.replace(/\s+/g, "");
  if (digitsOnly.startsWith("+")) return digitsOnly;
  if (digitsOnly.startsWith("0")) return `+44${digitsOnly.slice(1)}`;
  return `+${digitsOnly}`;
}
