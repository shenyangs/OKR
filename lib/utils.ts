import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const editableUsers = [
  "崔木杨",
  "甄紫涵",
  "冯雨",
  "沈旸",
  "常俊杰",
  "陈启铭",
  "何轶谦",
  "何亦谦"
] as const;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatWeight(weight: number) {
  return `${Math.round(weight * 100)}%`;
}

export function formatProgress(progress: number) {
  return `${progress}%`;
}

export function canEditOkr(personName: string) {
  return editableUsers.includes(personName as (typeof editableUsers)[number]);
}

export function parseWeight(input: string | number | undefined) {
  if (typeof input === "number") {
    return input;
  }

  if (!input) {
    return 0;
  }

  const cleaned = String(input).replace("%", "").trim();
  const parsed = Number(cleaned);
  if (Number.isNaN(parsed)) {
    return 0;
  }

  return parsed > 1 ? parsed / 100 : parsed;
}

export function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
  }

  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}
