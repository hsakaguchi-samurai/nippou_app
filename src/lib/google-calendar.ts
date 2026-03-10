import { google } from "googleapis";
import { prisma } from "@/lib/prisma";
import type { CalendarEvent } from "@/types";

async function getOAuth2Client(userId: string) {
  const account = await prisma.account.findFirst({
    where: { userId, provider: "google" },
  });

  if (!account?.access_token) {
    throw new Error("Google account not linked");
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    access_token: account.access_token,
    refresh_token: account.refresh_token,
  });

  // Refresh token if expired
  if (account.expires_at && account.expires_at * 1000 < Date.now()) {
    const { credentials } = await oauth2Client.refreshAccessToken();
    await prisma.account.update({
      where: { id: account.id },
      data: {
        access_token: credentials.access_token,
        expires_at: credentials.expiry_date
          ? Math.floor(credentials.expiry_date / 1000)
          : null,
      },
    });
    oauth2Client.setCredentials(credentials);
  }

  return oauth2Client;
}

export async function fetchCalendarEvents(
  userId: string,
  date: string
): Promise<CalendarEvent[]> {
  const oauth2Client = await getOAuth2Client(userId);
  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  const timeMin = new Date(`${date}T00:00:00+09:00`).toISOString();
  const timeMax = new Date(`${date}T23:59:59+09:00`).toISOString();

  const response = await calendar.events.list({
    calendarId: "primary",
    timeMin,
    timeMax,
    singleEvents: true,
    orderBy: "startTime",
  });

  const events = response.data.items ?? [];

  return events
    .filter((event) => event.start?.dateTime && event.end?.dateTime)
    .map((event) => {
      const start = new Date(event.start!.dateTime!);
      const end = new Date(event.end!.dateTime!);
      const durationMinutes = Math.round(
        (end.getTime() - start.getTime()) / 60000
      );

      return {
        id: event.id!,
        title: event.summary ?? "(無題)",
        start: event.start!.dateTime!,
        end: event.end!.dateTime!,
        durationMinutes,
      };
    });
}
