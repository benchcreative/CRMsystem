// Name of the visually hidden field in both public booking forms (/book and
// the embed widget). Real visitors never see it, so any value means a bot.
// Kept in its own module so client components can import it without pulling
// in lib/booking.ts's server-only dependencies.
export const HONEYPOT_FIELD = "website";
