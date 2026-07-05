import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireOrgAccess } from "@/lib/authz";
import { toSubmission } from "@/lib/mappers";

/** Submissions needing review across every form in a domain pack, scoped to one caller-verified
 * organization — a domain pack (and its forms) can be shared by several orgs, so this must never
 * mix submissions across them even though they share the same form set. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const organizationId = new URL(request.url).searchParams.get("organizationId");
  if (!organizationId) return NextResponse.json({ error: "organizationId is required" }, { status: 400 });

  const access = await requireOrgAccess(organizationId);
  if (!access.ok) return NextResponse.json({ error: access.message }, { status: access.status });

  const forms = await prisma.formTemplate.findMany({ where: { domainPackId: id }, select: { id: true } });
  const formIds = forms.map((form) => form.id);

  const rows = await prisma.submission.findMany({
    where: {
      formTemplateId: { in: formIds },
      reviewStatus: { in: ["needs_fix", "needs_check"] },
      submittedBy: { memberships: { some: { organizationId, status: "active" } } },
    },
    orderBy: { updatedAt: "desc" },
    take: 12,
  });

  return NextResponse.json(rows.map(toSubmission));
}
