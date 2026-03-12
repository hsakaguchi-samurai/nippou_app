import { Role } from "@/types";

const COMMON_CATEGORIES = ["会議", "資料作成"];

const ROLE_SPECIFIC_CATEGORIES: Record<Role, string[]> = {
  CA: ["初回面談", "求人紹介", "面接対策", "書類作成", "求人探し", "面接感想回収", "CA関係事務"],
  RA: ["商談", "求人作成", "RA関係事務"],
  マーケ: ["投稿作成", "投稿分析", "打ち合わせ"],
  企画アシスタント: ["スカウト送付", "スカウト改善", "開発・システム調整", "マニュアル作成", "事務・管理", "CAサポート", "請求対応"],
};

export function getCategoriesForRole(role: Role): string[] {
  return [...COMMON_CATEGORIES, ...ROLE_SPECIFIC_CATEGORIES[role]];
}

export function getCategoriesForRoles(roles: Role[]): string[] {
  const cats = new Set(COMMON_CATEGORIES);
  for (const role of roles) {
    for (const cat of ROLE_SPECIFIC_CATEGORIES[role]) {
      cats.add(cat);
    }
  }
  return Array.from(cats);
}

export const ALL_ROLES: Role[] = ["CA", "RA", "マーケ", "企画アシスタント"];

export { COMMON_CATEGORIES, ROLE_SPECIFIC_CATEGORIES };
