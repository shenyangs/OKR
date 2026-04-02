"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { AiKrRewriteModal } from "@/components/ai-kr-rewrite-modal";
import { KrDetailModal } from "@/components/kr-detail-modal";
import { OkrNavbar } from "@/components/okr-navbar";
import { PersonalWorkspace } from "@/components/personal-workspace";
import { useIdentity } from "@/components/identity-context";
import { useOkrData } from "@/components/okr-data-context";
import type { KeyResult, Objective } from "@/lib/data";
import { canEditOkr } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function OkrWorkspacePage() {
  const { currentPerson } = useIdentity();
  const { objectives, updateKeyResult, deleteKeyResult } = useOkrData();
  const [selectedKr, setSelectedKr] = React.useState<KeyResult | null>(null);
  const [selectedObjective, setSelectedObjective] = React.useState<Objective | null>(null);

  const personalTaskCount = objectives.reduce(
    (total, objective) =>
      total + objective.krs.filter((kr) => kr.personnel.some((person) => person.name === currentPerson)).length,
    0
  );
  const canEdit = canEditOkr(currentPerson);

  return (
    <main className="pb-10">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-grid-fade bg-[size:36px_36px] opacity-[0.18]" />
      <OkrNavbar personalTaskCount={personalTaskCount} />

      <section className="mx-auto mt-4 flex max-w-[1520px] flex-col gap-4 px-4 sm:px-6 lg:px-10">
        <div className="glass-panel flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-caption">Personal Workspace</p>
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">{currentPerson} 的工作台</h2>
            <p className="text-sm text-zinc-500">这里只保留和当前身份直接相关的 KR，适合日常推进和责任确认。</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {canEdit ? <AiKrRewriteModal buttonLabel="AI 识别 KR" /> : null}
            <Button asChild variant="secondary">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                返回部门大盘
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <motion.section
        className="mx-auto mt-4 max-w-[1520px] px-4 sm:px-6 lg:px-10"
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 180, damping: 24 }}
      >
        <PersonalWorkspace
          currentPerson={currentPerson}
          objectives={objectives}
          canEdit={canEdit}
          onDeleteKr={(kr, objective) => {
            if (window.confirm(`确认删除 ${kr.title} 吗？`)) {
              deleteKeyResult(objective.id, kr.id);
            }
          }}
          onOpenKr={(kr, objective) => {
            setSelectedKr(kr);
            setSelectedObjective(objective);
          }}
        />
      </motion.section>

      <KrDetailModal
        open={Boolean(selectedKr && selectedObjective)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedKr(null);
            setSelectedObjective(null);
          }
        }}
        kr={selectedKr}
        objective={selectedObjective}
        currentPerson={currentPerson}
        canEdit={canEdit}
        onSave={(patch) => {
          if (selectedObjective && selectedKr) {
            updateKeyResult(selectedObjective.id, selectedKr.id, patch);
            setSelectedKr((current) => (current ? { ...current, ...patch } : current));
          }
        }}
      />
    </main>
  );
}
