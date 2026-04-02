"use client";

import { motion } from "framer-motion";
import { Pin, ScanSearch, ShieldCheck } from "lucide-react";
import type { KeyResult, Objective } from "@/lib/data";
import { KrCard } from "@/components/kr-card";
import { Badge } from "@/components/ui/badge";

type PersonalKr = {
  kr: KeyResult;
  objective: Objective;
  role: string;
};

export function PersonalWorkspace({
  currentPerson,
  objectives,
  onOpenKr,
  canEdit = false,
  onDeleteKr
}: {
  currentPerson: string;
  objectives: Objective[];
  onOpenKr: (kr: KeyResult, objective: Objective) => void;
  canEdit?: boolean;
  onDeleteKr?: (kr: KeyResult, objective: Objective) => void;
}) {
  const personalKrs: PersonalKr[] = objectives
    .flatMap((objective) =>
      objective.krs
        .filter((kr) => kr.personnel.some((person) => person.name === currentPerson))
        .map((kr) => ({
          kr,
          objective,
          role: kr.personnel.find((person) => person.name === currentPerson)?.role ?? "组员"
        }))
    )
    .sort((left, right) => {
      const leftPriority = left.role === "组长" ? 0 : 1;
      const rightPriority = right.role === "组长" ? 0 : 1;

      if (leftPriority !== rightPriority) {
        return leftPriority - rightPriority;
      }

      return right.kr.completion - left.kr.completion;
    });

  const leadCount = personalKrs.filter((item) => item.role === "组长").length;
  const supportCount = personalKrs.length - leadCount;

  return (
    <section className="glass-panel-strong flex h-full flex-col p-5 sm:p-6">
      <div className="space-y-3">
        <p className="text-caption">Personal Workspace</p>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">我的工作台</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-500">
              自动监听顶部所选身份，仅显示该成员真正参与的 KR。当前角色会被明确标识，方便划清主责与协同边界。
            </p>
          </div>
          <Badge className="border-zinc-900/10 bg-zinc-900 text-white">{currentPerson}</Badge>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-[1.75rem] bg-zinc-50/85 p-4">
          <p className="inline-flex items-center gap-2 text-sm font-medium text-zinc-700">
            <Pin className="h-4 w-4 text-zinc-400" />
            主责任务
          </p>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950">{leadCount}</p>
        </div>
        <div className="rounded-[1.75rem] bg-zinc-50/85 p-4">
          <p className="inline-flex items-center gap-2 text-sm font-medium text-zinc-700">
            <ShieldCheck className="h-4 w-4 text-zinc-400" />
            协同任务
          </p>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950">{supportCount}</p>
        </div>
      </div>

      <div className="mt-6 flex-1 space-y-4">
        {personalKrs.length > 0 ? (
          personalKrs.map((item, index) => (
            <motion.div
              key={item.kr.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: "spring", stiffness: 240, damping: 26, delay: index * 0.03 }}
            >
              <KrCard
                kr={item.kr}
                objectiveTitle={item.objective.title}
                currentPerson={currentPerson}
                highlightRole
                canEdit={canEdit}
                onDelete={
                  canEdit && onDeleteKr
                    ? () => {
                        onDeleteKr(item.kr, item.objective);
                      }
                    : undefined
                }
                onOpen={() => onOpenKr(item.kr, item.objective)}
              />
            </motion.div>
          ))
        ) : (
          <div className="glass-panel flex h-full min-h-[260px] flex-col items-center justify-center gap-3 p-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-950 text-white shadow-soft">
              <ScanSearch className="h-5 w-5" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-zinc-950">当前身份还没有匹配的 KR</h3>
              <p className="max-w-sm text-sm leading-6 text-zinc-500">
                你可以在右上角切换身份，查看不同成员的责任边界和任务进度。
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
