import {
  DetailsBlock,
  EmailButton,
  EmailHeadline,
  EmailLayout,
  EmailText,
  sampleBrand,
  type EmailBrand,
} from "./_components/layout";

export type QuoteReadyEmailProps = {
  brand: EmailBrand;
  firstName: string;
  quoteNumber: string;
  total: string;
  validUntil: string | null;
  quoteUrl: string;
};

export default function QuoteReadyEmail({
  brand,
  firstName,
  quoteNumber,
  total,
  validUntil,
  quoteUrl,
}: QuoteReadyEmailProps) {
  const rows: [string, string][] = [
    ["Quote number", quoteNumber],
    ["Total", total],
  ];
  if (validUntil) rows.push(["Valid until", validUntil]);

  return (
    <EmailLayout brand={brand} preview={`Quote ${quoteNumber}: ${total}`}>
      <EmailHeadline>Your quote is ready</EmailHeadline>
      <EmailText>
        Hi {firstName}, thanks for the chance to quote. Your quote is attached as
        a PDF, and you can view and accept it online.
      </EmailText>
      <DetailsBlock rows={rows} />
      <EmailButton brand={brand} href={quoteUrl}>
        View your quote
      </EmailButton>
    </EmailLayout>
  );
}

QuoteReadyEmail.PreviewProps = {
  brand: sampleBrand,
  firstName: "Chloe",
  quoteNumber: "Q-0002",
  total: "£3,200",
  validUntil: "24 October 2026",
  quoteUrl: "http://localhost:3000/q/sample-token",
} satisfies QuoteReadyEmailProps;
