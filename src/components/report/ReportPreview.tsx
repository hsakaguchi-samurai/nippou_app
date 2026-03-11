"use client";

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Send } from "lucide-react";
import type { ReportEntryData } from "@/types";

interface GoalProgress {
  goalId: string;
  content: string;
  progressCurrent: string;
  progressTotal: string;
  percentage: string;
}

interface ReportPreviewProps {
  entries: ReportEntryData[];
  goalProgresses?: GoalProgress[];
  onSend: () => void;
  sending: boolean;
  reportId: string | null;
}

export function ReportPreview({
  entries,
  goalProgresses = [],
  onSend,
  sending,
  reportId,
}: ReportPreviewProps) {
  const totalMinutes = entries.reduce((s, e) => s + e.durationMinutes, 0);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  if (entries.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>プレビュー</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md bg-muted p-4 font-mono text-sm whitespace-pre-wrap">
          <p className="font-bold">業務内容 (合計: {hours}時間{mins}分)</p>
          {entries.map((e, i) => (
            <div key={i} className="mt-2">
              <p>
                {e.category || "未分類"}: {e.title} ({e.durationMinutes}分)
              </p>
              {e.memo && (
                <p className="text-muted-foreground ml-4">メモ: {e.memo}</p>
              )}
            </div>
          ))}
          {goalProgresses.length > 0 && (
            <>
              <p className="font-bold mt-4">今週の目標進捗</p>
              {goalProgresses.map((g) => {
                const hasRatio = g.progressCurrent !== "" && g.progressTotal !== "";
                const hasPct = g.percentage !== "";
                const progress = hasRatio
                  ? `${g.progressCurrent}/${g.progressTotal} (${g.percentage}%)`
                  : hasPct
                  ? `${g.percentage}%`
                  : "未入力";
                return (
                  <div key={g.goalId} className="mt-2">
                    <p>・{g.content}: {progress}</p>
                  </div>
                );
              })}
            </>
          )}
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
