"use client";

import { useMemo, useState } from "react";
import { SearchPicker } from "@/components/ui/SearchPicker";
import { useStudio } from "@/lib/studio";
import { getDomainPack } from "@/data";
import type { FormTemplate } from "@/types";

/**
 * Searchable picker over real FormTemplate "entities" in the app's own data —
 * used anywhere a lookup/linked field or flow node needs to point at another form.
 */
export function EntityPicker({
  value,
  onChange,
  domainPackId,
  excludeFormTemplateId,
  placeholder = "Pick a form / entity…",
}: {
  value: string | null;
  onChange: (id: string | null) => void;
  domainPackId: string;
  excludeFormTemplateId?: string;
  placeholder?: string;
}) {
  const { forms } = useStudio();
  const [scope, setScope] = useState<"pack" | "all">("pack");

  const candidates = useMemo(
    () =>
      forms.filter((form) => {
        if (form.id === excludeFormTemplateId) return false;
        if (scope === "pack" && form.domainPackId !== domainPackId) return false;
        return true;
      }),
    [forms, scope, domainPackId, excludeFormTemplateId]
  );

  const packName = getDomainPack(domainPackId)?.name ?? domainPackId;

  return (
    <div>
      <SearchPicker<FormTemplate>
        items={candidates}
        getId={(f) => f.id}
        getGroup={(f) => f.category}
        renderRow={(f) => `${f.name} · v${f.currentVersion.versionNo}`}
        filter={(f, q) => f.name.toLowerCase().includes(q) || f.code.toLowerCase().includes(q) || f.category.toLowerCase().includes(q)}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        emptyLabel="No forms match"
      />
      <button
        type="button"
        onClick={() => setScope((s) => (s === "pack" ? "all" : "pack"))}
        className="mt-1 text-left text-[11.5px] text-ink-soft underline decoration-dotted underline-offset-2 hover:text-ink"
      >
        {scope === "pack" ? `Searching ${packName} only — search all domain packs` : "Searching all domain packs — limit to this pack"}
      </button>
    </div>
  );
}
