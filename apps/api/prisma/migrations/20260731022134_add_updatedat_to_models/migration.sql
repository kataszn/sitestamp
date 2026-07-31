/*
  Warnings:

  - Added the required column `updatedAt` to the `Report` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Visit` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Report" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "visitId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "defects" JSONB NOT NULL,
    "recommendation" TEXT NOT NULL,
    "needsReview" BOOLEAN NOT NULL DEFAULT false,
    "rawModelJson" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Report_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "Visit" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Report" ("createdAt", "defects", "id", "needsReview", "rawModelJson", "recommendation", "severity", "summary", "updatedAt", "visitId") SELECT "createdAt", "defects", "id", "needsReview", "rawModelJson", "recommendation", "severity", "summary", CURRENT_TIMESTAMP, "visitId" FROM "Report";
DROP TABLE "Report";
ALTER TABLE "new_Report" RENAME TO "Report";
CREATE UNIQUE INDEX "Report_visitId_key" ON "Report"("visitId");
CREATE TABLE "new_Visit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inspectorName" TEXT NOT NULL,
    "siteName" TEXT NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Visit" ("createdAt", "id", "inspectorName", "notes", "siteName", "status", "updatedAt") SELECT "createdAt", "id", "inspectorName", "notes", "siteName", "status", CURRENT_TIMESTAMP FROM "Visit";
DROP TABLE "Visit";
ALTER TABLE "new_Visit" RENAME TO "Visit";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
