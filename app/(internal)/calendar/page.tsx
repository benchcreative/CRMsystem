import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { toDateParam } from "@/lib/date";
import { NotificationBell } from "../components/NotificationBell";
import { getNotificationBellData } from "@/lib/notifications";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function parseMonthParam(param: string | undefined): {
  year: number;
  month: number;
} {
  if (param && /^\d{4}-\d{2}$/.test(param)) {
    const [year, month] = param.split("-").map(Number);
    if (month >= 1 && month <= 12) return { year, month: month - 1 };
  }
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() };
}

function toMonthParam(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month: monthParam } = await searchParams;
  const { year, month } = parseMonthParam(monthParam);

  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const customers = await prisma.customer.findMany({
    where: { appointmentAt: { gte: monthStart, lt: monthEnd } },
    select: { appointmentAt: true },
  });

  const { unreadCount, notifications } = await getNotificationBellData();

  const countsByDay = new Map<number, number>();
  for (const customer of customers) {
    const day = customer.appointmentAt!.getDate();
    countsByDay.set(day, (countsByDay.get(day) ?? 0) + 1);
  }

  // JS getDay() is 0=Sun..6=Sat; shift so the grid starts on Monday.
  const firstWeekday = (monthStart.getDay() + 6) % 7;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isCurrentMonth =
    today.getFullYear() === year && today.getMonth() === month;

  const monthLabel = monthStart.toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

  const prevMonth = new Date(year, month - 1, 1);
  const nextMonth = new Date(year, month + 1, 1);

  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="flex-1 bg-dash-bg">
      <main className="mx-auto max-w-3xl px-8 py-8">
        <div className="flex items-start justify-between gap-4">
          <Link href="/customers" className="text-sm text-dash-muted transition-colors hover:text-dash-ink">
            Back to customers
          </Link>
          <NotificationBell unreadCount={unreadCount} notifications={notifications} />
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-heading text-2xl text-dash-ink">{monthLabel}</h1>
          <div className="flex items-center gap-2 text-sm">
            <Link
              href={`/calendar?month=${toMonthParam(prevMonth.getFullYear(), prevMonth.getMonth())}`}
              className="border border-dash-line px-3 py-1.5 text-dash-ink transition-colors hover:border-dash-ink"
            >
              &larr; Prev
            </Link>
            {!isCurrentMonth && (
              <Link
                href="/calendar"
                className="border border-dash-line px-3 py-1.5 text-dash-ink transition-colors hover:border-dash-ink"
              >
                Today
              </Link>
            )}
            <Link
              href={`/calendar?month=${toMonthParam(nextMonth.getFullYear(), nextMonth.getMonth())}`}
              className="border border-dash-line px-3 py-1.5 text-dash-ink transition-colors hover:border-dash-ink"
            >
              Next &rarr;
            </Link>
          </div>
        </div>

        <div className="mt-6 border-l border-t border-dash-line bg-dash-surface">
          <div className="grid grid-cols-7">
            {WEEKDAY_LABELS.map((label) => (
              <div
                key={label}
                className="border-b border-r border-dash-line px-2 py-2 text-center text-xs text-dash-muted"
              >
                {label}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((day, index) => {
              if (day === null) {
                return (
                  <div
                    key={index}
                    className="min-h-20 border-b border-r border-dash-line"
                  />
                );
              }

              const count = countsByDay.get(day) ?? 0;
              const cellDate = new Date(year, month, day);
              const isToday = isCurrentMonth && today.getDate() === day;

              return (
                <Link
                  key={index}
                  href={`/schedule?date=${toDateParam(cellDate)}`}
                  className="flex min-h-20 flex-col gap-1 border-b border-r border-dash-line p-2 text-sm transition-colors hover:bg-dash-line/30"
                >
                  <span
                    className={
                      isToday ? "font-heading text-accent" : "text-dash-ink"
                    }
                  >
                    {day}
                  </span>
                  {count > 0 && (
                    <span className="flex items-center gap-1 text-xs text-dash-muted">
                      <span className="h-1.5 w-1.5 shrink-0 bg-accent" />
                      {count}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
