import type {
  JobType,
  Source,
  Status,
  QuoteStatus,
  ContactLogDirection,
  JobStatus,
} from "@prisma/client";

export const jobTypeLabels: Record<JobType, string> = {
  kitchen: "Kitchen",
  bathroom: "Bathroom",
  bedroom: "Bedroom",
};

export const sourceLabels: Record<Source, string> = {
  facebook: "Facebook",
  google: "Google",
  referral: "Referral",
  walk_in: "Walk-in",
  website: "Website",
};

export const statusLabels: Record<Status, string> = {
  new: "New",
  quote_booked: "Quote Booked",
  quoted: "Quoted",
  won: "Won",
  lost: "Lost",
};

export const jobTypeOrder: JobType[] = ["kitchen", "bathroom", "bedroom"];

export const sourceOrder: Source[] = [
  "facebook",
  "google",
  "referral",
  "walk_in",
  "website",
];

export const statusOrder: Status[] = [
  "new",
  "quote_booked",
  "quoted",
  "won",
  "lost",
];

// "Quoted" is system-set only (see app/(internal)/quotes/actions.ts —
// applyQuoteStatus sets it automatically when a quote is sent), so it's
// excluded from the manual status dropdown on the customer form. Every
// other status remains freely selectable there, since real outcomes
// sometimes happen outside the system.
export const manualStatusOrder: Status[] = [
  "new",
  "quote_booked",
  "won",
  "lost",
];

// Paid channels tracked on the /marketing spend page — referral/walk-in/
// website aren't ad-spend sources, so they're excluded here even though
// they're valid Customer.source values.
export const adSpendSourceOrder: Source[] = ["facebook", "google"];

export function isAdSpendSource(value: string): value is Source {
  return (adSpendSourceOrder as string[]).includes(value);
}

export function isJobType(value: string): value is JobType {
  return (jobTypeOrder as string[]).includes(value);
}

export function isSource(value: string): value is Source {
  return (sourceOrder as string[]).includes(value);
}

export function isStatus(value: string): value is Status {
  return (statusOrder as string[]).includes(value);
}

export const jobStatusLabels: Record<JobStatus, string> = {
  not_scheduled: "Not scheduled",
  scheduled: "Scheduled",
  complete: "Complete",
};

export const jobStatusOrder: JobStatus[] = [
  "not_scheduled",
  "scheduled",
  "complete",
];

export function isJobStatus(value: string): value is JobStatus {
  return (jobStatusOrder as string[]).includes(value);
}

export const quoteStatusLabels: Record<QuoteStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  accepted: "Accepted",
  declined: "Declined",
};

export const quoteStatusOrder: QuoteStatus[] = [
  "draft",
  "sent",
  "accepted",
  "declined",
];

export const contactLogDirectionLabels: Record<ContactLogDirection, string> = {
  outbound_call: "Outbound call",
  inbound_call: "Inbound call",
  outbound_email: "Outbound email",
  outbound_sms: "Outbound text",
};

// Days of silence allowed before a customer in this status needs a
// follow-up. `null` means that status is never flagged.
const FOLLOW_UP_THRESHOLD_DAYS: Record<Status, number | null> = {
  new: 1,
  quote_booked: null,
  quoted: 6,
  won: null,
  lost: null,
};

export function needsFollowUp(
  status: Status,
  lastContactedAt: Date | null
): boolean {
  const thresholdDays = FOLLOW_UP_THRESHOLD_DAYS[status];
  if (thresholdDays === null) return false;
  if (!lastContactedAt) return true;

  const thresholdMs = thresholdDays * 24 * 60 * 60 * 1000;
  return Date.now() - lastContactedAt.getTime() > thresholdMs;
}
