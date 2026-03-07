-- AlterTable
ALTER TABLE "Nation" ADD COLUMN     "conscriptionRatio" DOUBLE PRECISION NOT NULL DEFAULT 0.8;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "bestRank" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "roundsPlayed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalLosses" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalWins" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Achievement" (
    "id" TEXT NOT NULL,
    "nationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mission" (
    "id" TEXT NOT NULL,
    "nationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "target" INTEGER NOT NULL,
    "rewardCash" INTEGER NOT NULL DEFAULT 0,
    "rewardMaterials" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Mission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyLogin" (
    "id" TEXT NOT NULL,
    "nationId" TEXT NOT NULL,
    "day" INTEGER NOT NULL,
    "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyLogin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Achievement_nationId_type_key" ON "Achievement"("nationId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "Mission_nationId_type_key" ON "Mission"("nationId", "type");

-- CreateIndex
CREATE INDEX "DailyLogin_nationId_idx" ON "DailyLogin"("nationId");

-- CreateIndex
CREATE INDEX "Message_receiverId_read_idx" ON "Message"("receiverId", "read");

-- CreateIndex
CREATE INDEX "Attack_attackerId_idx" ON "Attack"("attackerId");

-- CreateIndex
CREATE INDEX "Attack_defenderId_idx" ON "Attack"("defenderId");

-- CreateIndex
CREATE INDEX "Attack_attackerId_defenderId_createdAt_idx" ON "Attack"("attackerId", "defenderId", "createdAt");

-- CreateIndex
CREATE INDEX "Building_nationId_idx" ON "Building"("nationId");

-- CreateIndex
CREATE INDEX "CyberOp_attackerId_idx" ON "CyberOp"("attackerId");

-- CreateIndex
CREATE INDEX "CyberOp_defenderId_idx" ON "CyberOp"("defenderId");

-- CreateIndex
CREATE INDEX "MarketOrder_roundId_commodity_side_status_idx" ON "MarketOrder"("roundId", "commodity", "side", "status");

-- CreateIndex
CREATE INDEX "Nation_roundId_idx" ON "Nation"("roundId");

-- CreateIndex
CREATE INDEX "Troop_nationId_idx" ON "Troop"("nationId");

-- AddForeignKey
ALTER TABLE "Achievement" ADD CONSTRAINT "Achievement_nationId_fkey" FOREIGN KEY ("nationId") REFERENCES "Nation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mission" ADD CONSTRAINT "Mission_nationId_fkey" FOREIGN KEY ("nationId") REFERENCES "Nation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyLogin" ADD CONSTRAINT "DailyLogin_nationId_fkey" FOREIGN KEY ("nationId") REFERENCES "Nation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "Nation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "Nation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
