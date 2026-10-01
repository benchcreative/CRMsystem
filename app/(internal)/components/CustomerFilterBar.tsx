"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Customer } from "@prisma/client";
import {
  jobTypeLabels,
  jobTypeOrder,
  sourceLabels,
  sourceOrder,
  needsFollowUp,
} from "@/lib/labels";
import { formatRelativeDate, formatDateTime } from "@/lib/date";
import { formatPenceAsGBP } from "@/lib/currency";
import { formatCustomerName } from "@/lib/customer";
import { StatusBadge } from "./StatusBadge";
import { LogContactButton } from "./LogContactButton";
import { CustomerQuickActions } from "./CustomerQuickActions";

export type CustomerRow = Customer & { lastContactedAt: Date | null };

const RANGE_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All time" },
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
];

const selectClasses =
  "border border-dash-line bg-dash-bg px-2.5 py-1.5 text-sm text-dash-ink focus:border-dash-ink focus:outline-none";

export function CustomerFilterBar({
  customers,
  totalCount,
  activeSource,
  activeJobType,
  activeRange,
}: {
  customers: CustomerRow[];
  totalCount: number;
  activeSource: string;
  activeJobType: string;
  activeRange: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchText, setSearchText] = useState("");

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  const hasActiveFilters =
    Boolean(activeSource) ||
    Boolean(activeJobType) ||
    activeRange !== "all" ||
    searchParams.has("status") ||
    searchParams.has("overdue") ||
    searchText.trim() !== "";

  // Clearing filters resets everything except which view (Leads/Customers)
  // we're in — that's navigation, not a filter.
  const view = searchParams.get("view");
  const clearFiltersHref = view ? `${pathname}?view=${view}` : pathname;

  const visibleCustomers = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return customers;
    return customers.filter(
      (customer) =>
        formatCustomerName(customer).toLowerCase().includes(query) ||
        customer.phone.toLowerCase().includes(query)
    );
  }, [customers, searchText]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Search by name or phone..."
          className="w-64 border border-dash-line bg-dash-bg px-3 py-1.5 text-sm text-dash-ink placeholder:text-dash-muted focus:border-dash-ink focus:outline-none"
        />

        <select
          value={activeSource}
          onChange={(e) => updateParam("source", e.target.value)}
          className={selectClasses}
        >
          <option value="">All sources</option>
          {sourceOrder.map((source) => (
            <option key={source} value={source}>
              {sourceLabels[source]}
            </option>
          ))}
        </select>

        <select
          value={activeJobType}
          onChange={(e) => updateParam("jobType", e.target.value)}
          className={selectClasses}
        >
          <option value="">All job types</option>
          {jobTypeOrder.map((jobType) => (
            <option key={jobType} value={jobType}>
              {jobTypeLabels[jobType]}
            </option>
          ))}
        </select>

        <select
          value={activeRange}
          onChange={(e) => updateParam("range", e.target.value)}
          className={selectClasses}
        >
          {RANGE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {hasActiveFilters && (
          <Link
            href={clearFiltersHref}
            onClick={() => setSearchText("")}
            className="text-sm text-dash-muted transition-colors hover:text-dash-ink"
          >
            Clear filters
          </Link>
        )}
      </div>

      <p className="mb-3 text-sm text-dash-muted">
        {visibleCustomers.length} of {totalCount} customer
        {totalCount === 1 ? "" : "s"}
      </p>

      <div className="border border-dash-line bg-dash-surface">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-dash-line">
            <tr>
              <th className="px-4 py-3 font-heading font-bold text-dash-muted">
                Name
              </th>
              <th className="px-4 py-3 font-heading font-bold text-dash-muted">
                Phone
              </th>
              <th className="px-4 py-3 font-heading font-bold text-dash-muted">
                Job Type
              </th>
              <th className="px-4 py-3 font-heading font-bold text-dash-muted">
                Source
              </th>
              <th className="px-4 py-3 text-right font-heading font-bold text-dash-muted">
                Value
              </th>
              <th className="px-4 py-3 font-heading font-bold text-dash-muted">
                Status
              </th>
              <th className="px-4 py-3 font-heading font-bold text-dash-muted">
                Appointment
              </th>
              <th className="px-4 py-3 text-right font-heading font-bold text-dash-muted">
                Last Contacted
              </th>
              <th className="px-4 py-3 font-heading font-bold text-dash-muted"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dash-line">
            {visibleCustomers.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-dash-muted">
                  No customers match these filters.
                </td>
              </tr>
            )}
            {visibleCustomers.map((customer) => {
              const flagged = needsFollowUp(
                customer.status,
                customer.lastContactedAt
              );
              return (
                <tr key={customer.id} className="transition-colors hover:bg-dash-line/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {flagged && (
                        <span
                          title="Needs follow-up"
                          className="h-1.5 w-1.5 shrink-0 bg-accent"
                        />
                      )}
                      <CustomerQuickActions
                        customerId={customer.id}
                        name={formatCustomerName(customer)}
                        phone={customer.phone}
                        email={customer.email}
                        triggerClassName="font-heading text-dash-ink hover:underline"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-dash-muted">{customer.phone}</td>
                  <td className="px-4 py-3 text-dash-muted">
                    {jobTypeLabels[customer.jobType]}
                  </td>
                  <td className="px-4 py-3 text-dash-muted">
                    {sourceLabels[customer.source]}
                  </td>
                  <td className="px-4 py-3 text-right text-dash-muted">
                    {formatPenceAsGBP(customer.value)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={customer.status} />
                  </td>
                  <td className="px-4 py-3 text-dash-muted">
                    {customer.appointmentAt
                      ? formatDateTime(customer.appointmentAt)
                      : ""}
                  </td>
                  <td className="px-4 py-3 text-right text-dash-muted">
                    {formatRelativeDate(customer.lastContactedAt)}
                  </td>
                  <td className="px-4 py-3">
                    <LogContactButton customerId={customer.id} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
