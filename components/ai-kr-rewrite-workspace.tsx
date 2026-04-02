"use client";

import { Bot, ChevronDown, FileText, FileUp, History, Plus, RotateCcw, ShieldAlert, Wand2 } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useOkrData } from "@/components/okr-data-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { postAiJson } from "@/lib/ai-client";
import type { AiKrDraftPatch } from "@/lib/ai-okr";
import {
  type AiRewriteApplyMode,
  AI_REWRITE_FIELD_LABELS,
  AI_REWRITE_MIN_CONFIDENCE,
  type AiRewriteRequest,
  type AiRewriteResult
} from "@/lib/ai-kr-rewrite";

type AiKrRewriteWorkspaceProps = {
  inputMinHeightClassName?: string;
  onApplied?: () => void;
};

export function AiKrRewriteWorkspace({
  inputMinHeightClassName = "min-h-[280px]",
  onApplied
}: AiKrRewriteWorkspaceProps) {
  const { objectives, aiRewriteLogs, applyAiRewrite, undoAiRewrite, addKeyResult } = useOkrData();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [rawText, setRawText] = useState("");
  const [applyMode, setApplyMode] = useState<AiRewriteApplyMode>("all_fields");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [result, setResult] = useState<AiRewriteResult | null>(null);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [importedFileName, setImportedFileName] = useState("");
  const [showImportedPreview, setShowImportedPreview] = useState(false);

  const targetObjective = useMemo(
    () => objectives.find((objective) => objective.id === result?.objectiveId) ?? null,
    [objectives, result]
  );

  const targetKr = useMemo(
    () => targetObjective?.krs.find((kr) => kr.id === result?.krId) ?? null,
    [targetObjective, result]
  );

  const suggestedObjective = useMemo(
    () => objectives.find((objective) => objective.id === result?.createSuggestion?.objectiveId) ?? null,
    [objectives, result]
  );

  const patchEntries = useMemo(() => {
    if (!result) {
      return [];
    }

    return Object.entries(getEffectivePatch(result.patch, applyMode)) as Array<[keyof typeof result.patch, unknown]>;
  }, [applyMode, result]);

  const effectivePatch = useMemo(
    () => (result ? getEffectivePatch(result.patch, applyMode) : {}),
    [applyMode, result]
  );

  const createDraftEntries = useMemo(() => {
    if (!result?.createSuggestion) {
      return [];
    }

    return Object.entries(result.createSuggestion.draft) as Array<
      [keyof typeof result.createSuggestion.draft, unknown]
    >;
  }, [result]);

  const isLowConfidence = Boolean(
    result?.matched && result.confidence < AI_REWRITE_MIN_CONFIDENCE
  );

  const canApply = Boolean(
    result?.matched && targetKr && patchEntries.length && result.confidence >= AI_REWRITE_MIN_CONFIDENCE
  );

  const canCreateSuggestion = Boolean(
    result?.createSuggestion && suggestedObjective && createDraftEntries.length
  );

  const displayConfidence = result?.createSuggestion?.confidence ?? result?.confidence ?? 0;

  async function handleAnalyze() {
    const trimmedText = rawText.trim();
    if (!trimmedText) {
      setError("先贴入一段 KR 文本，我才能帮你识别。");
      setSuccess("");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    setResult(null);

    try {
      const payload = await postAiJson<AiRewriteResult>({
        url: "/api/ai-kr-rewrite",
        body: {
          rawText: trimmedText,
          objectives
        } satisfies AiRewriteRequest,
        fallbackMessage: "AI 识别失败"
      });

      setResult(payload);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "AI 识别失败。");
    } finally {
      setLoading(false);
    }
  }

  function handleApply() {
    if (!result || !canApply) {
      return;
    }

    applyAiRewrite({
      rawText,
      result,
      mode: applyMode,
      patch: effectivePatch
    });
    setSuccess(applyMode === "progress_only" ? "已仅更新当前进度。" : "已按 AI 识别结果覆盖原 KR。");
    setError("");
    setResult(null);
    setRawText("");
    onApplied?.();
  }

  function handleCreateSuggestion() {
    if (!result?.createSuggestion || !suggestedObjective || !canCreateSuggestion) {
      return;
    }

    addKeyResult(
      suggestedObjective.id,
      buildKeyResultFromDraft(result.createSuggestion.draft)
    );
    setSuccess(`已新增到：${suggestedObjective.title}`);
    setError("");
    setResult(null);
    setRawText("");
    onApplied?.();
  }

  async function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const lowerName = file.name.toLowerCase();

      if (!lowerName.endsWith(".txt") && !lowerName.endsWith(".md") && !lowerName.endsWith(".docx")) {
        setError("当前只支持导入 .txt、.md 或 .docx 文件。");
        return;
      }

      const content = lowerName.endsWith(".docx")
        ? await extractTextFromDocx(file)
        : await file.text();

      setRawText(content);
      setImportedFileName(file.name);
      setShowImportedPreview(true);
      setError("");
      setSuccess(`已导入文件：${file.name}`);
    } catch (fileError) {
      setError(fileError instanceof Error ? fileError.message : "文件读取失败。");
    } finally {
      event.target.value = "";
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[1fr_0.95fr]">
        <div className="space-y-4">
          <div className="rounded-[1.5rem] bg-zinc-50/85 p-5">
            <div className="flex items-center gap-2 text-zinc-900">
              <Wand2 className="h-4 w-4" />
              <p className="text-sm font-medium">输入新的 KR 文本</p>
            </div>
            <p className="mt-2 text-sm leading-6 text-zinc-500">
              可以直接粘贴标题、目标、进度、预算、责任人等一整段内容。AI 会自动定位最接近的现有 KR。
            </p>
            <Textarea
              className={`mt-4 ${inputMinHeightClassName}`}
              placeholder="例如：KR2：抢城市，建立产品发布会到城市大会再到行业峰会的三级渗透体系……"
              value={rawText}
              onChange={(event) => setRawText(event.target.value)}
            />

            <div className="mt-4 rounded-2xl border border-dashed border-zinc-200 bg-white/70 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-zinc-900">或者导入文本文件</p>
                  <p className="mt-1 text-xs leading-5 text-zinc-500">
                    当前支持 `.txt`、`.md`、`.docx`。导入后会自动把正文内容填进上面的 AI 输入框。
                  </p>
                </div>
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FileUp className="mr-2 h-4 w-4" />
                  选择文件
                </Button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.docx,text/plain,text/markdown"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>

            {importedFileName ? (
              <div className="mt-4 rounded-2xl bg-white/80 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="inline-flex items-center gap-2 text-sm font-medium text-zinc-900">
                      <FileText className="h-4 w-4" />
                      已提取正文预览
                    </p>
                    <p className="mt-1 text-xs leading-5 text-zinc-500">
                      文件：{importedFileName}。先看一眼提取结果是否正常，再决定要不要送 AI。
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    type="button"
                    onClick={() => setShowImportedPreview((current) => !current)}
                  >
                    <ChevronDown
                      className={`mr-2 h-4 w-4 transition ${showImportedPreview ? "rotate-180" : ""}`}
                    />
                    {showImportedPreview ? "收起预览" : "展开预览"}
                  </Button>
                </div>

                {showImportedPreview ? (
                  <div className="mt-3 rounded-2xl bg-zinc-50/90 p-4">
                    <p className="whitespace-pre-line text-sm leading-6 text-zinc-700">
                      {rawText.trim() || "未提取到正文内容。"}
                    </p>
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="mt-4 space-y-3">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-400">覆盖模式</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  className={`rounded-2xl border px-4 py-3 text-left transition ${
                    applyMode === "all_fields"
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-white/70 bg-white/80 text-zinc-700"
                  }`}
                  onClick={() => setApplyMode("all_fields")}
                >
                  <p className="text-sm font-medium">更新全部识别字段</p>
                  <p className={`mt-1 text-xs leading-5 ${applyMode === "all_fields" ? "text-zinc-200" : "text-zinc-500"}`}>
                    标题、目标值、进度、预算、责任人等，凡是 AI 识别到的字段都可以覆盖。
                  </p>
                </button>
                <button
                  type="button"
                  className={`rounded-2xl border px-4 py-3 text-left transition ${
                    applyMode === "progress_only"
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-white/70 bg-white/80 text-zinc-700"
                  }`}
                  onClick={() => setApplyMode("progress_only")}
                >
                  <p className="text-sm font-medium">仅更新进度</p>
                  <p className={`mt-1 text-xs leading-5 ${applyMode === "progress_only" ? "text-zinc-200" : "text-zinc-500"}`}>
                    只覆盖“当前进度”字段，更适合日常周报、月报这类文本。
                  </p>
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button onClick={handleAnalyze} disabled={loading}>
                <Bot className="mr-2 h-4 w-4" />
                {loading ? "识别中..." : "开始识别"}
              </Button>
              <p className="text-xs text-zinc-500">默认先预览，再手动确认覆盖。低置信度时会禁止直接覆盖。</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[1.5rem] bg-zinc-50/85 p-5">
            <p className="text-sm font-medium text-zinc-900">识别结果</p>

            {error ? (
              <p className="mt-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700">{error}</p>
            ) : null}

            {success ? (
              <p className="mt-3 rounded-2xl bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-700">
                {success}
              </p>
            ) : null}

            {!result && !error && !success ? (
              <p className="mt-3 text-sm leading-6 text-zinc-500">
                这里会显示 AI 判断出的目标位置、置信度，以及准备覆盖的字段。
              </p>
            ) : null}

            {result ? (
              <div className="mt-4 space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge
                    className={
                      result.matched
                        ? "border-emerald-200/70 bg-emerald-50 text-emerald-700"
                        : result.createSuggestion
                          ? "border-sky-200/70 bg-sky-50 text-sky-700"
                          : "border-amber-200/70 bg-amber-50 text-amber-700"
                    }
                  >
                    {result.matched ? "已匹配到 KR" : result.createSuggestion ? "建议新增 KR" : "未能唯一匹配"}
                  </Badge>
                  <Badge className="border-white/70 bg-white/70 text-zinc-700">
                    置信度 {Math.round(displayConfidence * 100)}%
                  </Badge>
                  {result.matched ? (
                    <Badge className="border-white/70 bg-white/70 text-zinc-700">
                      覆盖门槛 {Math.round(AI_REWRITE_MIN_CONFIDENCE * 100)}%
                    </Badge>
                  ) : null}
                </div>

                <div className="rounded-2xl bg-white/80 p-4 text-sm leading-6 text-zinc-600">
                  {result.reason || "AI 未提供额外说明。"}
                </div>

                {isLowConfidence ? (
                  <div className="rounded-2xl border border-amber-200/70 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
                    <p className="inline-flex items-center gap-2 font-medium">
                      <ShieldAlert className="h-4 w-4" />
                      当前置信度偏低，系统已禁止直接覆盖
                    </p>
                    <p className="mt-1">
                      建议补充更完整的标题、目标值、进度或责任人后重新识别，避免误改到错误 KR。
                    </p>
                  </div>
                ) : null}

                {targetObjective && targetKr ? (
                  <div className="rounded-2xl bg-white/80 p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-zinc-400">匹配位置</p>
                    <p className="mt-2 text-sm font-medium text-zinc-900">{targetObjective.title}</p>
                    <p className="mt-1 text-sm text-zinc-600">{targetKr.title}</p>
                  </div>
                ) : null}

                {result.matched ? (
                  <>
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-zinc-900">待覆盖字段</p>
                      {patchEntries.length ? (
                        patchEntries.map(([key, value]) => (
                          <div key={String(key)} className="rounded-2xl bg-white/80 p-4">
                            <p className="text-sm font-medium text-zinc-900">{AI_REWRITE_FIELD_LABELS[key]}</p>
                            <div className="mt-3 grid gap-3">
                              <div>
                                <p className="text-xs text-zinc-400">当前内容</p>
                                <p className="mt-1 whitespace-pre-line text-sm leading-6 text-zinc-500">
                                  {formatFieldValue(targetKr?.[key], key)}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-zinc-400">AI 建议新内容</p>
                                <p className="mt-1 whitespace-pre-line text-sm leading-6 text-zinc-900">
                                  {formatFieldValue(value, key)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="rounded-2xl bg-white/80 px-4 py-3 text-sm leading-6 text-zinc-500">
                          {applyMode === "progress_only"
                            ? "当前文本里没有识别到明确的进度字段，所以这次不会改动数据。"
                            : "AI 没有识别出明确可覆盖的字段，所以这次不会改动数据。"}
                        </p>
                      )}
                    </div>

                    <Button className="w-full" disabled={!canApply} onClick={handleApply}>
                      {isLowConfidence
                        ? "置信度不足，暂不允许覆盖"
                        : applyMode === "progress_only"
                          ? "确认仅覆盖当前进度"
                          : "确认覆盖原 KR"}
                    </Button>
                  </>
                ) : result.createSuggestion && suggestedObjective ? (
                  <>
                    <div className="rounded-2xl border border-sky-200/70 bg-sky-50 px-4 py-3 text-sm leading-6 text-sky-800">
                      <p className="font-medium">没匹配到现有 KR，但可以新增为新的 KR</p>
                      <p className="mt-1">{result.createSuggestion.reason}</p>
                    </div>

                    <div className="rounded-2xl bg-white/80 p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-zinc-400">建议新增到</p>
                      <p className="mt-2 text-sm font-medium text-zinc-900">{suggestedObjective.title}</p>
                    </div>

                    <div className="space-y-3">
                      <p className="text-sm font-medium text-zinc-900">建议新增字段</p>
                      {createDraftEntries.length ? (
                        createDraftEntries.map(([key, value]) => (
                          <div key={String(key)} className="rounded-2xl bg-white/80 p-4">
                            <p className="text-sm font-medium text-zinc-900">
                              {AI_CREATE_FIELD_LABELS[key] ?? String(key)}
                            </p>
                            <p className="mt-3 whitespace-pre-line text-sm leading-6 text-zinc-700">
                              {formatCreateFieldValue(value, key)}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="rounded-2xl bg-white/80 px-4 py-3 text-sm leading-6 text-zinc-500">
                          已识别到目标 Objective，但草稿字段还不够完整，建议补充更多信息后再试。
                        </p>
                      )}
                    </div>

                    <Button className="w-full" disabled={!canCreateSuggestion} onClick={handleCreateSuggestion}>
                      <Plus className="mr-2 h-4 w-4" />
                      确认新增为 KR
                    </Button>
                  </>
                ) : (
                  <p className="rounded-2xl bg-white/80 px-4 py-3 text-sm leading-6 text-zinc-500">
                    AI 还不能确定它属于哪个 Objective。建议补充标题、目标值、责任人或所属项目后重新识别。
                  </p>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="rounded-[1.5rem] bg-zinc-50/85 p-5">
        <div className="flex items-center gap-2 text-zinc-900">
          <History className="h-4 w-4" />
          <p className="text-sm font-medium">AI 变更日志</p>
        </div>
        <p className="mt-2 text-sm leading-6 text-zinc-500">
          这里只记录 AI 覆盖过的 KR，方便你回看变更来源，并在需要时回滚到改前版本。
        </p>

        <div className="mt-4 space-y-3">
          {aiRewriteLogs.length ? (
            aiRewriteLogs.slice(0, 8).map((log) => (
              <div key={log.id} className="rounded-2xl bg-white/80 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-zinc-900">{log.objectiveTitle}</p>
                    <p className="text-sm text-zinc-600">{log.krTitle}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="border-white/70 bg-white/70 text-zinc-700">
                      {log.appliedMode === "progress_only" ? "仅更新进度" : "更新全部识别字段"}
                    </Badge>
                    <Badge className="border-white/70 bg-white/70 text-zinc-700">
                      {Math.round(log.confidence * 100)}%
                    </Badge>
                    {log.undoneAt ? (
                      <Badge className="border-amber-200/70 bg-amber-50 text-amber-700">已回滚</Badge>
                    ) : null}
                  </div>
                </div>

                <p className="mt-3 text-sm leading-6 text-zinc-500">{log.reason}</p>
                <p className="mt-2 text-xs text-zinc-400">
                  变更字段：{log.appliedFields.map((field) => AI_REWRITE_FIELD_LABELS[field]).join("、") || "未记录"}
                </p>
                <p className="mt-1 text-xs text-zinc-400">
                  时间：{formatLogTime(log.createdAt)}
                </p>
                <p className="mt-2 line-clamp-2 text-xs leading-5 text-zinc-500">
                  原始文本：{log.rawText}
                </p>

                {expandedLogId === log.id ? (
                  <div className="mt-4 grid gap-3 lg:grid-cols-2">
                    {log.appliedFields.map((field) => (
                      <div key={field} className="rounded-2xl bg-zinc-50/90 p-4">
                        <p className="text-sm font-medium text-zinc-900">{AI_REWRITE_FIELD_LABELS[field]}</p>
                        <div className="mt-3 space-y-3">
                          <div>
                            <p className="text-xs text-zinc-400">改前</p>
                            <p className="mt-1 whitespace-pre-line text-sm leading-6 text-zinc-500">
                              {formatFieldValue(log.before[field], field)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-zinc-400">改后</p>
                            <p className="mt-1 whitespace-pre-line text-sm leading-6 text-zinc-900">
                              {formatFieldValue(log.after[field], field)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}

                <div className="mt-3 flex flex-wrap justify-end gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    type="button"
                    onClick={() =>
                      setExpandedLogId((current) => (current === log.id ? null : log.id))
                    }
                  >
                    <ChevronDown
                      className={`mr-2 h-4 w-4 transition ${expandedLogId === log.id ? "rotate-180" : ""}`}
                    />
                    {expandedLogId === log.id ? "收起详情" : "查看改前改后"}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={Boolean(log.undoneAt)}
                    onClick={() => undoAiRewrite(log.id)}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    {log.undoneAt ? "已回滚" : "回滚这次改动"}
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <p className="rounded-2xl bg-white/80 px-4 py-3 text-sm leading-6 text-zinc-500">
              还没有 AI 覆盖记录。等你第一次确认覆盖后，这里会自动出现日志。
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function getEffectivePatch(
  patch: AiRewriteResult["patch"],
  mode: AiRewriteApplyMode
) {
  if (mode === "progress_only") {
    return patch.progress ? { progress: patch.progress } : {};
  }

  return patch;
}

const AI_CREATE_FIELD_LABELS: Record<string, string> = {
  title: "KR 标题",
  type: "KR 类型",
  target2026: "2026 年目标值",
  progress: "当前进度",
  budgetStr: "预算要求",
  personnel: "责任人映射",
  metricDefinition: "指标定义",
  marchProgressLabel: "进度标签",
  completion: "完成度",
  dataProvider: "数据提供方",
  interfacePerson: "接口人",
  alignedDepartments: "协同部门",
  alignedOkr: "对齐 OKR"
};

function buildKeyResultFromDraft(draft: AiKrDraftPatch) {
  return {
    title: draft.title ?? "待补充的新 KR",
    weight: 0.1,
    type: draft.type ?? "承诺型",
    target2026: draft.target2026 ?? "",
    progress: draft.progress ?? "",
    budgetStr: draft.budgetStr ?? "",
    personnel: draft.personnel ?? [],
    metricDefinition: draft.metricDefinition ?? "",
    marchProgressLabel: draft.marchProgressLabel ?? "3 月进度",
    completion: draft.completion ?? 0,
    dataProvider: emptyToUndefined(draft.dataProvider),
    interfacePerson: emptyToUndefined(draft.interfacePerson),
    alignedDepartments: emptyToUndefined(draft.alignedDepartments),
    alignedOkr: emptyToUndefined(draft.alignedOkr)
  };
}

function emptyToUndefined(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function formatFieldValue(value: unknown, key: keyof typeof AI_REWRITE_FIELD_LABELS) {
  if (key === "personnel" && Array.isArray(value)) {
    return formatPersonnelValue(value);
  }

  if (typeof value === "string") {
    return value;
  }

  return "暂无";
}

function formatCreateFieldValue(value: unknown, key: string) {
  if (key === "personnel" && Array.isArray(value)) {
    return formatPersonnelValue(value);
  }

  if (key === "completion" && typeof value === "number") {
    return `${value}%`;
  }

  if (typeof value === "string") {
    return value;
  }

  return "暂无";
}

function formatPersonnelValue(value: unknown[]) {
  return value
    .map((person) => {
      if (!person || typeof person !== "object") {
        return "";
      }

      const name = "name" in person && typeof person.name === "string" ? person.name : "";
      const role = "role" in person && typeof person.role === "string" ? person.role : "";
      return `${name} · ${role}`.trim();
    })
    .filter(Boolean)
    .join("、");
}

function formatLogTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

async function extractTextFromDocx(file: File) {
  const mammoth = await import("mammoth");
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });

  return result.value.trim();
}
