import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const weekStart = req.nextUrl.searchParams.get("weekStart");
  if (!weekStart) {
    return NextResponse.json({ error: "weekStart is required" }, { status: 400 });
  }

  const goals = await prisma.weeklyGoal.findMany({
    where: {
      userId: session.user.id,
      weekStartDate: new Date(weekStart),
    },
    include: {
      progress: {
        orderBy: { date: "asc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(goals);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { weekStartDate, content } = await req.json();

  const goal = await prisma.weeklyGoal.create({
    data: {
      userId: session.user.id,
      weekStartDate: new Date(weekStartDate),
      content,
    },
    include: { progress: true },
  });

  return NextResponse.json(goal);
}
