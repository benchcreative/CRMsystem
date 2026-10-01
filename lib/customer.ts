export function formatCustomerName(customer: {
  firstName: string;
  lastName: string;
}): string {
  return `${customer.firstName} ${customer.lastName}`.trim();
}

export function formatCustomerAddress(customer: {
  addressLine1: string;
  addressLine2: string | null;
  postcode: string;
}): string {
  return [customer.addressLine1, customer.addressLine2, customer.postcode]
    .filter(Boolean)
    .join(", ");
}
