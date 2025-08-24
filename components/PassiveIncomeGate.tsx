// components/PassiveIncomeGate.tsx
export const dynamic = "force-dynamic"; // geen cache

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { applyPassiveIncome } from "@/lib/applyPassiveIncome";

export default async function PassiveIncomeGate() {
  const session = await getServerSession(authOptions);
  if (session?.user?.email) {
    try {
      await applyPassiveIncome(session.user.email);
      // console.log("PassiveIncomeGate OK for", session.user.email);
    } catch (e) {
      console.error("PassiveIncomeGate error:", e);
    }
  }
  return null; // onzichtbaar
}
