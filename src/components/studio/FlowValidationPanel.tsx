"use client";

import { DataTable } from "@/components/ui/DataTable";
import { StatusChip } from "@/components/ui/StatusChip";
import type { FlowIssue } from "@/lib/graph-utils";

export function FlowValidationPanel({
  errors,
  warnings,
  onSelectIssue,
}: {
  errors: FlowIssue[];
  warnings: FlowIssue[];
  onSelectIssue: (issue: FlowIssue) => void;
}) {
  const issues = [...errors, ...warnings];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <StatusChip label={`${errors.length} error${errors.length === 1 ? "" : "s"}`} tone={errors.length > 0 ? "critical" : "good"} />
        <StatusChip label={`${warnings.length} warning${warnings.length === 1 ? "" : "s"}`} tone={warnings.length > 0 ? "warn" : "good"} />
      </div>
      <DataTable<FlowIssue>
        columns={[
          {
            key: "severity",
            header: "",
            render: (issue) => <StatusChip label={issue.severity === "error" ? "Error" : "Warning"} tone={issue.severity === "error" ? "critical" : "warn"} />,
          },
          { key: "message", header: "Issue", render: (issue) => <span className="text-ink">{issue.message}</span> },
        ]}
        rows={issues}
        rowKey={(issue) => issue.id}
        onRowClick={onSelectIssue}
        emptyLabel="No issues — graph looks clean."
      />
    </div>
  );
}
