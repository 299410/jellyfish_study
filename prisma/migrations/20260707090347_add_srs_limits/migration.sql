-- AlterTable
ALTER TABLE "Deck" ADD COLUMN     "maxNewCardsPerDay" INTEGER NOT NULL DEFAULT 20,
ADD COLUMN     "maxReviewsPerDay" INTEGER NOT NULL DEFAULT 200;

-- CreateTable
CREATE TABLE "CardReviewLog" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "deckId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CardReviewLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CardReviewLog_deckId_createdAt_idx" ON "CardReviewLog"("deckId", "createdAt");
