"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
}

interface WeeklyGoal {
  id: string;
  content: string;
  weekStartDate: string;
  progress: GoalProgress[];
}

export default function GoalsPage() {
  const [weekStart, setWeekStart] = useState(getWeekStartDate());
  const [goals, setGoals] = useState<WeeklyGoal[]>([]);
  const [newGoal, setNewGoal] = useState("");
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
      body: JSON.stringify({ weekStartDate: weekStartISO, content: newGoal }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || `追加に失敗しました (${res.status})`);
      return;
    }
    setNewGoal("");
    loadGoals();
  };

  const deleteGoal = async (id: string) => {
    await fetch(`/api/goals/${id}`, { method: "DELETE" });
    loadGoals();
  };

  const updateProgress = async (
    goalId: string,
    date: string,
    percentage: number,
    note?: string
  ) => {
    await fetch(`/api/goals/${goalId}/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, percentage, note }),
    });
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
          <div className="flex gap-2">
            <Input
              value={newGoal}
              onChange={(e) => setNewGoal(e.target.value)}
              placeholder="新しい目標を入力..."
              onKeyDown={(e) => e.key === "Enter" && addGoal()}
            />
            <Button onClick={addGoal} disabled={!newGoal.trim()}>
              <Plus className="h-4 w-4 mr-2" />
              追加
            </Button>
          </div>

          <Separator />

          {goals.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              目標がありません。新しい目標を追加してください。
            </p>
          ) : (
            <div className="space-y-6">
              {goals.map((goal) => {
                const todayProgress = goal.progress.find(
                  (p) => p.date.split("T")[0] === today
                );
                const latestPct = todayProgress?.percentage ?? 0;

                return (
                  <div key={goal.id} className="rounded-lg border p-4 space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-medium">{goal.content}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Progress value={latestPct} className="flex-1" />
                          <span className="text-sm font-medium w-12 text-right">
                            {latestPct}%
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteGoal(goal.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>

                    {/* Daily progress input for today */}
                    <div className="bg-muted/50 rounded-md p-3 space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        本日の進捗
                      </Label>
                      <div className="flex items-center gap-3">
                        <Input
                          type="range"
                          min={0}
                          max={100}
                          step={5}
                          value={todayProgress?.percentage ?? 0}
                          onChange={(e) =>
                            updateProgress(
                              goal.id,
                              today,
                              parseInt(e.target.value),
                              todayProgress?.note
                            )
                          }
                          className="flex-1 h-2"
                        />
                        <span className="text-sm font-medium w-12 text-right">
                          {todayProgress?.percentage ?? 0}%
                        </span>
                      </div>
                      <Textarea
                        value={todayProgress?.note ?? ""}
                        onChange={(e) =>
                          updateProgress(
                            goal.id,
                            today,
                            todayProgress?.percentage ?? 0,
                            e.target.value
                          )
                        }
                        placeholder="進捗メモ（任意）"
                        rows={2}
                      />
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
