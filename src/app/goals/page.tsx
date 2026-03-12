"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { getWeekStartDate, getWeekDays, formatDateISO, formatDate } from "@/lib/utils/date";
import { addDays } from "date-fns";

interface GoalProgress {
  id?: string;
  date: string;
  percentage: number;
  note?: string;
  progressCurrent?: number | null;
}

interface WeeklyGoal {
  id: string;
  content: string;
  weekStartDate: string;
  targetTotal: number | null;
  progress: GoalProgress[];
}

export default function GoalsPage() {
  const [weekStart, setWeekStart] = useState(getWeekStartDate());
  const [goals, setGoals] = useState<WeeklyGoal[]>([]);
  const [newGoal, setNewGoal] = useState("");
  const [newTargetTotal, setNewTargetTotal] = useState("");
  const today = formatDateISO(new Date());

  const weekDays = getWeekDays(weekStart);
  const weekStartISO = formatDateISO(weekStart);

  const loadGoals = useCallback(async () => {
    const res = await fetch(`/api/goals?weekStart=${weekStartISO}`);
    const data = await res.json();
    setGoals(data);
  }, [weekStartISO]);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  const addGoal = async () => {
    if (!newGoal.trim()) return;
    const res = await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        weekStartDate: weekStartISO,
        content: newGoal,
        targetTotal: newTargetTotal ? Number(newTargetTotal) : null,
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || `追加に失敗しました (${res.status})`);
      return;
    }
    setNewGoal("");
    setNewTargetTotal("");
    loadGoals();
  };

  const deleteGoal = async (id: string) => {
    await fetch(`/api/goals/${id}`, { method: "DELETE" });
    loadGoals();
  };


  const prevWeek = () => setWeekStart(addDays(weekStart, -7));
  const nextWeek = () => setWeekStart(addDays(weekStart, 7));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>週次目標</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={prevWeek}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium">
                {formatDate(weekStart)} 〜 {formatDate(addDays(weekStart, 4))}
              </span>
              <Button variant="ghost" size="icon" onClick={nextWeek}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add goal form */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                placeholder="新しい目標を入力..."
                onKeyDown={(e) => e.key === "Enter" && addGoal()}
                className="flex-1"
              />
              <div className="flex items-center gap-1 shrink-0">
                <Input
                  type="number"
                  min={1}
                  value={newTargetTotal}
                  onChange={(e) => setNewTargetTotal(e.target.value)}
                  placeholder="目標数"
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground whitespace-nowrap">件</span>
              </div>
              <Button onClick={addGoal} disabled={!newGoal.trim()}>
                <Plus className="h-4 w-4 mr-2" />
                追加
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">目標数は任意（入力すると日報の進捗欄に自動反映されます）</p>
          </div>

          <Separator />

          {goals.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              目標がありません。新しい目標を追加してください。
            </p>
          ) : (
            <div className="space-y-6">
              {goals.map((goal) => {
                // 前日までの最新進捗
                const yesterday = formatDateISO(addDays(new Date(today), -1));
                const prevProgress = goal.progress
                  .filter((p) => p.date.split("T")[0] <= yesterday)
                  .sort((a, b) => b.date.localeCompare(a.date))[0];
                const prevPct = prevProgress?.percentage ?? 0;
                const prevCurrent = prevProgress?.progressCurrent;
                const prevDate = prevProgress?.date?.split("T")[0];

                return (
                  <div key={goal.id} className="rounded-lg border p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-medium">
                          {goal.content}
                          {goal.targetTotal != null && (
                            <span className="ml-2 text-sm font-normal text-muted-foreground">（目標: {goal.targetTotal}件）</span>
                          )}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Progress value={prevPct} className="flex-1" />
                          <span className="text-sm font-medium w-12 text-right">{prevPct}%</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {prevDate
                            ? `${prevDate} 時点: ${prevCurrent != null && goal.targetTotal != null ? `${prevCurrent}/${goal.targetTotal}件` : `${prevPct}%`}`
                            : "進捗なし"}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => deleteGoal(goal.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>

                    {/* Week overview */}
                    <div className="grid grid-cols-5 gap-2 text-xs">
                      {weekDays.map((day) => {
                        const dayISO = formatDateISO(day);
                        const prog = goal.progress.find(
                          (p) => p.date.split("T")[0] === dayISO
                        );
                        const isToday = dayISO === today;
                        return (
                          <div
                            key={dayISO}
                            className={`rounded p-2 text-center ${
                              isToday
                                ? "bg-primary/10 border border-primary/20"
                                : "bg-muted/30"
                            }`}
                          >
                            <p className="font-medium">
                              {formatDate(day).split("(")[1]?.replace(")", "") ?? ""}
                            </p>
                            <p className="text-muted-foreground">
                              {prog ? `${prog.percentage}%` : "-"}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
