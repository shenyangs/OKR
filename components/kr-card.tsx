"use client";

import { motion } from "framer-motion";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  CircleUserRound,
  PencilLine,
  Sparkles,
  Target,
  Trash2
} from "lucide-react";
import type { KeyResult } from "@/lib/data";
import { formatProgress, formatWeight } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type KrCardProps = {
  kr: KeyResult;
  objectiveTitle: string;
  currentPerson?: string;
  onOpen: () => void;
  highlightRole?: boolean;
  canEdit?: boolean;
  onDelete?: () => void;
};

function getTypeStyles(type: KeyResult["type"]) {
  if (type === "承诺型") {
    return "border-emerald-200/70 bg-emerald-50/70 text-emerald-700";
  }

  return "border-violet-200/70 bg-violet-50/70 text-violet-700";
}

export function KrCard({
  kr,
  objectiveTitle,
  currentPerson,
  onOpen,
  highlightRole = false,
  canEdit = false,
  onDelete
}: KrCardProps) {
  const currentRole = currentPerson ? kr.personnel.find((person) => person.name === currentPerson)?.role : null;
  const leaders = kr.personnel.filter((person) => person.role === "组长").map((person) => person.name);
  const members = kr.personnel
    .filter((person) => person.role !== "组长")
    .map((person) => `${person.name}${person.role === "组员" ? "" : ` · ${person.role}`}`);

  return (
    <motion.div
      layout
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
      className={cn("glass-panel p-5", highlightRole && "ring-1 ring-sky-100")}
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <p className="text-caption">{objectiveTitle}</p>
            <h3 className="text-xl font-semibold leading-8 text-zinc-950">{kr.title}</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={onOpen}>
              <PencilLine className="mr-2 h-4 w-4" />
              {canEdit ? "查看 / 编辑" : "查看详情"}
            </Button>
            {canEdit && onDelete ? (
              <Button variant="ghost" size="sm" onClick={onDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                删除 KR
              </Button>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge className={getTypeStyles(kr.type)}>{kr.type}</Badge>
          <Badge className="border-sky-100 bg-sky-50/80 text-sky-700">KR 权重 {formatWeight(kr.weight)}</Badge>
          <Badge className="border-zinc-200/80 bg-zinc-100/80 text-zinc-700">完成度 {formatProgress(kr.completion)}</Badge>
          {currentRole ? (
            <Badge className="border-zinc-900/10 bg-zinc-900 text-white">当前角色：{currentRole}</Badge>
          ) : null}
        </div>

        <div className="space-y-3 rounded-[1.75rem] bg-zinc-50/80 p-4">
          <div className="flex items-center justify-between text-sm text-zinc-500">
            <span className="inline-flex items-center gap-2">
              <Target className="h-4 w-4" />
              当前进度
            </span>
            <span className="font-medium text-zinc-700">{formatProgress(kr.completion)}</span>
          </div>
          <Progress value={kr.completion} />
          <div className="space-y-2">
            <p className="inline-flex items-center gap-2 text-sm font-medium text-zinc-700">
              <Sparkles className="h-4 w-4 text-zinc-400" />
              {kr.marchProgressLabel}
            </p>
            <p className="whitespace-pre-line text-sm leading-7 text-zinc-600">{kr.progress || "暂无进度更新"}</p>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          <div className="rounded-[1.75rem] bg-zinc-50/80 p-4">
            <p className="text-caption">2026 年目标值</p>
            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-zinc-600">{kr.target2026 || "未填写"}</p>
          </div>
          <div className="rounded-[1.75rem] bg-zinc-50/80 p-4">
            <p className="text-caption">预算与资源</p>
            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-zinc-600">{kr.budgetStr || "未填写"}</p>
          </div>
          <div className="rounded-[1.75rem] bg-zinc-50/80 p-4">
            <p className="text-caption">指标定义</p>
            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-zinc-600">
              {kr.metricDefinition || "未填写"}
            </p>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[0.7fr_1.3fr]">
          <div className="rounded-[1.75rem] bg-zinc-50/80 p-4">
            <p className="inline-flex items-center gap-2 text-sm font-medium text-zinc-700">
              <CircleUserRound className="h-4 w-4 text-zinc-400" />
              组长
            </p>
            <p className="mt-3 text-sm leading-7 text-zinc-600">{leaders.join("、") || "待分配"}</p>
          </div>
          <div className="rounded-[1.75rem] bg-zinc-50/80 p-4">
            <p className="inline-flex items-center gap-2 text-sm font-medium text-zinc-700">
              <BriefcaseBusiness className="h-4 w-4 text-zinc-400" />
              组员 / 协同
            </p>
            <p className="mt-3 text-sm leading-7 text-zinc-600">{members.join("、") || "暂无"}</p>
            {(kr.dataProvider || kr.interfacePerson || kr.alignedDepartments || kr.alignedOkr) ? (
              <div className="mt-4 grid gap-3 rounded-[1.25rem] bg-white/70 p-3 sm:grid-cols-2">
                <div>
                  <p className="text-caption">数据提供部门</p>
                  <p className="mt-1 text-sm text-zinc-600">{kr.dataProvider || "未填写"}</p>
                </div>
                <div>
                  <p className="text-caption">数据接口人</p>
                  <p className="mt-1 text-sm text-zinc-600">{kr.interfacePerson || "未填写"}</p>
                </div>
                <div>
                  <p className="text-caption">对齐部门</p>
                  <p className="mt-1 text-sm text-zinc-600">{kr.alignedDepartments || "未填写"}</p>
                </div>
                <div>
                  <p className="text-caption">对齐 OKR</p>
                  <p className="mt-1 text-sm text-zinc-600">{kr.alignedOkr || "未填写"}</p>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <button
          className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-zinc-900"
          onClick={onOpen}
        >
          打开完整详情
          <ArrowUpRight className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}
