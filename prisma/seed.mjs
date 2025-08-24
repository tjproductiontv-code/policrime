import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();
async function main() {
  const passwordHash = await bcrypt.hash("demo1234", 10);
  const user = await prisma.user.upsert({
    where: { email: "demo@polipower.local" },
    update: {},
    create: { email: "demo@polipower.local", name: "Demo", passwordHash },
  });
  const party = await prisma.party.upsert({
    where: { name: "Demo Partij" },
    update: {},
    create: { name: "Demo Partij", color: "#2563eb", ideology: "Centristisch", ownerId: user.id },
  });
  await prisma.membership.upsert({
    where: { userId_partyId: { userId: user.id, partyId: party.id } },
    update: { role: "LEADER" },
    create: { userId: user.id, partyId: party.id, role: "LEADER" },
  });
  console.log("Seed klaar ✅ Inloggen met demo@polipower.local / demo1234");
}
main().finally(async () => { await prisma.$disconnect(); });
