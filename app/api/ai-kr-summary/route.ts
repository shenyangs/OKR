import { NextResponse } from "next/server";
import { type Objective, type KeyResult } from "@/lib/data";
import { callMiniMaxJson } from "@/lib/ai-minimax";
import {
  sanitizeSummaryResult,
  type AiKrSummaryResult,
  type AiSummaryMode
} from "@/lib/ai-okr";

type AiKrSummaryRequest = {
  mode: AiSummaryMode;
  objective: Objective | null;
  kr: KeyResult | null;
};

type RawSummaryResult = {
  title?: string;
  summary?: string;
  risks?: unknown[];
  nextActions?: unknown[];
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AiKrSummaryRequest;
    const mode = body.mode;
    const objective = body.objective;
    const kr = body.kr;

    if (!objective || !kr) {
      return NextResponse.json({ error: "当前没有选中的 KR，暂时无法生成摘要。" }, { status: 400 });
    }

    const rawResult = await callMiniMaxJson<RawSummaryResult>({
      systemPrompt:
        "你是 OKR 周报与复盘助手。根据给定 KR 信息输出简洁中文总结。不要解释，不要 Markdown，回答的第一个字符必须是 { 。",
      maxTokens: 560,
      userPrompt: [
        `当前任务：生成 ${mode} 内容。`,
        "",
        "{",
        '  "title": "一句短标题",',
        '  "summary": "1 段 80~160 字中文总结",',
        '  "risks": ["最多 4 条风险或卡点，没有则返回空数组"],',
        '  "nextActions": ["最多 5 条下步动作，要求具体可执行"]',
        "}",
        "",
        "要求：",
        "1. 只基于给定 KR 信息整理，不要虚构已经完成的动作。",
        `2. 如果是${mode}，语气要适合直接同步给团队。`,
        "3. 风险和下一步要尽量具体，避免空话。",
        "4. 最终只返回 JSON，对象外不要有任何文字。",
        "",
        `Objective：${objective.title}`,
        `KR：${JSON.stringify({
          title: kr.title,
          type: kr.type,
          target2026: kr.target2026,
          progress: kr.progress,
          completion: kr.completion,
          metricDefinition: kr.metricDefinition,
          dataProvider: kr.dataProvider,
          interfacePerson: kr.interfacePerson,
          personnel: kr.personnel
        })}`
      ].join("\n")
    });

    const result: AiKrSummaryResult = sanitizeSummaryResult(rawResult, mode);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知错误";
    return NextResponse.json({ error: `AI 生成摘要失败：${message}` }, { status: 500 });
  }
}
