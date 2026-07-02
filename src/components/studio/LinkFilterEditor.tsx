"use client";

import { FieldPicker } from "./FieldPicker";
import type { FormFieldDefinition, LinkFilter, LinkFilterOperator } from "@/types";

const operatorOptions: { value: LinkFilterOperator; label: string }[] = [
  { value: "equals", label: "equals" },
  { value: "not_equals", label: "does not equal" },
  { value: "contains", label: "contains" },
];

/**
 * Column + value "where clause" narrowing a lookup or linked-record link down from a whole
 * entity to specific rows, e.g. facility_type equals Gasification.
 */
export function LinkFilterEditor({
  filter,
  fields,
  onChange,
}: {
  filter: LinkFilter | undefined;
  fields: FormFieldDefinition[];
  onChange: (next: LinkFilter | undefined) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <FieldPicker
        fields={fields}
        value={filter?.fieldCode ?? null}
        onChange={(fieldCode) => onChange(fieldCode ? { fieldCode, operator: filter?.operator ?? "equals", value: filter?.value ?? "" } : undefined)}
        placeholder="No filter — link to any record"
      />
      {filter && (
        <div className="flex items-center gap-2">
          <select
            value={filter.operator}
            onChange={(e) => onChange({ ...filter, operator: e.target.value as LinkFilterOperator })}
            className="rounded-md border border-border-strong bg-paper px-2 py-1.5 text-[13px] text-ink"
          >
            {operatorOptions.map((op) => (
              <option key={op.value} value={op.value}>
                {op.label}
              </option>
            ))}
          </select>
          <input
            value={filter.value}
            onChange={(e) => onChange({ ...filter, value: e.target.value })}
            placeholder="value"
            className="w-full rounded-md border border-border-strong bg-paper px-2.5 py-1.5 text-[13px] text-ink placeholder:text-ink-soft/60"
          />
        </div>
      )}
    </div>
  );
}
