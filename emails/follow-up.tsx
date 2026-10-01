import { EmailLayout, EmailText, sampleBrand, type EmailBrand } from "./_components/layout";

// The AI-drafted (then human-edited) follow-up from the customer page. It's
// a personal note, so no headline or button — just the message, branded.
export type FollowUpEmailProps = {
  brand: EmailBrand;
  message: string;
};

export default function FollowUpEmail({ brand, message }: FollowUpEmailProps) {
  const paragraphs = message.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

  return (
    <EmailLayout brand={brand} preview={paragraphs[0] ?? ""}>
      {paragraphs.map((paragraph, index) => (
        <EmailText key={index}>
          {paragraph.split("\n").map((line, lineIndex, lines) => (
            <span key={lineIndex}>
              {line}
              {lineIndex < lines.length - 1 && <br />}
            </span>
          ))}
        </EmailText>
      ))}
    </EmailLayout>
  );
}

FollowUpEmail.PreviewProps = {
  brand: sampleBrand,
  message:
    "Hi Chloe,\n\nJust checking in on the bedroom quote we sent over last week. Happy to answer any questions or walk through the options on a quick call.\n\nThanks,\nRidgeway Home Improvements",
} satisfies FollowUpEmailProps;
