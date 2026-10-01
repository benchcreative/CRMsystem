-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Customer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "addressLine1" TEXT,
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
INSERT INTO "new_Customer" ("address", "createdAt", "email", "id", "jobType", "name", "notes", "phone", "source", "status", "updatedAt", "value", "wonAt") SELECT "address", "createdAt", "email", "id", "jobType", "name", "notes", "phone", "source", "status", "updatedAt", "value", "wonAt" FROM "Customer";
DROP TABLE "Customer";
ALTER TABLE "new_Customer" RENAME TO "Customer";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
