"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CategorySelect } from "./CategorySelect";
import { Trash2, Calendar, PenLine, ChevronDown, ChevronUp } from "lucide-react";
import type { Role, ReportEntryData } from "@/types";

interface ReportEntryRowProps {
  entry: ReportEntryData;
  roles: Role[];
  onChange: (entry: ReportEntryData) => void;
  onDelete: () => void;
}

export function ReportEntryRow({
  entry,
  roles,
  onChange,
  onDelete,
}: ReportEntryRowProps) {
  const [memoOpen, setMemoOpen] = useState(!!entry.memo);

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-1">
          <Badge variant={entry.source === "calendar" ? "default" : "secondary"}>
            {entry.source === "calendar" ? (
              <Calendar className="h-3 w-3 mr-1" />
            ) : (
              <PenLine className="h-3 w-3 mr-1" />
            )}
            {entry.source === "calendar" ? "カレンダー" : "手動追加"}
          </Badge>
          <Input
            value={entry.title}
            onChange={(e) => onChange({ ...entry, title: e.target.value })}
            placeholder="予定のタイトル"
            className="flex-1"
          />
        </div>
        <Button variant="ghost" size="icon" onClick={onDelete}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <CategorySelect
          roles={roles}
          value={entry.category}
          onChange={(cat) => onChange({ ...entry, category: cat })}
        />
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={entry.durationMinutes}
            onChange={(e) =>
              onChange({ ...entry, durationMinutes: parseInt(e.target.value) || 0 })
            }
            className="w-20"
            min={0}
          />
          <span className="text-sm text-muted-foreground">分</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground h-7 px-2"
          onClick={() => setMemoOpen(!memoOpen)}
        >
          {memoOpen ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
          メモ
        </Button>
      </div>

      {memoOpen && (
        <Textarea
          value={entry.memo ?? ""}
          onChange={(e) => onChange({ ...entry, memo: e.target.value })}
          placeholder="メモ（任意）"
          rows={2}
        />
      )}
    </div>
  );
}
