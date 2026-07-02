"use client";

import { Plus, Trash2 } from "lucide-react";
import { MultiFieldPicker } from "./FieldPicker";
import { InfoHint } from "./knowledge/InfoHint";
import { genId } from "@/lib/utils";
import type { FormFieldDefinition, VisibilityRule } from "@/types";

export function VisibilityRuleEditor({
  field,
  fields,
  onChange,
}: {
  field: FormFieldDefinition;
  fields: FormFieldDefinition[];
  onChange: (rules: VisibilityRule[]) => void;
}) {
  const rules = field.visibilityRules ?? [];

  function addRule() {
    onChange([...rules, { id: genId("vis"), whenFieldCode: field.fieldCode, equals: "", thenShowFieldCodes: [] }]);
  }
  function updateRule(id: string, patch: Partial<VisibilityRule>) {
    onChange(rules.map((rule) => (rule.id === id ? { ...rule, ...patch } : rule)));
  }
  function removeRule(id: string) {
    onChange(rules.filter((rule) => rule.id !== id));
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-ink-soft">
          Visibility rules
          <InfoHint topicId="form-visibility-rules" />
        </p>
        <button onClick={addRule} className="flex items-center gap-1 text-[12px] text-brand-600 hover:text-brand-700">
          <Plus className="size-3" /> Add rule
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {rules.length === 0 && <p className="text-[12px] text-ink-soft">This field doesn&apos;t control any conditional fields.</p>}
        {rules.map((rule) => (
          <div key={rule.id} className="rounded-md border border-border px-2.5 py-2.5">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-[12px] text-ink-soft">
                When <span className="font-medium text-ink">{field.label}</span> equals…
              </p>
              <button
                aria-label="Remove rule"
                onClick={() => removeRule(rule.id)}
                className="flex size-6 shrink-0 items-center justify-center rounded text-ink-soft hover:bg-critical-bg hover:text-critical-text"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
            <input
              value={String(rule.equals)}
              onChange={(e) => updateRule(rule.id, { equals: e.target.value })}
              placeholder="Value to match"
              className="mb-2 w-full rounded-md border border-border-strong bg-paper px-2 py-1 text-[12.5px] text-ink placeholder:text-ink-soft/60"
            />
            <p className="mb-1 text-[11.5px] text-ink-soft">Then show:</p>
            <MultiFieldPicker
              fields={fields}
              excludeFieldCode={field.fieldCode}
              values={rule.thenShowFieldCodes}
              onChange={(codes) => updateRule(rule.id, { thenShowFieldCodes: codes })}
              placeholder="Fields to reveal…"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
