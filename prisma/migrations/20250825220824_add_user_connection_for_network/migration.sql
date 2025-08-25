-- CreateTable
CREATE TABLE "public"."UserConnection" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "key" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "progressBps" INTEGER NOT NULL DEFAULT 0,
    "unlockedAt" TIMESTAMP(3),
    "lastProgressAt" TIMESTAMP(3),
    "discountBps" INTEGER NOT NULL DEFAULT 10000,
    "discountValidUntil" TIMESTAMP(3),

    CONSTRAINT "UserConnection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserConnection_userId_key_idx" ON "public"."UserConnection"("userId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "UserConnection_userId_key_key" ON "public"."UserConnection"("userId", "key");

-- AddForeignKey
ALTER TABLE "public"."UserConnection" ADD CONSTRAINT "UserConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
