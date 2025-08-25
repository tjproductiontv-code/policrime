-- DropIndex
DROP INDEX "public"."UserConnection_userId_key_idx";

-- AlterTable
ALTER TABLE "public"."UserConnection" ADD COLUMN     "lastConnectAt" TIMESTAMP(3),
ALTER COLUMN "discountBps" DROP NOT NULL,
ALTER COLUMN "discountBps" DROP DEFAULT;
