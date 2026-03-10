"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ReportEntryRow } from "./ReportEntryRow";
import { ManualEventForm } from "./ManualEventForm";
import { ReportPreview } from "./ReportPreview";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Loader2, CheckCircle2 } from "lucide-react";
import type { ReportEntryData, CalendarEvent } from "@/types";
import { parseRoles } from "@/types";
import { getTodayISO } from "@/lib/utils/date";

export function ReportForm() {
  const { data: session } = useSession();
  const roleStr = (session?.user as Record<string, unknown>)?.role as string | null;
  const roles = parseRoles(roleStr);

  const [date, setDate] = useState(getTodayISO());
  const [entries, setEntries] = useState<ReportEntryData[]>([]);
  const [reportId, setReportId] = useState<string | null>(null);
  const [reportStatus, setReportStatus] = useState<string>("draft");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialLoad = useRef(true);

  const fetchCalendarAuto = useCallback(async () => {
    try {
      const res = await fetch(`/api/calendar/events?date=${date}`);
      if (!res.ok) return;
      const events: CalendarEvent[] = await res.json();
      const calendarEntries: ReportEntryData[] = events.map((e) => ({
        title: e.title,
        category: "",
        durationMinutes: e.durationMinutes,
        source: "calendar" as const,
        calendarEventId: e.id,
      }));
      setEntries(calendarEntries);
    } catch {
      // カレンダー取得失敗は無視（手動追加で対応可能）
    }
  }, [date]);

  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports?date=${date}`);
      const report = await res.json();
      if (report?.id) {
        setReportId(report.id);
        setReportStatus(report.status);
        setEntries(
          report.entries.map((e: ReportEntryData & { id: string }) => ({
            id: e.id,
            title: e.title,
            category: e.category,
            durationMinutes: e.durationMinutes,
            source: e.source,
            calendarEventId: e.calendarEventId,
            memo: e.memo,
          }))
        );
      } else {
        // 既存レポートがない場合、カレンダーから自動取得
        setReportId(null);
        setReportStatus("draft");
        await fetchCalendarAuto();
      }
    } finally {
      setLoading(false);
    }
  }, [date, fetchCalendarAuto]);

  // Load existing report or auto-fetch calendar
  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const fetchCalendarEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/calendar/events?date=${date}`);
      const events: CalendarEvent[] = await res.json();

      const existingCalendarIds = new Set(
        entries.filter((e) => e.calendarEventId).map((e) => e.calendarEventId)
      );

      const newEntries: ReportEntryData[] = events
        .filter((e) => !existingCalendarIds.has(e.id))
        .map((e) => ({
          title: e.title,
          category: "",
          durationMinutes: e.durationMinutes,
          source: "calendar" as const,
          calendarEventId: e.id,
        }));

      setEntries((prev) => [...prev, ...newEntries]);
    } catch {
      alert("カレンダーの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = useCallback(async (entriesToSave: ReportEntryData[]) => {
    if (entriesToSave.length === 0) return;
    setSaving(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, entries: entriesToSave }),
      });
      const report = await res.json();
      setReportId(report.id);
      setLastSaved(new Date());
    } catch {
      // 自動保存の失敗は静かに処理
    } finally {
      setSaving(false);
    }
  }, [date]);

  // Auto-save with 2 second debounce
  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }
    if (entries.length === 0) return;

    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }
    autoSaveTimer.current = setTimeout(() => {
      handleSave(entries);
    }, 2000);

    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [entries, handleSave]);

  // Save on page leave
  useEffect(() => {
    const onBeforeUnload = () => {
      if (entries.length > 0) {
        navigator.sendBeacon(
          "/api/reports",
          new Blob(
            [JSON.stringify({ date, entries })],
            { type: "application/json" }
          )
        );
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [date, entries]);

  const handleSend = async () => {
    if (!reportId) {
      alert("先に保存してください");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/slack/send-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId }),
      });
      if (res.ok) {
        setReportStatus("sent");
        alert("Slackに送信しました");
      } else {
        const data = await res.json();
        alert(data.error || "送信に失敗しました");
      }
    } catch {
      alert("送信に失敗しました");
    } finally {
      setSending(false);
    }
  };

  const updateEntry = (index: number, entry: ReportEntryData) => {
    setEntries((prev) => prev.map((e, i) => (i === index ? entry : e)));
  };

  const deleteEntry = (index: number) => {
    setEntries((prev) => prev.filter((_, i) => i !== index));
  };

  const addManualEntry = (entry: ReportEntryData) => {
    setEntries((prev) => [...prev, entry]);
  };

  if (roles.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">
            先に設定ページで担当業務を選択してください。
          </p>
        </CardContent>
      </Card>
    );
  }

  const totalMinutes = entries.reduce((s, e) => s + e.durationMinutes, 0);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle>日報作成</CardTitle>
            <div className="flex items-center gap-2">
              <Label htmlFor="date">日付</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-auto"
              />
            </div>
          </div>
          {reportStatus === "sent" && (
            <p className="text-sm text-green-600 font-medium">送信済み</p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              onClick={fetchCalendarEvents}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Calendar className="h-4 w-4 mr-2" />
              )}
              カレンダーから取得
            </Button>
            <ManualEventForm roles={roles} onAdd={addManualEntry} />
          </div>

          <Separator />

          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              予定がありません。カレンダーから取得するか、手動で追加してください。
            </p>
          ) : (
            <div className="space-y-3">
              {entries.map((entry, index) => (
                <ReportEntryRow
                  key={index}
                  entry={entry}
                  roles={roles}
                  onChange={(e) => updateEntry(index, e)}
                  onDelete={() => deleteEntry(index)}
                />
              ))}
            </div>
          )}

          {entries.length > 0 && (
            <>
              <Separator />
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  合計: {hours}時間{mins}分
                </p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {saving ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      保存中...
                    </>
                  ) : lastSaved ? (
                    <>
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                      自動保存済み ({lastSaved.toLocaleTimeString("ja-JP")})
                    </>
                  ) : null}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <ReportPreview
        entries={entries}
        onSend={handleSend}
        sending={sending}
        reportId={reportId}
      />
    </div>
  );
}
