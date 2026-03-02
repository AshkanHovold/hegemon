-- CreateEnum
CREATE TYPE "RoundPhase" AS ENUM ('GROWTH', 'OPEN', 'ENDGAME', 'ENDED');

-- CreateEnum
CREATE TYPE "ServerMode" AS ENUM ('HARDCORE', 'CASUAL', 'PVE');

-- CreateEnum
CREATE TYPE "BuildingType" AS ENUM ('RESIDENTIAL', 'FARM', 'FACTORY', 'COMMERCIAL', 'POWER_PLANT', 'RESEARCH_LAB', 'BARRACKS', 'CYBER_CENTER', 'MISSILE_DEFENSE', 'FIREWALL_ARRAY', 'INTELLIGENCE_HQ');

-- CreateEnum
CREATE TYPE "UnitType" AS ENUM ('INFANTRY', 'ARMOR', 'AIR_FORCE', 'DRONES', 'NAVY');

-- CreateEnum
CREATE TYPE "CyberOpType" AS ENUM ('RECON_SCAN', 'NETWORK_INFILTRATION', 'SYSTEM_HACK', 'DATA_THEFT', 'INFRASTRUCTURE_SABOTAGE', 'MARKET_MANIPULATION', 'PROPAGANDA', 'EMP_STRIKE');

-- CreateEnum
CREATE TYPE "TechBranch" AS ENUM ('MILITARY', 'CYBER', 'ECONOMY', 'INFRASTRUCTURE');

-- CreateEnum
CREATE TYPE "OrderSide" AS ENUM ('BUY', 'SELL');

-- CreateEnum
CREATE TYPE "Commodity" AS ENUM ('CASH', 'MATERIALS', 'TECH_POINTS', 'FOOD');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('OPEN', 'PARTIAL', 'FILLED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AllianceRole" AS ENUM ('PRESIDENT', 'VICE_PRESIDENT', 'MINISTER_OF_WAR', 'MINISTER_OF_INTELLIGENCE', 'MINISTER_OF_TRADE', 'MEMBER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Round" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "phase" "RoundPhase" NOT NULL DEFAULT 'GROWTH',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Round_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Nation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "serverMode" "ServerMode" NOT NULL DEFAULT 'CASUAL',
    "cash" DOUBLE PRECISION NOT NULL DEFAULT 1000,
    "materials" DOUBLE PRECISION NOT NULL DEFAULT 500,
    "techPoints" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "energy" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "energyCap" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "energyRegen" DOUBLE PRECISION NOT NULL DEFAULT 2,
    "population" INTEGER NOT NULL DEFAULT 1000,
    "civilians" INTEGER NOT NULL DEFAULT 800,
    "military" INTEGER NOT NULL DEFAULT 200,
    "food" DOUBLE PRECISION NOT NULL DEFAULT 500,
    "lastAttackedAt" TIMESTAMP(3),
    "shieldUntil" TIMESTAMP(3),
    "dailyMilLoss" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dailyTerLoss" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dailyResLoss" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Nation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Building" (
    "id" TEXT NOT NULL,
    "nationId" TEXT NOT NULL,
    "type" "BuildingType" NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "building" BOOLEAN NOT NULL DEFAULT false,
    "buildsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Building_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Troop" (
    "id" TEXT NOT NULL,
    "nationId" TEXT NOT NULL,
    "type" "UnitType" NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "training" INTEGER NOT NULL DEFAULT 0,
    "trainsAt" TIMESTAMP(3),

    CONSTRAINT "Troop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attack" (
    "id" TEXT NOT NULL,
    "attackerId" TEXT NOT NULL,
    "defenderId" TEXT NOT NULL,
    "infantry" INTEGER NOT NULL DEFAULT 0,
    "armor" INTEGER NOT NULL DEFAULT 0,
    "airForce" INTEGER NOT NULL DEFAULT 0,
    "drones" INTEGER NOT NULL DEFAULT 0,
    "navy" INTEGER NOT NULL DEFAULT 0,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "attackerWon" BOOLEAN,
    "attackerLosses" JSONB,
    "defenderLosses" JSONB,
    "lootCash" DOUBLE PRECISION,
    "lootMaterials" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvesAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Attack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CyberOp" (
    "id" TEXT NOT NULL,
    "attackerId" TEXT NOT NULL,
    "defenderId" TEXT NOT NULL,
    "type" "CyberOpType" NOT NULL,
    "energyCost" DOUBLE PRECISION NOT NULL,
    "success" BOOLEAN,
    "result" JSONB,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CyberOp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TechResearch" (
    "id" TEXT NOT NULL,
    "nationId" TEXT NOT NULL,
    "branch" "TechBranch" NOT NULL,
    "node" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "researching" BOOLEAN NOT NULL DEFAULT false,
    "researchAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TechResearch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketOrder" (
    "id" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "nationId" TEXT NOT NULL,
    "sellerId" TEXT,
    "side" "OrderSide" NOT NULL,
    "commodity" "Commodity" NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "filled" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "OrderStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "filledAt" TIMESTAMP(3),

    CONSTRAINT "MarketOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alliance" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "description" TEXT,
    "treasury" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Alliance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AllianceMember" (
    "id" TEXT NOT NULL,
    "nationId" TEXT NOT NULL,
    "allianceId" TEXT NOT NULL,
    "role" "AllianceRole" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AllianceMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Round_number_key" ON "Round"("number");

-- CreateIndex
CREATE UNIQUE INDEX "Nation_userId_roundId_key" ON "Nation"("userId", "roundId");

-- CreateIndex
CREATE UNIQUE INDEX "TechResearch_nationId_branch_node_key" ON "TechResearch"("nationId", "branch", "node");

-- CreateIndex
CREATE UNIQUE INDEX "Alliance_name_key" ON "Alliance"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Alliance_tag_key" ON "Alliance"("tag");

-- CreateIndex
CREATE UNIQUE INDEX "AllianceMember_nationId_key" ON "AllianceMember"("nationId");

-- AddForeignKey
ALTER TABLE "Nation" ADD CONSTRAINT "Nation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Nation" ADD CONSTRAINT "Nation_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Building" ADD CONSTRAINT "Building_nationId_fkey" FOREIGN KEY ("nationId") REFERENCES "Nation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Troop" ADD CONSTRAINT "Troop_nationId_fkey" FOREIGN KEY ("nationId") REFERENCES "Nation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attack" ADD CONSTRAINT "Attack_attackerId_fkey" FOREIGN KEY ("attackerId") REFERENCES "Nation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attack" ADD CONSTRAINT "Attack_defenderId_fkey" FOREIGN KEY ("defenderId") REFERENCES "Nation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CyberOp" ADD CONSTRAINT "CyberOp_attackerId_fkey" FOREIGN KEY ("attackerId") REFERENCES "Nation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CyberOp" ADD CONSTRAINT "CyberOp_defenderId_fkey" FOREIGN KEY ("defenderId") REFERENCES "Nation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechResearch" ADD CONSTRAINT "TechResearch_nationId_fkey" FOREIGN KEY ("nationId") REFERENCES "Nation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketOrder" ADD CONSTRAINT "MarketOrder_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketOrder" ADD CONSTRAINT "MarketOrder_nationId_fkey" FOREIGN KEY ("nationId") REFERENCES "Nation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketOrder" ADD CONSTRAINT "MarketOrder_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Nation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AllianceMember" ADD CONSTRAINT "AllianceMember_nationId_fkey" FOREIGN KEY ("nationId") REFERENCES "Nation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AllianceMember" ADD CONSTRAINT "AllianceMember_allianceId_fkey" FOREIGN KEY ("allianceId") REFERENCES "Alliance"("id") ON DELETE CASCADE ON UPDATE CASCADE;
