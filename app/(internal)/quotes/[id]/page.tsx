import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { APP_URL } from "@/lib/app-url";
import { calculateLineItemTotal, calculateQuoteTotals } from "@/lib/quote";
import { formatPenceAsGBP } from "@/lib/currency";
import { formatDateTime } from "@/lib/date";
import { quoteStatusLabels } from "@/lib/labels";
import { updateQuoteStatus } from "../actions";
import { SendQuoteButton } from "../components/SendQuoteButton";
import { CopyButton } from "../../components/CopyButton";
import { formatCustomerName, formatCustomerAddress } from "@/lib/customer";
import { NotificationBell } from "@/app/(internal)/components/NotificationBell";
import { getNotificationBellData } from "@/lib/notifications";
import type { QuoteStatus } from "@prisma/client";

const STATUS_ACTIONS: { status: QuoteStatus; label: string }[] = [
  { status: "sent", label: "Mark as Sent" },
  { status: "accepted", label: "Mark as Accepted" },
  { status: "declined", label: "Mark as Declined" },
];

export default async function QuoteViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const quote = await prisma.quote.findUnique({
    where: { id },
    include: { lineItems: true, customer: true },
  });

  if (!quote) notFound();

  const settings = await prisma.settings.findUnique({
    where: { id: "singleton" },
  });
  const { unreadCount, notifications } = await getNotificationBellData();

  const { subtotal, vatAmount, total } = calculateQuoteTotals(
    quote.lineItems,
    quote.vatEnabled,
    quote.vatRate
  );

  const publicUrl = `${APP_URL}/q/${quote.publicToken}`;

  return (
    <div className="flex-1 bg-dash-bg">
      <main className="mx-auto max-w-3xl px-8 py-8">
        <div className="flex items-start justify-between gap-4">
          <Link
            href={`/customers/${quote.customer.id}/edit`}
            className="text-sm text-dash-muted transition-colors hover:text-dash-ink"
          >
            Back to {formatCustomerName(quote.customer)}
          </Link>
          <NotificationBell unreadCount={unreadCount} notifications={notifications} />
        </div>

        <div className="mt-2 flex items-start justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl text-dash-ink">
              {quote.quoteNumber}
            </h1>
            <p className="mt-1 text-sm text-dash-muted">
              {quoteStatusLabels[quote.status]} &middot; Issued{" "}
              {formatDateTime(quote.issuedAt)}
            </p>
          </div>
          <a
            href={`/quotes/${quote.id}/pdf`}
            className="shrink-0 border border-dash-line px-4 py-2 text-sm text-dash-ink transition-colors hover:border-dash-ink"
          >
            Download PDF
          </a>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <SendQuoteButton quoteId={quote.id} />
          <CopyButton text={publicUrl} label="Copy customer link" />
        </div>

        <div className="mt-2 flex flex-wrap gap-2">
          {STATUS_ACTIONS.filter(
            (action) => action.status !== quote.status
          ).map((action) => (
            <form
              key={action.status}
              action={updateQuoteStatus.bind(null, quote.id, action.status)}
            >
              <button
                type="submit"
                className="border border-dash-line px-3 py-1.5 text-xs text-dash-muted transition-colors hover:text-dash-ink hover:border-dash-ink"
              >
                {action.label}
              </button>
            </form>
          ))}
        </div>

        <div className="mt-8 border border-dash-line bg-dash-surface p-6">
          <div className="flex justify-between gap-6">
            <div>
              <p className="font-heading text-dash-ink">
                {settings?.companyName ?? "Company name not set"}
              </p>
              {settings?.addressLine1 && (
                <p className="text-sm text-dash-muted">{settings.addressLine1}</p>
              )}
              {settings?.addressLine2 && (
                <p className="text-sm text-dash-muted">{settings.addressLine2}</p>
              )}
              {settings?.phone && (
                <p className="text-sm text-dash-muted">{settings.phone}</p>
              )}
              {settings?.email && (
                <p className="text-sm text-dash-muted">{settings.email}</p>
              )}
              {settings?.vatNumber && (
                <p className="text-sm text-dash-muted">VAT {settings.vatNumber}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-dash-muted">Quote to</p>
              <p className="font-heading text-dash-ink">
                {formatCustomerName(quote.customer)}
              </p>
              <p className="text-sm text-dash-muted">
                {formatCustomerAddress(quote.customer)}
              </p>
              <p className="text-sm text-dash-muted">{quote.customer.phone}</p>
              {quote.customer.email && (
                <p className="text-sm text-dash-muted">{quote.customer.email}</p>
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-between text-sm">
            <span className="text-dash-muted">
              Issued {formatDateTime(quote.issuedAt)}
            </span>
            {quote.validUntil && (
              <span className="text-dash-muted">
                Valid until {formatDateTime(quote.validUntil)}
              </span>
            )}
          </div>

          <table className="mt-6 w-full text-left text-sm">
            <thead className="border-b border-dash-line">
              <tr>
                <th className="py-2 pr-3 font-heading font-bold text-dash-muted">
                  Description
                </th>
                <th className="px-3 py-2 text-right font-heading font-bold text-dash-muted">
                  Qty
                </th>
                <th className="px-3 py-2 font-heading font-bold text-dash-muted">
                  Unit
                </th>
                <th className="px-3 py-2 text-right font-heading font-bold text-dash-muted">
                  Unit price
                </th>
                <th className="py-2 pl-3 text-right font-heading font-bold text-dash-muted">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dash-line">
              {quote.lineItems.map((item) => (
                <tr key={item.id}>
                  <td className="py-2 pr-3 text-dash-ink">{item.description}</td>
                  <td className="px-3 py-2 text-right text-dash-muted">
                    {item.quantity}
                  </td>
                  <td className="px-3 py-2 text-dash-muted">{item.unit ?? ""}</td>
                  <td className="px-3 py-2 text-right text-dash-muted">
                    {formatPenceAsGBP(item.unitPrice)}
                  </td>
                  <td className="py-2 pl-3 text-right text-dash-ink">
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
                <span className="text-dash-muted">Subtotal</span>
                <span className="text-dash-ink">{formatPenceAsGBP(subtotal)}</span>
              </div>
              {quote.vatEnabled && (
                <div className="mt-1 flex justify-between text-sm">
                  <span className="text-dash-muted">VAT ({quote.vatRate}%)</span>
                  <span className="text-dash-ink">
                    {formatPenceAsGBP(vatAmount)}
                  </span>
                </div>
              )}
              <div className="mt-2 flex justify-between border-t border-dash-line pt-2 text-sm">
                <span className="text-dash-ink">Total</span>
                <span className="font-heading text-lg text-dash-ink">
                  {formatPenceAsGBP(total)}
                </span>
              </div>
            </div>
          </div>

          {quote.notes && (
            <div className="mt-6 border-t border-dash-line pt-4">
              <p className="text-sm text-dash-muted">Notes / terms</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-dash-ink">
                {quote.notes}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
