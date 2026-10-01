import { createElement } from "react";
import { prisma } from "@/lib/prisma";
import { emailBrandFromSettings, sendEmail } from "@/lib/email";
import AppointmentReminderEmail from "@/emails/appointment-reminder";
import { getTwilioClient, TWILIO_FROM_NUMBER } from "@/lib/twilio";
import { toE164 } from "@/lib/phone";
import { formatCustomerName, formatCustomerAddress } from "@/lib/customer";
import { jobTypeLabels } from "@/lib/labels";

// "Roughly 24 hours away": a window around the 24h mark rather than an
// exact match, so a daily sweep (which itself runs at a fixed time, not
// continuously) doesn't miss appointments that fall a little either side.
const REMINDER_TARGET_HOURS = 24;
const REMINDER_WINDOW_HOURS = 1;

function formatAppointmentDateLabel(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatAppointmentTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, "0")}:00`;
}

function isTomorrow(date: Date): boolean {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return date.toDateString() === tomorrow.toDateString();
}

async function sendReminderSms(
  customer: { firstName: string; lastName: string; phone: string },
  companyName: string,
  dateLabel: string,
  timeLabel: string
): Promise<void> {
  const client = getTwilioClient();
  if (!client || !TWILIO_FROM_NUMBER) {
    console.error("Twilio not configured — skipping SMS reminder.");
    return;
  }

  try {
    await client.messages.create({
      from: TWILIO_FROM_NUMBER,
      to: toE164(customer.phone),
      body: `Hi ${formatCustomerName(customer)}, reminder: your appointment with ${companyName} is on ${dateLabel} at ${timeLabel}.`,
    });
  } catch (error) {
    console.error("Failed to send appointment reminder SMS:", error);
  }
}

// Single choke point for the reminder (email + SMS): both the daily cron
// sweep and the manual "Send reminder now" button call this, so the message
// content and the reminderSentAt bookkeeping can't drift between the two
// triggers or the two channels.
export async function sendAppointmentReminder(customerId: string): Promise<void> {
  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer || !customer.appointmentAt) return;

  const settings = await prisma.settings.findUnique({
    where: { id: "singleton" },
  });
  const companyName = settings?.companyName ?? "us";

  const dateLabel = formatAppointmentDateLabel(customer.appointmentAt);
  const timeLabel = formatAppointmentTime(customer.appointmentAt);

  await sendEmail({
    to: customer.email,
    subject: `Reminder: your appointment with ${companyName}`,
    context: "appointment reminder",
    react: createElement(AppointmentReminderEmail, {
      brand: emailBrandFromSettings(settings),
      firstName: customer.firstName,
      isTomorrow: isTomorrow(customer.appointmentAt),
      date: dateLabel,
      time: timeLabel,
      address: formatCustomerAddress(customer),
      jobType: jobTypeLabels[customer.jobType],
    }),
  });

  // A failed SMS must never stop the email above (already sent by this
  // point) or block reminderSentAt from being set below.
  await sendReminderSms(customer, companyName, dateLabel, timeLabel);

  // Marked regardless of send success on either channel, matching this
  // app's existing best-effort email pattern (see lib/notifications.ts) —
  // no retries, and one field covers both channels as requested.
  await prisma.customer.update({
    where: { id: customerId },
    data: { reminderSentAt: new Date() },
  });
}

// Daily sweep: appointments landing ~24h from now, for customers still at
// "quote_booked" who haven't already had a reminder sent.
export async function runDailyReminderSweep(): Promise<void> {
  const now = new Date();
  const windowStart = new Date(
    now.getTime() + (REMINDER_TARGET_HOURS - REMINDER_WINDOW_HOURS) * 60 * 60 * 1000
  );
  const windowEnd = new Date(
    now.getTime() + (REMINDER_TARGET_HOURS + REMINDER_WINDOW_HOURS) * 60 * 60 * 1000
  );

  const customers = await prisma.customer.findMany({
    where: {
      status: "quote_booked",
      appointmentAt: { gte: windowStart, lte: windowEnd },
      reminderSentAt: null,
    },
    select: { id: true },
  });

  for (const customer of customers) {
    await sendAppointmentReminder(customer.id);
  }
}
