import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { updateSettings } from "./actions";
import { SettingsForm } from "./components/SettingsForm";
import { getAiUsage } from "@/lib/ai-usage";
import { NotificationBell } from "../components/NotificationBell";
import { CopyButton } from "../components/CopyButton";
import { getNotificationBellData } from "@/lib/notifications";

export default async function SettingsPage() {
  const [settings, aiUsage, { unreadCount, notifications }] = await Promise.all([
    prisma.settings.findUnique({ where: { id: "singleton" } }),
    getAiUsage(),
    getNotificationBellData(),
  ]);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const embedSnippet = `<div id="crm-booking"></div>\n<script src="${appUrl}/embed.js" async></script>`;

  return (
    <div className="flex-1 bg-dash-bg">
      <main className="mx-auto max-w-2xl px-8 py-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Link href="/" className="text-sm text-dash-muted transition-colors hover:text-dash-ink">
              Back to dashboard
            </Link>
            <h1 className="mt-2 font-heading text-2xl text-dash-ink">Settings</h1>
            <p className="mt-1 text-sm text-dash-muted">
              Company details used on quotes and other documents.
            </p>
          </div>
          <NotificationBell unreadCount={unreadCount} notifications={notifications} />
        </div>

        <div className="mt-6 border border-dash-line bg-dash-surface p-6">
          <SettingsForm
            action={updateSettings}
            defaultValues={{
              companyName: settings?.companyName ?? "",
              addressLine1: settings?.addressLine1 ?? "",
              addressLine2: settings?.addressLine2 ?? "",
              phone: settings?.phone ?? "",
              email: settings?.email ?? "",
              vatNumber: settings?.vatNumber ?? "",
              notificationEmail: settings?.notificationEmail ?? "",
              allowedEmbedDomains: settings?.allowedEmbedDomains ?? "",
              logoUrl: settings?.logoUrl ?? "",
              brandColor: settings?.brandColor ?? "#D98A2E",
            }}
          />
        </div>

        <div className="mt-6 border border-dash-line bg-dash-surface p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-heading text-lg text-dash-ink">Embed code</h2>
              <p className="mt-1 text-sm text-dash-muted">
                Paste this into any website (WordPress, Elementor, Wix) where
                the booking form should appear. Add that site&apos;s domain to
                Allowed embed domains above first.
              </p>
            </div>
            <CopyButton text={embedSnippet} label="Copy code" />
          </div>
          <pre className="mt-4 overflow-x-auto border border-dash-line bg-dash-bg p-4 text-xs text-dash-ink">
            <code>{embedSnippet}</code>
          </pre>
        </div>

        <div className="mt-6 border border-dash-line bg-dash-surface p-6">
          <h2 className="font-heading text-lg text-dash-ink">AI follow-up usage</h2>
          <p className="mt-1 text-sm text-dash-muted">
            {aiUsage.used} of {aiUsage.limit} used this month. Resets on the
            1st.
          </p>
        </div>
      </main>
    </div>
  );
}
