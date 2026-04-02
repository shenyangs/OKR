import type { Objective } from "@/lib/data";
import { buildRiskRadar, countHighRiskItems } from "@/lib/risk-radar";
import { formatWeight } from "@/lib/utils";

export function SummaryStrip({
  objectives,
  currentPerson,
  personalTaskCount
}: {
  objectives: Objective[];
  currentPerson: string;
  personalTaskCount: number;
}) {
  const objectiveCount = objectives.length;
  const keyResultCount = objectives.reduce((total, objective) => total + objective.krs.length, 0);
  const totalWeight = objectives.reduce((total, objective) => total + objective.weight, 0);
  const highRiskCount = countHighRiskItems(buildRiskRadar(objectives));

  const cards = [
    {
      label: "部门 Objective",
      value: `${objectiveCount} 个`,
      note: `总权重 ${formatWeight(totalWeight)}`
    },
    {
      label: "部门 KR",
      value: `${keyResultCount} 项`,
      note: "全部责任人清晰映射"
    },
    {
      label: "当前身份",
      value: currentPerson,
      note: `工作台自动筛出 ${personalTaskCount} 项关联任务`
    },
    {
      label: "风险提示",
      value: `${highRiskCount} 项高风险`,
      note: "基于完成度、进度表述和协同复杂度快速筛查"
    }
  ];

  return (
    <section className="mx-auto grid max-w-[1520px] gap-4 px-4 sm:grid-cols-2 xl:grid-cols-4 sm:px-6 lg:px-10">
      {cards.map((card) => (
        <div key={card.label} className="glass-panel px-5 py-5">
          <p className="text-caption">{card.label}</p>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950">{card.value}</p>
          <p className="mt-2 text-sm text-zinc-500">{card.note}</p>
        </div>
      ))}
    </section>
  );
}
