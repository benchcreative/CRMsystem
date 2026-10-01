import { Section } from "@react-email/components";
import {
  EmailButton,
  EmailHeadline,
  EmailLayout,
  EmailText,
  LIST_CLASS,
  sampleBrand,
  type EmailBrand,
} from "./_components/layout";

// Internal alert email to the business, batching every pending notification.
export type NotificationDigestEmailProps = {
  brand: EmailBrand;
  messages: string[];
  dashboardUrl: string;
};

export default function NotificationDigestEmail({
  brand,
  messages,
  dashboardUrl,
}: NotificationDigestEmailProps) {
  const count = `${messages.length} update${messages.length === 1 ? "" : "s"}`;

  return (
    <EmailLayout brand={brand} preview={messages[0] ?? count}>
      <EmailHeadline>{count} in your CRM</EmailHeadline>
      <EmailText>Here&apos;s what&apos;s happened since your last update.</EmailText>
      <Section style={{ margin: "0 0 16px" }}>
        <table className={LIST_CLASS} role="presentation" width="100%" cellPadding={0} cellSpacing={0}>
          <tbody>
            {messages.map((message, index) => (
              <tr key={index}>
                <td style={{ width: "20px", padding: "10px 0", verticalAlign: "top" }}>
                  {/* Marker as a sized table cell rather than a styled
                      span — reliable across clients, including Outlook. */}
                  <table role="presentation" cellPadding={0} cellSpacing={0} data-skip-in-text="true">
                    <tbody>
                      <tr>
                        <td
                          style={{
                            width: "8px",
                            height: "8px",
                            fontSize: "1px",
                            lineHeight: "1px",
                            backgroundColor: brand.brandColor,
                          }}
                        >
                          {" "}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
                <td
                  style={{
                    padding: "4px 0",
                    fontSize: "16px",
                    lineHeight: "24px",
                    color: "#333333",
                    verticalAlign: "top",
                  }}
                >
                  {message}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>
      <EmailButton brand={brand} href={dashboardUrl}>
        Open dashboard
      </EmailButton>
    </EmailLayout>
  );
}

NotificationDigestEmail.PreviewProps = {
  brand: sampleBrand,
  messages: [
    "Chloe Whitfield needs a follow-up",
    "Widget Test accepted quote Q-0008",
    "Quote Q-0006 for Status Accept expires soon",
  ],
  dashboardUrl: "http://localhost:3000",
} satisfies NotificationDigestEmailProps;
