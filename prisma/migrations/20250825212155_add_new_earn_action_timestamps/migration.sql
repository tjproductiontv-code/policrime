-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "lastDonatieAt" TIMESTAMP(3),
ADD COLUMN     "lastParkeerboeteAt" TIMESTAMP(3),
ADD COLUMN     "lastStemmenhandelAt" TIMESTAMP(3);
