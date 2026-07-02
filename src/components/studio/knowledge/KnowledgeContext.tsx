"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { KnowledgeScope } from "@/data";

interface KnowledgeContextValue {
  isOpen: boolean;
  activeTopicId: string | null;
  scope: KnowledgeScope;
  openTopic: (id: string) => void;
  openList: () => void;
  close: () => void;
}

const KnowledgeContext = createContext<KnowledgeContextValue | null>(null);

/** Scopes the in-context help/guide drawer to "flow" or "form" topics (plus shared general ones). */
export function KnowledgeProvider({ scope, children }: { scope: KnowledgeScope; children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null);

  const value = useMemo<KnowledgeContextValue>(
    () => ({
      isOpen,
      activeTopicId,
      scope,
      openTopic: (id: string) => {
        setActiveTopicId(id);
        setIsOpen(true);
      },
      openList: () => {
        setActiveTopicId(null);
        setIsOpen(true);
      },
      close: () => setIsOpen(false),
    }),
    [isOpen, activeTopicId, scope]
  );

  return <KnowledgeContext.Provider value={value}>{children}</KnowledgeContext.Provider>;
}

export function useKnowledge(): KnowledgeContextValue {
  const context = useContext(KnowledgeContext);
  if (!context) {
    throw new Error("useKnowledge must be used within a KnowledgeProvider");
  }
  return context;
}
