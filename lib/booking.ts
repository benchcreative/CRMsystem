import { createElement } from "react";
import { revalidatePath } from "next/cache";
import type { JobType, Settings } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isJobType, jobTypeLabels } from "@/lib/labels";
import { formatCustomerName, formatCustomerAddress } from "@/lib/customer";
import { emailBrandFromSettings, sendEmail } from "@/lib/email";
import BookingConfirmationEmail from "@/emails/booking-confirmation";
import BookingReceivedEmail from "@/emails/booking-received";
import { cleanUtmValue, sourceFromUtm } from "@/lib/utm";
import { HONEYPOT_FIELD } from "@/lib/honeypot";

// Shared by the /book page (server action) and the embeddable widget's
// public API (/api/public/book, /api/public/availability), so both entry
// points apply identical slot rules, validation and customer creation.

// Fixed business hours: hourly slots, closed Sundays.
const OPEN_HOUR = 9;
const CLOSE_HOUR = 17; // last bookable slot starts at 16:00
const BOOKING_WINDOW_DAYS = 30;

// Public input — cap lengths so a crafted submission can't store
// arbitrarily large strings.
const MAX_FIELD_LENGTH = 200;
const MAX_NOTES_LENGTH = 2000;

function isClosedDay(date: Date): boolean {
  return date.getDay() === 0; // Sunday
}

function parseDateOnly(dateStr: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  const date = new Date(`${dateStr}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function getAvailableSlots(dateStr: string): Promise<string[]> {
  const date = parseDateOnly(dateStr);
  if (!date || isClosedDay(date)) return [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + BOOKING_WINDOW_DAYS);
  if (date < today || date > maxDate) return [];

  const dayStart = new Date(date);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const booked = await prisma.customer.findMany({
    where: { appointmentAt: { gte: dayStart, lte: dayEnd } },
    select: { appointmentAt: true },
  });
  const bookedTimes = new Set(
    booked.map((c) => {
      const t = c.appointmentAt!;
      return `${String(t.getHours()).padStart(2, "0")}:00`;
    })
  );

  const now = new Date();
  const isToday = date.getTime() === today.getTime();

  const slots: string[] = [];
  for (let hour = OPEN_HOUR; hour < CLOSE_HOUR; hour++) {
    const slot = `${String(hour).padStart(2, "0")}:00`;
    if (bookedTimes.has(slot)) continue;

    if (isToday) {
      const slotDate = new Date(date);
      slotDate.setHours(hour, 0, 0, 0);
      if (slotDate.getTime() <= now.getTime()) continue;
    }

    slots.push(slot);
  }

  return slots;
}

export type BookingFields = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  addressLine1: string;
  addressLine2: string;
  postcode: string;
  jobType: string;
  notes: string;
  date: string;
  time: string;
};

export type BookingInput = {
  fields: BookingFields;
  utm: {
    source: string | null;
    medium: string | null;
    campaign: string | null;
    content: string | null;
  };
  honeypot: string;
};

// `get` abstracts over FormData (server action) and a parsed JSON body
// (public API), which use the same field names.
export function readBookingInput(get: (key: string) => unknown): BookingInput {
  const text = (key: string, max = MAX_FIELD_LENGTH) => {
    const value = get(key);
    return typeof value === "string" ? value.trim().slice(0, max) : "";
  };

  return {
    fields: {
      firstName: text("firstName"),
      lastName: text("lastName"),
      phone: text("phone"),
      email: text("email"),
      addressLine1: text("addressLine1"),
      addressLine2: text("addressLine2"),
      postcode: text("postcode"),
      jobType: text("jobType"),
      notes: text("notes", MAX_NOTES_LENGTH),
      date: text("date"),
      time: text("time"),
    },
    utm: {
      source: cleanUtmValue(get("utm_source")),
      medium: cleanUtmValue(get("utm_medium")),
      campaign: cleanUtmValue(get("utm_campaign")),
      content: cleanUtmValue(get("utm_content")),
    },
    honeypot: text(HONEYPOT_FIELD),
  };
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateBookingFields(fields: BookingFields) {
  const errors: Record<string, string> = {};

  if (!fields.firstName) errors.firstName = "First name is required.";
  if (!fields.lastName) errors.lastName = "Last name is required.";
  if (!fields.phone) errors.phone = "Phone is required.";
  if (!fields.email) {
    errors.email = "Email is required.";
  } else if (!EMAIL_PATTERN.test(fields.email)) {
    errors.email = "Enter a valid email address.";
  }
  if (!fields.addressLine1) errors.addressLine1 = "Address is required.";
  if (!fields.postcode) errors.postcode = "Postcode is required.";
  if (!isJobType(fields.jobType)) errors.jobType = "Select what you're interested in.";
  // Slot selection is optional — see submitBooking below. No error here.

  return errors;
}

function formatBookingDateLabel(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

async function sendBookingConfirmationEmail(
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    addressLine1: string;
    addressLine2: string | null;
    postcode: string;
    jobType: JobType;
  },
  appointmentAt: Date | null,
  settings: Settings | null
): Promise<void> {
  const brand = emailBrandFromSettings(settings);

  // Best-effort: sendEmail logs failures, and a failed email must never
  // undo or block the booking itself.
  if (appointmentAt) {
    await sendEmail({
      to: customer.email,
      subject: `You're booked in with ${brand.companyName}`,
      context: "booking confirmation",
      react: createElement(BookingConfirmationEmail, {
        brand,
        firstName: customer.firstName,
        date: formatBookingDateLabel(appointmentAt),
        time: `${String(appointmentAt.getHours()).padStart(2, "0")}:00`,
        address: formatCustomerAddress(customer),
        jobType: jobTypeLabels[customer.jobType],
      }),
    });
  } else {
    await sendEmail({
      to: customer.email,
      subject: `Thanks for getting in touch with ${brand.companyName}`,
      context: "booking received",
      react: createElement(BookingReceivedEmail, { brand, firstName: customer.firstName }),
    });
  }
}

export type BookingResult =
  | { status: "rejected" }
  | { status: "invalid"; errors: Record<string, string> }
  | {
      status: "booked";
      name: string;
      dateLabel: string | null;
      time: string | null;
      companyName: string;
    };

export async function submitBooking(input: BookingInput): Promise<BookingResult> {
  if (input.honeypot) return { status: "rejected" };

  const { fields, utm } = input;
  const errors = validateBookingFields(fields);
  if (Object.keys(errors).length > 0) return { status: "invalid", errors };

  // A slot is optional — only treated as picked when both date and time
  // are present (e.g. a date was chosen but no slot clicked counts as
  // "not sure yet", same as leaving the date blank entirely).
  const hasSlot = Boolean(fields.date && fields.time);
  let appointmentAt: Date | null = null;

  if (hasSlot) {
    appointmentAt = new Date(`${fields.date}T${fields.time}:00`);
    const slotIsOffered =
      !Number.isNaN(appointmentAt.getTime()) &&
      (await getAvailableSlots(fields.date)).includes(fields.time);
    if (!slotIsOffered) {
      return {
        status: "invalid",
        errors: { time: "That slot is no longer available — please pick another." },
      };
    }
  }

  const settings = await prisma.settings.findUnique({
    where: { id: "singleton" },
  });
  const companyName = settings?.companyName ?? "us";

  const customer = await prisma.customer.create({
    data: {
      firstName: fields.firstName,
      lastName: fields.lastName,
      phone: fields.phone,
      email: fields.email,
      addressLine1: fields.addressLine1,
      addressLine2: fields.addressLine2 || null,
      postcode: fields.postcode,
      jobType: fields.jobType as JobType,
      source: sourceFromUtm(utm.source),
      utmSource: utm.source,
      utmMedium: utm.medium,
      utmCampaign: utm.campaign,
      utmContent: utm.content,
      // No slot picked: a fresh, un-actioned lead like any other — the
      // existing "new" follow-up threshold and notification sweep apply
      // to it exactly as they do to any other status "new" customer.
      status: hasSlot ? "quote_booked" : "new",
      appointmentAt,
      notes: fields.notes,
    },
  });

  await sendBookingConfirmationEmail(customer, appointmentAt, settings);

  revalidatePath("/", "layout");

  return {
    status: "booked",
    name: formatCustomerName(customer),
    dateLabel: appointmentAt ? formatBookingDateLabel(appointmentAt) : null,
    time: hasSlot ? fields.time : null,
    companyName,
  };
}
