"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { ReviewStatusChip, StatusChip } from "@/components/ui/StatusChip";
import { cn, formatRelativeTime } from "@/lib/utils";
import { useStudio } from "@/lib/studio";
import { useSession } from "@/lib/session";
import type { Stage, Submission } from "@/types";

const filters: { value: string; label: string }[] = [
  { value: "all", label: "All" },
  { value: "needs_check", label: "Pending" },
  { value: "needs_fix", label: "Needs correction" },
  { value: "approved", label: "Approved" },
];

/** First version's timestamp is the true submit date — updatedAt drifts with every review action or resubmit. */
function submittedAt(submission: Submission): string {
  return submission.versions.find((v) => v.versionNo === 1)?.createdAt ?? submission.versions[0]?.createdAt ?? submission.updatedAt;
}

/** Most recent review decision, if any — distinct from "last edited" (updatedAt). */
function lastReviewedAt(submission: Submission): string | null {
  return submission.reviewActions.at(-1)?.createdAt ?? null;
}

export default function CollectSubmissionsPage() {
  const { getForm, stages } = useStudio();
  const { session } = useSession();
  const searchParams = useSearchParams();
  const [submissions, setSubmissions] = useState<Submission[] | null>(null);
  const [status, setStatus] = useState(searchParams.get("status") ?? "all");

  useEffect(() => {
    fetch("/api/submissions/mine")
      .then((res) => res.json())
      .then((data) => setSubmissions(Array.isArray(data) ? data : []))
      .catch((error) => console.error("Failed to load submissions", error));
  }, []);

  const orgStages = useMemo(
    () => stages.filter((stage) => stage.domainPackId === session.organization.domainPackId),
    [stages, session.organization.domainPackId]
  );

  const stageByFormId = useMemo(() => {
    const map = new Map<string, Stage>();
    for (const stage of orgStages) {
      for (const formId of stage.formTemplateIds) map.set(formId, stage);
    }
    return map;
  }, [orgStages]);

  const groups = useMemo(() => {
    const all = submissions ?? [];
    const byStageId = new Map<string, Submission[]>();
    const unassigned: Submission[] = [];
    for (const submission of all) {
      const stage = stageByFormId.get(submission.formTemplateId);
      if (!stage) {
        unassigned.push(submission);
        continue;
      }
      const list = byStageId.get(stage.id) ?? [];
      list.push(submission);
      byStageId.set(stage.id, list);
    }
    const stageGroups: { stage: Stage | null; all: Submission[] }[] = orgStages
      .map((stage) => ({ stage, all: byStageId.get(stage.id) ?? [] }))
      .filter((group) => group.all.length > 0);
    if (unassigned.length > 0) stageGroups.push({ stage: null, all: unassigned });
    return stageGroups;
  }, [submissions, orgStages, stageByFormId]);

  const visibleGroups = groups
    .map((group) => ({ ...group, filtered: group.all.filter((s) => status === "all" || s.reviewStatus === status) }))
    .filter((group) => group.filtered.length > 0);

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
      {submissions !== null && visibleGroups.length === 0 && (
        <p className="rounded-lg border border-dashed border-border-strong bg-surface p-4 text-center text-[13px] text-ink-soft">
          No submissions here yet.
        </p>
      )}

      <div className="flex flex-col gap-5">
        {visibleGroups.map((group, index) => {
          const needsCheck = group.all.filter((s) => s.reviewStatus === "needs_check").length;
          const needsFix = group.all.filter((s) => s.reviewStatus === "needs_fix").length;
          return (
            <div key={group.stage?.id ?? "unassigned"} className="flex flex-col gap-2">
              <div className="flex items-center gap-2 px-0.5">
                {group.stage && (
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-sunken text-[11px] font-medium text-ink-soft">
                    {index + 1}
                  </span>
                )}
                <p className="text-[13px] font-semibold text-ink">{group.stage?.name ?? "Other forms"}</p>
                <span className="text-[11.5px] text-ink-soft">
                  {group.all.length} submission{group.all.length === 1 ? "" : "s"}
                </span>
                <div className="ml-auto flex items-center gap-1.5">
                  {needsCheck > 0 && <StatusChip label={`${needsCheck} pending`} tone="accent" />}
                  {needsFix > 0 && <StatusChip label={`${needsFix} needs fix`} tone="critical" />}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {group.filtered.map((submission) => {
                  const form = getForm(submission.formTemplateId);
                  const reviewedAt = lastReviewedAt(submission);
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
                          {form?.name ?? submission.formTemplateId}
                          {form ? ` · Form ID ${form.code}` : ""}
                        </p>
                        <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11.5px] text-ink-soft">
                          <span>
                            Record <span className="font-medium text-ink">{submission.displayId}</span>
                          </span>
                          <span>Submitted {formatRelativeTime(submittedAt(submission))}</span>
                          <span className="col-span-2">
                            {reviewedAt ? `Reviewed ${formatRelativeTime(reviewedAt)}` : "Awaiting review"}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="size-4 shrink-0 text-ink-soft/60" />
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
