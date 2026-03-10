import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetchCalendarEvents } from "@/lib/google-calendar";
import { getTodayISO } from "@/lib/utils/date";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const date = req.nextUrl.searchParams.get("date") ?? getTodayISO();

  try {
    const events = await fetchCalendarEvents(session.user.id, date);
    return NextResponse.json(events);
  } catch (error) {
    console.error("Calendar fetch error:", error);
    return NextResponse.json(
      { error: "カレンダーの取得に失敗しました" },
      { status: 500 }
    );
  }
}
