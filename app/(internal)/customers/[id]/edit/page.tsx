import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateCustomer, sendReminderNow } from "../../../actions";
import { CustomerForm } from "../../../components/CustomerForm";
import { FollowUpPanel } from "../../../components/FollowUpPanel";
import { NotificationBell } from "../../../components/NotificationBell";
import { getNotificationBellData } from "@/lib/notifications";
import { formatDateTime, toDateParam } from "@/lib/date";
import { penceToPoundsString, formatPenceAsGBP } from "@/lib/currency";
import { calculateQuoteTotals } from "@/lib/quote";
import {
  quoteStatusLabels,
  contactLogDirectionLabels,
  needsFollowUp,
} from "@/lib/labels";
import { formatCustomerName } from "@/lib/customer";

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      contactLogs: {
        orderBy: { contactedAt: "desc" },
      },
      quotes: {
        orderBy: { issuedAt: "desc" },
        include: { lineItems: true },
      },
    },
  });

  if (!customer) notFound();

  const { unreadCount, notifications } = await getNotificationBellData();

  const boundUpdateCustomer = updateCustomer.bind(null, customer.id);
  const boundSendReminderNow = sendReminderNow.bind(null, customer.id);
  const canSendReminder =
    customer.status === "quote_booked" && customer.appointmentAt !== null;

  // contactLogs is already ordered desc, so [0] is the most recent.
  const lastContactedAt = customer.contactLogs[0]?.contactedAt ?? null;
  const isOverdue = needsFollowUp(customer.status, lastContactedAt);

  return (
    <div className="flex-1 bg-dash-bg">
      <main className="mx-auto max-w-2xl px-8 py-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Link href="/customers" className="text-sm text-dash-muted transition-colors hover:text-dash-ink">
              Back to customers
            </Link>
            <h1 className="mt-2 font-heading text-2xl text-dash-ink">
              Edit {formatCustomerName(customer)}
            </h1>
            {customer.utmCampaign && (
              <p className="mt-1 text-sm text-dash-muted">
                Campaign{" "}
                <span className="text-dash-ink">{customer.utmCampaign}</span>
                {(customer.utmSource || customer.utmMedium) && (
                  <>
                    {" "}
                    &middot;{" "}
                    {[customer.utmSource, customer.utmMedium]
                      .filter(Boolean)
                      .join(" / ")}
                  </>
                )}
              </p>
            )}
          </div>
          <NotificationBell unreadCount={unreadCount} notifications={notifications} />
        </div>

        {customer.appointmentAt && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border border-dash-line bg-dash-surface px-4 py-2.5 text-sm text-dash-ink">
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 shrink-0 bg-accent" />
              Appointment booked for {formatDateTime(customer.appointmentAt)}
              {customer.reminderSentAt && (
                <span className="text-dash-muted">
                  &middot; Reminder sent {formatDateTime(customer.reminderSentAt)}
                </span>
              )}
            </span>
            {canSendReminder && (
              <form action={boundSendReminderNow}>
                <button
                  type="submit"
                  className="border border-dash-line px-3 py-1.5 text-xs text-dash-ink transition-colors hover:border-dash-ink"
                >
                  Send reminder now
                </button>
              </form>
            )}
          </div>
        )}

        {isOverdue && <FollowUpPanel customerId={customer.id} />}

        <div className="mt-6 border border-dash-line bg-dash-surface p-6">
          <CustomerForm
            action={boundUpdateCustomer}
            submitLabel="Save changes"
            defaultValues={{
              firstName: customer.firstName,
              lastName: customer.lastName,
              phone: customer.phone,
              email: customer.email ?? "",
              addressLine1: customer.addressLine1,
              addressLine2: customer.addressLine2 ?? "",
              postcode: customer.postcode,
              jobType: customer.jobType,
              source: customer.source,
              value: penceToPoundsString(customer.value),
              status: customer.status,
              jobStatus: customer.jobStatus,
              installDate: customer.installDate
                ? toDateParam(customer.installDate)
                : "",
              notes: customer.notes,
            }}
          />
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg text-dash-ink">Quotes</h2>
            <Link
              href={`/customers/${customer.id}/quotes/new`}
              className="border border-dash-line px-3 py-1 text-xs text-dash-ink transition-colors hover:border-dash-ink"
            >
              + New quote
            </Link>
          </div>

          {customer.quotes.length === 0 ? (
            <p className="mt-2 text-sm text-dash-muted">No quotes yet.</p>
          ) : (
            <div className="mt-3 divide-y divide-dash-line border border-dash-line bg-dash-surface">
              {customer.quotes.map((quote) => {
                const { total } = calculateQuoteTotals(
                  quote.lineItems,
                  quote.vatEnabled,
                  quote.vatRate
                );
                return (
                  <Link
                    key={quote.id}
                    href={`/quotes/${quote.id}`}
                    className="flex items-center justify-between px-4 py-3 text-sm transition-colors hover:bg-dash-line/30"
                  >
                    <span className="font-heading text-dash-ink">
                      {quote.quoteNumber}
                    </span>
                    <span className="text-dash-muted">
                      {quoteStatusLabels[quote.status]}
                    </span>
                    <span className="text-dash-muted">
                      {formatDateTime(quote.issuedAt)}
                    </span>
                    <span className="font-heading text-dash-ink">
                      {formatPenceAsGBP(total)}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-8">
          <h2 className="font-heading text-lg text-dash-ink">Contact history</h2>

          {customer.contactLogs.length === 0 ? (
            <p className="mt-2 text-sm text-dash-muted">No contact logged yet.</p>
          ) : (
            <div className="mt-3 divide-y divide-dash-line border border-dash-line bg-dash-surface">
              {customer.contactLogs.map((log) => (
                <div key={log.id} className="px-4 py-3 text-sm">
                  <span className="font-heading text-dash-ink">
                    {formatDateTime(log.contactedAt)}
                  </span>
                  {log.direction && (
                    <span className="ml-2 text-dash-muted">
                      {contactLogDirectionLabels[log.direction]}
                    </span>
                  )}
                  {log.note && (
                    <p className="mt-1 text-dash-muted">{log.note}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
