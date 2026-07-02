"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronsUpDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface GroupedItems<T> {
  label: string | null;
  items: T[];
}

function useGroupedFilter<T>(items: T[], query: string, filter: (item: T, query: string) => boolean, getGroup?: (item: T) => string) {
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? items.filter((item) => filter(item, q)) : items;
  }, [items, query, filter]);

  return useMemo<GroupedItems<T>[]>(() => {
    if (!getGroup) return [{ label: null, items: filtered }];
    const map = new Map<string, T[]>();
    for (const item of filtered) {
      const groupLabel = getGroup(item);
      map.set(groupLabel, [...(map.get(groupLabel) ?? []), item]);
    }
    return [...map.entries()].map(([label, groupItems]) => ({ label, items: groupItems }));
  }, [filtered, getGroup]);
}

function useCloseOnOutside(open: boolean, containerRef: React.RefObject<HTMLDivElement | null>, close: () => void) {
  useEffect(() => {
    if (!open) return;
    function onDocMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) close();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, containerRef, close]);
}

export interface SearchPickerProps<T> {
  items: T[];
  getId: (item: T) => string;
  renderRow: (item: T) => React.ReactNode;
  getGroup?: (item: T) => string;
  filter: (item: T, query: string) => boolean;
  value: string | null;
  onChange: (id: string | null) => void;
  placeholder?: string;
  emptyLabel?: string;
  clearable?: boolean;
}

/** Anchored, dependency-free searchable single-select combobox. */
export function SearchPicker<T>({
  items,
  getId,
  renderRow,
  getGroup,
  filter,
  value,
  onChange,
  placeholder = "Search…",
  emptyLabel = "No matches",
  clearable = true,
}: SearchPickerProps<T>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = useMemo(() => items.find((item) => getId(item) === value) ?? null, [items, getId, value]);
  const groups = useGroupedFilter(items, query, filter, getGroup);
  const flat = useMemo(() => groups.flatMap((g) => g.items), [groups]);

  useCloseOnOutside(open, containerRef, () => setOpen(false));

  function openPicker() {
    setOpen(true);
    setQuery("");
    setHighlight(0);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function choose(item: T) {
    onChange(getId(item));
    setOpen(false);
  }

  function onInputKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, flat.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = flat[highlight];
      if (item) choose(item);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={openPicker}
        className="flex w-full items-center justify-between gap-2 rounded-md border border-border-strong bg-paper px-2.5 py-1.5 text-left text-[13.5px] text-ink hover:border-brand-500/50"
      >
        <span className={cn("truncate", !selected && "text-ink-soft/70")}>{selected ? renderRow(selected) : placeholder}</span>
        <span className="flex shrink-0 items-center gap-1">
          {clearable && selected && (
            <span
              role="button"
              aria-label="Clear selection"
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
              }}
              className="text-ink-soft hover:text-critical-text"
            >
              <X className="size-3.5" />
            </span>
          )}
          <ChevronsUpDown className="size-3.5 text-ink-soft" />
        </span>
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-full rounded-md border border-brand-500/60 bg-paper shadow-md">
          <div className="flex items-center gap-1.5 border-b border-border px-2.5 py-1.5">
            <Search className="size-3.5 shrink-0 text-ink-soft" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setHighlight(0);
              }}
              onKeyDown={onInputKeyDown}
              placeholder={placeholder}
              className="w-full bg-transparent text-[13.5px] text-ink outline-none placeholder:text-ink-soft/60"
            />
          </div>
          <div className="max-h-56 overflow-y-auto py-1" role="listbox">
            {flat.length === 0 && <p className="px-2.5 py-2 text-[12.5px] text-ink-soft">{emptyLabel}</p>}
            {groups.map((group, gi) => (
              <div key={group.label ?? gi}>
                {group.label && (
                  <p className="px-2.5 pb-0.5 pt-1.5 text-[10.5px] font-medium uppercase tracking-wide text-ink-soft/70">{group.label}</p>
                )}
                {group.items.map((item) => {
                  const id = getId(item);
                  const idx = flat.indexOf(item);
                  return (
                    <button
                      key={id}
                      type="button"
                      role="option"
                      aria-selected={id === value}
                      onMouseEnter={() => setHighlight(idx)}
                      onClick={() => choose(item)}
                      className={cn(
                        "block w-full truncate px-2.5 py-1.5 text-left text-[13px]",
                        idx === highlight ? "bg-sunken text-ink" : "text-ink-soft hover:bg-sunken hover:text-ink",
                        id === value && "font-medium text-ink"
                      )}
                    >
                      {renderRow(item)}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export interface MultiSearchPickerProps<T> {
  items: T[];
  getId: (item: T) => string;
  renderRow: (item: T) => React.ReactNode;
  getGroup?: (item: T) => string;
  filter: (item: T, query: string) => boolean;
  values: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
  emptyLabel?: string;
}

/** Anchored, dependency-free searchable multi-select combobox with removable chips. */
export function MultiSearchPicker<T>({
  items,
  getId,
  renderRow,
  getGroup,
  filter,
  values,
  onChange,
  placeholder = "Select…",
  emptyLabel = "No matches",
}: MultiSearchPickerProps<T>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedItems = useMemo(() => items.filter((item) => values.includes(getId(item))), [items, getId, values]);
  const groups = useGroupedFilter(items, query, filter, getGroup);

  useCloseOnOutside(open, containerRef, () => setOpen(false));

  function toggle(id: string) {
    onChange(values.includes(id) ? values.filter((v) => v !== id) : [...values, id]);
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          requestAnimationFrame(() => inputRef.current?.focus());
        }}
        className="flex min-h-[34px] w-full flex-wrap items-center gap-1 rounded-md border border-border-strong bg-paper px-2 py-1 text-left hover:border-brand-500/50"
      >
        {selectedItems.length === 0 && <span className="px-0.5 text-[13.5px] text-ink-soft/70">{placeholder}</span>}
        {selectedItems.map((item) => {
          const id = getId(item);
          return (
            <span key={id} className="inline-flex items-center gap-1 rounded-full bg-sunken px-2 py-0.5 text-[12px] text-ink">
              {renderRow(item)}
              <span
                role="button"
                aria-label="Remove"
                onClick={(e) => {
                  e.stopPropagation();
                  toggle(id);
                }}
                className="text-ink-soft hover:text-critical-text"
              >
                <X className="size-3" />
              </span>
            </span>
          );
        })}
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-full rounded-md border border-brand-500/60 bg-paper shadow-md">
          <div className="flex items-center gap-1.5 border-b border-border px-2.5 py-1.5">
            <Search className="size-3.5 shrink-0 text-ink-soft" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              className="w-full bg-transparent text-[13.5px] text-ink outline-none placeholder:text-ink-soft/60"
            />
          </div>
          <div className="max-h-56 overflow-y-auto py-1" role="listbox">
            {groups.every((g) => g.items.length === 0) && <p className="px-2.5 py-2 text-[12.5px] text-ink-soft">{emptyLabel}</p>}
            {groups.map((group, gi) => (
              <div key={group.label ?? gi}>
                {group.label && (
                  <p className="px-2.5 pb-0.5 pt-1.5 text-[10.5px] font-medium uppercase tracking-wide text-ink-soft/70">{group.label}</p>
                )}
                {group.items.map((item) => {
                  const id = getId(item);
                  const isSelected = values.includes(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => toggle(id)}
                      className={cn(
                        "flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-[13px]",
                        isSelected ? "text-ink" : "text-ink-soft hover:bg-sunken hover:text-ink"
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-3.5 shrink-0 items-center justify-center rounded-sm border",
                          isSelected ? "border-brand-500 bg-brand-500 text-white" : "border-border-strong"
                        )}
                      >
                        {isSelected && <Check className="size-2.5" />}
                      </span>
                      <span className="truncate">{renderRow(item)}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
