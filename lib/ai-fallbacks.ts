import type { AiKrDraftResult, AiKrSummaryResult, AiRiskRadarResult, AiSummaryMode } from "@/lib/ai-okr";
import type { KeyResult, Objective, Personnel } from "@/lib/data";
import { personnelRoster } from "@/lib/data";
import type { KrRiskItem } from "@/lib/risk-radar";

const EXPLORATION_KEYWORDS = ["探索", "调研", "试点", "验证", "摸索", "实验", "孵化"];
const EXECUTION_KEYWORDS = ["推进", "完成", "落地", "建立", "提升", "沉淀", "发布", "传播"];

export function buildFallbackKrDraft(rawText: string, objective: Objective): AiKrDraftResult {
  const cleaned = rawText.trim();
  const names = extractRosterNames(cleaned);
  const title = buildDraftTitle(cleaned);
  const type = inferKrType(cleaned);

  return {
    reason: "已先按你的描述生成基础草稿，AI 优化版返回后会自动覆盖。",
    draft: {
      title,
      type,
      target2026: extractTargetSnippet(cleaned),
      progress: cleaned.includes("当前") || cleaned.includes("本月") ? cleaned : "待补充当前阶段进度",
      metricDefinition: buildMetricDefinition(cleaned, objective),
      completion: 0,
      personnel: names.map((name, index) => ({
        name,
        role: index === 0 ? "组长" : "组员"
      }))
    }
  };
}

export function buildFallbackSummary(
  mode: AiSummaryMode,
  objective: Objective,
  kr: KeyResult
): AiKrSummaryResult {
  const risks = buildSummaryRisks(kr);
  const nextActions = buildSummaryActions(kr);

  return {
    mode,
    title: `${mode === "周报" ? "基础版周报" : "基础版复盘"}：${kr.title}`,
    summary:
      mode === "周报"
        ? `${objective.title}下的${kr.title}当前完成度为${kr.completion}%。现有进展显示：${shrinkText(
            kr.progress || "暂无明确更新",
            88
          )}。这是一版基础整理结果，AI 优化版返回后会自动替换。`
        : `${kr.title}当前完成度为${kr.completion}%，阶段进展主要体现在：${shrinkText(
            kr.progress || "暂无明确更新",
            88
          )}。从基础信息看，后续仍需围绕目标拆清里程碑、补足协同与数据口径。`,
    risks,
    nextActions
  };
}

export function buildFallbackRiskRadar(riskItems: KrRiskItem[]): AiRiskRadarResult {
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
    `共性问题集中在${summarizeReasons(riskItems)}。`,
    duplicatedOwners.length ? `风险任务同时压在 ${duplicatedOwners.join("、")} 身上，需留意资源冲突。` : "",
    "这是一版基础简报，AI 优化版返回后会自动覆盖。"
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
    "按周复盘一次风险项变化，确认是否已从计划态转入落地态。"
  ].filter(Boolean);

  return {
    overview,
    focus,
    actions
  };
}

function extractRosterNames(content: string) {
  return personnelRoster.filter((name) => content.includes(name)).slice(0, 4);
}

function buildDraftTitle(content: string) {
  const normalized = content.replace(/[。；;！!？?]+$/g, "").trim();
  const [firstPart] = normalized.split(/[。；;！？?]/);
  return shrinkText(firstPart || normalized || "待补充 KR 标题", 34);
}

function inferKrType(content: string): KeyResult["type"] {
  if (EXPLORATION_KEYWORDS.some((keyword) => content.includes(keyword))) {
    return "探索型";
  }

  if (EXECUTION_KEYWORDS.some((keyword) => content.includes(keyword))) {
    return "承诺型";
  }

  return "承诺型";
}

function extractTargetSnippet(content: string) {
  const matched = content.match(/(\d+\s*[个场篇次家套万%])/);
  if (matched) {
    return `围绕 ${matched[1]} 这一目标推进，具体口径待补充。`;
  }

  return "";
}

function buildMetricDefinition(content: string, objective: Objective) {
  if (content.includes("案例")) {
    return "以案例数量、案例质量和对外传播落地情况作为基础衡量口径。";
  }

  return `围绕 ${objective.title} 对应目标，补充可量化指标、阶段里程碑和结果口径。`;
}

function buildSummaryRisks(kr: KeyResult) {
  const risks: string[] = [];

  if (kr.completion < 30) {
    risks.push("当前完成度偏低，需要尽快拉动可验证进展。");
  }

  if (!kr.progress.trim()) {
    risks.push("当前缺少明确进度描述。");
  } else if (["准备", "梳理", "筹备", "摸索", "暂无", "尚无"].some((keyword) => kr.progress.includes(keyword))) {
    risks.push("进展仍偏准备态，落地信号还不够强。");
  }

  if (!kr.interfacePerson?.trim()) {
    risks.push("缺少明确接口人，后续协同可能受影响。");
  }

  return risks.length ? risks.slice(0, 4) : ["当前基础信息中没有明显新增风险。"];
}

function buildSummaryActions(kr: KeyResult) {
  const actions = [
    `把 ${kr.title} 拆成最近一周的明确里程碑和交付物。`,
    kr.dataProvider?.trim() ? `和 ${kr.dataProvider} 对齐一次数据口径与产出标准。` : "补齐数据提供方与结果口径。",
    kr.interfacePerson?.trim() ? `和 ${kr.interfacePerson} 确认本周协同节奏。` : "补齐接口人，避免推进链路断点。",
    "把当前进展更新成“已完成 / 进行中 / 风险点 / 下一步”四段式。"
  ];

  return Array.from(new Set(actions)).slice(0, 5);
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

function shrinkText(content: string, maxLength: number) {
  const normalized = content.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength)}...`;
}
