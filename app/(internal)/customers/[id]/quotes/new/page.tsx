import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createQuote } from "../../../../quotes/actions";
import { QuoteForm } from "../../../../quotes/components/QuoteForm";
import { formatCustomerName } from "@/lib/customer";
import { NotificationBell } from "../../../../components/NotificationBell";
import { getNotificationBellData } from "@/lib/notifications";

export default async function NewQuotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await prisma.customer.findUnique({ where: { id } });

  if (!customer) notFound();

  const { unreadCount, notifications } = await getNotificationBellData();

  const boundCreateQuote = createQuote.bind(null, customer.id);

  return (
    <div className="flex-1 bg-dash-bg">
      <main className="mx-auto max-w-3xl px-8 py-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Link
              href={`/customers/${customer.id}/edit`}
              className="text-sm text-dash-muted transition-colors hover:text-dash-ink"
            >
              Back to {formatCustomerName(customer)}
            </Link>
            <h1 className="mt-2 font-heading text-2xl text-dash-ink">
              New quote for {formatCustomerName(customer)}
            </h1>
          </div>
          <NotificationBell unreadCount={unreadCount} notifications={notifications} />
        </div>

        <div className="mt-6 border border-dash-line bg-dash-surface p-6">
          <QuoteForm action={boundCreateQuote} />
        </div>
      </main>
    </div>
  );
}
