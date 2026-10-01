-- CreateTable
CREATE TABLE "Business" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ContactLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "businessId" TEXT,
    "customerId" TEXT NOT NULL,
    "note" TEXT,
    "contactedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContactLog_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ContactLog_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ContactLog" ("contactedAt", "customerId", "id", "note") SELECT "contactedAt", "customerId", "id", "note" FROM "ContactLog";
DROP TABLE "ContactLog";
ALTER TABLE "new_ContactLog" RENAME TO "ContactLog";
CREATE INDEX "ContactLog_customerId_contactedAt_idx" ON "ContactLog"("customerId", "contactedAt");
CREATE TABLE "new_Customer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "businessId" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "postcode" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "jobType" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "value" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'new',
    "wonAt" DATETIME,
    "notes" TEXT NOT NULL DEFAULT '',
    "appointmentAt" DATETIME,
    "reminderSentAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Customer_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Customer" ("addressLine1", "addressLine2", "appointmentAt", "createdAt", "email", "firstName", "id", "jobType", "lastName", "notes", "phone", "postcode", "reminderSentAt", "source", "status", "updatedAt", "value", "wonAt") SELECT "addressLine1", "addressLine2", "appointmentAt", "createdAt", "email", "firstName", "id", "jobType", "lastName", "notes", "phone", "postcode", "reminderSentAt", "source", "status", "updatedAt", "value", "wonAt" FROM "Customer";
DROP TABLE "Customer";
ALTER TABLE "new_Customer" RENAME TO "Customer";
CREATE TABLE "new_Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "businessId" TEXT,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "customerId" TEXT,
    "quoteId" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "emailedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Notification_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Notification_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Notification" ("createdAt", "customerId", "emailedAt", "id", "message", "quoteId", "read", "type") SELECT "createdAt", "customerId", "emailedAt", "id", "message", "quoteId", "read", "type" FROM "Notification";
DROP TABLE "Notification";
ALTER TABLE "new_Notification" RENAME TO "Notification";
CREATE INDEX "Notification_read_createdAt_idx" ON "Notification"("read", "createdAt");
CREATE INDEX "Notification_customerId_type_idx" ON "Notification"("customerId", "type");
CREATE INDEX "Notification_quoteId_type_idx" ON "Notification"("quoteId", "type");
CREATE TABLE "new_Quote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "businessId" TEXT,
    "customerId" TEXT NOT NULL,
    "quoteNumber" TEXT NOT NULL,
    "publicToken" TEXT NOT NULL,
    "issuedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "vatEnabled" BOOLEAN NOT NULL DEFAULT false,
    "vatRate" REAL NOT NULL DEFAULT 20,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Quote_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Quote_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Quote" ("createdAt", "customerId", "id", "issuedAt", "notes", "publicToken", "quoteNumber", "status", "updatedAt", "validUntil", "vatEnabled", "vatRate") SELECT "createdAt", "customerId", "id", "issuedAt", "notes", "publicToken", "quoteNumber", "status", "updatedAt", "validUntil", "vatEnabled", "vatRate" FROM "Quote";
DROP TABLE "Quote";
ALTER TABLE "new_Quote" RENAME TO "Quote";
CREATE UNIQUE INDEX "Quote_quoteNumber_key" ON "Quote"("quoteNumber");
CREATE UNIQUE INDEX "Quote_publicToken_key" ON "Quote"("publicToken");
CREATE INDEX "Quote_customerId_idx" ON "Quote"("customerId");
CREATE TABLE "new_QuoteLineItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "businessId" TEXT,
    "quoteId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "unit" TEXT,
    "unitPrice" INTEGER NOT NULL,
    CONSTRAINT "QuoteLineItem_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "QuoteLineItem_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_QuoteLineItem" ("description", "id", "quantity", "quoteId", "unit", "unitPrice") SELECT "description", "id", "quantity", "quoteId", "unit", "unitPrice" FROM "QuoteLineItem";
DROP TABLE "QuoteLineItem";
ALTER TABLE "new_QuoteLineItem" RENAME TO "QuoteLineItem";
CREATE INDEX "QuoteLineItem_quoteId_idx" ON "QuoteLineItem"("quoteId");
CREATE TABLE "new_Settings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "businessId" TEXT,
    "companyName" TEXT NOT NULL,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "vatNumber" TEXT,
    "notificationEmail" TEXT DEFAULT 'alexanderjamesworks@gmail.com',
    CONSTRAINT "Settings_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Settings" ("addressLine1", "addressLine2", "companyName", "email", "id", "notificationEmail", "phone", "vatNumber") SELECT "addressLine1", "addressLine2", "companyName", "email", "id", "notificationEmail", "phone", "vatNumber" FROM "Settings";
DROP TABLE "Settings";
ALTER TABLE "new_Settings" RENAME TO "Settings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
