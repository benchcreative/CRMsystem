"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  generateFollowUpDraft,
  sendFollowUpEmail,
  sendFollowUpSms,
} from "../actions";

type PanelStatus = "idle" | "loading" | "ready" | "sending" | "sent";

export function FollowUpPanel({ customerId }: { customerId: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<PanelStatus>("idle");
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sentVia, setSentVia] = useState<"email" | "text" | null>(null);

  async function handleGenerate() {
    setStatus("loading");
    setError(null);
    const result = await generateFollowUpDraft(customerId);
    if (result.success) {
      setDraft(result.draft);
      setStatus("ready");
    } else {
      setError(result.error);
      setStatus("idle");
    }
  }

  async function handleSend(channel: "email" | "text") {
    setStatus("sending");
    setError(null);
    const result =
      channel === "email"
        ? await sendFollowUpEmail(customerId, draft)
        : await sendFollowUpSms(customerId, draft);

    if (result.success) {
      setSentVia(channel);
      setStatus("sent");
      router.refresh();
    } else {
      setError(result.error);
      setStatus("ready");
    }
  }

  if (status === "sent") {
    return (
      <div className="mt-4 flex items-center gap-2 border border-dash-line bg-dash-surface px-4 py-2.5 text-sm text-dash-ink">
        <span className="h-1.5 w-1.5 shrink-0 bg-status-won" />
        Follow-up sent via {sentVia === "email" ? "email" : "text"}.
      </div>
    );
  }

  if (status === "idle") {
    return (
      <div className="mt-4 border border-dash-line bg-dash-surface px-4 py-3">
        <button
          type="button"
          onClick={handleGenerate}
          className="border border-dash-line px-3 py-1.5 text-sm text-dash-ink transition-colors hover:border-dash-ink"
        >
          Follow up
        </button>
        {error && <p className="mt-2 text-sm text-error">{error}</p>}
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="mt-4 border border-dash-line bg-dash-surface px-4 py-3 text-sm text-dash-muted">
        Generating a draft...
      </div>
    );
  }

  return (
    <div className="mt-4 border border-dash-line bg-dash-surface p-4">
      <p className="mb-2 text-sm text-dash-muted">
        AI-drafted follow-up â€” edit as needed before sending:
      </p>
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={4}
        className="w-full border border-dash-line bg-dash-bg px-3 py-2 text-sm text-dash-ink focus:border-dash-ink focus:outline-none"
      />
      {error && <p className="mt-2 text-sm text-error">{error}</p>}
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          disabled={status === "sending" || !draft.trim()}
          onClick={() => handleSend("email")}
          className="border border-dash-line px-3 py-1.5 text-sm text-dash-ink transition-colors hover:border-dash-ink disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === "sending" ? "Sending..." : "Send as email"}
        </button>
        <button
          type="button"
          disabled={status === "sending" || !draft.trim()}
          onClick={() => handleSend("text")}
          className="border border-dash-line px-3 py-1.5 text-sm text-dash-ink transition-colors hover:border-dash-ink disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === "sending" ? "Sending..." : "Send as text"}
        </button>
      </div>
    </div>
  );
}
