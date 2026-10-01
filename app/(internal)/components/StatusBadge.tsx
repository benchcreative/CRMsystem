import type { Status } from "@prisma/client";
import { statusLabels } from "@/lib/labels";

const STATUS_MARKER_CLASSES: Record<Status, string> = {
  new: "bg-status-new",
  quote_booked: "bg-status-booked",
  quoted: "bg-status-quoted",
  won: "bg-status-won",
  lost: "bg-status-lost",
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={`h-2 w-2 shrink-0 ${STATUS_MARKER_CLASSES[status]}`}
      />
      <span className="text-dash-ink">{statusLabels[status]}</span>
    </span>
  );
}
