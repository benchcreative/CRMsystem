"use client";

import { useActionState } from "react";
import { sendQuoteEmail, type SendQuoteEmailState } from "../actions";

const initialState: SendQuoteEmailState = { error: null };

export function SendQuoteButton({ quoteId }: { quoteId: string }) {
  const action = sendQuoteEmail.bind(null, quoteId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <div>
      <form action={formAction}>
        <button
          type="submit"
          disabled={isPending}
          className="border border-dash-line px-3 py-1.5 text-xs text-dash-ink transition-colors hover:border-dash-ink disabled:opacity-50"
        >
          {isPending ? "Sending..." : "Send quote by email"}
        </button>
      </form>
      {state.error && (
        <p className="mt-2 text-xs text-error">{state.error}</p>
      )}
    </div>
  );
}
