// components/PassiveIncomeGate.tsx
import { applyPassiveIncome } from "../lib/applyPassiveIncome";
import { getUserFromCookie } from "../lib/auth";

export default async function PassiveIncomeGate() {
  const me = await getUserFromCookie();
  if (!me?.id) return null;

  await applyPassiveIncome(me.id);
  return null;
}
