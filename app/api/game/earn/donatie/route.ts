// app/api/game/earn/donatie/route.ts
import { NextResponse } from "next/server";
import { getUserFromCookie } from "../../../../../lib/auth";
import { prisma } from "../../../../../lib/prisma";
import {
  cooldownMs,
  investigationChance,
  investigationDurationMs,
  type EarnActionKey,
} from "../../../../../lib/game";
import { addProgress } from "../../../../../lib/leveling";
import { calcProgress } from "../../../../../lib/progressActions";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

const ACTION: EarnActionKey = "donatie";
const COOLDOWN_MS = cooldownMs(ACTION);
const REWARD_EURO = 300;

export async function POST() {
  const me = await getUserFromCookie();
  if (!me?.id) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  const now = new Date();

  try {
    // 1) Doe ALLES behalve progress binnen één transactie
    const txResult = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: me.id },
        select: {
          id: true,
          money: true,
          level: true,
          lastDonatieAt: true,
          investigationUntil: true,
        },
      });
      if (!user) return { type: "ERROR" as const, status: 404, body: { error: "USER_NOT_FOUND" } };

      if (user.investigationUntil && user.investigationUntil.getTime() > now.getTime()) {
        return {
          type: "ERROR" as const,
          status: 403,
          body: { error: "UNDER_INVESTIGATION", until: user.investigationUntil.toISOString() },
        };
      }

      const lastAt = user.lastDonatieAt?.getTime() ?? 0;
      if (lastAt + COOLDOWN_MS > now.getTime()) {
        const remainingMs = lastAt + COOLDOWN_MS - now.getTime();
        return { type: "ERROR" as const, status: 400, body: { error: "COOLDOWN", remainingMs } };
      }

      const level = user.level ?? 1;
      const chance = investigationChance(ACTION, level);
      const triggered = Math.random() < chance;

      let investigationUntil: Date | undefined;
      if (triggered) {
        const proposed = new Date(now.getTime() + investigationDurationMs(ACTION));
        investigationUntil =
          user.investigationUntil && user.investigationUntil > proposed
            ? user.investigationUntil
            : proposed;
      }

      const updated = await tx.user.update({
        where: { id: user.id },
        data: {
          money: { increment: REWARD_EURO },
          lastDonatieAt: now,
          ...(investigationUntil ? { investigationUntil } : {}),
        },
        select: { id: true, money: true, lastDonatieAt: true, level: true, investigationUntil: true },
      });

      await tx.actionLog.create({
        data: { userId: user.id, type: "EARN_DONATIE", cost: 0, influenceChange: 0 },
      });

      const progressDelta = calcProgress(ACTION, updated.level ?? 1);

      return {
        type: "OK" as const,
        // geef wat we buiten de transactie nog nodig hebben:
        payload: {
          userId: updated.id,
          progressDelta,
        },
        response: {
          ok: true,
          money: updated.money,
          lastDonatieAt: updated.lastDonatieAt?.toISOString() ?? null,
          investigationStarted: triggered,
          investigationUntil: updated.investigationUntil
            ? updated.investigationUntil.toISOString()
            : null,
        },
      };
    }, {
      // desnoods kun je deze regel uitzetten als je cluster SERIALIZABLE niet fijn vindt
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });

    if (txResult.type === "ERROR") {
      return NextResponse.json(txResult.body, { status: txResult.status });
    }

    // 2) Progress PAS NA COMMIT
    try {
      await addProgress(txResult.payload.userId, txResult.payload.progressDelta);
    } catch (e) {
      console.error("[donatie] addProgress failed after commit:", e);
      // we geven toch succes terug; geld/cooldown/onderzoek zijn al goed gezet
    }

    return NextResponse.json(txResult.response);
  } catch (err: any) {
    console.error("[donatie] route error:", err?.code || err?.name, err?.message);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
