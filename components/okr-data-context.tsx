"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { initialObjectives, type KeyResult, type Objective, type Personnel } from "@/lib/data";
import type {
  AiRewriteApplyMode,
  AiRewriteChangeLog,
  AiRewritePatch,
  AiRewriteResult
} from "@/lib/ai-kr-rewrite";
import { createId } from "@/lib/utils";

type ObjectivePatch = Partial<Omit<Objective, "id" | "krs">>;
type KeyResultPatch = Partial<Omit<KeyResult, "id">>;

type OkrDataContextValue = {
  objectives: Objective[];
  aiRewriteLogs: AiRewriteChangeLog[];
  lastReplaceBackup: Objective[] | null;
  updateObjective: (objectiveId: string, patch: ObjectivePatch) => void;
  updateKeyResult: (objectiveId: string, krId: string, patch: KeyResultPatch) => void;
  applyAiRewrite: (payload: {
    rawText: string;
    result: AiRewriteResult;
    mode: AiRewriteApplyMode;
    patch: AiRewritePatch;
  }) => void;
  undoAiRewrite: (logId: string) => void;
  addObjective: (objective: Omit<Objective, "id">) => void;
  addKeyResult: (objectiveId: string, kr: Omit<KeyResult, "id">) => void;
  deleteKeyResult: (objectiveId: string, krId: string) => void;
  replaceObjectives: (nextObjectives: Objective[]) => void;
  restoreLastReplace: () => void;
  resetObjectives: () => void;
};

const STORAGE_KEY = "okr-workbench-objectives-v2";
const AI_REWRITE_LOG_STORAGE_KEY = "okr-workbench-ai-rewrite-logs-v1";
const LAST_REPLACE_BACKUP_STORAGE_KEY = "okr-workbench-last-replace-backup-v1";

const OkrDataContext = createContext<OkrDataContextValue | null>(null);

function cloneObjectives(objectives: Objective[]) {
  return JSON.parse(JSON.stringify(objectives)) as Objective[];
}

function normalizePersonnel(personnel: Personnel[]) {
  return personnel.filter((person) => person.name.trim()).map((person) => ({
    name: person.name.trim(),
    role: person.role
  }));
}

function buildNextKeyResult(kr: KeyResult, patch: KeyResultPatch) {
  return {
    ...kr,
    ...patch,
    personnel: patch.personnel ? normalizePersonnel(patch.personnel) : kr.personnel
  };
}

export function OkrDataProvider({ children }: { children: React.ReactNode }) {
  const [objectives, setObjectives] = useState<Objective[]>(() => cloneObjectives(initialObjectives));
  const [aiRewriteLogs, setAiRewriteLogs] = useState<AiRewriteChangeLog[]>([]);
  const [lastReplaceBackup, setLastReplaceBackup] = useState<Objective[] | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setObjectives(JSON.parse(saved) as Objective[]);
    }

    const savedLogs = window.localStorage.getItem(AI_REWRITE_LOG_STORAGE_KEY);
    if (savedLogs) {
      setAiRewriteLogs(JSON.parse(savedLogs) as AiRewriteChangeLog[]);
    }

    const savedBackup = window.localStorage.getItem(LAST_REPLACE_BACKUP_STORAGE_KEY);
    if (savedBackup) {
      setLastReplaceBackup(JSON.parse(savedBackup) as Objective[]);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(objectives));
  }, [objectives]);

  useEffect(() => {
    window.localStorage.setItem(AI_REWRITE_LOG_STORAGE_KEY, JSON.stringify(aiRewriteLogs));
  }, [aiRewriteLogs]);

  useEffect(() => {
    if (lastReplaceBackup) {
      window.localStorage.setItem(LAST_REPLACE_BACKUP_STORAGE_KEY, JSON.stringify(lastReplaceBackup));
      return;
    }

    window.localStorage.removeItem(LAST_REPLACE_BACKUP_STORAGE_KEY);
  }, [lastReplaceBackup]);

  function updateObjective(objectiveId: string, patch: ObjectivePatch) {
    setObjectives((current) =>
      current.map((objective) =>
        objective.id === objectiveId
          ? {
              ...objective,
              ...patch
            }
          : objective
      )
    );
  }

  function updateKeyResult(objectiveId: string, krId: string, patch: KeyResultPatch) {
    setObjectives((current) =>
      current.map((objective) =>
        objective.id === objectiveId
          ? {
              ...objective,
              krs: objective.krs.map((kr) => (kr.id === krId ? buildNextKeyResult(kr, patch) : kr))
            }
          : objective
      )
    );
  }

  function applyAiRewrite({
    rawText,
    result,
    mode,
    patch
  }: {
    rawText: string;
    result: AiRewriteResult;
    mode: AiRewriteApplyMode;
    patch: AiRewritePatch;
  }) {
    const nextLogId = createId("ai-log");

    setObjectives((current) => {
      let nextLog: AiRewriteChangeLog | null = null;

      const nextObjectives = current.map((objective) => {
        if (objective.id !== result.objectiveId) {
          return objective;
        }

        return {
          ...objective,
          krs: objective.krs.map((kr) => {
            if (kr.id !== result.krId) {
              return kr;
            }

            const nextKr = buildNextKeyResult(kr, patch);
            nextLog = {
              id: nextLogId,
              objectiveId: objective.id,
              objectiveTitle: objective.title,
              krId: kr.id,
              krTitle: kr.title,
              appliedMode: mode,
              confidence: result.confidence,
              reason: result.reason,
              rawText,
              appliedFields: Object.keys(patch) as Array<keyof AiRewritePatch>,
              createdAt: new Date().toISOString(),
              before: cloneKeyResult(kr),
              after: cloneKeyResult(nextKr)
            };
            return nextKr;
          })
        };
      });

      if (nextLog) {
        setAiRewriteLogs((currentLogs) => [nextLog as AiRewriteChangeLog, ...currentLogs].slice(0, 30));
      }

      return nextObjectives;
    });
  }

  function undoAiRewrite(logId: string) {
    const targetLog = aiRewriteLogs.find((log) => log.id === logId);

    if (!targetLog || targetLog.undoneAt) {
      return;
    }

    setObjectives((current) =>
      current.map((objective) =>
        objective.id === targetLog.objectiveId
          ? {
              ...objective,
              krs: objective.krs.map((kr) => (kr.id === targetLog.krId ? cloneKeyResult(targetLog.before) : kr))
            }
          : objective
      )
    );

    setAiRewriteLogs((currentLogs) =>
      currentLogs.map((log) =>
        log.id === logId
          ? {
              ...log,
              undoneAt: new Date().toISOString()
            }
          : log
      )
    );
  }

  function addObjective(objective: Omit<Objective, "id">) {
    setObjectives((current) => [
      ...current,
      {
        ...objective,
        id: createId("o")
      }
    ]);
  }

  function addKeyResult(objectiveId: string, kr: Omit<KeyResult, "id">) {
    setObjectives((current) =>
      current.map((objective) =>
        objective.id === objectiveId
          ? {
              ...objective,
              krs: [
                ...objective.krs,
                {
                  ...kr,
                  id: createId("kr"),
                  personnel: normalizePersonnel(kr.personnel)
                }
              ]
            }
          : objective
      )
    );
  }

  function deleteKeyResult(objectiveId: string, krId: string) {
    setObjectives((current) =>
      current.map((objective) =>
        objective.id === objectiveId
          ? {
              ...objective,
              krs: objective.krs.filter((kr) => kr.id !== krId)
            }
          : objective
      )
    );
  }

  function replaceObjectives(nextObjectives: Objective[]) {
    setObjectives((current) => {
      setLastReplaceBackup(cloneObjectives(current));
      return cloneObjectives(nextObjectives);
    });
  }

  function restoreLastReplace() {
    if (!lastReplaceBackup) {
      return;
    }

    setObjectives(cloneObjectives(lastReplaceBackup));
    setLastReplaceBackup(null);
  }

  function resetObjectives() {
    setObjectives(cloneObjectives(initialObjectives));
    setAiRewriteLogs([]);
    setLastReplaceBackup(null);
  }

  const value = useMemo(
    () => ({
      objectives,
      aiRewriteLogs,
      lastReplaceBackup,
      updateObjective,
      updateKeyResult,
      applyAiRewrite,
      undoAiRewrite,
      addObjective,
      addKeyResult,
      deleteKeyResult,
      replaceObjectives,
      restoreLastReplace,
      resetObjectives
    }),
    [aiRewriteLogs, lastReplaceBackup, objectives]
  );

  return <OkrDataContext.Provider value={value}>{children}</OkrDataContext.Provider>;
}

export function useOkrData() {
  const context = useContext(OkrDataContext);

  if (!context) {
    throw new Error("useOkrData 必须在 OkrDataProvider 内部使用");
  }

  return context;
}

function cloneKeyResult(kr: KeyResult) {
  return JSON.parse(JSON.stringify(kr)) as KeyResult;
}
