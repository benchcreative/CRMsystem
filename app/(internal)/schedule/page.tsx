import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { jobTypeLabels } from "@/lib/labels";
import { formatCustomerName } from "@/lib/customer";
import { formatTimeOnly, toDateParam } from "@/lib/date";
import { NotificationBell } from "../components/NotificationBell";
import { getNotificationBellData } from "@/lib/notifications";

function parseDateParam(dateStr: string | undefined): Date {
  if (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split("-").map(Number);
    const parsed = new Date(year, month - 1, day);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function addDays(date: Date, amount: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
}

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date: dateParam } = await searchParams;
  const date = parseDateParam(dateParam);
  const nextDay = addDays(date, 1);

  const customers = await prisma.customer.findMany({
    where: { appointmentAt: { gte: date, lt: nextDay } },
    orderBy: { appointmentAt: "asc" },
  });

  const { unreadCount, notifications } = await getNotificationBellData();

  const dateLabel = date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isToday = date.getTime() === today.getTime();

  return (
    <div className="flex-1 bg-dash-bg">
      <main className="mx-auto max-w-2xl px-8 py-8">
        <div className="flex items-start justify-between gap-4">
          <Link href="/customers" className="text-sm text-dash-muted transition-colors hover:text-dash-ink">
            Back to customers
          </Link>
          <NotificationBell unreadCount={unreadCount} notifications={notifications} />
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl text-dash-ink">Schedule</h1>
            <p className="mt-1 text-sm text-dash-muted">{dateLabel}</p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Link
              href={`/schedule?date=${toDateParam(addDays(date, -1))}`}
              className="border border-dash-line px-3 py-1.5 text-dash-ink transition-colors hover:border-dash-ink"
            >
              &larr; Prev
            </Link>
            {!isToday && (
              <Link
                href="/schedule"
                className="border border-dash-line px-3 py-1.5 text-dash-ink transition-colors hover:border-dash-ink"
              >
                Today
              </Link>
            )}
            <Link
              href={`/schedule?date=${toDateParam(addDays(date, 1))}`}
              className="border border-dash-line px-3 py-1.5 text-dash-ink transition-colors hover:border-dash-ink"
            >
              Next &rarr;
            </Link>
          </div>
        </div>

        <div className="mt-6 border border-dash-line bg-dash-surface">
          {customers.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-dash-muted">
              No appointments booked for this day.
            </p>
          ) : (
            <div className="divide-y divide-dash-line">
              {customers.map((customer) => (
                <Link
                  key={customer.id}
                  href={`/customers/${customer.id}/edit`}
                  className="flex items-center justify-between gap-4 px-4 py-3 text-sm transition-colors hover:bg-dash-line/30"
                >
                  <span className="font-heading text-dash-ink">
                    {formatTimeOnly(customer.appointmentAt!)}
                  </span>
                  <span className="flex-1 text-dash-ink">
                    {formatCustomerName(customer)}
                  </span>
                  <span className="text-dash-muted">
                    {jobTypeLabels[customer.jobType]}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
