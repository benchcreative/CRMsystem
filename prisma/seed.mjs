import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Demo data only. Every name, address and contact detail here is invented:
// emails use the reserved example.com domain, mobiles use Ofcom's
// 07700 900xxx drama range and the landline uses the 0113 496 0xxx drama
// range, so nothing seeded can reach a real person.
//
// Refuses to run against a database that already has customers, so it
// can't duplicate or clobber data by accident. Set SEED_RESET=1 to wipe
// every table first and reseed from scratch.

const DAY_MS = 24 * 60 * 60 * 1000;
const daysAgo = (n) => new Date(Date.now() - n * DAY_MS);
const daysFromNow = (n) => new Date(Date.now() + n * DAY_MS);
const atHour = (date, hour) => {
  const d = new Date(date);
  d.setHours(hour, 0, 0, 0);
  return d;
};

const existing = await prisma.customer.count();
if (existing > 0 && process.env.SEED_RESET !== "1") {
  console.log(
    `Database already has ${existing} customer(s); skipping seed. ` +
      "Re-run with SEED_RESET=1 to wipe it and reseed."
  );
  await prisma.$disconnect();
  process.exit(0);
}

if (process.env.SEED_RESET === "1") {
  // Children first. Cascades would cover most of this, but being explicit
  // keeps the reset independent of the relation settings.
  await prisma.notification.deleteMany();
  await prisma.quoteLineItem.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.contactLog.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.adSpend.deleteMany();
  await prisma.settings.deleteMany();
  console.log("SEED_RESET=1: cleared existing data.");
}

const settings = {
  companyName: "Ridgeway Home Improvements (Demo)",
  addressLine1: "14 Foundry Court",
  addressLine2: "Leeds LS5 3AA",
  phone: "0113 496 0142",
  email: "hello@example.com",
  vatNumber: "GB000000000",
  notificationEmail: "demo@example.com",
};

await prisma.settings.upsert({
  where: { id: "singleton" },
  create: { id: "singleton", ...settings },
  update: settings,
});

const customers = [
  {
    firstName: "Alice",
    lastName: "Turner",
    phone: "07700 900001",
    email: "alice.turner@example.com",
    addressLine1: "12 Elm Street, Leeds",
    postcode: "LS1 2AB",
    jobType: "kitchen",
    source: "facebook",
    status: "new",
    value: 850000, // £8,500.00
    lastContactedAt: daysAgo(5), // "new" threshold is 1 day -> should flag
    utmSource: "facebook",
    utmMedium: "paid_social",
    utmCampaign: "spring_kitchens",
  },
  {
    firstName: "Ben",
    lastName: "Osei",
    phone: "07700 900002",
    email: "ben.osei@example.com",
    addressLine1: "4 Oak Road, Leeds",
    postcode: "LS2 3CD",
    jobType: "bathroom",
    source: "website",
    status: "quote_booked",
    value: 420000, // £4,200.00
    lastContactedAt: daysAgo(1), // "quote_booked" never flags
    appointmentAt: atHour(daysFromNow(3), 10),
    // Already marked as reminded so the scheduled sweep never tries to
    // email/SMS this made-up customer.
    reminderSentAt: daysAgo(0),
  },
  {
    firstName: "Chloe",
    lastName: "Whitfield",
    phone: "07700 900003",
    email: "chloe.whitfield@example.com",
    addressLine1: "9 Birch Avenue, Leeds",
    postcode: "LS3 4EF",
    jobType: "bedroom",
    source: "referral",
    status: "quoted",
    value: 675000, // £6,750.00
    lastContactedAt: daysAgo(6), // "quoted" threshold is 6 days -> should flag
    quote: {
      status: "sent",
      issuedAt: daysAgo(8),
      validUntil: daysFromNow(1), // inside the 2-day "expiring" window
      vatEnabled: true,
      lineItems: [
        { description: "Fitted wardrobes (3 door, oak finish)", quantity: 1, unitPrice: 380000 },
        { description: "Bedside units", quantity: 2, unit: "each", unitPrice: 42500 },
        { description: "Installation labour", quantity: 2, unit: "days", unitPrice: 37500 },
      ],
    },
  },
  {
    firstName: "Daniel",
    lastName: "Cox",
    phone: "07700 900004",
    email: "daniel.cox@example.com",
    addressLine1: "22 Maple Close, Leeds",
    postcode: "LS4 5GH",
    jobType: "kitchen",
    source: "walk_in",
    status: "won",
    value: 900000, // £9,000.00
    lastContactedAt: daysAgo(10), // "won" never flags
    createdAt: daysAgo(20),
    wonAt: daysAgo(10), // 10 days to close
    jobStatus: "scheduled",
    installDate: atHour(daysFromNow(0), 8), // shows in "Today's schedule"
    quote: {
      status: "accepted",
      issuedAt: daysAgo(14),
      validUntil: daysFromNow(16),
      vatEnabled: true,
      lineItems: [
        { description: "Shaker kitchen units (supply)", quantity: 1, unitPrice: 520000 },
        { description: "Quartz worktop", quantity: 6.5, unit: "m", unitPrice: 32000 },
        { description: "Fitting and plumbing", quantity: 4, unit: "days", unitPrice: 42500 },
      ],
    },
  },
  {
    firstName: "Emma",
    lastName: "Blake",
    phone: "07700 900005",
    email: "emma.blake@example.com",
    addressLine1: "3 Pine Court, Leeds",
    postcode: "LS5 6JK",
    jobType: "bathroom",
    source: "google",
    status: "lost",
    value: 350000, // £3,500.00 -- excluded from pipeline/won reports (status = lost)
    lastContactedAt: daysAgo(15), // "lost" never flags
    quote: {
      status: "declined",
      issuedAt: daysAgo(20),
      validUntil: daysFromNow(10),
      vatEnabled: false,
      lineItems: [
        { description: "Shower enclosure and tray", quantity: 1, unitPrice: 145000 },
        { description: "Wall and floor tiling", quantity: 12, unit: "m²", unitPrice: 9500 },
        { description: "Labour", quantity: 3, unit: "days", unitPrice: 30000 },
      ],
    },
  },
  {
    firstName: "Faisal",
    lastName: "Rahman",
    phone: "07700 900006",
    email: "faisal.rahman@example.com",
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
    email: "grace.nolan@example.com",
    addressLine1: "5 Willow Grove, Leeds",
    postcode: "LS7 8NP",
    jobType: "bathroom",
    source: "google",
    status: "new",
    value: 500000, // £5,000.00
    lastContactedAt: null, // never contacted -> should flag
    utmSource: "google",
    utmMedium: "cpc",
    utmCampaign: "bathrooms_leeds",
  },
  {
    firstName: "Henry",
    lastName: "Doyle",
    phone: "07700 900008",
    email: "henry.doyle@example.com",
    addressLine1: "8 Ash Terrace, Leeds",
    postcode: "LS8 9QR",
    jobType: "bathroom",
    source: "google",
    status: "won",
    value: 750000, // £7,500.00
    lastContactedAt: daysAgo(7),
    createdAt: daysAgo(14),
    wonAt: daysAgo(7), // 7 days to close
    jobStatus: "complete",
    installDate: daysAgo(2),
  },
];

let quoteCount = 0;

for (const {
  lastContactedAt,
  createdAt,
  wonAt,
  quote,
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
        direction: "outbound_call",
        note: "Demo contact log entry.",
        contactedAt: lastContactedAt,
      },
    });
  }

  if (quote) {
    quoteCount += 1;
    const { lineItems, ...quoteData } = quote;
    await prisma.quote.create({
      data: {
        ...quoteData,
        customerId: customer.id,
        quoteNumber: `Q-${String(quoteCount).padStart(4, "0")}`,
        lineItems: { create: lineItems },
      },
    });
  }
}

// Ad spend for the /marketing ROI table: this month and last month.
const firstOfMonth = (offset) => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + offset, 1);
};
const adSpend = [
  { source: "facebook", month: firstOfMonth(0), amount: 45000 },
  { source: "google", month: firstOfMonth(0), amount: 60000 },
  { source: "facebook", month: firstOfMonth(-1), amount: 40000 },
  { source: "google", month: firstOfMonth(-1), amount: 55000 },
];
for (const row of adSpend) {
  await prisma.adSpend.upsert({
    where: { source_month: { source: row.source, month: row.month } },
    create: row,
    update: { amount: row.amount },
  });
}

console.log(
  `Seeded settings, ${customers.length} customers, ${quoteCount} quotes and ${adSpend.length} ad spend rows.`
);
await prisma.$disconnect();
