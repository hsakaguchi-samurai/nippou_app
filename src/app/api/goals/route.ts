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

  try {
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
  } catch (error) {
    console.error("Goals GET error:", error);
    return NextResponse.json({ error: "データの取得に失敗しました" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { weekStartDate, content, targetTotal, unit } = await req.json();

  try {
    const goal = await prisma.weeklyGoal.create({
      data: {
        userId: session.user.id,
        weekStartDate: new Date(weekStartDate),
        content,
        ...(targetTotal != null && { targetTotal: Number(targetTotal) }),
        ...(unit != null && { unit }),
      },
      include: { progress: true },
    });

    return NextResponse.json(goal);
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      return NextResponse.json({ error: "同じ目標が既に登録されています" }, { status: 409 });
    }
    console.error("Goals POST error:", error);
    return NextResponse.json({ error: "目標の追加に失敗しました" }, { status: 500 });
  }
}
