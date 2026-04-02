"use client";

import { motion } from "framer-motion";
import { FileText, FolderKanban, Layers2, PencilLine, Plus, Trash2 } from "lucide-react";
import type { KeyResult, Objective } from "@/lib/data";
import { formatWeight } from "@/lib/utils";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { KrCard } from "@/components/kr-card";
import { Button } from "@/components/ui/button";

export function DepartmentView({
  objectives,
  currentPerson,
  onOpenKr,
  onEditObjective,
  onAddKr,
  onDeleteKr,
  canEdit
}: {
  objectives: Objective[];
  currentPerson: string;
  onOpenKr: (kr: KeyResult, objective: Objective) => void;
  onEditObjective?: (objective: Objective) => void;
  onAddKr?: (objective: Objective) => void;
  onDeleteKr?: (objective: Objective, kr: KeyResult) => void;
  canEdit?: boolean;
}) {
  return (
    <section className="glass-panel-strong p-5 sm:p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-caption">Department View</p>
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">部门大盘</h2>
          <p className="max-w-3xl text-sm leading-6 text-zinc-500">
            默认展开全部 Objective，直接把 O 信息、KR 目标值、预算、进度、责任人和互锁关系完整摊开。首页优先用于统一认知，不需要点来点去才能看明白。
          </p>
        </div>
        <div className="hidden h-12 w-12 items-center justify-center rounded-2xl bg-zinc-950 text-white shadow-soft sm:flex">
          <Layers2 className="h-5 w-5" />
        </div>
      </div>

      <Accordion type="multiple" defaultValue={objectives.map((objective) => objective.id)} className="space-y-4">
        {objectives.map((objective, index) => (
          <AccordionItem key={objective.id} value={objective.id}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 220, damping: 24, delay: index * 0.04 }}
              className="glass-panel overflow-hidden"
            >
              <div className="space-y-4 px-5 py-5 sm:px-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 text-caption">
                      <FolderKanban className="h-4 w-4 text-zinc-400" />
                      <span>{objective.department}</span>
                    </div>
                    <h3 className="text-2xl font-semibold leading-10 text-zinc-950">{objective.title}</h3>
                  </div>

                  {canEdit ? (
                    <div className="flex flex-wrap gap-2">
                      {onAddKr ? (
                        <Button variant="secondary" size="sm" onClick={() => onAddKr(objective)}>
                          <Plus className="mr-2 h-4 w-4" />
                          新增 KR
                        </Button>
                      ) : null}
                      {onEditObjective ? (
                        <Button variant="secondary" size="sm" onClick={() => onEditObjective(objective)}>
                          <PencilLine className="mr-2 h-4 w-4" />
                          编辑 O
                        </Button>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr_0.7fr_0.7fr]">
                  <div className="rounded-[1.75rem] bg-zinc-50/80 p-4">
                    <p className="text-caption">O 权重</p>
                    <p className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950">
                      {formatWeight(objective.weight)}
                    </p>
                  </div>
                  <div className="rounded-[1.75rem] bg-zinc-50/80 p-4">
                    <p className="text-caption">负责人</p>
                    <p className="mt-3 text-lg font-medium text-zinc-900">{objective.owner || "未填写"}</p>
                    <p className="mt-2 text-sm text-zinc-500">当前 Objective 下共有 {objective.krs.length} 个 KR</p>
                  </div>
                  <div className="rounded-[1.75rem] bg-zinc-50/80 p-4 xl:col-span-2">
                    <p className="text-caption">补充文档</p>
                    {objective.docLink ? (
                      <a
                        href={objective.docLink}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-zinc-700 underline decoration-zinc-300 underline-offset-4"
                      >
                        <FileText className="h-4 w-4" />
                        打开补充文档
                      </a>
                    ) : (
                      <p className="mt-3 text-sm text-zinc-500">暂未填写补充文档链接</p>
                    )}
                  </div>
                </div>

                <AccordionTrigger className="rounded-[1.5rem] bg-zinc-50/80 px-4 py-3 text-zinc-700">
                  <span className="text-sm font-medium">
                    {objective.krs.length > 0 ? "收起 / 展开当前 Objective 的 KR 明细" : "当前 Objective 暂无 KR"}
                  </span>
                </AccordionTrigger>
              </div>

              <AccordionContent className="px-5 pb-5 sm:px-6 sm:pb-6">
                <div className="grid gap-4">
                  {objective.krs.map((kr) => (
                    <KrCard
                      key={kr.id}
                      kr={kr}
                      objectiveTitle={objective.title}
                      currentPerson={currentPerson}
                      canEdit={canEdit}
                      onDelete={
                        canEdit && onDeleteKr
                          ? () => {
                              onDeleteKr(objective, kr);
                            }
                          : undefined
                      }
                      onOpen={() => onOpenKr(kr, objective)}
                    />
                  ))}
                </div>
              </AccordionContent>
            </motion.div>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
