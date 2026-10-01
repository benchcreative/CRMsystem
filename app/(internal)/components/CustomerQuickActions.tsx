"use client";

import Link from "next/link";
import { useState } from "react";
import { toE164 } from "@/lib/phone";

const actionButtonClasses =
  "border border-dash-line px-2.5 py-1.5 text-xs text-dash-ink transition-colors hover:border-dash-ink";

export function CustomerQuickActions({
  customerId,
  name,
  phone,
  email,
  triggerClassName,
}: {
  customerId: string;
  name: string;
  phone: string;
  email: string;
  triggerClassName?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <span className="relative inline-block">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className={`bg-transparent p-0 text-left ${triggerClassName ?? ""}`}
      >
        {name}
      </button>

      {isOpen && (
        <>
          {/* Click-outside catcher — same pattern as NotificationBell. */}
          <button
            type="button"
            aria-label="Close quick actions"
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-10 cursor-default"
          />
          <div className="absolute left-0 top-full z-20 mt-1 w-64 border border-dash-line bg-dash-surface p-3 text-sm shadow-none">
            <p className="text-dash-ink">{phone}</p>
            <p className="mt-0.5 text-dash-muted">{email}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a href={`mailto:${email}`} className={actionButtonClasses}>
                Email
              </a>
              <a href={`sms:${toE164(phone)}`} className={actionButtonClasses}>
                Text
              </a>
              <Link
                href={`/customers/${customerId}/edit`}
                onClick={() => setIsOpen(false)}
                className={actionButtonClasses}
              >
                View profile
              </Link>
            </div>
          </div>
        </>
      )}
    </span>
  );
}
