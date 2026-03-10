"use client";

import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import Image from "next/image";

export function UserMenu() {
  const { data: session } = useSession();

  if (!session?.user) return null;

  return (
    <div className="flex items-center gap-3">
      {session.user.image && (
        <Image
          src={session.user.image}
          alt={session.user.name ?? ""}
          width={32}
          height={32}
          className="rounded-full"
        />
      )}
      <span className="text-sm font-medium hidden sm:inline">
        {session.user.name}
      </span>
      <Button variant="ghost" size="icon" onClick={() => signOut()}>
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  );
}
