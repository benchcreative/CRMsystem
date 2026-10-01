// Two formatters rather than one min:0/max:2 formatter, which would let
// Intl trim a value like 5549.10 down to "£5,549.1" — never show exactly
// one decimal place for money.
const GBP_WHOLE_FORMATTER = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const GBP_FRACTIONAL_FORMATTER = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatPenceAsGBP(pence: number | null): string {
  if (pence === null) return "";
  const isWhole = pence % 100 === 0;
  return (isWhole ? GBP_WHOLE_FORMATTER : GBP_FRACTIONAL_FORMATTER).format(
    pence / 100
  );
}

export function poundsToPence(pounds: number): number {
  return Math.round(pounds * 100);
}

export function penceToPoundsString(pence: number | null): string {
  if (pence === null) return "";
  return (pence / 100).toFixed(2);
}
