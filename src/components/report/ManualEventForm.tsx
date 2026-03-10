"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { CategorySelect } from "./CategorySelect";
import { Plus } from "lucide-react";
import type { Role, ReportEntryData } from "@/types";

interface ManualEventFormProps {
  roles: Role[];
  onAdd: (entry: ReportEntryData) => void;
}

export function ManualEventForm({ roles, onAdd }: ManualEventFormProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [duration, setDuration] = useState(30);

  const handleAdd = () => {
    if (!title || !category) return;
    onAdd({
      title,
      category,
      durationMinutes: duration,
      source: "manual",
    });
    setTitle("");
    setCategory("");
    setDuration(30);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          予定を追加
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>予定を手動追加</DialogTitle>
          <DialogDescription>
            カレンダーにない予定を追加します
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>タイトル</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="予定のタイトル"
            />
          </div>
          <div>
            <Label>カテゴリ</Label>
            <CategorySelect roles={roles} value={category} onChange={setCategory} />
          </div>
          <div>
            <Label>所要時間（分）</Label>
            <Input
              type="number"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
              min={0}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleAdd} disabled={!title || !category}>
            追加
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
