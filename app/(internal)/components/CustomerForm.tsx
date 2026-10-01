"use client";

import { useActionState } from "react";
import {
  jobTypeLabels,
  jobTypeOrder,
  sourceLabels,
  sourceOrder,
  statusLabels,
  manualStatusOrder,
  jobStatusLabels,
  jobStatusOrder,
} from "@/lib/labels";
import type { CustomerFormState } from "../actions";

const initialState: CustomerFormState = { errors: {}, values: {} };

const inputClasses =
  "w-full border border-dash-line bg-dash-bg px-3 py-2 text-sm text-dash-ink focus:border-dash-ink focus:outline-none";

const labelClasses = "mb-1 block text-sm text-dash-muted";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-error">{message}</p>;
}

export function CustomerForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: (
    state: CustomerFormState,
    formData: FormData
  ) => Promise<CustomerFormState>;
  defaultValues?: Record<string, string>;
  submitLabel: string;
}) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  const value = (field: string) =>
    state.values[field] ?? defaultValues?.[field] ?? "";

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="firstName" className={labelClasses}>
            First name
          </label>
          <input
            id="firstName"
            name="firstName"
            type="text"
            defaultValue={value("firstName")}
            className={inputClasses}
          />
          <FieldError message={state.errors.firstName} />
        </div>
        <div>
          <label htmlFor="lastName" className={labelClasses}>
            Last name
          </label>
          <input
            id="lastName"
            name="lastName"
            type="text"
            defaultValue={value("lastName")}
            className={inputClasses}
          />
          <FieldError message={state.errors.lastName} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="phone" className={labelClasses}>
            Phone
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={value("phone")}
            className={inputClasses}
          />
          <FieldError message={state.errors.phone} />
        </div>
        <div>
          <label htmlFor="email" className={labelClasses}>
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            defaultValue={value("email")}
            className={inputClasses}
          />
          <FieldError message={state.errors.email} />
        </div>
      </div>

      <div>
        <label htmlFor="addressLine1" className={labelClasses}>
          Address line 1
        </label>
        <input
          id="addressLine1"
          name="addressLine1"
          type="text"
          defaultValue={value("addressLine1")}
          className={inputClasses}
        />
        <FieldError message={state.errors.addressLine1} />
      </div>

      <div>
        <label htmlFor="addressLine2" className={labelClasses}>
          Address line 2 <span className="text-dash-muted">(optional)</span>
        </label>
        <input
          id="addressLine2"
          name="addressLine2"
          type="text"
          defaultValue={value("addressLine2")}
          className={inputClasses}
        />
        <FieldError message={state.errors.addressLine2} />
      </div>

      <div>
        <label htmlFor="postcode" className={labelClasses}>
          Postcode
        </label>
        <input
          id="postcode"
          name="postcode"
          type="text"
          defaultValue={value("postcode")}
          className={inputClasses}
        />
        <FieldError message={state.errors.postcode} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label htmlFor="jobType" className={labelClasses}>
            Job type
          </label>
          <select
            id="jobType"
            name="jobType"
            defaultValue={value("jobType")}
            className={inputClasses}
          >
            <option value="" disabled>
              Select...
            </option>
            {jobTypeOrder.map((jobType) => (
              <option key={jobType} value={jobType}>
                {jobTypeLabels[jobType]}
              </option>
            ))}
          </select>
          <FieldError message={state.errors.jobType} />
        </div>

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
            {sourceOrder.map((source) => (
              <option key={source} value={source}>
                {sourceLabels[source]}
              </option>
            ))}
          </select>
          <FieldError message={state.errors.source} />
        </div>

        <div>
          <label htmlFor="status" className={labelClasses}>
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={value("status") || "new"}
            className={inputClasses}
          >
            {manualStatusOrder.map((status) => (
              <option key={status} value={status}>
                {statusLabels[status]}
              </option>
            ))}
            {/* "Quoted" is system-set (see applyQuoteStatus) â€” only shown
                here, disabled, when that's already this customer's status,
                so the field displays correctly without becoming a choice. */}
            {value("status") === "quoted" && (
              <option value="quoted" disabled>
                {statusLabels.quoted} (system-set)
              </option>
            )}
          </select>
          <FieldError message={state.errors.status} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="jobStatus" className={labelClasses}>
            Job status
          </label>
          <select
            id="jobStatus"
            name="jobStatus"
            defaultValue={value("jobStatus") || "not_scheduled"}
            className={inputClasses}
          >
            {jobStatusOrder.map((jobStatus) => (
              <option key={jobStatus} value={jobStatus}>
                {jobStatusLabels[jobStatus]}
              </option>
            ))}
          </select>
          <FieldError message={state.errors.jobStatus} />
        </div>
        <div>
          <label htmlFor="installDate" className={labelClasses}>
            Install date <span className="text-dash-muted">(optional)</span>
          </label>
          <input
            id="installDate"
            name="installDate"
            type="date"
            defaultValue={value("installDate")}
            className={inputClasses}
          />
          <FieldError message={state.errors.installDate} />
        </div>
      </div>

      <div>
        <label htmlFor="value" className={labelClasses}>
          Estimated job value (Â£) <span className="text-dash-muted">(optional)</span>
        </label>
        <input
          id="value"
          name="value"
          type="number"
          step="0.01"
          min="0"
          inputMode="decimal"
          defaultValue={value("value")}
          className={inputClasses}
        />
        <FieldError message={state.errors.value} />
      </div>

      <div>
        <label htmlFor="notes" className={labelClasses}>
          Notes <span className="text-dash-muted">(optional)</span>
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={4}
          defaultValue={value("notes")}
          className={inputClasses}
        />
        <FieldError message={state.errors.notes} />
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="bg-accent px-4 py-2 text-sm text-canvas transition-colors hover:bg-accent/90 disabled:opacity-50"
        >
          {isPending ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
