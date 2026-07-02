"use client";

import { useEffect, useRef, useState } from "react";
import { Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Read-only text by default; a persistent pencil icon (shown only when `canEdit`) switches it
 * into an inline input. Keeps editable content from looking indistinguishable from static text —
 * only the pencil signals "this can change," not a hover border on everything.
 */
export function EditableText({
  value,
  onChange,
  canEdit,
  as = "span",
  textClassName,
  wrapperClassName = "inline-flex min-w-0 items-center gap-1.5",
  placeholder = "Untitled",
  multiline = false,
}: {
  value: string;
  onChange: (value: string) => void;
  canEdit: boolean;
  as?: "h1" | "span" | "p";
  textClassName?: string;
  wrapperClassName?: string;
  placeholder?: string;
  multiline?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!editing) return;
    (multiline ? textareaRef.current : inputRef.current)?.focus();
  }, [editing, multiline]);

  function commit() {
    onChange(draft);
    setEditing(false);
  }

  function cancel() {
    setDraft(value);
    setEditing(false);
  }

  if (editing) {
    const sharedProps = {
      value: draft,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft(e.target.value),
      onBlur: commit,
      placeholder,
      className: cn(textClassName, "w-full rounded-md border border-brand-500 bg-paper px-1.5 py-0.5 outline-none"),
    };
    return multiline ? (
      <textarea
        ref={textareaRef}
        {...sharedProps}
        rows={2}
        onKeyDown={(e) => {
          if (e.key === "Escape") cancel();
        }}
      />
    ) : (
      <input
        ref={inputRef}
        {...sharedProps}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") cancel();
        }}
      />
    );
  }

  const Tag = as;
  return (
    <span className={wrapperClassName}>
      <Tag className={cn(textClassName, "min-w-0 truncate", !value && "text-ink-soft/60")}>{value || placeholder}</Tag>
      {canEdit && (
        <button
          type="button"
          aria-label="Edit"
          onClick={() => {
            setDraft(value);
            setEditing(true);
          }}
          className="flex size-5 shrink-0 items-center justify-center rounded text-ink-soft/50 hover:bg-sunken hover:text-ink"
        >
          <Pencil className="size-3" />
        </button>
      )}
    </span>
  );
}
