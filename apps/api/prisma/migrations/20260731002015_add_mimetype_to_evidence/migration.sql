/*
  Warnings:

  - Added the required column `mimeType` to the `Evidence` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Evidence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "visitId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "caption" TEXT,
    "captionSource" TEXT NOT NULL DEFAULT 'TEXT',
    "audioUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Evidence_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "Visit" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Evidence" ("audioUrl", "caption", "captionSource", "createdAt", "id", "imageUrl", "mimeType", "visitId") SELECT "audioUrl", "caption", "captionSource", "createdAt", "id", "imageUrl", 'image/jpeg', "visitId" FROM "Evidence";
DROP TABLE "Evidence";
ALTER TABLE "new_Evidence" RENAME TO "Evidence";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
