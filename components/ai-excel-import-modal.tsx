"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Check, FileSpreadsheet, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { postAiJson } from "@/lib/ai-client";
import type { AiExcelImportResult } from "@/lib/ai-okr";
import type { Objective } from "@/lib/data";
import { readExcelPreview, type ExcelSheetPreview } from "@/lib/excel-import";

type AiExcelImportModalProps = {
  open: boolean;
  file: File | null;
  onOpenChange: (open: boolean) => void;
  onApply: (objectives: Objective[]) => void;
};

export function AiExcelImportModal({ open, file, onOpenChange, onApply }: AiExcelImportModalProps) {
  const [preview, setPreview] = useState<ExcelSheetPreview[]>([]);
  const [result, setResult] = useState<AiExcelImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !file) {
      setPreview([]);
      setResult(null);
      setLoading(false);
      setError("");
      return;
    }

    let cancelled = false;
    const currentFile = file;

    async function run() {
      setLoading(true);
      setError("");
      setResult(null);

      try {
        const nextPreview = await readExcelPreview(currentFile);
        if (cancelled) {
          return;
        }

        setPreview(nextPreview);

        const payload = await postAiJson<AiExcelImportResult>({
          url: "/api/ai-excel-import",
          body: {
            fileName: currentFile.name,
            sheets: nextPreview
          },
          fallbackMessage: "AI 智能导入失败"
        });

        if (cancelled) {
          return;
        }

        setResult(payload);
      } catch (requestError) {
        if (cancelled) {
          return;
        }

        setError(requestError instanceof Error ? requestError.message : "AI 智能导入失败");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [file, open]);

  const totalKrCount = result?.objectives.reduce((total, objective) => total + objective.krs.length, 0) ?? 0;

  function handleApply() {
    if (!result?.objectives.length) {
      return;
    }

    if (!window.confirm("这会用 AI 整理结果替换当前页面里的全部 OKR 数据。确认继续吗？")) {
      return;
    }

    onApply(result.objectives);
    onOpenChange(false);
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open ? (
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
                className="fixed left-1/2 top-1/2 z-50 w-[min(1100px,calc(100vw-2rem))]"
                initial={{ opacity: 0, x: "-50%", y: "calc(-50% + 20px)", scale: 0.98 }}
                animate={{ opacity: 1, x: "-50%", y: "-50%", scale: 1 }}
                exit={{ opacity: 0, x: "-50%", y: "calc(-50% + 16px)", scale: 0.98 }}
                transition={{ type: "spring", stiffness: 260, damping: 26 }}
              >
                <div className="glass-panel-strong max-h-[88vh] overflow-y-auto p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <p className="text-caption">AI Excel Import</p>
                      <Dialog.Title className="text-2xl font-semibold tracking-tight text-zinc-950">
                        AI 智能导入 Excel
                      </Dialog.Title>
                      <p className="text-sm leading-6 text-zinc-500">
                        适合表头不标准、列顺序不固定的 Excel。系统会先读一版表格，再用 AI 整理成 O / KR。
                      </p>
                      {file ? <p className="text-sm text-zinc-400">当前文件：{file.name}</p> : null}
                    </div>
                    <Dialog.Close asChild>
                      <button className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/60 bg-white/75 text-zinc-500 transition hover:bg-white hover:text-zinc-950">
                        <X className="h-4 w-4" />
                      </button>
                    </Dialog.Close>
                  </div>

                  <div className="mt-6 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
                    <div className="space-y-4">
                      <div className="rounded-[1.75rem] bg-zinc-50/85 p-5">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 rounded-2xl bg-zinc-950 p-2 text-white">
                            <FileSpreadsheet className="h-4 w-4" />
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-zinc-900">识别方式</p>
                            <p className="text-sm leading-6 text-zinc-500">
                              这条链路比标准模板导入更灵活，但更慢，也可能有少量字段需要你手动复核。
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-[1.75rem] bg-zinc-50/85 p-5">
                        <div className="flex items-center gap-2 text-zinc-900">
                          <Sparkles className="h-4 w-4" />
                          <p className="text-sm font-medium">Excel 预览</p>
                        </div>
                        {preview.length ? (
                          <div className="mt-4 space-y-4">
                            {preview.map((sheet) => (
                              <div key={sheet.sheetName} className="rounded-2xl bg-white/80 p-4">
                                <p className="text-sm font-medium text-zinc-900">{sheet.sheetName}</p>
                                <p className="mt-1 text-xs text-zinc-400">
                                  已读取 {sheet.rows.length} 行预览，AI 会基于这些内容做结构化整理。
                                </p>
                                <div className="mt-3 space-y-2">
                                  {sheet.rows.slice(0, 6).map((row, rowIndex) => (
                                    <div key={`${sheet.sheetName}-${rowIndex}`} className="rounded-xl bg-zinc-50 px-3 py-2">
                                      <p className="line-clamp-2 text-xs leading-5 text-zinc-600">
                                        {row.filter(Boolean).join(" | ") || "空行"}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-4 text-sm leading-6 text-zinc-500">
                            {loading ? "正在读取 Excel 预览..." : "选择文件后会先在这里展示预览。"}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-[1.75rem] bg-zinc-50/85 p-5">
                        <div className="flex items-center gap-2 text-zinc-900">
                          <Check className="h-4 w-4" />
                          <p className="text-sm font-medium">AI 整理结果</p>
                        </div>

                        {loading ? (
                          <p className="mt-4 rounded-2xl bg-white/80 px-4 py-4 text-sm leading-6 text-zinc-500">
                            AI 正在分析 Excel 结构，这一步通常会比标准模板导入更慢一些。
                          </p>
                        ) : null}

                        {error ? (
                          <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-4 text-sm leading-6 text-rose-700">
                            <div className="flex items-start gap-2">
                              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                              <p>{error}</p>
                            </div>
                          </div>
                        ) : null}

                        {result ? (
                          <div className="mt-4 space-y-4">
                            <div className="rounded-2xl bg-white/80 p-4">
                              <p className="text-sm font-medium text-zinc-900">AI 总结</p>
                              <p className="mt-2 text-sm leading-6 text-zinc-600">{result.summary}</p>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                              <div className="rounded-2xl bg-white/80 p-4">
                                <p className="text-caption">Objective</p>
                                <p className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">
                                  {result.objectives.length} 个
                                </p>
                              </div>
                              <div className="rounded-2xl bg-white/80 p-4">
                                <p className="text-caption">KR</p>
                                <p className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">{totalKrCount} 项</p>
                              </div>
                            </div>

                            {result.warnings.length ? (
                              <div className="rounded-2xl border border-amber-200/80 bg-amber-50/80 p-4">
                                <p className="text-sm font-medium text-amber-800">需要你留意</p>
                                <div className="mt-3 space-y-2">
                                  {result.warnings.map((item) => (
                                    <p key={item} className="text-sm leading-6 text-amber-700">
                                      {item}
                                    </p>
                                  ))}
                                </div>
                              </div>
                            ) : null}

                            <div className="space-y-3">
                              {result.objectives.map((objective) => (
                                <div key={objective.id} className="rounded-2xl bg-white/80 p-4">
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <p className="text-sm font-medium text-zinc-900">{objective.title}</p>
                                    <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-500">
                                      {objective.krs.length} 项 KR
                                    </span>
                                  </div>
                                  <p className="mt-2 text-sm leading-6 text-zinc-500">
                                    {objective.department || "未识别到部门"}
                                    {objective.owner ? ` · ${objective.owner}` : ""}
                                  </p>
                                  <div className="mt-3 space-y-2">
                                    {objective.krs.slice(0, 4).map((kr) => (
                                      <div key={kr.id} className="rounded-xl bg-zinc-50 px-3 py-2">
                                        <p className="text-sm text-zinc-700">{kr.title}</p>
                                      </div>
                                    ))}
                                    {objective.krs.length > 4 ? (
                                      <p className="text-xs text-zinc-400">还有 {objective.krs.length - 4} 项 KR 未展开</p>
                                    ) : null}
                                  </div>
                                </div>
                              ))}
                            </div>

                            <div className="flex flex-wrap gap-3">
                              <Button onClick={handleApply}>
                                <Sparkles className="mr-2 h-4 w-4" />
                                用这版结果替换当前数据
                              </Button>
                              <p className="self-center text-xs leading-5 text-zinc-400">
                                替换后会直接覆盖当前页面里的 OKR 数据。
                              </p>
                            </div>
                          </div>
                        ) : null}
                      </div>
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
