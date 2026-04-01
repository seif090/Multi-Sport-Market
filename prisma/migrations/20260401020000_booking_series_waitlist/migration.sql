-- AlterTable
ALTER TABLE "Booking" ADD COLUMN "amountCents" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Booking" ADD COLUMN "seriesId" TEXT;
ALTER TABLE "Booking" ADD COLUMN "repeatPattern" TEXT;
ALTER TABLE "Booking" ADD COLUMN "repeatCount" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Booking" ADD COLUMN "occurrenceIndex" INTEGER NOT NULL DEFAULT 0;

-- CreateEnum
CREATE TYPE "WaitlistStatus" AS ENUM ('WAITING', 'NOTIFIED', 'CONVERTED', 'EXPIRED');

-- CreateTable
CREATE TABLE "WaitlistEntry" (
    "id" TEXT NOT NULL,
    "courtId" TEXT NOT NULL,
    "userId" TEXT,
    "customerName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "status" "WaitlistStatus" NOT NULL DEFAULT 'WAITING',
    "notes" TEXT,
    "repeatPattern" TEXT,
    "repeatCount" INTEGER NOT NULL DEFAULT 1,
    "seriesId" TEXT,
    "convertedBookingId" TEXT,
    "notifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WaitlistEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Booking_seriesId_idx" ON "Booking"("seriesId");
CREATE INDEX "WaitlistEntry_courtId_status_startsAt_idx" ON "WaitlistEntry"("courtId", "status", "startsAt");
CREATE INDEX "WaitlistEntry_seriesId_idx" ON "WaitlistEntry"("seriesId");

-- AddForeignKey
ALTER TABLE "WaitlistEntry" ADD CONSTRAINT "WaitlistEntry_courtId_fkey" FOREIGN KEY ("courtId") REFERENCES "Court"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WaitlistEntry" ADD CONSTRAINT "WaitlistEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
