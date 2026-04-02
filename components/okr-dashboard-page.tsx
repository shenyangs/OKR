"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, FileUp, Plus, RotateCcw } from "lucide-react";
import { AiKrRewritePanel } from "@/components/ai-kr-rewrite-panel";
import { AiRiskRadar } from "@/components/ai-risk-radar";
import { DepartmentView } from "@/components/department-view";
import { KrCreateModal } from "@/components/kr-create-modal";
import { KrDetailModal } from "@/components/kr-detail-modal";
import { ObjectiveEditModal } from "@/components/objective-edit-modal";
import { OkrNavbar } from "@/components/okr-navbar";
import { SummaryStrip } from "@/components/summary-strip";
import { useIdentity } from "@/components/identity-context";
import { useOkrData } from "@/components/okr-data-context";
import type { KeyResult, Objective } from "@/lib/data";
import { parseObjectivesFromExcel } from "@/lib/excel-import";
import { canEditOkr } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function OkrDashboardPage() {
  const { currentPerson } = useIdentity();
  const {
    objectives,
    updateObjective,
    updateKeyResult,
    addObjective,
    addKeyResult,
    deleteKeyResult,
    replaceObjectives,
    resetObjectives
  } = useOkrData();
  const [selectedKr, setSelectedKr] = React.useState<KeyResult | null>(null);
  const [selectedObjective, setSelectedObjective] = React.useState<Objective | null>(null);
  const [editingObjective, setEditingObjective] = React.useState<Objective | null>(null);
  const [creatingObjective, setCreatingObjective] = React.useState(false);
  const [creatingKrFor, setCreatingKrFor] = React.useState<Objective | null>(null);
  const [importing, setImporting] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const personalTaskCount = objectives.reduce(
    (total, objective) =>
      total + objective.krs.filter((kr) => kr.personnel.some((person) => person.name === currentPerson)).length,
    0
  );
  const canEdit = canEditOkr(currentPerson);

  function handleOpenKr(kr: KeyResult, objective: Objective) {
    setSelectedKr(kr);
    setSelectedObjective(objective);
  }

  async function handleImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      setImporting(true);
      const nextObjectives = await parseObjectivesFromExcel(file);
      replaceObjectives(nextObjectives);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Excel 导入失败");
    } finally {
      setImporting(false);
      event.target.value = "";
    }
  }

  return (
    <main className="pb-10">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-grid-fade bg-[size:36px_36px] opacity-[0.18]" />
      <OkrNavbar personalTaskCount={personalTaskCount} />
      <SummaryStrip objectives={objectives} currentPerson={currentPerson} personalTaskCount={personalTaskCount} />
      <AiRiskRadar objectives={objectives} />

      <section className="mx-auto mt-4 flex max-w-[1520px] flex-col gap-4 px-4 sm:px-6 lg:px-10">
        <div className="glass-panel flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-caption">Dashboard First</p>
            <p className="text-sm text-zinc-500">
              首页现在只突出部门大盘，并且默认把 O 与 KR 细节都展开。个人视角仍然保留在独立页面。
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="secondary">
              <Link href="/workspace">
                打开我的工作台
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            {canEdit ? (
              <>
                <Button variant="secondary" onClick={() => setCreatingObjective(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  新增 O
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    fileInputRef.current?.click();
                  }}
                  disabled={importing}
                >
                  <FileUp className="mr-2 h-4 w-4" />
                  {importing ? "导入中..." : "Excel 导入"}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={handleImport}
                />
              </>
            ) : (
              <p className="self-center px-1 text-sm text-zinc-400">当前为查看模式</p>
            )}
            {canEdit ? (
              <Button variant="ghost" onClick={resetObjectives}>
                <RotateCcw className="mr-2 h-4 w-4" />
                恢复原始数据
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      <motion.section
        className="mx-auto mt-4 max-w-[1520px] px-4 sm:px-6 lg:px-10"
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 180, damping: 24 }}
      >
        <DepartmentView
          objectives={objectives}
          currentPerson={currentPerson}
          canEdit={canEdit}
          onOpenKr={handleOpenKr}
          onEditObjective={setEditingObjective}
          onAddKr={setCreatingKrFor}
          onDeleteKr={(objective, kr) => {
            if (window.confirm(`确认删除 ${kr.title} 吗？`)) {
              deleteKeyResult(objective.id, kr.id);
            }
          }}
        />
      </motion.section>

      {canEdit ? <AiKrRewritePanel /> : null}

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

      <ObjectiveEditModal
        open={creatingObjective || Boolean(editingObjective)}
        objective={editingObjective}
        mode={editingObjective ? "edit" : "create"}
        onOpenChange={(open) => {
          if (!open) {
            setEditingObjective(null);
            setCreatingObjective(false);
          }
        }}
        onSave={(payload) => {
          if (editingObjective) {
            updateObjective(editingObjective.id, payload);
            setEditingObjective(null);
          } else {
            addObjective({
              ...payload,
              krs: []
            });
            setCreatingObjective(false);
          }
        }}
      />

      <KrCreateModal
        open={Boolean(creatingKrFor)}
        objective={creatingKrFor}
        onOpenChange={(open) => {
          if (!open) {
            setCreatingKrFor(null);
          }
        }}
        onSave={(payload) => {
          if (creatingKrFor) {
            addKeyResult(creatingKrFor.id, payload);
            setCreatingKrFor(null);
          }
        }}
      />
    </main>
  );
}
