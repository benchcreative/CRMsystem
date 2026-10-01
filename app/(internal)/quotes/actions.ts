"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { QuoteStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { poundsToPence } from "@/lib/currency";
import { calculateQuoteTotals } from "@/lib/quote";
import { quoteStatusOrder } from "@/lib/labels";
import { createElement } from "react";
import { renderQuotePdfBuffer } from "@/lib/quote-pdf";
import { APP_URL, emailBrandFromSettings, sendEmail } from "@/lib/email";
import { formatPenceAsGBP } from "@/lib/currency";
import QuoteReadyEmail from "@/emails/quote-ready";
import { createNotification } from "@/lib/notifications";
import { formatCustomerName, formatCustomerAddress } from "@/lib/customer";

export type QuoteFormState = {
  error: string | null;
};

async function generateQuoteNumber(): Promise<string> {
  const count = await prisma.quote.count();
  return `Q-${String(count + 1).padStart(4, "0")}`;
}

function readLineItems(formData: FormData) {
  const descriptions = formData.getAll("description").map((v) => String(v));
  const quantities = formData.getAll("quantity").map((v) => String(v));
  const units = formData.getAll("unit").map((v) => String(v));
  const unitPrices = formData.getAll("unitPrice").map((v) => String(v));

  return descriptions.map((description, i) => ({
    description: description.trim(),
    quantity: (quantities[i] ?? "").trim(),
    unit: (units[i] ?? "").trim(),
    unitPrice: (unitPrices[i] ?? "").trim(),
  }));
}

export async function createQuote(
  customerId: string,
  _prevState: QuoteFormState,
  formData: FormData
): Promise<QuoteFormState> {
  const validUntilRaw = String(formData.get("validUntil") ?? "").trim();
  const vatEnabled = formData.get("vatEnabled") === "on";
  const vatRateRaw = String(formData.get("vatRate") ?? "20").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  const rawItems = readLineItems(formData).filter(
    (item) => item.description || item.quantity || item.unitPrice
  );

  if (rawItems.length === 0) {
    return { error: "Add at least one line item." };
  }

  const vatRate = Number(vatRateRaw);
  if (Number.isNaN(vatRate) || vatRate < 0) {
    return { error: "Enter a valid VAT rate." };
  }

  const parsedItems: {
    description: string;
    quantity: number;
    unit: string | null;
    unitPrice: number;
  }[] = [];

  for (const item of rawItems) {
    if (!item.description) {
      return { error: "Every line item needs a description." };
    }

    const quantity = Number(item.quantity);
    if (Number.isNaN(quantity) || quantity <= 0) {
      return {
        error: `Enter a valid quantity for "${item.description}".`,
      };
    }

    const unitPricePounds = Number(item.unitPrice);
    if (Number.isNaN(unitPricePounds) || unitPricePounds < 0) {
      return {
        error: `Enter a valid unit price for "${item.description}".`,
      };
    }

    parsedItems.push({
      description: item.description,
      quantity,
      unit: item.unit || null,
      unitPrice: poundsToPence(unitPricePounds),
    });
  }

  const quoteNumber = await generateQuoteNumber();

  const quote = await prisma.quote.create({
    data: {
      customerId,
      quoteNumber,
      validUntil: validUntilRaw ? new Date(validUntilRaw) : null,
      vatEnabled,
      vatRate,
      notes: notes || null,
      lineItems: { create: parsedItems },
    },
  });

  revalidatePath(`/customers/${customerId}/edit`);
  redirect(`/quotes/${quote.id}`);
}

// Shared by the internal staff status-change buttons and the public
// accept-link, so the "only backfill an empty value" rule (and the
// notification it raises) can't drift between the two entry points.
async function applyQuoteStatus(quoteId: string, status: QuoteStatus) {
  const previous = await prisma.quote.findUnique({
    where: { id: quoteId },
    select: { status: true },
  });

  const quote = await prisma.quote.update({
    where: { id: quoteId },
    data: { status },
    include: {
      lineItems: true,
      customer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          value: true,
          status: true,
          wonAt: true,
        },
      },
    },
  });

  // Only backfill the customer's job value from an accepted quote if they
  // don't already have one set manually — never silently overwrite it.
  if (status === "accepted" && quote.customer.value === null) {
    const { total } = calculateQuoteTotals(
      quote.lineItems,
      quote.vatEnabled,
      quote.vatRate
    );
    await prisma.customer.update({
      where: { id: quote.customer.id },
      data: { value: total },
    });
  }

  const isRealTransition = previous?.status !== status;

  // Sending a quote means the customer has genuinely been quoted — but
  // never downgrade someone already further along (e.g. already "won").
  if (
    isRealTransition &&
    status === "sent" &&
    (quote.customer.status === "new" || quote.customer.status === "quote_booked")
  ) {
    await prisma.customer.update({
      where: { id: quote.customer.id },
      data: { status: "quoted" },
    });
  }

  // Accepting/declining a quote is a strong, definitive signal of the real
  // outcome — unlike "quoted" above, this intentionally has no "only if
  // earlier in the pipeline" guard: real sales sometimes happen outside the
  // system, but an actual accept/decline here always reflects reality.
  if (isRealTransition && status === "accepted") {
    await prisma.customer.update({
      where: { id: quote.customer.id },
      data: {
        status: "won",
        // Only set wonAt the first time, same rule as the manual edit form.
        ...(!quote.customer.wonAt && { wonAt: new Date() }),
      },
    });
  } else if (isRealTransition && status === "declined") {
    await prisma.customer.update({
      where: { id: quote.customer.id },
      data: { status: "lost" },
    });
  }

  // Only notify on an actual transition into accepted/declined, not a
  // no-op "change" to the status it's already at.
  if (isRealTransition && (status === "accepted" || status === "declined")) {
    await createNotification({
      type: status === "accepted" ? "quote_accepted" : "quote_declined",
      message: `${formatCustomerName(quote.customer)} ${status} quote ${quote.quoteNumber}`,
      customerId: quote.customer.id,
      quoteId: quote.id,
    });
  }

  revalidatePath(`/quotes/${quoteId}`);
  revalidatePath(`/q/${quote.publicToken}`);
  revalidatePath(`/customers/${quote.customer.id}/edit`);
  revalidatePath("/", "layout");
  revalidatePath("/reports");

  return quote;
}

export async function updateQuoteStatus(quoteId: string, status: QuoteStatus) {
  if (!quoteStatusOrder.includes(status)) {
    throw new Error(`Invalid quote status: ${status}`);
  }

  await applyQuoteStatus(quoteId, status);
}

export async function acceptQuoteViaPublicToken(token: string) {
  const quote = await prisma.quote.findUnique({
    where: { publicToken: token },
    select: { id: true },
  });

  if (!quote) {
    throw new Error("Quote not found.");
  }

  await applyQuoteStatus(quote.id, "accepted");
}

export type SendQuoteEmailState = {
  error: string | null;
};

export async function sendQuoteEmail(
  quoteId: string,
  // useActionState always calls actions as (state, formData); neither is
  // needed here since the form has no fields, hence the explicit `void`.
  prevState: SendQuoteEmailState,
  formData: FormData
): Promise<SendQuoteEmailState> {
  void prevState;
  void formData;

  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: { lineItems: true, customer: true },
  });

  if (!quote) {
    return { error: "Quote not found." };
  }

  if (!quote.customer.email) {
    return {
      error: `${formatCustomerName(quote.customer)} doesn't have an email address on file — add one on their customer page first.`,
    };
  }

  const settings = await prisma.settings.findUnique({
    where: { id: "singleton" },
  });
  const companyName = settings?.companyName ?? "your quote";

  const pdfBuffer = await renderQuotePdfBuffer({
    quoteNumber: quote.quoteNumber,
    issuedAt: quote.issuedAt,
    validUntil: quote.validUntil,
    vatEnabled: quote.vatEnabled,
    vatRate: quote.vatRate,
    notes: quote.notes,
    lineItems: quote.lineItems,
    customer: {
      name: formatCustomerName(quote.customer),
      address: formatCustomerAddress(quote.customer),
      phone: quote.customer.phone,
      email: quote.customer.email,
    },
    settings,
  });

  const { total } = calculateQuoteTotals(
    quote.lineItems,
    quote.vatEnabled,
    quote.vatRate
  );

  const result = await sendEmail({
    to: quote.customer.email,
    subject: `Your quote ${quote.quoteNumber} from ${companyName}`,
    context: "quote",
    react: createElement(QuoteReadyEmail, {
      brand: emailBrandFromSettings(settings),
      firstName: quote.customer.firstName,
      quoteNumber: quote.quoteNumber,
      total: formatPenceAsGBP(total),
      validUntil: quote.validUntil
        ? quote.validUntil.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })
        : null,
      quoteUrl: `${APP_URL}/q/${quote.publicToken}`,
    }),
    attachments: [{ filename: `${quote.quoteNumber}.pdf`, content: pdfBuffer }],
  });

  if (!result.ok) {
    return { error: result.error || "Failed to send the email." };
  }

  await applyQuoteStatus(quoteId, "sent");

  return { error: null };
}
