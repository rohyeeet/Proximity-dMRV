"use client";

import { cn } from "@/lib/utils";

export interface TabOption {
  value: string;
  label: string;
  count?: number;
}

export function Tabs({
  options,
  value,
  onChange,
}: {
  options: TabOption[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div role="tablist" className="inline-flex items-center gap-1 rounded-lg border border-border bg-sunken p-1">
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors",
              isActive ? "bg-surface text-ink shadow-sm" : "text-ink-soft hover:text-ink"
            )}
          >
            {option.label}
            {option.count !== undefined && (
              <span className={cn("tabular rounded-full px-1.5 text-[11px]", isActive ? "bg-sunken" : "bg-surface")}>
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
