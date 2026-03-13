import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      slackUserId: true,
      leaderSlackUserId: true,
      slackChannelId: true,
    },
  });

  return NextResponse.json(user);
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { role, slackUserId, leaderSlackUserId, slackChannelId } = body;

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(role !== undefined && { role }),
      ...(slackUserId !== undefined && { slackUserId }),
      ...(leaderSlackUserId !== undefined && { leaderSlackUserId }),
      ...(slackChannelId !== undefined && { slackChannelId }),
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      slackUserId: true,
      leaderSlackUserId: true,
      slackChannelId: true,
    },
  });

  return NextResponse.json(user);
}
