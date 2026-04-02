import type { KeyResult, Objective } from "@/lib/data";

export type KrRiskItem = {
  objectiveId: string;
  objectiveTitle: string;
  krId: string;
  krTitle: string;
  completion: number;
  level: "高" | "中" | "低";
  score: number;
  reasons: string[];
  owners: string[];
};

const STAGNATION_KEYWORDS = ["暂无", "尚无", "无进度", "摸索", "梳理", "筹备", "准备", "沟通", "阶段", "待"];
const RISK_KEYWORDS = ["风险", "卡点", "不足", "未", "仍需", "受限", "下降", "问题", "延后", "滞后"];

export function buildRiskRadar(objectives: Objective[]) {
  return objectives
    .flatMap((objective) => objective.krs.map((kr) => scoreKeyResult(objective, kr)))
    .sort((left, right) => right.score - left.score);
}

export function countHighRiskItems(items: KrRiskItem[]) {
  return items.filter((item) => item.level === "高").length;
}

function scoreKeyResult(objective: Objective, kr: KeyResult): KrRiskItem {
  let score = 0;
  const reasons = new Set<string>();
  const normalizedProgress = kr.progress.trim();
  const owners = kr.personnel.map((person) => person.name);

  if (kr.completion < 15) {
    score += 32;
    reasons.add("完成度仍处于很低水平");
  } else if (kr.completion < 30) {
    score += 22;
    reasons.add("完成度偏低，需要尽快拉动");
  } else if (kr.completion < 50) {
    score += 12;
    reasons.add("完成度刚过中前段，仍需继续加速");
  }

  if (!normalizedProgress) {
    score += 18;
    reasons.add("缺少明确进度描述");
  }

  if (containsKeywords(normalizedProgress, STAGNATION_KEYWORDS)) {
    score += 16;
    reasons.add("进度描述偏准备态，落地信号还不够强");
  }

  if (containsKeywords(normalizedProgress, RISK_KEYWORDS)) {
    score += 14;
    reasons.add("进度中已经出现风险或阻塞信号");
  }

  if (!kr.dataProvider?.trim()) {
    score += 6;
    reasons.add("缺少数据提供部门");
  }

  if (!kr.interfacePerson?.trim()) {
    score += 6;
    reasons.add("缺少数据接口人");
  }

  if (!kr.personnel.some((person) => person.role === "组长")) {
    score += 8;
    reasons.add("责任分工里没有明确组长");
  }

  if (kr.personnel.length >= 8) {
    score += 8;
    reasons.add("协同人数较多，推进链路可能偏长");
  }

  if (kr.type === "探索型" && kr.completion < 20) {
    score += 6;
    reasons.add("探索型事项仍需尽快形成阶段性抓手");
  }

  const boundedScore = Math.max(0, Math.min(100, score));

  return {
    objectiveId: objective.id,
    objectiveTitle: objective.title,
    krId: kr.id,
    krTitle: kr.title,
    completion: kr.completion,
    level: getRiskLevel(boundedScore),
    score: boundedScore,
    reasons: Array.from(reasons).slice(0, 4),
    owners
  };
}

function getRiskLevel(score: number): KrRiskItem["level"] {
  if (score >= 60) {
    return "高";
  }

  if (score >= 35) {
    return "中";
  }

  return "低";
}

function containsKeywords(content: string, keywords: string[]) {
  if (!content) {
    return false;
  }

  return keywords.some((keyword) => content.includes(keyword));
}
