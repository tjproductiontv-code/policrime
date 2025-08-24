-- CreateTable
CREATE TABLE "public"."User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "actionPoints" INTEGER NOT NULL DEFAULT 50,
    "lastActionReset" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "influence" INTEGER NOT NULL DEFAULT 0,
    "lastNepfactuurAt" TIMESTAMP(3),
    "lastVriendjeAt" TIMESTAMP(3),
    "investigationUntil" TIMESTAMP(3),
    "votes" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "levelProgress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dossiers" INTEGER NOT NULL DEFAULT 0,
    "hpBP" INTEGER NOT NULL DEFAULT 10000,
    "eliminatedAt" TIMESTAMP(3),
    "passivePerHour" INTEGER NOT NULL DEFAULT 0,
    "lastPassiveAt" TIMESTAMP(3),
    "investigators" INTEGER NOT NULL DEFAULT 0,
    "investigatorsBusy" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserPrivilege" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "key" TEXT NOT NULL,
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserPrivilege_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Party" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "ideology" TEXT,
    "ownerId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Party_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Membership" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "partyId" INTEGER NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ActionLog" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "cost" INTEGER NOT NULL,
    "influenceChange" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Investigation" (
    "id" SERIAL NOT NULL,
    "attackerId" INTEGER NOT NULL,
    "targetId" INTEGER NOT NULL,
    "assigned" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "etaAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "consumedAt" TIMESTAMP(3),

    CONSTRAINT "Investigation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "User_votes_actionPoints_idx" ON "public"."User"("votes", "actionPoints");

-- CreateIndex
CREATE INDEX "User_level_levelProgress_idx" ON "public"."User"("level", "levelProgress");

-- CreateIndex
CREATE UNIQUE INDEX "UserPrivilege_userId_key_key" ON "public"."UserPrivilege"("userId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "Party_name_key" ON "public"."Party"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_userId_partyId_key" ON "public"."Membership"("userId", "partyId");

-- CreateIndex
CREATE INDEX "Investigation_attackerId_targetId_etaAt_idx" ON "public"."Investigation"("attackerId", "targetId", "etaAt");

-- AddForeignKey
ALTER TABLE "public"."UserPrivilege" ADD CONSTRAINT "UserPrivilege_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Party" ADD CONSTRAINT "Party_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Membership" ADD CONSTRAINT "Membership_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "public"."Party"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ActionLog" ADD CONSTRAINT "ActionLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Investigation" ADD CONSTRAINT "Investigation_attackerId_fkey" FOREIGN KEY ("attackerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Investigation" ADD CONSTRAINT "Investigation_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
