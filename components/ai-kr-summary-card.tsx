"use client";

import { useState } from "react";
import { CheckCheck, Copy, FileText, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { postAiJson } from "@/lib/ai-client";
import { buildFallbackSummary } from "@/lib/ai-fallbacks";
import type { KeyResult, Objective } from "@/lib/data";
import type { AiKrSummaryResult, AiSummaryMode } from "@/lib/ai-okr";

export function AiKrSummaryCard({
  objective,
  kr
}: {
  objective: Objective;
  kr: KeyResult;
}) {
  const [loadingMode, setLoadingMode] = useState<AiSummaryMode | "">("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<AiKrSummaryResult | null>(null);
  const [fallbackResult, setFallbackResult] = useState<AiKrSummaryResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [resultSource, setResultSource] = useState<"基础版" | "AI 优化版" | "">("");

  async function handleGenerate(mode: AiSummaryMode) {
    const fallback = buildFallbackSummary(mode, objective, kr);
    setFallbackResult(fallback);
    setResult(fallback);
    setResultSource("基础版");
    setLoadingMode(mode);
    setError("");

    try {
      const payload = await postAiJson<AiKrSummaryResult>({
        url: "/api/ai-kr-summary",
        body: {
          mode,
          objective,
          kr
        },
        fallbackMessage: "AI 生成摘要失败"
      });

      setResult(payload);
      setResultSource("AI 优化版");
    } catch (requestError) {
      setError(
        requestError instanceof Error ? `${requestError.message}，当前先显示基础版。` : "AI 生成摘要失败，当前先显示基础版。"
      );
    } finally {
      setLoadingMode("");
    }
  }

  async function handleCopy() {
    if (!result || typeof navigator === "undefined" || !navigator.clipboard) {
      return;
    }

    await navigator.clipboard.writeText(formatSummaryForCopy(result));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="rounded-[1.75rem] bg-zinc-50/85 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <p className="text-caption">AI Weekly Helper</p>
          <h3 className="text-lg font-semibold tracking-tight text-zinc-950">AI 周报 / 复盘助手</h3>
          <p className="max-w-xl text-sm leading-6 text-zinc-500">
            直接基于当前 KR 的目标、进度、完成度和责任信息，生成一版可直接拿去同步的总结。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => handleGenerate("周报")} disabled={Boolean(loadingMode)}>
            <Sparkles className="mr-2 h-4 w-4" />
            {loadingMode === "周报" ? "生成中..." : "生成周报"}
          </Button>
          <Button variant="secondary" onClick={() => handleGenerate("复盘")} disabled={Boolean(loadingMode)}>
            <RotateCcw className="mr-2 h-4 w-4" />
            {loadingMode === "复盘" ? "生成中..." : "生成复盘"}
          </Button>
          {result ? (
            <Button variant="ghost" onClick={handleCopy}>
              {copied ? <CheckCheck className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
              {copied ? "已复制" : "复制内容"}
            </Button>
          ) : null}
        </div>
      </div>

      {result ? (
        <p className="mt-4 text-xs leading-6 text-zinc-400">
          当前显示：{resultSource || "基础版"}
          {loadingMode ? "，AI 还在继续优化中..." : resultSource === "AI 优化版" ? "，已完成替换。" : ""}
        </p>
      ) : null}

      {error ? (
        <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700">{error}</p>
      ) : null}

      {!result && !error ? (
        <div className="mt-4 rounded-2xl bg-white/80 px-4 py-4 text-sm leading-6 text-zinc-500">
          你可以随时生成周报版或复盘版。AI 不会自动改数据，只会先给你一版可参考的文字。
        </div>
      ) : null}

      {result ? (
        <div className="mt-4 space-y-4">
          {fallbackResult && resultSource === "AI 优化版" ? (
            <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/80 p-4">
              <p className="text-sm font-medium text-emerald-800">AI 优化差异</p>
              <div className="mt-3 space-y-3">
                {buildSummaryDiffs(fallbackResult, result).map((item) => (
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
            <div className="flex items-center gap-2 text-zinc-900">
              <FileText className="h-4 w-4" />
              <p className="text-sm font-medium">{result.title}</p>
            </div>
            <p className="mt-3 text-sm leading-7 text-zinc-600">{result.summary}</p>
          </div>

          <div className="rounded-2xl bg-white/80 p-4">
            <p className="text-sm font-medium text-zinc-900">风险与卡点</p>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-600">
              {result.risks.length ? (
                result.risks.map((item) => <li key={item}>• {item}</li>)
              ) : (
                <li>• 当前没有明显新增风险。</li>
              )}
            </ul>
          </div>

          <div className="rounded-2xl bg-white/80 p-4">
            <p className="text-sm font-medium text-zinc-900">下一步建议</p>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-600">
              {result.nextActions.length ? (
                result.nextActions.map((item) => <li key={item}>• {item}</li>)
              ) : (
                <li>• 当前没有额外建议动作。</li>
              )}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function formatSummaryForCopy(result: AiKrSummaryResult) {
  return [
    result.title,
    "",
    result.summary,
    "",
    "风险与卡点：",
    ...(result.risks.length ? result.risks.map((item) => `- ${item}`) : ["- 当前没有明显新增风险。"]),
    "",
    "下一步建议：",
    ...(result.nextActions.length
      ? result.nextActions.map((item) => `- ${item}`)
      : ["- 当前没有额外建议动作。"])
  ].join("\n");
}

function buildSummaryDiffs(before: AiKrSummaryResult, after: AiKrSummaryResult) {
  const diffs: Array<{ label: string; before: string; after: string }> = [];

  if (before.title !== after.title) {
    diffs.push({
      label: "标题",
      before: before.title,
      after: after.title
    });
  }

  if (before.summary !== after.summary) {
    diffs.push({
      label: "摘要",
      before: before.summary,
      after: after.summary
    });
  }

  const beforeRisks = before.risks.join("；") || "无";
  const afterRisks = after.risks.join("；") || "无";
  if (beforeRisks !== afterRisks) {
    diffs.push({
      label: "风险与卡点",
      before: beforeRisks,
      after: afterRisks
    });
  }

  const beforeActions = before.nextActions.join("；") || "无";
  const afterActions = after.nextActions.join("；") || "无";
  if (beforeActions !== afterActions) {
    diffs.push({
      label: "下一步建议",
      before: beforeActions,
      after: afterActions
    });
  }

  return diffs;
}
