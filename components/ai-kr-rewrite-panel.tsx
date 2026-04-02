"use client";

import { Sparkles } from "lucide-react";
import { AiKrRewriteWorkspace } from "@/components/ai-kr-rewrite-workspace";

export function AiKrRewritePanel() {
  return (
    <section className="mx-auto mt-4 max-w-[1520px] px-4 sm:px-6 lg:px-10">
      <div className="glass-panel-strong p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-caption">AI Import</p>
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">AI 粘贴导入区</h2>
            <p className="max-w-3xl text-sm leading-6 text-zinc-500">
              直接粘贴一段新的 KR 文本，系统会自动识别它属于哪个 O / KR，并给出拟覆盖结果。只有当识别足够确定时，才允许你一键覆盖原数据。
            </p>
          </div>
          <div className="hidden h-12 w-12 items-center justify-center rounded-2xl bg-zinc-950 text-white shadow-soft sm:flex">
            <Sparkles className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-6">
          <AiKrRewriteWorkspace inputMinHeightClassName="min-h-[220px]" />
        </div>
      </div>
    </section>
  );
}
