import { NextResponse } from "next/server";
import { callMiniMaxJson } from "@/lib/ai-minimax";
import { sanitizeRiskRadarResult, type AiRiskRadarResult } from "@/lib/ai-okr";
import type { KrRiskItem } from "@/lib/risk-radar";

export const runtime = "nodejs";

type AiRiskRadarRequest = {
  riskItems: KrRiskItem[];
};

type RawRiskRadarResult = {
  overview?: string;
  focus?: unknown[];
  actions?: unknown[];
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AiRiskRadarRequest;
    const riskItems = Array.isArray(body.riskItems) ? body.riskItems.slice(0, 6) : [];

    if (!riskItems.length) {
      return NextResponse.json({ error: "当前没有可分析的风险项。" }, { status: 400 });
    }

    try {
      const rawResult = await callMiniMaxJson<RawRiskRadarResult>({
        systemPrompt:
          "你是 OKR 风险雷达助手。阅读高风险 KR 列表，输出简洁的管理判断与动作建议。不要解释，不要 Markdown，回答的第一个字符必须是 { 。",
        maxTokens: 520,
        userPrompt: [
          "请根据这批风险项生成一份管理简报。",
          "",
          "{",
          '  "overview": "1 段 80~160 字的总体判断",',
          '  "focus": ["最多 3 条本周最该盯的重点"],',
          '  "actions": ["最多 4 条可执行建议"]',
          "}",
          "",
          "要求：",
          "1. 聚焦优先级，不要重复罗列原始数据。",
          "2. 建议动作要可执行，比如补责任人、收窄范围、补数据口径、拆里程碑。",
          "3. 语言简洁，适合管理层快速阅读。",
          "4. 最终只返回 JSON，对象外不要有任何文字。",
          "",
          `风险项：${JSON.stringify(riskItems)}`
        ].join("\n")
      });

      const result: AiRiskRadarResult = sanitizeRiskRadarResult(rawResult);
      return NextResponse.json(result);
    } catch {
      return NextResponse.json(buildFallbackRiskRadar(riskItems));
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知错误";
    return NextResponse.json({ error: `AI 风险扫描失败：${message}` }, { status: 500 });
  }
}

function buildFallbackRiskRadar(riskItems: KrRiskItem[]): AiRiskRadarResult {
  const topItems = riskItems.slice(0, 3);
  const duplicatedOwners = Array.from(
    riskItems
      .flatMap((item) => item.owners)
      .reduce((map, owner) => map.set(owner, (map.get(owner) ?? 0) + 1), new Map<string, number>())
      .entries()
  )
    .filter(([, count]) => count > 1)
    .map(([owner]) => owner);

  const overview = [
    `当前共有 ${riskItems.length} 项重点风险 KR，其中最高分 ${riskItems[0]?.score ?? 0} 分。`,
    `最突出的共性问题集中在${summarizeReasons(riskItems)}。`,
    duplicatedOwners.length ? `同时有多条风险任务集中在 ${duplicatedOwners.join("、")} 身上，需要注意资源冲突。` : ""
  ]
    .filter(Boolean)
    .join("");

  const focus = topItems.map(
    (item) => `${item.krTitle}：优先处理${item.reasons.slice(0, 2).join("、") || "推进节奏偏慢"}`
  );

  const actions = [
    "先把最高风险 KR 拆成 1-2 个本周必须交付的里程碑，避免长期停留在准备态。",
    duplicatedOwners.length ? `明确 ${duplicatedOwners.join("、")} 的优先级，避免同一负责人被多条风险项分散。` : "",
    "对缺数据、缺接口人或协同过长的 KR，补齐责任链路后再推进执行。",
    "用周级节奏复盘一次风险项变化，确认是否从计划态转入落地态。"
  ].filter(Boolean);

  return {
    overview,
    focus,
    actions
  };
}

function summarizeReasons(riskItems: KrRiskItem[]) {
  const ranked = Array.from(
    riskItems
      .flatMap((item) => item.reasons)
      .reduce((map, reason) => map.set(reason, (map.get(reason) ?? 0) + 1), new Map<string, number>())
      .entries()
  )
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3)
    .map(([reason]) => reason);

  return ranked.join("、") || "完成度偏低与推进节奏不足";
}
