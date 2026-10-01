import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  sourceLabels,
  sourceOrder,
  statusLabels,
  statusOrder,
  needsFollowUp,
} from "@/lib/labels";
import { formatPenceAsGBP } from "@/lib/currency";
import { NotificationBell } from "../components/NotificationBell";
import { getNotificationBellData } from "@/lib/notifications";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export default async function ReportsPage() {
  const [
    bySourceStatus,
    wonCustomers,
    customersWithContact,
    pipelineValueAgg,
    wonCustomersForValue,
  ] = await Promise.all([
    prisma.customer.groupBy({ by: ["source", "status"], _count: true }),
    prisma.customer.findMany({
      where: { wonAt: { not: null } },
      select: { createdAt: true, wonAt: true },
    }),
    prisma.customer.findMany({
      select: {
        status: true,
        value: true,
        contactLogs: {
          orderBy: { contactedAt: "desc" },
          take: 1,
          select: { contactedAt: true },
        },
      },
    }),
    prisma.customer.aggregate({
      where: { status: { notIn: ["won", "lost"] } },
      _sum: { value: true },
    }),
    prisma.customer.findMany({
      where: { status: "won" },
      select: { source: true, value: true },
    }),
  ]);

  const { unreadCount, notifications } = await getNotificationBellData();

  const conversionBySource = sourceOrder.map((source) => {
    const rows = bySourceStatus.filter((row) => row.source === source);
    const total = rows.reduce((sum, row) => sum + row._count, 0);
    const won = rows.find((row) => row.status === "won")?._count ?? 0;
    const revenue = wonCustomersForValue
      .filter((customer) => customer.source === source)
      .reduce((sum, customer) => sum + (customer.value ?? 0), 0);
    return {
      source,
      total,
      won,
      rate: total > 0 ? (won / total) * 100 : null,
      revenue,
    };
  });

  const totalsByStatus = statusOrder.map((status) => ({
    status,
    count: bySourceStatus
      .filter((row) => row.status === status)
      .reduce((sum, row) => sum + row._count, 0),
  }));

  const totalCustomers = totalsByStatus.reduce(
    (sum, row) => sum + row.count,
    0
  );

  const avgDaysToClose =
    wonCustomers.length > 0
      ? wonCustomers.reduce(
          (sum, customer) =>
            sum +
            (customer.wonAt!.getTime() - customer.createdAt.getTime()) /
              MS_PER_DAY,
          0
        ) / wonCustomers.length
      : null;

  const overdueCustomers = customersWithContact.filter((customer) =>
    needsFollowUp(
      customer.status,
      customer.contactLogs[0]?.contactedAt ?? null
    )
  );
  const overdueCount = overdueCustomers.length;
  const overdueValue = overdueCustomers.reduce(
    (sum, customer) => sum + (customer.value ?? 0),
    0
  );

  const totalPipelineValue = pipelineValueAgg._sum.value ?? 0;

  const wonValues = wonCustomersForValue
    .map((customer) => customer.value)
    .filter((value): value is number => value !== null);
  const avgWonValue =
    wonValues.length > 0
      ? Math.round(
          wonValues.reduce((sum, value) => sum + value, 0) / wonValues.length
        )
      : null;

  return (
    <div className="flex-1 bg-dash-bg">
      <main className="mx-auto max-w-6xl px-8 py-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Link href="/" className="text-sm text-dash-muted transition-colors hover:text-dash-ink">
              Back to dashboard
            </Link>
            <h1 className="mt-2 font-heading text-2xl text-dash-ink">Reports</h1>
            <p className="mt-1 text-sm text-dash-muted">
              Snapshot of pipeline health across {totalCustomers} customer
              {totalCustomers === 1 ? "" : "s"}.
            </p>
          </div>
          <NotificationBell unreadCount={unreadCount} notifications={notifications} />
        </div>

        <div className="mt-8 grid grid-cols-1 gap-px border border-dash-line bg-dash-line sm:grid-cols-3">
          <div className="bg-dash-surface p-5">
            <p className="text-sm text-dash-muted">Average days to close</p>
            <p className="mt-1 font-heading text-3xl text-dash-ink">
              {avgDaysToClose !== null
                ? `${avgDaysToClose.toFixed(1)} days`
                : "Not enough data"}
            </p>
          </div>

          <div className="bg-dash-surface p-5">
            <p className="text-sm text-dash-muted">Average won job value</p>
            <p className="mt-1 font-heading text-3xl text-dash-ink">
              {avgWonValue !== null
                ? formatPenceAsGBP(avgWonValue)
                : "Not enough data"}
            </p>
          </div>

          <div className="bg-dash-surface p-5">
            <p className="text-sm text-dash-muted">Total pipeline value</p>
            <p className="mt-1 font-heading text-3xl text-dash-ink">
              {formatPenceAsGBP(totalPipelineValue)}
            </p>
          </div>

          <div className="bg-dash-surface p-5">
            <p className="text-sm text-dash-muted">Overdue follow-ups</p>
            <p className="mt-1 font-heading text-3xl text-dash-ink">
              {overdueCount}
            </p>
            <Link
              href="/?overdue=true"
              className="mt-1 inline-block text-sm text-dash-muted transition-colors hover:text-dash-ink"
            >
              View on dashboard
            </Link>
          </div>

          <div className="bg-dash-surface p-5">
            <p className="text-sm text-dash-muted">Value of overdue follow-ups</p>
            <p className="mt-1 font-heading text-3xl text-dash-ink">
              {formatPenceAsGBP(overdueValue)}
            </p>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="mb-3 font-heading text-lg text-dash-ink">
            Conversion rate by source
          </h2>
          <div className="border border-dash-line bg-dash-surface">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-dash-line">
                <tr>
                  <th className="px-4 py-3 font-heading font-bold text-dash-muted">
                    Source
                  </th>
                  <th className="px-4 py-3 text-right font-heading font-bold text-dash-muted">
                    Total
                  </th>
                  <th className="px-4 py-3 text-right font-heading font-bold text-dash-muted">
                    Won
                  </th>
                  <th className="px-4 py-3 text-right font-heading font-bold text-dash-muted">
                    Conversion Rate
                  </th>
                  <th className="px-4 py-3 text-right font-heading font-bold text-dash-muted">
                    Revenue
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dash-line">
                {conversionBySource.map((row) => (
                  <tr key={row.source}>
                    <td className="px-4 py-3 font-heading text-dash-ink">
                      {sourceLabels[row.source]}
                    </td>
                    <td className="px-4 py-3 text-right font-heading text-dash-ink">
                      {row.total}
                    </td>
                    <td className="px-4 py-3 text-right font-heading text-dash-ink">
                      {row.won}
                    </td>
                    <td className="px-4 py-3 text-right font-heading text-dash-ink">
                      {row.rate !== null ? `${row.rate.toFixed(0)}%` : "â€”"}
                    </td>
                    <td className="px-4 py-3 text-right font-heading text-dash-ink">
                      {formatPenceAsGBP(row.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="mb-3 font-heading text-lg text-dash-ink">
            Customers by status
          </h2>
          <div className="border border-dash-line bg-dash-surface">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-dash-line">
                <tr>
                  <th className="px-4 py-3 font-heading font-bold text-dash-muted">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right font-heading font-bold text-dash-muted">
                    Customers
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dash-line">
                {totalsByStatus.map((row) => (
                  <tr key={row.status}>
                    <td className="px-4 py-3 font-heading text-dash-ink">
                      {statusLabels[row.status]}
                    </td>
                    <td className="px-4 py-3 text-right font-heading text-dash-ink">
                      {row.count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
