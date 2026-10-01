import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";

// Shared by every email in this folder. Lives under `_components` so the
// React Email preview server doesn't list it as a template.
//
// Relative imports only in /emails: the preview server bundles these files
// itself and doesn't know the app's "@/" path alias.

export type EmailBrand = {
  companyName: string;
  logoUrl: string | null;
  brandColor: string;
  phone: string;
  email: string;
  address: string;
};

const DETAILS_CLASS = "email-details";
// For layout tables that are really lists (one item per row), e.g. the
// notification digest — rendered one row per line in plain text.
export const LIST_CLASS = "email-list";

// Passed to render(..., { plainText: true }) (see lib/email.ts) so the
// generated plain-text fallback reads cleanly: detail blocks become aligned
// "Label   Value" rows instead of running together, and headlines keep their
// normal case. Purely decorative elements opt out via data-skip-in-text.
export const plainTextOptions = {
  selectors: [
    {
      selector: `table.${DETAILS_CLASS}`,
      format: "dataTable",
      options: { uppercaseHeaderCells: false, maxColumnWidth: 60 },
    },
    {
      selector: `table.${LIST_CLASS}`,
      format: "dataTable",
      options: { uppercaseHeaderCells: false, maxColumnWidth: 80 },
    },
    { selector: "h1", options: { uppercase: false } },
  ],
};

// Web fonts don't load reliably in Outlook or Gmail, so stick to a safe stack.
const FONT_STACK = "Helvetica, Arial, sans-serif";
const BORDER = "#E6E1D6";

export const sampleBrand: EmailBrand = {
  companyName: "Ridgeway Home Improvements Ltd",
  logoUrl: null,
  brandColor: "#D98A2E",
  phone: "0113 496 0142",
  email: "hello@ridgewayhi.co.uk",
  address: "14 Foundry Court, Kirkstall Industrial Estate",
};

export function EmailLayout({
  brand,
  preview,
  children,
}: {
  brand: EmailBrand;
  preview: string;
  children: ReactNode;
}) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body
        style={{
          margin: 0,
          padding: "32px 12px",
          backgroundColor: "#F4F1EA",
          fontFamily: FONT_STACK,
        }}
      >
        <Container
          style={{
            width: "100%",
            maxWidth: "600px",
            backgroundColor: "#FFFFFF",
            border: `1px solid ${BORDER}`,
          }}
        >
          {/* Brand bar: a table cell with real content, since Outlook
              collapses empty elements with only a height set. */}
          <Section
            data-skip-in-text="true"
            style={{
              backgroundColor: brand.brandColor,
              height: "3px",
              lineHeight: "3px",
              fontSize: "3px",
            }}
          >
            {" "}
          </Section>

          <Section style={{ padding: "32px" }}>
            {brand.logoUrl ? (
              <Img
                src={brand.logoUrl}
                alt={brand.companyName}
                height="40"
                style={{ height: "40px", width: "auto", maxWidth: "200px", marginBottom: "24px" }}
              />
            ) : (
              <Text
                style={{
                  margin: "0 0 24px",
                  fontSize: "18px",
                  lineHeight: "24px",
                  fontWeight: 700,
                  color: "#1A1A1A",
                }}
              >
                {brand.companyName}
              </Text>
            )}

            {children}

            <Hr style={{ borderColor: BORDER, margin: "32px 0 16px" }} />
            <Text style={{ margin: 0, fontSize: "13px", lineHeight: "20px", color: "#888888" }}>
              {brand.companyName}
              <br />
              {[brand.phone, brand.email].filter(Boolean).join(" · ")}
              {brand.address && (
                <>
                  <br />
                  {brand.address}
                </>
              )}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export function EmailHeadline({ children }: { children: ReactNode }) {
  return (
    <Heading
      as="h1"
      style={{
        margin: "0 0 16px",
        fontSize: "24px",
        lineHeight: "32px",
        fontWeight: 700,
        color: "#1A1A1A",
      }}
    >
      {children}
    </Heading>
  );
}

export function EmailText({ children }: { children: ReactNode }) {
  return (
    <Text style={{ margin: "0 0 16px", fontSize: "16px", lineHeight: "24px", color: "#333333" }}>
      {children}
    </Text>
  );
}

const WROUGHT_IRON = "#17181A";

function relativeLuminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Wrought Iron on brass (6.45:1) rather than white (2.75:1, fails WCAG AA).
// brandColor is set per business, so pick whichever of Wrought Iron or
// white has more contrast against it instead of hardcoding one.
function textColorOn(background: string): string {
  const bg = relativeLuminance(background);
  const onDark = (bg + 0.05) / (relativeLuminance(WROUGHT_IRON) + 0.05);
  const onWhite = 1.05 / (bg + 0.05);
  return onDark >= onWhite ? WROUGHT_IRON : "#FFFFFF";
}

// One per email at most. React Email's Button uses mso-font-width spacers so
// the padding survives Outlook's Word renderer (corners are square there).
export function EmailButton({
  brand,
  href,
  children,
}: {
  brand: EmailBrand;
  href: string;
  children: ReactNode;
}) {
  return (
    <Section style={{ margin: "8px 0 0" }}>
      <Button
        href={href}
        style={{
          backgroundColor: brand.brandColor,
          color: textColorOn(brand.brandColor),
          fontSize: "16px",
          lineHeight: "20px",
          fontWeight: 700,
          textDecoration: "none",
          padding: "14px 24px",
          borderRadius: "6px",
        }}
      >
        {children}
      </Button>
    </Section>
  );
}

export function DetailsBlock({ rows }: { rows: [label: string, value: string][] }) {
  return (
    <table
      className={DETAILS_CLASS}
      role="presentation"
      width="100%"
      cellPadding={0}
      cellSpacing={0}
      style={{
        margin: "8px 0 16px",
        border: `1px solid ${BORDER}`,
        borderRadius: "6px",
        borderCollapse: "separate",
      }}
    >
      <tbody>
        {rows.map(([label, value], index) => {
          const cellBorder = index === 0 ? "none" : `1px solid ${BORDER}`;
          return (
            <tr key={label}>
              <td
                style={{
                  padding: "12px 16px",
                  borderTop: cellBorder,
                  fontSize: "14px",
                  lineHeight: "20px",
                  color: "#888888",
                  verticalAlign: "top",
                  width: "35%",
                }}
              >
                {label}
              </td>
              <td
                style={{
                  padding: "12px 16px",
                  borderTop: cellBorder,
                  fontSize: "15px",
                  lineHeight: "20px",
                  fontWeight: 700,
                  color: "#1A1A1A",
                  textAlign: "right",
                  verticalAlign: "top",
                }}
              >
                {value}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
