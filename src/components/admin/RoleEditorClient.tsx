"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StatusChip } from "@/components/ui/StatusChip";
import type { Role } from "@/types";

const tierLabel: Record<string, string> = {
  platform: "Platform — Super Admin",
  org_admin: "Organization — Org Admin",
  org_sub_admin: "Organization — Org Sub-Admin",
  designer: "Resource — Designer",
  submitter: "Resource — Submitter",
  reviewer: "Resource — Reviewer",
  viewer: "Resource — Viewer",
};

function EditableList({
  title,
  tone,
  items,
  onChange,
}: {
  title: string;
  tone: "good" | "accent" | "critical";
  items: string[];
  onChange: (items: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  function add() {
    if (!draft.trim()) return;
    onChange([...items, draft.trim()]);
    setDraft("");
  }

  return (
    <div>
      <p className="mb-2 text-[12px] font-medium uppercase tracking-wide text-ink-soft">{title}</p>
      <div className="mb-2 flex flex-wrap gap-1.5">
        {items.length === 0 && <span className="text-[13px] text-ink-soft">None</span>}
        {items.map((item, index) => (
          <span key={`${item}-${index}`} className="inline-flex items-center gap-1 rounded-full bg-sunken px-2.5 py-0.5 text-[12px] text-ink">
            {item}
            <button aria-label={`Remove ${item}`} onClick={() => onChange(items.filter((_, i) => i !== index))} className="text-ink-soft hover:text-critical-text">
              <X className="size-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Add an item and press Enter"
          className="w-full rounded-md border border-border-strong bg-paper px-2.5 py-1.5 text-[13px] placeholder:text-ink-soft/60"
        />
        <Button size="sm" variant="secondary" onClick={add}>
          Add
        </Button>
      </div>
      <StatusChip label={tone === "critical" ? "restricted" : tone === "good" ? "action" : "visibility"} tone={tone} />
    </div>
  );
}

export function RoleEditorClient({ role }: { role: Role }) {
  const [canView, setCanView] = useState(role.canView);
  const [canAct, setCanAct] = useState(role.canAct);
  const [cannot, setCannot] = useState(role.cannot);
  const [saved, setSaved] = useState(true);

  function markDirty<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value);
      setSaved(false);
    };
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-ink">{role.name}</h1>
            <StatusChip label={tierLabel[role.tier] ?? role.tier} tone="accent" />
          </div>
          <p className="mt-1 text-sm text-ink-soft">{role.description}</p>
        </div>
        <Button variant="primary" onClick={() => setSaved(true)}>
          {saved ? "Saved" : "Save role"}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 rounded-lg border border-border bg-surface p-5 md:grid-cols-3">
        <EditableList title="Can view" tone="accent" items={canView} onChange={markDirty(setCanView)} />
        <EditableList title="Can act" tone="good" items={canAct} onChange={markDirty(setCanAct)} />
        <EditableList title="Cannot" tone="critical" items={cannot} onChange={markDirty(setCannot)} />
      </div>
    </div>
  );
}
