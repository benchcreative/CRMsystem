import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { calculateLineItemTotal, calculateQuoteTotals } from "@/lib/quote";
import { formatPenceAsGBP } from "@/lib/currency";
import { formatDateTime } from "@/lib/date";
import { acceptQuoteViaPublicToken } from "@/app/(internal)/quotes/actions";
import { formatCustomerName, formatCustomerAddress } from "@/lib/customer";

export default async function PublicQuotePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const quote = await prisma.quote.findUnique({
    where: { publicToken: token },
    include: { lineItems: true, customer: true },
  });

  if (!quote) notFound();

  const settings = await prisma.settings.findUnique({
    where: { id: "singleton" },
  });

  const { subtotal, vatAmount, total } = calculateQuoteTotals(
    quote.lineItems,
    quote.vatEnabled,
    quote.vatRate
  );

  const canAccept = quote.status === "draft" || quote.status === "sent";
  const boundAccept = acceptQuoteViaPublicToken.bind(null, token);

  return (
    <div className="flex-1 bg-canvas">
      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="font-heading text-2xl text-ink">{quote.quoteNumber}</h1>

        {quote.status === "accepted" && (
          <div className="mt-4 border border-line bg-surface px-4 py-3 text-sm text-ink">
            <span className="mr-2 inline-block h-1.5 w-1.5 bg-status-won align-middle" />
            You&apos;ve accepted this quote. We&apos;ll be in touch shortly.
          </div>
        )}

        {quote.status === "declined" && (
          <div className="mt-4 border border-line bg-surface px-4 py-3 text-sm text-muted">
            This quote is no longer available to accept. Please contact us
            directly if you&apos;d like to discuss it.
          </div>
        )}

        {canAccept && (
          <form action={boundAccept} className="mt-4">
            <button
              type="submit"
              className="bg-accent px-5 py-2.5 text-sm text-canvas hover:bg-accent/90"
            >
              Accept this quote
            </button>
          </form>
        )}

        <div className="mt-6 flex justify-between">
          <a
            href={`/q/${token}/pdf`}
            className="text-sm text-muted hover:text-ink"
          >
            Download PDF
          </a>
        </div>

        <div className="mt-8 border border-line bg-surface p-6">
          <div className="flex justify-between gap-6">
            <div>
              <p className="font-heading text-ink">
                {settings?.companyName ?? "Company name not set"}
              </p>
              {settings?.addressLine1 && (
                <p className="text-sm text-muted">{settings.addressLine1}</p>
              )}
              {settings?.addressLine2 && (
                <p className="text-sm text-muted">{settings.addressLine2}</p>
              )}
              {settings?.phone && (
                <p className="text-sm text-muted">{settings.phone}</p>
              )}
              {settings?.email && (
                <p className="text-sm text-muted">{settings.email}</p>
              )}
              {settings?.vatNumber && (
                <p className="text-sm text-muted">VAT {settings.vatNumber}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-muted">Quote to</p>
              <p className="font-heading text-ink">
                {formatCustomerName(quote.customer)}
              </p>
              <p className="text-sm text-muted">
                {formatCustomerAddress(quote.customer)}
              </p>
              <p className="text-sm text-muted">{quote.customer.phone}</p>
              {quote.customer.email && (
                <p className="text-sm text-muted">{quote.customer.email}</p>
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-between text-sm">
            <span className="text-muted">
              Issued {formatDateTime(quote.issuedAt)}
            </span>
            {quote.validUntil && (
              <span className="text-muted">
                Valid until {formatDateTime(quote.validUntil)}
              </span>
            )}
          </div>

          <table className="mt-6 w-full text-left text-sm">
            <thead className="border-b border-line">
              <tr>
                <th className="py-2 pr-3 font-heading font-bold text-muted">
                  Description
                </th>
                <th className="px-3 py-2 text-right font-heading font-bold text-muted">
                  Qty
                </th>
                <th className="px-3 py-2 font-heading font-bold text-muted">
                  Unit
                </th>
                <th className="px-3 py-2 text-right font-heading font-bold text-muted">
                  Unit price
                </th>
                <th className="py-2 pl-3 text-right font-heading font-bold text-muted">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {quote.lineItems.map((item) => (
                <tr key={item.id}>
                  <td className="py-2 pr-3 text-ink">{item.description}</td>
                  <td className="px-3 py-2 text-right text-muted">
                    {item.quantity}
                  </td>
                  <td className="px-3 py-2 text-muted">{item.unit ?? ""}</td>
                  <td className="px-3 py-2 text-right text-muted">
                    {formatPenceAsGBP(item.unitPrice)}
                  </td>
                  <td className="py-2 pl-3 text-right text-ink">
                    {formatPenceAsGBP(
                      calculateLineItemTotal(item.quantity, item.unitPrice)
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 flex justify-end">
            <div className="w-56">
              <div className="flex justify-between text-sm">
                <span className="text-muted">Subtotal</span>
                <span className="text-ink">{formatPenceAsGBP(subtotal)}</span>
              </div>
              {quote.vatEnabled && (
                <div className="mt-1 flex justify-between text-sm">
                  <span className="text-muted">VAT ({quote.vatRate}%)</span>
                  <span className="text-ink">
                    {formatPenceAsGBP(vatAmount)}
                  </span>
                </div>
              )}
              <div className="mt-2 flex justify-between border-t border-line pt-2 text-sm">
                <span className="text-ink">Total</span>
                <span className="font-heading text-lg text-ink">
                  {formatPenceAsGBP(total)}
                </span>
              </div>
            </div>
          </div>

          {quote.notes && (
            <div className="mt-6 border-t border-line pt-4">
              <p className="text-sm text-muted">Notes / terms</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-ink">
                {quote.notes}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
