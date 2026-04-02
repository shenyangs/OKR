"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { Save, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { Objective } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ObjectiveEditModalProps = {
  open: boolean;
  objective: Objective | null;
  mode: "create" | "edit";
  onOpenChange: (open: boolean) => void;
  onSave: (payload: Omit<Objective, "id" | "krs">) => void;
};

type ObjectiveFormState = {
  title: string;
  weight: string;
  owner: string;
  department: string;
  docLink: string;
};

const emptyForm: ObjectiveFormState = {
  title: "",
  weight: "0.1",
  owner: "",
  department: "品牌管理组",
  docLink: ""
};

export function ObjectiveEditModal({
  open,
  objective,
  mode,
  onOpenChange,
  onSave
}: ObjectiveEditModalProps) {
  const [form, setForm] = useState<ObjectiveFormState>(emptyForm);

  useEffect(() => {
    if (mode === "edit" && objective) {
      setForm({
        title: objective.title,
        weight: String(objective.weight),
        owner: objective.owner,
        department: objective.department,
        docLink: objective.docLink ?? ""
      });
    } else if (mode === "create") {
      setForm(emptyForm);
    }
  }, [mode, objective, open]);

  function handleSubmit() {
    onSave({
      title: form.title.trim(),
      weight: Number(form.weight) || 0,
      owner: form.owner.trim(),
      department: form.department.trim(),
      docLink: form.docLink.trim() || undefined
    });
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
                className="fixed left-1/2 top-1/2 z-50 w-[min(680px,calc(100vw-2rem))]"
                initial={{ opacity: 0, x: "-50%", y: "calc(-50% + 20px)", scale: 0.98 }}
                animate={{ opacity: 1, x: "-50%", y: "-50%", scale: 1 }}
                exit={{ opacity: 0, x: "-50%", y: "calc(-50% + 16px)", scale: 0.98 }}
                transition={{ type: "spring", stiffness: 260, damping: 26 }}
              >
                <div className="glass-panel-strong p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <p className="text-caption">{mode === "create" ? "Create Objective" : "Edit Objective"}</p>
                      <Dialog.Title className="text-2xl font-semibold tracking-tight text-zinc-950">
                        {mode === "create" ? "新增 O" : "编辑 O"}
                      </Dialog.Title>
                      <p className="text-sm text-zinc-500">
                        {mode === "create"
                          ? "先创建 Objective 头部信息，创建后就可以继续往里面新增 KR。"
                          : "这里改的是 Objective 头部信息，保存后首页会立即刷新。"}
                      </p>
                    </div>
                    <Dialog.Close asChild>
                      <button className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/60 bg-white/75 text-zinc-500 transition hover:bg-white hover:text-zinc-950">
                        <X className="h-4 w-4" />
                      </button>
                    </Dialog.Close>
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                      <label className="text-sm font-medium text-zinc-700">O 标题</label>
                      <Input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-700">O 权重</label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="1"
                        value={form.weight}
                        onChange={(event) => setForm((current) => ({ ...current, weight: event.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-700">负责人</label>
                      <Input value={form.owner} onChange={(event) => setForm((current) => ({ ...current, owner: event.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-700">部门名称</label>
                      <Input
                        value={form.department}
                        onChange={(event) => setForm((current) => ({ ...current, department: event.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-700">补充文档链接</label>
                      <Input
                        placeholder="可选"
                        value={form.docLink}
                        onChange={(event) => setForm((current) => ({ ...current, docLink: event.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <Button onClick={handleSubmit}>
                      <Save className="mr-2 h-4 w-4" />
                      {mode === "create" ? "创建 O" : "保存 O"}
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
