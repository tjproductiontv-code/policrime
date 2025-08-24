-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "civilServants" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "workspaceUnits" INTEGER NOT NULL DEFAULT 0;
