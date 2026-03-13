import { WebClient } from "@slack/web-api";
import type { ReportEntryData, DailyProgressData } from "@/types";

const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

interface ReportPayload {
  userName: string;
  date: string;
  entries: ReportEntryData[];
  goals: { content: string; progress: DailyProgressData | null }[];
  selfSlackUserId?: string | null;
  leaderSlackUserId?: string | null;
  channelId?: string | null;
}

const FIXED_FOOTER = `★ヨミ表
https://docs.google.com/spreadsheets/d/1fU9dcaA-dk4LHbzeofxa9Xj6wvFEvqosFTajG8dQFak/edit?gid=408537210#gid=408537210
★週次KPI
https://docs.google.com/spreadsheets/d/1RNHurBJNA4zEwqjjujLA0hfRLzIQca4koiX5ui6g5gc/edit?gid=2072944379#gid=2072944379&range=A1`;

export async function sendReportToChannel(payload: ReportPayload) {
  const channelId = payload.channelId || process.env.SLACK_CHANNEL_ID!;

  const categoryMap = new Map<string, ReportEntryData[]>();
  for (const e of payload.entries) {
    if (!categoryMap.has(e.category)) categoryMap.set(e.category, []);
    categoryMap.get(e.category)!.push(e);
  }
  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Tokyo",
    });

  const entryLines = Array.from(categoryMap.entries())
    .map(([category, entries]) => {
      const lines = entries.map((e) => {
        const timeRange =
          e.source === "calendar" && e.startTime && e.endTime
            ? ` ${formatTime(e.startTime)}〜${formatTime(e.endTime)}`
            : "";
        return `・${e.title}${timeRange} (${e.durationMinutes}分)${e.memo ? `\n    メモ: ${e.memo}` : ""}`;
      });
      return `${category}\n${lines.join("\n")}`;
    })
    .join("\n\n");

  const goalLines =
    payload.goals.length > 0
      ? payload.goals
          .map((g) => {
            const pct = g.progress?.percentage ?? 0;
            const cur = g.progress?.progressCurrent;
            const tot = g.progress?.progressTotal;
            const ratio = cur != null && tot != null ? `${cur}/${tot} ` : "";
            const note = g.progress?.note ? ` - ${g.progress.note}` : "";
            return `  ・${g.content}: ${ratio}${pct}%${note}`;
          })
          .join("\n")
      : "  (目標未設定)";

  const totalMinutes = payload.entries.reduce(
    (sum, e) => sum + e.durationMinutes,
    0
  );
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  const mentions = [
    payload.selfSlackUserId ? `<@${payload.selfSlackUserId}>` : null,
    payload.leaderSlackUserId ? `<@${payload.leaderSlackUserId}>` : null,
  ].filter(Boolean).join(" ");

  const text = [
    mentions,
    `*日報 - ${payload.userName} (${payload.date})*`,
    `━━━━━━━━━━━━━`,
    `*業務内容* (合計: ${hours}時間${mins}分)`,
    entryLines,
    ``,
    `*今週の目標進捗*`,
    goalLines,
    ``,
    FIXED_FOOTER,
  ].filter(Boolean).join("\n");

  const result = await slack.chat.postMessage({
    channel: channelId,
    text,
    mrkdwn: true,
  });

  return result.ts;
}

export async function sendReminderDM(slackUserId: string, userName: string) {
  await slack.chat.postMessage({
    channel: slackUserId,
    text: `${userName}さん、本日の日報がまだ送信されていません。日報の送信をお願いします。`,
  });
}
