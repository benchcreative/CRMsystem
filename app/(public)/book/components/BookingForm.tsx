"use client";

import {
  useActionState,
  useEffect,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react";
import { jobTypeLabels, jobTypeOrder } from "@/lib/labels";
import { UTM_KEYS, cleanUtmValue, type UtmParams } from "@/lib/utm";
import { HONEYPOT_FIELD } from "@/lib/honeypot";
import { getAvailableSlots, createBooking } from "../actions";
import type { BookingFormState } from "../actions";

const UTM_STORAGE_KEY = "bookingUtm";

// sessionStorage can throw (private mode, blocked storage) — attribution is
// best-effort, so any failure just means "no stored UTMs".
function readStoredUtm(): string | null {
  try {
    return sessionStorage.getItem(UTM_STORAGE_KEY);
  } catch {
    return null;
  }
}

function noStoredUtmOnServer(): string | null {
  return null;
}

function subscribeToNothing(): () => void {
  return () => {};
}

function parseStoredUtm(raw: string | null): UtmParams {
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return {};
    const utm: UtmParams = {};
    for (const key of UTM_KEYS) {
      const value = cleanUtmValue((parsed as Record<string, unknown>)[key]);
      if (value) utm[key] = value;
    }
    return utm;
  } catch {
    return {};
  }
}

const initialState: BookingFormState = { errors: {}, values: {}, success: null };

const inputClasses =
  "w-full border border-line bg-canvas px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none";

const labelClasses = "mb-1 block text-sm text-muted";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-error">{message}</p>;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function maxDateIso(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
}

export function BookingForm({
  companyName,
  urlUtm,
}: {
  companyName: string;
  urlUtm: UtmParams;
}) {
  const [state, formAction, isPending] = useActionState(
    createBooking,
    initialState
  );

  // UTMs in the URL are the freshest attribution and replace anything
  // stored; with none in the URL (visitor navigated away and came back),
  // fall back to what this tab stored on the original ad-link landing.
  const urlUtmJson = JSON.stringify(urlUtm);
  const hasUrlUtm = Object.keys(urlUtm).length > 0;
  const storedUtmRaw = useSyncExternalStore(
    subscribeToNothing,
    readStoredUtm,
    noStoredUtmOnServer
  );
  const utm = hasUrlUtm ? urlUtm : parseStoredUtm(storedUtmRaw);

  useEffect(() => {
    if (!hasUrlUtm) return;
    try {
      sessionStorage.setItem(UTM_STORAGE_KEY, urlUtmJson);
    } catch {
      // Storage unavailable — the URL values still submit with this form.
    }
  }, [hasUrlUtm, urlUtmJson]);

  const value = (field: string) => state.values[field] ?? "";

  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoaded, setSlotsLoaded] = useState(false);
  const [isSlotsPending, startSlotsTransition] = useTransition();

  function handleDateChange(date: string) {
    setSelectedDate(date);
    setSelectedTime("");
    setSlotsLoaded(false);
    if (!date) {
      setSlots([]);
      return;
    }
    startSlotsTransition(async () => {
      const result = await getAvailableSlots(date);
      setSlots(result);
      setSlotsLoaded(true);
    });
  }

  if (state.success) {
    return (
      <div className="border border-line bg-surface p-6">
        <p className="mb-2 flex items-center gap-2 text-sm text-ink">
          <span className="h-1.5 w-1.5 shrink-0 bg-status-won" />
          {state.success.dateLabel ? "Appointment booked" : "Details received"}
        </p>
        <h2 className="font-heading text-xl text-ink">
          Thanks, {state.success.name}!
        </h2>
        <p className="mt-2 text-sm text-muted">
          {state.success.dateLabel ? (
            <>
              We&apos;ve booked you in for {state.success.dateLabel} at{" "}
              {state.success.time}. {companyName} will be in touch
              beforehand to confirm the details.
            </>
          ) : (
            <>
              We&apos;ve received your details. {companyName} will be in
              touch shortly to arrange a time that works for you.
            </>
          )}
        </p>
      </div>
    );
  }

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
          Address line 2 <span className="text-muted">(optional)</span>
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
          className={`${inputClasses} max-w-40`}
        />
        <FieldError message={state.errors.postcode} />
      </div>

      <div>
        <label htmlFor="jobType" className={labelClasses}>
          What are you interested in?
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
        <label htmlFor="notes" className={labelClasses}>
          Anything else we should know?{" "}
          <span className="text-muted">(optional)</span>
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={value("notes")}
          className={inputClasses}
        />
      </div>

      <div className="border-t border-line pt-5">
        <label htmlFor="date" className={labelClasses}>
          Pick a date <span className="text-muted">(optional)</span>
        </label>
        <input
          id="date"
          type="date"
          min={todayIso()}
          max={maxDateIso()}
          value={selectedDate}
          onChange={(e) => handleDateChange(e.target.value)}
          className={`${inputClasses} max-w-52`}
        />
        <p className="mt-2 text-xs text-muted">
          Not sure yet? Skip this and we&apos;ll call you to arrange a time.
        </p>

        {selectedDate && (
          <div className="mt-4">
            <p className={labelClasses}>Available times</p>
            {isSlotsPending && (
              <p className="text-sm text-muted">Checking availability...</p>
            )}
            {!isSlotsPending && slotsLoaded && slots.length === 0 && (
              <p className="text-sm text-muted">
                No slots available that day — please pick another date.
              </p>
            )}
            {!isSlotsPending && slots.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {slots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedTime(slot)}
                    className={`border px-3 py-1.5 text-sm ${
                      selectedTime === slot
                        ? "border-accent bg-accent text-canvas"
                        : "border-line text-ink hover:border-ink"
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <input type="hidden" name="date" value={selectedDate} />
        <input type="hidden" name="time" value={selectedTime} />
        <FieldError message={state.errors.time} />
      </div>

      {UTM_KEYS.map((key) => (
        <input key={key} type="hidden" name={key} value={utm[key] ?? ""} />
      ))}

      {/* Honeypot — see lib/honeypot.ts. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Leave this field empty
          <input type="text" name={HONEYPOT_FIELD} tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="bg-accent px-5 py-2.5 text-sm text-canvas hover:bg-accent/90 disabled:opacity-50"
        >
          {isPending
            ? "Sending..."
            : selectedTime
              ? "Book appointment"
              : "Submit details"}
        </button>
      </div>
    </form>
  );
}
