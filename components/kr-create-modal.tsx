"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Save, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { AiKrDraftResult } from "@/lib/ai-okr";
import { postAiJson } from "@/lib/ai-client";
import { buildFallbackKrDraft } from "@/lib/ai-fallbacks";
import type { KeyResult, Objective, Personnel } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type KrCreateModalProps = {
  open: boolean;
  objective: Objective | null;
  onOpenChange: (open: boolean) => void;
  onSave: (payload: Omit<KeyResult, "id">) => void;
};

type KrFormState = Omit<KeyResult, "id">;

const emptyKr = (): KrFormState => ({
  title: "",
  weight: 0.1,
  type: "承诺型",
  target2026: "",
  progress: "",
  budgetStr: "",
  personnel: [],
  metricDefinition: "",
  marchProgressLabel: "3 月进度",
  completion: 0,
  dataProvider: "",
  interfacePerson: "",
  alignedDepartments: "",
  alignedOkr: ""
});

export function KrCreateModal({ open, objective, onOpenChange, onSave }: KrCreateModalProps) {
  const [form, setForm] = useState<KrFormState>(emptyKr());
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiDraft, setAiDraft] = useState<AiKrDraftResult | null>(null);
  const [fallbackDraft, setFallbackDraft] = useState<AiKrDraftResult | null>(null);
  const [draftSource, setDraftSource] = useState<"基础版" | "AI 优化版" | "">("");

  useEffect(() => {
    if (open) {
      setForm(emptyKr());
      setAiInput("");
      setAiLoading(false);
      setAiError("");
      setAiDraft(null);
      setFallbackDraft(null);
      setDraftSource("");
    }
  }, [open]);

  function updatePersonnel(index: number, patch: Partial<Personnel>) {
    setForm((current) => ({
      ...current,
      personnel: current.personnel.map((person, personIndex) =>
        personIndex === index ? { ...person, ...patch } : person
      )
    }));
  }

  function handleSubmit() {
    onSave({
      ...form,
      title: form.title.trim(),
      target2026: form.target2026.trim(),
      progress: form.progress.trim(),
      budgetStr: form.budgetStr.trim(),
      metricDefinition: form.metricDefinition.trim(),
      personnel: form.personnel.filter((person) => person.name.trim()),
      dataProvider: form.dataProvider?.trim() || undefined,
      interfacePerson: form.interfacePerson?.trim() || undefined,
      alignedDepartments: form.alignedDepartments?.trim() || undefined,
      alignedOkr: form.alignedOkr?.trim() || undefined
    });
    onOpenChange(false);
  }

  async function handleGenerateDraft() {
    const rawText = aiInput.trim();

    if (!rawText || !objective) {
      setAiError("先输入你想新增的 KR 描述。");
      return;
    }

    const fallback = buildFallbackKrDraft(rawText, objective);
    setFallbackDraft(fallback);
    setAiDraft(fallback);
    setDraftSource("基础版");
    setAiLoading(true);
    setAiError("");

    try {
      const payload = await postAiJson<AiKrDraftResult>({
        url: "/api/ai-kr-draft",
        body: {
          rawText,
          objective
        },
        fallbackMessage: "AI 生成 KR 草稿失败"
      });

      setAiDraft(payload);
      setDraftSource("AI 优化版");
    } catch (requestError) {
      setAiError(
        requestError instanceof Error ? `${requestError.message}，当前先显示基础版。` : "AI 生成 KR 草稿失败，当前先显示基础版。"
      );
    } finally {
      setAiLoading(false);
    }
  }

  function handleApplyDraft() {
    if (!aiDraft) {
      return;
    }

    const draft = aiDraft.draft;

    setForm((current) => ({
      ...current,
      title: draft.title ?? current.title,
      type: draft.type ?? current.type,
      target2026: draft.target2026 ?? current.target2026,
      progress: draft.progress ?? current.progress,
      budgetStr: draft.budgetStr ?? current.budgetStr,
      personnel: draft.personnel ?? current.personnel,
      metricDefinition: draft.metricDefinition ?? current.metricDefinition,
      marchProgressLabel: draft.marchProgressLabel ?? current.marchProgressLabel,
      completion: draft.completion ?? current.completion,
      dataProvider: draft.dataProvider ?? current.dataProvider,
      interfacePerson: draft.interfacePerson ?? current.interfacePerson,
      alignedDepartments: draft.alignedDepartments ?? current.alignedDepartments,
      alignedOkr: draft.alignedOkr ?? current.alignedOkr
    }));
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && objective ? (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 z-40 bg-zinc-950/20 backdrop-blur-md"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount>
              <motion.div
                className="fixed left-1/2 top-1/2 z-50 w-[min(960px,calc(100vw-2rem))]"
                initial={{ opacity: 0, x: "-50%", y: "calc(-50% + 20px)", scale: 0.98 }}
                animate={{ opacity: 1, x: "-50%", y: "-50%", scale: 1 }}
                exit={{ opacity: 0, x: "-50%", y: "calc(-50% + 16px)", scale: 0.98 }}
                transition={{ type: "spring", stiffness: 260, damping: 26 }}
              >
                <div className="glass-panel-strong max-h-[88vh] overflow-y-auto p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <p className="text-caption">Create Key Result</p>
                      <Dialog.Title className="text-2xl font-semibold tracking-tight text-zinc-950">
                        为当前 O 新增 KR
                      </Dialog.Title>
                      <p className="text-sm text-zinc-500">{objective.title}</p>
                    </div>
                    <Dialog.Close asChild>
                      <button className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/60 bg-white/75 text-zinc-500 transition hover:bg-white hover:text-zinc-950">
                        <X className="h-4 w-4" />
                      </button>
                    </Dialog.Close>
                  </div>

                  <div className="mt-6 space-y-5">
                    <div className="rounded-[1.75rem] bg-zinc-50/85 p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-2">
                          <p className="text-caption">AI Draft</p>
                          <h3 className="text-lg font-semibold tracking-tight text-zinc-950">AI 新建 KR 助手</h3>
                          <p className="max-w-2xl text-sm leading-6 text-zinc-500">
                            写一句你想做的事、目标或场景，AI 会先帮你整理成一版 KR 草稿，再由你确认是否填入表单。
                          </p>
                        </div>
                        <Button variant="secondary" onClick={handleGenerateDraft} disabled={aiLoading}>
                          <Sparkles className="mr-2 h-4 w-4" />
                          {aiLoading ? "生成中..." : "AI 生成草稿"}
                        </Button>
                      </div>

                      <Textarea
                        className="mt-4"
                        placeholder="例如：围绕教育行业继续做 365 标杆案例，全年沉淀 10 个案例，并联动市场和公关做分层传播。"
                        value={aiInput}
                        onChange={(event) => setAiInput(event.target.value)}
                      />

                      {aiError ? (
                        <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700">{aiError}</p>
                      ) : null}

                      {aiDraft ? (
                        <div className="mt-4 space-y-4">
                          <p className="text-xs leading-6 text-zinc-400">
                            当前显示：{draftSource || "基础版"}
                            {aiLoading ? "，AI 还在继续优化中..." : draftSource === "AI 优化版" ? "，已完成替换。" : ""}
                          </p>
                          {fallbackDraft && draftSource === "AI 优化版" ? (
                            <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/80 p-4">
                              <p className="text-sm font-medium text-emerald-800">AI 优化差异</p>
                              <div className="mt-3 space-y-3">
                                {buildDraftDiffs(fallbackDraft, aiDraft).map((item) => (
                                  <div key={item.label} className="rounded-2xl bg-white/80 p-3">
                                    <p className="text-xs text-emerald-700">{item.label}</p>
                                    <p className="mt-1 text-sm leading-6 text-zinc-500">基础版：{item.before}</p>
                                    <p className="mt-1 text-sm leading-6 text-zinc-900">AI 版：{item.after}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : null}
                          <div className="rounded-2xl bg-white/80 p-4">
                            <p className="text-sm font-medium text-zinc-900">AI 整理说明</p>
                            <p className="mt-2 text-sm leading-6 text-zinc-600">{aiDraft.reason}</p>
                          </div>

                          <div className="rounded-2xl bg-white/80 p-4">
                            <p className="text-sm font-medium text-zinc-900">
                              已整理字段 {Object.keys(aiDraft.draft).length} 项
                            </p>
                            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                              {Object.entries(aiDraft.draft).map(([key, value]) => (
                                <div key={key} className="rounded-2xl bg-zinc-50 px-3 py-3">
                                  <p className="text-xs text-zinc-400">{formatDraftLabel(key)}</p>
                                  <p className="mt-1 whitespace-pre-line text-sm leading-6 text-zinc-700">
                                    {formatDraftValue(value)}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>

                          <Button onClick={handleApplyDraft}>
                            <Sparkles className="mr-2 h-4 w-4" />
                            一键填入表单
                          </Button>
                        </div>
                      ) : null}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="space-y-2 sm:col-span-3">
                        <label className="text-sm font-medium text-zinc-700">KR 标题</label>
                        <Input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-700">KR 权重</label>
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          max="1"
                          value={String(form.weight)}
                          onChange={(event) => setForm((current) => ({ ...current, weight: Number(event.target.value) || 0 }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-700">类型</label>
                        <select
                          className="flex h-11 w-full rounded-2xl border border-white/60 bg-white/75 px-4 text-sm text-zinc-900 shadow-soft outline-none"
                          value={form.type}
                          onChange={(event) =>
                            setForm((current) => ({ ...current, type: event.target.value as KeyResult["type"] }))
                          }
                        >
                          <option value="承诺型">承诺型</option>
                          <option value="探索型">探索型</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-700">完成度 %</label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={String(form.completion)}
                          onChange={(event) =>
                            setForm((current) => ({ ...current, completion: Number(event.target.value) || 0 }))
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-700">2026 年目标值</label>
                      <Textarea value={form.target2026} onChange={(event) => setForm((current) => ({ ...current, target2026: event.target.value }))} />
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-700">预算和资源</label>
                        <Textarea value={form.budgetStr} onChange={(event) => setForm((current) => ({ ...current, budgetStr: event.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-700">详细指标定义</label>
                        <Textarea value={form.metricDefinition} onChange={(event) => setForm((current) => ({ ...current, metricDefinition: event.target.value }))} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-700">3 月进度</label>
                      <Textarea value={form.progress} onChange={(event) => setForm((current) => ({ ...current, progress: event.target.value }))} />
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-700">数据提供部门</label>
                        <Input value={form.dataProvider} onChange={(event) => setForm((current) => ({ ...current, dataProvider: event.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-700">数据接口人</label>
                        <Input value={form.interfacePerson} onChange={(event) => setForm((current) => ({ ...current, interfacePerson: event.target.value }))} />
                      </div>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-700">协同部门</label>
                        <Input
                          value={form.alignedDepartments ?? ""}
                          onChange={(event) => setForm((current) => ({ ...current, alignedDepartments: event.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-700">对齐 OKR</label>
                        <Input
                          value={form.alignedOkr ?? ""}
                          onChange={(event) => setForm((current) => ({ ...current, alignedOkr: event.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-zinc-700">责任人</label>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() =>
                            setForm((current) => ({
                              ...current,
                              personnel: [...current.personnel, { name: "", role: "组员" }]
                            }))
                          }
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          增加责任人
                        </Button>
                      </div>
                      <div className="space-y-3">
                        {form.personnel.map((person, index) => (
                          <div key={`${person.name}-${index}`} className="grid gap-3 sm:grid-cols-[1fr_140px_40px]">
                            <Input value={person.name} onChange={(event) => updatePersonnel(index, { name: event.target.value })} />
                            <select
                              className="flex h-11 w-full rounded-2xl border border-white/60 bg-white/75 px-4 text-sm text-zinc-900 shadow-soft outline-none"
                              value={person.role}
                              onChange={(event) => updatePersonnel(index, { role: event.target.value as Personnel["role"] })}
                            >
                              <option value="组长">组长</option>
                              <option value="组员">组员</option>
                              <option value="业务对接">业务对接</option>
                              <option value="公关组">公关组</option>
                            </select>
                            <button
                              className="inline-flex h-11 w-10 items-center justify-center rounded-2xl border border-white/60 bg-white/75 text-zinc-500 transition hover:bg-white hover:text-zinc-950"
                              onClick={() =>
                                setForm((current) => ({
                                  ...current,
                                  personnel: current.personnel.filter((_, personIndex) => personIndex !== index)
                                }))
                              }
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <Button onClick={handleSubmit}>
                      <Save className="mr-2 h-4 w-4" />
                      创建 KR
                    </Button>
                  </div>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        ) : null}
      </AnimatePresence>
    </Dialog.Root>
  );
}

function formatDraftLabel(key: string) {
  const labelMap: Record<string, string> = {
    title: "KR 标题",
    type: "KR 类型",
    target2026: "2026 年目标值",
    progress: "当前进度",
    budgetStr: "预算和资源",
    personnel: "责任人",
    metricDefinition: "指标定义",
    marchProgressLabel: "进度区标题",
    completion: "完成度",
    dataProvider: "数据提供部门",
    interfacePerson: "数据接口人",
    alignedDepartments: "协同部门",
    alignedOkr: "对齐 OKR"
  };

  return labelMap[key] ?? key;
}

function formatDraftValue(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (!item || typeof item !== "object") {
          return "";
        }

        const name = "name" in item && typeof item.name === "string" ? item.name : "";
        const role = "role" in item && typeof item.role === "string" ? item.role : "";
        return [name, role].filter(Boolean).join(" · ");
      })
      .filter(Boolean)
      .join("\n");
  }

  if (typeof value === "number") {
    return String(value);
  }

  if (typeof value === "string") {
    return value;
  }

  return "待补充";
}

function buildDraftDiffs(before: AiKrDraftResult, after: AiKrDraftResult) {
  const fields = [
    "title",
    "type",
    "target2026",
    "progress",
    "budgetStr",
    "metricDefinition",
    "marchProgressLabel",
    "completion",
    "dataProvider",
    "interfacePerson",
    "alignedDepartments",
    "alignedOkr",
    "personnel"
  ] as const;

  return fields
    .map((field) => {
      const beforeValue = formatDraftValue(before.draft[field]);
      const afterValue = formatDraftValue(after.draft[field]);

      if (beforeValue === afterValue) {
        return null;
      }

      return {
        label: formatDraftLabel(field),
        before: beforeValue,
        after: afterValue
      };
    })
    .filter((item): item is { label: string; before: string; after: string } => Boolean(item));
}
