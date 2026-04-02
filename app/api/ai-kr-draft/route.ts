import { NextResponse } from "next/server";
import { type Objective, personnelRoster } from "@/lib/data";
import { callMiniMaxJson } from "@/lib/ai-minimax";
import { sanitizeDraftPatch, type AiKrDraftResult } from "@/lib/ai-okr";

export const runtime = "nodejs";

type AiKrDraftRequest = {
  rawText: string;
  objective: Objective | null;
};

type RawDraftResult = {
  reason?: string;
  draft?: Record<string, unknown>;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AiKrDraftRequest;
    const rawText = body.rawText?.trim();
    const objective = body.objective;

    if (!rawText) {
      return NextResponse.json({ error: "先输入你想新增的 KR 描述，我才能帮你整理。" }, { status: 400 });
    }

    if (!objective) {
      return NextResponse.json({ error: "当前没有选中的 Objective，无法生成 KR 草稿。" }, { status: 400 });
    }

    const rawResult = await callMiniMaxJson<RawDraftResult>({
      systemPrompt:
        "你是 OKR 草稿助手。把用户描述整理成新 KR 草稿，只保留明确或低风险推断的信息；没把握就留空。姓名必须从名册里选，角色只能是组长、组员、业务对接、公关组。不要解释，不要 Markdown，回答的第一个字符必须是 { 。",
      maxTokens: 560,
      userPrompt: [
        "请生成新 KR 草稿。",
        "",
        "{",
        '  "reason": "一句中文说明",',
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
        "1. 这是新增 KR，不要返回 id。",
        "2. 没有把握的字段直接留空，不要硬编预算、接口人、进度数字。",
        "3. 标题尽量整理成一句清晰、可执行的 KR 表述。",
        "4. type 必须二选一；如果文本明显偏探索或验证，可给探索型，否则优先承诺型。",
        "5. completion 只有在文本明确体现阶段完成度时才填写，否则默认 0。",
        "6. 最终只返回 JSON，对象外不要有任何文字。",
        "",
        `Objective：${JSON.stringify(
          {
            title: objective.title,
            owner: objective.owner,
            department: objective.department
          }
        )}`,
        "",
        `名册：${JSON.stringify(personnelRoster)}`,
        "",
        `用户描述：${rawText}`
      ].join("\n")
    });

    const result: AiKrDraftResult = {
      reason:
        typeof rawResult.reason === "string" && rawResult.reason.trim()
          ? rawResult.reason.trim()
          : "已按你的描述整理出一版可编辑的 KR 草稿。",
      draft: sanitizeDraftPatch(rawResult.draft)
    };

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知错误";
    return NextResponse.json({ error: `AI 生成 KR 草稿失败：${message}` }, { status: 500 });
  }
}
