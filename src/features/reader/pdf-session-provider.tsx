"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { PdfSession } from "@/types/book";

type PdfSessionContextValue = {
  session: PdfSession | null;
  setSession: (session: PdfSession) => void;
  clearSession: () => void;
};

const PdfSessionContext = createContext<PdfSessionContextValue | null>(null);

export function PdfSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<PdfSession | null>(null);
  const setSession = useCallback(
    (next: PdfSession) => setSessionState(next),
    [],
  );
  const clearSession = useCallback(() => setSessionState(null), []);
  const value = useMemo(
    () => ({ session, setSession, clearSession }),
    [session, setSession, clearSession],
  );

  return (
    <PdfSessionContext.Provider value={value}>
      {children}
    </PdfSessionContext.Provider>
  );
}

export function usePdfSession() {
  const context = useContext(PdfSessionContext);
  if (!context)
    throw new Error("usePdfSession must be used within PdfSessionProvider.");
  return context;
}
