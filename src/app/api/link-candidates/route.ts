import { NextResponse } from "next/server";
import { requireOrgAccess } from "@/lib/authz";
import { getLinkCandidates } from "@/lib/queries";
import type { LinkFilter } from "@/types";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const formTemplateId = url.searchParams.get("formTemplateId");
  const organizationId = url.searchParams.get("organizationId");
  if (!formTemplateId || !organizationId) {
    return NextResponse.json({ error: "formTemplateId and organizationId are required" }, { status: 400 });
  }

  const access = await requireOrgAccess(organizationId);
  if (!access.ok) return NextResponse.json({ error: access.message }, { status: access.status });

  const filterFieldCode = url.searchParams.get("filterFieldCode");
  const filterOperator = url.searchParams.get("filterOperator") as LinkFilter["operator"] | null;
  const filterValue = url.searchParams.get("filterValue");
  const filter: LinkFilter | undefined =
    filterFieldCode && filterOperator && filterValue !== null ? { fieldCode: filterFieldCode, operator: filterOperator, value: filterValue } : undefined;

  const candidates = await getLinkCandidates({
    formTemplateId,
    organizationId,
    filter,
    excludeClaimed: url.searchParams.get("excludeClaimed") === "true",
  });

  return NextResponse.json(candidates);
}
