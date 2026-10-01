"use server";

import {
  getAvailableSlots as getSlots,
  readBookingInput,
  submitBooking,
} from "@/lib/booking";

export async function getAvailableSlots(dateStr: string): Promise<string[]> {
  return getSlots(dateStr);
}

export type BookingFormState = {
  errors: Record<string, string>;
  values: Record<string, string>;
  success: { name: string; dateLabel: string | null; time: string | null } | null;
};

export async function createBooking(
  _prevState: BookingFormState,
  formData: FormData
): Promise<BookingFormState> {
  const input = readBookingInput((key) => formData.get(key));
  const result = await submitBooking(input);

  switch (result.status) {
    case "booked":
      return {
        errors: {},
        values: {},
        success: {
          name: result.name,
          dateLabel: result.dateLabel,
          time: result.time,
        },
      };
    case "invalid":
      return { errors: result.errors, values: input.fields, success: null };
    case "rejected":
      // Honeypot filled — only bots see this, so no message is shown.
      return { errors: {}, values: input.fields, success: null };
  }
}
