"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ALL_ROLES } from "@/lib/constants/categories";
import { Loader2, Save } from "lucide-react";
import type { Role, UserProfile } from "@/types";
import { parseRoles } from "@/types";
import Image from "next/image";

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [slackUserId, setSlackUserId] = useState("");
  const [leaderSlackUserId, setLeaderSlackUserId] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/user")
      .then((res) => res.json())
      .then((data) => {
        setUser(data);
        setRoles(parseRoles(data.role));
        setSlackUserId(data.slackUserId ?? "");
        setLeaderSlackUserId(data.leaderSlackUserId ?? "");
      });
  }, []);

  const toggleRole = (r: Role) => {
    setRoles((prev) =>
      prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: roles.length > 0 ? roles.join(",") : null,
          slackUserId: slackUserId || null,
          leaderSlackUserId: leaderSlackUserId || null,
        }),
      });
      const updated = await res.json();
      setUser(updated);
      await update(); // Refresh session
      alert("設定を保存しました");
    } catch {
      alert("保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle>アカウント情報</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          {user.image && (
            <Image
              src={user.image}
              alt={user.name ?? ""}
              width={64}
              height={64}
              className="rounded-full"
            />
          )}
          <div>
            <p className="font-medium">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </CardContent>
      </Card>

      {/* Role Selection */}
      <Card>
        <CardHeader>
          <CardTitle>担当業務</CardTitle>
          <CardDescription>
            日報のカテゴリが担当業務に応じて表示されます
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">複数選択可</p>
          <div className="grid grid-cols-2 gap-3">
            {ALL_ROLES.map((r) => (
              <Button
                key={r}
                variant={roles.includes(r) ? "default" : "outline"}
                onClick={() => toggleRole(r)}
                className="h-12"
              >
                {r}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Slack Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Slack連携</CardTitle>
          <CardDescription>
            日報未送信時のリマインドに使用します
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="slackUserId">自分のSlack ユーザーID（日報送信時にメンション）</Label>
            <Input
              id="slackUserId"
              value={slackUserId}
              onChange={(e) => setSlackUserId(e.target.value)}
              placeholder="U0123456789"
            />
            <p className="text-xs text-muted-foreground mt-1">
              SlackのプロフィールからユーザーIDを確認できます
            </p>
          </div>
          <div>
            <Label htmlFor="leaderSlackUserId">リーダーのSlack ユーザーID（日報送信時にメンション）</Label>
            <Input
              id="leaderSlackUserId"
              value={leaderSlackUserId}
              onChange={(e) => setLeaderSlackUserId(e.target.value)}
              placeholder="U0123456789"
            />
            <p className="text-xs text-muted-foreground mt-1">
              未設定の場合はメンションされません
            </p>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <Button onClick={handleSave} disabled={saving} size="lg">
        {saving ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Save className="h-4 w-4 mr-2" />
        )}
        設定を保存
      </Button>
    </div>
  );
}
