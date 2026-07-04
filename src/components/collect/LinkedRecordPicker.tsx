"use client";

import { useEffect, useState } from "react";
import { SearchPicker } from "@/components/ui/SearchPicker";
import { useSession } from "@/lib/session";
import type { LinkFilter } from "@/types";

interface Candidate {
  id: string;
  displayId: string;
  summary: string;
}

/** The runtime half of a linked_record / internal-form lookup_select field — a real, searchable
 * picker over actual prior submissions of the source form, scoped to the current org and honoring
 * whatever value filter / exclusivity the Studio designer configured. */
export function LinkedRecordPicker({
  sourceFormTemplateId,
  filter,
  excludeClaimed,
  value,
  onChange,
}: {
  sourceFormTemplateId?: string;
  filter?: LinkFilter;
  excludeClaimed?: boolean;
  value: string;
  onChange: (v: string) => void;
}) {
  const { session } = useSession();
  const [candidates, setCandidates] = useState<Candidate[] | null>(null);

  useEffect(() => {
    if (!sourceFormTemplateId) {
      setCandidates([]);
      return;
    }
    const params = new URLSearchParams({ formTemplateId: sourceFormTemplateId, organizationId: session.organization.id });
    if (excludeClaimed) params.set("excludeClaimed", "true");
    if (filter) {
      params.set("filterFieldCode", filter.fieldCode);
      params.set("filterOperator", filter.operator);
      params.set("filterValue", filter.value);
    }
    fetch(`/api/link-candidates?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => setCandidates(Array.isArray(data) ? data : []))
      .catch((error) => {
        console.error("Failed to load link candidates", error);
        setCandidates([]);
      });
  }, [sourceFormTemplateId, filter, excludeClaimed, session.organization.id]);

  if (!sourceFormTemplateId) {
    return (
      <p className="rounded-md border border-dashed border-border-strong bg-sunken px-2.5 py-2 text-[12.5px] text-ink-soft">
        Not configured yet — pick which form this links to in the Form Builder.
      </p>
    );
  }

  if (candidates === null) {
    return <p className="px-2.5 py-1.5 text-[12.5px] text-ink-soft">Loading records…</p>;
  }

  return (
    <SearchPicker<Candidate>
      items={candidates}
      getId={(c) => c.id}
      renderRow={(c) => (
        <span>
          <span className="font-medium">{c.displayId}</span>
          {c.summary && <span className="text-ink-soft"> · {c.summary}</span>}
        </span>
      )}
      filter={(c, q) => c.displayId.toLowerCase().includes(q) || c.summary.toLowerCase().includes(q)}
      value={value || null}
      onChange={(id) => onChange(id ?? "")}
      placeholder="Search prior records…"
      emptyLabel={excludeClaimed ? "No eligible records — everything's already linked elsewhere" : "No records to link yet"}
    />
  );
}
