import {
  EmailHeadline,
  EmailLayout,
  EmailText,
  sampleBrand,
  type EmailBrand,
} from "./_components/layout";

// Sent instead of the booking confirmation when no time slot was picked.
export type BookingReceivedEmailProps = {
  brand: EmailBrand;
  firstName: string;
};

export default function BookingReceivedEmail({ brand, firstName }: BookingReceivedEmailProps) {
  return (
    <EmailLayout brand={brand} preview="We'll call you to arrange a time.">
      <EmailHeadline>Thanks, we&apos;ll be in touch</EmailHeadline>
      <EmailText>
        Hi {firstName}, thanks for getting in touch with {brand.companyName}.
        We&apos;ll give you a call shortly to arrange a time that suits you.
      </EmailText>
    </EmailLayout>
  );
}

BookingReceivedEmail.PreviewProps = {
  brand: sampleBrand,
  firstName: "Owen",
} satisfies BookingReceivedEmailProps;
