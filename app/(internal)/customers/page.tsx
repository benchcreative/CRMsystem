import Link from "next/link";
import type { Prisma, Status } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  statusLabels,
  statusOrder,
  isStatus,
  isSource,
  isJobType,
  needsFollowUp,
} from "@/lib/labels";
import { CustomerFilterBar } from "../components/CustomerFilterBar";
import { NotificationBell } from "../components/NotificationBell";
import { getNotificationBellData } from "@/lib/notifications";

const TABS: { value: Status | "all"; label: string }[] = [
  { value: "all", label: "All" },
  ...statusOrder.map((status) => ({ value: status, label: statusLabels[status] })),
];

// "Leads" = anyone not yet won or lost; "Customers" = people who've
// actually bought. Lost stays reachable only as its own tab under Leads,
// not shown by default under either — see the pasted spec's point 3.
const LEAD_STATUSES: Status[] = ["new", "quote_booked", "quoted"];
const CUSTOMER_STATUSES: Status[] = ["won"];

type View = "leads" | "customers";

function isView(value: string): value is View {
  return value === "leads" || value === "customers";
}

const LEADS_TABS: { value: Status | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "new", label: statusLabels.new },
  { value: "quote_booked", label: statusLabels.quote_booked },
  { value: "quoted", label: statusLabels.quoted },
  { value: "lost", label: statusLabels.lost },
];

const VIEW_COPY: Record<View, { title: string; subtitle: string }> = {
  leads: {
    title: "Leads",
    subtitle: "Track leads and jobs from first contact through to completion.",
  },
  customers: {
    title: "Customers",
    subtitle: "People who've bought — completed jobs and past customers.",
  },
};

const RANGE_DAYS: Record<string, number> = { "7": 7, "30": 30 };

function rangeCutoff(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{
    view?: string;
    status?: string;
    overdue?: string;
    source?: string;
    jobType?: string;
    range?: string;
  }>;
}) {
  const { view, status, overdue, source, jobType, range } = await searchParams;
  const activeView: View | null = view && isView(view) ? view : null;
  const activeStatus: Status | "all" =
    status && isStatus(status) ? status : "all";
  const overdueOnly = overdue === "true";
  const activeSource = source && isSource(source) ? source : "";
  const activeJobType = jobType && isJobType(jobType) ? jobType : "";
  const activeRange = range && RANGE_DAYS[range] ? range : "all";

  const viewHref = activeView ? `/customers?view=${activeView}` : "/customers";
  const tabs =
    activeView === "leads" ? LEADS_TABS : activeView === "customers" ? [] : TABS;
  const { title: pageTitle, subtitle: pageSubtitle } = activeView
    ? VIEW_COPY[activeView]
    : {
        title: "Customers",
        subtitle: "Track leads and jobs from first contact through to completion.",
      };

  const statusFilter: Prisma.CustomerWhereInput =
    activeStatus !== "all"
      ? { status: activeStatus }
      : activeView === "leads"
        ? { status: { in: LEAD_STATUSES } }
        : activeView === "customers"
          ? { status: { in: CUSTOMER_STATUSES } }
          : {};

  const where: Prisma.CustomerWhereInput = {
    ...statusFilter,
    ...(activeSource && { source: activeSource }),
    ...(activeJobType && { jobType: activeJobType }),
    ...(RANGE_DAYS[activeRange] && {
      createdAt: { gte: rangeCutoff(RANGE_DAYS[activeRange]) },
    }),
  };

  const [totalCount, rawCustomers, bellData] = await Promise.all([
    prisma.customer.count(),
    prisma.customer.findMany({
      where,
      include: {
        contactLogs: {
          orderBy: { contactedAt: "desc" },
          take: 1,
        },
      },
    }),
    getNotificationBellData(),
  ]);

  let customers = rawCustomers.map((customer) => ({
    ...customer,
    lastContactedAt: customer.contactLogs[0]?.contactedAt ?? null,
  }));

  if (overdueOnly) {
    customers = customers.filter((customer) =>
      needsFollowUp(customer.status, customer.lastContactedAt)
    );
  }

  customers = customers.sort((a, b) => {
    if (!a.lastContactedAt && !b.lastContactedAt) return 0;
    if (!a.lastContactedAt) return -1;
    if (!b.lastContactedAt) return 1;
    return a.lastContactedAt.getTime() - b.lastContactedAt.getTime();
  });

  return (
    <div className="flex-1 bg-dash-bg">
      <main className="mx-auto max-w-6xl px-8 py-8">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl text-dash-ink">{pageTitle}</h1>
            <p className="mt-1 text-sm text-dash-muted">{pageSubtitle}</p>
          </div>
          <div className="flex shrink-0 items-center gap-4">
            <NotificationBell
              unreadCount={bellData.unreadCount}
              notifications={bellData.notifications}
            />
            <Link
              href="/customers/new"
              className="bg-accent px-4 py-2 text-sm text-canvas transition-colors hover:bg-accent/90"
            >
              + Add customer
            </Link>
          </div>
        </div>

        {overdueOnly && (
          <div className="mb-6 flex items-center justify-between border border-dash-line bg-dash-surface px-4 py-2.5 text-sm text-dash-ink">
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 shrink-0 bg-accent" />
              Showing {customers.length} customer
              {customers.length === 1 ? "" : "s"} overdue for follow-up.
            </span>
            <Link href={viewHref} className="text-dash-muted transition-colors hover:text-dash-ink">
              Clear filter
            </Link>
          </div>
        )}

        {tabs.length > 0 && (
          <nav className="mb-6 flex flex-wrap gap-5 border-b border-dash-line">
            {tabs.map((tab) => {
              const isActive = activeStatus === tab.value;
              const tabHref =
                tab.value === "all"
                  ? viewHref
                  : `${viewHref}${viewHref.includes("?") ? "&" : "?"}status=${tab.value}`;
              return (
                <Link
                  key={tab.value}
                  href={tabHref}
                  className={`border-b-2 pb-2 text-sm ${
                    isActive
                      ? "border-dash-ink text-dash-ink"
                      : "border-transparent text-dash-muted transition-colors hover:text-dash-ink"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        )}

        <CustomerFilterBar
          customers={customers}
          totalCount={totalCount}
          activeSource={activeSource}
          activeJobType={activeJobType}
          activeRange={activeRange}
        />
      </main>
    </div>
  );
}
