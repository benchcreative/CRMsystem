import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { renderQuotePdfBuffer } from "@/lib/quote-pdf";
import { formatCustomerName, formatCustomerAddress } from "@/lib/customer";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const quote = await prisma.quote.findUnique({
    where: { id },
    include: { lineItems: true, customer: true },
  });

  if (!quote) {
    return new NextResponse("Quote not found", { status: 404 });
  }

  const settings = await prisma.settings.findUnique({
    where: { id: "singleton" },
  });

  const buffer = await renderQuotePdfBuffer({
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

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${quote.quoteNumber}.pdf"`,
    },
  });
}
