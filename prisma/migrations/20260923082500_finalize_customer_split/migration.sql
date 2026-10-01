-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Customer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "postcode" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "jobType" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "value" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'new',
    "wonAt" DATETIME,
    "notes" TEXT NOT NULL DEFAULT '',
    "appointmentAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Customer" ("addressLine1", "addressLine2", "appointmentAt", "createdAt", "email", "firstName", "id", "jobType", "lastName", "notes", "phone", "postcode", "source", "status", "updatedAt", "value", "wonAt") SELECT "addressLine1", "addressLine2", "appointmentAt", "createdAt", "email", "firstName", "id", "jobType", "lastName", "notes", "phone", "postcode", "source", "status", "updatedAt", "value", "wonAt" FROM "Customer";
DROP TABLE "Customer";
ALTER TABLE "new_Customer" RENAME TO "Customer";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

