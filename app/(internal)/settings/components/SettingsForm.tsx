"use client";

import { useActionState } from "react";
import type { SettingsFormState } from "../actions";

const initialState: SettingsFormState = { errors: {}, values: {} };

const inputClasses =
  "w-full border border-dash-line bg-dash-bg px-3 py-2 text-sm text-dash-ink focus:border-dash-ink focus:outline-none";

const labelClasses = "mb-1 block text-sm text-dash-muted";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-error">{message}</p>;
}

export function SettingsForm({
  action,
  defaultValues,
}: {
  action: (
    state: SettingsFormState,
    formData: FormData
  ) => Promise<SettingsFormState>;
  defaultValues: Record<string, string>;
}) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  const value = (field: string) =>
    state.values[field] ?? defaultValues[field] ?? "";

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label htmlFor="companyName" className={labelClasses}>
          Company name
        </label>
        <input
          id="companyName"
          name="companyName"
          type="text"
          defaultValue={value("companyName")}
          className={inputClasses}
        />
        <FieldError message={state.errors.companyName} />
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
        <label htmlFor="vatNumber" className={labelClasses}>
          VAT number <span className="text-dash-muted">(optional)</span>
        </label>
        <input
          id="vatNumber"
          name="vatNumber"
          type="text"
          defaultValue={value("vatNumber")}
          className={inputClasses}
        />
        <FieldError message={state.errors.vatNumber} />
      </div>

      <div>
        <label htmlFor="notificationEmail" className={labelClasses}>
          Notification email <span className="text-dash-muted">(optional)</span>
        </label>
        <input
          id="notificationEmail"
          name="notificationEmail"
          type="email"
          defaultValue={value("notificationEmail")}
          className={inputClasses}
        />
        <p className="mt-1 text-xs text-dash-muted">
          Where alert emails (overdue leads, quote accepted/declined,
          expiring quotes) are sent. Leave blank to turn off alert emails.
        </p>
        <FieldError message={state.errors.notificationEmail} />
      </div>

      <div>
        <label htmlFor="allowedEmbedDomains" className={labelClasses}>
          Allowed embed domains <span className="text-dash-muted">(optional)</span>
        </label>
        <input
          id="allowedEmbedDomains"
          name="allowedEmbedDomains"
          type="text"
          placeholder="e.g. clientsite.co.uk, anothersite.com"
          defaultValue={value("allowedEmbedDomains")}
          className={inputClasses}
        />
        <p className="mt-1 text-xs text-dash-muted">
          Comma-separated websites allowed to use the embedded booking form.
          The www. version of each is included automatically. Localhost is
          always allowed for testing.
        </p>
        <FieldError message={state.errors.allowedEmbedDomains} />
      </div>

      <div className="grid grid-cols-[1fr_auto] gap-4">
        <div>
          <label htmlFor="logoUrl" className={labelClasses}>
            Email logo URL <span className="text-dash-muted">(optional)</span>
          </label>
          <input
            id="logoUrl"
            name="logoUrl"
            type="url"
            placeholder="https://yoursite.co.uk/logo.png"
            defaultValue={value("logoUrl")}
            className={inputClasses}
          />
          <p className="mt-1 text-xs text-dash-muted">
            A public PNG or JPG link. SVGs don&apos;t show in most email apps.
            Leave blank to show the company name instead.
          </p>
          <FieldError message={state.errors.logoUrl} />
        </div>
        <div>
          <label htmlFor="brandColor" className={labelClasses}>
            Brand colour
          </label>
          <input
            id="brandColor"
            name="brandColor"
            type="color"
            defaultValue={value("brandColor") || "#D98A2E"}
            className="h-10 w-20 cursor-pointer border border-dash-line bg-dash-bg p-1"
          />
          <FieldError message={state.errors.brandColor} />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="bg-accent px-4 py-2 text-sm text-canvas transition-colors hover:bg-accent/90 disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Save settings"}
        </button>
      </div>
    </form>
  );
}
