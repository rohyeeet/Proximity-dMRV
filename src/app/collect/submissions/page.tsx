"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { ReviewStatusChip } from "@/components/ui/StatusChip";
import { cn, formatRelativeTime } from "@/lib/utils";
import { useStudio } from "@/lib/studio";
import type { Submission } from "@/types";

const filters: { value: string; label: string }[] = [
  { value: "all", label: "All" },
  { value: "needs_check", label: "Pending" },
  { value: "needs_fix", label: "Needs correction" },
  { value: "approved", label: "Approved" },
];

export default function CollectSubmissionsPage() {
  const { getForm } = useStudio();
  const searchParams = useSearchParams();
  const [submissions, setSubmissions] = useState<Submission[] | null>(null);
  const [status, setStatus] = useState(searchParams.get("status") ?? "all");

  useEffect(() => {
    fetch("/api/submissions/mine")
      .then((res) => res.json())
      .then((data) => setSubmissions(Array.isArray(data) ? data : []))
      .catch((error) => console.error("Failed to load submissions", error));
  }, []);

  const filtered = (submissions ?? []).filter((s) => status === "all" || s.reviewStatus === status);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold text-ink">My submissions</h1>

      <div className="flex gap-1.5 overflow-x-auto">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatus(f.value)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-[12.5px] font-medium",
              status === f.value ? "border-brand-500 bg-brand-50 text-brand-700" : "border-border-strong bg-surface text-ink-soft"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {submissions === null && <p className="text-[13px] text-ink-soft">Loading…</p>}
      {submissions !== null && filtered.length === 0 && (
        <p className="rounded-lg border border-dashed border-border-strong bg-surface p-4 text-center text-[13px] text-ink-soft">
          No submissions here yet.
        </p>
      )}

      <div className="flex flex-col gap-2">
        {filtered.map((submission) => {
          const form = getForm(submission.formTemplateId);
          return (
            <Link
              key={submission.id}
              href={`/collect/submissions/${submission.id}`}
              className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3.5 active:bg-sunken"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-[14px] font-medium text-ink">{submission.flowNodeLabel}</p>
                  <ReviewStatusChip status={submission.reviewStatus} />
                </div>
                <p className="truncate text-[12px] text-ink-soft">
                  {form?.name ?? submission.formTemplateId} · {submission.displayId} · {formatRelativeTime(submission.updatedAt)}
                </p>
              </div>
              <ChevronRight className="size-4 shrink-0 text-ink-soft/60" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
