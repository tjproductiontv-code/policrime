import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { getUserFromCookie } from "../../../../../lib/auth";
import {
  EMPLOYEE_HOURLY_COST,
  WORKSPACE_UNITS_PER_EMPLOYEE,
} from "../../../../../lib/personnel";

function parseQty(v: unknown, min = 1, max = 999) {
  const n = Math.floor(Number(v));
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : min;
}

export async function POST(req: Request) {
  const me = getUserFromCookie();
  if (!me?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const qty = parseQty(body?.quantity ?? body?.count ?? 1);

  const user = await prisma.user.findUnique({
    where: { id: me.id },
    // 👇 let op: passivePerHour is NETTO wat je nu krijgt
    select: { civilServants: true, passivePerHour: true, workspaceUnits: true },
  });
  if (!user) return NextResponse.json({ error: "UserNotFound" }, { status: 404 });

  const current = user.civilServants ?? 0;
  const targetCount = current + qty;

  // Bruto inkomen = netto + huidige salariskosten
  const grossPerHour = (user.passivePerHour ?? 0) + current * EMPLOYEE_HOURLY_COST;

  // Voor targetCount heb je totaal targetCount * cost nodig
  const needIncome = targetCount * EMPLOYEE_HOURLY_COST;
  if (grossPerHour < needIncome) {
    return NextResponse.json(
      { error: "INSUFFICIENT_INCOME", have: grossPerHour, need: needIncome },
      { status: 400 }
    );
  }

  // Werkplekken: 5 units per ambtenaar
  const maxByWorkspace = Math.floor((user.workspaceUnits ?? 0) / WORKSPACE_UNITS_PER_EMPLOYEE);
  if (targetCount > maxByWorkspace) {
    return NextResponse.json(
      {
        error: "INSUFFICIENT_WORKSPACE",
        haveUnits: user.workspaceUnits ?? 0,
        needUnitsForTarget: targetCount * WORKSPACE_UNITS_PER_EMPLOYEE,
      },
      { status: 400 }
    );
  }

  // ✅ Doorvoeren: ambtenaren ↑ en netto inkomen/uur ↓ met qty * cost
  const updated = await prisma.user.update({
    where: { id: me.id },
    data: {
      civilServants: { increment: qty },
      passivePerHour: { decrement: qty * EMPLOYEE_HOURLY_COST },
    },
    select: { civilServants: true, passivePerHour: true },
  });

  return NextResponse.json({
    ok: true,
    civilServants: updated.civilServants,
    passivePerHour: updated.passivePerHour, // nieuwe netto per uur
  });
}
