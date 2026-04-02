"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { personnelRoster } from "@/lib/data";

type IdentityContextValue = {
  currentPerson: string;
  setCurrentPerson: (person: string) => void;
  personnelList: string[];
};

const STORAGE_KEY = "okr-workbench-current-person";

const IdentityContext = createContext<IdentityContextValue | null>(null);

export function IdentityProvider({ children }: { children: React.ReactNode }) {
  const [currentPerson, setCurrentPerson] = useState(personnelRoster[1] ?? personnelRoster[0] ?? "");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved && personnelRoster.includes(saved)) {
      setCurrentPerson(saved);
    }
  }, []);

  useEffect(() => {
    if (currentPerson) {
      window.localStorage.setItem(STORAGE_KEY, currentPerson);
    }
  }, [currentPerson]);

  return (
    <IdentityContext.Provider
      value={{
        currentPerson,
        setCurrentPerson,
        personnelList: personnelRoster
      }}
    >
      {children}
    </IdentityContext.Provider>
  );
}

export function useIdentity() {
  const context = useContext(IdentityContext);

  if (!context) {
    throw new Error("useIdentity 必须在 IdentityProvider 内部使用");
  }

  return context;
}
