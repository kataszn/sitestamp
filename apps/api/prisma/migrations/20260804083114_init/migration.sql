-- CreateEnum
CREATE TYPE "VisitStatus" AS ENUM ('OPEN', 'GENERATING', 'COMPLETE');

-- CreateEnum
CREATE TYPE "CaptionSource" AS ENUM ('TEXT', 'VOICE');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('LOW', 'MODERATE', 'HIGH', 'CRITICAL');

-- CreateTable
CREATE TABLE "Visit" (
    "id" TEXT NOT NULL,
    "inspectorName" TEXT NOT NULL,
    "siteName" TEXT NOT NULL,
    "notes" TEXT,
    "status" "VisitStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Visit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evidence" (
    "id" TEXT NOT NULL,
    "visitId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "caption" TEXT,
    "captionSource" "CaptionSource" DEFAULT 'TEXT',
    "audioUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "visitId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "severity" "Severity" NOT NULL,
    "defects" JSONB NOT NULL,
    "recommendation" TEXT NOT NULL,
    "needsReview" BOOLEAN NOT NULL DEFAULT false,
    "rawModelJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Report_visitId_key" ON "Report"("visitId");

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "Visit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "Visit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
