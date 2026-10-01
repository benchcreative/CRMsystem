import type { ReactElement } from "react";
import { render } from "@react-email/components";
import type { Settings } from "@prisma/client";
import { getResendClient, QUOTE_SENDER_EMAIL } from "@/lib/resend";
import { plainTextOptions, type EmailBrand } from "@/emails/_components/layout";

export { APP_URL } from "@/lib/app-url";

export function emailBrandFromSettings(settings: Settings | null): EmailBrand {
  return {
    companyName: settings?.companyName ?? "Our team",
    logoUrl: settings?.logoUrl || null,
    brandColor: settings?.brandColor || "#D98A2E",
    phone: settings?.phone ?? "",
    email: settings?.email ?? "",
    address: [settings?.addressLine1, settings?.addressLine2].filter(Boolean).join(", "),
  };
}

type Attachment = { filename: string; content: Buffer };

export type SendEmailResult = { ok: true } | { ok: false; error: string };

// Single choke point for every email the app sends: renders the React Email
// template to HTML plus a plain-text fallback generated from the same
// template (so the two can't drift), and surfaces Resend failures — the SDK
// reports API errors in its return value rather than throwing.
export async function sendEmail({
  to,
  subject,
  react,
  attachments,
  context,
}: {
  to: string;
  subject: string;
  react: ReactElement;
  attachments?: Attachment[];
  context: string; // for logs, e.g. "appointment reminder"
}): Promise<SendEmailResult> {
  const resend = getResendClient();
  if (!resend) {
    console.error(`Resend not configured — skipping ${context} email.`);
    return { ok: false, error: "Email is not configured (RESEND_API_KEY missing)." };
  }

  try {
    const [html, text] = await Promise.all([
      render(react),
      render(react, { plainText: true, htmlToTextOptions: plainTextOptions }),
    ]);
    const { error } = await resend.emails.send({
      from: QUOTE_SENDER_EMAIL,
      to,
      subject,
      html,
      text,
      attachments,
    });
    if (error) {
      console.error(`Failed to send ${context} email:`, error);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (error) {
    console.error(`Failed to send ${context} email:`, error);
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}
