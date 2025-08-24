// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

declare global {
  // Zorgt dat prisma niet steeds opnieuw wordt aangemaakt tijdens dev
  // (anders krijg je "too many connections" errors)
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") global.prisma = prisma;
