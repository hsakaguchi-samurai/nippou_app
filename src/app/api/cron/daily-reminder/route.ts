import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendReminderDM } from "@/lib/slack";
import { getTodayISO } from "@/lib/utils/date";

export async function POST(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date(getTodayISO());

  // Find users who have NOT sent a report today
  const usersWithSlack = await prisma.user.findMany({
    where: {
      slackUserId: { not: null },
    },
    select: {
      id: true,
      name: true,
      slackUserId: true,
      reports: {
        where: {
          date: today,
          status: "sent",
        },
      },
    },
  });

  const usersToRemind = usersWithSlack.filter(
    (u) => u.reports.length === 0 && u.slackUserId
  );

  const results = [];
  for (const user of usersToRemind) {
    try {
      await sendReminderDM(user.slackUserId!, user.name ?? "担当者");
      results.push({ userId: user.id, status: "sent" });
    } catch (error) {
      console.error(`Reminder failed for ${user.id}:`, error);
      results.push({ userId: user.id, status: "failed" });
    }
  }

  return NextResponse.json({
    reminded: results.filter((r) => r.status === "sent").length,
    failed: results.filter((r) => r.status === "failed").length,
    results,
  });
}
