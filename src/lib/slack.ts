import { WebClient } from "@slack/web-api";
import type { ReportEntryData, DailyProgressData } from "@/types";

const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

interface ReportPayload {
  userName: string;
  date: string;
  entries: ReportEntryData[];
  goals: { content: string; progress: DailyProgressData | null }[];
}

export async function sendReportToChannel(payload: ReportPayload) {
  const channelId = process.env.SLACK_CHANNEL_ID!;

  const entryLines = payload.entries
    .map(
      (e) =>
        `  *${e.category}*: ${e.title} (${e.durationMinutes}分)${e.memo ? `\n    メモ: ${e.memo}` : ""}`
    )
    .join("\n");

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

  const text = [
    `*日報 - ${payload.userName} (${payload.date})*`,
    `━━━━━━━━━━━━━`,
    `*業務内容* (合計: ${hours}時間${mins}分)`,
    entryLines,
    ``,
    `*今週の目標進捗*`,
    goalLines,
  ].join("\n");

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
