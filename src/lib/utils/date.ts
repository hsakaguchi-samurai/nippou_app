import { format, startOfWeek, addDays, parseISO } from "date-fns";
import { ja } from "date-fns/locale";

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "yyyy/MM/dd (EEE)", { locale: ja });
}

export function formatDateISO(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function getWeekStartDate(date: Date = new Date()): Date {
  return startOfWeek(date, { weekStartsOn: 1 }); // Monday
}

export function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 5 }, (_, i) => addDays(weekStart, i));
}

export function toJST(date: Date = new Date()): Date {
  return new Date(
    date.toLocaleString("en-US", { timeZone: "Asia/Tokyo" })
  );
}

export function getTodayISO(): string {
  return formatDateISO(toJST());
}
