export type Role = "CA" | "RA" | "マーケ" | "企画アシスタント";

export type ReportStatus = "draft" | "sent";

export type EntrySource = "calendar" | "manual";

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  durationMinutes: number;
}

export interface ReportEntryData {
  id?: string;
  title: string;
  category: string;
  durationMinutes: number;
  source: EntrySource;
  calendarEventId?: string;
  memo?: string;
  startTime?: string;
  endTime?: string;
}

export interface DailyReportData {
  id?: string;
  date: string;
  status: ReportStatus;
  entries: ReportEntryData[];
}

export interface WeeklyGoalData {
  id?: string;
  weekStartDate: string;
  content: string;
  progress: DailyProgressData[];
}

export interface DailyProgressData {
  id?: string;
  date: string;
  note?: string;
  percentage: number;
  progressCurrent?: number | null;
  progressTotal?: number | null;
}

export interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: string | null; // comma-separated roles e.g. "CA,RA"
  slackUserId: string | null;
  leaderSlackUserId: string | null;
  slackChannelId: string | null;
}

export function parseRoles(role: string | null): Role[] {
  if (!role) return [];
  return role.split(",").filter(Boolean) as Role[];
}
