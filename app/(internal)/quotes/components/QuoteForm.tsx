"use client";

import { useActionState, useState } from "react";
import { calculateQuoteTotals } from "@/lib/quote";
import { formatPenceAsGBP, poundsToPence } from "@/lib/currency";
import type { QuoteFormState } from "../actions";

const initialState: QuoteFormState = { error: null };

const inputClasses =
  "w-full border border-dash-line bg-dash-bg px-3 py-2 text-sm text-dash-ink focus:border-dash-ink focus:outline-none";

const labelClasses = "mb-1 block text-sm text-dash-muted";

type LineItemRow = {
  key: string;
  description: string;
  quantity: string;
  unit: string;
  unitPrice: string;
};

function emptyRow(): LineItemRow {
  return {
    key: crypto.randomUUID(),
    description: "",
    quantity: "1",
    unit: "",
    unitPrice: "",
  };
}

export function QuoteForm({
  action,
}: {
  action: (
    state: QuoteFormState,
    formData: FormData
  ) => Promise<QuoteFormState>;
}) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  const [rows, setRows] = useState<LineItemRow[]>(() => [emptyRow()]);
  const [vatEnabled, setVatEnabled] = useState(false);
  const [vatRate, setVatRate] = useState("20");

  function addRow() {
    setRows((prev) => [...prev, emptyRow()]);
  }

  function removeRow(key: string) {
    setRows((prev) => prev.filter((row) => row.key !== key));
  }

  function updateRow(key: string, field: keyof LineItemRow, value: string) {
    setRows((prev) =>
      prev.map((row) => (row.key === key ? { ...row, [field]: value } : row))
    );
  }

  const parsedLineItems = rows.map((row) => ({
    quantity: Number(row.quantity) || 0,
    unitPrice: poundsToPence(Number(row.unitPrice) || 0),
  }));

  const { subtotal, vatAmount, total } = calculateQuoteTotals(
    parsedLineItems,
    vatEnabled,
    Number(vatRate) || 0
  );

  return (
    <form action={formAction} className="space-y-6">
      <div>
        <p className={labelClasses}>Line items</p>
        <div className="border border-dash-line bg-dash-surface">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-dash-line">
              <tr>
                <th className="px-3 py-2 font-heading font-bold text-dash-muted">
                  Description
                </th>
                <th className="w-24 px-3 py-2 text-right font-heading font-bold text-dash-muted">
                  Qty
                </th>
                <th className="w-28 px-3 py-2 font-heading font-bold text-dash-muted">
                  Unit
                </th>
                <th className="w-32 px-3 py-2 text-right font-heading font-bold text-dash-muted">
                  Unit price (Â£)
                </th>
                <th className="w-28 px-3 py-2 text-right font-heading font-bold text-dash-muted">
                  Line total
                </th>
                <th className="w-10 px-3 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dash-line">
              {rows.map((row) => {
                const lineTotal = Math.round(
                  (Number(row.quantity) || 0) *
                    poundsToPence(Number(row.unitPrice) || 0)
                );
                return (
                  <tr key={row.key}>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        name="description"
                        value={row.description}
                        onChange={(e) =>
                          updateRow(row.key, "description", e.target.value)
                        }
                        placeholder="e.g. Supply and fit oak worktop"
                        className={inputClasses}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        name="quantity"
                        step="any"
                        min="0"
                        value={row.quantity}
                        onChange={(e) =>
                          updateRow(row.key, "quantity", e.target.value)
                        }
                        className={`${inputClasses} text-right`}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        name="unit"
                        value={row.unit}
                        onChange={(e) =>
                          updateRow(row.key, "unit", e.target.value)
                        }
                        placeholder="each"
                        className={inputClasses}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        name="unitPrice"
                        step="0.01"
                        min="0"
                        value={row.unitPrice}
                        onChange={(e) =>
                          updateRow(row.key, "unitPrice", e.target.value)
                        }
                        className={`${inputClasses} text-right`}
                      />
                    </td>
                    <td className="px-3 py-2 text-right text-dash-muted">
                      {formatPenceAsGBP(lineTotal)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => removeRow(row.key)}
                        className="text-dash-muted transition-colors hover:text-dash-ink"
                        aria-label="Remove line item"
                      >
                        &times;
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <button
          type="button"
          onClick={addRow}
          className="mt-2 border border-dash-line px-3 py-1 text-xs text-dash-ink transition-colors hover:border-dash-ink"
        >
          + Add line item
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="validUntil" className={labelClasses}>
            Valid until <span className="text-dash-muted">(optional)</span>
          </label>
          <input
            id="validUntil"
            name="validUntil"
            type="date"
            className={inputClasses}
          />
        </div>
        <div className="flex items-end gap-4">
          <div className="flex items-center gap-2 pb-2">
            <input
              id="vatEnabled"
              name="vatEnabled"
              type="checkbox"
              checked={vatEnabled}
              onChange={(e) => setVatEnabled(e.target.checked)}
              className="h-4 w-4 border border-dash-line bg-dash-bg"
            />
            <label htmlFor="vatEnabled" className="text-sm text-dash-ink">
              VAT applies
            </label>
          </div>
          <div className="flex-1">
            <label htmlFor="vatRate" className={labelClasses}>
              VAT rate (%)
            </label>
            <input
              id="vatRate"
              name="vatRate"
              type="number"
              step="0.1"
              min="0"
              value={vatRate}
              onChange={(e) => setVatRate(e.target.value)}
              disabled={!vatEnabled}
              className={`${inputClasses} disabled:opacity-50`}
            />
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="notes" className={labelClasses}>
          Notes / terms <span className="text-dash-muted">(optional)</span>
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={4}
          placeholder="Payment terms, exclusions, warranty details..."
          className={inputClasses}
        />
      </div>

      <div className="border border-dash-line bg-dash-surface p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-dash-muted">Subtotal</span>
          <span className="font-heading text-dash-ink">
            {formatPenceAsGBP(subtotal)}
          </span>
        </div>
        {vatEnabled && (
          <div className="mt-1 flex items-center justify-between text-sm">
            <span className="text-dash-muted">VAT ({vatRate || 0}%)</span>
            <span className="font-heading text-dash-ink">
              {formatPenceAsGBP(vatAmount)}
            </span>
          </div>
        )}
        <div className="mt-2 flex items-center justify-between border-t border-dash-line pt-2 text-sm">
          <span className="text-dash-ink">Total</span>
          <span className="font-heading text-lg text-dash-ink">
            {formatPenceAsGBP(total)}
          </span>
        </div>
      </div>

      {state.error && <p className="text-sm text-error">{state.error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="bg-accent px-4 py-2 text-sm text-canvas transition-colors hover:bg-accent/90 disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Save as draft"}
        </button>
      </div>
    </form>
  );
}
