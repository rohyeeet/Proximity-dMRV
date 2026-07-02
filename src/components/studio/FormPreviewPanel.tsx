"use client";

import { useMemo, useState } from "react";
import type { FormFieldDefinition, FormTemplate } from "@/types";

function isFieldVisible(field: FormFieldDefinition, allFields: FormFieldDefinition[], answers: Record<string, string>): boolean {
  const controllingRules = allFields.flatMap((f) => (f.visibilityRules ?? []).map((rule) => ({ rule, controllerCode: f.fieldCode })));
  const applicable = controllingRules.filter((entry) => entry.rule.thenShowFieldCodes.includes(field.fieldCode));
  if (applicable.length === 0) return true;
  return applicable.some(({ rule, controllerCode }) => String(answers[controllerCode] ?? "") === String(rule.equals));
}

const inputClass = "w-full rounded-md border border-border-strong bg-paper px-2.5 py-1.5 text-[13.5px] text-ink";
const disabledClass = "w-full rounded-md border border-dashed border-border-strong bg-sunken px-2.5 py-1.5 text-[13.5px] text-ink-soft";

function renderInput(field: FormFieldDefinition, value: string, onChange: (v: string) => void) {
  switch (field.fieldType) {
    case "short_text":
    case "single_select":
    case "multi_select":
      return <input value={value} onChange={(e) => onChange(e.target.value)} className={inputClass} />;
    case "long_text":
      return <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} className={inputClass} />;
    case "number":
      return <input type="number" value={value} onChange={(e) => onChange(e.target.value)} className={inputClass} />;
    case "date":
      return <input type="date" value={value} onChange={(e) => onChange(e.target.value)} className={inputClass} />;
    case "datetime":
      return <input type="datetime-local" value={value} onChange={(e) => onChange(e.target.value)} className={inputClass} />;
    case "boolean":
      return (
        <select value={value} onChange={(e) => onChange(e.target.value)} className={inputClass}>
          <option value="">—</option>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      );
    case "lookup_select":
    case "linked_record":
      return <input disabled value={value || "(picked from connected records)"} className={disabledClass} />;
    case "calculated_field":
      return <input disabled value="(computed automatically)" className={disabledClass} />;
    default:
      return (
        <div className="flex h-16 items-center justify-center rounded-md border border-dashed border-border-strong bg-sunken text-[12px] text-ink-soft">
          {field.fieldType.replace(/_/g, " ")} capture
        </div>
      );
  }
}

export function FormPreviewPanel({ form }: { form: FormTemplate }) {
  const fields = form.currentVersion.fields;
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const visibleFields = useMemo(
    () =>
      fields
        .filter((field) => isFieldVisible(field, fields, answers))
        .slice()
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [fields, answers]
  );

  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <p className="mb-4 text-[12px] text-ink-soft">Live preview — try changing a field with visibility rules to see dependents show/hide.</p>
      <div className="mx-auto flex max-w-lg flex-col gap-4">
        {visibleFields.length === 0 && <p className="text-sm text-ink-soft">No fields yet.</p>}
        {visibleFields.map((field) => (
          <div key={field.id}>
            <label className="mb-1 flex items-center gap-1 text-[13px] font-medium text-ink">
              {field.label}
              {field.isRequired && <span className="text-critical-text">*</span>}
              {field.unit && <span className="text-[11.5px] font-normal text-ink-soft">({field.unit})</span>}
            </label>
            {renderInput(field, answers[field.fieldCode] ?? "", (v) => setAnswers((prev) => ({ ...prev, [field.fieldCode]: v })))}
            {field.helperText && <p className="mt-1 text-[12px] text-ink-soft">{field.helperText}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
