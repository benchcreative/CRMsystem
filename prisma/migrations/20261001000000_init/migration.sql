-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "JobType" AS ENUM ('kitchen', 'bathroom', 'bedroom');

-- CreateEnum
CREATE TYPE "Source" AS ENUM ('facebook', 'google', 'referral', 'walk_in', 'website');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('new', 'quote_booked', 'quoted', 'won', 'lost');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('not_scheduled', 'scheduled', 'complete');

-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('draft', 'sent', 'accepted', 'declined');

-- CreateEnum
CREATE TYPE "ContactLogDirection" AS ENUM ('outbound_call', 'inbound_call', 'outbound_email', 'outbound_sms');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('overdue_lead', 'quote_accepted', 'quote_declined', 'quote_expiring');

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "postcode" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "jobType" "JobType" NOT NULL,
    "source" "Source" NOT NULL,
    "value" INTEGER,
    "status" "Status" NOT NULL DEFAULT 'new',
    "wonAt" TIMESTAMP(3),
    "notes" TEXT NOT NULL DEFAULT '',
    "appointmentAt" TIMESTAMP(3),
    "reminderSentAt" TIMESTAMP(3),
    "jobStatus" "JobStatus" NOT NULL DEFAULT 'not_scheduled',
    "installDate" TIMESTAMP(3),
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "utmContent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactLog" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "direction" "ContactLogDirection",
    "note" TEXT,
    "contactedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "companyName" TEXT NOT NULL,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "vatNumber" TEXT,
    "notificationEmail" TEXT,
    "aiCallsThisMonth" INTEGER NOT NULL DEFAULT 0,
    "aiCallsResetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "allowedEmbedDomains" TEXT NOT NULL DEFAULT '',
    "logoUrl" TEXT,
    "brandColor" TEXT NOT NULL DEFAULT '#D98A2E',

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "quoteNumber" TEXT NOT NULL,
    "publicToken" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "status" "QuoteStatus" NOT NULL DEFAULT 'draft',
    "vatEnabled" BOOLEAN NOT NULL DEFAULT false,
    "vatRate" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteLineItem" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT,
    "unitPrice" INTEGER NOT NULL,

    CONSTRAINT "QuoteLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdSpend" (
    "id" TEXT NOT NULL,
    "source" "Source" NOT NULL,
    "month" TIMESTAMP(3) NOT NULL,
    "amount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdSpend_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "message" TEXT NOT NULL,
    "customerId" TEXT,
    "quoteId" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "emailedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContactLog_customerId_contactedAt_idx" ON "ContactLog"("customerId", "contactedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Quote_quoteNumber_key" ON "Quote"("quoteNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Quote_publicToken_key" ON "Quote"("publicToken");

-- CreateIndex
CREATE INDEX "Quote_customerId_idx" ON "Quote"("customerId");

-- CreateIndex
CREATE INDEX "QuoteLineItem_quoteId_idx" ON "QuoteLineItem"("quoteId");

-- CreateIndex
CREATE UNIQUE INDEX "AdSpend_source_month_key" ON "AdSpend"("source", "month");

-- CreateIndex
CREATE INDEX "Notification_read_createdAt_idx" ON "Notification"("read", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_customerId_type_idx" ON "Notification"("customerId", "type");

-- CreateIndex
CREATE INDEX "Notification_quoteId_type_idx" ON "Notification"("quoteId", "type");

-- AddForeignKey
ALTER TABLE "ContactLog" ADD CONSTRAINT "ContactLog_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteLineItem" ADD CONSTRAINT "QuoteLineItem_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

