import {
  DetailsBlock,
  EmailHeadline,
  EmailLayout,
  EmailText,
  sampleBrand,
  type EmailBrand,
} from "./_components/layout";

export type AppointmentReminderEmailProps = {
  brand: EmailBrand;
  firstName: string;
  // The daily sweep sends ~24h ahead, but "Send reminder now" can be used
  // for an appointment further out — "tomorrow" would be wrong there.
  isTomorrow: boolean;
  date: string;
  time: string;
  address: string;
  jobType: string;
};

export default function AppointmentReminderEmail({
  brand,
  firstName,
  isTomorrow,
  date,
  time,
  address,
  jobType,
}: AppointmentReminderEmailProps) {
  return (
    <EmailLayout brand={brand} preview={`Reminder: ${date} at ${time}.`}>
      <EmailHeadline>{isTomorrow ? "See you tomorrow" : "See you soon"}</EmailHeadline>
      <EmailText>
        Hi {firstName}, just a reminder about your appointment with {brand.companyName}.
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

AppointmentReminderEmail.PreviewProps = {
  brand: sampleBrand,
  firstName: "Mia",
  isTomorrow: true,
  date: "Monday 28 September 2026",
  time: "12:00",
  address: "14 Refit Road, LS6 2QT",
  jobType: "Kitchen",
} satisfies AppointmentReminderEmailProps;
