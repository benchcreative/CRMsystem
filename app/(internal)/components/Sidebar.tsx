"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  DashboardIcon,
  LeadsIcon,
  CustomersIcon,
  QuotesIcon,
  ScheduleIcon,
  CalendarIcon,
  MarketingIcon,
  ReportsIcon,
  SettingsIcon,
} from "./icons";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/", icon: DashboardIcon },
  { label: "Leads", href: "/customers?view=leads", icon: LeadsIcon },
  { label: "Customers", href: "/customers?view=customers", icon: CustomersIcon },
  // No standalone quotes list page exists yet — shown for visual parity
  // with the reference design, disabled until one does.
  { label: "Quotes", href: null, icon: QuotesIcon },
  { label: "Schedule", href: "/schedule", icon: ScheduleIcon },
  { label: "Calendar", href: "/calendar", icon: CalendarIcon },
  { label: "Marketing", href: "/marketing", icon: MarketingIcon },
  { label: "Reports", href: "/reports", icon: ReportsIcon },
  { label: "Settings", href: "/settings", icon: SettingsIcon },
];

// Leads/Customers share a pathname (/customers) and are distinguished only
// by the ?view= query param, so active-state needs both the path and the
// current view — a plain pathname prefix match (as every other item uses)
// can't tell them apart.
function isActive(
  pathname: string,
  currentView: string | null,
  href: string
): boolean {
  const [hrefPath, hrefQuery] = href.split("?");
  if (hrefPath === "/") return pathname === "/";
  if (pathname !== hrefPath && !pathname.startsWith(`${hrefPath}/`)) {
    return false;
  }
  if (!hrefQuery) return true;
  return new URLSearchParams(hrefQuery).get("view") === currentView;
}

function NavList({
  pathname,
  currentView,
}: {
  pathname: string;
  currentView: string | null;
}) {
  return (
    <nav className="mt-8 space-y-1">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        if (!item.href) {
          return (
            <span
              key={item.label}
              title="Coming soon"
              className="flex cursor-not-allowed items-center gap-3 border-l-2 border-transparent px-3 py-2 text-sm text-white/25"
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </span>
          );
        }
        const active = isActive(pathname, currentView, item.href);
        return (
          <Link
            key={item.label}
            href={item.href}
            className={`flex items-center gap-3 border-l-2 px-3 py-2 text-sm transition-colors ${
              active
                ? "border-accent bg-accent/15 text-white"
                : "border-transparent text-white/55 hover:bg-white/5 hover:text-white/85"
            }`}
          >
            <Icon className="h-5 w-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarContent({
  companyName,
  pathname,
  currentView,
}: {
  companyName: string;
  pathname: string;
  currentView: string | null;
}) {
  return (
    <aside className="flex w-60 shrink-0 flex-col bg-dash-sidebar px-6 py-6">
      <span className="font-heading text-base text-white">{companyName}</span>
      <NavList pathname={pathname} currentView={currentView} />
    </aside>
  );
}

// Suspense fallback for the brief pre-hydration window on statically
// rendered pages (useSearchParams requires a Suspense boundary). Falls
// back to pathname-only matching, so Leads/Customers simply show neither
// highlighted until the real view-aware Sidebar takes over — everything
// else matches exactly as normal.
export function SidebarFallback({ companyName }: { companyName: string }) {
  const pathname = usePathname();
  return (
    <SidebarContent companyName={companyName} pathname={pathname} currentView={null} />
  );
}

export function Sidebar({ companyName }: { companyName: string }) {
  const pathname = usePathname();
  const currentView = useSearchParams().get("view");
  return (
    <SidebarContent
      companyName={companyName}
      pathname={pathname}
      currentView={currentView}
    />
  );
}
