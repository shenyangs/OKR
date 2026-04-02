import { NextResponse } from "next/server";
import { personnelRoster, type Personnel } from "@/lib/data";
import type {
  AiRewriteCreateSuggestion,
  AiRewritePatch,
  AiRewriteRequest,
  AiRewriteResult
} from "@/lib/ai-kr-rewrite";
import { callMiniMaxJson } from "@/lib/ai-minimax";
import { normalizeConfidence, sanitizeDraftPatch } from "@/lib/ai-okr";

const VALID_ROLES = new Set(["组长", "组员", "业务对接", "公关组"]);

type RawModelResult = {
  matched?: boolean;
  objectiveId?: string;
  krId?: string;
  confidence?: number;
  reason?: string;
  patch?: Record<string, unknown>;
};

type RawCreateSuggestion = {
  objectiveId?: string;
  confidence?: number;
  reason?: string;
  draft?: Record<string, unknown>;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AiRewriteRequest;
    const rawText = body.rawText?.trim();
    const objectives = Array.isArray(body.objectives) ? body.objectives : [];

    if (!rawText) {
      return NextResponse.json({ error: "请输入需要识别的 KR 文本。" }, { status: 400 });
    }

    if (!objectives.length) {
      return NextResponse.json({ error: "当前没有可识别的 OKR 数据。" }, { status: 400 });
    }

    const catalog = objectives.map((objective) => ({
      objectiveId: objective.id,
      objectiveTitle: objective.title,
      krs: objective.krs.map((kr) => ({
        krId: kr.id,
        krTitle: kr.title,
        type: kr.type,
        target2026: kr.target2026,
        progress: kr.progress,
        budgetStr: kr.budgetStr,
        metricDefinition: kr.metricDefinition,
        personnel: kr.personnel
      }))
    }));

    const parsed = await callMiniMaxJson<RawModelResult>({
      systemPrompt:
        "你是 OKR 结构化整理助手。你的任务是：根据用户粘贴的一段 KR 文本，从给定的 Objective/KR 目录中找出最匹配的唯一 KR，然后只抽取文本里明确出现的新信息，生成用于覆盖旧 KR 的 patch。不要编造，不要补全未出现的字段。你必须只输出一个 JSON 对象，不要输出 Markdown，不要解释。",
      userPrompt: [
        "请基于下面的目录识别用户文本对应的 KR，并返回 JSON。",
        "",
        "返回格式：",
        '{',
        '  "matched": true,',
        '  "objectiveId": "o1",',
        '  "krId": "o1-kr1",',
        '  "confidence": 0.91,',
        '  "reason": "一句中文理由",',
        '  "patch": {',
        '    "title": "可选",',
        '    "type": "承诺型 或 探索型",',
        '    "target2026": "可选",',
        '    "progress": "可选",',
        '    "budgetStr": "可选",',
        '    "metricDefinition": "可选",',
        '    "marchProgressLabel": "可选",',
        '    "dataProvider": "可选",',
        '    "interfacePerson": "可选",',
        '    "alignedDepartments": "可选",',
        '    "alignedOkr": "可选",',
        '    "personnel": [{"name": "必须从名册中选择", "role": "组长|组员|业务对接|公关组"}]',
        "  }",
        "}",
        "",
        "规则：",
        "1. objectiveId 和 krId 必须只从给定目录里选择。",
        "2. 如果文本只更新了部分内容，patch 里只放这些字段。",
        "3. 如果没有把握唯一匹配，返回 matched=false，并把 confidence 降低，patch 置为空对象。",
        "4. 人员姓名必须只从给定名册里选，角色必须是给定枚举。",
        "5. patch 不要包含 id、weight、completion 这些字段。",
        "",
        `人员名册：${JSON.stringify(personnelRoster, null, 2)}`,
        "",
        `OKR 目录：${JSON.stringify(catalog, null, 2)}`,
        "",
        "用户输入：",
        rawText
      ].join("\n")
    });
    const result = sanitizeModelResult(parsed, objectives);

    if (!result.matched) {
      try {
        result.createSuggestion = await buildCreateSuggestion(rawText, objectives);
      } catch {
        result.createSuggestion = null;
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知错误";
    return NextResponse.json({ error: `AI 识别失败：${message}` }, { status: 500 });
  }
}

function sanitizeModelResult(modelResult: RawModelResult, objectives: AiRewriteRequest["objectives"]): AiRewriteResult {
  const matched = Boolean(modelResult.matched);
  const objectiveId = typeof modelResult.objectiveId === "string" ? modelResult.objectiveId : "";
  const krId = typeof modelResult.krId === "string" ? modelResult.krId : "";
  const confidence = normalizeConfidence(modelResult.confidence);
  const reason = typeof modelResult.reason === "string" ? modelResult.reason.trim() : "";

  const targetKr = objectives
    .flatMap((objective) => objective.krs.map((kr) => ({ objectiveId: objective.id, kr })))
    .find((item) => item.objectiveId === objectiveId && item.kr.id === krId)?.kr;

  if (!matched || !targetKr) {
    return {
      matched: false,
      objectiveId: "",
      krId: "",
      confidence,
      reason: reason || "AI 没有足够把握定位到唯一 KR。",
      patch: {}
    };
  }

  return {
    matched: true,
    objectiveId,
    krId,
    confidence,
    reason: reason || "AI 已根据标题、内容和责任人完成匹配。",
    patch: sanitizePatch(modelResult.patch, targetKr)
  };
}

async function buildCreateSuggestion(
  rawText: string,
  objectives: AiRewriteRequest["objectives"]
): Promise<AiRewriteCreateSuggestion | null> {
  const objectiveCatalog = objectives.map((objective) => ({
    objectiveId: objective.id,
    objectiveTitle: objective.title,
    owner: objective.owner,
    department: objective.department,
    existingKrTitles: objective.krs.map((kr) => kr.title)
  }));

  const rawResult = await callMiniMaxJson<RawCreateSuggestion>({
    systemPrompt:
      "你是 OKR 路由与草稿助手。当前文本没有匹配到现有 KR。你的任务是先判断它是否能明确归属到唯一一个 Objective；如果能，再整理出一版新增 KR 草稿。不要编造，没有把握就留空。你必须只输出一个 JSON 对象，不要输出 Markdown，不要解释。",
    maxTokens: 900,
    userPrompt: [
      "请判断下面的文本是否适合新增为 KR，并返回 JSON。",
      "",
      "返回格式：",
      "{",
      '  "objectiveId": "能确定时填写目录中的 objectiveId，否则留空字符串",',
      '  "confidence": 0.82,',
      '  "reason": "一句中文理由",',
      '  "draft": {',
      '    "title": "可选",',
      '    "type": "承诺型 或 探索型",',
      '    "target2026": "可选",',
      '    "progress": "可选",',
      '    "budgetStr": "可选",',
      '    "metricDefinition": "可选",',
      '    "marchProgressLabel": "可选",',
      '    "completion": 0,',
      '    "dataProvider": "可选",',
      '    "interfacePerson": "可选",',
      '    "alignedDepartments": "可选",',
      '    "alignedOkr": "可选",',
      '    "personnel": [{"name": "必须从名册中选择", "role": "组长|组员|业务对接|公关组"}]',
      "  }",
      "}",
      "",
      "规则：",
      "1. 只有当你能比较确定它属于唯一一个 Objective 时，才填写 objectiveId。",
      "2. 如果无法确定唯一 Objective，objectiveId 必须留空，draft 置为空对象。",
      "3. 这是新增 KR 草稿，不要返回 id、weight。",
      "4. 草稿里只保留明确或低风险推断的信息；没有把握的字段留空。",
      "5. completion 只有文本明确提到完成度时才填写，否则默认 0。",
      "6. 人员姓名必须只从名册里选，角色必须使用给定枚举。",
      "",
      `人员名册：${JSON.stringify(personnelRoster, null, 2)}`,
      "",
      `Objective 目录：${JSON.stringify(objectiveCatalog, null, 2)}`,
      "",
      "用户输入：",
      rawText
    ].join("\n")
  });

  const objectiveId = typeof rawResult.objectiveId === "string" ? rawResult.objectiveId.trim() : "";
  const confidence = normalizeConfidence(rawResult.confidence);
  const objective = objectives.find((item) => item.id === objectiveId);
  const draft = sanitizeDraftPatch(rawResult.draft);
  const hasDraft = Object.keys(draft).length > 0;

  if (!objective || confidence < 0.7 || !hasDraft) {
    return null;
  }

  return {
    objectiveId: objective.id,
    confidence,
    reason:
      typeof rawResult.reason === "string" && rawResult.reason.trim()
        ? rawResult.reason.trim()
        : `未匹配到现有 KR，但内容更像属于“${objective.title}”，已整理为新增 KR 草稿。`,
    draft
  };
}

function sanitizePatch(rawPatch: RawModelResult["patch"], targetKr: AiRewriteRequest["objectives"][number]["krs"][number]): AiRewritePatch {
  const patch: AiRewritePatch = {};

  if (!rawPatch || typeof rawPatch !== "object") {
    return patch;
  }

  assignTrimmedString(patch, "title", rawPatch.title);
  assignEnumString(patch, "type", rawPatch.type, ["承诺型", "探索型"]);
  assignTrimmedString(patch, "target2026", rawPatch.target2026);
  assignTrimmedString(patch, "progress", rawPatch.progress);
  assignTrimmedString(patch, "budgetStr", rawPatch.budgetStr);
  assignTrimmedString(patch, "metricDefinition", rawPatch.metricDefinition);
  assignTrimmedString(patch, "marchProgressLabel", rawPatch.marchProgressLabel);
  assignTrimmedString(patch, "dataProvider", rawPatch.dataProvider);
  assignTrimmedString(patch, "interfacePerson", rawPatch.interfacePerson);
  assignTrimmedString(patch, "alignedDepartments", rawPatch.alignedDepartments);
  assignTrimmedString(patch, "alignedOkr", rawPatch.alignedOkr);

  const normalizedPersonnel = normalizePersonnel(rawPatch.personnel);
  if (normalizedPersonnel.length) {
    patch.personnel = normalizedPersonnel;
  }

  return patch;
}

function assignTrimmedString<T extends keyof AiRewritePatch>(
  patch: AiRewritePatch,
  key: T,
  value: unknown
) {
  if (typeof value !== "string") {
    return;
  }

  const trimmed = value.trim();
  if (trimmed) {
    patch[key] = trimmed as AiRewritePatch[T];
  }
}

function assignEnumString<T extends keyof AiRewritePatch>(
  patch: AiRewritePatch,
  key: T,
  value: unknown,
  allowed: string[]
) {
  if (typeof value === "string" && allowed.includes(value.trim())) {
    patch[key] = value.trim() as AiRewritePatch[T];
  }
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
