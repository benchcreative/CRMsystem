import { prisma } from "@/lib/prisma";
import { sourceLabels } from "@/lib/labels";
import { formatPenceAsGBP } from "@/lib/currency";
import { NotificationBell } from "../components/NotificationBell";
import { getNotificationBellData } from "@/lib/notifications";
import { AdSpendForm } from "./components/AdSpendForm";
import Link from "next/link";
import type { Source } from "@prisma/client";
import { penceToPoundsString } from "@/lib/currency";

function monthLabel(date: Date): string {
  return date.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

function toMonthParam(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthEnd(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1);
}

function divide(numerator: number, denominator: number): number | null {
  return denominator > 0 ? numerator / denominator : null;
}

export default async function MarketingPage({
  searchParams,
}: {
  searchParams: Promise<{ source?: string; month?: string }>;
}) {
  const { source: editSource, month: editMonth } = await searchParams;

  const [
    adSpends,
    { unreadCount, notifications },
    leadsByCampaign,
    wonByCampaign,
  ] = await Promise.all([
    prisma.adSpend.findMany({ orderBy: [{ month: "desc" }, { source: "asc" }] }),
    getNotificationBellData(),
    prisma.customer.groupBy({
      by: ["utmCampaign"],
      where: { utmCampaign: { not: null } },
      _count: { _all: true },
    }),
    prisma.customer.groupBy({
      by: ["utmCampaign"],
      where: { utmCampaign: { not: null }, status: "won" },
      _count: { _all: true },
      _sum: { value: true },
    }),
  ]);

  const wonByCampaignMap = new Map(
    wonByCampaign.map((row) => [row.utmCampaign, row])
  );
  const campaignRows = leadsByCampaign
    .map((row) => {
      const won = wonByCampaignMap.get(row.utmCampaign);
      return {
        campaign: row.utmCampaign as string,
        leads: row._count._all,
        jobsWon: won?._count._all ?? 0,
        revenueWon: won?._sum.value ?? 0,
      };
    })
    .sort((a, b) => b.leads - a.leads || a.campaign.localeCompare(b.campaign));

  // Cohort attribution: a lead is attributed to the month it was created,
  // not the month (if any) it later converted â€” so spend in a given month
  // is compared against the leads that spend actually generated, not
  // whatever happened to close out that month.
  const rows = await Promise.all(
    adSpends.map(async (adSpend) => {
      const where = {
        source: adSpend.source,
        createdAt: { gte: adSpend.month, lt: monthEnd(adSpend.month) },
      };
      const [totalLeads, wonCustomers] = await Promise.all([
        prisma.customer.count({ where }),
        prisma.customer.findMany({
          where: { ...where, status: "won" },
          select: { value: true },
        }),
      ]);
      const jobsWon = wonCustomers.length;
      const revenueWon = wonCustomers.reduce(
        (sum, customer) => sum + (customer.value ?? 0),
        0
      );

      return {
        id: adSpend.id,
        source: adSpend.source,
        month: adSpend.month,
        amount: adSpend.amount,
        totalLeads,
        jobsWon,
        revenueWon,
        costPerLead: divide(adSpend.amount, totalLeads),
        costPerJobWon: divide(adSpend.amount, jobsWon),
      };
    })
  );

  const editingRow = adSpends.find(
    (row) => row.source === editSource && toMonthParam(row.month) === editMonth
  );
  const defaultValues =
    editSource || editMonth
      ? {
          source: editSource ?? "",
          month: editMonth ?? "",
          amount: editingRow ? penceToPoundsString(editingRow.amount) : "",
        }
      : undefined;

  return (
    <div className="flex-1 bg-dash-bg">
      <main className="mx-auto max-w-6xl px-8 py-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl text-dash-ink">Marketing</h1>
            <p className="mt-1 text-sm text-dash-muted">
              Monthly ad spend and ROI by source.
            </p>
          </div>
          <NotificationBell unreadCount={unreadCount} notifications={notifications} />
        </div>

        <div className="mt-6 border border-dash-line bg-dash-surface p-6">
          {/* Keyed on the edit target so a client-side nav to a different
              ?source=&month= (via a row's Edit link) remounts the form â€”
              otherwise the <select>/<input> defaultValues, which only apply
              on mount, would keep showing whatever was there before. */}
          <AdSpendForm
            key={`${editSource ?? ""}-${editMonth ?? ""}`}
            defaultValues={defaultValues}
          />
        </div>

        <div className="mt-8 border border-dash-line bg-dash-surface">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-dash-line">
              <tr>
                <th className="px-4 py-3 font-heading font-bold text-dash-muted">
                  Source
                </th>
                <th className="px-4 py-3 font-heading font-bold text-dash-muted">
                  Month
                </th>
                <th className="px-4 py-3 text-right font-heading font-bold text-dash-muted">
                  Spend
                </th>
                <th className="px-4 py-3 text-right font-heading font-bold text-dash-muted">
                  Leads
                </th>
                <th className="px-4 py-3 text-right font-heading font-bold text-dash-muted">
                  Cost / Lead
                </th>
                <th className="px-4 py-3 text-right font-heading font-bold text-dash-muted">
                  Jobs Won
                </th>
                <th className="px-4 py-3 text-right font-heading font-bold text-dash-muted">
                  Cost / Job Won
                </th>
                <th className="px-4 py-3 text-right font-heading font-bold text-dash-muted">
                  Revenue Won
                </th>
                <th className="px-4 py-3 font-heading font-bold text-dash-muted"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dash-line">
              {rows.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-dash-muted">
                    No spend logged yet. Add a month above to get started.
                  </td>
                </tr>
              )}
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-3 font-heading text-dash-ink">
                    {sourceLabels[row.source as Source]}
                  </td>
                  <td className="px-4 py-3 text-dash-muted">
                    {monthLabel(row.month)}
                  </td>
                  <td className="px-4 py-3 text-right font-heading text-dash-ink">
                    {formatPenceAsGBP(row.amount)}
                  </td>
                  <td className="px-4 py-3 text-right text-dash-muted">
                    {row.totalLeads}
                  </td>
                  <td className="px-4 py-3 text-right text-dash-muted">
                    {row.costPerLead !== null
                      ? formatPenceAsGBP(Math.round(row.costPerLead))
                      : "â€”"}
                  </td>
                  <td className="px-4 py-3 text-right text-dash-muted">
                    {row.jobsWon}
                  </td>
                  <td className="px-4 py-3 text-right text-dash-muted">
                    {row.costPerJobWon !== null
                      ? formatPenceAsGBP(Math.round(row.costPerJobWon))
                      : "â€”"}
                  </td>
                  <td className="px-4 py-3 text-right font-heading text-dash-ink">
                    {formatPenceAsGBP(row.revenueWon)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/marketing?source=${row.source}&month=${toMonthParam(row.month)}`}
                      className="text-xs text-dash-muted transition-colors hover:text-dash-ink"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8">
          <h2 className="mb-3 font-heading text-lg text-dash-ink">By campaign</h2>
          <div className="border border-dash-line bg-dash-surface">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-dash-line">
                <tr>
                  <th className="px-4 py-3 font-heading font-bold text-dash-muted">
                    Campaign
                  </th>
                  <th className="px-4 py-3 text-right font-heading font-bold text-dash-muted">
                    Leads
                  </th>
                  <th className="px-4 py-3 text-right font-heading font-bold text-dash-muted">
                    Jobs Won
                  </th>
                  <th className="px-4 py-3 text-right font-heading font-bold text-dash-muted">
                    Revenue Won
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dash-line">
                {campaignRows.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-dash-muted">
                      No campaign-tagged leads yet. They appear here once
                      someone books via a link with utm_campaign set.
                    </td>
                  </tr>
                )}
                {campaignRows.map((row) => (
                  <tr key={row.campaign}>
                    <td className="px-4 py-3 font-heading text-dash-ink">
                      {row.campaign}
                    </td>
                    <td className="px-4 py-3 text-right text-dash-muted">
                      {row.leads}
                    </td>
                    <td className="px-4 py-3 text-right text-dash-muted">
                      {row.jobsWon}
                    </td>
                    <td className="px-4 py-3 text-right font-heading text-dash-ink">
                      {formatPenceAsGBP(row.revenueWon)}
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
