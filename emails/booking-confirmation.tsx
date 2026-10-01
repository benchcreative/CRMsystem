import {
  DetailsBlock,
  EmailHeadline,
  EmailLayout,
  EmailText,
  sampleBrand,
  type EmailBrand,
} from "./_components/layout";

export type BookingConfirmationEmailProps = {
  brand: EmailBrand;
  firstName: string;
  date: string;
  time: string;
  address: string;
  jobType: string;
};

export default function BookingConfirmationEmail({
  brand,
  firstName,
  date,
  time,
  address,
  jobType,
}: BookingConfirmationEmailProps) {
  return (
    <EmailLayout brand={brand} preview={`Your appointment on ${date} at ${time} is confirmed.`}>
      <EmailHeadline>You&apos;re booked in</EmailHeadline>
      <EmailText>
        Hi {firstName}, your appointment with {brand.companyName} is confirmed.
        We look forward to seeing you.
      </EmailText>
      <DetailsBlock
        rows={[
          ["Date", date],
          ["Time", time],
          ["Address", address],
          ["Job type", jobType],
        ]}
      />
    </EmailLayout>
  );
}

BookingConfirmationEmail.PreviewProps = {
  brand: sampleBrand,
  firstName: "Mia",
  date: "Monday 28 September 2026",
  time: "12:00",
  address: "14 Refit Road, LS6 2QT",
  jobType: "Kitchen",
} satisfies BookingConfirmationEmailProps;
