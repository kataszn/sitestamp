/*
  Warnings:

  - You are about to drop the column `caption` on the `Evidence` table. All the data in the column will be lost.
  - You are about to drop the column `captionSource` on the `Evidence` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "NoteSource" AS ENUM ('TEXT', 'VOICE');

-- AlterTable
ALTER TABLE "Evidence" DROP COLUMN "caption",
DROP COLUMN "captionSource",
ADD COLUMN     "note" TEXT,
ADD COLUMN     "noteSource" "NoteSource" DEFAULT 'TEXT';

-- DropEnum
DROP TYPE "CaptionSource";
