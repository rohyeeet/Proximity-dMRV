"use client";

import { Plus, Trash2 } from "lucide-react";
import { FieldPicker, MultiFieldPicker } from "./FieldPicker";
import { InfoHint } from "./knowledge/InfoHint";
import { genId } from "@/lib/utils";
import type { FieldType, FormFieldDefinition, ValidationOutcome, ValidationRule } from "@/types";

const kindOptions: ValidationRule["kind"][] = [
  "required",
  "range",
  "regex",
  "reconciliation",
  "image_quality",
  "ocr_confidence",
  "duplicate_check",
  "spatial",
];
const outcomeOptions: ValidationOutcome[] = ["pass", "warning", "hard_stop", "send_to_review"];
const outcomeLabel: Record<ValidationOutcome, string> = {
  pass: "Pass",
  warning: "Warning",
  hard_stop: "Hard stop",
  send_to_review: "Send to review",
};

export function ValidationRuleEditor({
  rules,
  fields,
  excludeFieldCode,
  ownFieldType,
  onChange,
}: {
  rules: ValidationRule[];
  fields: FormFieldDefinition[];
  excludeFieldCode: string;
  /** The field these rules belong to — used to restrict reconciliation targets to the same input type. */
  ownFieldType: FieldType;
  onChange: (rules: ValidationRule[]) => void;
}) {
  function addRule() {
    onChange([...rules, { id: genId("rule"), label: "New rule", kind: "required", outcome: "warning", detail: "" }]);
  }
  function updateRule(id: string, patch: Partial<ValidationRule>) {
    onChange(rules.map((rule) => (rule.id === id ? { ...rule, ...patch } : rule)));
  }
  function removeRule(id: string) {
    onChange(rules.filter((rule) => rule.id !== id));
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-ink-soft">
          Validation rules
          <InfoHint topicId="form-validation-rules" />
        </p>
        <button onClick={addRule} className="flex items-center gap-1 text-[12px] text-brand-600 hover:text-brand-700">
          <Plus className="size-3" /> Add rule
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {rules.length === 0 && <p className="text-[12px] text-ink-soft">No validation rules yet.</p>}
        {rules.map((rule) => (
          <div key={rule.id} className="rounded-md border border-border px-2.5 py-2.5">
            <div className="mb-2 flex items-center gap-2">
              <input
                value={rule.label}
                onChange={(e) => updateRule(rule.id, { label: e.target.value })}
                className="min-w-0 flex-1 rounded-md border border-border-strong bg-paper px-2 py-1 text-[12.5px] font-medium text-ink"
              />
              <button
                aria-label="Remove rule"
                onClick={() => removeRule(rule.id)}
                className="flex size-6 shrink-0 items-center justify-center rounded text-ink-soft hover:bg-critical-bg hover:text-critical-text"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
            <div className="mb-2 flex items-center gap-2">
              <select
                value={rule.kind}
                onChange={(e) => updateRule(rule.id, { kind: e.target.value as ValidationRule["kind"] })}
                className="rounded-md border border-border-strong bg-paper px-2 py-1 text-[12px] text-ink"
              >
                {kindOptions.map((kind) => (
                  <option key={kind} value={kind}>
                    {kind.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
              <select
                value={rule.outcome}
                onChange={(e) => updateRule(rule.id, { outcome: e.target.value as ValidationOutcome })}
                className="rounded-md border border-border-strong bg-paper px-2 py-1 text-[12px] text-ink"
              >
                {outcomeOptions.map((outcome) => (
                  <option key={outcome} value={outcome}>
                    {outcomeLabel[outcome]}
                  </option>
                ))}
              </select>
            </div>
            <textarea
              value={rule.detail}
              onChange={(e) => updateRule(rule.id, { detail: e.target.value })}
              rows={2}
              placeholder="What this rule checks and why"
              className="mb-2 w-full rounded-md border border-border-strong bg-paper px-2 py-1.5 text-[12.5px] text-ink placeholder:text-ink-soft/60"
            />

            {rule.kind === "range" && (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={rule.min ?? ""}
                  onChange={(e) => updateRule(rule.id, { min: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder="Min"
                  className="w-full rounded-md border border-border-strong bg-paper px-2 py-1 text-[12.5px] text-ink placeholder:text-ink-soft/60"
                />
                <input
                  type="number"
                  value={rule.max ?? ""}
                  onChange={(e) => updateRule(rule.id, { max: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder="Max"
                  className="w-full rounded-md border border-border-strong bg-paper px-2 py-1 text-[12.5px] text-ink placeholder:text-ink-soft/60"
                />
              </div>
            )}

            {rule.kind === "regex" && (
              <input
                value={rule.pattern ?? ""}
                onChange={(e) => updateRule(rule.id, { pattern: e.target.value })}
                placeholder="Regex pattern"
                className="w-full rounded-md border border-border-strong bg-paper px-2 py-1 text-[12.5px] text-ink placeholder:text-ink-soft/60"
              />
            )}

            {rule.kind === "reconciliation" && (
              <div className="flex flex-col gap-2">
                <FieldPicker
                  fields={fields}
                  excludeFieldCode={excludeFieldCode}
                  matchFieldType={ownFieldType}
                  value={rule.referenceFieldCode ?? null}
                  onChange={(fieldCode) => updateRule(rule.id, { referenceFieldCode: fieldCode ?? undefined })}
                  placeholder="Reconcile against…"
                />
                <input
                  type="number"
                  value={rule.tolerancePct ?? ""}
                  onChange={(e) => updateRule(rule.id, { tolerancePct: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder="Tolerance %"
                  className="w-full rounded-md border border-border-strong bg-paper px-2 py-1 text-[12.5px] text-ink placeholder:text-ink-soft/60"
                />
              </div>
            )}

            {rule.kind === "duplicate_check" && (
              <MultiFieldPicker
                fields={fields}
                excludeFieldCode={excludeFieldCode}
                values={rule.matchFieldCodes ?? []}
                onChange={(codes) => updateRule(rule.id, { matchFieldCodes: codes })}
                placeholder="Fields that must be unique together…"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
