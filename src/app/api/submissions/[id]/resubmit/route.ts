import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { toSubmission } from "@/lib/mappers";
import { assertLinksStillAvailable, deriveExclusiveLinkedSubmissionIds, deriveLinkedSubmissionIds, getFormTemplateVersionFields, LinkedRecordConflictError } from "@/lib/queries";
import type { EvidenceFile, SubmissionAnswer, SubmissionVersionRecord } from "@/types";

/** A submitter fixing and resending a submission a reviewer returned for correction. Only the
 * original submitter can do this, and only while it's actually in "needs_fix" — resubmitting
 * something not returned would silently reset a reviewer's decision. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const existing = await prisma.submission.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Submission not found" }, { status: 404 });

  if (existing.submittedByUserId !== session.user.id) {
    return NextResponse.json({ error: "You can only resubmit your own submissions" }, { status: 403 });
  }
  if (existing.reviewStatus !== "needs_fix") {
    return NextResponse.json({ error: "This submission hasn't been returned for correction" }, { status: 409 });
  }

  const body = await request.json();
  const answers: SubmissionAnswer[] = Array.isArray(body.answers) ? body.answers : [];
  const evidence: EvidenceFile[] = Array.isArray(body.evidence) ? body.evidence : [];
  const now = new Date();
  const nextVersionNo = existing.currentVersionNo + 1;
  const priorVersions = existing.versions as unknown as SubmissionVersionRecord[];
  const fields = (await getFormTemplateVersionFields(existing.formTemplateId, existing.formTemplateVersionNo)) ?? [];
  const linkedSubmissionIds = deriveLinkedSubmissionIds(fields, answers);
  const exclusiveLinkedIds = deriveExclusiveLinkedSubmissionIds(fields, answers);

  try {
    const updated = await prisma.$transaction(
      async (tx) => {
        await assertLinksStillAvailable(tx, exclusiveLinkedIds, id);
        return tx.submission.update({
          where: { id },
          data: {
            currentVersionNo: nextVersionNo,
            reviewStatus: "needs_check",
            updatedAt: now,
            answers: answers as object,
            evidence: evidence as object,
            linkedSubmissionIds,
            versions: [
              ...priorVersions,
              { versionNo: nextVersionNo, answers, createdAt: now.toISOString(), createdByUserId: session.user.id, reason: "Resubmitted after correction" },
            ] as object,
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );
    return NextResponse.json(toSubmission(updated));
  } catch (error) {
    if (error instanceof LinkedRecordConflictError) {
      return NextResponse.json({ error: "One of the records you selected was just linked by another submission. Please pick again." }, { status: 409 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
      return NextResponse.json({ error: "This submission conflicted with another in-flight change. Please try again." }, { status: 409 });
    }
    throw error;
  }
}
