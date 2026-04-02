"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { Check, CircleUserRound, PencilLine, Plus, Save, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { AiKrSummaryCard } from "@/components/ai-kr-summary-card";
import type { KeyResult, Objective } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type KeyResultPatch = Partial<Omit<KeyResult, "id">>;

type KrDetailModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kr: KeyResult | null;
  objective: Objective | null;
  currentPerson: string;
  canEdit?: boolean;
  onSave: (patch: KeyResultPatch) => void;
};

type KrFormState = {
  title: string;
  weight: string;
  type: KeyResult["type"];
  target2026: string;
  progress: string;
  budgetStr: string;
  metricDefinition: string;
  marchProgressLabel: string;
  completion: string;
  dataProvider: string;
  interfacePerson: string;
  personnel: KeyResult["personnel"];
};

function buildForm(kr: KeyResult): KrFormState {
  return {
    title: kr.title,
    weight: String(kr.weight),
    type: kr.type,
    target2026: kr.target2026,
    progress: kr.progress,
    budgetStr: kr.budgetStr,
    metricDefinition: kr.metricDefinition,
    marchProgressLabel: kr.marchProgressLabel,
    completion: String(kr.completion),
    dataProvider: kr.dataProvider ?? "",
    interfacePerson: kr.interfacePerson ?? "",
    personnel: kr.personnel
  };
}

export function KrDetailModal({
  open,
  onOpenChange,
  kr,
  objective,
  currentPerson,
  canEdit = false,
  onSave
}: KrDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<KrFormState | null>(null);
  const currentRole = kr?.personnel.find((person) => person.name === currentPerson)?.role;

  useEffect(() => {
    if (kr) {
      setForm(buildForm(kr));
      setIsEditing(false);
    }
  }, [kr]);

  function handleQuickSave() {
    if (!form) {
      return;
    }

    onSave({
      progress: form.progress
    });
  }

  function handleFullSave() {
    if (!form) {
      return;
    }

    onSave({
      title: form.title.trim(),
      weight: Number(form.weight) || 0,
      type: form.type,
      target2026: form.target2026,
      progress: form.progress,
      budgetStr: form.budgetStr,
      metricDefinition: form.metricDefinition,
      marchProgressLabel: form.marchProgressLabel,
      completion: Number(form.completion) || 0,
      dataProvider: form.dataProvider.trim() || undefined,
      interfacePerson: form.interfacePerson.trim() || undefined,
      personnel: form.personnel.filter((person) => person.name.trim())
    });
    setIsEditing(false);
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && kr && objective && form ? (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 z-40 bg-zinc-950/20 backdrop-blur-md"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: "spring", stiffness: 240, damping: 30 }}
              />
            </Dialog.Overlay>

            <Dialog.Content asChild forceMount>
              <motion.div
                className="fixed left-1/2 top-1/2 z-50 w-[min(1040px,calc(100vw-2rem))]"
                initial={{ opacity: 0, x: "-50%", y: "calc(-50% + 28px)", scale: 0.96 }}
                animate={{ opacity: 1, x: "-50%", y: "-50%", scale: 1 }}
                exit={{ opacity: 0, x: "-50%", y: "calc(-50% + 22px)", scale: 0.96 }}
                transition={{ type: "spring", stiffness: 240, damping: 26 }}
              >
                <div className="glass-panel-strong max-h-[88vh] overflow-y-auto p-5 sm:p-7">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-3">
                      <p className="text-caption">{objective.title}</p>
                      <Dialog.Title className="max-w-3xl text-2xl font-semibold tracking-tight text-zinc-950">
                        {isEditing ? `编辑 ${kr.title}` : kr.title}
                      </Dialog.Title>
                      <div className="flex flex-wrap gap-2">
                        <Badge
                          className={
                            kr.type === "承诺型"
                              ? "border-emerald-200/70 bg-emerald-50 text-emerald-700"
                              : "border-violet-200/70 bg-violet-50 text-violet-700"
                          }
                        >
                          {kr.type}
                        </Badge>
                        {currentRole ? (
                          <Badge className="border-zinc-900/10 bg-zinc-900 text-white">当前角色：{currentRole}</Badge>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {canEdit ? (
                        <Button variant="secondary" size="sm" onClick={() => setIsEditing((current) => !current)}>
                          <PencilLine className="mr-2 h-4 w-4" />
                          {isEditing ? "返回查看" : "编辑 KR"}
                        </Button>
                      ) : null}
                      <Dialog.Close asChild>
                        <button className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/60 bg-white/75 text-zinc-500 transition hover:bg-white hover:text-zinc-950">
                          <X className="h-4 w-4" />
                        </button>
                      </Dialog.Close>
                    </div>
                  </div>

                  <div className="mt-7 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                    <div className="space-y-4">
                      <div className="rounded-[1.75rem] bg-zinc-50/85 p-5">
                        <p className="text-caption">{isEditing ? "KR 基础信息" : "2026 年目标值"}</p>
                        {isEditing && canEdit ? (
                          <div className="mt-3 space-y-4">
                            <Input
                              value={form.title}
                              onChange={(event) => setForm((current) => (current ? { ...current, title: event.target.value } : current))}
                            />
                            <div className="grid gap-4 sm:grid-cols-3">
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-700">KR 权重</label>
                                <Input
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  max="1"
                                  value={form.weight}
                                  onChange={(event) =>
                                    setForm((current) => (current ? { ...current, weight: event.target.value } : current))
                                  }
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-700">类型</label>
                                <select
                                  className="flex h-11 w-full rounded-2xl border border-white/60 bg-white/75 px-4 text-sm text-zinc-900 shadow-soft outline-none"
                                  value={form.type}
                                  onChange={(event) =>
                                    setForm((current) =>
                                      current
                                        ? { ...current, type: event.target.value as KeyResult["type"] }
                                        : current
                                    )
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
                                  value={form.completion}
                                  onChange={(event) =>
                                    setForm((current) =>
                                      current ? { ...current, completion: event.target.value } : current
                                    )
                                  }
                                />
                              </div>
                            </div>
                            <Textarea
                              value={form.target2026}
                              onChange={(event) =>
                                setForm((current) => (current ? { ...current, target2026: event.target.value } : current))
                              }
                            />
                          </div>
                        ) : (
                          <p className="mt-3 whitespace-pre-line text-sm leading-7 text-zinc-600">{kr.target2026}</p>
                        )}
                      </div>

                      <div className="rounded-[1.75rem] bg-zinc-50/85 p-5">
                        <p className="text-caption">详细指标定义</p>
                        {isEditing && canEdit ? (
                          <Textarea
                            className="mt-3"
                            value={form.metricDefinition}
                            onChange={(event) =>
                              setForm((current) =>
                                current ? { ...current, metricDefinition: event.target.value } : current
                              )
                            }
                          />
                        ) : (
                          <p className="mt-3 whitespace-pre-line text-sm leading-7 text-zinc-600">
                            {kr.metricDefinition}
                          </p>
                        )}
                      </div>

                      <div className="rounded-[1.75rem] bg-zinc-50/85 p-5">
                        <p className="text-caption">预算要求</p>
                        {isEditing && canEdit ? (
                          <Textarea
                            className="mt-3"
                            value={form.budgetStr}
                            onChange={(event) =>
                              setForm((current) => (current ? { ...current, budgetStr: event.target.value } : current))
                            }
                          />
                        ) : (
                          <p className="mt-3 whitespace-pre-line text-sm leading-7 text-zinc-600">{kr.budgetStr}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-[1.75rem] bg-zinc-50/85 p-5">
                        <p className="text-caption">责任人映射</p>
                        {isEditing && canEdit ? (
                          <div className="mt-4 space-y-3">
                            {form.personnel.map((person, index) => (
                              <div key={`${person.name}-${index}`} className="grid gap-3 sm:grid-cols-[1fr_140px_40px]">
                                <Input
                                  value={person.name}
                                  onChange={(event) =>
                                    setForm((current) =>
                                      current
                                        ? {
                                            ...current,
                                            personnel: current.personnel.map((item, itemIndex) =>
                                              itemIndex === index ? { ...item, name: event.target.value } : item
                                            )
                                          }
                                        : current
                                    )
                                  }
                                />
                                <select
                                  className="flex h-11 w-full rounded-2xl border border-white/60 bg-white/75 px-4 text-sm text-zinc-900 shadow-soft outline-none"
                                  value={person.role}
                                  onChange={(event) =>
                                    setForm((current) =>
                                      current
                                        ? {
                                            ...current,
                                            personnel: current.personnel.map((item, itemIndex) =>
                                              itemIndex === index
                                                ? {
                                                    ...item,
                                                    role: event.target.value as KeyResult["personnel"][number]["role"]
                                                  }
                                                : item
                                            )
                                          }
                                        : current
                                    )
                                  }
                                >
                                  <option value="组长">组长</option>
                                  <option value="组员">组员</option>
                                  <option value="业务对接">业务对接</option>
                                  <option value="公关组">公关组</option>
                                </select>
                                <button
                                  className="inline-flex h-11 w-10 items-center justify-center rounded-2xl border border-white/60 bg-white/75 text-zinc-500 transition hover:bg-white hover:text-zinc-950"
                                  onClick={() =>
                                    setForm((current) =>
                                      current
                                        ? {
                                            ...current,
                                            personnel: current.personnel.filter((_, itemIndex) => itemIndex !== index)
                                          }
                                        : current
                                    )
                                  }
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() =>
                                setForm((current) =>
                                  current
                                    ? {
                                        ...current,
                                        personnel: [...current.personnel, { name: "", role: "组员" }]
                                      }
                                    : current
                                )
                              }
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              增加责任人
                            </Button>
                          </div>
                        ) : (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {kr.personnel.map((person) => (
                              <Badge
                                key={`${kr.id}-${person.name}`}
                                className={
                                  person.name === currentPerson
                                    ? "border-zinc-900/10 bg-zinc-900 text-white"
                                    : "border-white/70 bg-white/70 text-zinc-700"
                                }
                              >
                                <CircleUserRound className="mr-1.5 h-3.5 w-3.5" />
                                {person.name} · {person.role}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="rounded-[1.75rem] bg-zinc-50/85 p-5">
                        <p className="text-caption">{isEditing ? "进度区标题与内容" : kr.marchProgressLabel}</p>
                        {isEditing && canEdit ? (
                          <div className="mt-3 space-y-4">
                            <Input
                              value={form.marchProgressLabel}
                              onChange={(event) =>
                                setForm((current) =>
                                  current ? { ...current, marchProgressLabel: event.target.value } : current
                                )
                              }
                            />
                            <Textarea
                              value={form.progress}
                              onChange={(event) =>
                                setForm((current) => (current ? { ...current, progress: event.target.value } : current))
                              }
                            />
                          </div>
                        ) : (
                          <p className="mt-3 whitespace-pre-line text-sm leading-7 text-zinc-600">{kr.progress}</p>
                        )}
                      </div>

                      <div className="rounded-[1.75rem] bg-zinc-50/85 p-5">
                        <p className="text-caption">{isEditing && canEdit ? "补充信息" : canEdit ? "快捷更新" : "当前说明"}</p>
                        {isEditing && canEdit ? (
                          <div className="mt-4 space-y-4">
                            <Input
                              placeholder="数据提供部门"
                              value={form.dataProvider}
                              onChange={(event) =>
                                setForm((current) =>
                                  current ? { ...current, dataProvider: event.target.value } : current
                                )
                              }
                            />
                            <Input
                              placeholder="数据接口人"
                              value={form.interfacePerson}
                              onChange={(event) =>
                                setForm((current) =>
                                  current ? { ...current, interfacePerson: event.target.value } : current
                                )
                              }
                            />
                            <Button className="w-full" onClick={handleFullSave}>
                              <Save className="mr-2 h-4 w-4" />
                              保存 KR 编辑
                            </Button>
                          </div>
                        ) : canEdit ? (
                          <div className="mt-4 space-y-4">
                            <Textarea
                              placeholder="填写本次阶段进展、风险、需要协同的事项。这里只做前端保存，会记录在当前浏览器。"
                              value={form.progress}
                              onChange={(event) =>
                                setForm((current) => (current ? { ...current, progress: event.target.value } : current))
                              }
                            />
                            <Button className="w-full" onClick={handleQuickSave}>
                              <Check className="mr-2 h-4 w-4" />
                              保存当前进度
                            </Button>
                          </div>
                        ) : (
                          <p className="mt-4 text-xs leading-6 tracking-[0.02em] text-zinc-400">
                            当前为查看模式，切换到授权成员后可编辑。
                          </p>
                        )}
                      </div>

                      <AiKrSummaryCard objective={objective} kr={kr} />
                    </div>
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
