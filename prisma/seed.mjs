import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

const customers = [
  {
    firstName: "Alice",
    lastName: "Turner",
    phone: "07700 900001",
    email: "alice@example.com",
    addressLine1: "12 Elm Street, Leeds",
    postcode: "LS1 2AB",
    jobType: "kitchen",
    source: "facebook",
    status: "new",
    value: 850000, // £8,500.00
    lastContactedAt: daysAgo(5), // "new" threshold is 1 day -> should flag
  },
  {
    firstName: "Ben",
    lastName: "Osei",
    phone: "07700 900002",
    email: "ben@example.com",
    addressLine1: "4 Oak Road, Leeds",
    postcode: "LS2 3CD",
    jobType: "bathroom",
    source: "google",
    status: "quote_booked",
    value: 420000, // £4,200.00
    lastContactedAt: daysAgo(1), // "quote_booked" never flags
  },
  {
    firstName: "Chloe",
    lastName: "Whitfield",
    phone: "07700 900003",
    email: "chloe@example.com",
    addressLine1: "9 Birch Avenue, Leeds",
    postcode: "LS3 4EF",
    jobType: "bedroom",
    source: "referral",
    status: "quoted",
    value: 675000, // £6,750.00
    lastContactedAt: daysAgo(6), // "quoted" threshold is 6 days -> should flag
  },
  {
    firstName: "Daniel",
    lastName: "Cox",
    phone: "07700 900004",
    email: "daniel@example.com",
    addressLine1: "22 Maple Close, Leeds",
    postcode: "LS4 5GH",
    jobType: "kitchen",
    source: "walk_in",
    status: "won",
    value: 900000, // £9,000.00
    lastContactedAt: daysAgo(10), // "won" never flags
    createdAt: daysAgo(20),
    wonAt: daysAgo(10), // 10 days to close
  },
  {
    firstName: "Emma",
    lastName: "Blake",
    phone: "07700 900005",
    email: "emma@example.com",
    addressLine1: "3 Pine Court, Leeds",
    postcode: "LS5 6JK",
    jobType: "bathroom",
    source: "google",
    status: "lost",
    value: 350000, // £3,500.00 -- excluded from pipeline/won reports (status = lost)
    lastContactedAt: daysAgo(15), // "lost" never flags
  },
  {
    firstName: "Faisal",
    lastName: "Rahman",
    phone: "07700 900006",
    email: "faisal@example.com",
    addressLine1: "17 Cedar Way, Leeds",
    postcode: "LS6 7LM",
    jobType: "kitchen",
    source: "referral",
    status: "new",
    // value intentionally left unset -> null, to confirm sums/blank display
    // handle a missing estimate correctly.
    lastContactedAt: daysAgo(0), // contacted today -> under the 1 day threshold, no flag
  },
  {
    firstName: "Grace",
    lastName: "Nolan",
    phone: "07700 900007",
    email: "grace@example.com",
    addressLine1: "5 Willow Grove, Leeds",
    postcode: "LS7 8NP",
    jobType: "bathroom",
    source: "google",
    status: "new",
    value: 500000, // £5,000.00
    lastContactedAt: null, // never contacted -> should flag
  },
  {
    firstName: "Henry",
    lastName: "Doyle",
    phone: "07700 900008",
    email: "henry@example.com",
    addressLine1: "8 Ash Terrace, Leeds",
    postcode: "LS8 9QR",
    jobType: "bathroom",
    source: "google",
    status: "won",
    value: 750000, // £7,500.00
    lastContactedAt: daysAgo(7),
    createdAt: daysAgo(14),
    wonAt: daysAgo(7), // 7 days to close
  },
];

for (const {
  lastContactedAt,
  createdAt,
  wonAt,
  ...customerData
} of customers) {
  const customer = await prisma.customer.create({
    data: {
      ...customerData,
      ...(createdAt && { createdAt }),
      ...(wonAt && { wonAt }),
    },
  });

  if (lastContactedAt) {
    await prisma.contactLog.create({
      data: {
        customerId: customer.id,
        contactedAt: lastContactedAt,
      },
    });
  }
}

console.log(`Seeded ${customers.length} customers.`);
await prisma.$disconnect();
