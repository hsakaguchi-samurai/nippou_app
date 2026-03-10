import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const date = req.nextUrl.searchParams.get("date");

  if (date) {
    const report = await prisma.dailyReport.findUnique({
      where: {
        userId_date: {
          userId: session.user.id,
          date: new Date(date),
        },
      },
      include: { entries: true },
    });
    return NextResponse.json(report);
  }

  // List reports for a date range
  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");

  const reports = await prisma.dailyReport.findMany({
    where: {
      userId: session.user.id,
      ...(from && to
        ? { date: { gte: new Date(from), lte: new Date(to) } }
        : {}),
    },
    include: { entries: true },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(reports);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { date, entries } = body;

  // Upsert: one report per user per date
  const existing = await prisma.dailyReport.findUnique({
    where: {
      userId_date: {
        userId: session.user.id,
        date: new Date(date),
      },
    },
  });

  if (existing) {
    // Delete old entries and recreate
    await prisma.reportEntry.deleteMany({
      where: { reportId: existing.id },
    });

    const report = await prisma.dailyReport.update({
      where: { id: existing.id },
      data: {
        entries: {
          create: entries.map(
            (e: {
              title: string;
              category: string;
              durationMinutes: number;
              source: string;
              calendarEventId?: string;
              memo?: string;
            }) => ({
              title: e.title,
              category: e.category,
              durationMinutes: e.durationMinutes,
              source: e.source,
              calendarEventId: e.calendarEventId,
              memo: e.memo,
            })
          ),
        },
      },
      include: { entries: true },
    });

    return NextResponse.json(report);
  }

  const report = await prisma.dailyReport.create({
    data: {
      userId: session.user.id,
      date: new Date(date),
      entries: {
        create: entries.map(
          (e: {
            title: string;
            category: string;
            durationMinutes: number;
            source: string;
            calendarEventId?: string;
            memo?: string;
          }) => ({
            title: e.title,
            category: e.category,
            durationMinutes: e.durationMinutes,
            source: e.source,
            calendarEventId: e.calendarEventId,
            memo: e.memo,
          })
        ),
      },
    },
    include: { entries: true },
  });

  return NextResponse.json(report);
}
