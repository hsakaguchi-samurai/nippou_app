"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { COMMON_CATEGORIES, ROLE_SPECIFIC_CATEGORIES } from "@/lib/constants/categories";
import type { Role } from "@/types";

interface CategorySelectProps {
  roles: Role[];
  value: string;
  onChange: (value: string) => void;
}

export function CategorySelect({ roles, value, onChange }: CategorySelectProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="カテゴリ選択" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <p className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
            共通
          </p>
          {COMMON_CATEGORIES.map((cat) => (
            <SelectItem key={cat} value={cat}>
              {cat}
            </SelectItem>
          ))}
        </SelectGroup>
        {roles.map((role) => (
          <SelectGroup key={role}>
            <p className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-1">
              {role}
            </p>
            {ROLE_SPECIFIC_CATEGORIES[role].map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}
