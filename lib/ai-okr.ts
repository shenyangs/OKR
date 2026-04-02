import type { KeyResult, Objective, Personnel } from "@/lib/data";
import { personnelRoster } from "@/lib/data";
import { inferCompletionFromProgress, parsePersonnelFromText } from "@/lib/excel-import";
import { createId, parseWeight } from "@/lib/utils";

export const VALID_PERSONNEL_ROLES = ["组长", "组员", "业务对接", "公关组"] as const;

const VALID_ROLES = new Set<string>(VALID_PERSONNEL_ROLES);

export type AiSummaryMode = "周报" | "复盘";

export type AiKrDraftPatch = Partial<
  Pick<
    KeyResult,
    | "title"
    | "type"
    | "target2026"
    | "progress"
    | "budgetStr"
    | "personnel"
    | "metricDefinition"
    | "marchProgressLabel"
    | "completion"
    | "dataProvider"
    | "interfacePerson"
    | "alignedDepartments"
    | "alignedOkr"
  >
>;

export type AiKrDraftResult = {
  reason: string;
  draft: AiKrDraftPatch;
};

export type AiKrSummaryResult = {
  mode: AiSummaryMode;
  title: string;
  summary: string;
  risks: string[];
  nextActions: string[];
};

export type AiRiskRadarResult = {
  overview: string;
  focus: string[];
  actions: string[];
};

export type AiExcelImportResult = {
  summary: string;
  warnings: string[];
  objectives: Objective[];
};

type RawPatch = Record<string, unknown> | undefined;

export function normalizeConfidence(value: unknown) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return 0;
  }

  return Math.max(0, Math.min(1, value));
}

export function sanitizeDraftPatch(rawPatch: RawPatch): AiKrDraftPatch {
  const patch: AiKrDraftPatch = {};

  if (!rawPatch || typeof rawPatch !== "object") {
    return patch;
  }

  assignTrimmedString(patch, "title", rawPatch.title);
  assignEnumString(patch, "type", rawPatch.type, [...VALID_KR_TYPES]);
  assignTrimmedString(patch, "target2026", rawPatch.target2026);
  assignTrimmedString(patch, "progress", rawPatch.progress);
  assignTrimmedString(patch, "budgetStr", rawPatch.budgetStr);
  assignTrimmedString(patch, "metricDefinition", rawPatch.metricDefinition);
  assignTrimmedString(patch, "marchProgressLabel", rawPatch.marchProgressLabel);
  assignTrimmedString(patch, "dataProvider", rawPatch.dataProvider);
  assignTrimmedString(patch, "interfacePerson", rawPatch.interfacePerson);
  assignTrimmedString(patch, "alignedDepartments", rawPatch.alignedDepartments);
  assignTrimmedString(patch, "alignedOkr", rawPatch.alignedOkr);

  const completion = normalizeCompletion(rawPatch.completion);
  if (completion !== null) {
    patch.completion = completion;
  }

  const normalizedPersonnel = normalizePersonnel(rawPatch.personnel);
  if (normalizedPersonnel.length) {
    patch.personnel = normalizedPersonnel;
  }

  return patch;
}

export function sanitizeSummaryResult(
  rawResult: {
    title?: unknown;
    summary?: unknown;
    risks?: unknown;
    nextActions?: unknown;
  },
  mode: AiSummaryMode
): AiKrSummaryResult {
  const title = sanitizeSingleLineText(rawResult.title, mode === "周报" ? "本周 KR 摘要" : "阶段 KR 复盘");
  const summary = sanitizeParagraph(rawResult.summary, "当前暂无可总结内容。");
  const risks = sanitizeStringList(rawResult.risks, 4);
  const nextActions = sanitizeStringList(rawResult.nextActions, 5);

  return {
    mode,
    title,
    summary,
    risks,
    nextActions
  };
}

export function sanitizeRiskRadarResult(rawResult: {
  overview?: unknown;
  focus?: unknown;
  actions?: unknown;
}): AiRiskRadarResult {
  return {
    overview: sanitizeParagraph(rawResult.overview, "整体上需要优先关注低完成度、进度描述偏空泛和协同链路复杂的 KR。"),
    focus: sanitizeStringList(rawResult.focus, 3),
    actions: sanitizeStringList(rawResult.actions, 4)
  };
}

export function sanitizeExcelImportResult(rawResult: {
  summary?: unknown;
  warnings?: unknown;
  objectives?: unknown;
}): AiExcelImportResult {
  return {
    summary: sanitizeParagraph(rawResult.summary, "已整理出一版 Excel 导入结果，请先核对后再替换。"),
    warnings: sanitizeStringList(rawResult.warnings, 6),
    objectives: normalizeObjectives(rawResult.objectives)
  };
}

function assignTrimmedString<T extends keyof AiKrDraftPatch>(
  patch: AiKrDraftPatch,
  key: T,
  value: unknown
) {
  if (typeof value !== "string") {
    return;
  }

  const trimmed = value.trim();
  if (trimmed) {
    patch[key] = trimmed as AiKrDraftPatch[T];
  }
}

function assignEnumString<T extends keyof AiKrDraftPatch>(
  patch: AiKrDraftPatch,
  key: T,
  value: unknown,
  allowed: string[]
) {
  if (typeof value === "string" && allowed.includes(value.trim())) {
    patch[key] = value.trim() as AiKrDraftPatch[T];
  }
}

function normalizeCompletion(value: unknown) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return null;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}

function normalizePersonnel(value: unknown): Personnel[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const rawName = "name" in item ? item.name : "";
      const rawRole = "role" in item ? item.role : "";
      const name = typeof rawName === "string" ? rawName.trim() : "";
      const role = typeof rawRole === "string" ? rawRole.trim() : "";

      if (!name || !personnelRoster.includes(name) || !VALID_ROLES.has(role)) {
        return null;
      }

      return {
        name,
        role: role as Personnel["role"]
      };
    })
    .filter((item): item is Personnel => Boolean(item));
}

function normalizeImportedPersonnel(value: unknown, target2026: string, budgetStr: string): Personnel[] {
  if (!Array.isArray(value)) {
    return parsePersonnelFromText(target2026, budgetStr);
  }

  const normalized = value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const rawName = "name" in item ? item.name : "";
      const rawRole = "role" in item ? item.role : "";
      const name = typeof rawName === "string" ? rawName.trim().replace(/^@/, "") : "";
      const role = typeof rawRole === "string" ? rawRole.trim() : "";

      if (!name || !VALID_ROLES.has(role)) {
        return null;
      }

      return {
        name,
        role: role as Personnel["role"]
      };
    })
    .filter((item): item is Personnel => Boolean(item));

  return normalized.length ? dedupePersonnel(normalized) : parsePersonnelFromText(target2026, budgetStr);
}

function dedupePersonnel(items: Personnel[]) {
  return items.filter(
    (item, index) => items.findIndex((candidate) => candidate.name === item.name && candidate.role === item.role) === index
  );
}

function normalizeObjectives(value: unknown): Objective[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => normalizeObjective(item))
    .filter((item): item is Objective => Boolean(item))
    .slice(0, 20);
}

function normalizeObjective(value: unknown): Objective | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const title = sanitizeSingleLineText("title" in value ? value.title : "", "");
  if (!title) {
    return null;
  }

  const rawKrs = "krs" in value ? value.krs : [];
  const krs = Array.isArray(rawKrs)
    ? rawKrs
        .map((item) => normalizeKeyResult(item))
        .filter((item): item is KeyResult => Boolean(item))
        .slice(0, 30)
    : [];

  return {
    id: createId("o"),
    title,
    weight: parseWeight("weight" in value ? (value.weight as string | number | undefined) : 0),
    owner: sanitizeSingleLineText("owner" in value ? value.owner : "", ""),
    department: sanitizeSingleLineText("department" in value ? value.department : "", ""),
    docLink: sanitizeSingleLineText("docLink" in value ? value.docLink : "", "") || undefined,
    krs
  };
}

function normalizeKeyResult(value: unknown): KeyResult | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const title = sanitizeSingleLineText("title" in value ? value.title : "", "");
  if (!title) {
    return null;
  }

  const target2026 = sanitizeParagraph("target2026" in value ? value.target2026 : "", "");
  const progress = sanitizeParagraph("progress" in value ? value.progress : "", "");
  const budgetStr = sanitizeParagraph("budgetStr" in value ? value.budgetStr : "", "");
  const rawMarchProgressLabel = sanitizeSingleLineText("marchProgressLabel" in value ? value.marchProgressLabel : "", "");
  const labelLooksLikeProgress = looksLikeProgressContent(rawMarchProgressLabel);
  const normalizedProgress = progress || (labelLooksLikeProgress ? rawMarchProgressLabel : "");
  const completion = normalizeCompletion("completion" in value ? value.completion : null);

  return {
    id: createId("kr"),
    title,
    weight: parseWeight("weight" in value ? (value.weight as string | number | undefined) : 0),
    type: sanitizeKrType("type" in value ? value.type : ""),
    target2026,
    progress: normalizedProgress,
    budgetStr,
    personnel: normalizeImportedPersonnel("personnel" in value ? value.personnel : [], target2026, budgetStr),
    metricDefinition: sanitizeParagraph("metricDefinition" in value ? value.metricDefinition : "", ""),
    marchProgressLabel: labelLooksLikeProgress ? "3 月进度" : rawMarchProgressLabel || "3 月进度",
    completion: completion ?? inferCompletionFromProgress(normalizedProgress),
    dataProvider: sanitizeSingleLineText("dataProvider" in value ? value.dataProvider : "", "") || undefined,
    interfacePerson: sanitizeSingleLineText("interfacePerson" in value ? value.interfacePerson : "", "") || undefined,
    alignedDepartments:
      sanitizeSingleLineText("alignedDepartments" in value ? value.alignedDepartments : "", "") || undefined,
    alignedOkr: sanitizeSingleLineText("alignedOkr" in value ? value.alignedOkr : "", "") || undefined
  };
}

function sanitizeKrType(value: unknown): KeyResult["type"] {
  if (typeof value === "string" && value.includes("探索")) {
    return "探索型";
  }

  return "承诺型";
}

function looksLikeProgressContent(value: string) {
  if (!value) {
    return false;
  }

  return value.length >= 10 || /已|推进|完成|当前|阶段|准备|沟通|落地|进展/.test(value);
}

function sanitizeSingleLineText(value: unknown, fallback: string) {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized || fallback;
}

function sanitizeParagraph(value: unknown, fallback: string) {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalized = value.trim();
  return normalized || fallback;
}

function sanitizeStringList(value: unknown, maxLength: number) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean)
    .slice(0, maxLength);
}

const VALID_KR_TYPES = ["承诺型", "探索型"] as const;
