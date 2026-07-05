import { prisma } from "@/lib/db";
import type { AnalyticsCard, AnalyticsSeries, ReviewActionRecord, SubmissionVersionRecord } from "@/types";

/**
 * Every number here is computed from this organization's real Submission/Device rows — nothing
 * hardcoded, nothing keyed by a literal org id. An org with no activity yet gets an empty list
 * (rendered as an empty state), never a fabricated percentage.
 */
async function orgSubmissions(organizationId: string) {
  return prisma.submission.findMany({
    where: { isTest: false, submittedBy: { memberships: { some: { organizationId, status: "active" } } } },
    orderBy: { updatedAt: "desc" },
    take: 2000,
  });
}

function submittedAt(versions: unknown): number {
  const list = versions as SubmissionVersionRecord[];
  const first = list.find((v) => v.versionNo === 1) ?? list[0];
  return first ? new Date(first.createdAt).getTime() : Date.now();
}

export async function getAnalyticsCards(organizationId: string): Promise<AnalyticsCard[]> {
  const [submissions, devices] = await Promise.all([
    orgSubmissions(organizationId),
    prisma.device.findMany({ where: { connector: { organizationId } }, select: { coveragePct: true } }),
  ]);

  const cards: AnalyticsCard[] = [];
  const decided = submissions.filter((s) => s.reviewStatus !== "draft");

  if (decided.length > 0) {
    const approved = decided.filter((s) => s.reviewStatus === "approved").length;
    cards.push({ key: "approval_rate", label: "Submissions approved", value: `${Math.round((approved / decided.length) * 100)}%`, tone: "good" });
  }

  const needsFix = submissions.filter((s) => s.reviewStatus === "needs_fix").length;
  if (submissions.length > 0) {
    cards.push({ key: "returned_submissions", label: "Returned submissions", value: String(needsFix), tone: needsFix > 0 ? "warn" : "neutral" });
  }

  const onHold = submissions.filter((s) => s.reviewStatus === "on_hold").length;
  if (onHold > 0) cards.push({ key: "blocked_steps", label: "Blocked steps", value: String(onHold), tone: "critical" });

  const turnaroundsMs: number[] = [];
  for (const row of submissions) {
    const reviewActions = row.reviewActions as unknown as ReviewActionRecord[];
    const versions = row.versions as unknown as SubmissionVersionRecord[];
    for (const action of reviewActions) {
      if (action.outcome !== "returned_for_correction") continue;
      const returnedAt = new Date(action.createdAt).getTime();
      const resubmission = versions.find((v) => new Date(v.createdAt).getTime() > returnedAt);
      if (resubmission) turnaroundsMs.push(new Date(resubmission.createdAt).getTime() - returnedAt);
    }
  }
  if (turnaroundsMs.length > 0) {
    const avgHours = turnaroundsMs.reduce((a, b) => a + b, 0) / turnaroundsMs.length / (1000 * 60 * 60);
    cards.push({
      key: "correction_turnaround",
      label: "Avg. correction turnaround",
      value: avgHours < 24 ? `${avgHours.toFixed(1)} hrs` : `${(avgHours / 24).toFixed(1)} days`,
      tone: "neutral",
    });
  }

  if (submissions.length > 0) {
    const withEvidence = submissions.filter((s) => Array.isArray(s.evidence) && (s.evidence as unknown[]).length > 0).length;
    cards.push({
      key: "evidence_attached",
      label: "Submissions with evidence",
      value: `${Math.round((withEvidence / submissions.length) * 100)}%`,
      tone: "neutral",
    });
  }

  if (devices.length > 0) {
    const avgCoverage = devices.reduce((sum, d) => sum + d.coveragePct, 0) / devices.length;
    cards.push({ key: "device_coverage", label: "Device coverage (avg.)", value: `${avgCoverage.toFixed(1)}%`, tone: avgCoverage >= 90 ? "good" : "warn" });
  }

  return cards;
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const WEEKS = 6;

function weekLabel(startMs: number): string {
  return new Date(startMs).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export async function getAnalyticsSeries(organizationId: string): Promise<AnalyticsSeries[]> {
  const submissions = await orgSubmissions(organizationId);
  if (submissions.length === 0) return [];

  const now = Date.now();
  const buckets = Array.from({ length: WEEKS }, (_, i) => {
    const end = now - (WEEKS - 1 - i) * WEEK_MS;
    const start = end - WEEK_MS;
    return { start, end, label: weekLabel(start) };
  });

  const submissionCounts = buckets.map((bucket) => ({
    period: bucket.label,
    value: submissions.filter((s) => {
      const ts = submittedAt(s.versions);
      return ts >= bucket.start && ts < bucket.end;
    }).length,
  }));

  const correctionRates = buckets.map((bucket) => {
    let returned = 0;
    let total = 0;
    for (const row of submissions) {
      for (const action of row.reviewActions as unknown as ReviewActionRecord[]) {
        const ts = new Date(action.createdAt).getTime();
        if (ts < bucket.start || ts >= bucket.end) continue;
        total += 1;
        if (action.outcome === "returned_for_correction") returned += 1;
      }
    }
    return { period: bucket.label, value: total > 0 ? Math.round((returned / total) * 100) : 0 };
  });

  return [
    { key: "submissions_per_week", label: "Submissions per week", points: submissionCounts },
    { key: "correction_rate", label: "Correction rate (%)", unit: "%", points: correctionRates },
  ];
}
