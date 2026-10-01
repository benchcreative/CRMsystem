"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type {
  ContactLogDirection,
  JobStatus,
  JobType,
  Source,
  Status,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  isJobType,
  isSource,
  isStatus,
  isJobStatus,
  jobTypeLabels,
  sourceLabels,
  statusLabels,
} from "@/lib/labels";
import { poundsToPence } from "@/lib/currency";
import { formatDateTime } from "@/lib/date";
import { formatCustomerName } from "@/lib/customer";
import { sendAppointmentReminder } from "@/lib/reminders";
import { getAnthropicClient, CLAUDE_MODEL } from "@/lib/anthropic";
import { checkAiUsageLimit, incrementAiUsage } from "@/lib/ai-usage";
import { createElement } from "react";
import { emailBrandFromSettings, sendEmail } from "@/lib/email";
import FollowUpEmail from "@/emails/follow-up";
import { getTwilioClient, TWILIO_FROM_NUMBER } from "@/lib/twilio";
import { toE164 } from "@/lib/phone";

const MANUAL_LOG_DIRECTIONS = ["outbound_call", "inbound_call"] as const;

export async function logContact(customerId: string, formData: FormData) {
  const note = String(formData.get("note") ?? "").trim();
  const directionRaw = String(formData.get("direction") ?? "");
  const direction = (
    MANUAL_LOG_DIRECTIONS as readonly string[]
  ).includes(directionRaw)
    ? (directionRaw as ContactLogDirection)
    : null;

  await prisma.contactLog.create({
    data: {
      customerId,
      note: note || null,
      direction,
    },
  });

  revalidatePath("/");
  revalidatePath("/customers");
  revalidatePath(`/customers/${customerId}/edit`);
}

export type FollowUpDraftResult =
  | { success: true; draft: string }
  | { success: false; error: string };

// On an overdue lead's profile: drafts a short follow-up using only this
// customer's own CRM data (name, job type, status, source, contact
// history) — never external knowledge. Counted against the monthly AI cap
// only on a successful call (see lib/ai-usage.ts).
export async function generateFollowUpDraft(
  customerId: string
): Promise<FollowUpDraftResult> {
  const { allowed, used, limit } = await checkAiUsageLimit();
  if (!allowed) {
    return {
      success: false,
      error: `AI draft limit reached for this month (${used} of ${limit}), resets on the 1st.`,
    };
  }

  const client = getAnthropicClient();
  if (!client) {
    return {
      success: false,
      error: "AI follow-up isn't configured (missing ANTHROPIC_API_KEY).",
    };
  }

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: { contactLogs: { orderBy: { contactedAt: "desc" } } },
  });
  if (!customer) return { success: false, error: "Customer not found." };

  const contactHistory =
    customer.contactLogs.length === 0
      ? "No contact has been logged yet."
      : customer.contactLogs
          .map(
            (log) =>
              `- ${formatDateTime(log.contactedAt)}${log.direction ? ` [${log.direction}]` : ""}: ${
                log.note || "(no note)"
              }`
          )
          .join("\n");

  const systemPrompt = `You write short follow-up messages for a home-improvement business contacting their own leads. Use ONLY the customer data given below — never invent names, dates, prices, promises, or any detail not explicitly present in it. If something isn't known, simply don't mention it.

Customer name: ${formatCustomerName(customer)}
Job type: ${jobTypeLabels[customer.jobType]}
Status: ${statusLabels[customer.status]}
Source: ${sourceLabels[customer.source]}

Contact history (most recent first):
${contactHistory}

Write a short, friendly follow-up message (2-3 sentences), suitable for either text or email. Reference their specific job type and where they're at in the process (e.g. awaiting a quote decision vs. a fresh lead who hasn't been actioned yet). Do not include a subject line, a greeting with a placeholder name, or a sign-off with a placeholder name. Output only the message body text, nothing else — no preamble, no surrounding quotes.`;

  let draft: string;
  try {
    const response = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 300,
      system: systemPrompt,
      messages: [{ role: "user", content: "Write the follow-up message now." }],
    });
    const textBlock = response.content.find((block) => block.type === "text");
    draft = textBlock && "text" in textBlock ? textBlock.text.trim() : "";
    if (!draft) throw new Error("Empty response from Claude.");
  } catch (error) {
    console.error("Failed to generate follow-up draft:", error);
    return { success: false, error: "Failed to generate a draft — please try again." };
  }

  await incrementAiUsage();

  return { success: true, draft };
}

export type SendFollowUpResult = { success: true } | { success: false; error: string };

export async function sendFollowUpEmail(
  customerId: string,
  message: string
): Promise<SendFollowUpResult> {
  const trimmed = message.trim();
  if (!trimmed) return { success: false, error: "Message can't be empty." };

  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) return { success: false, error: "Customer not found." };

  const settings = await prisma.settings.findUnique({ where: { id: "singleton" } });
  const brand = emailBrandFromSettings(settings);

  const result = await sendEmail({
    to: customer.email,
    subject: `A message from ${brand.companyName}`,
    context: "follow-up",
    react: createElement(FollowUpEmail, { brand, message: trimmed }),
  });
  if (!result.ok) {
    return { success: false, error: "Failed to send the email — please try again." };
  }

  await prisma.contactLog.create({
    data: { customerId, note: trimmed, direction: "outbound_email" },
  });

  revalidatePath("/");
  revalidatePath("/customers");
  revalidatePath(`/customers/${customerId}/edit`);

  return { success: true };
}

export async function sendFollowUpSms(
  customerId: string,
  message: string
): Promise<SendFollowUpResult> {
  const trimmed = message.trim();
  if (!trimmed) return { success: false, error: "Message can't be empty." };

  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) return { success: false, error: "Customer not found." };

  const client = getTwilioClient();
  if (!client || !TWILIO_FROM_NUMBER) {
    return { success: false, error: "SMS isn't configured (missing Twilio credentials)." };
  }

  try {
    await client.messages.create({
      from: TWILIO_FROM_NUMBER,
      to: toE164(customer.phone),
      body: trimmed,
    });
  } catch (error) {
    console.error("Failed to send follow-up SMS:", error);
    return { success: false, error: "Failed to send the text — please try again." };
  }

  await prisma.contactLog.create({
    data: { customerId, note: trimmed, direction: "outbound_sms" },
  });

  revalidatePath("/");
  revalidatePath("/customers");
  revalidatePath(`/customers/${customerId}/edit`);

  return { success: true };
}

// Sends the same reminder email the daily cron sweep sends, immediately and
// regardless of how close the appointment actually is — so a reminder can
// be demonstrated live without waiting for the real schedule.
export async function sendReminderNow(customerId: string) {
  await sendAppointmentReminder(customerId);
  revalidatePath(`/customers/${customerId}/edit`);
}

export type CustomerFormState = {
  errors: Record<string, string>;
  values: Record<string, string>;
};

function readCustomerForm(formData: FormData) {
  return {
    firstName: String(formData.get("firstName") ?? "").trim(),
    lastName: String(formData.get("lastName") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    addressLine1: String(formData.get("addressLine1") ?? "").trim(),
    addressLine2: String(formData.get("addressLine2") ?? "").trim(),
    postcode: String(formData.get("postcode") ?? "").trim(),
    jobType: String(formData.get("jobType") ?? ""),
    source: String(formData.get("source") ?? ""),
    value: String(formData.get("value") ?? "").trim(),
    status: String(formData.get("status") ?? ""),
    jobStatus: String(formData.get("jobStatus") ?? ""),
    installDate: String(formData.get("installDate") ?? "").trim(),
    notes: String(formData.get("notes") ?? "").trim(),
  };
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateCustomerForm(values: ReturnType<typeof readCustomerForm>) {
  const errors: Record<string, string> = {};

  if (!values.firstName) errors.firstName = "First name is required.";
  if (!values.lastName) errors.lastName = "Last name is required.";
  if (!values.phone) errors.phone = "Phone is required.";
  if (!values.email) {
    errors.email = "Email is required.";
  } else if (!EMAIL_PATTERN.test(values.email)) {
    errors.email = "Enter a valid email address.";
  }
  if (!values.addressLine1) errors.addressLine1 = "Address is required.";
  if (!values.postcode) errors.postcode = "Postcode is required.";
  if (!isJobType(values.jobType)) errors.jobType = "Select a job type.";
  if (!isSource(values.source)) errors.source = "Select a source.";
  if (values.value) {
    const parsed = Number(values.value);
    if (Number.isNaN(parsed) || parsed < 0) {
      errors.value = "Enter a valid job value.";
    }
  }
  if (!isStatus(values.status)) errors.status = "Select a status.";
  if (!isJobStatus(values.jobStatus)) errors.jobStatus = "Select a job status.";
  if (values.installDate && Number.isNaN(Date.parse(values.installDate))) {
    errors.installDate = "Enter a valid date.";
  }

  return errors;
}

// Only called after validateCustomerForm has confirmed installDate is
// either empty or a valid date string.
function parseInstallDate(installDate: string): Date | null {
  return installDate ? new Date(installDate) : null;
}

// Only called after validateCustomerForm has confirmed values.value is
// either empty or a valid non-negative number.
function parseValueToPence(value: string): number | null {
  if (!value) return null;
  return poundsToPence(Number(value));
}

export async function createCustomer(
  _prevState: CustomerFormState,
  formData: FormData
): Promise<CustomerFormState> {
  const values = readCustomerForm(formData);
  const errors = validateCustomerForm(values);

  if (Object.keys(errors).length > 0) {
    return { errors, values };
  }

  await prisma.customer.create({
    data: {
      firstName: values.firstName,
      lastName: values.lastName,
      phone: values.phone,
      email: values.email,
      addressLine1: values.addressLine1,
      addressLine2: values.addressLine2 || null,
      postcode: values.postcode,
      jobType: values.jobType as JobType,
      source: values.source as Source,
      value: parseValueToPence(values.value),
      status: values.status as Status,
      jobStatus: values.jobStatus as JobStatus,
      installDate: parseInstallDate(values.installDate),
      notes: values.notes,
      // First-time creation: wonAt has no prior value, so set it
      // if the customer is being created directly as "won".
      wonAt: values.status === "won" ? new Date() : null,
    },
  });

  revalidatePath("/");
  revalidatePath("/customers");
  redirect("/customers");
}

export async function updateCustomer(
  id: string,
  _prevState: CustomerFormState,
  formData: FormData
): Promise<CustomerFormState> {
  const values = readCustomerForm(formData);
  const errors = validateCustomerForm(values);

  if (Object.keys(errors).length > 0) {
    return { errors, values };
  }

  const existing = await prisma.customer.findUnique({
    where: { id },
    select: { wonAt: true },
  });

  // Only set wonAt the first time status becomes "won"; never overwrite
  // an existing value, and never touch it for any other status change.
  const wonAt =
    values.status === "won" && !existing?.wonAt ? new Date() : undefined;

  await prisma.customer.update({
    where: { id },
    data: {
      firstName: values.firstName,
      lastName: values.lastName,
      phone: values.phone,
      email: values.email,
      addressLine1: values.addressLine1,
      addressLine2: values.addressLine2 || null,
      postcode: values.postcode,
      jobType: values.jobType as JobType,
      source: values.source as Source,
      value: parseValueToPence(values.value),
      status: values.status as Status,
      jobStatus: values.jobStatus as JobStatus,
      installDate: parseInstallDate(values.installDate),
      notes: values.notes,
      ...(wonAt && { wonAt }),
    },
  });

  revalidatePath("/");
  revalidatePath("/customers");
  redirect("/customers");
}
