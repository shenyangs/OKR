"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import { useState } from "react";
import { AiKrRewriteWorkspace } from "@/components/ai-kr-rewrite-workspace";
import { Button } from "@/components/ui/button";

type AiKrRewriteModalProps = {
  buttonLabel?: string;
};

export function AiKrRewriteModal({ buttonLabel = "AI 改写 KR" }: AiKrRewriteModalProps) {
  const [open, setOpen] = useState(false);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
  }

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <Sparkles className="mr-2 h-4 w-4" />
        {buttonLabel}
      </Button>

      <Dialog.Root open={open} onOpenChange={handleOpenChange}>
        <AnimatePresence>
          {open ? (
            <Dialog.Portal forceMount>
              <Dialog.Overlay asChild>
                <motion.div
                  className="fixed inset-0 z-40 bg-zinc-950/25 backdrop-blur-md"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                />
              </Dialog.Overlay>

              <Dialog.Content asChild forceMount>
                <motion.div
                  className="fixed left-1/2 top-1/2 z-50 w-[min(960px,calc(100vw-1.5rem))]"
                  initial={{ opacity: 0, x: "-50%", y: "calc(-50% + 20px)", scale: 0.98 }}
                  animate={{ opacity: 1, x: "-50%", y: "-50%", scale: 1 }}
                  exit={{ opacity: 0, x: "-50%", y: "calc(-50% + 14px)", scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 240, damping: 26 }}
                >
                  <div className="glass-panel-strong max-h-[88vh] overflow-y-auto p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2">
                        <p className="text-caption">AI KR Rewrite</p>
                        <Dialog.Title className="text-2xl font-semibold tracking-tight text-zinc-950">
                          AI 识别并覆盖 KR
                        </Dialog.Title>
                        <p className="max-w-3xl text-sm leading-6 text-zinc-500">
                          直接粘贴一段新的 KR 文本，系统会用 MiniMax M2.7 判断它对应哪个 O / KR，并生成待覆盖内容。只有你点击确认后，旧数据才会被更新。
                        </p>
                      </div>

                      <Dialog.Close asChild>
                        <button className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/60 bg-white/75 text-zinc-500 transition hover:bg-white hover:text-zinc-950">
                          <X className="h-4 w-4" />
                        </button>
                      </Dialog.Close>
                    </div>

                    <div className="mt-6">
                      <AiKrRewriteWorkspace onApplied={() => setOpen(false)} />
                    </div>
                  </div>
                </motion.div>
              </Dialog.Content>
            </Dialog.Portal>
          ) : null}
        </AnimatePresence>
      </Dialog.Root>
    </>
  );
}
