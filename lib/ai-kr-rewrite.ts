import type { AiKrDraftPatch } from "@/lib/ai-okr";
import type { KeyResult, Objective } from "@/lib/data";

export type AiRewritePatch = Partial<
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
    | "dataProvider"
    | "interfacePerson"
    | "alignedDepartments"
    | "alignedOkr"
  >
>;

export type AiRewriteCreateSuggestion = {
  objectiveId: string;
  confidence: number;
  reason: string;
  draft: AiKrDraftPatch;
};

export type AiRewriteResult = {
  matched: boolean;
  objectiveId: string;
  krId: string;
  confidence: number;
  reason: string;
  patch: AiRewritePatch;
  createSuggestion?: AiRewriteCreateSuggestion | null;
};

export type AiRewriteRequest = {
  rawText: string;
  objectives: Objective[];
};

export type AiRewriteApplyMode = "progress_only" | "all_fields";

export type AiRewriteChangeLog = {
  id: string;
  objectiveId: string;
  objectiveTitle: string;
  krId: string;
  krTitle: string;
  appliedMode: AiRewriteApplyMode;
  confidence: number;
  reason: string;
  rawText: string;
  appliedFields: Array<keyof AiRewritePatch>;
  createdAt: string;
  undoneAt?: string;
  before: KeyResult;
  after: KeyResult;
};

export const AI_REWRITE_MIN_CONFIDENCE = 0.75;

export const AI_REWRITE_FIELD_LABELS: Record<keyof AiRewritePatch, string> = {
  title: "KR 标题",
  type: "KR 类型",
  target2026: "2026 年目标值",
  progress: "当前进度",
  budgetStr: "预算要求",
  personnel: "责任人映射",
  metricDefinition: "指标定义",
  marchProgressLabel: "进度标签",
  dataProvider: "数据提供方",
  interfacePerson: "接口人",
  alignedDepartments: "协同部门",
  alignedOkr: "对齐 OKR"
};
