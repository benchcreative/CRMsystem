-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Settings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "companyName" TEXT NOT NULL,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "vatNumber" TEXT,
    "notificationEmail" TEXT DEFAULT 'alexanderjamesworks@gmail.com',
    "aiCallsThisMonth" INTEGER NOT NULL DEFAULT 0,
    "aiCallsResetAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "allowedEmbedDomains" TEXT NOT NULL DEFAULT '',
    "logoUrl" TEXT,
    "brandColor" TEXT NOT NULL DEFAULT '#D98A2E'
);
INSERT INTO "new_Settings" ("addressLine1", "addressLine2", "aiCallsResetAt", "aiCallsThisMonth", "allowedEmbedDomains", "companyName", "email", "id", "notificationEmail", "phone", "vatNumber") SELECT "addressLine1", "addressLine2", "aiCallsResetAt", "aiCallsThisMonth", "allowedEmbedDomains", "companyName", "email", "id", "notificationEmail", "phone", "vatNumber" FROM "Settings";
DROP TABLE "Settings";
ALTER TABLE "new_Settings" RENAME TO "Settings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
