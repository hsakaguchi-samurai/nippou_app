import { WebClient } from "@slack/web-api";
import type { ReportEntryData, DailyProgressData } from "@/types";

const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

interface GoalData {
  content: string;
  unit?: string | null;
  targetTotal?: number | null;
  progress: DailyProgressData | null;
}

interface ReportPayload {
  userName: string;
  date: string;
  entries: ReportEntryData[];
  goals: GoalData[];
  selfSlackUserId?: string | null;
  leaderSlackUserId?: string | null;
  channelId?: string | null;
  comment?: string | null;
  expectedRevenue?: string | null;
  updateNote?: string | null;
  quantitativeAction?: string | null;
  qualitativeAction?: string | null;
  achievements?: string | null;
}

export async function sendReportToChannel(payload: ReportPayload) {
  const channelId = payload.channelId || process.env.SLACK_CHANNEL_ID!;

  // Group entries by category
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

  const totalMinutes = payload.entries.reduce(
    (sum, e) => sum + e.durationMinutes,
    0
  );
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  // Mentions
  const leaderMentions = payload.leaderSlackUserId
    ? payload.leaderSlackUserId
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean)
        .map((id) => `<@${id}>`)
        .join(" ")
    : null;

  const mentions = [
    payload.selfSlackUserId ? `<@${payload.selfSlackUserId}>` : null,
    leaderMentions,
  ].filter(Boolean).join(" ");

  // Weekly commitment lines
  const weeklyCommitLines = payload.goals.length > 0
    ? payload.goals.map((g) => {
        const unit = g.unit || "";
        const cur = g.progress?.progressCurrent ?? "—";
        const tot = g.targetTotal ?? g.progress?.progressTotal ?? "—";
        return `　●${g.content}：${cur}${unit}/${tot}${unit}`;
      }).join("\n")
    : "　(目標未設定)";

  // Daily commitment lines (weekly target / 5)
  const dailyCommitLines = payload.goals.length > 0
    ? payload.goals.map((g) => {
        const unit = g.unit || "";
        const todayCur = g.progress?.todayCurrent ?? "—";
        const target = g.targetTotal ?? 0;
        const dailyTarget = target > 0
          ? (target / 5).toFixed(1).replace(/\.0$/, "")
          : "—";
        return `　●${g.content}：${todayCur}${unit}/${dailyTarget}${unit}`;
      }).join("\n")
    : "　(目標未設定)";

  // Achievement bullets
  const achievementLines = payload.achievements
    ? payload.achievements.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => `　●${l}`).join("\n")
    : "　●\n　●\n　●";

  const text = [
    mentions,
    `お疲れ様です。`,
    `本日の日報です。`,
    payload.updateNote || null,
    ``,
    `*業務内容* (合計: ${hours}時間${mins}分)`,
    ``,
    entryLines,
    ``,
    payload.expectedRevenue ? `*■期待値：* ${payload.expectedRevenue}万円` : null,
    ``,
    `*■今週のコミットメントの進捗（実績/目標）*`,
    weeklyCommitLines,
    ``,
    `*■今日のコミットメントの進捗（実績/目標）*`,
    dailyCommitLines,
    ``,
    `*■コミット目標に対してどんな行動、行動量を取ったのか*`,
    `　●定量面：${payload.quantitativeAction || ""}`,
    ``,
    `　●定性面：${payload.qualitativeAction || ""}`,
    ``,
    `*■達成：なんで達成できたか、気付き*　`,
    achievementLines,
  ].filter((v) => v !== null).join("\n");

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
