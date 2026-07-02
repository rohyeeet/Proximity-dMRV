"use client";

import { useState } from "react";
import { HelpCircle } from "lucide-react";
import { useKnowledge } from "./KnowledgeContext";
import { getKnowledgeTopic } from "@/data";

/** Small inline "?" affordance: hover for a one-line tip, click to open the full guide topic. */
export function InfoHint({ topicId }: { topicId: string }) {
  const { openTopic } = useKnowledge();
  const [hover, setHover] = useState(false);
  const topic = getKnowledgeTopic(topicId);
  if (!topic) return null;

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        aria-label={`Help: ${topic.title}`}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={() => openTopic(topicId)}
        className="flex size-4 items-center justify-center rounded-full text-ink-soft/70 hover:bg-sunken hover:text-brand-600"
      >
        <HelpCircle className="size-3.5" />
      </button>
      {hover && (
        <span className="pointer-events-none absolute left-1/2 top-full z-30 mt-1.5 w-56 -translate-x-1/2 rounded-md border border-border bg-ink px-2.5 py-2 text-[11.5px] leading-snug text-white shadow-lg">
          <span className="block font-medium">{topic.title}</span>
          <span className="mt-0.5 block text-white/80">{topic.summary}</span>
          <span className="mt-1 block text-[10.5px] text-white/50">Click for more</span>
        </span>
      )}
    </span>
  );
}
