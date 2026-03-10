"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileText, Target, Settings, CheckCircle, Clock, AlertCircle } from "lucide-react";
import Link from "next/link";
import { getWeekStartDate, getWeekDays, formatDateISO, formatDate } from "@/lib/utils/date";
import { parseRoles } from "@/types";

interface ReportSummary {
  id: string;
  date: string;
  status: string;
  entries: { durationMinutes: number }[];
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const roleStr = (session?.user as Record<string, unknown>)?.role as string | null;
  const roles = parseRoles(roleStr);
  const [weekReports, setWeekReports] = useState<ReportSummary[]>([]);

  const weekStart = getWeekStartDate();
  const weekDays = getWeekDays(weekStart);
  const today = formatDateISO(new Date());

  useEffect(() => {
    const from = formatDateISO(weekStart);
    const to = formatDateISO(weekDays[4]);
    fetch(`/api/reports?from=${from}&to=${to}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setWeekReports(data);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const getReportForDay = (dayISO: string) =>
    weekReports.find((r) => r.date.split("T")[0] === dayISO);

  const todayReport = getReportForDay(today);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">ダッシュボード</h1>
        <p className="text-muted-foreground">
          {session?.user?.name}さん、お疲れ様です
        </p>
      </div>

      {/* Role check */}
      {roles.length === 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            <div className="flex-1">
              <p className="font-medium">担当業務が未設定です</p>
              <p className="text-sm text-muted-foreground">
                設定ページで担当業務を選択してください
              </p>
            </div>
            <Link href="/settings">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                設定
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Today's status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">本日の日報</CardTitle>
        </CardHeader>
        <CardContent>
          {!todayReport ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <span>未作成</span>
              </div>
              <Link href="/report">
                <Button>
                  <FileText className="h-4 w-4 mr-2" />
                  日報を作成
                </Button>
              </Link>
            </div>
          ) : todayReport.status === "sent" ? (
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-green-600 font-medium">送信済み</span>
              <span className="text-sm text-muted-foreground ml-2">
                ({todayReport.entries.reduce((s, e) => s + e.durationMinutes, 0)}分)
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-500" />
                <span className="text-yellow-600 font-medium">下書き</span>
              </div>
              <Link href="/report">
                <Button variant="outline">編集を続ける</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Week overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">今週の状況</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-3">
            {weekDays.map((day) => {
              const dayISO = formatDateISO(day);
              const report = getReportForDay(dayISO);
              const isToday = dayISO === today;
              const isPast = dayISO < today;

              return (
                <div
                  key={dayISO}
                  className={`rounded-lg p-3 text-center ${
                    isToday
                      ? "border-2 border-primary bg-primary/5"
                      : "border bg-card"
                  }`}
                >
                  <p className="text-xs font-medium mb-1">
                    {formatDate(day).split("(")[1]?.replace(")", "")}
                  </p>
                  <p className="text-xs text-muted-foreground mb-2">
                    {day.getMonth() + 1}/{day.getDate()}
                  </p>
                  {report?.status === "sent" ? (
                    <Badge className="text-xs">送信済</Badge>
                  ) : report?.status === "draft" ? (
                    <Badge variant="secondary" className="text-xs">下書き</Badge>
                  ) : isPast ? (
                    <Badge variant="destructive" className="text-xs">未送信</Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">-</Badge>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/report">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 flex items-center gap-3">
              <FileText className="h-5 w-5 text-primary" />
              <span className="font-medium">日報作成</span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/goals">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 flex items-center gap-3">
              <Target className="h-5 w-5 text-primary" />
              <span className="font-medium">週次目標</span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/settings">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 flex items-center gap-3">
              <Settings className="h-5 w-5 text-primary" />
              <span className="font-medium">設定</span>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
