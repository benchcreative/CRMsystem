export type QuoteLineItemInput = {
  quantity: number;
  unitPrice: number; // pence
};

// Rounded per line first (nearest penny), then summed, rather than summing
// exact fractional pence and rounding once — matches how line items are
// actually priced and shown to a customer.
export function calculateLineItemTotal(
  quantity: number,
  unitPrice: number
): number {
  return Math.round(quantity * unitPrice);
}

export function calculateQuoteTotals(
  lineItems: QuoteLineItemInput[],
  vatEnabled: boolean,
  vatRate: number
) {
  const subtotal = lineItems.reduce(
    (sum, item) => sum + calculateLineItemTotal(item.quantity, item.unitPrice),
    0
  );
  const vatAmount = vatEnabled ? Math.round(subtotal * (vatRate / 100)) : 0;
  const total = subtotal + vatAmount;

  return { subtotal, vatAmount, total };
}
