"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CheckCheck, ChevronDown, Copy, Radar, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { postAiJson } from "@/lib/ai-client";
import { buildFallbackRiskRadar } from "@/lib/ai-fallbacks";
import type { Objective } from "@/lib/data";
import { buildRiskRadar, countHighRiskItems } from "@/lib/risk-radar";
import type { AiRiskRadarResult } from "@/lib/ai-okr";

export function AiRiskRadar({ objectives }: { objectives: Objective[] }) {
  const riskItems = useMemo(() => buildRiskRadar(objectives), [objectives]);
  const topRiskItems = riskItems.slice(0, 5);
  const highRiskCount = countHighRiskItems(riskItems);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AiRiskRadarResult | null>(null);
  const [fallbackResult, setFallbackResult] = useState<AiRiskRadarResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [collapsed, setCollapsed] = useState(true);
  const [resultSource, setResultSource] = useState<"基础版" | "AI 优化版" | "">("");

  async function handleAnalyze() {
    if (!topRiskItems.length) {
      return;
    }

    const fallback = buildFallbackRiskRadar(topRiskItems);
    setFallbackResult(fallback);
    setResult(fallback);
    setResultSource("基础版");
    setLoading(true);
    setError("");

    try {
      const payload = await postAiJson<AiRiskRadarResult>({
        url: "/api/ai-risk-radar",
        body: {
          riskItems: topRiskItems
        },
        fallbackMessage: "AI 风险扫描失败"
      });

      setResult(payload);
      setResultSource("AI 优化版");
    } catch (requestError) {
      setError(
        requestError instanceof Error ? `${requestError.message}，当前先显示基础版。` : "AI 风险扫描失败，当前先显示基础版。"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!result || typeof navigator === "undefined" || !navigator.clipboard) {
      return;
    }

    await navigator.clipboard.writeText(formatRiskRadarForCopy(result));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <section className="mx-auto mt-4 max-w-[1520px] px-4 sm:px-6 lg:px-10">
      <div className="glass-panel flex flex-col gap-5 px-5 py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-caption">AI Risk Radar</p>
              <button
                className="inline-flex items-center gap-2 rounded-full bg-zinc-100/80 px-3 py-1.5 text-sm text-zinc-500 transition hover:bg-zinc-200/80 hover:text-zinc-900"
                onClick={() => setCollapsed((current) => !current)}
              >
                <span>{collapsed ? "展开" : "收起"}</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-300 ${collapsed ? "" : "rotate-180"}`}
                />
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-2xl font-semibold tracking-tight text-zinc-950">风险雷达</h3>
              <span className="rounded-full border border-amber-200/80 bg-amber-50 px-3 py-1 text-sm text-amber-700">
                高风险 {highRiskCount} 项
              </span>
            </div>
            <p className="max-w-3xl text-sm leading-6 text-zinc-500">
              先用规则快速筛出最需要盯的 KR，再让 AI 生成一版管理视角的重点和动作建议。
            </p>
            {result ? (
              <p className="text-xs leading-6 text-zinc-400">
                当前显示：{resultSource || "基础版"}
                {loading ? "，AI 还在继续优化中..." : resultSource === "AI 优化版" ? "，已完成替换。" : ""}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            {!collapsed ? (
              <Button onClick={handleAnalyze} disabled={loading || !topRiskItems.length}>
                <Sparkles className="mr-2 h-4 w-4" />
                {loading ? "分析中..." : "AI 生成管理简报"}
              </Button>
            ) : null}
            {!collapsed && result ? (
              <Button variant="ghost" onClick={handleCopy}>
                {copied ? <CheckCheck className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                {copied ? "已复制" : "复制简报"}
              </Button>
            ) : null}
          </div>
        </div>

        <AnimatePresence initial={false}>
          {!collapsed ? (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -8 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -8 }}
              transition={{ type: "spring", stiffness: 220, damping: 24 }}
              className="overflow-hidden"
            >
              <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                <div className="grid gap-3">
                  {topRiskItems.map((item) => (
                    <div key={item.krId} className="rounded-[1.5rem] bg-zinc-50/85 p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={
                            item.level === "高"
                              ? "rounded-full border border-rose-200/80 bg-rose-50 px-3 py-1 text-xs text-rose-700"
                              : item.level === "中"
                                ? "rounded-full border border-amber-200/80 bg-amber-50 px-3 py-1 text-xs text-amber-700"
                                : "rounded-full border border-emerald-200/80 bg-emerald-50 px-3 py-1 text-xs text-emerald-700"
                          }
                        >
                          {item.level}风险 · {item.score} 分
                        </span>
                        <span className="text-xs text-zinc-400">完成度 {item.completion}%</span>
                      </div>
                      <p className="mt-3 text-sm text-zinc-500">{item.objectiveTitle}</p>
                      <p className="mt-1 text-base font-medium text-zinc-950">{item.krTitle}</p>
                      <p className="mt-2 text-sm leading-6 text-zinc-600">
                        责任人：{item.owners.join("、") || "暂未明确"}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {item.reasons.map((reason) => (
                          <span
                            key={`${item.krId}-${reason}`}
                            className="rounded-full bg-white px-3 py-1 text-xs text-zinc-600"
                          >
                            {reason}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-[1.75rem] bg-zinc-50/85 p-5">
                  <div className="flex items-center gap-2 text-zinc-900">
                    <Radar className="h-4 w-4" />
                    <p className="text-sm font-medium">AI 管理简报</p>
                  </div>

                  {error ? (
                    <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700">{error}</p>
                  ) : null}

                  {!result && !error ? (
                    <div className="mt-4 rounded-2xl bg-white/80 px-4 py-4 text-sm leading-6 text-zinc-500">
                      点击右上角按钮后，这里会给出整体判断、本周最该盯的重点，以及建议动作。
                    </div>
                  ) : null}

                  {result ? (
                    <div className="mt-4 space-y-4">
                      {fallbackResult && resultSource === "AI 优化版" ? (
                        <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/80 p-4">
                          <p className="text-sm font-medium text-emerald-800">AI 优化差异</p>
                          <div className="mt-3 space-y-3">
                            {buildRiskRadarDiffs(fallbackResult, result).map((item) => (
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
                          <AlertTriangle className="h-4 w-4" />
                          <p className="text-sm font-medium">总体判断</p>
                        </div>
                        <p className="mt-3 text-sm leading-7 text-zinc-600">{result.overview}</p>
                      </div>

                      <div className="rounded-2xl bg-white/80 p-4">
                        <p className="text-sm font-medium text-zinc-900">本周重点</p>
                        <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-600">
                          {result.focus.length ? (
                            result.focus.map((item) => <li key={item}>• {item}</li>)
                          ) : (
                            <li>• 当前暂无额外重点。</li>
                          )}
                        </ul>
                      </div>

                      <div className="rounded-2xl bg-white/80 p-4">
                        <p className="text-sm font-medium text-zinc-900">建议动作</p>
                        <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-600">
                          {result.actions.length ? (
                            result.actions.map((item) => <li key={item}>• {item}</li>)
                          ) : (
                            <li>• 当前暂无额外动作建议。</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </section>
  );
}

function formatRiskRadarForCopy(result: AiRiskRadarResult) {
  return [
    "AI 风险雷达简报",
    "",
    `总体判断：${result.overview}`,
    "",
    "本周重点：",
    ...(result.focus.length ? result.focus.map((item) => `- ${item}`) : ["- 当前暂无额外重点。"]),
    "",
    "建议动作：",
    ...(result.actions.length ? result.actions.map((item) => `- ${item}`) : ["- 当前暂无额外动作建议。"])
  ].join("\n");
}

function buildRiskRadarDiffs(before: AiRiskRadarResult, after: AiRiskRadarResult) {
  const diffs: Array<{ label: string; before: string; after: string }> = [];

  if (before.overview !== after.overview) {
    diffs.push({
      label: "总体判断",
      before: before.overview,
      after: after.overview
    });
  }

  const beforeFocus = before.focus.join("；") || "无";
  const afterFocus = after.focus.join("；") || "无";
  if (beforeFocus !== afterFocus) {
    diffs.push({
      label: "本周重点",
      before: beforeFocus,
      after: afterFocus
    });
  }

  const beforeActions = before.actions.join("；") || "无";
  const afterActions = after.actions.join("；") || "无";
  if (beforeActions !== afterActions) {
    diffs.push({
      label: "建议动作",
      before: beforeActions,
      after: afterActions
    });
  }

  return diffs;
}
