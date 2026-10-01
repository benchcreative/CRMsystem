import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// One-off backfill ahead of making Customer.email required (NOT NULL).
// Every row touched here gets a "noemail-<id>@placeholder.local" address —
// this is NOT a real email, just a required-field filler for pre-existing
// customers created before email was mandatory. Never send real mail to
// a @placeholder.local address; treat it as "no email on file" in the UI.
const customers = await prisma.customer.findMany({
  where: { email: null },
  select: { id: true },
});

for (const customer of customers) {
  await prisma.customer.update({
    where: { id: customer.id },
    data: { email: `noemail-${customer.id}@placeholder.local` },
  });
}

console.log(`Backfilled placeholder email on ${customers.length} customer(s).`);
await prisma.$disconnect();
