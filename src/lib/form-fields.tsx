"use client";

import type { FormFieldDefinition } from "@/types";

/** Shared between the Form Builder's Preview panel and the field Collect app so both render
 * exactly the same field behavior (visibility rules, input types) — one engine, two surfaces. */
export function isFieldVisible(field: FormFieldDefinition, allFields: FormFieldDefinition[], answers: Record<string, string>): boolean {
  const controllingRules = allFields.flatMap((f) => (f.visibilityRules ?? []).map((rule) => ({ rule, controllerCode: f.fieldCode })));
  const applicable = controllingRules.filter((entry) => entry.rule.thenShowFieldCodes.includes(field.fieldCode));
  if (applicable.length === 0) return true;
  return applicable.some(({ rule, controllerCode }) => String(answers[controllerCode] ?? "") === String(rule.equals));
}

export const fieldInputClass = "w-full rounded-md border border-border-strong bg-paper px-2.5 py-1.5 text-[13.5px] text-ink";
export const fieldDisabledClass = "w-full rounded-md border border-dashed border-border-strong bg-sunken px-2.5 py-1.5 text-[13.5px] text-ink-soft";

export function renderFieldInput(field: FormFieldDefinition, value: string, onChange: (v: string) => void) {
  switch (field.fieldType) {
    case "short_text":
    case "single_select":
    case "multi_select":
      return <input value={value} onChange={(e) => onChange(e.target.value)} className={fieldInputClass} />;
    case "long_text":
      return <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} className={fieldInputClass} />;
    case "number":
      return <input type="number" value={value} onChange={(e) => onChange(e.target.value)} className={fieldInputClass} />;
    case "date":
      return <input type="date" value={value} onChange={(e) => onChange(e.target.value)} className={fieldInputClass} />;
    case "datetime":
      return <input type="datetime-local" value={value} onChange={(e) => onChange(e.target.value)} className={fieldInputClass} />;
    case "boolean":
      return (
        <select value={value} onChange={(e) => onChange(e.target.value)} className={fieldInputClass}>
          <option value="">—</option>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      );
    case "lookup_select":
    case "linked_record":
      return <input disabled value={value || "(picked from connected records)"} className={fieldDisabledClass} />;
    case "calculated_field":
      return <input disabled value="(computed automatically)" className={fieldDisabledClass} />;
    default:
      return (
        <div className="flex h-16 items-center justify-center rounded-md border border-dashed border-border-strong bg-sunken text-[12px] text-ink-soft">
          {field.fieldType.replace(/_/g, " ")} — not yet supported for capture
        </div>
      );
  }
}

/** Label + input + helper text, the one field row both surfaces render identically. */
export function FieldRow({ field, value, onChange }: { field: FormFieldDefinition; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="mb-1 flex items-center gap-1 text-[13px] font-medium text-ink">
        {field.label}
        {field.isRequired && <span className="text-critical-text">*</span>}
        {field.unit && <span className="text-[11.5px] font-normal text-ink-soft">({field.unit})</span>}
      </label>
      {renderFieldInput(field, value, onChange)}
      {field.helperText && <p className="mt-1 text-[12px] text-ink-soft">{field.helperText}</p>}
    </div>
  );
}
