"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart2 } from "lucide-react";
import { formatDateISO, getWeekStartDate } from "@/lib/utils/date";

type Period = "week" | "month";

interface Entry {
  category: string;
  durationMinutes: number;
}

interface Report {
  date: string;
  entries: Entry[];
}

function getDateRange(period: Period): { from: string; to: string; label: string } {
  const now = new Date();
  if (period === "week") {
    const weekStart = getWeekStartDate();
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    return {
      from: formatDateISO(weekStart),
      to: formatDateISO(weekEnd),
      label: `${weekStart.getMonth() + 1}/${weekStart.getDate()} 〜 ${weekEnd.getMonth() + 1}/${weekEnd.getDate()}`,
    };
  } else {
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      from: formatDateISO(from),
      to: formatDateISO(to),
      label: `${now.getFullYear()}年${now.getMonth() + 1}月`,
    };
  }
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>("week");
  const [categoryData, setCategoryData] = useState<{ category: string; minutes: number }[]>([]);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { from, to } = getDateRange(period);
    setLoading(true);
    fetch(`/api/reports?from=${from}&to=${to}`)
      .then((res) => res.json())
      .then((reports: Report[]) => {
        if (!Array.isArray(reports)) return;
        const map = new Map<string, number>();
        let total = 0;
        for (const report of reports) {
          for (const entry of report.entries) {
            const cat = entry.category || "未分類";
            map.set(cat, (map.get(cat) ?? 0) + entry.durationMinutes);
            total += entry.durationMinutes;
          }
        }
        const sorted = Array.from(map.entries())
          .map(([category, minutes]) => ({ category, minutes }))
          .sort((a, b) => b.minutes - a.minutes);
        setCategoryData(sorted);
        setTotalMinutes(total);
      })
      .finally(() => setLoading(false));
  }, [period]);

  const { label } = getDateRange(period);
  const maxMinutes = categoryData[0]?.minutes ?? 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart2 className="h-6 w-6" />
          時間分析
        </h1>
        <p className="text-muted-foreground">カテゴリ別の作業時間を確認できます</p>
      </div>

      <div className="flex gap-2">
        <Button
          variant={period === "week" ? "default" : "outline"}
          onClick={() => setPeriod("week")}
        >
          今週
        </Button>
        <Button
          variant={period === "month" ? "default" : "outline"}
          onClick={() => setPeriod("month")}
        >
          今月
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {label}　合計: {Math.floor(totalMinutes / 60)}時間{totalMinutes % 60}分
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-sm">読み込み中...</p>
          ) : categoryData.length === 0 ? (
            <p className="text-muted-foreground text-sm">データがありません</p>
          ) : (
            <div className="space-y-4">
              {categoryData.map(({ category, minutes }) => {
                const pct = Math.round((minutes / totalMinutes) * 100);
                const barPct = Math.round((minutes / maxMinutes) * 100);
                const h = Math.floor(minutes / 60);
                const m = minutes % 60;
                return (
                  <div key={category} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{category}</span>
                      <span className="text-muted-foreground">
                        {h > 0 ? `${h}時間` : ""}{m}分　({pct}%)
                      </span>
                    </div>
                    <div className="h-3 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-500"
                        style={{ width: `${barPct}%` }}
                      />
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
