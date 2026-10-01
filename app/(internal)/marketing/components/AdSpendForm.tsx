"use client";

import { useActionState } from "react";
import { adSpendSourceOrder, sourceLabels } from "@/lib/labels";
import { saveAdSpend, type AdSpendFormState } from "../actions";

const initialState: AdSpendFormState = { errors: {}, values: {} };

const inputClasses =
  "w-full border border-dash-line bg-dash-bg px-3 py-2 text-sm text-dash-ink focus:border-dash-ink focus:outline-none";

const labelClasses = "mb-1 block text-sm text-dash-muted";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-error">{message}</p>;
}

function currentMonthParam(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function AdSpendForm({
  defaultValues,
}: {
  defaultValues?: { source?: string; month?: string; amount?: string };
}) {
  const [state, formAction, isPending] = useActionState(
    saveAdSpend,
    initialState
  );

  const value = (field: string) =>
    state.values[field] ?? defaultValues?.[field as keyof typeof defaultValues] ?? "";

  return (
    <form action={formAction} className="grid grid-cols-1 gap-4 sm:grid-cols-4 sm:items-end">
      <div>
        <label htmlFor="source" className={labelClasses}>
          Source
        </label>
        <select
          id="source"
          name="source"
          defaultValue={value("source")}
          className={inputClasses}
        >
          <option value="" disabled>
            Select...
          </option>
          {adSpendSourceOrder.map((source) => (
            <option key={source} value={source}>
              {sourceLabels[source]}
            </option>
          ))}
        </select>
        <FieldError message={state.errors.source} />
      </div>

      <div>
        <label htmlFor="month" className={labelClasses}>
          Month
        </label>
        <input
          id="month"
          name="month"
          type="month"
          defaultValue={value("month") || currentMonthParam()}
          className={inputClasses}
        />
        <FieldError message={state.errors.month} />
      </div>

      <div>
        <label htmlFor="amount" className={labelClasses}>
          Spend (£)
        </label>
        <input
          id="amount"
          name="amount"
          type="number"
          step="0.01"
          min="0"
          inputMode="decimal"
          defaultValue={value("amount")}
          className={inputClasses}
        />
        <FieldError message={state.errors.amount} />
      </div>

      <div>
        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-accent px-4 py-2 text-sm text-canvas transition-colors hover:bg-accent/90 disabled:opacity-50 sm:w-auto"
        >
          {isPending ? "Saving..." : "Save spend"}
        </button>
      </div>
    </form>
  );
}
