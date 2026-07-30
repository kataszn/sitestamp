/*
  Warnings:

  - You are about to drop the column `userId` on the `Visit` table. All the data in the column will be lost.
  - Added the required column `inspectorName` to the `Visit` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Evidence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "visitId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "caption" TEXT,
    "captionSource" TEXT NOT NULL DEFAULT 'TEXT',
    "audioUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Evidence_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "Visit" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Evidence" ("caption", "createdAt", "id", "imageUrl", "visitId") SELECT "caption", "createdAt", "id", "imageUrl", "visitId" FROM "Evidence";
DROP TABLE "Evidence";
ALTER TABLE "new_Evidence" RENAME TO "Evidence";
CREATE TABLE "new_Visit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inspectorName" TEXT NOT NULL,
    "siteName" TEXT NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Visit" ("createdAt", "id", "notes", "siteName", "status") SELECT "createdAt", "id", "notes", "siteName", "status" FROM "Visit";
DROP TABLE "Visit";
ALTER TABLE "new_Visit" RENAME TO "Visit";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
