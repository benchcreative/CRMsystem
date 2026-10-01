"use client";

import { useState } from "react";
import { logContact } from "../actions";

type Direction = "outbound_call" | "inbound_call";

const directionButtonClasses = (active: boolean) =>
  `shrink-0 border px-2 py-1 text-xs ${
    active
      ? "border-dash-ink bg-dash-ink text-dash-bg"
      : "border-dash-line text-dash-muted transition-colors hover:border-dash-ink hover:text-dash-ink"
  }`;

export function LogContactButton({ customerId }: { customerId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [direction, setDirection] = useState<Direction | null>(null);
  const action = logContact.bind(null, customerId);

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="border border-dash-line px-3 py-1 text-xs text-dash-muted transition-colors hover:text-dash-ink hover:border-dash-ink"
      >
        Log contact
      </button>
    );
  }

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!direction) {
          e.preventDefault();
          return;
        }
        setIsOpen(false);
      }}
      className="flex flex-wrap items-center gap-1.5"
    >
      <input type="hidden" name="direction" value={direction ?? ""} />
      <button
        type="button"
        onClick={() => setDirection("outbound_call")}
        className={directionButtonClasses(direction === "outbound_call")}
      >
        Outbound call
      </button>
      <button
        type="button"
        onClick={() => setDirection("inbound_call")}
        className={directionButtonClasses(direction === "inbound_call")}
      >
        Inbound call
      </button>
      <input
        type="text"
        name="note"
        placeholder="Note (optional)"
        className="w-32 border border-dash-line bg-dash-bg px-2 py-1 text-xs text-dash-ink placeholder:text-dash-muted focus:border-dash-ink focus:outline-none"
      />
      <button
        type="submit"
        disabled={!direction}
        title={direction ? undefined : "Choose a direction first"}
        className="shrink-0 border border-dash-line px-2.5 py-1 text-xs text-dash-ink transition-colors hover:border-dash-ink disabled:cursor-not-allowed disabled:opacity-50"
      >
        Save
      </button>
      <button
        type="button"
        onClick={() => {
          setIsOpen(false);
          setDirection(null);
        }}
        className="shrink-0 px-2 py-1 text-xs text-dash-muted hover:text-dash-ink"
      >
        Cancel
      </button>
    </form>
  );
}
