"use client";

import { MultiSearchPicker, SearchPicker } from "@/components/ui/SearchPicker";
import type { FieldType, FormFieldDefinition } from "@/types";

function byTypeAndExclude(fields: FormFieldDefinition[], excludeFieldCode?: string, matchFieldType?: FieldType) {
  return fields.filter((field) => field.fieldCode !== excludeFieldCode && (!matchFieldType || field.fieldType === matchFieldType));
}

/** Single-field picker scoped to a caller-supplied field list (this form, a target form, an upstream node's form). */
export function FieldPicker({
  fields,
  value,
  onChange,
  excludeFieldCode,
  matchFieldType,
  placeholder = "Pick a field…",
}: {
  fields: FormFieldDefinition[];
  value: string | null;
  onChange: (fieldCode: string | null) => void;
  excludeFieldCode?: string;
  /** Restrict candidates to a single input type, e.g. only "number" fields when reconciling two numbers. */
  matchFieldType?: FieldType;
  placeholder?: string;
}) {
  const candidates = byTypeAndExclude(fields, excludeFieldCode, matchFieldType);
  return (
    <SearchPicker<FormFieldDefinition>
      items={candidates}
      getId={(field) => field.fieldCode}
      renderRow={(field) => `${field.label} (${field.fieldCode})`}
      filter={(field, q) => field.label.toLowerCase().includes(q) || field.fieldCode.toLowerCase().includes(q)}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      emptyLabel="No fields available"
    />
  );
}

/** Multi-field picker for rules that reference several fields at once (visibility targets, duplicate-check match sets). */
export function MultiFieldPicker({
  fields,
  values,
  onChange,
  excludeFieldCode,
  placeholder = "Pick fields…",
}: {
  fields: FormFieldDefinition[];
  values: string[];
  onChange: (fieldCodes: string[]) => void;
  excludeFieldCode?: string;
  placeholder?: string;
}) {
  const candidates = fields.filter((field) => field.fieldCode !== excludeFieldCode);
  return (
    <MultiSearchPicker<FormFieldDefinition>
      items={candidates}
      getId={(field) => field.fieldCode}
      renderRow={(field) => field.label}
      filter={(field, q) => field.label.toLowerCase().includes(q) || field.fieldCode.toLowerCase().includes(q)}
      values={values}
      onChange={onChange}
      placeholder={placeholder}
      emptyLabel="No fields available"
    />
  );
}
