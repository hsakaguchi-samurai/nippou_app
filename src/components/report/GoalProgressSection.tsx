"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Target } from "lucide-react";

export interface GoalProgress {
  goalId: string;
  content: string;
  unit: string;
  progressCurrent: string;
  progressTotal: string;
  todayCurrent: string;
  dailyTarget: string;
  percentage: string;
}

interface GoalProgressSectionProps {
  date: string;
  onChange: (goals: GoalProgress[]) => void;
}

function getWeekStart(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + offset);
  return d.toISOString().split("T")[0];
}

export function GoalProgressSection({ date, onChange }: GoalProgressSectionProps) {
  const [goals, setGoals] = useState<GoalProgress[]>([]);

  const fetchGoals = useCallback(async () => {
    const weekStart = getWeekStart(date);
    const res = await fetch(`/api/goals?weekStart=${weekStart}`);
    if (!res.ok) return;
    const data = await res.json();
    const mapped: GoalProgress[] = data.map((g: {
      id: string;
      content: string;
      targetTotal?: number | null;
      unit?: string | null;
      progress: { progressCurrent?: number; progressTotal?: number; percentage?: number; todayCurrent?: number }[];
    }) => {
      const p = g.progress[0];
      const target = g.targetTotal ?? 0;
      const dailyTarget = target > 0 ? (target / 5).toFixed(1).replace(/\.0$/, "") : "";
      const defaultTotal = g.targetTotal != null ? String(g.targetTotal)
        : p?.progressTotal != null ? String(p.progressTotal) : "";
      return {
        goalId: g.id,
        content: g.content,
        unit: g.unit ?? "",
        progressCurrent: p?.progressCurrent != null ? String(p.progressCurrent) : "",
        progressTotal: defaultTotal,
        todayCurrent: p?.todayCurrent != null ? String(p.todayCurrent) : "",
        dailyTarget,
        percentage: p?.percentage != null ? String(p.percentage) : "",
      };
    });
    setGoals(mapped);
    onChange(mapped);
  }, [date, onChange]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const update = (index: number, field: keyof GoalProgress, value: string) => {
    setGoals((prev) => {
      const next = prev.map((g, i) => {
        if (i !== index) return g;
        const updated = { ...g, [field]: value };
        if (field === "progressCurrent" || field === "progressTotal") {
          const cur = field === "progressCurrent" ? value : updated.progressCurrent;
          const tot = field === "progressTotal" ? value : updated.progressTotal;
          if (cur && tot && Number(tot) > 0) {
            updated.percentage = String(Math.round((Number(cur) / Number(tot)) * 100));
          }
        }
        return updated;
      });
      onChange(next);
      return next;
    });
  };

  if (goals.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="h-4 w-4" />
          コミットメント進捗
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {goals.map((g, i) => (
          <div key={g.goalId} className="space-y-3">
            <p className="text-sm font-medium">{g.content}{g.unit ? ` (${g.unit})` : ""}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">今週の実績 / 目標</Label>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    min={0}
                    placeholder="実績"
                    value={g.progressCurrent}
                    onChange={(e) => update(i, "progressCurrent", e.target.value)}
                    className="w-20 h-8 text-sm"
                  />
                  <span className="text-muted-foreground">/</span>
                  <Input
                    type="number"
                    min={0}
                    placeholder="目標"
                    value={g.progressTotal}
                    onChange={(e) => update(i, "progressTotal", e.target.value)}
                    className="w-20 h-8 text-sm"
                  />
                  {g.unit && <span className="text-xs text-muted-foreground">{g.unit}</span>}
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  今日の実績 / 日次目標{g.dailyTarget ? ` (${g.dailyTarget}${g.unit})` : ""}
                </Label>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    min={0}
                    placeholder="今日"
                    value={g.todayCurrent}
                    onChange={(e) => update(i, "todayCurrent", e.target.value)}
                    className="w-20 h-8 text-sm"
                  />
                  <span className="text-muted-foreground">/ {g.dailyTarget || "—"}</span>
                  {g.unit && <span className="text-xs text-muted-foreground">{g.unit}</span>}
                </div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
