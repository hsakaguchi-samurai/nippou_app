import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendReportToChannel } from "@/lib/slack";
import { formatDate } from "@/lib/utils/date";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { reportId } = await req.json();

  const report = await prisma.dailyReport.findUnique({
    where: { id: reportId },
    include: {
      entries: true,
      user: true,
    },
  });

  if (!report || report.userId !== session.user.id) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  // Get weekly goals with today's progress
  const today = report.date;
  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() + mondayOffset);

  const weeklyGoals = await prisma.weeklyGoal.findMany({
    where: {
      userId: session.user.id,
      weekStartDate: weekStart,
    },
    include: {
      progress: {
        where: { date: today },
      },
    },
  });

  try {
    const messageTs = await sendReportToChannel({
      userName: report.user.name ?? "Unknown",
      date: formatDate(report.date),
      selfSlackUserId: report.user.slackUserId ?? undefined,
      leaderSlackUserId: (report.user as { leaderSlackUserId?: string | null }).leaderSlackUserId ?? undefined,
      channelId: (report.user as { slackChannelId?: string | null }).slackChannelId ?? undefined,
      entries: report.entries.map((e) => ({
        title: e.title,
        category: e.category,
        durationMinutes: e.durationMinutes,
        source: e.source as "calendar" | "manual",
        calendarEventId: e.calendarEventId ?? undefined,
        memo: e.memo ?? undefined,
      })),
      goals: weeklyGoals.map((g) => ({
        content: g.content,
        progress: g.progress[0]
          ? {
              date: g.progress[0].date.toISOString().split("T")[0],
              note: g.progress[0].note ?? undefined,
              percentage: g.progress[0].percentage,
              progressCurrent: g.progress[0].progressCurrent ?? undefined,
              progressTotal: g.progress[0].progressTotal ?? undefined,
            }
          : null,
      })),
    });

    // Update report status
    await prisma.dailyReport.update({
      where: { id: reportId },
      data: {
        status: "sent",
        sentAt: new Date(),
        slackMessageTs: messageTs,
      },
    });

    return NextResponse.json({ success: true, messageTs });
  } catch (error) {
    console.error("Slack send error:", error);
    return NextResponse.json(
      { error: "Slackへの送信に失敗しました" },
      { status: 500 }
    );
  }
}
