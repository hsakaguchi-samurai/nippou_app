"use client";

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Send } from "lucide-react";
import type { ReportEntryData } from "@/types";
import type { GoalProgress } from "./GoalProgressSection";

interface ReportPreviewProps {
  entries: ReportEntryData[];
  goalProgresses?: GoalProgress[];
  expectedRevenue?: string;
  updateNote?: string;
  quantitativeAction?: string;
  qualitativeAction?: string;
  achievements?: string;
  onSend: () => void;
  sending: boolean;
  reportId: string | null;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tokyo",
  });
}

export function ReportPreview({
  entries,
  goalProgresses = [],
  expectedRevenue = "",
  updateNote = "",
  quantitativeAction = "",
  qualitativeAction = "",
  achievements = "",
  onSend,
  sending,
  reportId,
}: ReportPreviewProps) {
  const totalMinutes = entries.reduce((s, e) => s + e.durationMinutes, 0);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  if (entries.length === 0) return null;

  // Group by category
  const categoryMap = new Map<string, ReportEntryData[]>();
  for (const e of entries) {
    const cat = e.category || "未分類";
    if (!categoryMap.has(cat)) categoryMap.set(cat, []);
    categoryMap.get(cat)!.push(e);
  }

  const achievementLines = achievements
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  return (
    <Card>
      <CardHeader>
        <CardTitle>プレビュー</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md bg-muted p-4 font-mono text-sm whitespace-pre-wrap space-y-1">
          <p className="text-muted-foreground text-xs">@自分 @リーダー</p>
          <p>お疲れ様です。</p>
          <p>本日の日報です。</p>
          {updateNote && <p>{updateNote}</p>}
          <p></p>
          <p className="font-bold">業務内容 (合計: {hours}時間{mins}分)</p>

          {Array.from(categoryMap.entries()).map(([category, catEntries], ci) => (
            <div key={ci} className={ci > 0 ? "mt-3" : "mt-1"}>
              <p className="font-semibold">{category}</p>
              {catEntries.map((e, i) => {
                const timeRange =
                  e.source === "calendar" && e.startTime && e.endTime
                    ? ` ${formatTime(e.startTime)}〜${formatTime(e.endTime)}`
                    : "";
                return (
                  <div key={i}>
                    <p>・{e.title}{timeRange} ({e.durationMinutes}分)</p>
                    {e.memo && (
                      <p className="text-muted-foreground ml-4">メモ: {e.memo}</p>
                    )}
                  </div>
                );
              })}
            </div>
          ))}

          {expectedRevenue && (
            <div className="mt-3">
              <p className="font-bold">■期待値： {expectedRevenue}万円</p>
            </div>
          )}

          {goalProgresses.length > 0 && (
            <div className="mt-3">
              <p className="font-bold">■今週のコミットメントの進捗（実績/目標）</p>
              {goalProgresses.map((g) => {
                const unit = g.unit || "";
                const cur = g.progressCurrent || "—";
                const tot = g.progressTotal || "—";
                return (
                  <p key={g.goalId}>　●{g.content}：{cur}{unit}/{tot}{unit}</p>
                );
              })}
            </div>
          )}

          {goalProgresses.length > 0 && (
            <div className="mt-3">
              <p className="font-bold">■今日のコミットメントの進捗（実績/目標）</p>
              {goalProgresses.map((g) => {
                const unit = g.unit || "";
                const todayCur = g.todayCurrent || "—";
                const dailyTgt = g.dailyTarget || "—";
                return (
                  <p key={g.goalId}>　●{g.content}：{todayCur}{unit}/{dailyTgt}{unit}</p>
                );
              })}
            </div>
          )}

          <div className="mt-3">
            <p className="font-bold">■コミット目標に対してどんな行動、行動量を取ったのか</p>
            <p>　●定量面：{quantitativeAction || ""}</p>
            <p></p>
            <p>　●定性面：{qualitativeAction || ""}</p>
          </div>

          <div className="mt-3">
            <p className="font-bold">■達成：なんで達成できたか、気付き　</p>
            {achievementLines.length > 0 ? (
              achievementLines.map((line, i) => (
                <p key={i}>　●{line}</p>
              ))
            ) : (
              <>
                <p>　●</p>
                <p>　●</p>
                <p>　●</p>
              </>
            )}
          </div>

        </div>
      </CardContent>
      <CardFooter className="justify-end">
        <Button onClick={onSend} disabled={sending || !reportId}>
          {sending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Send className="h-4 w-4 mr-2" />
          )}
          Slackに送信
        </Button>
      </CardFooter>
    </Card>
  );
}
