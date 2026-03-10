import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { date, percentage, note } = await req.json();

  // Verify ownership
  const goal = await prisma.weeklyGoal.findUnique({ where: { id } });
  if (!goal || goal.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const progress = await prisma.dailyProgress.upsert({
    where: {
      weeklyGoalId_date: {
        weeklyGoalId: id,
        date: new Date(date),
      },
    },
    update: { percentage, note },
    create: {
      weeklyGoalId: id,
      date: new Date(date),
      percentage,
      note,
    },
  });

  return NextResponse.json(progress);
}
